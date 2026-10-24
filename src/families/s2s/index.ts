import { z } from 'zod'
import type { Answer, Family, Field, Observation, Score, Snapshot, Task } from '../../core/types'

const DAY_MS = 86_400_000
const OUTLOOK_PATH = '../../../fixtures/s2s/cpc-week34-2026-05-15.json'
const OBSERVATION_PATH = '../../../fixtures/s2s/obs-daily-dsm-2026.json'

interface S2sOutlook {
  demo: boolean
  product: string
  issuedAt: string
  validFrom: string
  validTo: string
  normalsBasis: string
  stationId: string
  boundariesF: { below: number; above: number }
  terciles: [number, number, number]
}

interface DailyObservation {
  date: string
  tmeanF: number
}

interface S2sDailyFixture {
  demo: boolean
  stationId: string
  daily: DailyObservation[]
}

const tercilesSchema = z.tuple([
  z.number().min(0).max(1),
  z.number().min(0).max(1),
  z.number().min(0).max(1),
]).refine((values) => Math.abs(values.reduce((sum, value) => sum + value, 0) - 1) <= 1e-6)

export const answerSchema = z.object({
  terciles: tercilesSchema,
  decision: z.enum(['plant_now', 'wait']),
  rationale: z.string(),
}).passthrough()

export function loadS2sOutlook(): S2sOutlook {
  return require(OUTLOOK_PATH) as S2sOutlook
}

function loadDailyFixture(): S2sDailyFixture {
  return require(OBSERVATION_PATH) as S2sDailyFixture
}

function isoDateMs(date: string): number {
  return Date.parse(`${date}T00:00:00Z`)
}

function windowBounds(task: Task): { validFromMs: number; validToMs: number; belowF: number; aboveF: number } {
  const rules = task.context.rules
  if (!rules) throw new Error('S2S task is missing window rules')
  const { validFromMs, validToMs, belowF, aboveF } = rules
  if (![validFromMs, validToMs, belowF, aboveF].every(Number.isFinite)) throw new Error('S2S task has invalid window rules')
  return { validFromMs, validToMs, belowF, aboveF }
}

export function aggregateS2sObservation(task: Task, daily: DailyObservation[]): { mean: number; stationId: string } {
  const { validFromMs, validToMs } = windowBounds(task)
  const selected = daily.filter(({ date }) => {
    const dateMs = isoDateMs(date)
    return dateMs >= validFromMs && dateMs <= validToMs
  })
  const expectedDays = Math.round((validToMs - validFromMs) / DAY_MS)
  const fullSpanDays = daily.length === 0
    ? 0
    : (Math.max(...daily.map(({ date }) => isoDateMs(date))) - Math.min(...daily.map(({ date }) => isoDateMs(date)))) / DAY_MS + 1
  if (expectedDays !== 14 || fullSpanDays !== 14 || selected.length !== 14 || new Set(selected.map((entry) => entry.date)).size !== 14)
    throw new Error('S2S observation window must contain exactly 14 days')
  return {
    mean: selected.reduce((sum, entry) => sum + entry.tmeanF, 0) / selected.length,
    stationId: loadDailyFixture().stationId,
  }
}

function observationForTask(task: Task, daily = loadDailyFixture().daily): Observation {
  const selected = aggregateS2sObservation(task, daily)
  return {
    stationId: selected.stationId,
    hourly: [{ time: task.resolveAt, tempF: selected.mean, windMph: null, gustMph: null, precipIn: null }],
  }
}

function categoryFor(mean: number, belowF: number, aboveF: number): 0 | 1 | 2 {
  if (mean < belowF) return 0
  if (mean > aboveF) return 2
  return 1
}

function brierFor(probabilities: readonly number[], category: 0 | 1 | 2): number {
  return probabilities.reduce((sum, probability, index) => sum + (probability - (index === category ? 1 : 0)) ** 2, 0)
}

export function buildS2sTasks(fields: Field[]): Task[] {
  return s2s.generate({ fields, snapshots: [] })
}

export const s2s: Family = {
  id: 's2s',

  generate({ fields }) {
    const outlook = loadS2sOutlook()
    const validFromMs = isoDateMs(outlook.validFrom)
    const validToMs = isoDateMs(outlook.validTo) + DAY_MS
    const validDays = (validToMs - validFromMs) / DAY_MS
    if (validDays !== 14) throw new Error('S2S outlook window must contain exactly 14 days')
    return fields.map((field, index) => ({
      id: `task-s2s-${String(index + 1).padStart(4, '0')}`,
      family: 's2s',
      t0: outlook.issuedAt,
      resolveAt: new Date(validToMs - 1_000).toISOString(),
      field,
      snapshotId: `s2s-${field.id}-${outlook.validFrom}-${outlook.validTo}`,
      prompt: `${outlook.validFrom}~${outlook.validTo} (14일) 평균기온이 1991-2020 평년 대비 낮음/보통/높음일 확률을 제시하고 파종 결정(plant_now|wait)을 내라`,
      context: {
        rules: { validFromMs, validToMs, belowF: outlook.boundariesF.below, aboveF: outlook.boundariesF.above },
      },
    }))
  },

  answerSchema,

  score(task: Task, answer: Answer, obs: Observation, _snapshot: Snapshot): Score {
    const { belowF, aboveF } = windowBounds(task)
    const fixture = loadDailyFixture()
    const window = aggregateS2sObservation(task, fixture.daily)
    const category = categoryFor(window.mean, belowF, aboveF)
    const probabilities = answer.terciles ?? [1 / 3, 1 / 3, 1 / 3]
    const reference = loadS2sOutlook().terciles
    const brier = brierFor(probabilities, category)
    const brierRef = brierFor(reference, category)
    const skill = brier === brierRef ? 0 : Math.max(-1, Math.min(1, 1 - brier / Math.max(brierRef, 1e-6)))
    const predictedCategory = probabilities.reduce(
      (bestIndex, probability, index) => probability > probabilities[bestIndex] ? index : bestIndex,
      0,
    )
    return {
      taskId: task.id,
      model: answer.model,
      family: 's2s',
      brier,
      skill,
      correct: predictedCategory === category,
      leakFlags: [],
      resolvedWith: { stationId: obs.stationId || window.stationId, at: task.resolveAt },
    }
  },
}

export function loadS2sObservationForTask(task: Task): Observation {
  return observationForTask(task)
}

export function loadS2sDailyFixture(): S2sDailyFixture {
  return loadDailyFixture()
}
