import assert from 'node:assert/strict'
import { answerSchema, aggregateS2sObservation, buildS2sTasks, loadS2sDailyFixture, loadS2sOutlook, s2s } from '../src/families/s2s/index'

const outlook = loadS2sOutlook()
const dailyFixture = loadS2sDailyFixture()
const field = {
  id: 'field-s2s-test',
  name: 'S2S test field',
  farmId: 'farm-s2s-test',
  lat: 41.53,
  lon: -93.65,
  elevationM: 280,
  acres: 100,
  crop: 'corn' as const,
  stationId: outlook.stationId,
}
const [task] = buildS2sTasks([field])
assert.ok(task)
const rules = task.context.rules
assert.ok(rules)
assert.equal((rules.validToMs - rules.validFromMs) / 86_400_000, 14)
assert.equal(new Date(rules.validFromMs).toISOString().slice(0, 10), outlook.validFrom)
assert.equal(new Date(rules.validToMs - 1).toISOString().slice(0, 10), outlook.validTo)
assert.equal(task.t0, outlook.issuedAt)
assert.equal(task.resolveAt, '2026-06-12T23:59:59.000Z')

const dates = dailyFixture.daily
  .filter(({ date }) => date >= outlook.validFrom && date <= outlook.validTo)
  .map(({ date }) => date)
assert.equal(dates.length, 14)
const mean = dailyFixture.daily
  .filter(({ date }) => date >= outlook.validFrom && date <= outlook.validTo)
  .reduce((sum, entry) => sum + entry.tmeanF, 0) / 14
assert.ok(mean > rules.aboveF)

const shiftedCopy = dailyFixture.daily.map((entry, index) => ({
  ...entry,
  date: index === 0 ? '2026-05-29' : entry.date,
}))
assert.throws(() => aggregateS2sObservation(task, shiftedCopy), /exactly 14 days/)

const score = s2s.score(
  task,
  {
    taskId: task.id,
    model: 'check',
    terciles: outlook.terciles,
    decision: 'plant_now',
    rationale: 'check',
    toolCalls: [],
  },
  { stationId: outlook.stationId, hourly: [] },
  { id: task.snapshotId, t0: task.t0, fieldId: field.id, forecasts: [], obsUntilT0: [] },
)
assert.equal(score.skill, 0)
assert.equal(score.correct, true)
const belowPrediction = s2s.score(
  task,
  { taskId: task.id, model: 'check', terciles: [0.6, 0.3, 0.1], decision: 'wait', rationale: 'check', toolCalls: [] },
  { stationId: outlook.stationId, hourly: [] },
  { id: task.snapshotId, t0: task.t0, fieldId: field.id, forecasts: [], obsUntilT0: [] },
)
assert.equal(belowPrediction.correct, false)
const abovePrediction = s2s.score(
  task,
  { taskId: task.id, model: 'check', terciles: [0.1, 0.3, 0.6], decision: 'plant_now', rationale: 'check', toolCalls: [] },
  { stationId: outlook.stationId, hourly: [] },
  { id: task.snapshotId, t0: task.t0, fieldId: field.id, forecasts: [], obsUntilT0: [] },
)
assert.equal(abovePrediction.correct, true)
assert.equal(answerSchema.safeParse({ terciles: [0.25, 0.33, 0.42], decision: 'plant_now', rationale: 'check' }).success, true)
assert.equal(answerSchema.safeParse({ terciles: [0.3, 0.4, 0.4], decision: 'wait', rationale: 'check' }).success, false)

console.log('S2S checks passed')
