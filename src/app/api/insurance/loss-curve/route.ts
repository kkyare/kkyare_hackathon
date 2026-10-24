// GET /api/insurance/loss-curve?peril=frost -> LossCurve  위험점수 구간별 실제 손해율 (검증된 날씨-생산량 데이터, 목업)
import { curveFor } from '../../../../insurance/data'
import type { Peril } from '../../../../core/types'

export async function GET(req: Request) {
  const peril = (new URL(req.url).searchParams.get('peril') ?? 'frost') as Peril
  return Response.json(curveFor(peril))
}
