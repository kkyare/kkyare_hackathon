// 채점 함수 모음. 모두 순수 함수.
// 방향: brier·crps·regret은 낮을수록 좋음, skill은 높을수록 좋음 (PLAN 9-1).

/** 이진 사건 Brier. p: 예측 확률(0-1), happened: 실제 발생 여부 */
export function brier(p: number, happened: boolean): number {
  const o = happened ? 1 : 0
  return (clamp01(p) - o) ** 2
}

/** 다범주 Brier (S2S 3분위 등). probs 합은 1로 정규화해서 계산 */
export function brierMulti(probs: number[], observedIndex: number): number {
  const total = probs.reduce((a, b) => a + b, 0) || 1
  return probs.reduce((sum, p, i) => sum + (p / total - (i === observedIndex ? 1 : 0)) ** 2, 0)
}

/** 분위수 예측의 CRPS 근사: 분위수 손실(pinball) 평균 × 2 */
export function crpsFromQuantiles(quantiles: { q: number; value: number }[], obs: number): number {
  if (quantiles.length === 0) return Number.NaN
  const total = quantiles.reduce((sum, { q, value }) => {
    const diff = obs - value
    return sum + (diff >= 0 ? q * diff : (q - 1) * diff)
  }, 0)
  return (2 * total) / quantiles.length
}

/** 앙상블 멤버의 CRPS: E|X-y| - 0.5·E|X-X'| */
export function crpsEnsemble(members: number[], obs: number): number {
  const n = members.length
  if (n === 0) return Number.NaN
  const term1 = members.reduce((s, x) => s + Math.abs(x - obs), 0) / n
  let term2 = 0
  for (const a of members) for (const b of members) term2 += Math.abs(a - b)
  return term1 - term2 / (2 * n * n)
}

/** 결정값 예측(단일 값)의 CRPS = 절대 오차 */
export function crpsPoint(value: number, obs: number): number {
  return Math.abs(value - obs)
}

/** 비용-손실 모델에서 최적 결정: P(사건) > C/L 이면 보호 */
export function optimalProtect(p: number, cost: number, loss: number): boolean {
  return clamp01(p) > cost / loss
}

/** 결정의 실제 비용. 보호하면 C, 보호 안 했는데 사건이 나면 L */
export function decisionCost(protect: boolean, happened: boolean, cost: number, loss: number): number {
  if (protect) return cost
  return happened ? loss : 0
}

/** 완벽정보 오라클 비용: 사건이 날 때만 보호 (C < L 가정) */
export function oracleCost(happened: boolean, cost: number, loss: number): number {
  return happened ? Math.min(cost, loss) : 0
}

export function regret(protect: boolean, happened: boolean, cost: number, loss: number) {
  const c = decisionCost(protect, happened, cost, loss)
  const o = oracleCost(happened, cost, loss)
  return { costUsd: c, oracleCostUsd: o, regretUsd: c - o }
}

/**
 * 스킬 점수: 1 - score/reference (낮을수록 좋은 점수 기준).
 * 1 = 완벽, 0 = 기준 예보와 같음, 음수 = 기준보다 나쁨.
 * 기준 점수가 0이면(기준이 이미 완벽) 같으면 0, 더 나쁘면 -1로 둔다.
 */
export function skillScore(score: number, reference: number): number {
  if (!Number.isFinite(score) || !Number.isFinite(reference)) return 0
  if (reference === 0) return score === 0 ? 0 : -1
  return 1 - score / reference
}

/** RL 보상: -정규화 regret + λ·(-Brier). regret은 L로 나눠 0-1 범위로 */
export function reward(regretUsd: number, loss: number, brierScore: number, lambda = 0.5): number {
  return -(regretUsd / loss) - lambda * brierScore
}

/** 정규분포 누적확률 P(X <= x) */
export function normalCdf(x: number, mean: number, sigma: number): number {
  if (sigma <= 0) return x >= mean ? 1 : 0
  return 0.5 * (1 + erf((x - mean) / (sigma * Math.SQRT2)))
}

function erf(x: number): number {
  // Abramowitz-Stegun 7.1.26
  const sign = x < 0 ? -1 : 1
  const t = 1 / (1 + 0.3275911 * Math.abs(x))
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x)
  return sign * y
}

function clamp01(p: number): number {
  return Math.min(1, Math.max(0, p))
}
