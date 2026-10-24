import { families } from '../../../../families/index'
import { BadRequest, handleArenaRun, type ArenaRunRequest } from '../../../../arena/api'
import { loadSavedRuns } from '../../../../arena/data'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

// POST /api/arena/run  { tasks, models? } → { answers, scores, errors, live, replayed }
// ?mock=1이거나 ANTHROPIC_API_KEY가 없으면 fixtures/arena/runs.json의 저장 응답을 쓴다
export async function POST(req: Request): Promise<Response> {
  let body: ArenaRunRequest
  try {
    body = await req.json()
  } catch {
    return json({ error: 'invalid JSON body' }, 400)
  }
  const mock = new URL(req.url).searchParams.get('mock') === '1' || !process.env.ANTHROPIC_API_KEY
  try {
    return json(await handleArenaRun(body, { families, saved: loadSavedRuns(), mock }))
  } catch (e) {
    if (e instanceof BadRequest) return json({ error: e.message }, 400)
    return json({ error: (e as Error).message }, 500)
  }
}
