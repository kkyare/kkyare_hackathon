import { buildDemoTasks } from '../../../../../families/nowcasting/index'

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
  const count = body.count === undefined ? 30 : Number(body.count)
  if (!Number.isInteger(count) || count < 1) return json({ error: 'count must be a positive integer' }, 400)
  const fieldIds = Array.isArray(body.fieldIds) ? (body.fieldIds as string[]) : undefined
  // Build the full pool, then filter, so fieldIds does not shrink the result below count.
  const { tasks } = buildDemoTasks(Number.MAX_SAFE_INTEGER)
  const picked = (fieldIds ? tasks.filter((t) => fieldIds.includes(t.field.id)) : tasks).slice(0, count)
  return json(picked.map((t, i) => ({ ...t, id: `task-nc-${String(i + 1).padStart(4, '0')}` })))
}
