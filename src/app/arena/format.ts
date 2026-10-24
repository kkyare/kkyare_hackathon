// Arena·납품 화면의 표시 함수 (서버 코드 의존 없음)
import type { Answer, FamilyId, Score } from '../../core/types'

// 색은 모델(엔티티)에 고정한다. 순위가 바뀌어도 색은 그대로 (dataviz 검증 팔레트 1-3번)
export const MODEL_STYLE: Record<string, { label: string; color: string }> = {
  'claude-haiku-5-5': { label: 'Haiku', color: '#2a78d6' },
  'claude-sonnet-5-5': { label: 'Sonnet', color: '#eb6834' },
  'claude-opus-5-5': { label: 'Opus', color: '#1baf7a' },
}
export const modelLabel = (m: string) => MODEL_STYLE[m]?.label ?? m
export const modelColor = (m: string) => MODEL_STYLE[m]?.color ?? '#71717a'

export const FAMILY_LABEL: Record<FamilyId, string> = {
  nowcasting: '나우캐스팅',
  downscaling: '다운스케일링',
  decision: '서리 결정',
  s2s: 'S2S',
}

export const num = (v: number | null | undefined, digits = 2) => (v == null || !Number.isFinite(v) ? '—' : v.toFixed(digits))
export const pct = (v: number | null | undefined) => (v == null || !Number.isFinite(v) ? '—' : `${Math.round(v * 100)}%`)
export const signed = (v: number | null | undefined, digits = 2) =>
  v == null || !Number.isFinite(v) ? '—' : `${v > 0 ? '+' : ''}${v.toFixed(digits)}`
export const usd = (v: number | null | undefined) => (v == null ? '—' : `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`)

// 답 한 줄 요약: 패밀리마다 답 형식이 다르다
export function answerSummary(a: Pick<Answer, 'probability' | 'quantiles' | 'terciles' | 'decision'>): string {
  const parts: string[] = []
  if (a.probability != null) parts.push(`P = ${num(a.probability)}`)
  if (a.terciles) parts.push(`낮음 ${num(a.terciles[0])} · 보통 ${num(a.terciles[1])} · 높음 ${num(a.terciles[2])}`)
  if (a.quantiles?.length) {
    parts.push([...a.quantiles].sort((x, y) => x.q - y.q).map(q => `q${Math.round(q.q * 100)} ${num(q.value, 1)}`).join(' · ') + ' °F')
  }
  if (a.decision) parts.push(`→ ${a.decision}`)
  return parts.join('  ') || '—'
}

// 점수 한 줄 요약: 있는 지표만
export function scoreSummary(s: Score): string {
  const parts: string[] = []
  if (s.brier != null) parts.push(`Brier ${num(s.brier, 3)}`)
  if (s.crps != null) parts.push(`CRPS ${num(s.crps)}`)
  if (s.regretUsd != null) parts.push(`regret ${usd(s.regretUsd)}/acre`)
  // 리더보드와 같게 [-1, 1]로 자른 값을 보여 주고, 잘렸으면 원래 값을 괄호로
  const clipped = Math.max(-1, Math.min(1, s.skill))
  parts.push(`skill ${signed(clipped)}${clipped !== s.skill ? ` (원값 ${signed(s.skill)})` : ''}`)
  return parts.join(' · ')
}

// 도구 기록 플래그(tool:*)와 근거 감사(audit:*)를 사람 말로
export const LEAK_LABEL: Record<string, string> = {
  'tool:obs_after_t0': 't0 이후 구간 요청 (잘려서 반환)',
  'tool:forecast_after_t0': 't0 이후 예보 요청 (거부됨)',
  'audit:future_knowledge': '근거에 t0 이후 사실',
}
export const leakLabel = (flag: string) => LEAK_LABEL[flag] ?? flag
// 차단된 요청은 "시도"일 뿐 실제 누출이 아니다. 근거 감사 적발만 실제 문제로 본다
export const isBlockedAttempt = (flag: string) => flag.startsWith('tool:')
