import { handleArenaTasks } from '../../../../arena/api'
import { loadSavedRuns } from '../../../../arena/data'

// GET /api/arena/tasks?count=2 → { tasks, models, replayable, liveAvailable }
export async function GET(req: Request): Promise<Response> {
  const count = Number(new URL(req.url).searchParams.get('count') ?? 2)
  return Response.json(handleArenaTasks({ count: Number.isFinite(count) ? count : 2, saved: loadSavedRuns(), hasKey: !!process.env.ANTHROPIC_API_KEY }))
}
