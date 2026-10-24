import { nowcasting, answerSchema, loadObservationForTask, loadSnapshotForTask } from '../../../../../families/nowcasting/index'
import type { Answer, Task } from '../../../../../core/types'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

export async function POST(req: Request): Promise<Response> {
  let body: { task?: Task; answer?: unknown }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'invalid JSON body' }, 400)
  }
  if (!body.task || typeof body.task.snapshotId !== 'string') return json({ error: 'task with snapshotId required' }, 400)
  const parsed = answerSchema.safeParse(body.answer)
  if (!parsed.success) return json({ error: 'invalid answer', issues: parsed.error.issues }, 400)
  const answer = { taskId: body.task.id, model: 'unknown', rationale: '', toolCalls: [], ...(parsed.data as object) } as Answer
  try {
    const snapshot = loadSnapshotForTask(body.task)
    const obs = loadObservationForTask(body.task)
    return json(nowcasting.score(body.task, answer, obs, snapshot))
  } catch (e) {
    return json({ error: (e as Error).message }, 400)
  }
}
