// 농장 브리핑과 농장 찾기에 쓰는 Claude 호출. ANTHROPIC_API_KEY가 없거나 실패하면 규칙 기반으로 대신한다.
import { askClaude, CLAUDE_MODEL } from '../lib/claude'
import type { Field, RiskScore } from '../core/types'
import { templateBriefing, type FarmBrief } from './brief'

export const FARM_AI_MODEL = CLAUDE_MODEL

export async function briefWithClaude(b: FarmBrief): Promise<{ text: string; by: 'claude' | 'template' }> {
  const fallback = { text: templateBriefing(b), by: 'template' as const }
  if (!process.env.ANTHROPIC_API_KEY) return fallback
  try {
    const text = await askClaude(
        '너는 미국 대형 농장과 작물보험사를 돕는 농업 기상 분석가다. 주어진 숫자만 근거로 한국어 4문장 이내 브리핑을 쓴다. ' +
        '올해 예상 생산량과 범위, 가장 큰 날씨 요인, 이 필지의 과거 수확 기록이 예측에 어떻게 반영됐는지, 지금 할 일 하나를 말한다. 숫자를 바꾸거나 근거에 없는 사실을 만들지 않는다.',
      JSON.stringify({ ...b, learning: undefined }),
    )
    return text ? { text, by: 'claude' } : fallback
  } catch (e) {
    console.error('[farm/brief] Claude call failed:', e)
    return fallback
  }
}

type Candidate = { field: Field; scores: RiskScore[] }

const TERMS: [RegExp, (c: Candidate) => number][] = [
  [/골짜기|저지대|valley|낮은/i, (c) => (c.field.terrain === 'valley' ? 1 : 0)],
  [/능선|언덕|ridge|높은/i, (c) => (c.field.terrain === 'ridge' ? 1 : 0)],
  [/평지|flat/i, (c) => (c.field.terrain === 'flat' ? 1 : 0)],
  [/옥수수|corn/i, (c) => (c.field.crop === 'corn' ? 1 : 0)],
  [/콩|대두|soy/i, (c) => (c.field.crop === 'soybean' ? 1 : 0)],
  [/큰|넓은|대형/, (c) => c.field.acres / 400],
  [/서리|frost|냉해/i, (c) => (c.scores.find((s) => s.peril === 'frost')?.score ?? 0) / 100],
  [/폭우|비|침수|rain/i, (c) => (c.scores.find((s) => s.peril === 'excess_rain')?.score ?? 0) / 100],
  [/가뭄|건조|drought/i, (c) => (c.scores.find((s) => s.peril === 'drought')?.score ?? 0) / 100],
]

export function keywordSearch(query: string, candidates: Candidate[], limit = 5) {
  const name = candidates.filter((c) => query.toLowerCase().includes(c.field.name.toLowerCase()) || query.includes(c.field.id))
  if (name.length) return name.slice(0, limit).map((c) => c.field.id)
  const used = TERMS.filter(([re]) => re.test(query))
  if (!used.length) return []
  return candidates
    .map((c) => ({ id: c.field.id, s: used.reduce((sum, [, f]) => sum + f(c), 0) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.id)
}

export async function searchWithClaude(query: string, candidates: Candidate[]): Promise<{ fieldIds: string[]; reason: string; by: 'claude' | 'keyword' }> {
  const fallback = () => {
    const ids = keywordSearch(query, candidates)
    return { fieldIds: ids, reason: ids.length ? '지형, 작물, 위험 종류 단어로 찾았습니다.' : '조건에 맞는 농장을 찾지 못했습니다. 지형(골짜기, 능선, 평지), 작물(옥수수, 콩), 위험(서리, 폭우, 가뭄)으로 찾아 보세요.', by: 'keyword' as const }
  }
  if (!process.env.ANTHROPIC_API_KEY) return fallback()
  try {
    const list = candidates.map((c) => ({
      id: c.field.id, name: c.field.name, crop: c.field.crop, acres: c.field.acres, terrain: c.field.terrain, elevationM: c.field.elevationM,
      risk: Object.fromEntries(c.scores.map((s) => [s.peril, s.score])),
    }))
    const text = await askClaude(
      '사용자 요청에 맞는 농장을 목록에서 최대 5곳 고른다. JSON 한 줄만 출력한다: {"fieldIds":["..."],"reason":"한국어 한 문장"}. 목록에 없는 id는 쓰지 않는다.',
      `요청: ${query}\n목록: ${JSON.stringify(list)}`,
    )
    const json = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)) as { fieldIds: string[]; reason: string }
    const valid = new Set(candidates.map((c) => c.field.id))
    const fieldIds = (json.fieldIds ?? []).filter((id) => valid.has(id)).slice(0, 5)
    return fieldIds.length ? { fieldIds, reason: json.reason ?? '', by: 'claude' } : fallback()
  } catch (e) {
    console.error('[farm/search] Claude call failed:', e)
    return fallback()
  }
}
