// POST /api/farm/search { query } -> { fieldIds, reason, by }  자연어로 농장 찾기
import { searchWithClaude } from '../../../../farm/ai'
import { candidates } from '../../../../farm/data'

export async function POST(req: Request) {
  const { query } = (await req.json().catch(() => ({}))) as { query?: string }
  if (!query?.trim()) return Response.json({ error: '찾을 조건을 입력하세요.' }, { status: 400 })
  return Response.json(await searchWithClaude(query.trim().slice(0, 200), candidates()))
}
