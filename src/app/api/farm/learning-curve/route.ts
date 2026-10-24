// GET /api/farm/learning-curve?fieldId=field-ia-04&peril=frost
// -> { points: 연결 농장 수별 필지 추정 오차, ranges: 검증 청구 수별 요율 range 폭 }  (목업)
import { fieldObs, fields, portfolio, riskScores, scoreFor, snapshots } from '../../../../insurance/data'
import { learningCurve, rangeNarrowing } from '../../../../farm/learning'
import type { Peril } from '../../../../core/types'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const peril = (url.searchParams.get('peril') ?? 'frost') as Peril
  const field = portfolio.fields.find((f) => f.id === (url.searchParams.get('fieldId') ?? 'field-ia-04')) ?? portfolio.fields[0]
  const score = scoreFor(field.id, peril)?.score ?? 50
  return Response.json({
    demo: true,
    points: learningCurve(fields, snapshots, fieldObs),
    ranges: rangeNarrowing(field, peril, score, portfolio, riskScores),
  })
}
