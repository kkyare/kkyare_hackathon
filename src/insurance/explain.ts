// 청구 검증 해설을 Claude로 작성 (운영진 안내: 핵심 AI 판단·대화는 Claude).
// 판정(확률·verdict)은 코드가 계산하고, Claude는 근거를 읽고 손해사정사용 해설만 쓴다.
// ANTHROPIC_API_KEY가 없거나 호출이 실패하면 기존 템플릿 해설을 그대로 쓴다.
import Anthropic from '@anthropic-ai/sdk'
import type { Claim, ClaimReport, Field } from '../core/types'

export const EXPLAIN_MODEL = 'claude-sonnet-5-5'

const SYSTEM = `너는 미국 작물보험 손해사정을 돕는 분석가다.
주어진 청구와 근거(필지 추정값, 인근 관측, 당시 예보)만 사용해 한국어로 3문장 이내 해설을 쓴다.
판정과 확률은 이미 계산되어 있으니 바꾸지 말고 그대로 인용한다. 근거에 없는 사실을 만들지 않는다.
데모용 목업 데이터라는 점은 언급하지 않는다.`

export async function explainWithClaude(claim: Claim, field: Field, report: ClaimReport): Promise<ClaimReport> {
  if (!process.env.ANTHROPIC_API_KEY) return report
  try {
    const client = new Anthropic()
    const msg = await client.messages.create({
      model: EXPLAIN_MODEL,
      max_tokens: 400,
      system: SYSTEM,
      messages: [
        {
          role: 'user',
          content: JSON.stringify({
            claim,
            field: { name: field.name, crop: field.crop, acres: field.acres, elevationM: field.elevationM, terrain: field.terrain },
            verdict: report.verdict,
            conditionProbability: report.conditionProbability,
            evidence: report.evidence,
          }),
        },
      ],
    })
    const text = msg.content.map((b) => (b.type === 'text' ? b.text : '')).join('').trim()
    return text ? { ...report, explanation: text } : report
  } catch {
    return report
  }
}
