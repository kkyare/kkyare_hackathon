import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import type { AgentRunner, ArenaEvent, ArenaRun } from './run'
import { replayRunner, runArena, withFallback } from './run'
import { leaderboard, scoreboard, topModelMissRate } from './scoreboard'
import type { Answer, Family, Observation, Score, Task } from '../core/types'
import { snapshot, task } from '../core/__fixtures__/mini'

// 테스트용 서리 패밀리 (실제 패밀리는 유진님 decision)
const frost: Family = {
  id: 'decision',
  generate: () => [],
  answerSchema: z.object({ probability: z.number(), decision: z.enum(['protect', 'none']), rationale: z.string() }),
  score(t, a, obs) {
    const minF = Math.min(...obs.hourly.map(h => h.tempF ?? Infinity))
    const event = minF <= (t.context.thresholdF ?? 32) ? 1 : 0
    const brier = ((a.probability ?? 0) - event) ** 2
    return {
      taskId: t.id, model: a.model, family: 'decision', brier, skill: 1 - brier / 0.25,
      correct: (a.decision === 'protect') === (event === 1), leakFlags: [],
    }
  },
}

const frostObs: Observation = { stationId: 'DSM', hourly: [{ time: '2026-05-12T10:00:00Z', tempF: 30, windMph: 3, gustMph: null, precipIn: 0 }] }
const task2: Task = { ...task, id: 'task-dc-0002' }

const answer = (t: Task, model: string, probability: number, decision: 'protect' | 'none'): Answer =>
  ({ taskId: t.id, model, probability, decision, rationale: 'r', toolCalls: [] })

// 모델마다 정해진 답을 내는 가짜 runner
const scripted: Record<string, [number, 'protect' | 'none']> = {
  'claude-haiku-5-5': [0.05, 'none'],
  'claude-sonnet-5-5': [0.6, 'protect'],
  'claude-opus-5-5': [0.9, 'protect'],
}
const fakeRunner: AgentRunner = async ({ task: t, model }) => {
  const [p, d] = scripted[model]
  return { answer: answer(t, model, p, d), leakFlags: model === 'claude-haiku-5-5' ? ['tool:obs_after_t0'] : [] }
}

const base = {
  families: { decision: frost },
  getSnapshot: (id: string) => (id === snapshot.id ? snapshot : undefined),
  getObservation: () => frostObs,
}

describe('runArena', () => {
  it('과제 × 모델 전부 실행·채점하고 누출 기록을 합친다', async () => {
    const events: ArenaEvent['type'][] = []
    const r = await runArena({
      ...base, tasks: [task, task2], models: Object.keys(scripted), runner: fakeRunner,
      onEvent: e => events.push(e.type),
    })
    expect(r.answers).toHaveLength(6)
    expect(r.scores).toHaveLength(6)
    expect(r.errors).toEqual([])
    const haiku = r.scores.find(s => s.model === 'claude-haiku-5-5')!
    expect(haiku.leakFlags).toEqual(['tool:obs_after_t0'])
    expect(haiku.correct).toBe(false)
    expect(haiku.resolvedWith).toEqual({ stationId: 'DSM', at: task.resolveAt })
    expect(events.filter(e => e === 'score')).toHaveLength(6)
  })

  it('동시 실행 수를 지킨다', async () => {
    let running = 0, peak = 0
    const slow: AgentRunner = async input => {
      peak = Math.max(peak, ++running)
      await new Promise(res => setTimeout(res, 5))
      running--
      return fakeRunner(input)
    }
    await runArena({ ...base, tasks: [task, task2], models: Object.keys(scripted), runner: slow, concurrency: 2 })
    expect(peak).toBe(2)
  })

  it('실패는 errors로 모으고 나머지는 계속한다', async () => {
    const flaky: AgentRunner = async input => {
      if (input.model === 'claude-opus-5-5') throw new Error('overloaded')
      return fakeRunner(input)
    }
    const r = await runArena({
      ...base, tasks: [task, { ...task2, family: 's2s' }, { ...task, id: 'task-x', snapshotId: 'missing' }],
      models: Object.keys(scripted), runner: flaky,
    })
    expect(r.scores).toHaveLength(2)
    expect(r.errors.map(e => e.message)).toEqual(expect.arrayContaining([
      'overloaded', "family 's2s' is not registered", "snapshot 'missing' not found",
    ]))
  })

  it('관측이 아직 없으면 답만 받고 채점은 건너뛴다', async () => {
    const r = await runArena({ ...base, getObservation: () => undefined, tasks: [task], models: ['claude-opus-5-5'], runner: fakeRunner })
    expect(r.answers).toHaveLength(1)
    expect(r.scores).toEqual([])
  })

  it('저장 기록 재생과 실패 시 대체', async () => {
    const saved: ArenaRun[] = [{ taskId: task.id, model: 'claude-opus-5-5', answer: answer(task, 'claude-opus-5-5', 0.8, 'protect'), leakFlags: [] }]
    const replayed = await runArena({ ...base, tasks: [task], models: ['claude-opus-5-5', 'claude-haiku-5-5'], runner: replayRunner(saved) })
    expect(replayed.scores.map(s => s.model)).toEqual(['claude-opus-5-5'])
    expect(replayed.errors[0].message).toContain('no saved run')

    const down: AgentRunner = async () => { throw new Error('no api key') }
    const fallback = await runArena({ ...base, tasks: [task], models: ['claude-opus-5-5'], runner: withFallback(down, saved) })
    expect(fallback.answers[0].probability).toBe(0.8)
  })
})

describe('scoreboard', () => {
  const s = (model: string, family: Score['family'], skill: number, correct?: boolean, extra: Partial<Score> = {}): Score =>
    ({ taskId: `t-${Math.random()}`, model, family, skill, correct, leakFlags: [], ...extra })

  const scores: Score[] = [
    s('opus', 'decision', 0.8, true, { brier: 0.01 }), s('opus', 'decision', 0.6, false, { brier: 0.1 }),
    s('opus', 'downscaling', 0.2, undefined, { crps: 1.5 }),
    s('haiku', 'decision', -0.5, false, { brier: 0.6, leakFlags: ['tool:obs_after_t0'] }),
    s('haiku', 'downscaling', 0.4, undefined, { crps: 1.1 }),
    ...Array.from({ length: 10 }, () => s('haiku', 'downscaling', 0.4)),
  ]

  it('모델 × 패밀리 평균', () => {
    const opusDecision = scoreboard(scores).find(c => c.model === 'opus' && c.family === 'decision')!
    expect(opusDecision).toMatchObject({ n: 2, skill: 0.7, accuracy: 0.5, leaks: 0 })
    expect(opusDecision.brier).toBeCloseTo(0.055)
    expect(scoreboard(scores).find(c => c.model === 'haiku' && c.family === 'decision')!.leaks).toBe(1)
  })

  it('리더보드는 패밀리별 평균을 다시 평균한다 (과제 수가 많은 패밀리에 끌려가지 않음)', () => {
    const lb = leaderboard(scores)
    expect(lb.map(c => c.model)).toEqual(['opus', 'haiku'])
    expect(lb[0].skill).toBeCloseTo(0.45)
    expect(lb[1].skill).toBeCloseTo(-0.05)
  })

  it('최고 모델도 틀린 비율', () => {
    expect(topModelMissRate(scores)).toEqual({ model: 'opus', missRate: 0.5, n: 2 })
    expect(topModelMissRate([])).toBeUndefined()
  })

  it('skill은 과제별로 [-1, 1]로 잘라 평균한다 (원천 예보 오차가 0에 가까운 과제 하나가 순위를 뒤집지 않게)', () => {
    // 실제 기록에서 서리 결정 skill이 -39까지 나온 경우를 흉내
    const outlier: Score[] = [
      s('opus', 'decision', -39, false), s('opus', 'nowcasting', 0.6, true),
      s('haiku', 'decision', -0.9, false), s('haiku', 'nowcasting', -0.5, true),
    ]
    const opusDecision = scoreboard(outlier).find(c => c.model === 'opus' && c.family === 'decision')!
    expect(opusDecision).toMatchObject({ skill: -1, skillRaw: -39 })
    const lb = leaderboard(outlier)
    expect(lb.map(c => c.model)).toEqual(['opus', 'haiku'])     // 자르지 않으면 opus가 꼴찌
    expect(lb[0].skill).toBeCloseTo(-0.2)
  })
})
