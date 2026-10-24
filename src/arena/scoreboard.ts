// 점수표 집계: 모델 × 패밀리 평균, 모델별 종합. Brier·CRPS·regret은 낮을수록, skill은 높을수록 좋음.
import type { FamilyId, ModelId, Score } from '../core/types'

export interface Cell {
  model: ModelId; family: FamilyId | 'all'
  n: number
  brier?: number; crps?: number; regretUsd?: number
  skill: number
  accuracy?: number            // correct가 있는 점수 중 맞은 비율
  leaks: number                // leakFlags가 하나라도 있는 점수 수
}

const mean = (xs: (number | undefined)[]) => {
  const v = xs.filter((x): x is number => typeof x === 'number' && Number.isFinite(x))
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : undefined
}

function cell(model: ModelId, family: Cell['family'], scores: Score[]): Cell {
  const judged = scores.filter(s => typeof s.correct === 'boolean')
  return {
    model, family, n: scores.length,
    brier: mean(scores.map(s => s.brier)),
    crps: mean(scores.map(s => s.crps)),
    regretUsd: mean(scores.map(s => s.regretUsd)),
    skill: mean(scores.map(s => s.skill)) ?? 0,
    accuracy: judged.length ? judged.filter(s => s.correct).length / judged.length : undefined,
    leaks: scores.filter(s => s.leakFlags.length > 0).length,
  }
}

const groupBy = <T, K>(xs: T[], key: (x: T) => K) => {
  const m = new Map<K, T[]>()
  for (const x of xs) m.set(key(x), [...(m.get(key(x)) ?? []), x])
  return m
}

// 모델 × 패밀리 표
export function scoreboard(scores: Score[]): Cell[] {
  return [...groupBy(scores, s => `${s.model}|${s.family}`).values()]
    .map(g => cell(g[0].model, g[0].family, g))
    .sort((a, b) => a.model.localeCompare(b.model) || a.family.localeCompare(b.family))
}

// 리더보드: 패밀리별 평균 skill을 다시 평균 (과제 수가 많은 패밀리가 순위를 좌우하지 않게)
export function leaderboard(scores: Score[]): (Cell & { rank: number })[] {
  const byFamily = scoreboard(scores)
  return [...groupBy(scores, s => s.model).entries()]
    .map(([model, g]) => ({ ...cell(model, 'all', g), skill: mean(byFamily.filter(c => c.model === model).map(c => c.skill)) ?? 0 }))
    .sort((a, b) => b.skill - a.skill)
    .map((c, i) => ({ ...c, rank: i + 1 }))
}

// "최고 모델도 틀린 과제 비율": 리더보드 1위 모델이 correct=false인 과제 비율
export function topModelMissRate(scores: Score[]): { model: ModelId; missRate: number; n: number } | undefined {
  const top = leaderboard(scores)[0]
  if (!top) return undefined
  const judged = scores.filter(s => s.model === top.model && typeof s.correct === 'boolean')
  if (!judged.length) return undefined
  return { model: top.model, missRate: judged.filter(s => !s.correct).length / judged.length, n: judged.length }
}
