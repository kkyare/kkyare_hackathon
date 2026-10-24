// /api/arena/*, /api/export 본체. route.ts는 요청·응답 변환만 한다.
import { ARENA_MODELS, runAgent } from '../core/agent'
import type { Answer, Family, FamilyId, Score, Task } from '../core/types'
import { demoTasks, taskData } from './data'
import { buildTaskPack, dataCard, labelOf, toJsonl, type Label } from './export'
import { auditRuns, auditSummary } from './leakAudit'
import { replayRunner, runArena, type AgentRunner, type ArenaError, type ArenaRun } from './run'
import { scoreboard } from './scoreboard'

export interface ArenaRunRequest { tasks?: Task[]; taskIds?: string[]; models?: string[] }

export interface ArenaRunResponse {
  answers: Answer[]; scores: Score[]; errors: ArenaError[]
  live: boolean                         // 모든 답이 실제 Claude 호출이면 true (화면 LIVE 배지). 하나라도 저장 응답이면 false (DEMO DATA)
  replayed: number                      // 저장 응답으로 대체된 수
}

export interface ArenaRunDeps {
  families: Partial<Record<FamilyId, Family>>
  saved: ArenaRun[]
  mock: boolean                         // ?mock=1 또는 API 키 없음
  live?: AgentRunner                    // 기본: 실제 Claude
}

export class BadRequest extends Error {}

export async function handleArenaRun(body: ArenaRunRequest, deps: ArenaRunDeps): Promise<ArenaRunResponse> {
  if (body.taskIds) throw new BadRequest('taskIds is not supported yet: send tasks (from /api/families/[family]/generate)')
  if (!Array.isArray(body.tasks) || body.tasks.length === 0) throw new BadRequest('tasks must be a non-empty array')
  if (body.models !== undefined && (!Array.isArray(body.models) || body.models.length === 0 || body.models.some(m => typeof m !== 'string')))
    throw new BadRequest('models must be a non-empty array of model ids')

  const tasks = body.tasks
  const models = body.models ?? ARENA_MODELS
  const replay = replayRunner(deps.saved)
  const live = deps.live ?? runAgent
  let liveCount = 0, replayed = 0

  // 실제 호출 → 실패하면 저장 응답. 몇 개가 대체됐는지 세어 LIVE 표시를 정직하게 한다
  const runner: AgentRunner = async input => {
    if (!deps.mock) {
      try {
        const r = await live(input)
        liveCount++
        return r
      } catch {
        // 아래에서 저장 응답으로 대체
      }
    }
    const r = await replay(input)
    replayed++
    return r
  }

  const { answers, scores, errors } = await runArena({ tasks, models, families: deps.families, runner, ...taskData(tasks) })
  return { answers, scores, errors, live: liveCount > 0 && replayed === 0, replayed }
}

// ---- POST /api/export ----------------------------------------------------------

export type ExportFormat = 'json' | 'jsonl' | 'card'

export interface ExportRequest { tasks?: Task[]; scores?: Score[] }   // scores가 있으면 데이터 카드에 Arena baseline으로 넣는다

export interface ExportResult { body: string; contentType: string; filename: string }

export function handleExport(body: ExportRequest, opts: { format?: string; holdout?: boolean; families?: Partial<Record<FamilyId, Family>> } = {}): ExportResult {
  if (!Array.isArray(body.tasks) || body.tasks.length === 0) throw new BadRequest('tasks must be a non-empty array')
  const format = (opts.format ?? 'json') as ExportFormat
  if (!['json', 'jsonl', 'card'].includes(format)) throw new BadRequest('format must be json | jsonl | card')

  const data = taskData(body.tasks)
  let pack
  try {
    pack = buildTaskPack(body.tasks, { snapshots: data.snapshots, resolutionFor: data.getObservation, holdout: opts.holdout })
  } catch (e) {
    throw new BadRequest((e as Error).message)
  }
  const name = `${pack.id}${opts.holdout ? '-holdout' : ''}`
  if (format === 'jsonl') {
    const labels = new Map<string, Label>()
    for (const task of opts.holdout ? [] : body.tasks) {
      const family = opts.families?.[task.family], obs = data.getObservation(task), snap = data.getSnapshot(task.snapshotId)
      const label = family && obs && snap ? labelOf(family, task, obs, snap) : undefined
      if (label) labels.set(task.id, label)
    }
    return { body: toJsonl(pack, labels), contentType: 'application/x-ndjson', filename: `${name}.jsonl` }
  }
  if (format === 'card') return { body: dataCard(pack, scoreboard(body.scores ?? [])), contentType: 'text/markdown; charset=utf-8', filename: `${name}.md` }
  return { body: JSON.stringify(pack), contentType: 'application/json', filename: `${name}.json` }
}

// ---- GET /api/arena/tasks, POST /api/arena/audit ------------------------------------

export const ARENA_FAMILIES: FamilyId[] = ['nowcasting', 'downscaling', 'decision', 's2s']

// 화면용 데모 과제. 저장 응답(fixtures/arena/runs.json)과 같은 id라 ?mock=1로 재생된다
export function handleArenaTasks(opts: { count?: number; saved: ArenaRun[]; hasKey: boolean }) {
  const count = Math.max(1, Math.min(10, Math.floor(opts.count ?? 2)))
  const tasks = ARENA_FAMILIES.flatMap(f => demoTasks(f, count))
  const savedKeys = new Set(opts.saved.map(r => `${r.taskId}|${r.model}`))
  const replayable = tasks.every(t => ARENA_MODELS.every(m => savedKeys.has(`${t.id}|${m}`)))
  return { tasks, models: ARENA_MODELS, replayable, liveAvailable: opts.hasKey }
}

export interface AuditRequest { tasks?: Task[]; runs?: ArenaRun[] }

// mock이면 도구 기록만 (Claude 호출 없음), 아니면 rationale도 Claude로 검사
export async function handleAudit(body: AuditRequest, opts: { mock: boolean }) {
  if (!Array.isArray(body.tasks) || !Array.isArray(body.runs)) throw new BadRequest('tasks and runs must be arrays')
  const findings = await auditRuns(body.runs, body.tasks, { rationale: !opts.mock })
  return { findings, summary: auditSummary(findings, body.runs), rationaleChecked: !opts.mock }
}
