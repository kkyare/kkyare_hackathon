// Claude 실행기. 도구로 t0 스냅샷을 조회한 뒤 submit_answer 도구로 확률·결정을 구조화해 제출한다.
// 서버에서만 쓴다 (ANTHROPIC_API_KEY).
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { leakFlagsOf, makeTools, type LeakAttempt } from './tools'
import type { Answer, ModelId, Snapshot, Task } from './types'

export const ARENA_MODELS: ModelId[] = ['claude-haiku-5-5', 'claude-sonnet-5-5', 'claude-opus-5-5']
export const DEFAULT_MODEL: ModelId = 'claude-sonnet-5-5'

const SUBMIT = 'submit_answer'

// 테스트에서 가짜 client를 넣을 수 있게 필요한 부분만 받는다
export interface MessagesClient {
  messages: { create(params: Anthropic.MessageCreateParamsNonStreaming): Promise<Anthropic.Message> }
}

export interface RunAgentInput {
  task: Task
  snapshot: Snapshot
  model: ModelId
  answerSchema: z.ZodTypeAny
  client?: MessagesClient
  maxTurns?: number
}

export interface RunAgentResult {
  answer: Answer
  leakAttempts: LeakAttempt[]
  leakFlags: string[]                      // Score.leakFlags에 합칠 값
  snapshotIssues: string[]
  usage: { inputTokens: number; outputTokens: number; turns: number; latencyMs: number }
}

export class AgentError extends Error {}

let defaultClient: Anthropic | undefined
const getDefaultClient = () => (defaultClient ??= new Anthropic())

function submitTool(answerSchema: z.ZodTypeAny): Anthropic.Tool {
  const { $schema: _, ...schema } = z.toJSONSchema(answerSchema) as Record<string, unknown>
  if (schema.type !== 'object') throw new AgentError('answerSchema must be a z.object(...)')
  return {
    name: SUBMIT,
    description: '최종 답을 제출한다. 반드시 이 도구로 한 번 제출해야 과제가 끝난다. 확률은 0-1, rationale에는 근거를 짧게 적는다.',
    input_schema: schema as Anthropic.Tool.InputSchema,
  }
}

function systemPrompt(task: Task) {
  return [
    '너는 미국 대형 농장의 날씨 의사결정 에이전트다.',
    `현재 시각은 t0 = ${task.t0} (UTC)이다. 이 시각 이후에 일어난 일은 알 수 없다고 가정하고, 도구로 얻은 정보와 일반 기상 지식만 써라.`,
    '도구로 필지 정보, t0 시점 예보, t0 이전 관측을 조회할 수 있다. 단위는 °F, mph, inch, 시각은 UTC.',
    '예보를 그대로 베끼지 말고 필지 고도·지형과 최근 관측을 반영해 보정하라. 확률은 잘 보정된 값이어야 한다.',
    `조회가 끝나면 ${SUBMIT} 도구로 한 번 제출하라.`,
  ].join('\n')
}

const text = (v: unknown) => (typeof v === 'string' ? v : JSON.stringify(v))

export async function runAgent({ task, snapshot, model, answerSchema, client, maxTurns = 8 }: RunAgentInput): Promise<RunAgentResult> {
  const api = client ?? getDefaultClient()
  const toolbox = makeTools(task, snapshot)
  const tools: Anthropic.Tool[] = [...toolbox.definitions, submitTool(answerSchema)]
  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: task.prompt }]
  const usage = { inputTokens: 0, outputTokens: 0, turns: 0, latencyMs: 0 }
  const started = Date.now()
  let forceSubmit = false

  for (let turn = 0; turn < maxTurns; turn++) {
    const lastTurn = turn === maxTurns - 1
    const res = await api.messages.create({
      model,
      max_tokens: 2048,
      system: systemPrompt(task),
      tools,
      tool_choice: forceSubmit || lastTurn ? { type: 'tool', name: SUBMIT } : { type: 'auto' },
      messages,
    })
    usage.turns++
    usage.inputTokens += res.usage.input_tokens
    usage.outputTokens += res.usage.output_tokens
    messages.push({ role: 'assistant', content: res.content })

    const toolUses = res.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
    if (toolUses.length === 0) {
      // 도구 없이 끝냈으면 다음 턴은 제출을 강제한다
      forceSubmit = true
      messages.push({ role: 'user', content: `${SUBMIT} 도구로 답을 제출하라.` })
      continue
    }

    const results: Anthropic.ToolResultBlockParam[] = []
    for (const use of toolUses) {
      if (use.name !== SUBMIT) {
        results.push({ type: 'tool_result', tool_use_id: use.id, content: text(toolbox.call(use.name, use.input)) })
        continue
      }
      const parsed = answerSchema.safeParse(use.input)
      if (parsed.success) {
        const body = parsed.data as Partial<Answer>
        usage.latencyMs = Date.now() - started
        return {
          answer: { ...body, taskId: task.id, model, rationale: body.rationale ?? '', toolCalls: toolbox.calls },
          leakAttempts: toolbox.leakAttempts,
          leakFlags: leakFlagsOf(toolbox),
          snapshotIssues: toolbox.snapshotIssues,
          usage,
        }
      }
      forceSubmit = true
      results.push({
        type: 'tool_result', tool_use_id: use.id, is_error: true,
        content: `형식이 맞지 않는다. 고쳐서 다시 제출하라: ${parsed.error.message}`,
      })
    }
    messages.push({ role: 'user', content: results })
  }

  throw new AgentError(`${model}: no valid ${SUBMIT} within ${maxTurns} turns (task ${task.id})`)
}
