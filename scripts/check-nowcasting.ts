import { nowcasting, buildDemoTasks, loadObservationForTask, loadSnapshotForTask, referenceProbability, answerSchema } from '../src/families/nowcasting/index'
import { evaluateWindow } from '../src/families/nowcasting/rules'
import { POST as generatePOST } from '../src/app/api/families/nowcasting/generate/route'
import { POST as scorePOST } from '../src/app/api/families/nowcasting/score/route'
import type { Answer, Score, Task } from '../src/core/types'

let failures = 0
const check = (name: string, ok: boolean, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ' - ' + extra : ''}`)
  if (!ok) failures++
}
const ans = (task: Task, probability: number, decision: 'spray' | 'delay'): Answer => ({
  taskId: task.id, model: 'check', probability, decision, rationale: 'check', toolCalls: [],
})
const yOf = (task: Task) => (evaluateWindow(loadObservationForTask(task).hourly, task.t0).violation ? 1 : 0)

// (a)
const { tasks } = buildDemoTasks(30)
check('(a) 30 tasks generated', tasks.length === 30, String(tasks.length))
check('(a) ids unique', new Set(tasks.map((t) => t.id)).size === tasks.length)

// (b)(c)
let skillOk = true, regretOk = true
for (const t of tasks) {
  const snap = loadSnapshotForTask(t), obs = loadObservationForTask(t)
  const pRef = referenceProbability(snap)
  const s = nowcasting.score(t, ans(t, pRef, pRef >= 0.5 ? 'delay' : 'spray'), obs, snap)
  if (Math.abs(s.skill) > 1e-9) { skillOk = false; console.log('  skill', t.id, s.skill) }
  const y = yOf(t)
  const o = nowcasting.score(t, ans(t, y, y ? 'delay' : 'spray'), obs, snap)
  if (o.regretUsd !== 0) { regretOk = false; console.log('  regret', t.id, o.regretUsd) }
}
check('(b) pRef answer -> skill 0', skillOk)
check('(c) oracle decision -> regret 0', regretOk)

// (d)
const pool = buildDemoTasks(Number.MAX_SAFE_INTEGER).tasks
const find = (scenario: string, t0: string) => pool.find((t) => t.snapshotId.endsWith('@' + scenario) && t.t0 === t0)!
const gb = find('gust-block', '2026-06-10T16:00:00.000Z')
const cg = find('calm-go', '2026-06-10T15:00:00.000Z')
const fm = find('forecast-miss', '2026-06-10T15:00:00.000Z')
check('(d) gust-block 16:00Z y=1', !!gb && yOf(gb) === 1)
check('(d) calm-go 15:00Z y=0', !!cg && yOf(cg) === 0)
check('(d) forecast-miss 15:00Z y=1', !!fm && yOf(fm) === 1)
const hrrr = loadSnapshotForTask(fm).forecasts.find((f) => /hrrr/i.test(f.model))
check('(d) forecast-miss HRRR-only says no violation', !!hrrr && !evaluateWindow(hrrr.hourly, fm.t0).violation, hrrr?.model)

// (e)
check('(e) answerSchema rejects probability 1.5', !answerSchema.safeParse({ probability: 1.5, decision: 'spray', rationale: 'x' }).success)

// (f)
async function main() {
const post = (body: unknown) => new Request('http://localhost/x', { method: 'POST', body: JSON.stringify(body) })
const g = await generatePOST(post({ count: 5 }))
const gt = (await g.json()) as Task[]
check('(f) generate 200 with 5 tasks', g.status === 200 && gt.length === 5)
const gf = await generatePOST(post({ count: 3, fieldIds: [tasks[0].field.id] }))
const gft = (await gf.json()) as Task[]
check('(f) generate fieldIds filter', gf.status === 200 && gft.length === 3 && gft.every((t) => t.field.id === tasks[0].field.id))
const sOk = await scorePOST(post({ task: gb, answer: { probability: 0.9, decision: 'delay', rationale: 'gusts' } }))
const sc = (await sOk.json()) as Score
check('(f) score 200', sOk.status === 200 && sc.taskId === gb.id && sc.correct === true && sc.regretUsd === 0, JSON.stringify(sc))
const sBad = await scorePOST(post({ task: gb, answer: { probability: 1.5, decision: 'spray', rationale: 'x' } }))
check('(f) score 400 on bad answer', sBad.status === 400)

}
main().then(() => {
console.log(failures ? `${failures} FAILED` : 'ALL OK')
process.exit(failures ? 1 : 0)
}).catch((e) => { console.error(e); process.exit(1) })
