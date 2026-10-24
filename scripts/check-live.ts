import { buildReplay, REPLAY_SCENARIOS } from '../src/families/nowcasting/replay'
import { GET } from '../src/app/api/live/route'

let failures = 0
const check = (name: string, ok: boolean, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ' - ' + extra : ''}`)
  if (!ok) failures++
}
const throws = (fn: () => unknown) => {
  try {
    fn()
    return false
  } catch {
    return true
  }
}

// (a) 세 시나리오 공통 모양
for (const s of REPLAY_SCENARIOS) {
  const r = buildReplay(s)
  check(`(a) ${s} frames length 4`, r.frames.length === 4, String(r.frames.length))
  check(`(a) ${s} demo true`, r.demo === true)
  check(`(a) ${s} 4 model summaries`, r.snapshotSummary.models.length === 4, r.snapshotSummary.models.map((m) => `${m.model}=${m.windowMaxGust}`).join(' '))
  check(`(a) ${s} saved answer`, r.answer.model.includes('saved') && typeof r.answer.probability === 'number' && r.answer.taskId === r.task.id)
  check(`(a) ${s} score matches task`, r.score.taskId === r.task.id && r.score.family === 'nowcasting')
  check(`(a) ${s} assumptions 7/31`, r.assumptions.costUsdPerAcre === 7 && r.assumptions.lossUsdPerAcre === 31)
  check(`(a) ${s} default field is first`, r.task.field.id === 'field-ia-01', r.task.field.id)
}

// (b) 시나리오별 기대 결과
const fm = buildReplay('forecast-miss')
check('(b) forecast-miss t0 15Z', fm.task.t0 === '2026-06-10T15:00:00.000Z', fm.task.t0)
check('(b) forecast-miss correct === false', fm.score.correct === false, JSON.stringify(fm.score))
check('(b) forecast-miss frames include GUST reason', fm.frames.some((f) => f.reasons.some((c) => c.includes('GUST'))))
check('(b) forecast-miss verdict violation', fm.verdict.violation === true && fm.verdict.reasons.includes('GUST_HIGH'), fm.verdict.reasons.join(','))
check('(b) forecast-miss regret 24 (sprayed $31 vs oracle delay $7)', fm.score.regretUsd === 24, String(fm.score.regretUsd))

const cg = buildReplay('calm-go')
check('(b) calm-go correct === true', cg.score.correct === true, JSON.stringify(cg.score))
check('(b) calm-go regret 0', cg.score.regretUsd === 0)
check('(b) calm-go all frames GO', cg.frames.every((f) => f.status === 'GO'))

const gb = buildReplay('gust-block')
check('(b) gust-block default t0 16Z', gb.task.t0 === '2026-06-10T16:00:00.000Z', gb.task.t0)
check('(b) gust-block correct === true', gb.score.correct === true, JSON.stringify(gb.score))

// (c) 인자 처리
const custom = buildReplay('gust-block', 'field-ia-03', '2026-06-10T13:00:00Z')
check('(c) custom field + 13Z no violation', custom.task.field.id === 'field-ia-03' && custom.verdict.violation === false)
check('(c) unknown fieldId throws', throws(() => buildReplay('calm-go', 'nope')))
check('(c) invalid t0 throws', throws(() => buildReplay('calm-go', undefined, 'garbage')))
check('(c) unknown scenario throws', throws(() => buildReplay('nope' as never)))

// (d) route
async function main() {
  const get = (qs: string) => GET(new Request(`http://localhost/api/live${qs}`))
  const bad = await get('?scenario=nope')
  const badBody = (await bad.json()) as { error?: unknown }
  check('(d) route unknown scenario -> 400 {error}', bad.status === 400 && typeof badBody.error === 'string', JSON.stringify(badBody))
  const ok = await get('?scenario=forecast-miss')
  const body = (await ok.json()) as { demo?: unknown; frames?: unknown[] }
  check('(d) route valid -> 200', ok.status === 200 && body.demo === true && body.frames?.length === 4)
  const badT0 = await get('?scenario=calm-go&t0=garbage')
  check('(d) route invalid t0 -> 400', badT0.status === 400)
  const noQuery = await get('')
  check('(d) route no query -> 200 forecast-miss', noQuery.status === 200 && ((await noQuery.json()) as { scenario?: string }).scenario === 'forecast-miss')
}
main()
  .then(() => {
    console.log(failures ? `${failures} FAILED` : 'ALL OK')
    process.exit(failures ? 1 : 0)
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
