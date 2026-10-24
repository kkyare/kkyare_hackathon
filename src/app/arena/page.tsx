'use client'
// Model Arena: 같은 과제를 Claude Haiku/Sonnet/Opus가 풀고, 실제 날씨로 자동 채점된다 (데모 장면 2:05)
// 기본은 저장 응답 재생(?mock=1). "실제 실행"을 누르면 서버가 Claude를 실제로 호출하고, 그때만 LIVE 배지가 뜬다.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { calibrate, pairsOf } from '@/arena/calibration'
import { leaderboard, scoreboard, topModelMissRate } from '@/arena/scoreboard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Figure, Section } from '@/components/ui/card'
import type { Answer, FamilyId, Score, Task } from '@/core/types'
import { CalibrationChart } from './CalibrationChart'
import { answerSummary, FAMILY_LABEL, isBlockedAttempt, leakLabel, modelColor, modelLabel, num, pct, scoreSummary, signed, usd } from './format'

// /api/arena/* 응답 (서버 전용 모듈을 클라이언트 번들에 끌어오지 않으려고 여기서 선언)
type TasksResponse = { tasks: Task[]; models: string[]; replayable: boolean; liveAvailable: boolean }
type RunResponse = { answers: Answer[]; scores: Score[]; errors: { taskId: string; model: string; message: string }[]; live: boolean; replayed: number }
type Finding = { taskId: string; model: string; source: 'tool' | 'rationale'; flag: string; confidence: number; quote?: string; reason: string }
type AuditResponse = { findings: Finding[]; summary: { model: string; runs: number; toolAttempts: number; rationaleFlags: number; flaggedTasks: number }[]; rationaleChecked: boolean }

type Phase = { kind: 'idle' } | { kind: 'loading'; label: string } | { kind: 'error'; message: string }

const FAMILIES: FamilyId[] = ['nowcasting', 'downscaling', 'decision', 's2s']
const TH = 'py-2 pr-3 font-normal'
const TD = 'py-2 pr-3'

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? `${url} → HTTP ${res.status}`)
  return json as T
}

const runsOf = (r: RunResponse) =>
  r.answers.map(a => ({ taskId: a.taskId, model: a.model, answer: a, leakFlags: r.scores.find(s => s.taskId === a.taskId && s.model === a.model)?.leakFlags ?? [] }))

// 모델 이름 앞의 색 점. 색만으로 구분하지 않게 이름과 항상 같이 쓴다
function Model({ id }: { id: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: modelColor(id) }} />
      {modelLabel(id)}
    </span>
  )
}

export default function ArenaPage() {
  const [meta, setMeta] = useState<TasksResponse>()
  const [result, setResult] = useState<RunResponse>()
  const [audit, setAudit] = useState<AuditResponse>()
  const [phase, setPhase] = useState<Phase>({ kind: 'loading', label: '과제를 불러오는 중' })

  const run = useCallback(async (tasks: Task[], models: string[], live: boolean) => {
    setPhase({ kind: 'loading', label: live ? 'Claude 3모델을 실행하는 중 (1-2분)' : '저장 응답을 재생하는 중' })
    setAudit(undefined)
    try {
      const r = await post<RunResponse>(`/api/arena/run${live ? '' : '?mock=1'}`, { tasks, models })
      setResult(r)
      setPhase({ kind: 'idle' })
      // 도구 기록 감사는 Claude 호출 없이 바로 (근거 감사는 버튼으로)
      setAudit(await post<AuditResponse>('/api/arena/audit?mock=1', { tasks, runs: runsOf(r) }))
    } catch (e) {
      setPhase({ kind: 'error', message: (e as Error).message })
    }
  }, [])

  useEffect(() => {
    fetch('/api/arena/tasks?count=2')
      .then(r => r.json() as Promise<TasksResponse>)
      .then(m => {
        setMeta(m)
        return run(m.tasks, m.models, false)
      })
      .catch(e => setPhase({ kind: 'error', message: (e as Error).message }))
  }, [run])

  const runRationaleAudit = async () => {
    if (!meta || !result) return
    setPhase({ kind: 'loading', label: 'Claude가 근거를 감사하는 중' })
    try {
      setAudit(await post<AuditResponse>('/api/arena/audit', { tasks: meta.tasks, runs: runsOf(result) }))
      setPhase({ kind: 'idle' })
    } catch (e) {
      setPhase({ kind: 'error', message: (e as Error).message })
    }
  }

  const busy = phase.kind === 'loading'

  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 py-8">
      <header className="space-y-2">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="figure text-4xl font-bold">최고 모델도 틀린다</h1>
          {result && (result.live
            ? <Badge tone="canopy">Claude 응답 LIVE</Badge>
            : <Badge>Claude 응답 재생 {result.replayed}건</Badge>)}
        </div>
        <p className="max-w-3xl text-[var(--ink-2)]">
          Claude Haiku·Sonnet·Opus가 t0 시점의 예보와 관측만 도구로 조회해 확률과 결정을 내고, t0 이후 실제 관측으로 자동 채점됩니다. 채점자는 사람이 아니라 실제 날씨입니다.
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button disabled={busy || !meta?.replayable} onClick={() => meta && run(meta.tasks, meta.models, false)}>저장 응답 재생</Button>
          <Button variant="solid" disabled={busy || !meta?.liveAvailable} onClick={() => meta && run(meta.tasks, meta.models, true)}
            title={meta?.liveAvailable ? '서버가 Claude 3모델을 실제로 호출합니다' : '서버에 ANTHROPIC_API_KEY가 없습니다'}>
            실제로 실행
          </Button>
        </div>
      </header>

      {phase.kind === 'loading' && <p className="text-sm text-[var(--ink-2)]">{phase.label}…</p>}
      {phase.kind === 'error' && <p className="border-l-4 border-[var(--loam)] pl-3 text-sm">{phase.message}</p>}

      {meta && result && <Results meta={meta} result={result} audit={audit} onRationaleAudit={runRationaleAudit} busy={busy} />}
    </main>
  )
}

function Results({ meta, result, audit, onRationaleAudit, busy }: { meta: TasksResponse; result: RunResponse; audit?: AuditResponse; onRationaleAudit(): void; busy: boolean }) {
  const board = useMemo(
    () => scoreboard(result.scores).sort((a, b) => meta.models.indexOf(a.model) - meta.models.indexOf(b.model) || FAMILIES.indexOf(a.family as FamilyId) - FAMILIES.indexOf(b.family as FamilyId)),
    [result, meta.models],
  )
  const ranks = useMemo(() => leaderboard(result.scores), [result])
  const miss = useMemo(() => topModelMissRate(result.scores), [result])
  // 범례·표 순서를 모델 순서(Haiku → Sonnet → Opus)에 고정
  const calibrations = useMemo(
    () => calibrate(pairsOf(result.answers, result.scores)).sort((a, b) => meta.models.indexOf(a.model) - meta.models.indexOf(b.model)),
    [result, meta.models],
  )

  return (
    <>
      <Section>
        <div className="grid gap-x-12 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          <Figure size="lg" tone="loam" label={miss ? `1위 ${modelLabel(miss.model)}도 틀린 비율 (판정 과제 ${miss.n}개)` : '1위 모델도 틀린 비율'} value={miss ? pct(miss.missRate) : '—'} />
          <Figure size="lg" label="1위 skill (0 = 원천 예보를 그대로 쓴 수준)" value={ranks[0] ? signed(ranks[0].skill) : '—'} />
          <Figure size="lg" label={`과제 × 모델, 채점 ${result.scores.length}건`} value={`${meta.tasks.length} × ${meta.models.length}`} />
          <Figure size="lg" tone="canopy" label="사람 라벨 (정답은 t0 이후 실측)" value="0명" />
        </div>
      </Section>

      <Lanes meta={meta} result={result} />

      <div className="grid gap-10 lg:grid-cols-2">
        <Section title="리더보드" note="패밀리별 평균 skill의 평균, 과제별 -1~1로 자름">
          <table className="w-full text-sm">
            <tbody>
              {ranks.map(r => (
                <tr key={r.model} className="border-b border-[var(--rule)] last:border-0">
                  <td className="figure w-10 py-2.5 text-2xl text-[var(--ink-2)]">{r.rank}</td>
                  <td className="py-2.5 font-medium"><Model id={r.model} /></td>
                  <td className="figure py-2.5 text-right text-xl">{signed(r.skill)}</td>
                  <td className="w-24 py-2.5 text-right text-[var(--ink-2)]">정답 <span className="tnum">{pct(r.accuracy)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="보정 곡선" note="이진 확률 과제만, 점선은 완벽한 보정">
          {calibrations.length ? (
            <>
              <CalibrationChart calibrations={calibrations} />
              <table className="mt-2 w-full text-sm">
                <thead className="text-left text-xs text-[var(--ink-2)]">
                  <tr className="border-b border-[var(--rule)]">
                    <th className={TH}>모델</th><th className={TH}>과제</th><th className={TH}>Brier</th>
                    <th className={TH} title="낮을수록 확률이 실제 빈도와 맞습니다">신뢰도 오차</th>
                    <th className={TH} title="높을수록 상황을 잘 구분합니다">분해능</th>
                  </tr>
                </thead>
                <tbody className="tnum">
                  {calibrations.map(c => (
                    <tr key={c.model} className="border-b border-[var(--rule)] last:border-0">
                      <td className={TD}><Model id={c.model} /></td>
                      <td className={TD}>{c.n}</td>
                      <td className={TD}>{num(c.brier, 3)}</td>
                      <td className={TD}>{num(c.reliability, 3)}</td>
                      <td className={TD}>{num(c.resolution, 3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : <p className="text-sm text-[var(--ink-2)]">확률 과제 결과가 없습니다.</p>}
        </Section>
      </div>

      <Section title="점수표" note="Brier·CRPS·regret은 낮을수록, skill은 높을수록 좋습니다">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-[var(--ink-2)]">
              <tr className="border-b border-[var(--rule)]">
                {['모델', '패밀리', '과제', 'Brier', 'CRPS', 'regret', 'skill', '정답률', '누출 표시'].map(h => <th key={h} className={TH}>{h}</th>)}
              </tr>
            </thead>
            <tbody className="tnum">
              {board.map(c => (
                <tr key={`${c.model}|${c.family}`} className="border-b border-[var(--rule)] last:border-0">
                  <td className={TD}><Model id={c.model} /></td>
                  <td className={TD}>{c.family === 'all' ? '전체' : FAMILY_LABEL[c.family]}</td>
                  <td className={TD}>{c.n}</td>
                  <td className={TD}>{num(c.brier, 3)}</td>
                  <td className={TD}>{num(c.crps)}</td>
                  <td className={TD}>{c.regretUsd == null ? '—' : `${usd(c.regretUsd)}/acre`}</td>
                  <td className={TD} title={`자르지 않은 평균 ${signed(c.skillRaw)}`}>{signed(c.skill)}</td>
                  <td className={TD}>{pct(c.accuracy)}</td>
                  <td className={TD}>{c.leaks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Audit audit={audit} tasks={meta.tasks} onRationaleAudit={onRationaleAudit} busy={busy} liveAvailable={meta.liveAvailable} />

      {result.errors.length > 0 && (
        <Section title={`실행 오류 ${result.errors.length}건`}>
          <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--ink-2)]">
            {result.errors.map(e => <li key={`${e.taskId}|${e.model}`}>{e.taskId}, {modelLabel(e.model)}: {e.message}</li>)}
          </ul>
        </Section>
      )}
    </>
  )
}

// 같은 과제를 모델별 레인으로 나란히
function Lanes({ meta, result }: { meta: TasksResponse; result: RunResponse }) {
  const [family, setFamily] = useState<FamilyId>('decision')
  const tasks = meta.tasks.filter(t => t.family === family)
  const [taskId, setTaskId] = useState<string>()
  const task = tasks.find(t => t.id === taskId) ?? tasks[0]

  return (
    <Section title="같은 과제, 세 모델">
      <div className="mb-4 flex flex-wrap items-center gap-2" role="tablist" aria-label="과제 패밀리">
        {FAMILIES.map(f => (
          <Button key={f} role="tab" aria-selected={f === family} active={f === family} onClick={() => { setFamily(f); setTaskId(undefined) }}>
            {FAMILY_LABEL[f]}
          </Button>
        ))}
        <select aria-label="과제" className="ml-auto rounded-sm border border-[var(--rule)] bg-[var(--paper-2)] px-2 py-1.5 text-sm" value={task?.id} onChange={e => setTaskId(e.target.value)}>
          {tasks.map(t => <option key={t.id} value={t.id}>{t.id}, {t.field.name}</option>)}
        </select>
      </div>
      {!task ? <p className="text-sm text-[var(--ink-2)]">이 패밀리의 과제가 없습니다.</p> : (
        <>
          <div className="mb-5 max-w-4xl space-y-1">
            <p>{task.prompt}</p>
            <p className="tnum text-xs text-[var(--ink-2)]">t0 {task.t0}, 판정 {task.resolveAt}, {task.field.name} ({task.field.acres} acre, {task.field.crop})</p>
          </div>
          <div className="grid gap-8 lg:grid-cols-3">
            {meta.models.map(model => (
              <Lane
                key={model}
                model={model}
                answer={result.answers.find(a => a.taskId === task.id && a.model === model)}
                score={result.scores.find(s => s.taskId === task.id && s.model === model)}
                error={result.errors.find(e => e.taskId === task.id && e.model === model)?.message}
              />
            ))}
          </div>
        </>
      )}
    </Section>
  )
}

function Lane({ model, answer, score, error }: { model: string; answer?: Answer; score?: Score; error?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-3 border-t-4 pt-3" style={{ borderColor: modelColor(model) }}>
      <div className="flex items-center gap-2">
        <span className="font-semibold"><Model id={model} /></span>
        {score?.correct != null && <Badge tone={score.correct ? 'canopy' : 'loam'}>{score.correct ? '맞음' : '틀림'}</Badge>}
      </div>
      {error && <p className="border-l-4 border-[var(--loam)] pl-3 text-sm">{error}</p>}
      {answer && (
        <>
          <p className="figure text-xl">{answerSummary(answer)}</p>
          <p className="text-sm text-[var(--ink-2)]">{answer.rationale}</p>
          <details className="text-sm">
            <summary className="cursor-pointer text-[var(--ink-2)]">도구 호출 {answer.toolCalls.length}회</summary>
            <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-xs text-[var(--ink-2)]">
              {answer.toolCalls.map((c, i) => (
                <li key={i} className="break-all">
                  {c.name}{c.args && Object.keys(c.args as object).length ? ` ${JSON.stringify(c.args)}` : ''}
                </li>
              ))}
            </ol>
          </details>
        </>
      )}
      {score && (
        <div className="mt-auto space-y-1 border-t border-[var(--rule)] pt-2">
          <p className="tnum text-sm">{scoreSummary(score)}</p>
          {score.leakFlags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {score.leakFlags.map(f => <Badge key={f} tone={isBlockedAttempt(f) ? 'plain' : 'loam'}>{leakLabel(f)}</Badge>)}
            </div>
          )}
          {score.resolvedWith && <p className="tnum text-xs text-[var(--ink-2)]">채점: {score.resolvedWith.stationId} 실측, {score.resolvedWith.at.slice(0, 16)}Z</p>}
        </div>
      )}
    </div>
  )
}

function Audit({ audit, tasks, onRationaleAudit, busy, liveAvailable }: { audit?: AuditResponse; tasks: Task[]; onRationaleAudit(): void; busy: boolean; liveAvailable: boolean }) {
  const blocked = audit?.findings.filter(f => f.source === 'tool') ?? []
  const flagged = audit?.findings.filter(f => f.source === 'rationale') ?? []
  const fieldName = (id: string) => tasks.find(t => t.id === id)?.field.name ?? id
  return (
    <Section title="누출 감사" note="도구는 t0 이후 데이터를 돌려주지 않습니다">
      {!audit ? <p className="text-sm text-[var(--ink-2)]">감사 결과를 기다리는 중…</p> : (
        <div className="space-y-4">
          <div className="grid gap-x-12 gap-y-4 sm:grid-cols-3">
            {audit.summary.map(s => (
              <div key={s.model}>
                <p className="font-medium"><Model id={s.model} /></p>
                <p className="mt-1 text-sm text-[var(--ink-2)]">
                  차단된 요청 <span className="figure text-lg text-[var(--ink)]">{s.toolAttempts}</span>
                  , 근거 적발 <span className="figure text-lg text-[var(--ink)]">{audit.rationaleChecked ? s.rationaleFlags : '—'}</span>
                </p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="max-w-3xl text-sm text-[var(--ink-2)]">
              차단된 요청은 에이전트가 t0 이후 구간을 요청했다가 잘린 기록이고, 실제로 새어 나간 데이터는 없습니다.
              {audit.rationaleChecked ? ' 근거 감사는 Claude가 각 답의 근거를 읽고 판정했습니다.' : ' 근거 감사는 아직 하지 않았습니다.'}
            </p>
            <Button className="ml-auto" disabled={busy || !liveAvailable} onClick={onRationaleAudit}
              title={liveAvailable ? 'Claude가 각 근거를 읽고 t0 이후 사실을 아는 듯 쓰는지 검사합니다' : '서버에 ANTHROPIC_API_KEY가 없습니다'}>
              Claude로 근거 감사
            </Button>
          </div>
          {flagged.map((f, i) => (
            <div key={i} className="space-y-1 border-l-4 border-[var(--loam)] pl-4 text-sm">
              <p className="font-medium"><Model id={f.model} />, {fieldName(f.taskId)}</p>
              {f.quote && <blockquote className="italic">“{f.quote}”</blockquote>}
              <p className="text-[var(--ink-2)]">{f.reason} (확신 {pct(f.confidence)})</p>
            </div>
          ))}
          {blocked.length > 0 && (
            <ul className="space-y-1 text-sm">
              {blocked.map((f, i) => (
                <li key={i} className="flex flex-wrap items-center gap-2">
                  <Model id={f.model} />
                  <span className="text-[var(--ink-2)]">{f.taskId}</span>
                  <Badge>{leakLabel(f.flag)}</Badge>
                </li>
              ))}
            </ul>
          )}
          {blocked.length === 0 && flagged.length === 0 && <p className="text-sm text-[var(--ink-2)]">적발된 것이 없습니다.</p>}
        </div>
      )}
    </Section>
  )
}
