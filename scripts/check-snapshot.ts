import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { buildSnapshot, assertNoLeak } from '../src/core/snapshot'
import { knotToMph, parseIemValue, loadFields, loadForecastRuns, loadObservation } from '../src/core/weather'
import type { Field, ForecastRun, HourlyPoint, Observation, Snapshot } from '../src/core/types'

const field: Field = { id: 'f1', name: 'F1', farmId: 'farm1', lat: 41.6, lon: -93.6, elevationM: 290, acres: 80, crop: 'corn', stationId: 'DSM' }
const pt = (time: string): HourlyPoint => ({ time, tempF: 50, windMph: 5, gustMph: 8, precipIn: 0 })
const run = (model: string, issuedAt: string): ForecastRun => ({ model, issuedAt, hourly: [pt(issuedAt)] })

const t0 = '2026-06-09T23:00:00Z'
const runs = [
  run('a', '2026-06-09T06:00:00Z'), run('a', '2026-06-09T12:00:00Z'),
  run('b', '2026-06-09T12:00:00Z'), run('b', '2026-06-10T00:00:00Z'),
]
const obs: Observation = {
  stationId: 'DSM',
  hourly: ['2026-06-09T21:00:00Z', '2026-06-09T22:00:00Z', '2026-06-09T23:00:00Z', '2026-06-10T00:00:00Z'].map(pt),
}
const snap = buildSnapshot(field, t0, runs, obs)

// (a)
assert.ok(snap.obsUntilT0.every(h => Date.parse(h.time) <= Date.parse(t0)), 'obs <= t0')
assert.equal(snap.obsUntilT0.length, 3)
// (b)
assert.ok(snap.forecasts.every(f => Date.parse(f.issuedAt) <= Date.parse(t0)), 'issuedAt <= t0')
// (c)
assert.ok(!snap.forecasts.some(f => f.issuedAt === '2026-06-10T00:00:00Z'), 'future run excluded')
assert.ok(snap.forecasts.some(f => f.model === 'b' && f.issuedAt === '2026-06-09T12:00:00Z'), '12Z run kept')
// (d)
assert.equal(knotToMph(10), 11.51)
assert.equal(knotToMph(null), null)
assert.equal(parseIemValue('M'), null)
assert.equal(parseIemValue(''), null)
assert.equal(parseIemValue('12.5'), 12.5)
// (e)
const models = snap.forecasts.map(f => f.model)
assert.equal(new Set(models).size, models.length, 'one run per model')
assert.equal(snap.forecasts.find(f => f.model === 'a')?.issuedAt, '2026-06-09T12:00:00Z', 'latest run per model')
assert.equal(snap.id, 'snap-f1-20260609t230000z')
// (f)
assert.ok(!snap.obsUntilT0.some(h => h.time === '2026-06-10T00:00:00Z'), 'obs 1h after t0 filtered')
assert.deepEqual(assertNoLeak(snap), [])
const leaking: Snapshot = { ...snap, forecasts: [run('x', '2026-06-10T00:00:00Z')], obsUntilT0: [pt('2026-06-10T00:00:00Z')] }
assert.ok(assertNoLeak(leaking).length >= 2, 'leak detected')
console.log('synthetic checks: OK')

// Fixture-based check (only if present)
if (fs.existsSync(path.join(process.cwd(), 'fixtures', 'nowcasting', 'gust-block'))) {
  const fields = loadFields()
  const s = buildSnapshot(fields[0], '2026-06-10T13:00:00Z', loadForecastRuns('gust-block'), loadObservation('gust-block'))
  assert.equal(new Set(s.forecasts.map(f => f.model)).size, 4, `expected 4 models, got ${s.forecasts.map(f => f.model)}`)
  assert.deepEqual(assertNoLeak(s), [])
  console.log('fixture check gust-block: OK', s.id, s.forecasts.map(f => f.model).join(','))
} else {
  console.log('NOTE: fixtures/nowcasting/gust-block absent; fixture check skipped')
}
console.log('ALL OK')
