// POST /api/arena/run 본체. route.ts는 요청·응답 변환만 한다.
import { ARENA_MODELS, runAgent } from '../core/agent'
import type { Answer, Family, FamilyId, Score, Task } from '../core/types'
import { taskData } from './data'
import { replayRunner, runArena, type AgentRunner, type ArenaError, type ArenaRun } from './run'

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
