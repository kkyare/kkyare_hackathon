// 등록된 4개 패밀리 모두 Arena 실행 → 채점, 납품까지 도는지 (fixtures 사용, Claude 호출 없음)
import type Anthropic from '@anthropic-ai/sdk'
import { describe, expect, it } from 'vitest'
import { runAgent, type MessagesClient } from '../core/agent'
import type { Answer, FamilyId, Task } from '../core/types'
import { engineAnswer as decisionEngine } from '../families/decision/index'
import { engineAnswer as downscalingEngine } from '../families/downscaling/index'
import { families } from '../families/index'
import { observationFor, snapshotById } from '../insurance/data'
import { handleArenaRun, handleExport } from './api'
import { demoTasks } from './data'
import type { AgentRunner } from './run'

const FAMILIES: FamilyId[] = ['nowcasting', 'downscaling', 'decision', 's2s']
const tasksOf = (f: FamilyId): Task[] => demoTasks(f, 3)

// 패밀리별로 형식이 맞는 답을 내는 가짜 에이전트 (유진님 엔진 답 재사용)
const engine: AgentRunner = async ({ task, model }) => {
  const base = { taskId: task.id, model, rationale: 'engine', toolCalls: [] }
  const answer: Answer =
    task.family === 'decision' ? { ...decisionEngine(task, snapshotById(task.snapshotId)!), model }
    : task.family === 'downscaling' ? { ...downscalingEngine(task, snapshotById(task.snapshotId)!), model }
    : task.family === 's2s' ? { ...base, terciles: [0.2, 0.3, 0.5], decision: 'wait' }
    : { ...base, probability: 0.3, decision: 'spray' }
  return { answer, leakFlags: [] }
}

describe('Arena × 등록된 패밀리 전부', () => {
  for (const family of FAMILIES) {
    it(`${family}: 실행 → 채점`, async () => {
      const tasks = tasksOf(family)
      expect(tasks.length).toBeGreaterThan(0)
      const r = await handleArenaRun({ tasks, models: ['claude-haiku-5-5'] }, { families, saved: [], mock: false, live: engine })
      expect(r.errors).toEqual([])
      expect(r.scores).toHaveLength(tasks.length)
      for (const s of r.scores) {
        expect(s.family).toBe(family)
        expect(Number.isFinite(s.skill)).toBe(true)
      }
    })

    it(`${family}: submit_answer 스키마로 runAgent가 돈다`, async () => {
      const [task] = tasksOf(family)
      const { answer } = await engine({ task, snapshot: undefined as never, model: 'm', answerSchema: families[family]!.answerSchema })
      const { taskId: _t, model: _m, toolCalls: _c, ...input } = answer
      const client: MessagesClient = {
        messages: {
          async create(params) {
            const submit = (params.tools as Anthropic.Tool[]).find(t => t.name === 'submit_answer')!
            expect(submit.input_schema.type).toBe('object')
            return { content: [{ type: 'tool_use', id: 'x', name: 'submit_answer', input }], usage: { input_tokens: 1, output_tokens: 1 } } as unknown as Anthropic.Message
          },
        },
      }
      const live: AgentRunner = i => runAgent({ ...i, client })
      const r = await handleArenaRun({ tasks: [task], models: ['claude-sonnet-5-5'] }, { families, saved: [], mock: false, live })
      expect(r.errors).toEqual([])
      expect(r.scores).toHaveLength(1)
    })
  }

  it('납품: 이진 패밀리는 outcome, 다운스케일링은 value·reference, S2S는 라벨 없음', () => {
    const all = FAMILIES.flatMap(tasksOf)
    const lines = handleExport({ tasks: all }, { format: 'jsonl', families }).body.trim().split('\n').map(l => JSON.parse(l))
    const labeled = new Set(lines.filter(l => l.label).map(l => l.family))
    expect([...labeled].sort()).toEqual(['decision', 'downscaling', 'nowcasting'])
    for (const l of lines.filter(l => l.family === 'nowcasting' || l.family === 'decision')) expect([0, 1]).toContain(l.label.outcome)

    // 다운스케일링 라벨은 패밀리 score()와 같은 값: 실측 그대로면 CRPS 0, 원천 예보 그대로면 skill 0
    const ds = all.filter(t => t.family === 'downscaling')
    for (const t of ds) {
      const { label } = lines.find(l => l.id === t.id)
      const snapshot = snapshotById(t.snapshotId)!
      const obs = observationFor(t.field.id, t.t0)!
      const at = (value: number): Answer => ({ taskId: t.id, model: 'x', quantiles: [{ q: 0.5, value }], rationale: '', toolCalls: [] })
      expect(families.downscaling!.score(t, at(label.value), obs, snapshot).crps).toBe(0)
      expect(families.downscaling!.score(t, at(label.reference), obs, snapshot).skill).toBe(0)
    }
    const pack = JSON.parse(handleExport({ tasks: all }).body)
    expect(pack.families.sort()).toEqual(['decision', 'downscaling', 'nowcasting', 's2s'])
    expect(pack.meta.count).toBe(all.length)
  })
})
