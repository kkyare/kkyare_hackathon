// GET /api/farm/brief?fieldId= -> 농장 하나의 예측 묶음 + 브리핑 (Claude, 키가 없으면 규칙 기반)
import { briefWithClaude } from '../../../../farm/ai'
import { farmBrief } from '../../../../farm/brief'
import { farmData } from '../../../../farm/data'

export async function GET(req: Request) {
  const fieldId = new URL(req.url).searchParams.get('fieldId') ?? ''
  const brief = farmBrief(fieldId, farmData)
  if (!brief) return Response.json({ error: `농장 ${fieldId}을(를) 찾을 수 없습니다.` }, { status: 404 })
  const briefing = await briefWithClaude(brief)
  // 같은 필지는 CDN이 하루 동안 그대로 돌려준다. Claude 브리핑이 아닐 때(키 없음·실패)는 캐시하지 않는다
  const headers = briefing.by === 'claude' ? { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' } : { 'Cache-Control': 'no-store' }
  return Response.json({ demo: true, ...brief, briefing }, { headers })
}
