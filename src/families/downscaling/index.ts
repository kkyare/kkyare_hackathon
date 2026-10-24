// ① 초국지 다운스케일링: "A필지 내일 아침 최저기온 분포를 제시하라" → CRPS + 원천 예보 대비 스킬
import { z } from 'zod'
import { crpsFromQuantiles, crpsPoint, skillScore } from '../../core/scoring'
import type { Answer, Family, Field, Observation, Score, Snapshot, Task } from '../../core/types'
import { fieldMinDistribution, minTemp, rawGridMeanMin, round1 } from './model'

export const answerSchema = z.object({
  quantiles: z.array(z.object({ q: z.number().min(0).max(1), value: z.number() })).min(1),
  rationale: z.string(),
})

function difficulty(snapshot: Snapshot, field: Field): Task['difficulty'] {
  // 원천 예보와 필지 보정값 차이가 클수록, 서리 경계(32°F)에 가까울수록 어렵다
  const dist = fieldMinDistribution(field, snapshot)
  const gap = Math.abs(rawGridMeanMin(snapshot) - dist.mean)
  const nearThreshold = Math.abs(dist.mean - 32) < 2
  if (gap >= 3 || nearThreshold) return 'hard'
  if (gap >= 1.5) return 'medium'
  return 'easy'
}

export function generate({ fields, snapshots, count }: { fields: Field[]; snapshots: Snapshot[]; count?: number }): Task[] {
  const byId = new Map(fields.map((f) => [f.id, f]))
  const tasks: Task[] = []
  for (const snap of snapshots) {
    const field = byId.get(snap.fieldId)
    if (!field) continue
    const resolveAt = new Date(Date.parse(snap.t0) + 24 * 3600e3).toISOString().replace('.000Z', 'Z')
    tasks.push({
      id: `task-ds-${String(tasks.length + 1).padStart(4, '0')}`,
      family: 'downscaling',
      t0: snap.t0,
      resolveAt,
      field,
      snapshotId: snap.id,
      prompt:
        `${field.name} (${field.crop}, 고도 ${field.elevationM}m, 지형 ${field.terrain ?? 'flat'}) 필지의 ` +
        `${snap.t0} 이후 24시간 최저기온(°F) 분포를 분위수 0.1/0.5/0.9로 제시하라. ` +
        `격자 예보는 도구로 조회할 수 있으며 격자 고도는 필지 고도와 다르다.`,
      context: { thresholdF: 32 },
      difficulty: difficulty(snap, field),
    })
    if (count && tasks.length >= count) break
  }
  return tasks
}

/** 우리 엔진(고도·지형 보정)의 답. 데모에서 "보정 엔진" 레인으로 쓴다 */
export function engineAnswer(task: Task, snapshot: Snapshot): Answer {
  const dist = fieldMinDistribution(task.field, snapshot)
  return {
    taskId: task.id,
    model: 'engine-downscale-v0',
    quantiles: dist.quantiles,
    rationale: `모델 ${dist.perModel.length}개 격자 최저기온을 고도·지형으로 보정, 평균 ${round1(dist.mean)}°F, σ ${round1(dist.sigma)}°F`,
    toolCalls: [],
  }
}

export function score(task: Task, answer: Answer, obs: Observation, snapshot: Snapshot): Score {
  const observed = minTemp(obs.hourly, task.t0, task.resolveAt)
  const base: Score = { taskId: task.id, model: answer.model, family: 'downscaling', skill: 0, leakFlags: [] }
  if (observed === null || !answer.quantiles?.length) return { ...base, skill: 0 }
  const crps = crpsFromQuantiles(answer.quantiles, observed)
  const reference = crpsPoint(rawGridMeanMin(snapshot), observed)
  const median = answer.quantiles.find((q) => q.q === 0.5)?.value
  return {
    ...base,
    crps: round1(crps * 100) / 100,
    skill: Math.round(skillScore(crps, reference) * 100) / 100,
    correct: median !== undefined ? (median <= 32) === (observed <= 32) : undefined,
    resolvedWith: { stationId: obs.stationId, at: task.resolveAt },
  }
}

export const downscaling: Family = { id: 'downscaling', generate, answerSchema, score }
