// Arena 실행: 과제 × 모델을 돌려 패밀리 score()로 채점한다. 채점은 직접 하지 않고 패밀리에 맡긴다.
import { runAgent, type RunAgentInput, type RunAgentResult } from '../core/agent'
import type { Answer, Family, FamilyId, ModelId, Observation, Score, Snapshot, Task } from '../core/types'

// 저장해서 다시 재생할 수 있는 실행 기록 (fixtures/arena/*.json 형식)
export interface ArenaRun {
  taskId: string; model: ModelId
  answer: Answer
  leakFlags: string[]
  usage?: RunAgentResult['usage']
}

export interface ArenaError { taskId: string; model: ModelId; message: string }

export type ArenaEvent =
  | { type: 'start'; taskId: string; model: ModelId }
  | { type: 'answer'; run: ArenaRun }
  | { type: 'score'; score: Score }
  | { type: 'error'; error: ArenaError }

export type AgentRunner = (input: RunAgentInput) => Promise<Pick<RunAgentResult, 'answer' | 'leakFlags'> & Partial<RunAgentResult>>

export interface RunArenaInput {
  tasks: Task[]
  models: ModelId[]
  families: Partial<Record<FamilyId, Family>>
  getSnapshot(snapshotId: string): Snapshot | undefined
  getObservation(task: Task): Observation | undefined   // 아직 확정 전이면 undefined → 답만 받고 채점은 건너뜀
  runner?: AgentRunner                                   // 기본: 실제 Claude. 데모: replayRunner(saved)
  concurrency?: number
  onEvent?(e: ArenaEvent): void
}

export interface ArenaResult { answers: Answer[]; scores: Score[]; runs: ArenaRun[]; errors: ArenaError[] }

export async function pool<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
  let next = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) await fn(items[next++])
  })
  await Promise.all(workers)
}

export async function runArena({
  tasks, models, families, getSnapshot, getObservation, runner = runAgent, concurrency = 3, onEvent,
}: RunArenaInput): Promise<ArenaResult> {
  const result: ArenaResult = { answers: [], scores: [], runs: [], errors: [] }
  const jobs = tasks.flatMap(task => models.map(model => ({ task, model })))

  await pool(jobs, concurrency, async ({ task, model }) => {
    const fail = (message: string) => {
      const error = { taskId: task.id, model, message }
      result.errors.push(error)
      onEvent?.({ type: 'error', error })
    }
    const family = families[task.family]
    if (!family) return fail(`family '${task.family}' is not registered`)
    const snapshot = getSnapshot(task.snapshotId)
    if (!snapshot) return fail(`snapshot '${task.snapshotId}' not found`)

    onEvent?.({ type: 'start', taskId: task.id, model })
    let run: ArenaRun
    try {
      const r = await runner({ task, snapshot, model, answerSchema: family.answerSchema })
      run = { taskId: task.id, model, answer: r.answer, leakFlags: r.leakFlags, ...(r.usage && { usage: r.usage }) }
    } catch (e) {
      return fail(e instanceof Error ? e.message : String(e))
    }
    result.runs.push(run)
    result.answers.push(run.answer)
    onEvent?.({ type: 'answer', run })

    const obs = getObservation(task)
    if (!obs) return
    let score: Score
    try {
      score = family.score(task, run.answer, obs, snapshot)
    } catch (e) {
      return fail(`score failed: ${e instanceof Error ? e.message : String(e)}`)
    }
    score = {
      ...score,
      leakFlags: [...new Set([...score.leakFlags, ...run.leakFlags])],
      resolvedWith: score.resolvedWith ?? { stationId: obs.stationId, at: task.resolveAt },
    }
    result.scores.push(score)
    onEvent?.({ type: 'score', score })
  })

  return result
}

// 저장된 실행 기록을 실제 Claude 대신 돌려준다 (?mock=1, 키 없음, 결과가 흔들릴 때)
export function replayRunner(saved: ArenaRun[]): AgentRunner {
  const byKey = new Map(saved.map(r => [`${r.taskId}|${r.model}`, r]))
  return async ({ task, model }) => {
    const r = byKey.get(`${task.id}|${model}`)
    if (!r) throw new Error(`no saved run for ${task.id} × ${model}`)
    return { answer: r.answer, leakFlags: r.leakFlags, ...(r.usage && { usage: r.usage }) }
  }
}

// 실제 실행을 먼저 하고, 실패하면 저장 기록으로 대체
export function withFallback(primary: AgentRunner, saved: ArenaRun[]): AgentRunner {
  const replay = replayRunner(saved)
  return async input => {
    try {
      return await primary(input)
    } catch {
      return replay(input)
    }
  }
}
