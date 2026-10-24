// POST /api/insurance/verify  Claim | { claimId } -> ClaimReport   (목업 fixtures 사용)
import { claims, verifyContext } from '../../../../insurance/data'
import { verifyClaim } from '../../../../insurance/verify'
import type { Claim } from '../../../../core/types'

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<Claim> & { claimId?: string }
  const claim = body.claimId ? claims.find((c) => c.id === body.claimId) : (body as Claim)
  if (!claim?.fieldId || !claim.peril || !claim.date) return Response.json({ error: 'claim not found or incomplete' }, { status: 400 })
  try {
    return Response.json(verifyClaim(claim, verifyContext))
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 404 })
  }
}
