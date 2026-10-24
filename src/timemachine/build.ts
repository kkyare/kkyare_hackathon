// Time Machine 재생 데이터: 시나리오 하루 동안 필지별 원천 예보·보정 예보·실측(농장 센서)을 시간 순으로.
import type { Field, Observation, Snapshot } from '../core/types'
import { brier, normalCdf, optimalProtect, regret } from '../core/scoring'
import { DEFAULT_COST, DEFAULT_LOSS, referenceProbability } from '../families/decision'
import { fieldAdjustmentF, fieldMinDistribution, minTemp } from '../families/downscaling/model'

export const SCENARIOS = {
  'frost-0512': { label: '2026-05-12 늦서리 밤', t0: '2026-05-11T18:00:00Z' },
  'mild-0520': { label: '2026-05-20 따뜻한 밤', t0: '2026-05-19T18:00:00Z' },
} as const
export type ScenarioKey = keyof typeof SCENARIOS

export interface ReplayField {
  field: Field
  hours: { time: string; raw: number | null; engine: number | null; observed: number | null }[]
  predictedMin: number; rawMin: number; observedMin: number
  predictedFrost: boolean; rawFrost: boolean; observedFrost: boolean
  // 서리 확률과 비용-손실 방제 권고 (의사결정 패밀리와 같은 채점)
  pFrost: number; rawPFrost: number
  protect: boolean; rawProtect: boolean
  regretUsdAc: number; rawRegretUsdAc: number
  brier: number; rawBrier: number
}

const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1)
const r1 = (x: number) => Math.round(x * 10) / 10

export function buildReplay(key: ScenarioKey, fields: Field[], snapshots: Snapshot[], fieldObs: (Observation & { fieldId: string })[], thresholdF = 32) {
  const t0 = SCENARIOS[key].t0
  const out: ReplayField[] = []
  for (const field of fields) {
    const snap = snapshots.find((s) => s.fieldId === field.id && s.t0 === t0)
    const obs = fieldObs.find((o) => o.fieldId === field.id && o.hourly[0]?.time === t0)
    if (!snap || !obs) continue
    const times = snap.forecasts[0].hourly.map((h) => h.time)
    const hours = times.map((time, i) => {
      const raws = snap.forecasts.map((r) => r.hourly[i]?.tempF).filter((v): v is number => v != null)
      const engines = snap.forecasts
        .map((r) => (r.hourly[i]?.tempF == null ? null : r.hourly[i].tempF! + fieldAdjustmentF(field, r.gridElevationM ?? field.elevationM)))
        .filter((v): v is number => v != null)
      return { time, raw: raws.length ? r1(avg(raws)) : null, engine: engines.length ? r1(avg(engines)) : null, observed: obs.hourly.find((h) => h.time === time)?.tempF ?? null }
    })
    const predictedMin = Math.min(...hours.map((h) => h.engine ?? Infinity))
    const rawMin = Math.min(...hours.map((h) => h.raw ?? Infinity))
    const observedMin = minTemp(obs.hourly) ?? Infinity
    const dist = fieldMinDistribution(field, snap)
    const pFrost = normalCdf(thresholdF, dist.mean, dist.sigma)
    const rawPFrost = referenceProbability(snap)
    const happened = observedMin <= thresholdF
    const protect = optimalProtect(pFrost, DEFAULT_COST, DEFAULT_LOSS)
    const rawProtect = optimalProtect(rawPFrost, DEFAULT_COST, DEFAULT_LOSS)
    out.push({
      field, hours, predictedMin, rawMin, observedMin,
      predictedFrost: predictedMin <= thresholdF, rawFrost: rawMin <= thresholdF, observedFrost: happened,
      pFrost: Math.round(pFrost * 100) / 100, rawPFrost,
      protect, rawProtect,
      regretUsdAc: regret(protect, happened, DEFAULT_COST, DEFAULT_LOSS).regretUsd,
      rawRegretUsdAc: regret(rawProtect, happened, DEFAULT_COST, DEFAULT_LOSS).regretUsd,
      brier: Math.round(brier(pFrost, happened) * 1000) / 1000,
      rawBrier: Math.round(brier(rawPFrost, happened) * 1000) / 1000,
    })
  }
  return { scenario: key, label: SCENARIOS[key].label, t0, thresholdF, costUsdAc: DEFAULT_COST, lossUsdAc: DEFAULT_LOSS, fields: out }
}
