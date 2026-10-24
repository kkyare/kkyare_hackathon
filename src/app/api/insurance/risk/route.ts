// GET /api/insurance/risk?fieldId=&peril=  -> RiskScore (fieldId 생략 시 포트폴리오 전체 필지 배열, 지도용)
import { portfolio, riskScores, scoreFor } from '../../../../insurance/data'
import type { Peril } from '../../../../core/types'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const peril = (url.searchParams.get('peril') ?? 'frost') as Peril
  const fieldId = url.searchParams.get('fieldId')
  if (fieldId) {
    const s = scoreFor(fieldId, peril)
    return s ? Response.json(s) : Response.json({ error: 'unknown field' }, { status: 404 })
  }
  return Response.json(riskScores.filter((r) => r.peril === peril).map((r) => ({ ...r, field: portfolio.fields.find((f) => f.id === r.fieldId) })))
}
