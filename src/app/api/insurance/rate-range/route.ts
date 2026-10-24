// GET /api/insurance/rate-range?fieldId=&peril= -> RateRange (fieldId 생략 시 포트폴리오 전체 필지 배열)
import { portfolio, rateFor } from '../../../../insurance/data'
import type { Peril } from '../../../../core/types'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const peril = (url.searchParams.get('peril') ?? 'frost') as Peril
  const fieldId = url.searchParams.get('fieldId')
  if (fieldId) {
    const r = rateFor(fieldId, peril)
    return r ? Response.json(r) : Response.json({ error: 'unknown field' }, { status: 404 })
  }
  return Response.json(portfolio.fields.map((f) => rateFor(f.id, peril)))
}
