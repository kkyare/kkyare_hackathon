// 짧은 브리핑·해설·검색용 Claude 호출. 서버에서만 쓴다 (ANTHROPIC_API_KEY).
// Claude 5.5 모델은 답 전에 생각(thinking)을 먼저 하므로 max_tokens를 넉넉히 주고 effort는 low로 둔다.
// 거절(refusal) 시에는 서버가 다른 모델로 이어서 답하도록 fallbacks: 'default'를 켠다.
import Anthropic from '@anthropic-ai/sdk'

export const CLAUDE_MODEL = 'claude-opus-5-5'

let client: Anthropic | null = null

export async function askClaude(system: string, user: string): Promise<string> {
  client ??= new Anthropic()
  const res = await client.beta.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4000,
    output_config: { effort: 'low' },
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system,
    messages: [{ role: 'user', content: user }],
  })
  if (res.stop_reason === 'refusal') return ''
  return res.content.map((b) => (b.type === 'text' ? b.text : '')).join('').trim()
}
