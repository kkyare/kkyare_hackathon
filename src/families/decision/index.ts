// ④ 의사결정: "오늘 밤 서리 방제할까" → 비용-손실 regret(오라클 대비) + Brier + 원천 예보 대비 스킬
import { z } from 'zod'
import { brier, normalCdf, optimalProtect, regret, skillScore } from '../../core/scoring'
import type { Answer, Family, Field, Observation, Score, Snapshot, Task } from '../../core/types'
import { fieldMinDistribution, minTemp, rawGridMin, round1 } from '../downscaling/model'

export const FROST_F = 32
export const DEFAULT_COST = 120 // $/acre, 가정 (PLAN 9-4)
export const DEFAULT_LOSS = 1200 // $/acre, 가정

export const answerSchema = z.object({
  probability: z.number().min(0).max(1),
  decision: z.enum(['protect', 'none']),
  rationale: z.string(),
})

/** 원천 예보 기준 확률: 보정 없는 격자 최저기온이 서리 기준 이하인 모델 비율 (0.05-0.95로 자름) */
export function referenceProbability(snapshot: Snapshot): number {
  const mins = snapshot.forecasts.map(rawGridMin).filter((v): v is number => v !== null)
  const frac = mins.filter((m) => m <= FROST_F).length / mins.length
  return Math.min(0.95, Math.max(0.05, frac))
}

export function generate({ fields, snapshots, count }: { fields: Field[]; snapshots: Snapshot[]; count?: number }): Task[] {
  const byId = new Map(fields.map((f) => [f.id, f]))
  const tasks: Task[] = []
  for (const snap of snapshots) {
    const field = byId.get(snap.fieldId)
    if (!field) continue
    const dist = fieldMinDistribution(field, snap)
    const gap = Math.abs(dist.mean - FROST_F)
    tasks.push({
      id: `task-dc-${String(tasks.length + 1).padStart(4, '0')}`,
      family: 'decision',
      t0: snap.t0,
      resolveAt: new Date(Date.parse(snap.t0) + 24 * 3600e3).toISOString().replace('.000Z', 'Z'),
      field,
      snapshotId: snap.id,
      prompt:
        `${field.name} (${field.crop}, ${field.acres} acre). 오늘 밤 서리(최저 ≤ ${FROST_F}°F) 방제를 할지 결정하라. ` +
        `방제 비용 $${DEFAULT_COST}/acre, 서리 피해 $${DEFAULT_LOSS}/acre (가정). ` +
        `P(서리)와 결정(protect | none)을 제출하라.`,
      context: { costUsdPerAcre: DEFAULT_COST, lossUsdPerAcre: DEFAULT_LOSS, thresholdF: FROST_F },
      difficulty: gap < 2 ? 'hard' : gap < 5 ? 'medium' : 'easy',
    })
    if (count && tasks.length >= count) break
  }
  return tasks
}

export function engineAnswer(task: Task, snapshot: Snapshot): Answer {
  const dist = fieldMinDistribution(task.field, snapshot)
  const p = normalCdf(FROST_F, dist.mean, dist.sigma)
  const C = task.context.costUsdPerAcre ?? DEFAULT_COST
  const L = task.context.lossUsdPerAcre ?? DEFAULT_LOSS
  return {
    taskId: task.id,
    model: 'engine-downscale-v0',
    probability: Math.round(p * 100) / 100,
    decision: optimalProtect(p, C, L) ? 'protect' : 'none',
    rationale: `필지 보정 최저 ${round1(dist.mean)}°F ± ${round1(dist.sigma)} → P(서리) ${Math.round(p * 100)}%, 기준 C/L = ${C / L}`,
    toolCalls: [],
  }
}

export function score(task: Task, answer: Answer, obs: Observation, snapshot: Snapshot): Score {
  const observed = minTemp(obs.hourly, task.t0, task.resolveAt)
  const base: Score = { taskId: task.id, model: answer.model, family: 'decision', skill: 0, leakFlags: [] }
  if (observed === null || answer.probability === undefined) return base
  const happened = observed <= FROST_F
  const C = task.context.costUsdPerAcre ?? DEFAULT_COST
  const L = task.context.lossUsdPerAcre ?? DEFAULT_LOSS
  const protect = answer.decision === 'protect'
  const b = brier(answer.probability, happened)
  const ref = brier(referenceProbability(snapshot), happened)
  const r = regret(protect, happened, C, L)
  return {
    ...base,
    brier: Math.round(b * 1000) / 1000,
    ...r,
    skill: Math.round(skillScore(b, ref) * 100) / 100,
    correct: protect === happened,
    resolvedWith: { stationId: obs.stationId, at: task.resolveAt },
  }
}

export const decision: Family = { id: 'decision', generate, answerSchema, score }
