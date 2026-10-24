import { answerSchema, loadS2sObservationForTask, loadS2sOutlook, s2s } from '../../../../../families/s2s/index'
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
    const outlook = loadS2sOutlook()
    const snapshot = { id: body.task.snapshotId, t0: body.task.t0, fieldId: body.task.field.id, forecasts: [], obsUntilT0: [] }
    const obs = loadS2sObservationForTask(body.task)
    return json(s2s.score(body.task, answer, obs, snapshot))
  } catch (e) {
    return json({ error: (e as Error).message }, 400)
  }
}
