import type Anthropic from '@anthropic-ai/sdk'
import { describe, expect, it } from 'vitest'
import type { MessagesClient } from '../core/agent'
import type { Score } from '../core/types'
import { task } from '../core/__fixtures__/mini'
import { applyAudit, AUDIT_FLAG, auditRationale, auditRuns, auditSummary } from './leakAudit'
import type { ArenaRun } from './run'

const run = (model: string, rationale: string, leakFlags: string[] = []): ArenaRun => ({
  taskId: task.id, model, leakFlags,
  answer: { taskId: task.id, model, probability: 0.7, decision: 'protect', rationale, toolCalls: [{ name: 'get_forecast', args: {}, at: '' }] },
})

// rationale에 "실제로"가 있으면 누출로 보고하는 가짜 감사 client
function fakeAuditor(opts: { fail?: boolean } = {}) {
  const prompts: string[] = []
  const client: MessagesClient = {
    messages: {
      async create(params) {
        if (opts.fail) throw new Error('overloaded')
        const prompt = params.messages[0].content as string
        prompts.push(prompt)
        const rationale = prompt.split('"""')[1] ?? ''
        const leak = rationale.includes('실제로')
        return {
          content: [{ type: 'tool_use', id: 'tu', name: 'report_audit', input: {
            leak, confidence: leak ? 0.9 : 0.1, quote: leak ? '실제로 29°F까지 떨어졌다' : '', reason: leak ? '관측 결과를 알고 있음' : '예보 인용',
          } }],
          usage: { input_tokens: 1, output_tokens: 1 },
        } as unknown as Anthropic.Message
      },
    },
  }
  return { client, prompts }
}

describe('leakAudit', () => {
  it('rationale이 t0 이후 사실을 쓰면 적발', async () => {
    const { client, prompts } = fakeAuditor()
    const f = await auditRationale(task, run('opus', '밤사이 실제로 29°F까지 떨어졌다.'), { client })
    expect(f).toMatchObject({ source: 'rationale', flag: AUDIT_FLAG, confidence: 0.9, quote: '실제로 29°F까지 떨어졌다' })
    expect(prompts[0]).toContain(task.t0)
    expect(prompts[0]).toContain('get_forecast')
  })

  it('예보 인용은 통과, 빈 rationale은 호출하지 않음', async () => {
    const { client, prompts } = fakeAuditor()
    expect(await auditRationale(task, run('opus', 'HRRR 최저 31°F 예보'), { client })).toBeUndefined()
    expect(await auditRationale(task, run('opus', '  '), { client })).toBeUndefined()
    expect(prompts).toHaveLength(1)
  })

  it('auditRuns: 도구 기록 + rationale, 감사 실패는 무시', async () => {
    const runs = [run('haiku', '예보 인용', ['tool:obs_after_t0']), run('opus', '실제로 서리가 왔다')]
    const findings = await auditRuns(runs, [task], { client: fakeAuditor().client })
    expect(findings.map(f => [f.model, f.source])).toEqual([['haiku', 'tool'], ['opus', 'rationale']])

    const onlyTools = await auditRuns(runs, [task], { client: fakeAuditor({ fail: true }).client })
    expect(onlyTools.map(f => f.source)).toEqual(['tool'])

    expect(auditSummary(findings, runs)).toEqual([
      { model: 'haiku', runs: 1, toolAttempts: 1, rationaleFlags: 0, flaggedTasks: 1 },
      { model: 'opus', runs: 1, toolAttempts: 0, rationaleFlags: 1, flaggedTasks: 1 },
    ])
  })

  it('applyAudit: 해당 점수의 leakFlags에 합친다', async () => {
    const scores: Score[] = ['haiku', 'opus'].map(model => ({ taskId: task.id, model, family: 'decision', skill: 0, leakFlags: [] }))
    const findings = await auditRuns([run('opus', '실제로 서리')], [task], { client: fakeAuditor().client })
    expect(applyAudit(scores, findings).map(s => s.leakFlags)).toEqual([[], [AUDIT_FLAG]])
  })
})
