// 농장 연결 효과: 연결된 농장 센서가 늘수록 필지 추정 오차가 줄어드는 곡선 (목업 fixtures로 계산).
// 방법: 연결된 필지들의 (실측 - 보정 예보) 잔차를 지형별로 평균 내 다른 필지 추정에 더한다.
import type { Field, Observation, Snapshot } from '../core/types'
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
