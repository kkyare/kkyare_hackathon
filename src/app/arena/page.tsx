'use client'
// Model Arena: 같은 과제를 Claude Haiku/Sonnet/Opus가 풀고, 실제 날씨로 자동 채점된다 (데모 장면 2:05)
// 기본은 저장 응답 재생(?mock=1). "실제 실행"을 누르면 서버가 Claude를 실제로 호출하고, 그때만 LIVE 배지가 뜬다.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { calibrate, pairsOf } from '../../arena/calibration'
import { leaderboard, scoreboard, topModelMissRate } from '../../arena/scoreboard'
import type { Answer, FamilyId, Score, Task } from '../../core/types'
import { CalibrationChart } from './CalibrationChart'
import { answerSummary, FAMILY_LABEL, isBlockedAttempt, leakLabel, modelColor, modelLabel, num, pct, scoreSummary, signed, usd } from './format'
import { Badge, Card, Empty, ModelDot, Stat, TONE, UI } from './ui'

// /api/arena/* 응답 (서버 전용 모듈을 클라이언트 번들에 끌어오지 않으려고 여기서 선언)
type TasksResponse = { tasks: Task[]; models: string[]; replayable: boolean; liveAvailable: boolean }
type RunResponse = { answers: Answer[]; scores: Score[]; errors: { taskId: string; model: string; message: string }[]; live: boolean; replayed: number }
type Finding = { taskId: string; model: string; source: 'tool' | 'rationale'; flag: string; confidence: number; quote?: string; reason: string }
type AuditResponse = { findings: Finding[]; summary: { model: string; runs: number; toolAttempts: number; rationaleFlags: number; flaggedTasks: number }[]; rationaleChecked: boolean }

type Phase = { kind: 'idle' } | { kind: 'loading'; label: string } | { kind: 'error'; message: string }

const FAMILIES: FamilyId[] = ['nowcasting', 'downscaling', 'decision', 's2s']

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
  return json as T
}

export default function ArenaPage() {
  const [meta, setMeta] = useState<TasksResponse>()
  const [result, setResult] = useState<RunResponse>()
  const [audit, setAudit] = useState<AuditResponse>()
  const [phase, setPhase] = useState<Phase>({ kind: 'loading', label: '과제 불러오는 중' })

  const run = useCallback(async (tasks: Task[], models: string[], live: boolean) => {
    setPhase({ kind: 'loading', label: live ? 'Claude 3모델 실행 중 (약 1-2분)' : '저장 응답 재생 중' })
    setAudit(undefined)
    try {
      const r = await post<RunResponse>(`/api/arena/run${live ? '' : '?mock=1'}`, { tasks, models })
      setResult(r)
      setPhase({ kind: 'idle' })
      // 도구 기록 감사는 Claude 호출 없이 바로 (근거 감사는 버튼으로)
      const runs = r.answers.map(a => ({ taskId: a.taskId, model: a.model, answer: a, leakFlags: r.scores.find(s => s.taskId === a.taskId && s.model === a.model)?.leakFlags ?? [] }))
      setAudit(await post<AuditResponse>('/api/arena/audit?mock=1', { tasks, runs }))
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
    setPhase({ kind: 'loading', label: 'Claude로 근거 감사 중' })
    try {
      const runs = result.answers.map(a => ({ taskId: a.taskId, model: a.model, answer: a, leakFlags: result.scores.find(s => s.taskId === a.taskId && s.model === a.model)?.leakFlags ?? [] }))
      setAudit(await post<AuditResponse>('/api/arena/audit', { tasks: meta.tasks, runs }))
      setPhase({ kind: 'idle' })
    } catch (e) {
      setPhase({ kind: 'error', message: (e as Error).message })
    }
  }

  const busy = phase.kind === 'loading'

  return (
    <main className="min-h-screen break-keep bg-zinc-50 text-zinc-900">
      <div className="mx-auto flex max-w-screen-2xl flex-col gap-5 px-4 py-6 sm:px-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">Model Arena</h1>
            <Badge tone={TONE.demo} title="날씨 예보·관측은 목업 시나리오">DEMO DATA</Badge>
            {result && (result.live
              ? <Badge tone={TONE.live} title="이번 결과는 Claude를 실제로 호출한 응답">Claude 응답 LIVE</Badge>
              : <Badge tone={TONE.neutral} title="fixtures/arena/runs.json: 실제 Claude 응답을 미리 기록해 재생">Claude 응답 재생 ({result.replayed}개)</Badge>)}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className={UI.buttonGhost} disabled={busy || !meta?.replayable} onClick={() => meta && run(meta.tasks, meta.models, false)}>
              저장 응답 재생
            </button>
            <button className={UI.button} disabled={busy || !meta?.liveAvailable} onClick={() => meta && run(meta.tasks, meta.models, true)}
              title={meta?.liveAvailable ? '서버가 Claude 3모델을 실제로 호출' : '서버에 ANTHROPIC_API_KEY가 없음'}>
              실제 실행 (LIVE)
            </button>
          </div>
        </header>
        <p className="max-w-3xl text-sm text-zinc-600">
          Claude 3모델이 t0 시점 예보·관측만 도구로 조회해 확률과 결정을 내고, t0 이후 실제 관측으로 자동 채점됩니다. 채점자는 사람이 아니라 실제 날씨입니다.
        </p>

        {phase.kind === 'loading' && <div className="rounded-lg bg-white p-3 text-sm text-zinc-600 ring-1 ring-zinc-200">{phase.label}…</div>}
        {phase.kind === 'error' && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">오류: {phase.message}</div>}

        {meta && result ? <Results meta={meta} result={result} audit={audit} onRationaleAudit={runRationaleAudit} busy={busy} /> : phase.kind !== 'error' && <Empty text="결과를 기다리는 중" />}
      </div>
    </main>
  )
}

function Results({ meta, result, audit, onRationaleAudit, busy }: { meta: TasksResponse; result: RunResponse; audit?: AuditResponse; onRationaleAudit(): void; busy: boolean }) {
  const board = useMemo(() => scoreboard(result.scores), [result])
  const ranks = useMemo(() => leaderboard(result.scores), [result])
  const miss = useMemo(() => topModelMissRate(result.scores), [result])
  // 범례·표 순서를 모델 순서(Haiku → Sonnet → Opus)에 고정
  const calibrations = useMemo(
    () => calibrate(pairsOf(result.answers, result.scores)).sort((a, b) => meta.models.indexOf(a.model) - meta.models.indexOf(b.model)),
    [result, meta.models],
  )

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="최고 모델도 틀린 비율" value={miss ? pct(miss.missRate) : '—'} tone="text-red-700"
          hint={miss ? `${modelLabel(miss.model)} · 판정 가능한 과제 ${miss.n}개 중` : undefined} />
        <Stat label="1위 skill" value={ranks[0] ? signed(ranks[0].skill) : '—'} hint="0 = 원천 예보를 그대로 쓴 수준" />
        <Stat label="과제 × 모델" value={`${meta.tasks.length} × ${meta.models.length}`} hint={`채점 ${result.scores.length}건 · 오류 ${result.errors.length}건`} />
        <Stat label="사람 라벨" value="0명" hint="정답은 t0 이후 실측" tone="text-emerald-700" />
      </div>

      <Lanes meta={meta} result={result} />

      <div className="grid gap-5 xl:grid-cols-2">
        <Card title="리더보드" aside={<span className="text-xs text-zinc-500">패밀리별 평균 skill의 평균 · 과제별 [-1, 1]로 자름</span>}>
          <ol className="flex flex-col gap-2">
            {ranks.map(r => (
              <li key={r.model} className="flex items-center gap-3 rounded-lg bg-zinc-50 px-3 py-2">
                <span className={`w-6 text-lg font-semibold text-zinc-400 ${UI.mono}`}>{r.rank}</span>
                <ModelDot color={modelColor(r.model)} />
                <span className="font-medium">{modelLabel(r.model)}</span>
                <span className={`ml-auto ${UI.mono}`}>skill {signed(r.skill)}</span>
                <span className={`w-24 text-right text-sm text-zinc-500 ${UI.mono}`}>정답 {pct(r.accuracy)}</span>
              </li>
            ))}
          </ol>
        </Card>

        <Card title="보정 곡선" aside={<span className="text-xs text-zinc-500">이진 확률 과제만 · 점선 = 완벽한 보정</span>}>
          {calibrations.length ? (
            <>
              <CalibrationChart calibrations={calibrations} />
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200">
                    <th className={UI.th}>모델</th><th className={UI.th}>n</th><th className={UI.th}>Brier</th>
                    <th className={UI.th} title="낮을수록 확률이 실제 빈도와 맞음">신뢰도 오차</th>
                    <th className={UI.th} title="높을수록 상황을 잘 구분함">분해능</th>
                  </tr>
                </thead>
                <tbody>
                  {calibrations.map(c => (
                    <tr key={c.model} className="border-b border-zinc-100 last:border-0">
                      <td className={UI.td}><span className="flex items-center gap-2"><ModelDot color={modelColor(c.model)} />{modelLabel(c.model)}</span></td>
                      <td className={`${UI.td} ${UI.mono}`}>{c.n}</td>
                      <td className={`${UI.td} ${UI.mono}`}>{num(c.brier, 3)}</td>
                      <td className={`${UI.td} ${UI.mono}`}>{num(c.reliability, 3)}</td>
                      <td className={`${UI.td} ${UI.mono}`}>{num(c.resolution, 3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : <Empty text="확률 과제 결과가 없음" />}
        </Card>
      </div>

      <Card title="점수표" aside={<span className="text-xs text-zinc-500">Brier·CRPS·regret은 낮을수록, skill은 높을수록 좋음</span>}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200">
                {['모델', '패밀리', 'n', 'Brier', 'CRPS', 'regret', 'skill', '정답률', '누출 플래그'].map(h => <th key={h} className={UI.th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {board.map(c => (
                <tr key={`${c.model}|${c.family}`} className="border-b border-zinc-100 last:border-0">
                  <td className={UI.td}><span className="flex items-center gap-2"><ModelDot color={modelColor(c.model)} />{modelLabel(c.model)}</span></td>
                  <td className={UI.td}>{c.family === 'all' ? '전체' : FAMILY_LABEL[c.family]}</td>
                  <td className={`${UI.td} ${UI.mono}`}>{c.n}</td>
                  <td className={`${UI.td} ${UI.mono}`}>{num(c.brier, 3)}</td>
                  <td className={`${UI.td} ${UI.mono}`}>{num(c.crps)}</td>
                  <td className={`${UI.td} ${UI.mono}`}>{c.regretUsd == null ? '—' : `${usd(c.regretUsd)}/acre`}</td>
                  <td className={`${UI.td} ${UI.mono}`} title={`자르지 않은 평균 ${signed(c.skillRaw)}`}>{signed(c.skill)}</td>
                  <td className={`${UI.td} ${UI.mono}`}>{pct(c.accuracy)}</td>
                  <td className={`${UI.td} ${UI.mono}`}>{c.leaks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <AuditCard audit={audit} tasks={meta.tasks} onRationaleAudit={onRationaleAudit} busy={busy} liveAvailable={meta.liveAvailable} />

      {result.errors.length > 0 && (
        <Card title={`실행 오류 ${result.errors.length}건`}>
          <ul className="list-disc pl-5 text-sm text-zinc-600">
            {result.errors.map(e => <li key={`${e.taskId}|${e.model}`}>{e.taskId} × {modelLabel(e.model)}: {e.message}</li>)}
          </ul>
        </Card>
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
    <Card
      title="모델 레인"
      aside={
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg bg-zinc-100 p-0.5">
            {FAMILIES.map(f => (
              <button key={f} onClick={() => { setFamily(f); setTaskId(undefined) }}
                className={`rounded-md px-2.5 py-1 text-sm ${f === family ? 'bg-white font-medium shadow-sm' : 'text-zinc-600'}`}>
                {FAMILY_LABEL[f]}
              </button>
            ))}
          </div>
          <select className={UI.select} value={task?.id} onChange={e => setTaskId(e.target.value)}>
            {tasks.map(t => <option key={t.id} value={t.id}>{t.id} · {t.field.name}</option>)}
          </select>
        </div>
      }
    >
      {!task ? <Empty text="이 패밀리의 과제가 없음" /> : (
        <>
          <div className="rounded-lg bg-zinc-50 p-3 text-sm">
            <div className="text-zinc-800">{task.prompt}</div>
            <div className={`mt-1 text-xs text-zinc-500 ${UI.mono}`}>t0 {task.t0} → 판정 {task.resolveAt} · {task.field.name} ({task.field.acres} acre, {task.field.crop})</div>
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            {meta.models.map(model => {
              const answer = result.answers.find(a => a.taskId === task.id && a.model === model)
              const score = result.scores.find(s => s.taskId === task.id && s.model === model)
              const error = result.errors.find(e => e.taskId === task.id && e.model === model)
              return <Lane key={model} model={model} answer={answer} score={score} error={error?.message} />
            })}
          </div>
        </>
      )}
    </Card>
  )
}

function Lane({ model, answer, score, error }: { model: string; answer?: Answer; score?: Score; error?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-zinc-200 p-4" style={{ borderTopColor: modelColor(model), borderTopWidth: 3 }}>
      <div className="flex items-center gap-2">
        <ModelDot color={modelColor(model)} />
        <span className="font-semibold">{modelLabel(model)}</span>
        {score?.correct != null && <Badge tone={score.correct ? TONE.good : TONE.bad}>{score.correct ? '✓ 맞음' : '✗ 틀림'}</Badge>}
      </div>
      {error && <div className="text-sm text-red-700">오류: {error}</div>}
      {answer && (
        <>
          <div className={`text-sm font-medium ${UI.mono}`}>{answerSummary(answer)}</div>
          <p className="text-sm text-zinc-600">{answer.rationale}</p>
          <div>
            <div className={UI.label}>도구 호출 {answer.toolCalls.length}회</div>
            <ol className="mt-1 flex flex-col gap-0.5">
              {answer.toolCalls.map((c, i) => (
                <li key={i} className={`truncate text-xs text-zinc-500 ${UI.mono}`} title={JSON.stringify(c.args)}>
                  {i + 1}. {c.name}({c.args && Object.keys(c.args as object).length ? JSON.stringify(c.args) : ''})
                </li>
              ))}
            </ol>
          </div>
        </>
      )}
      {score && (
        <div className="mt-auto flex flex-col gap-1 border-t border-zinc-100 pt-2">
          <div className={`text-xs text-zinc-700 ${UI.mono}`}>{scoreSummary(score)}</div>
          {score.leakFlags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {score.leakFlags.map(f => <Badge key={f} tone={isBlockedAttempt(f) ? TONE.neutral : TONE.bad}>{leakLabel(f)}</Badge>)}
            </div>
          )}
          {score.resolvedWith && <div className={`text-xs text-zinc-400 ${UI.mono}`}>채점: {score.resolvedWith.stationId} 실측 @ {score.resolvedWith.at.slice(0, 16)}Z</div>}
        </div>
      )}
    </div>
  )
}

function AuditCard({ audit, tasks, onRationaleAudit, busy, liveAvailable }: { audit?: AuditResponse; tasks: Task[]; onRationaleAudit(): void; busy: boolean; liveAvailable: boolean }) {
  const blocked = audit?.findings.filter(f => f.source === 'tool') ?? []
  const flagged = audit?.findings.filter(f => f.source === 'rationale') ?? []
  const prompt = (id: string) => tasks.find(t => t.id === id)?.field.name ?? id
  return (
    <Card
      title="누출 감사"
      aside={
        <button className={UI.buttonGhost} disabled={busy || !liveAvailable || !audit} onClick={onRationaleAudit}
          title={liveAvailable ? 'Claude가 각 근거를 읽고 t0 이후 사실을 아는 듯 쓰는지 검사' : '서버에 ANTHROPIC_API_KEY가 없음'}>
          Claude로 근거 감사
        </button>
      }
    >
      {!audit ? <Empty text="감사 결과를 기다리는 중" /> : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {audit.summary.map(s => (
              <div key={s.model} className="rounded-lg bg-zinc-50 p-3">
                <div className="flex items-center gap-2 font-medium"><ModelDot color={modelColor(s.model)} />{modelLabel(s.model)}</div>
                <div className={`mt-1 text-sm text-zinc-600 ${UI.mono}`}>차단된 요청 {s.toolAttempts} · 근거 적발 {audit.rationaleChecked ? s.rationaleFlags : '—'}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-500">
            도구는 t0 이후 데이터를 돌려주지 않습니다. "차단된 요청"은 에이전트가 t0 이후 구간을 요청했다가 잘린 기록이고, 실제로 새어 나간 데이터는 없습니다.
            {audit.rationaleChecked ? ' 근거 감사는 Claude가 각 답의 근거를 읽고 판정했습니다.' : ' 근거 감사는 아직 실행하지 않았습니다.'}
          </p>
          {flagged.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2">
              {flagged.map((f, i) => (
                <div key={i} className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm">
                  <div className="flex items-center gap-2 font-medium text-red-800"><ModelDot color={modelColor(f.model)} />{modelLabel(f.model)} · {prompt(f.taskId)}</div>
                  {f.quote && <blockquote className="mt-1 border-l-2 border-red-300 pl-2 text-red-900">“{f.quote}”</blockquote>}
                  <div className="mt-1 text-red-700">{f.reason} (확신 {pct(f.confidence)})</div>
                </div>
              ))}
            </div>
          )}
          {blocked.length > 0 && (
            <ul className="flex flex-col gap-1 text-sm text-zinc-600">
              {blocked.map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <ModelDot color={modelColor(f.model)} />
                  <span>{modelLabel(f.model)} · {f.taskId}</span>
                  <Badge tone={TONE.neutral}>{leakLabel(f.flag)}</Badge>
                </li>
              ))}
            </ul>
          )}
          {blocked.length === 0 && flagged.length === 0 && <Empty text="적발 없음" />}
        </>
      )}
    </Card>
  )
}
