// POST /api/insurance/verify  Claim | { claimId } -> ClaimReport   (목업 fixtures 사용)
// 판정은 코드가 계산하고, ANTHROPIC_API_KEY가 있으면 해설을 Claude가 쓴다 (?explain=template 이면 Claude 생략).
import { claims, fields, verifyContext } from '../../../../insurance/data'
import { explainWithClaude } from '../../../../insurance/explain'
import { verifyClaim } from '../../../../insurance/verify'
import type { Claim } from '../../../../core/types'

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<Claim> & { claimId?: string }
  const claim = body.claimId ? claims.find((c) => c.id === body.claimId) : (body as Claim)
  if (!claim?.fieldId || !claim.peril || !claim.date) return Response.json({ error: 'claim not found or incomplete' }, { status: 400 })
  try {
    const report = verifyClaim(claim, verifyContext)
    if (new URL(req.url).searchParams.get('explain') === 'template') return Response.json(report)
    const field = fields.find((f) => f.id === claim.fieldId)!
    return Response.json(await explainWithClaude(claim, field, report))
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 404 })
  }
}
