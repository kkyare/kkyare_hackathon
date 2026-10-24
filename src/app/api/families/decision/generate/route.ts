// POST /api/families/decision/generate  { count?, fieldIds? } -> Task[]   (목업 fixtures 사용)
import { generate } from '../../../../../families/decision'
import { fields, snapshots } from '../../../../../insurance/data'

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { count?: number; fieldIds?: string[] }
  const pool = body.fieldIds?.length ? snapshots.filter((s) => body.fieldIds!.includes(s.fieldId)) : snapshots
  return Response.json(generate({ fields, snapshots: pool, count: body.count }))
}
