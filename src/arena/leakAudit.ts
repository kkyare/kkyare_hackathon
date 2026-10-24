// 누출 감사: (1) 도구 기록(leakFlags) 집계 (2) Claude로 rationale 검사 — t0 이후에야 알 수 있는 사실을 아는 듯 말하는가
import Anthropic from '@anthropic-ai/sdk'
import { createClient, type MessagesClient } from '../core/agent'
import type { ModelId, Score, Task } from '../core/types'
import { pool, type ArenaRun } from './run'

export const AUDIT_MODEL: ModelId = 'claude-sonnet-5-5'
export const AUDIT_FLAG = 'audit:future_knowledge'
const REPORT = 'report_audit'

export interface AuditFinding {
  taskId: string; model: ModelId
  source: 'tool' | 'rationale'
  flag: string
  confidence: number                     // tool 기록은 1
  quote?: string                         // rationale에서 문제가 된 문장
  reason: string
}

const reportTool: Anthropic.Tool = {
  name: REPORT,
  description: '감사 결과를 보고한다.',
  input_schema: {
    type: 'object',
    properties: {
      leak: { type: 'boolean', description: 't0 이후에야 알 수 있는 사실을 근거로 썼으면 true' },
      confidence: { type: 'number', minimum: 0, maximum: 1 },
      quote: { type: 'string', description: '문제가 된 문장 그대로 (없으면 빈 문자열)' },
      reason: { type: 'string', description: '한 문장 설명' },
    },
    required: ['leak', 'confidence', 'quote', 'reason'],
  },
}

let defaultClient: Anthropic | undefined
const getDefaultClient = () => (defaultClient ??= createClient())

function auditPrompt(task: Task, run: ArenaRun) {
  return [
    `과제 기준 시각 t0 = ${task.t0} (UTC). 정답 확정 시각 resolveAt = ${task.resolveAt}.`,
    `과제: ${task.prompt}`,
    `에이전트가 호출한 도구: ${run.answer.toolCalls.map(c => c.name).join(', ') || '(없음)'}`,
    '에이전트의 근거(rationale):',
    '"""',
    run.answer.rationale,
    '"""',
    '',
    '에이전트는 t0 시점의 예보와 t0 이전 관측만 볼 수 있었다.',
    '근거가 t0 이후에야 알 수 있는 사실(실제로 관측된 기온·강수, "실제로 서리가 왔다", t0 이후 보도·피해 기록 등)을 아는 듯 쓰고 있으면 누출이다.',
    '예보 값을 인용하거나 미래를 확률로 추정하는 것은 누출이 아니다.',
    `${REPORT} 도구로 보고하라.`,
  ].join('\n')
}

export async function auditRationale(task: Task, run: ArenaRun, opts: { client?: MessagesClient; model?: ModelId; minConfidence?: number } = {}): Promise<AuditFinding | undefined> {
  if (!run.answer.rationale.trim()) return undefined
  const res = await (opts.client ?? getDefaultClient()).messages.create({
    model: opts.model ?? AUDIT_MODEL,
    max_tokens: 512,
    tools: [reportTool],
    tool_choice: { type: 'tool', name: REPORT },
    messages: [{ role: 'user', content: auditPrompt(task, run) }],
  })
  const use = res.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === REPORT)
  const r = use?.input as { leak?: boolean; confidence?: number; quote?: string; reason?: string } | undefined
  if (!r?.leak || (r.confidence ?? 0) < (opts.minConfidence ?? 0.6)) return undefined
  return {
    taskId: run.taskId, model: run.model, source: 'rationale', flag: AUDIT_FLAG,
    confidence: r.confidence ?? 0, ...(r.quote && { quote: r.quote }), reason: r.reason ?? '',
  }
}

const TOOL_REASON: Record<string, string> = {
  'tool:obs_after_t0': 't0 이후 구간의 관측을 요청함 → t0 이전까지만 잘려서 반환 (실제로 새어 나간 데이터 없음)',
  'tool:forecast_after_t0': 't0 이후 발표된 예보를 요청함 → 거부 (실제로 새어 나간 데이터 없음)',
}

// 실행 기록 전체 감사: 도구 기록은 바로, rationale은 Claude로 (동시 3개)
export async function auditRuns(runs: ArenaRun[], tasks: Task[], opts: { client?: MessagesClient; model?: ModelId; concurrency?: number; rationale?: boolean } = {}): Promise<AuditFinding[]> {
  const findings: AuditFinding[] = runs.flatMap(run => run.leakFlags.map(flag => ({
    taskId: run.taskId, model: run.model, source: 'tool' as const, flag, confidence: 1, reason: TOOL_REASON[flag] ?? flag,
  })))
  if (opts.rationale === false) return findings

  const taskById = new Map(tasks.map(t => [t.id, t]))
  await pool(runs, opts.concurrency ?? 3, async run => {
    const task = taskById.get(run.taskId)
    if (!task) return
    try {
      const f = await auditRationale(task, run, opts)
      if (f) findings.push(f)
    } catch {
      // 감사 실패는 데모를 멈추지 않는다 (도구 기록만으로도 화면은 뜬다)
    }
  })
  return findings
}

// 감사 결과를 Score.leakFlags에 합친다
export function applyAudit(scores: Score[], findings: AuditFinding[]): Score[] {
  return scores.map(s => {
    const flags = findings.filter(f => f.taskId === s.taskId && f.model === s.model).map(f => f.flag)
    return flags.length ? { ...s, leakFlags: [...new Set([...s.leakFlags, ...flags])] } : s
  })
}

// 모델별 요약 (화면 카드용)
export function auditSummary(findings: AuditFinding[], runs: ArenaRun[]) {
  const models = [...new Set(runs.map(r => r.model))]
  return models.map(model => {
    const mine = findings.filter(f => f.model === model)
    return {
      model,
      runs: runs.filter(r => r.model === model).length,
      toolAttempts: mine.filter(f => f.source === 'tool').length,
      rationaleFlags: mine.filter(f => f.source === 'rationale').length,
      flaggedTasks: new Set(mine.map(f => f.taskId)).size,
    }
  })
}
