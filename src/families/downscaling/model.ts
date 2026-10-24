// 필지 단위 보정 모델 (데모용 기준선): 고도 기온감률 + 지형(냉기 고임) 보정.
// 다운스케일링 패밀리의 "우리 엔진 답", 보험 청구 검증의 필지 추정에 같이 쓴다.
import type { Field, ForecastRun, HourlyPoint, Snapshot } from '../../core/types'

export const LAPSE_F_PER_100M = 1.2 // 6.5°C/km (PLAN 9-4)
const TERRAIN_NIGHT_F: Record<NonNullable<Field['terrain']>, number> = { valley: -2, flat: 0, ridge: 1 }
const Z90 = 1.2816

/** 기준 고도(격자·관측소)에서 필지로 옮길 때 더할 °F */
export function fieldAdjustmentF(field: Field, fromElevationM: number, night = true): number {
  const lapse = -((field.elevationM - fromElevationM) / 100) * LAPSE_F_PER_100M
  const terrain = night && field.terrain ? TERRAIN_NIGHT_F[field.terrain] : 0
  return lapse + terrain
}

export function minTemp(hourly: HourlyPoint[], from?: string, to?: string): number | null {
  const temps = hourly
    .filter((h) => (!from || h.time >= from) && (!to || h.time <= to))
    .map((h) => h.tempF)
    .filter((t): t is number => t !== null)
  return temps.length ? Math.min(...temps) : null
}

export function sumPrecip(hourly: HourlyPoint[], from: string, to: string): number | null {
  const vals = hourly.filter((h) => h.time >= from && h.time < to).map((h) => h.precipIn)
  if (vals.length === 0) return null
  return vals.reduce<number>((s, v) => s + (v ?? 0), 0)
}

/** 원천 격자 예보의 최저기온 (보정 없음) = 스킬 점수 기준 */
export function rawGridMin(run: ForecastRun): number | null {
  return minTemp(run.hourly)
}

export function downscaledMin(field: Field, run: ForecastRun): number | null {
  const raw = rawGridMin(run)
  if (raw === null) return null
  return raw + fieldAdjustmentF(field, run.gridElevationM ?? field.elevationM)
}

/** 모델별 보정값으로 필지 최저기온 분포 (평균, 시그마, 분위수) */
export function fieldMinDistribution(field: Field, snapshot: Snapshot) {
  const values = snapshot.forecasts.map((r) => downscaledMin(field, r)).filter((v): v is number => v !== null)
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const spread = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length)
  const sigma = Math.max(1.5, spread + 1)
  return {
    mean,
    sigma,
    perModel: snapshot.forecasts.map((r) => ({ model: r.model, raw: rawGridMin(r), downscaled: downscaledMin(field, r) })),
    quantiles: [
      { q: 0.1, value: round1(mean - Z90 * sigma) },
      { q: 0.5, value: round1(mean) },
      { q: 0.9, value: round1(mean + Z90 * sigma) },
    ],
  }
}

/** 원천 예보(보정 없음)의 모델 평균 최저기온 */
export function rawGridMeanMin(snapshot: Snapshot): number {
  const vals = snapshot.forecasts.map(rawGridMin).filter((v): v is number => v !== null)
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

export const round1 = (x: number) => Math.round(x * 10) / 10
