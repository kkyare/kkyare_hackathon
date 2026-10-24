import { buildS2sTasks } from '../../../../../families/s2s/index'
import { loadFields } from '../../../../../core/weather'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

export async function POST(req: Request): Promise<Response> {
  let body: { count?: unknown; fieldIds?: unknown } = {}
  try {
    const text = await req.text()
    if (text.trim()) body = JSON.parse(text)
  } catch {
    return json({ error: 'invalid JSON body' }, 400)
  }
  const count = body.count === undefined ? Number.MAX_SAFE_INTEGER : Number(body.count)
  if (!Number.isInteger(count) || count < 1) return json({ error: 'count must be a positive integer' }, 400)
  const fieldIds = Array.isArray(body.fieldIds) ? (body.fieldIds as string[]) : undefined
  const fields = loadFields().filter((field) => !fieldIds || fieldIds.includes(field.id))
  return json(buildS2sTasks(fields).slice(0, count))
}
