import { families } from '../../../families/index'
import { BadRequest, handleExport, type ExportRequest } from '../../../arena/api'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

// POST /api/export?format=json|jsonl|card&holdout=1&download=1  { tasks, scores? }
// json: TaskPack, jsonl: 한 줄에 과제 하나, card: 데이터 카드(Markdown). holdout=1이면 정답 관측을 뺀다
export async function POST(req: Request): Promise<Response> {
  let body: ExportRequest
  try {
    body = await req.json()
  } catch {
    return json({ error: 'invalid JSON body' }, 400)
  }
  const q = new URL(req.url).searchParams
  try {
    const r = handleExport(body, { format: q.get('format') ?? undefined, holdout: q.get('holdout') === '1', families })
    const headers: Record<string, string> = { 'content-type': r.contentType }
    if (q.get('download') === '1') headers['content-disposition'] = `attachment; filename="${r.filename}"`
    return new Response(r.body, { headers })
  } catch (e) {
    if (e instanceof BadRequest) return json({ error: e.message }, 400)
    return json({ error: (e as Error).message }, 500)
  }
}
