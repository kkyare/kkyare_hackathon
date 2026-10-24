import type { HourlyPoint } from '../../core/types'

// 데모 가정값, PLAN 판정 기준 + 성호 확정 rainfast 4h.
export const DEFAULT_RULES = {
  windMinMph: 3,
  windMaxMph: 10,
  gustCautionMph: 10,
  rainfastHours: 4,
  rainIn: 0.01,
}

export type SprayStatus = 'GO' | 'CAUTION' | 'NO_GO'
export type ReasonCode =
  | 'WIND_LOW_INVERSION'
  | 'WIND_LOW'
  | 'WIND_HIGH'
  | 'GUST_HIGH'
  | 'RAIN_WITHIN_RAINFAST'
  | 'MISSING_DATA'

type Evaluation = { status: SprayStatus; reasons: ReasonCode[] }

const severity: Record<SprayStatus, number> = { GO: 0, CAUTION: 1, NO_GO: 2 }

export function isNightUtc(time: string): boolean {
  const hour = new Date(time).getUTCHours()
  return hour >= 0 && hour <= 11
}

export function evaluateHour(
  p: HourlyPoint,
  rules = DEFAULT_RULES,
): Evaluation {
  const reasons: ReasonCode[] = []
  let status: SprayStatus = 'GO'
  const add = (next: SprayStatus, reason: ReasonCode) => {
    reasons.push(reason)
    if (severity[next] > severity[status]) status = next
  }

  if (p.windMph === null) add('CAUTION', 'MISSING_DATA')
  else if (p.windMph < rules.windMinMph) {
    add(isNightUtc(p.time) ? 'NO_GO' : 'CAUTION', isNightUtc(p.time) ? 'WIND_LOW_INVERSION' : 'WIND_LOW')
  } else if (p.windMph > rules.windMaxMph) add('NO_GO', 'WIND_HIGH')

  if (p.gustMph !== null && p.gustMph > rules.gustCautionMph) {
    add('CAUTION', 'GUST_HIGH')
  }
  return { status, reasons }
}

export function evaluateWindow(
  points: HourlyPoint[],
  start: string,
  rules = DEFAULT_RULES,
): {
  violation: boolean
  status: SprayStatus
  reasons: ReasonCode[]
  hours: { time: string; status: SprayStatus; reasons: ReasonCode[] }[]
} {
  const startMs = Date.parse(start)
  const endMs = startMs + rules.rainfastHours * 60 * 60 * 1000
  const window = points.filter((p) => {
    const time = Date.parse(p.time)
    return time >= startMs && time < endMs
  })
  const hours = window.map((point) => ({ time: point.time, ...evaluateHour(point, rules) }))
  const reasons = [...new Set(hours.flatMap((hour) => hour.reasons))]
  let status = hours.reduce<SprayStatus>(
    (worst, hour) => severity[hour.status] > severity[worst] ? hour.status : worst,
    'GO',
  )
  let violation =
    hours.some((hour) => hour.status === 'NO_GO') ||
    window.some((point) => point.gustMph !== null && point.gustMph > rules.gustCautionMph + 5)

  if (window.some((point) => point.precipIn === null) || window.length < rules.rainfastHours) {
    if (!reasons.includes('MISSING_DATA')) reasons.push('MISSING_DATA')
    if (severity.CAUTION > severity[status]) status = 'CAUTION'
  }
  const precipitation = window.reduce((sum, point) => sum + (point.precipIn ?? 0), 0)
  if (precipitation > rules.rainIn) {
    reasons.push('RAIN_WITHIN_RAINFAST')
    status = 'NO_GO'
    violation = true
  }

  return { violation, status, reasons, hours }
}
