// 농장 연결 효과: 연결된 농장 센서가 늘수록 필지 추정 오차가 줄어드는 곡선 (목업 fixtures로 계산).
// 방법: 연결된 필지들의 (실측 - 보정 예보) 잔차를 지형별로 평균 내 다른 필지 추정에 더한다.
import type { Field, Observation, Peril, RiskScore, Snapshot } from '../core/types'
import { rateRange, type Portfolio } from '../insurance/rates'
import { fieldMinDistribution, minTemp } from '../families/downscaling/model'

export interface CurvePoint { connectedFields: number; maeF: number; rawGridMaeF: number }

export function learningCurve(fields: Field[], snapshots: Snapshot[], fieldObs: (Observation & { fieldId: string })[]): CurvePoint[] {
  const cases = snapshots
    .map((s) => {
      const field = fields.find((f) => f.id === s.fieldId)
      const obs = fieldObs.find((o) => o.fieldId === s.fieldId && o.hourly[0]?.time === s.t0)
      const observed = obs ? minTemp(obs.hourly) : null
      if (!field || observed === null) return null
      const raw = s.forecasts.map((r) => minTemp(r.hourly)).filter((v): v is number => v !== null)
      return {
        field,
        observed,
        engine: fieldMinDistribution(field, s).mean,
        raw: raw.reduce((a, b) => a + b, 0) / raw.length,
      }
    })
    .filter((c): c is NonNullable<typeof c> => c !== null)

  const rawMae = mean(cases.map((c) => Math.abs(c.raw - c.observed)))
  // 연결 순서는 고정(필지 id 순) - 데모에서 재현 가능하게
  const order = [...new Set(cases.map((c) => c.field.id))].sort()

  return order.map((_, i) => i).concat(order.length).map((k) => {
    const connected = new Set(order.slice(0, k))
    const residual = new Map<string, number[]>()
    for (const c of cases) {
      if (!connected.has(c.field.id)) continue
      const key = c.field.terrain ?? 'flat'
      residual.set(key, [...(residual.get(key) ?? []), c.observed - c.engine])
    }
    const errors = cases.map((c) => {
      const r = residual.get(c.field.terrain ?? 'flat')
      const corrected = c.engine + (r?.length ? mean(r) : 0)
      return Math.abs(corrected - c.observed)
    })
    return { connectedFields: k, maeF: round2(mean(errors)), rawGridMaeF: round2(rawMae) }
  })
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1)
const round2 = (x: number) => Math.round(x * 100) / 100

export interface RangePoint { verifiedClaims: number; premiumWidthUsdAc: number; premiumRelativeWidthPct: number; renewalWidthPct: number }

/** 검증된 청구가 늘수록 보험수가·갱신 요율 range가 좁아지는 곡선 (청구 이력을 앞에서부터 k개만 쓴다고 가정) */
export function rangeNarrowing(field: Field, peril: Peril, score: number, p: Portfolio, scores: RiskScore[], steps = [0, 5, 10, 20, 40]): RangePoint[] {
  const all = p.history.filter((c) => c.peril === peril)
  return [...steps.filter((k) => k < all.length), all.length].map((k) => {
    const kept = new Set(all.slice(0, k).map((c) => c.id))
    const sub: Portfolio = { ...p, history: p.history.filter((c) => c.peril !== peril || kept.has(c.id)) }
    // 이력이 적을수록 실제로 알 수 있는 필지-시즌도 적다
    const seasons = Math.max(1, Math.round((p.seasons * k) / Math.max(1, all.length)))
    const r = rateRange(field, peril, score, { ...sub, seasons }, scores)
    return {
      verifiedClaims: k,
      premiumWidthUsdAc: round2(r.premiumUsdAc[1] - r.premiumUsdAc[0]),
      // 가운데 값 대비 폭(%): 손해 수준이 달라도 비교 가능
      premiumRelativeWidthPct: Math.round(((r.premiumUsdAc[1] - r.premiumUsdAc[0]) / Math.max(0.01, (r.premiumUsdAc[1] + r.premiumUsdAc[0]) / 2)) * 100),
      renewalWidthPct: r.renewalRateChangePct[1] - r.renewalRateChangePct[0],
    }
  })
}
