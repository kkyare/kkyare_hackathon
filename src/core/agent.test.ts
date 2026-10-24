import type Anthropic from '@anthropic-ai/sdk'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { AgentError, runAgent, type MessagesClient } from './agent'
import { snapshot, task } from './__fixtures__/mini'

const answerSchema = z.object({
  probability: z.number().min(0).max(1),
  decision: z.enum(['protect', 'none']),
  rationale: z.string(),
})

type Block = { type: 'text'; text: string } | { type: 'tool_use'; name: string; input: unknown }

// 미리 정한 응답을 차례로 돌려주고, 받은 요청을 기록하는 가짜 client
function fakeClient(script: Block[][]) {
  const requests: Anthropic.MessageCreateParamsNonStreaming[] = []
  let i = 0
  const client: MessagesClient = {
    messages: {
      async create(params) {
        requests.push(structuredClone(params))
        const blocks = script[Math.min(i++, script.length - 1)]
        const content = blocks.map((b, j) =>
          b.type === 'text' ? { type: 'text', text: b.text, citations: null } : { type: 'tool_use', id: `tu_${i}_${j}`, name: b.name, input: b.input },
        )
        return {
          id: `msg_${i}`, type: 'message', role: 'assistant', model: params.model, content,
          stop_reason: blocks.some(b => b.type === 'tool_use') ? 'tool_use' : 'end_turn',
          stop_sequence: null, usage: { input_tokens: 100, output_tokens: 20 },
        } as unknown as Anthropic.Message
      },
    },
  }
  return { client, requests }
}

const submit = (input: unknown): Block => ({ type: 'tool_use', name: 'submit_answer', input })
const good = { probability: 0.35, decision: 'protect', rationale: 'HRRR 최저 31°F, 골짜기 보정' }

const toolNames = (req: Anthropic.MessageCreateParamsNonStreaming) => (req.tools as Anthropic.Tool[]).map(t => t.name)

const toolResults = (req: Anthropic.MessageCreateParamsNonStreaming) => {
  const last = req.messages.at(-1)!
  return (Array.isArray(last.content) ? last.content : []) as Anthropic.ToolResultBlockParam[]
}

describe('runAgent', () => {
  it('도구 조회 → 제출 흐름, toolCalls 기록', async () => {
    const { client, requests } = fakeClient([
      [{ type: 'text', text: '예보를 보자' }, { type: 'tool_use', name: 'get_forecast', input: { model: 'hrrr' } }],
      [submit(good)],
    ])
    const r = await runAgent({ task, snapshot, model: 'claude-haiku-5-5', answerSchema, client })

    expect(r.answer).toMatchObject({ ...good, taskId: task.id, model: 'claude-haiku-5-5' })
    expect(r.answer.toolCalls.map(c => c.name)).toEqual(['get_forecast'])
    expect(r.usage).toMatchObject({ turns: 2, inputTokens: 200, outputTokens: 40 })
    expect(r.leakFlags).toEqual([])

    const [result] = toolResults(requests[1])
    expect(result.type).toBe('tool_result')
    expect(JSON.parse(result.content as string).issuedAt).toBe('2026-05-11T18:00:00Z')
    expect(toolNames(requests[0])).toContain('submit_answer')
  })

  it('형식이 틀린 제출은 오류를 돌려주고 다시 받는다', async () => {
    const { client, requests } = fakeClient([[submit({ probability: 1.4, decision: 'maybe' })], [submit(good)]])
    const r = await runAgent({ task, snapshot, model: 'claude-sonnet-5-5', answerSchema, client })

    expect(r.answer.probability).toBe(0.35)
    expect(toolResults(requests[1])[0].is_error).toBe(true)
    expect(requests[1].tool_choice).toEqual({ type: 'tool', name: 'submit_answer' })
  })

  it('도구 없이 끝내면 다음 턴에 제출을 강제한다', async () => {
    const { client, requests } = fakeClient([[{ type: 'text', text: '서리 확률은 30%입니다.' }], [submit(good)]])
    await runAgent({ task, snapshot, model: 'claude-opus-5-5', answerSchema, client })
    expect(requests[0].tool_choice).toEqual({ type: 'auto' })
    expect(requests[1].tool_choice).toEqual({ type: 'tool', name: 'submit_answer' })
  })

  it('t0 이후를 조회하면 leakFlags로 넘어온다', async () => {
    const { client } = fakeClient([
      [{ type: 'tool_use', name: 'get_observations', input: { from: '2026-05-12T00:00:00Z', to: '2026-05-12T12:00:00Z' } }],
      [submit(good)],
    ])
    const r = await runAgent({ task, snapshot, model: 'claude-haiku-5-5', answerSchema, client })
    expect(r.leakFlags).toEqual(['tool:obs_after_t0'])
  })

  it('마지막 턴은 제출 강제, 그래도 제출이 없으면 AgentError', async () => {
    const { client, requests } = fakeClient([[{ type: 'tool_use', name: 'get_field_info', input: {} }]])
    await expect(runAgent({ task, snapshot, model: 'claude-haiku-5-5', answerSchema, client, maxTurns: 3 })).rejects.toBeInstanceOf(AgentError)
    expect(requests).toHaveLength(3)
    expect(requests[2].tool_choice).toEqual({ type: 'tool', name: 'submit_answer' })
  })

  it('submit_answer 입력 스키마는 answerSchema의 JSON Schema', async () => {
    const { client, requests } = fakeClient([[submit(good)]])
    await runAgent({ task, snapshot, model: 'claude-haiku-5-5', answerSchema, client })
    const tool = (requests[0].tools as Anthropic.Tool[]).find(t => t.name === 'submit_answer')!
    expect(tool.input_schema.type).toBe('object')
    expect(tool.input_schema.required).toEqual(['probability', 'decision', 'rationale'])
    expect(tool.input_schema).not.toHaveProperty('$schema')
  })
})
