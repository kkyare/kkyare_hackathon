import { describe, expect, it } from 'vitest'
import { calibrate, pairsOf, type Pair } from './calibration'
import { buildTaskPack, dataCard, toJsonl } from './export'
import type { Answer, Observation, Score, Task } from '../core/types'
import { snapshot, task } from '../core/__fixtures__/mini'

describe('calibration', () => {
  const pair = (model: string, probability: number, outcome: 0 | 1, i: number): Pair => ({ model, taskId: `t${i}`, probability, outcome })

  it('완벽하게 보정된 모델은 reliability 0, brier 분해가 맞는다', () => {
    // 0.2 구간 10개 중 2개 발생, 0.8 구간 10개 중 8개 발생
    const pairs = [
      ...Array.from({ length: 10 }, (_, i) => pair('opus', 0.2, i < 2 ? 1 : 0, i)),
      ...Array.from({ length: 10 }, (_, i) => pair('opus', 0.8, i < 8 ? 1 : 0, 10 + i)),
    ]
    const [c] = calibrate(pairs)
    expect(c.bins.map(b => b.n)).toEqual([10, 10])
    c.bins.forEach((b, i) => {
      expect(b.meanProbability).toBeCloseTo([0.2, 0.8][i])
      expect(b.frequency).toBeCloseTo([0.2, 0.8][i])
    })
    expect(c.reliability).toBeCloseTo(0)
    expect(c.baseRate).toBeCloseTo(0.5)
    expect(c.brier).toBeCloseTo(c.reliability - c.resolution + c.uncertainty)
  })

  it('과신하는 모델은 reliability가 크다, p=1은 마지막 구간', () => {
    const pairs = Array.from({ length: 10 }, (_, i) => pair('haiku', 1, i < 5 ? 1 : 0, i))
    const [c] = calibrate(pairs)
    expect(c.bins).toHaveLength(1)
    expect(c.bins[0].lo).toBe(0.9)
    expect(c.reliability).toBeCloseTo(0.25)
  })

  it('pairsOf: Score.outcome을 쓰고, 없으면 brier에서 역산 (p=0.5는 제외)', () => {
    const a = (taskId: string, probability: number): Answer => ({ taskId, model: 'm', probability, rationale: '', toolCalls: [] })
    const s = (taskId: string, extra: Partial<Score>): Score => ({ taskId, model: 'm', family: 'decision', skill: 0, leakFlags: [], ...extra })
    const pairs = pairsOf(
      [a('t1', 0.3), a('t2', 0.3), a('t3', 0.5), a('t4', 0.9)],
      [s('t1', { outcome: 1 }), s('t2', { brier: 0.49 }), s('t3', { brier: 0.25 }), s('t4', { brier: 0.81 }), s('t5', { outcome: 1 })],
    )
    expect(pairs.map(p => [p.taskId, p.outcome])).toEqual([['t1', 1], ['t2', 1], ['t4', 0]])
  })
})

describe('export', () => {
  const t2: Task = { ...task, id: 'task-dc-0002', t0: '2026-05-14T00:00:00Z', resolveAt: '2026-05-14T14:00:00Z', family: 'downscaling' }
  const otherSnap = { ...snapshot, id: 'snap-unused' }
  const obs: Observation = {
    stationId: 'DSM',
    hourly: ['2026-05-11T23:00:00Z', '2026-05-12T06:00:00Z', '2026-05-12T20:00:00Z'].map(time => ({ time, tempF: 31, windMph: 3, gustMph: null, precipIn: 0 })),
  }
  const t2Obs: Observation = { stationId: 'DSM', hourly: [{ time: '2026-05-14T05:00:00Z', tempF: 40, windMph: 3, gustMph: null, precipIn: 0 }] }
  // 같은 관측소(DSM)라도 과제마다 다른 관측
  const resolutionFor = (t: Task) => (t.id === task.id ? obs : t2Obs)

  it('참조하는 스냅샷만 담고, 정답은 과제 순서대로 t0~resolveAt 구간', () => {
    const pack = buildTaskPack([task, t2], { snapshots: [snapshot, otherSnap], resolutionFor })
    expect(pack.snapshots.map(s => s.id)).toEqual([snapshot.id])
    expect(pack.resolutions!.map(o => o.hourly.map(h => h.time))).toEqual([['2026-05-12T06:00:00Z'], ['2026-05-14T05:00:00Z']])
    expect(pack.families).toEqual(['decision', 'downscaling'])
    expect(pack.meta).toMatchObject({ count: 2, marketValueUsd: 200, period: '2026-05-12 ~ 2026-05-14', demo: true, includesResolution: true })
  })

  it('비공개 평가셋은 정답을 뺀다', () => {
    const pack = buildTaskPack([task], { snapshots: [snapshot], resolutionFor, holdout: true })
    expect(pack.resolutions).toBeUndefined()
    expect(pack.meta.includesResolution).toBe(false)
    expect(toJsonl(pack)).not.toContain('"resolution"')
  })

  it('정답을 하나도 못 찾으면 includesResolution false', () => {
    const pack = buildTaskPack([task], { snapshots: [snapshot], resolutionFor: () => undefined })
    expect(pack.meta.includesResolution).toBe(false)
    expect(pack.resolutions).toBeUndefined()
  })

  it('스냅샷이 없으면 실패', () => {
    expect(() => buildTaskPack([{ ...task, snapshotId: 'nope' }], { snapshots: [snapshot] })).toThrow('nope')
    expect(() => buildTaskPack([], { snapshots: [] })).toThrow()
  })

  it('JSONL: 한 줄에 과제 하나, 스냅샷 포함, 정답은 t0~resolveAt 구간만', () => {
    const pack = buildTaskPack([task], { snapshots: [snapshot], resolutionFor })
    const lines = toJsonl(pack).trim().split('\n').map(l => JSON.parse(l))
    expect(lines).toHaveLength(1)
    expect(lines[0].snapshot.id).toBe(snapshot.id)
    expect(lines[0].resolution.hourly.map((h: { time: string }) => h.time)).toEqual(['2026-05-12T06:00:00Z'])
  })

  it('데이터 카드에 개수·가정·baseline이 들어간다', () => {
    const pack = buildTaskPack([task, t2], { snapshots: [snapshot] })
    const md = dataCard(pack, [{ model: 'claude-opus-5-5', family: 'decision', n: 1, brier: 0.04, skill: 0.84, leaks: 0 }])
    expect(md).toContain('DEMO DATA')
    expect(md).toContain('$200')
    expect(md).toContain('**가정**')
    expect(md).toContain('| claude-opus-5-5 | decision | 1 | 0.040 | - | - | 0.84 |')
    expect(md).not.toMatch(/\n\n\n/)
  })
})
