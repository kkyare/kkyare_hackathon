import assert from 'node:assert/strict'
import type { HourlyPoint } from '../src/core/types'
import { evaluateHour, evaluateWindow } from '../src/families/nowcasting/rules'

function point(
  hour: number,
  overrides: Partial<HourlyPoint> = {},
): HourlyPoint {
  return {
    time: new Date(Date.UTC(2026, 5, 1, hour)).toISOString(),
    tempF: 70,
    windMph: 5,
    gustMph: 5,
    precipIn: 0,
    ...overrides,
  }
}

const dayLow = evaluateHour(point(12, { windMph: 2.9 }))
assert.equal(dayLow.status, 'CAUTION')
assert.deepEqual(dayLow.reasons, ['WIND_LOW'])

const nightLow = evaluateHour(point(0, { windMph: 2.9 }))
assert.equal(nightLow.status, 'NO_GO')
assert.deepEqual(nightLow.reasons, ['WIND_LOW_INVERSION'])

assert.equal(evaluateHour(point(12, { windMph: 3.0 })).status, 'GO')
assert.equal(evaluateHour(point(12, { windMph: 10.0 })).status, 'GO')
assert.equal(evaluateHour(point(12, { windMph: 10.1 })).status, 'NO_GO')
assert.equal(evaluateHour(point(12, { gustMph: 10.0 })).status, 'GO')
assert.equal(evaluateHour(point(12, { gustMph: 10.1 })).status, 'CAUTION')

const start = '2026-06-01T12:00:00.000Z'
const fourHours = (override: Partial<HourlyPoint> = {}) =>
  Array.from({ length: 4 }, (_, i) => point(12 + i, i === 0 ? override : {}))

assert.equal(evaluateWindow(fourHours({ gustMph: 15.1 }), start).violation, true)
assert.equal(evaluateWindow(fourHours({ gustMph: 15.0 }), start).violation, false)
assert.equal(evaluateWindow(fourHours({ precipIn: 0.01 }), start).violation, false)
const rain = evaluateWindow(fourHours({ precipIn: 0.02 }), start)
assert.equal(rain.violation, true)
assert.ok(rain.reasons.includes('RAIN_WITHIN_RAINFAST'))

const short = evaluateWindow(fourHours().slice(0, 3), start)
assert.equal(short.violation, false)
assert.equal(short.status, 'CAUTION')
assert.ok(short.reasons.includes('MISSING_DATA'))

console.log('All nowcasting rule boundary checks passed.')
