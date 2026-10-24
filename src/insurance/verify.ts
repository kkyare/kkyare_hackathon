// 보험 청구 검증과 필지 리스크 점수.
// "청구된 날씨 원인이 그날 그 필지에 실제로 있었나"를 확률과 근거로 돌려준다.
import { normalCdf } from '../core/scoring'
import type { Claim, ClaimReport, Field, Observation, Peril, RateRange, RiskScore, Snapshot } from '../core/types'
import { fieldAdjustmentF, minTemp, rawGridMin, round1, sumPrecip } from '../families/downscaling/model'

export const THRESHOLDS = {
  frostF: 32,
  heavyRainIn: 2.0,
  supported: 0.7,
  notSupported: 0.3,
} as const

export interface VerifyContext {
  fields: Field[]
  station: { id: string; elevationM: number }
  stationObs: Observation[]
  fieldObs?: (Observation & { fieldId: string })[] // 연결된 농장의 필지 센서 (있으면 우선)
  snapshots?: Snapshot[]
  rateFor?: (fieldId: string, peril: Peril) => RateRange | undefined // 피해보상액 range 계산용
}

// 청구 날짜(현지 날짜)를 UTC 창으로: 전날 현지 저녁 ~ 당일 현지 낮 (CDT = UTC-5)
function frostWindow(date: string) {
  return { from: `${date}T00:00:00Z`, to: `${date}T18:00:00Z` }
}
function dayWindow(date: string) {
  const next = new Date(Date.parse(`${date}T00:00:00Z`) + 24 * 3600e3).toISOString().slice(0, 10)
  return { from: `${date}T00:00:00Z`, to: `${next}T00:00:00Z` }
}

/** 조건 확률 + 청구액이 보상액 range 안인지로 판정 */
function verdictOf(p: number, claimed: number, range: [number, number]): ClaimReport['verdict'] {
  if (p <= THRESHOLDS.notSupported) return 'outside_range' // 피해 조건 자체가 없었음
  if (claimed > range[1]) return 'outside_range' // 조건은 있었지만 청구액이 범위 위
  if (p >= THRESHOLDS.supported) return 'within_range'
  return 'unclear'
}

function indemnityRange(claim: Claim, field: Field, ctx: VerifyContext): [number, number] {
  const r = ctx.rateFor?.(field.id, claim.peril)
  if (!r) return [0, claim.claimedLossUsd]
  return [Math.round(r.indemnityUsdAc[0] * field.acres), Math.round(r.indemnityUsdAc[1] * field.acres)]
}

export function verifyClaim(claim: Claim, ctx: VerifyContext): ClaimReport {
  const field = ctx.fields.find((f) => f.id === claim.fieldId)
  if (!field) throw new Error(`unknown field ${claim.fieldId}`)
  const station = ctx.stationObs.find((o) => o.stationId === field.stationId) ?? ctx.stationObs[0]
  const range = indemnityRange(claim, field, ctx)

  if (claim.peril === 'frost') {
    const { from, to } = frostWindow(claim.date)
    const stationMin = station ? minTemp(station.hourly, from, to) : null
    const sensor = ctx.fieldObs?.find((o) => o.fieldId === field.id && o.hourly.some((h) => h.time >= from && h.time <= to))
    const sensorMin = sensor ? minTemp(sensor.hourly, from, to) : null
    // 필지 센서가 있으면 그 값(σ 0.7), 없으면 관측소 값을 고도·지형으로 옮긴 추정(σ 2.0)
    const estimate = sensorMin ?? (stationMin !== null ? stationMin + fieldAdjustmentF(field, ctx.station.elevationM) : null)
    const sigma = sensorMin !== null ? 0.7 : 2.0
    const p = estimate === null ? 0.5 : normalCdf(THRESHOLDS.frostF, estimate, sigma)
    const snap = ctx.snapshots?.find((s) => s.fieldId === field.id && s.t0 < to && s.t0 >= `${prevDate(claim.date)}T00:00:00Z`)
    return {
      claimId: claim.id,
      peril: claim.peril,
      conditionProbability: round2(p),
      indemnityRange: range,
      verdict: estimate === null ? 'unclear' : verdictOf(p, claim.claimedLossUsd, range),
      evidence: {
        fieldEstimate: { variable: 'min_temp', value: round1(estimate ?? Number.NaN), sigma, unit: 'F' },
        nearbyObs: { stationId: station?.stationId ?? field.stationId, value: stationMin, unit: 'F' },
        forecastAtT0: snap?.forecasts.map((r) => ({ model: r.model, value: rawGridMin(r), unit: 'F' })),
      },
      explanation: `${frostExplanation(field, estimate, sigma, p, sensorMin !== null, stationMin)} ${rangeText(claim.claimedLossUsd, range)}`,
    }
  }

  if (claim.peril === 'excess_rain') {
    const { from, to } = dayWindow(claim.date)
    const total = station ? sumPrecip(station.hourly, from, to) : null
    const sigma = total === null ? 1 : Math.max(0.3, total * 0.25)
    const p = total === null ? 0.5 : 1 - normalCdf(THRESHOLDS.heavyRainIn, total, sigma)
    return {
      claimId: claim.id,
      peril: claim.peril,
      conditionProbability: round2(p),
      indemnityRange: range,
      verdict: total === null ? 'unclear' : verdictOf(p, claim.claimedLossUsd, range),
      evidence: {
        fieldEstimate: { variable: 'precip_24h', value: round2(total ?? Number.NaN), sigma: round2(sigma), unit: 'in' },
        nearbyObs: { stationId: station?.stationId ?? field.stationId, value: total === null ? null : round2(total), unit: 'in' },
      },
      explanation:
        total === null
          ? '해당 날짜 강수 관측이 없어 판단할 수 없습니다.'
          : `인근 관측소 24시간 강수 ${round2(total)} inch (기준 ${THRESHOLDS.heavyRainIn} inch), 폭우 조건 확률 ${pct(p)}. ${rangeText(claim.claimedLossUsd, range)}`,
    }
  }

  // drought: 수주 누적 강수·토양수분이 필요해 데모 데이터로는 판단 보류
  return {
    claimId: claim.id,
    peril: claim.peril,
    conditionProbability: 0.5,
    indemnityRange: range,
    verdict: claim.claimedLossUsd > range[1] ? 'outside_range' : 'unclear',
    evidence: {
      fieldEstimate: { variable: claim.peril, value: Number.NaN, sigma: Number.NaN, unit: '-' },
      nearbyObs: { stationId: field.stationId, value: null, unit: '-' },
    },
    explanation: '가뭄은 수주 누적 강수·토양수분 자료가 필요해 데모 데이터로는 조건을 확인하지 않았습니다(로드맵). 청구액만 보상액 range와 비교했습니다.',
  }
}

export interface Climatology { fieldId: string; frostNightsMay10y: number; heavyRainDaysJun10y: number; dryWeeksJul10y: number }

export function riskScore(field: Field, peril: Peril, stationElevationM: number, clim?: Climatology): RiskScore {
  const drivers: string[] = []
  let score = 0
  if (peril === 'frost') {
    const terrain = { valley: 35, flat: 15, ridge: 5 }[field.terrain ?? 'flat']
    score += terrain
    if (field.terrain === 'valley') drivers.push('골짜기 지형: 밤에 찬 공기가 고임')
    const below = stationElevationM - field.elevationM
    if (below > 0) {
      score += Math.min(20, below * 0.6)
      drivers.push(`관측소보다 ${Math.round(below)}m 낮음`)
    }
    if (clim) {
      score += Math.min(45, clim.frostNightsMay10y * 3)
      drivers.push(`지난 10년 5월 서리 밤 ${clim.frostNightsMay10y}회`)
    }
    if (field.crop === 'orchard') drivers.push('과수: 개화기 서리 피해 민감')
  } else if (peril === 'excess_rain') {
    score += field.terrain === 'valley' ? 40 : 20
    if (field.terrain === 'valley') drivers.push('저지대: 배수 불량 위험')
    if (clim) {
      score += Math.min(50, clim.heavyRainDaysJun10y * 5)
      drivers.push(`지난 10년 6월 폭우일 ${clim.heavyRainDaysJun10y}일`)
    }
  } else {
    score += field.terrain === 'ridge' ? 35 : field.terrain === 'flat' ? 20 : 8
    if (field.terrain === 'ridge') drivers.push('능선: 배수가 빨라 토양이 쉽게 마름')
    if (clim) {
      score += Math.min(55, clim.dryWeeksJul10y * 5)
      drivers.push(`지난 10년 7월 건조 주 ${clim.dryWeeksJul10y}주`)
    }
  }
  return { fieldId: field.id, peril, season: peril === 'frost' ? 'spring' : 'summer', score: Math.round(Math.min(100, score)), drivers }
}

function frostExplanation(field: Field, est: number | null, sigma: number, p: number, fromSensor: boolean, stationMin: number | null) {
  if (est === null) return '해당 시간대 기온 관측이 없어 판단할 수 없습니다.'
  const src = fromSensor ? '연결된 농장 센서 실측' : `인근 관측소(${stationMin}°F)를 고도·지형으로 보정한 추정`
  return `${field.name}의 최저기온은 ${src} 기준 ${round1(est)}°F (±${sigma}). 서리(≤ ${THRESHOLDS.frostF}°F) 조건 확률 ${pct(p)}.`
}

function rangeText(claimed: number, range: [number, number]) {
  return `청구액 $${claimed.toLocaleString('en-US')}, 예상 보상액 range $${range[0].toLocaleString('en-US')}-$${range[1].toLocaleString('en-US')}.`
}

function prevDate(date: string) {
  return new Date(Date.parse(`${date}T00:00:00Z`) - 24 * 3600e3).toISOString().slice(0, 10)
}
const round2 = (x: number) => Math.round(x * 100) / 100
const pct = (p: number) => `${Math.round(p * 100)}%`
