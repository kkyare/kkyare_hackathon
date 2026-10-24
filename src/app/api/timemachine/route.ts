// GET /api/timemachine?scenario=frost-0512|mild-0520 -> 필지별 시간대 원천 예보·보정 예보·실측 (목업)
import { fieldObs, fields, snapshots } from '../../../insurance/data'
import { buildReplay, SCENARIOS, type ScenarioKey } from '../../../timemachine/build'

export async function GET(req: Request) {
  const key = (new URL(req.url).searchParams.get('scenario') ?? 'frost-0512') as ScenarioKey
  if (!(key in SCENARIOS)) return Response.json({ error: 'unknown scenario', scenarios: Object.keys(SCENARIOS) }, { status: 400 })
  return Response.json({ demo: true, ...buildReplay(key, fields, snapshots, fieldObs) })
}
