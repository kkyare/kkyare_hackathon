// 1차 합치기: 실제 패밀리(나우캐스팅)로 generate → Arena run → score 한 바퀴 (fixtures 사용, Claude 호출 없음)
import type Anthropic from '@anthropic-ai/sdk'
import { describe, expect, it } from 'vitest'
import { runAgent, type MessagesClient } from '../core/agent'
import type { Task } from '../core/types'
import { families } from '../families/index'
import { buildDemoTasks, loadObservationForTask, loadSnapshotForTask, referenceProbability } from '../families/nowcasting/index'
import { BadRequest, handleArenaRun, handleExport } from './api'
import type { AgentRunner, ArenaRun } from './run'
import { scoreboard } from './scoreboard'

const { tasks } = buildDemoTasks(6)
const MODELS = ['claude-haiku-5-5', 'claude-opus-5-5']

// 원천 예보 비율을 그대로 내는 가짜 에이전트 → 나우캐스팅 skill은 0이어야 한다
const copyForecast: AgentRunner = async ({ task, model }) => {
  const p = referenceProbability(loadSnapshotForTask(task))
  return { answer: { taskId: task.id, model, probability: p, decision: p >= 0.5 ? 'delay' : 'spray', rationale: '예보 복사', toolCalls: [] }, leakFlags: [] }
}

describe('1차 합치기: 나우캐스팅 × Arena', () => {
  it('generate → run → score 한 바퀴, 예보 복사는 skill 0', async () => {
    const r = await handleArenaRun({ tasks, models: MODELS }, { families, saved: [], mock: false, live: copyForecast })
    expect(r.errors).toEqual([])
    expect(r.scores).toHaveLength(tasks.length * MODELS.length)
    expect(r).toMatchObject({ live: true, replayed: 0 })
    for (const s of r.scores) {
      expect(s.family).toBe('nowcasting')
      expect(s.skill).toBe(0)
      expect(s.resolvedWith?.stationId).toBe('DSM')
      expect(s.leakFlags).toEqual([])
    }
    expect(scoreboard(r.scores).map(c => [c.model, c.n])).toEqual([['claude-haiku-5-5', 6], ['claude-opus-5-5', 6]])
  })

  it('실제 runAgent가 나우캐스팅 스냅샷·answerSchema로 돈다 (가짜 client)', async () => {
    const task = tasks[0]
    let step = 0
    const client: MessagesClient = {
      messages: {
        async create(params) {
          const submit = params.tools!.find(t => 'name' in t && t.name === 'submit_answer') as Anthropic.Tool
          expect(submit.input_schema.required).toEqual(['probability', 'decision', 'rationale'])
          const content = step++ === 0
            ? [{ type: 'tool_use', id: 'a', name: 'list_forecast_models', input: {} }]
            : [{ type: 'tool_use', id: 'b', name: 'submit_answer', input: { probability: 0.2, decision: 'spray', rationale: '돌풍 예보 낮음' } }]
          return { content, usage: { input_tokens: 1, output_tokens: 1 } } as unknown as Anthropic.Message
        },
      },
    }
    const live: AgentRunner = input => runAgent({ ...input, client })
    const r = await handleArenaRun({ tasks: [task], models: ['claude-sonnet-5-5'] }, { families, saved: [], mock: false, live })
    expect(r.errors).toEqual([])
    expect(r.answers[0].toolCalls.map(c => c.name)).toEqual(['list_forecast_models'])
    expect(r.scores[0].brier).toBeDefined()
  })

  it('mock이면 저장 응답, 실패하면 저장 응답으로 대체하고 LIVE 아님', async () => {
    const saved: ArenaRun[] = tasks.slice(0, 2).map(t => ({
      taskId: t.id, model: 'claude-opus-5-5', leakFlags: [],
      answer: { taskId: t.id, model: 'claude-opus-5-5', probability: 0.5, decision: 'delay', rationale: 'saved', toolCalls: [] },
    }))
    const mocked = await handleArenaRun({ tasks: tasks.slice(0, 2), models: ['claude-opus-5-5'] }, { families, saved, mock: true })
    expect(mocked).toMatchObject({ live: false, replayed: 2 })
    expect(mocked.scores).toHaveLength(2)

    const down: AgentRunner = async () => { throw new Error('529 overloaded') }
    const fb = await handleArenaRun({ tasks: tasks.slice(0, 2), models: ['claude-opus-5-5'] }, { families, saved, mock: false, live: down })
    expect(fb).toMatchObject({ live: false, replayed: 2 })
  })

  it('등록 안 된 패밀리·잘못된 요청', async () => {
    const s2s: Task = { ...tasks[0], id: 'task-s2s-0001', family: 's2s' }
    const onlyNowcasting = { nowcasting: families.nowcasting }
    const r = await handleArenaRun({ tasks: [s2s], models: ['m'] }, { families: onlyNowcasting, saved: [], mock: false, live: copyForecast })
    expect(r.errors[0].message).toContain("family 's2s'")

    const deps = { families, saved: [], mock: true }
    await expect(handleArenaRun({}, deps)).rejects.toBeInstanceOf(BadRequest)
    await expect(handleArenaRun({ taskIds: ['x'] }, deps)).rejects.toBeInstanceOf(BadRequest)
    await expect(handleArenaRun({ tasks, models: [] }, deps)).rejects.toBeInstanceOf(BadRequest)
  })
})

describe('납품: 나우캐스팅 과제 내보내기', () => {
  // 시나리오가 다른 과제 (같은 관측소 DSM)
  // 16Z 시작: gust-block은 위반, calm-go는 정상 (fixtures/README.md)
  const mixed = buildDemoTasks(Number.MAX_SAFE_INTEGER).tasks
    .filter(t => t.field.id === 'field-ia-01' && t.t0 === '2026-06-10T16:00:00.000Z')

  it('TaskPack: 스냅샷 포함, 정답은 과제마다 자기 시나리오 관측', () => {
    expect(new Set(mixed.map(t => t.snapshotId.split('@')[1])).size).toBe(3)
    const r = handleExport({ tasks: mixed })
    const pack = JSON.parse(r.body)
    expect(r.contentType).toBe('application/json')
    expect(pack.snapshots).toHaveLength(3)
    expect(pack.meta).toMatchObject({ count: 3, marketValueUsd: 300, demo: true, includesResolution: true })
    mixed.forEach((t, i) => {
      const own = loadObservationForTask(t).hourly.filter(h => Date.parse(h.time) >= Date.parse(t.t0) && Date.parse(h.time) <= Date.parse(t.resolveAt))
      expect(pack.resolutions[i].hourly).toEqual(own)
    })
  })

  it('JSONL·holdout·데이터 카드', async () => {
    const lines = handleExport({ tasks: mixed }, { format: 'jsonl', families }).body.trim().split('\n').map(l => JSON.parse(l))
    expect(lines.map(l => l.id)).toEqual(mixed.map(t => t.id))
    expect(lines[0].snapshot.id).toBe(mixed[0].snapshotId)
    expect(lines[0].resolution.hourly.length).toBeGreaterThan(0)
    // 라벨은 패밀리 채점과 같은 결과: p = 1로 채점해 brier 0이면 사건 발생
    for (const [i, t] of mixed.entries()) {
      const s = families.nowcasting!.score(t, { taskId: t.id, model: 'x', probability: 1, rationale: '', toolCalls: [] }, loadObservationForTask(t), loadSnapshotForTask(t))
      expect(lines[i].label.outcome).toBe(s.brier === 0 ? 1 : 0)
    }
    expect(new Set(lines.map(l => l.label.outcome)).size).toBe(2)   // 시나리오 3개에 위반·정상이 섞여 있음

    const holdout = handleExport({ tasks: mixed }, { format: 'jsonl', holdout: true, families })
    expect(holdout.body).not.toContain('"resolution"')
    expect(holdout.body).not.toContain('"label"')
    expect(holdout.filename).toMatch(/-holdout\.jsonl$/)

    const { scores } = await handleArenaRun({ tasks: mixed, models: ['claude-opus-5-5'] }, { families, saved: [], mock: false, live: copyForecast })
    const card = handleExport({ tasks: mixed, scores }, { format: 'card' }).body
    expect(card).toContain('나우캐스팅')
    expect(card).toContain('| claude-opus-5-5 | nowcasting | 3 |')
  })

  it('잘못된 요청', () => {
    expect(() => handleExport({})).toThrow(BadRequest)
    expect(() => handleExport({ tasks: mixed }, { format: 'csv' })).toThrow(BadRequest)
    expect(() => handleExport({ tasks: [{ ...mixed[0], family: 's2s' }] })).toThrow(BadRequest)
  })
})
