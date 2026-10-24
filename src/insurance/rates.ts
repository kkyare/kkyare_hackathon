// 위험점수 × 실제 손해 → 점수별 손해율 곡선 → 보험수가·피해보상액·갱신 요율 range.
// 작물마다 단가가 달라서, 손해는 "기대 수입 대비 손해 비율"로 정규화해 구간을 만든다.
import type { Claim, Field, LossCurve, Peril, RateRange, RiskScore } from '../core/types'

export const TARGET_LOSS_RATIO = 0.75 // 보험사 목표 손해율 (가정)
export const COVERAGE = 0.75 // 보장률 (가정)
const BIN_EDGES = [0, 20, 40, 60, 80, 101]
const Z90 = 1.645

export interface Portfolio {
  pricesUsdBu: Record<string, number>
  basePremiumUsdAc: Record<string, number>
  fields: Field[]
  history: Claim[] // 지난 시즌 청구·생산량 (paidLossUsd 포함)
  seasons: number
}

const revenueUsdAc = (f: Field, p: Portfolio, expectedYield: number) => expectedYield * (p.pricesUsdBu[f.crop] ?? 5)
const lossFrac = (c: Claim) => Math.max(0, (c.expectedYieldBuAc - c.actualYieldBuAc) / c.expectedYieldBuAc)

function binOf(score: number) {
  for (let i = 0; i < BIN_EDGES.length - 1; i++) if (score >= BIN_EDGES[i] && score < BIN_EDGES[i + 1]) return i
  return BIN_EDGES.length - 2
}

/** 점수 구간별 실제 손해율. scores: 필지별 위험점수 */
export function lossCurve(peril: Peril, p: Portfolio, scores: RiskScore[]): LossCurve {
  const scoreOf = new Map(scores.filter((s) => s.peril === peril).map((s) => [s.fieldId, s.score]))
  const bins = BIN_EDGES.slice(0, -1).map((from, i) => ({ scoreFrom: from, scoreTo: Math.min(100, BIN_EDGES[i + 1]), n: 0, premium: 0, paid: 0, acres: 0 }))
  for (const f of p.fields) {
    const s = scoreOf.get(f.id)
    if (s === undefined) continue
    const b = bins[binOf(s)]
    b.premium += (p.basePremiumUsdAc[f.crop] ?? 30) * f.acres * p.seasons
    b.acres += f.acres * p.seasons
  }
  for (const c of p.history) {
    if (c.peril !== peril) continue
    const s = scoreOf.get(c.fieldId)
    if (s === undefined) continue
    const b = bins[binOf(s)]
    b.n += 1
    b.paid += c.paidLossUsd ?? 0
  }
  return {
    id: `curve-${peril}`,
    peril,
    bins: bins.map((b) => ({
      scoreFrom: b.scoreFrom,
      scoreTo: b.scoreTo,
      n: b.n,
      lossRatio: b.premium ? round2(b.paid / b.premium) : 0,
      avgLossUsdAc: b.acres ? round2(b.paid / b.acres) : 0,
    })),
  }
}

/** 필지 하나의 요율 range */
export function rateRange(field: Field, peril: Peril, score: number, p: Portfolio, scores: RiskScore[]): RateRange {
  const curve = lossCurve(peril, p, scores)
  const bi = binOf(score)
  const scoreOf = new Map(scores.filter((s) => s.peril === peril).map((s) => [s.fieldId, s.score]))
  const sameBin = p.fields.filter((f) => scoreOf.has(f.id) && binOf(scoreOf.get(f.id)!) === bi)

  // 구간 안 필지-시즌별 손해율 표본 → 평균과 90% 구간 (표본이 적으면 넓어짐)
  const samples: number[] = []
  for (const f of sameBin) {
    const prem = (p.basePremiumUsdAc[f.crop] ?? 30) * f.acres
    for (let s = 0; s < p.seasons; s++) samples.push(0)
    const paid = p.history.filter((c) => c.fieldId === f.id && c.peril === peril)
    paid.forEach((c, i) => { samples[samples.length - p.seasons + (i % p.seasons)] += (c.paidLossUsd ?? 0) / prem })
  }
  // 표본이 적은 구간은 포트폴리오 평균 손해율 쪽으로 당긴다 (신뢰도 가중, k=PRIOR_WEIGHT 필지-시즌)
  // 이력이 전혀 없으면 목표 손해율의 80%를 사전값으로 둔다
  const portfolioLr = portfolioLossRatio(peril, p)
  const prior = portfolioLr > 0 ? portfolioLr : TARGET_LOSS_RATIO * 0.8
  const m = (samples.reduce((a, b) => a + b, 0) + PRIOR_WEIGHT * prior) / (samples.length + PRIOR_WEIGHT)
  const half = Math.max(0.15 * prior, (Z90 * sd([...samples, prior])) / Math.sqrt(samples.length + 1)) + prior / Math.sqrt(samples.length + 1)
  const lr: [number, number] = [Math.max(0, m - half), m + half]
  const base = p.basePremiumUsdAc[field.crop] ?? 30
  const premium: [number, number] = [round2((base * lr[0]) / TARGET_LOSS_RATIO), round2((base * lr[1]) / TARGET_LOSS_RATIO)]

  // 피해가 났을 때 보상액: 같은 구간 청구들의 손해 비율 p10-p90 × 이 필지 기대 수입 × 보장률
  const fracs = p.history.filter((c) => c.peril === peril && sameBin.some((f) => f.id === c.fieldId)).map(lossFrac).sort((a, b) => a - b)
  const expectedYield = p.history.find((c) => c.fieldId === field.id)?.expectedYieldBuAc ?? defaultYield(field)
  const rev = revenueUsdAc(field, p, expectedYield)
  const fr: [number, number] = fracs.length >= 3 ? [quantile(fracs, 0.1), quantile(fracs, 0.9)] : [0.05, 0.4]
  const indemnity: [number, number] = [round2(fr[0] * rev * COVERAGE), round2(fr[1] * rev * COVERAGE)]

  // 갱신 요율: 이 필지 자기 이력 손해율과 구간 손해율을 신뢰도 가중 평균
  const own = p.history.filter((c) => c.fieldId === field.id && c.peril === peril)
  const ownLr = own.reduce((s, c) => s + (c.paidLossUsd ?? 0), 0) / (base * field.acres * p.seasons)
  const z = Math.min(1, own.length / 5)
  const blended = z * ownLr + (1 - z) * m
  // 목표 손해율보다 많이 잃은 필지는 올리고, 적게 잃은 필지는 내린다
  const center = clamp((blended / TARGET_LOSS_RATIO - 1) * 100, -15, 25)
  const spread = 4 + (1 - z) * 8
  const renewal: [number, number] = [Math.round(clamp(center - spread, -15, 25)), Math.round(clamp(center + spread, -15, 25))]

  return {
    fieldId: field.id,
    peril,
    premiumUsdAc: premium,
    indemnityUsdAc: indemnity,
    renewalRateChangePct: renewal,
    expectedLossRatio: round2(m),
    basis: { nClaims: curve.bins[bi].n, lossCurveId: curve.id },
  }
}

const PRIOR_WEIGHT = 6

/** 위험 종류별 포트폴리오 전체 손해율 */
export function portfolioLossRatio(peril: Peril, p: Portfolio): number {
  const premium = p.fields.reduce((s, f) => s + (p.basePremiumUsdAc[f.crop] ?? 30) * f.acres * p.seasons, 0)
  const paid = p.history.filter((c) => c.peril === peril).reduce((s, c) => s + (c.paidLossUsd ?? 0), 0)
  return premium ? paid / premium : 0
}

function defaultYield(f: Field) {
  return { corn: 195, soybean: 58, orchard: 750 }[f.crop] ?? 100
}
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1)
const sd = (xs: number[]) => { const mu = mean(xs); return Math.sqrt(xs.reduce((s, x) => s + (x - mu) ** 2, 0) / Math.max(1, xs.length - 1)) }
const quantile = (sorted: number[], q: number) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.round(q * (sorted.length - 1))))]
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))
const round2 = (x: number) => Math.round(x * 100) / 100
