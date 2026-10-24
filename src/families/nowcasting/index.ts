import { z } from 'zod'
import type { Answer, Family, Field, ForecastRun, HourlyPoint, Observation, Score, Snapshot, Task } from '../../core/types'
import { assertNoLeak, buildSnapshot } from '../../core/snapshot'
import { SCENARIOS, loadFields, loadForecastRuns, loadObservation, type ScenarioId } from '../../core/weather'
import { DEFAULT_RULES, evaluateWindow } from './rules'

const COST_USD_PER_ACRE = 7
const LOSS_USD_PER_ACRE = 31
const HOUR_MS = 3_600_000

export const answerSchema = z
  .object({
    probability: z.number().min(0).max(1),
    decision: z.enum(['spray', 'delay']),
    rationale: z.string(),
  })
  .passthrough()

function violationOf(hourly: HourlyPoint[], t0: string): boolean {
  return evaluateWindow(hourly, t0).violation
}

/** Laplace-smoothed share of models whose forecast window violates: (k + 0.5) / (n + 1). 0.5 when n = 0. */
export function referenceProbability(snapshot: Snapshot): number {
  const n = snapshot.forecasts.length
  if (n === 0) return 0.5
  const k = snapshot.forecasts.filter((f) => violationOf(f.hourly, snapshot.t0)).length
  return (k + 0.5) / (n + 1)
}

function difficultyOf(pRef: number): Task['difficulty'] {
  const d = Math.abs(pRef - 0.5)
  return d < 0.2 ? 'hard' : d < 0.4 ? 'medium' : 'easy'
}

export const nowcasting: Family = {
  id: 'nowcasting',

  generate({ fields, snapshots, count = 30 }) {
    const byId = new Map(fields.map((f) => [f.id, f]))
    const tasks: Task[] = []
    for (const snapshot of snapshots) {
      if (tasks.length >= count) break
      const field = byId.get(snapshot.fieldId)
      if (!field) continue
      const n = String(tasks.length + 1).padStart(4, '0')
      tasks.push({
        id: `task-nc-${n}`,
        family: 'nowcasting',
        t0: snapshot.t0,
        resolveAt: new Date(Date.parse(snapshot.t0) + 4 * HOUR_MS).toISOString(),
        field,
        snapshotId: snapshot.id,
        difficulty: difficultyOf(referenceProbability(snapshot)),
        prompt: `필지 ${field.name}(${field.acres} acre)에서 지금 살포(spray)할지 3시간 연기(delay)할지 결정하라. 향후 4시간 동안 살포 조건(풍속 3-10 mph, 돌풍 15 mph 이하, 무강우)이 깨질 확률과 결정을 제출하라.`,
        context: { costUsdPerAcre: COST_USD_PER_ACRE, lossUsdPerAcre: LOSS_USD_PER_ACRE, rules: DEFAULT_RULES },
      })
    }
    return tasks
  },

  answerSchema,

  score(task: Task, answer: Answer, obs: Observation, snapshot: Snapshot): Score {
    const p = answer.probability ?? 0.5
    const y = violationOf(obs.hourly, task.t0) ? 1 : 0
    const brier = (p - y) ** 2
    const costUsd = answer.decision === 'spray' ? y * LOSS_USD_PER_ACRE : COST_USD_PER_ACRE
    const oracleCostUsd = y ? COST_USD_PER_ACRE : 0
    const brierRef = (referenceProbability(snapshot) - y) ** 2
    // Matching the reference exactly is zero skill, even when both Briers are 0 (1 - 0/1e-6 would give +1).
    const skill = brier === brierRef ? 0 : 1 - brier / brierRef
    return {
      taskId: task.id,
      model: answer.model,
      family: 'nowcasting',
      brier,
      regretUsd: costUsd - oracleCostUsd,
      costUsd,
      oracleCostUsd,
      skill,
      correct: (answer.decision === 'delay') === (y === 1),
      leakFlags: assertNoLeak(snapshot),
      resolvedWith: { stationId: obs.stationId, at: task.resolveAt },
    }
  },
}

// ---- demo data ---------------------------------------------------------------
// Scenario is encoded as the suffix of snapshotId: `<buildSnapshot id>@<scenario>`.
// This keeps tasks self-describing so the score route can rebuild snapshot + observation statelessly.

export const DEMO_T0S: string[] = Array.from({ length: 11 }, (_, i) => `2026-06-10T${String(12 + i).padStart(2, '0')}:00:00.000Z`)

export function scenarioOfSnapshotId(snapshotId: string): ScenarioId {
  const s = snapshotId.split('@')[1]
  if (!(SCENARIOS as readonly string[]).includes(s)) throw new Error(`cannot infer scenario from snapshotId: ${snapshotId}`)
  return s as ScenarioId
}

export function buildScenarioSnapshot(field: Field, t0: string, scenario: ScenarioId, runs: ForecastRun[], obs: Observation): Snapshot {
  const snap = buildSnapshot(field, t0, runs, obs)
  return { ...snap, id: `${snap.id}@${scenario}` }
}

/** Deterministic order: t0 (hourly) -> scenario -> field. */
export function buildDemoTasks(count = 30): { tasks: Task[]; snapshots: Snapshot[] } {
  const fields = loadFields()
  const data = SCENARIOS.map((s) => ({ s, runs: loadForecastRuns(s), obs: loadObservation(s) }))
  const snapshots: Snapshot[] = []
  for (const t0 of DEMO_T0S)
    for (const { s, runs, obs } of data)
      for (const field of fields) snapshots.push(buildScenarioSnapshot(field, t0, s, runs, obs))
  const tasks = nowcasting.generate({ fields, snapshots, count })
  const used = new Set(tasks.map((t) => t.snapshotId))
  return { tasks, snapshots: snapshots.filter((s) => used.has(s.id)) }
}

export function loadObservationForTask(task: Task): Observation {
  return loadObservation(scenarioOfSnapshotId(task.snapshotId))
}

/** Rebuild the snapshot a task was generated from. */
export function loadSnapshotForTask(task: Task): Snapshot {
  const scenario = scenarioOfSnapshotId(task.snapshotId)
  return buildScenarioSnapshot(task.field, task.t0, scenario, loadForecastRuns(scenario), loadObservation(scenario))
}
