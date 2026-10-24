// GET /api/insurance/claims -> { claims, fields, station }   보험사 콘솔 목록용 (목업)
import { claims, fields, station } from '../../../../insurance/data'

export async function GET() {
  return Response.json({ demo: true, claims, fields, station })
}
