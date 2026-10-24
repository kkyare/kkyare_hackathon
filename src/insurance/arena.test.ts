// 다운스케일링·의사결정 과제가 성제님 Arena와 에이전트 도구에서 그대로 도는지 확인
import { describe, expect, it } from 'vitest'
import { runArena } from '../arena/run'
import { makeTools } from '../core/tools'
import { families } from '../families'
import { downscaling, engineAnswer as dsEngine } from '../families/downscaling'
import { decision, engineAnswer as dcEngine } from '../families/decision'
import { fields, getObservation, getSnapshot, snapshots } from './data'

const tasks = [...downscaling.generate({ fields, snapshots, count: 4 }), ...decision.generate({ fields, snapshots, count: 4 })]

describe('Arena 호환', () => {
  it('t0 이후 데이터가 스냅샷에 섞여 있지 않다 (makeTools 검사)', () => {
    for (const t of tasks) expect(makeTools(t, getSnapshot(t.snapshotId)!).snapshotIssues).toEqual([])
  })
  it('runArena로 답 → 채점까지 오류 없이 돈다', async () => {
    const res = await runArena({
      tasks,
      models: ['engine-a', 'engine-b'],
      families,
      getSnapshot,
      getObservation,
      runner: async ({ task, snapshot }) => ({
        answer: task.family === 'downscaling' ? dsEngine(task, snapshot) : dcEngine(task, snapshot),
        leakFlags: [],
      }),
    })
    expect(res.errors).toEqual([])
    expect(res.scores).toHaveLength(tasks.length * 2)
  })
})
