// 보정 곡선(reliability diagram)과 Brier 분해(Murphy): brier ≈ reliability - resolution + uncertainty
// reliability는 낮을수록(확률이 실제 빈도와 맞음), resolution은 높을수록(상황을 잘 구분함) 좋다.
import type { Answer, ModelId, Score } from '../core/types'

export interface Pair { model: ModelId; taskId: string; probability: number; outcome: 0 | 1 }

export interface Bin { lo: number; hi: number; n: number; meanProbability: number; frequency: number }

export interface Calibration {
  model: ModelId; n: number
  bins: Bin[]                 // n > 0인 구간만
  brier: number
  reliability: number; resolution: number; uncertainty: number
  baseRate: number
}

// Score.outcome이 없으면 brier = (p - o)²에서 역산한다 (p = 0.5면 구분 불가라 뺀다)
function outcomeOf(s: Score, p: number): 0 | 1 | undefined {
  if (s.outcome === 0 || s.outcome === 1) return s.outcome
  if (typeof s.brier !== 'number' || p === 0.5) return undefined
  return Math.abs(s.brier - (1 - p) ** 2) < Math.abs(s.brier - p ** 2) ? 1 : 0
}

export function pairsOf(answers: Answer[], scores: Score[]): Pair[] {
  const byKey = new Map(answers.map(a => [`${a.taskId}|${a.model}`, a]))
  const pairs: Pair[] = []
  for (const s of scores) {
    const p = byKey.get(`${s.taskId}|${s.model}`)?.probability
    if (typeof p !== 'number' || !Number.isFinite(p)) continue
    const outcome = outcomeOf(s, p)
    if (outcome !== undefined) pairs.push({ model: s.model, taskId: s.taskId, probability: Math.min(1, Math.max(0, p)), outcome })
  }
  return pairs
}

export function calibrate(pairs: Pair[], binCount = 10): Calibration[] {
  const models = [...new Set(pairs.map(p => p.model))]
  return models.map(model => {
    const ps = pairs.filter(p => p.model === model)
    const n = ps.length
    const baseRate = ps.reduce((a, p) => a + p.outcome, 0) / n
    const raw = Array.from({ length: binCount }, (_, i) => ({ lo: i / binCount, hi: (i + 1) / binCount, items: [] as Pair[] }))
    for (const p of ps) raw[Math.min(binCount - 1, Math.floor(p.probability * binCount))].items.push(p)

    const bins: Bin[] = raw.filter(b => b.items.length).map(b => ({
      lo: b.lo, hi: b.hi, n: b.items.length,
      meanProbability: b.items.reduce((a, p) => a + p.probability, 0) / b.items.length,
      frequency: b.items.reduce((a, p) => a + p.outcome, 0) / b.items.length,
    }))
    return {
      model, n, bins, baseRate,
      brier: ps.reduce((a, p) => a + (p.probability - p.outcome) ** 2, 0) / n,
      reliability: bins.reduce((a, b) => a + b.n * (b.meanProbability - b.frequency) ** 2, 0) / n,
      resolution: bins.reduce((a, b) => a + b.n * (b.frequency - baseRate) ** 2, 0) / n,
      uncertainty: baseRate * (1 - baseRate),
    }
  })
}
