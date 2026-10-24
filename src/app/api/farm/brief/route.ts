// GET /api/farm/brief?fieldId= -> 농장 하나의 예측 묶음 + 브리핑 (Claude, 키가 없으면 규칙 기반)
import { briefWithClaude } from '../../../../farm/ai'
import { farmBrief } from '../../../../farm/brief'
import { farmData } from '../../../../farm/data'

export async function GET(req: Request) {
  const fieldId = new URL(req.url).searchParams.get('fieldId') ?? ''
  const brief = farmBrief(fieldId, farmData)
  if (!brief) return Response.json({ error: `농장 ${fieldId}을(를) 찾을 수 없습니다.` }, { status: 404 })
  const briefing = await briefWithClaude(brief)
  return Response.json({ demo: true, ...brief, briefing })
}
