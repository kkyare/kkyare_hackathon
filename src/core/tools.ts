// 에이전트 도구. t0 시점에 알 수 있었던 정보만 돌려준다 (누출 방지의 마지막 관문).
// 방어 두 겹: (1) 스냅샷에 t0 이후 데이터가 섞여 있어도 걸러 낸다 (2) t0 이후 구간을 요청하면 잘라내고 기록한다.
import type { Answer, ForecastRun, HourlyPoint, Snapshot, Task } from './types'

const HOUR = 3_600_000
const MAX_POINTS = 168                     // 한 번에 최대 7일치

export interface ToolDefinition {          // Anthropic Messages API의 tool 형식
  name: string
  description: string
  input_schema: { type: 'object'; properties: Record<string, unknown>; required?: string[] }
}

export interface LeakAttempt { tool: string; args: unknown; reason: string; flag: string }

export interface Toolbox {
  definitions: ToolDefinition[]
  call(name: string, args: unknown): unknown            // JSON으로 직렬화 가능한 결과
  calls: Answer['toolCalls']                             // Answer.toolCalls에 그대로 넣는다
  leakAttempts: LeakAttempt[]                            // 에이전트가 t0 이후를 요청한 기록 → Score.leakFlags
  snapshotIssues: string[]                               // 스냅샷 자체에 섞여 있던 t0 이후 데이터 (데이터 쪽 문제)
}

const ms = (iso: string) => Date.parse(iso)
const iso = (t: number) => new Date(t).toISOString()

const definitions: ToolDefinition[] = [
  {
    name: 'get_field_info',
    description: '과제 대상 필지 정보(위치, 고도, 면적, 작물, 지형, 가장 가까운 ASOS 관측소)와 과제 기준 시각 t0를 돌려준다.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'list_forecast_models',
    description: 't0 시점에 이미 발표돼 있던 예보 모델과 발표 시각 목록.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_forecast',
    description: '지정한 예보 모델의 가장 최근 런(t0 이전 발표)에서 시간별 예보를 돌려준다. 단위: °F, mph, inch. 시각은 UTC ISO 8601. 기본 구간은 t0부터 72시간.',
    input_schema: {
      type: 'object',
      properties: {
        model: { type: 'string', description: 'list_forecast_models에 나온 모델 이름' },
        from: { type: 'string', description: '시작 시각 (UTC ISO 8601, 선택)' },
        to: { type: 'string', description: '끝 시각 (UTC ISO 8601, 선택)' },
      },
      required: ['model'],
    },
  },
  {
    name: 'get_observations',
    description: '가장 가까운 ASOS 관측소의 시간별 실측. t0 이전 관측만 있다. 단위: °F, mph, inch. 기본 구간은 t0 직전 24시간.',
    input_schema: {
      type: 'object',
      properties: {
        from: { type: 'string', description: '시작 시각 (UTC ISO 8601, 선택)' },
        to: { type: 'string', description: '끝 시각 (UTC ISO 8601, 선택, t0 이후는 잘림)' },
      },
    },
  },
]

function window(points: HourlyPoint[], from: number, to: number) {
  return points.filter(p => ms(p.time) >= from && ms(p.time) <= to).slice(0, MAX_POINTS)
}

function parseTime(v: unknown, fallback: number): number {
  if (typeof v !== 'string') return fallback
  const t = ms(v)
  return Number.isNaN(t) ? fallback : t
}

export function makeTools(task: Task, snapshot: Snapshot): Toolbox {
  const t0 = ms(task.t0)
  const snapshotIssues: string[] = []
  if (ms(snapshot.t0) !== t0) snapshotIssues.push(`snapshot.t0(${snapshot.t0}) != task.t0(${task.t0})`)

  // 1겹: t0 이후 발표된 예보 런과 t0 이후 관측은 아예 보이지 않게 한다
  const runs: ForecastRun[] = snapshot.forecasts.filter(r => {
    const ok = ms(r.issuedAt) <= t0
    if (!ok) snapshotIssues.push(`forecast ${r.model} issued ${r.issuedAt} after t0`)
    return ok
  })
  const obs = snapshot.obsUntilT0.filter(p => {
    const ok = ms(p.time) < t0
    if (!ok) snapshotIssues.push(`observation at ${p.time} not before t0`)
    return ok
  })

  const calls: Answer['toolCalls'] = []
  const leakAttempts: LeakAttempt[] = []
  const leak = (tool: string, args: unknown, reason: string, flag: string) =>
    leakAttempts.push({ tool, args, reason, flag })

  const handlers: Record<string, (args: Record<string, unknown>) => unknown> = {
    get_field_info: () => ({ t0: task.t0, field: task.field }),

    list_forecast_models: () => ({
      t0: task.t0,
      models: runs.map(r => ({ model: r.model, issuedAt: r.issuedAt })),
    }),

    get_forecast: args => {
      const model = args.model
      const candidates = runs.filter(r => r.model === model)
      if (candidates.length === 0) {
        const requestedAfterT0 = snapshot.forecasts.some(r => r.model === model)
        if (requestedAfterT0) leak('get_forecast', args, 'only runs issued after t0 exist', 'tool:forecast_after_t0')
        return { error: `no run of '${String(model)}' issued at or before t0`, available: runs.map(r => r.model) }
      }
      const run = candidates.reduce((a, b) => (ms(b.issuedAt) > ms(a.issuedAt) ? b : a))
      const from = parseTime(args.from, t0)
      const to = parseTime(args.to, t0 + 72 * HOUR)
      return { model: run.model, issuedAt: run.issuedAt, hourly: window(run.hourly, from, to) }
    },

    get_observations: args => {
      const from = parseTime(args.from, t0 - 24 * HOUR)
      let to = parseTime(args.to, t0 - 1)
      let note: string | undefined
      if (to >= t0 || from >= t0) {
        leak('get_observations', args, 'requested observations at or after t0', 'tool:obs_after_t0')
        to = Math.min(to, t0 - 1)
        note = `observations are only available before t0 (${task.t0}); range was clipped`
      }
      return { stationId: task.field.stationId, hourly: from <= to ? window(obs, from, to) : [], ...(note && { note }) }
    },
  }

  return {
    definitions,
    calls,
    leakAttempts,
    snapshotIssues,
    call(name, rawArgs) {
      const args = rawArgs && typeof rawArgs === 'object' ? (rawArgs as Record<string, unknown>) : {}
      calls.push({ name, args, at: iso(Date.now()) })
      const handler = handlers[name]
      if (!handler) return { error: `unknown tool '${name}'` }
      return handler(args)
    },
  }
}

// Score.leakFlags에 넣을 값 (중복 제거)
export function leakFlagsOf(toolbox: Pick<Toolbox, 'leakAttempts'>): string[] {
  return [...new Set(toolbox.leakAttempts.map(a => a.flag))]
}
