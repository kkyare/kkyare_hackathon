// 채점 과정 재생(/live)용 데이터. 입력(scenario, fieldId, t0) -> 출력만 있는 순수 함수이며 fixtures/만 읽는다.
// node:fs를 쓰므로 서버 전용. 클라이언트는 /api/live 로 JSON을 받는다.
import * as fs from 'node:fs'
import * as path from 'node:path'
import type { Answer, HourlyPoint, Score, Task } from '../../core/types'
import { SCENARIOS, loadFields, loadForecastRuns, loadObservation, type ScenarioId } from '../../core/weather'
import { answerSchema, buildScenarioSnapshot, nowcasting } from './index'
import { DEFAULT_RULES, evaluateHour, evaluateWindow, type ReasonCode, type SprayStatus } from './rules'

export type ReplayScenario = ScenarioId
export const REPLAY_SCENARIOS = SCENARIOS

export function isReplayScenario(s: string): s is ReplayScenario {
  return (SCENARIOS as readonly string[]).includes(s)
}

/** 시나리오별 기본 t0. fixtures/nowcasting/<scenario>/meta.json 의 expected.windows 와 맞춘다. */
export const DEFAULT_T0: Record<ReplayScenario, string> = {
  'gust-block': '2026-06-10T16:00:00Z',
  'calm-go': '2026-06-10T15:00:00Z',
  'forecast-miss': '2026-06-10T15:00:00Z',
}

export interface ReplayFrame {
  time: string
  windMph: number | null
  gustMph: number | null
  precipIn: number | null
  status: SprayStatus
  reasons: ReasonCode[]
}

export interface ReplayModelSummary {
  model: string
  issuedAt: string
  windowMaxGust: number | null
  windowMaxWind: number | null
  violation: boolean
}

export interface Replay {
  demo: true
  scenario: ReplayScenario
  task: Task
  snapshotSummary: { snapshotId: string; models: ReplayModelSummary[] }
  answer: Answer
  /** 관측 1시간 프레임, [t0, t0+4h). 재생 UI가 한 칸씩 드러낸다. */
  frames: ReplayFrame[]
  /** 관측 창 전체 판정 (채점의 y 와 이유 코드). */
  verdict: { violation: boolean; status: SprayStatus; reasons: ReasonCode[] }
  score: Score
  assumptions: { costUsdPerAcre: number; lossUsdPerAcre: number }
}

const HOUR_MS = 3_600_000

function readFixtureJson(...parts: string[]): unknown {
  const p = path.join(process.cwd(), 'fixtures', ...parts)
  if (!fs.existsSync(p)) throw new Error(`fixture not found: ${p}`)
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

export function loadSavedAnswer(scenario: ReplayScenario, taskId: string): Answer {
  const raw = readFixtureJson('nowcasting', scenario, 'answer.json') as { demo?: unknown; model?: unknown }
  if (raw.demo !== true) throw new Error(`fixtures/nowcasting/${scenario}/answer.json: top-level demo !== true`)
  const parsed = answerSchema.parse(raw)
  return {
    taskId,
    model: typeof raw.model === 'string' ? raw.model : 'saved',
    probability: parsed.probability,
    decision: parsed.decision,
    rationale: parsed.rationale,
    toolCalls: [],
  }
}

function windowOf(hourly: HourlyPoint[], t0: string): HourlyPoint[] {
  const start = Date.parse(t0)
  const end = start + DEFAULT_RULES.rainfastHours * HOUR_MS
  return hourly.filter((h) => {
    const t = Date.parse(h.time)
    return t >= start && t < end
  })
}

function maxOf(values: (number | null)[]): number | null {
  const xs = values.filter((v): v is number => v !== null)
  return xs.length ? Math.max(...xs) : null
}

export function buildReplay(scenario: ReplayScenario, fieldId?: string, t0?: string): Replay {
  if (!isReplayScenario(scenario)) throw new Error(`unknown scenario: ${scenario}`)
  const t0ms = Date.parse(t0 ?? DEFAULT_T0[scenario])
  if (Number.isNaN(t0ms)) throw new Error(`invalid t0: ${t0}`)
  const t0Iso = new Date(t0ms).toISOString()

  const fields = loadFields()
  const field = fieldId === undefined ? fields[0] : fields.find((f) => f.id === fieldId)
  if (!field) throw new Error(fieldId === undefined ? 'no fields in fixtures' : `unknown fieldId: ${fieldId}`)

  const runs = loadForecastRuns(scenario)
  const obs = loadObservation(scenario)
  const snapshot = buildScenarioSnapshot(field, t0Iso, scenario, runs, obs)
  const [task] = nowcasting.generate({ fields: [field], snapshots: [snapshot], count: 1 })
  if (!task) throw new Error(`task generation failed for ${snapshot.id}`)

  const answer = loadSavedAnswer(scenario, task.id)
  const score = nowcasting.score(task, answer, obs, snapshot)

  const frames: ReplayFrame[] = windowOf(obs.hourly, t0Iso).map((p) => ({
    time: p.time,
    windMph: p.windMph,
    gustMph: p.gustMph,
    precipIn: p.precipIn,
    ...evaluateHour(p),
  }))
  const { violation, status, reasons } = evaluateWindow(obs.hourly, t0Iso)

  const models: ReplayModelSummary[] = snapshot.forecasts.map((f) => {
    const w = windowOf(f.hourly, t0Iso)
    return {
      model: f.model,
      issuedAt: f.issuedAt,
      windowMaxGust: maxOf(w.map((h) => h.gustMph)),
      windowMaxWind: maxOf(w.map((h) => h.windMph)),
      violation: evaluateWindow(f.hourly, t0Iso).violation,
    }
  })

  const { costUsdPerAcre, lossUsdPerAcre } = task.context
  if (costUsdPerAcre === undefined || lossUsdPerAcre === undefined) throw new Error('task context is missing cost assumptions')

  return {
    demo: true,
    scenario,
    task,
    snapshotSummary: { snapshotId: snapshot.id, models },
    answer,
    frames,
    verdict: { violation, status, reasons },
    score,
    assumptions: { costUsdPerAcre, lossUsdPerAcre },
  }
}
