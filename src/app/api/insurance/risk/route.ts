// GET /api/insurance/risk?fieldId=&peril=  -> RiskScore (fieldId 생략 시 전체 필지 배열)
import { climatology, fields, station } from '../../../../insurance/data'
import { riskScore } from '../../../../insurance/verify'
import type { Peril } from '../../../../core/types'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const peril = (url.searchParams.get('peril') ?? 'frost') as Peril
  const fieldId = url.searchParams.get('fieldId')
  const score = (id: string) => {
    const f = fields.find((x) => x.id === id)!
    return riskScore(f, peril, station.elevationM, climatology.find((c) => c.fieldId === id))
  }
  if (fieldId) {
    if (!fields.some((f) => f.id === fieldId)) return Response.json({ error: 'unknown field' }, { status: 404 })
    return Response.json(score(fieldId))
  }
  return Response.json(fields.map((f) => score(f.id)))
}
