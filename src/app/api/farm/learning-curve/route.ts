// GET /api/farm/learning-curve -> CurvePoint[]  연결된 농장이 늘수록 필지 추정 오차(MAE, °F)가 줄어드는 곡선 (목업)
import { fieldObs, fields, snapshots } from '../../../../insurance/data'
import { learningCurve } from '../../../../farm/learning'

export async function GET() {
  return Response.json({ demo: true, points: learningCurve(fields, snapshots, fieldObs) })
}
