// GET /api/insurance/claims -> { claims, fields, station }   보험사 콘솔 목록용 (목업, fields = 포트폴리오 전체)
import { claims, portfolio, station } from '../../../../insurance/data'

export async function GET() {
  return Response.json({ demo: true, claims, fields: portfolio.fields, station })
}
