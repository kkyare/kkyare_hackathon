// 청구 검증 해설을 Claude로 작성 (운영진 안내: 핵심 AI 판단·대화는 Claude).
// 판정(확률·verdict)은 코드가 계산하고, Claude는 근거를 읽고 손해사정사용 해설만 쓴다.
// ANTHROPIC_API_KEY가 없거나 호출이 실패하면 기존 템플릿 해설을 그대로 쓴다.
import { askClaude, CLAUDE_MODEL } from '../lib/claude'
import type { Claim, ClaimReport, Field } from '../core/types'

export const EXPLAIN_MODEL = CLAUDE_MODEL

const SYSTEM = `너는 미국 작물보험 손해사정을 돕는 분석가다.
주어진 청구와 근거(필지 추정값, 인근 관측, 당시 예보)만 사용해 한국어로 3문장 이내 해설을 쓴다.
판정과 확률은 이미 계산되어 있으니 바꾸지 말고 그대로 인용한다. 근거에 없는 사실을 만들지 않는다.
데모용 목업 데이터라는 점은 언급하지 않는다.`

// 같은 청구의 해설은 한 번만 만들고 다시 쓴다
const explainCache = new Map<string, string>()

export async function explainWithClaude(claim: Claim, field: Field, report: ClaimReport): Promise<ClaimReport> {
  const key = `${claim.id}:${claim.fieldId}:${claim.date}:${claim.claimedLossUsd}`
  const hit = explainCache.get(key)
  if (hit) return { ...report, explanation: hit }
  if (!process.env.ANTHROPIC_API_KEY) return report
  try {
    const text = await askClaude(SYSTEM, JSON.stringify({
            claim,
            field: { name: field.name, crop: field.crop, acres: field.acres, elevationM: field.elevationM, terrain: field.terrain },
            verdict: report.verdict,
            conditionProbability: report.conditionProbability,
            evidence: report.evidence,
          }))
    if (!text) return report
    explainCache.set(key, text)
    return { ...report, explanation: text }
  } catch (e) {
    console.error('[insurance/explain] Claude call failed:', e)
    return report
  }
}
