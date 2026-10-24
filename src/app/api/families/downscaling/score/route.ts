// POST /api/families/downscaling/score  { task, answer } -> Score
// answer를 생략하면 우리 엔진(고도·지형 보정)의 답으로 채점한다.
import { answerSchema, engineAnswer, score } from '../../../../../families/downscaling'
import { observationFor, snapshotById } from '../../../../../insurance/data'
import type { Answer, Task } from '../../../../../core/types'

export async function POST(req: Request) {
  const { task, answer } = (await req.json()) as { task: Task; answer?: Answer }
  const snapshot = snapshotById(task.snapshotId)
  const obs = observationFor(task.field.id, task.t0)
  if (!snapshot || !obs) return Response.json({ error: 'snapshot or observation not found' }, { status: 404 })
  const final = answer ?? engineAnswer(task, snapshot)
  const parsed = answerSchema.safeParse(final)
  if (!parsed.success) return Response.json({ error: 'invalid answer', issues: parsed.error.issues }, { status: 400 })
  return Response.json({ answer: final, score: score(task, final, obs, snapshot) })
}
