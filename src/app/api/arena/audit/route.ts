import { BadRequest, handleAudit, type AuditRequest } from '../../../../arena/api'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

// POST /api/arena/audit  { tasks, runs } → { findings, summary, rationaleChecked }
// ?mock=1이거나 키가 없으면 도구 기록만 집계 (Claude rationale 검사는 건너뜀)
export async function POST(req: Request): Promise<Response> {
  let body: AuditRequest
  try {
    body = await req.json()
  } catch {
    return json({ error: 'invalid JSON body' }, 400)
  }
  const mock = new URL(req.url).searchParams.get('mock') === '1' || !process.env.ANTHROPIC_API_KEY
  try {
    return json(await handleAudit(body, { mock }))
  } catch (e) {
    if (e instanceof BadRequest) return json({ error: e.message }, 400)
    return json({ error: (e as Error).message }, 500)
  }
}
