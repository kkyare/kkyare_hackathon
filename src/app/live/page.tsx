'use client'
// TODO(shadcn): components/ui 가 생기면 StepCard -> Card, Badge -> Badge, <select> -> Select, <button> -> Button 으로 교체.
// TODO(next): ?scenario= 읽기는 next/navigation useSearchParams(+Suspense) 로 교체 가능. 지금은 Next 의존 없이 window 로 읽는다.
import { useEffect, useRef, useState, type ReactNode } from 'react'
// 공통 계약 타입만 type-only 로 가져온다 (런타임 import 없음). 서버 전용 replay.ts·arena/api.ts(node:fs, SDK)는 끌어오지 않는다.
import type { Answer, Score, Task } from '../../core/types'

type Status = 'GO' | 'CAUTION' | 'NO_GO'
type Frame = { time: string; windMph: number | null; gustMph: number | null; precipIn: number | null; status: Status; reasons: string[] }
type ModelSummary = { model: string; issuedAt: string; windowMaxGust: number | null; windowMaxWind: number | null; violation: boolean }
// /api/live 응답의 wire 타입 (src/families/nowcasting/replay.ts Replay 와 같은 모양). task 는 그대로 /api/arena/run 에 넘긴다.
type Replay = {
  demo: true
  scenario: string
  task: Task
  snapshotSummary: { snapshotId: string; models: ModelSummary[] }
  answer: Answer
  frames: Frame[]
  verdict: { violation: boolean; status: Status; reasons: string[] }
  score: Score
  assumptions: { costUsdPerAcre: number; lossUsdPerAcre: number }
}
type PanelState = { kind: 'loading' } | { kind: 'ok'; data: Replay } | { kind: 'error'; message: string }
// POST /api/arena/run 응답의 wire 타입 (src/arena/api.ts ArenaRunResponse 와 같은 모양)
type ArenaResult = {
  answers: Answer[]
  scores: Score[]
  errors: { taskId: string; model: string; message: string }[]
  live: boolean // 모든 답이 실제 Claude 호출이면 true. 하나라도 저장 응답이면 false
  replayed: number // 저장 응답으로 대체된 수
}
type ArenaState = { kind: 'idle' } | { kind: 'loading' } | { kind: 'ok'; data: ArenaResult } | { kind: 'error'; message: string }

const SCENARIOS = [
  { id: 'forecast-miss', label: '예보가 빗나간 날' },
  { id: 'gust-block', label: '돌풍으로 살포가 막힌 날' },
  { id: 'calm-go', label: '바람이 잔잔한 날' },
] as const
const DEFAULT_SCENARIO = 'forecast-miss'
const STEP_MS = 600
const SCALE_TOP_MPH = 25
const THRESHOLD_MPH = [10, 15]
const ASSUMPTION_BADGE = '가정값: 살포를 미루는 비용 $7/acre, 다시 살포하는 비용 $31/acre'
const SKILL_HINT = '1이면 완벽, 0이면 공개 예보와 같음, 음수면 더 나쁨'
// Arena 비교 모델 (src/core/agent.ts ARENA_MODELS 와 같은 순서). agent.ts 는 SDK를 import 하므로 여기서 따로 적는다.
const ARENA_MODELS = [
  { id: 'claude-haiku-5-5', label: 'Haiku' },
  { id: 'claude-sonnet-5-5', label: 'Sonnet' },
  { id: 'claude-opus-5-5', label: 'Opus' },
] as const

const UI = {
  card: 'flex min-w-0 flex-col gap-4 border-t border-[var(--ink)] pt-3',
  badge: 'inline-flex items-center gap-1 whitespace-nowrap rounded-sm px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset',
  label: 'text-xs text-[var(--ink-2)]',
  mono: 'tnum',
  button:
    'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-sm bg-[var(--ink)] px-3 py-1.5 text-sm font-medium text-[var(--paper-2)] hover:bg-[var(--ink-2)] disabled:cursor-not-allowed disabled:opacity-40',
}
const TONE = {
  neutral: 'bg-zinc-100 text-zinc-700 ring-zinc-200',
  demo: 'bg-amber-50 text-amber-800 ring-amber-200',
  info: 'bg-sky-50 text-sky-700 ring-sky-200',
  live: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  error: 'bg-red-50 text-red-700 ring-red-200',
}
const STATUS_STYLE: Record<Status, { chip: string; text: string; bar: string; barSoft: string }> = {
  GO: { chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200', text: 'text-emerald-700', bar: 'bg-emerald-500', barSoft: 'bg-emerald-300' },
  CAUTION: { chip: 'bg-amber-50 text-amber-700 ring-amber-200', text: 'text-amber-700', bar: 'bg-amber-500', barSoft: 'bg-amber-300' },
  NO_GO: { chip: 'bg-red-50 text-red-700 ring-red-200', text: 'text-red-700', bar: 'bg-red-500', barSoft: 'bg-red-300' },
}
const MODEL_LABEL: Record<string, string> = {
  ncep_hrrr_conus: 'HRRR',
  ncep_nbm_conus: 'NBM',
  gfs_seamless: 'GFS',
  ecmwf_ifs025: 'ECMWF IFS',
}
const REASON_LABEL: Record<string, string> = {
  GUST_HIGH: '돌풍 초과',
  WIND_HIGH: '풍속 초과',
  WIND_LOW: '풍속 부족',
  WIND_LOW_INVERSION: '야간 역전층',
  RAIN_WITHIN_RAINFAST: '내건 시간 내 강우',
  MISSING_DATA: '결측',
}
const DECISION_LABEL: Record<string, string> = { spray: '지금 살포', delay: '3시간 연기' }

const hhZ = (iso: string) => `${iso.slice(11, 13)}Z`
const hhmmZ = (iso: string) => `${iso.slice(11, 16)}Z`
const dateZ = (iso: string) => `${iso.slice(0, 10)} ${hhmmZ(iso)}`
const cdt = (iso: string) => `${String((Number(iso.slice(11, 13)) + 19) % 24).padStart(2, '0')}:${iso.slice(14, 16)} CDT`
const num = (v: number | null | undefined, digits = 1) => (v == null ? '—' : v.toFixed(digits))
const pct = (v: number | null | undefined) => (v == null ? '—' : `${Math.round(v * 100)}%`)
const usd = (v: number) => `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
const signed = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(2)}`

function Badge({ tone, children }: { tone: string; children: ReactNode }) {
  return <span className={`${UI.badge} ${tone}`}>{children}</span>
}

function StepCard({ step, title, aside, className = '', children }: { step: string; title: string; aside?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section className={`${UI.card} ${className}`}>
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex shrink-0 items-center gap-2 text-base font-semibold">
          <span className="text-xl leading-none text-zinc-400">{step}</span>
          {title}
        </h2>
        {aside}
      </header>
      {children}
    </section>
  )
}

function Stat({ label, value, hint, tone = 'text-zinc-900' }: { label: string; value: string; hint?: string; tone?: string }) {
  return (
    <div className="rounded-lg bg-zinc-50 p-3">
      <div className={UI.label}>{label}</div>
      <div className={`mt-1 text-xl font-semibold ${UI.mono} ${tone}`}>{value}</div>
      {hint && <div className="mt-0.5 text-xs text-zinc-500">{hint}</div>}
    </div>
  )
}

function Skeleton({ lines }: { lines: number }) {
  return (
    <div className="animate-pulse space-y-2">
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className={`h-3 rounded bg-zinc-100 ${i % 3 === 2 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-zinc-200 p-4 text-sm text-zinc-400">{text}</div>
}

function ModelTable({ models }: { models: ModelSummary[] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-zinc-200 text-left whitespace-nowrap">
          <th className={`py-1.5 pr-2 ${UI.label}`}>모델</th>
          <th className={`py-1.5 pr-2 ${UI.label}`}>발표</th>
          <th className={`py-1.5 pr-2 text-right ${UI.label}`}>풍속</th>
          <th className={`py-1.5 pr-2 text-right ${UI.label}`}>돌풍</th>
          <th className={`py-1.5 ${UI.label}`}>판정</th>
        </tr>
      </thead>
      <tbody>
        {models.map((m) => (
          <tr key={m.model} className="border-b border-zinc-100 last:border-0">
            <td className="py-1.5 pr-2 font-medium" title={m.model}>
              {MODEL_LABEL[m.model] ?? m.model}
            </td>
            <td className={`py-1.5 pr-2 whitespace-nowrap text-zinc-500 ${UI.mono}`}>{hhZ(m.issuedAt)}</td>
            <td className={`py-1.5 pr-2 text-right whitespace-nowrap ${UI.mono}`}>{num(m.windowMaxWind)}</td>
            <td className={`py-1.5 pr-2 text-right whitespace-nowrap ${UI.mono}`}>{num(m.windowMaxGust)}</td>
            <td className="py-1.5">
              <Badge tone={m.violation ? STATUS_STYLE.NO_GO.chip : STATUS_STYLE.GO.chip}>{m.violation ? '위반' : '정상'}</Badge>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function HourChart({ frames, shown }: { frames: Frame[]; shown: number }) {
  const pct = (v: number | null) => `${Math.min(100, Math.max(0, ((v ?? 0) / SCALE_TOP_MPH) * 100))}%`
  return (
    <div>
      <div className="relative h-44 rounded-lg bg-zinc-50">
        {THRESHOLD_MPH.map((mph) => (
          <div key={mph} className="absolute inset-x-0 border-t border-dashed border-zinc-400" style={{ bottom: pct(mph) }}>
            <span className={`absolute left-1 -translate-y-1/2 bg-zinc-50 px-0.5 text-xs text-zinc-500 ${UI.mono}`}>{mph}</span>
          </div>
        ))}
        <div className="absolute inset-y-0 left-8 right-0 grid grid-cols-4 gap-2 px-2">
          {frames.map((f, i) => {
            const on = i < shown
            const s = STATUS_STYLE[f.status]
            return (
              <div key={f.time} className="flex items-end justify-center gap-1">
                <div className={`w-4 rounded-t transition-[height] duration-500 ease-out ${s.bar}`} style={{ height: on ? pct(f.windMph) : '0%' }} title={`풍속 ${num(f.windMph)} mph`} />
                <div className={`w-4 rounded-t transition-[height] duration-500 ease-out ${s.barSoft}`} style={{ height: on ? pct(f.gustMph) : '0%' }} title={`돌풍 ${num(f.gustMph)} mph`} />
              </div>
            )
          })}
        </div>
      </div>
      <div className="mt-2 ml-8 grid grid-cols-4 gap-2 px-2 text-center">
        {frames.map((f, i) => {
          const on = i < shown
          const s = STATUS_STYLE[f.status]
          return (
            <div key={f.time} className={`flex flex-col items-center gap-0.5 whitespace-nowrap text-xs ${UI.mono} transition-opacity duration-300 ${on ? 'opacity-100' : 'opacity-40'}`}>
              <div className="text-zinc-600">{hhZ(f.time)}</div>
              {on ? (
                <div className={`font-semibold ${s.text}`}>{f.status}</div>
              ) : (
                <div className="text-zinc-400">대기</div>
              )}
              <div className="text-zinc-700">{on ? num(f.windMph) : '—'}</div>
              <div className="text-zinc-400">{on ? num(f.gustMph) : '—'}</div>
            </div>
          )
        })}
      </div>
      <p className="mt-2 text-xs text-zinc-500">진한 막대와 위 숫자는 풍속, 연한 막대와 아래 숫자는 돌풍입니다(mph). 점선은 풍속 상한 10, 돌풍 기준 15입니다.</p>
    </div>
  )
}

// 같은 과제를 Haiku·Sonnet·Opus 로 돌려 비교한다. 저장 답 재생이 기본 흐름이고 이 패널은 버튼을 눌렀을 때만 호출한다.
// ?mock=1: 저장 응답(fixtures/arena/runs.json)으로 재생. 저장 응답이 없는 과제는 API 의 오류를 그대로 보여 준다 (숫자를 만들어 내지 않는다).
function ArenaPanel({ task }: { task: Task }) {
  const [state, setState] = useState<ArenaState>({ kind: 'idle' })
  const abortRef = useRef<AbortController | null>(null)
  useEffect(() => () => abortRef.current?.abort(), [])

  const run = () => {
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac
    setState({ kind: 'loading' })
    fetch('/api/arena/run?mock=1', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ tasks: [task], models: ARENA_MODELS.map((m) => m.id) }),
      signal: ac.signal,
    })
      .then(async (res) => {
        const body = (await res.json().catch(() => ({}))) as ArenaResult | { error?: string }
        if (!res.ok || !('answers' in body)) throw new Error(('error' in body && body.error) || `HTTP ${res.status}`)
        setState({ kind: 'ok', data: body })
      })
      .catch((e: unknown) => {
        if (ac.signal.aborted) return
        setState({ kind: 'error', message: e instanceof Error ? e.message : String(e) })
      })
  }

  const result = state.kind === 'ok' ? state.data : null
  const rows = result
    ? ARENA_MODELS.map((m) => ({
        ...m,
        answer: result.answers.find((a) => a.model === m.id && a.taskId === task.id),
        score: result.scores.find((s) => s.model === m.id && s.taskId === task.id),
        error: result.errors.find((e) => e.model === m.id && e.taskId === task.id),
      }))
    : []
  const cell = 'py-1.5 pr-2 whitespace-nowrap'

  return (
    <div className="flex flex-col gap-3 border-t border-zinc-100 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={UI.label}>모델 비교</span>
          {result && result.answers.length > 0 && <Badge tone={result.live ? TONE.live : TONE.demo}>{result.live ? 'LIVE' : 'SAVED'}</Badge>}
          {result && result.errors.length > 0 && <Badge tone={TONE.error}>오류 {result.errors.length}건</Badge>}
        </div>
        <button type="button" onClick={run} disabled={state.kind === 'loading'} className={UI.button}>
          세 모델로 실행 (Haiku, Sonnet, Opus)
        </button>
      </div>
      {state.kind === 'loading' && (
        <>
          <p className="text-xs text-zinc-500">세 모델을 실행하는 중입니다</p>
          <Skeleton lines={3} />
        </>
      )}
      {state.kind === 'error' && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          <span className="font-semibold">모델 실행에 실패했습니다.</span> <span className={`text-red-600 ${UI.mono}`}>{state.message}</span>
        </div>
      )}
      {result && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left whitespace-nowrap">
                  <th className={`py-1.5 pr-2 ${UI.label}`}>모델</th>
                  <th className={`py-1.5 pr-2 text-right ${UI.label}`}>확률</th>
                  <th className={`py-1.5 pr-2 ${UI.label}`}>결정</th>
                  <th className={`py-1.5 pr-2 text-right ${UI.label}`}>Brier</th>
                  <th className={`py-1.5 pr-2 text-right ${UI.label}`}>손해</th>
                  <th className={`py-1.5 text-right ${UI.label}`}>Skill</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-zinc-100 last:border-0">
                    <td className={`${cell} font-medium`} title={r.id}>
                      {r.label}
                    </td>
                    {r.answer ? (
                      <>
                        <td className={`${cell} text-right ${UI.mono}`}>{pct(r.answer.probability)}</td>
                        <td className={`${cell} ${UI.mono}`}>{r.answer.decision ?? '—'}</td>
                        <td className={`${cell} text-right ${UI.mono}`}>{num(r.score?.brier, 3)}</td>
                        <td className={`${cell} text-right ${UI.mono}`}>{r.score?.regretUsd == null ? '—' : usd(r.score.regretUsd)}</td>
                        <td className={`py-1.5 text-right whitespace-nowrap ${UI.mono}`}>{r.score ? signed(r.score.skill) : '—'}</td>
                      </>
                    ) : (
                      <td colSpan={5} className={`py-1.5 text-xs break-all text-red-700 ${UI.mono}`}>
                        {r.error?.message ?? '응답 없음'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-zinc-500">
            {result.replayed > 0 && `저장된 응답 ${result.replayed}건. `}
            Brier는 낮을수록 좋고, 손해는 acre당 달러입니다. 개선도는 {SKILL_HINT}.
          </p>
        </>
      )}
    </div>
  )
}

function ReplayPanel({ scenario }: { scenario: string }) {
  const [state, setState] = useState<PanelState>({ kind: 'loading' })
  const [shown, setShown] = useState(0)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    const ac = new AbortController()
    fetch(`/api/live?scenario=${encodeURIComponent(scenario)}`, { signal: ac.signal })
      .then(async (res) => {
        const body = (await res.json()) as Replay | { error?: string }
        if (!res.ok || !('demo' in body)) throw new Error(('error' in body && body.error) || `HTTP ${res.status}`)
        setState({ kind: 'ok', data: body })
      })
      .catch((e: unknown) => {
        if (ac.signal.aborted) return
        setState({ kind: 'error', message: e instanceof Error ? e.message : String(e) })
      })
    return () => ac.abort()
  }, [scenario])

  const data = state.kind === 'ok' ? state.data : null
  const frames = data?.frames ?? []
  const total = frames.length
  const playing = running && shown < total
  const done = total > 0 && shown >= total

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => setShown((s) => Math.min(total, s + 1)), STEP_MS)
    return () => clearInterval(id)
  }, [playing, total])

  const onPlay = () => {
    if (shown >= total) {
      setShown(0)
      setRunning(true)
      return
    }
    setRunning((r) => !r)
  }
  const onSeek = (value: number) => {
    setRunning(false)
    setShown(value)
  }

  const errorBanner = state.kind === 'error' && (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      <span className="font-semibold">시나리오를 찾을 수 없습니다.</span> <span className={`text-red-600 ${UI.mono}`}>{state.message}</span>
    </div>
  )
  const loading = state.kind === 'loading'
  const empty = state.kind === 'error'
  const p = data?.answer.probability
  const regret = data?.score.regretUsd ?? 0
  const correct = data?.score.correct

  return (
    <div className="flex flex-col gap-4">
      {errorBanner}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <StepCard step="①" title="과제 발행" aside={data && <Badge tone={TONE.neutral}>{data.task.id}</Badge>}>
          {loading && <Skeleton lines={8} />}
          {empty && <Empty text="과제 없음" />}
          {data && (
            <>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                <div>
                  <dt className={UI.label}>과제를 낸 시각</dt>
                  <dd className={`whitespace-nowrap ${UI.mono}`}>{hhmmZ(data.task.t0)}</dd>
                  <dd className="text-xs text-zinc-500">
                    {data.task.t0.slice(0, 10)}, 현지 {cdt(data.task.t0)}
                  </dd>
                </div>
                <div>
                  <dt className={UI.label}>채점 시각</dt>
                  <dd className={UI.mono}>{hhmmZ(data.task.resolveAt)}</dd>
                  <dd className="text-xs text-zinc-500">관측소 {data.task.field.stationId}</dd>
                </div>
                <div className="col-span-2">
                  <dt className={UI.label}>필지</dt>
                  <dd>
                    {data.task.field.name}, {data.task.field.acres} acre, {data.task.field.crop}
                  </dd>
                </div>
              </dl>
              <p className="rounded-lg bg-zinc-50 p-3 text-sm leading-relaxed text-zinc-700">{data.task.prompt}</p>
              <div>
                <div className={`mb-1 ${UI.label}`}>과제 시점의 모델별 예보, 4시간 중 최댓값 (mph)</div>
                <div className="overflow-x-auto">
                  <ModelTable models={data.snapshotSummary.models} />
                </div>
              </div>
            </>
          )}
        </StepCard>

        <StepCard step="②" title="에이전트 답" aside={data && <Badge tone={TONE.info}>{data.answer.model}</Badge>}>
          {loading && <Skeleton lines={6} />}
          {empty && <Empty text="답 없음" />}
          {data && (
            <>
              <div className="flex items-end gap-4">
                <div>
                  <div className={UI.label}>살포 조건을 벗어날 확률</div>
                  <div className={`text-5xl font-semibold tracking-tight ${UI.mono}`}>{pct(p)}</div>
                </div>
                <div className="pb-1">
                  <div className={UI.label}>결정</div>
                  <span className="mt-1 inline-flex rounded-lg bg-zinc-900 px-3 py-1 text-sm font-semibold text-white">
                    {data.answer.decision ? (DECISION_LABEL[data.answer.decision] ?? data.answer.decision) : '—'}
                  </span>
                </div>
              </div>
              <div>
                <div className={`mb-1 ${UI.label}`}>근거</div>
                <p className="text-sm leading-relaxed text-zinc-700">{data.answer.rationale}</p>
              </div>
              <ArenaPanel task={data.task} />
            </>
          )}
        </StepCard>

        <StepCard step="③" title="실측 도착" aside={data && <Badge tone={TONE.neutral}>{shown}/{total}h 도착</Badge>}>
          {loading && <Skeleton lines={8} />}
          {empty && <Empty text="관측 없음" />}
          {data && (
            <>
              <div className="flex items-center gap-3">
                <button type="button" onClick={onPlay} className={UI.button} aria-pressed={playing}>
                  {done ? '↺ 다시 재생' : playing ? '❚❚ 일시정지' : '▶ 재생'}
                </button>
                <input
                  type="range"
                  min={0}
                  max={total}
                  step={1}
                  value={shown}
                  onChange={(e) => onSeek(Number(e.target.value))}
                  aria-label="도착한 관측 시간"
                  className="w-full accent-zinc-900"
                />
                <span className={`w-14 shrink-0 text-right text-xs text-zinc-500 ${UI.mono}`}>{shown > 0 ? hhmmZ(frames[shown - 1].time) : hhmmZ(data.task.t0)}</span>
              </div>
              <HourChart frames={frames} shown={shown} />
            </>
          )}
        </StepCard>

        <StepCard
          step="④"
          title="자동 채점"
          className={done ? (correct ? 'ring-2 ring-emerald-500/30' : 'ring-2 ring-red-500/30') : ''}
          aside={data && done && <Badge tone={correct ? STATUS_STYLE.GO.chip : STATUS_STYLE.NO_GO.chip}>{correct ? '✓ 정답' : '✗ 오답'}</Badge>}
        >
          {loading && <Skeleton lines={6} />}
          {empty && <Empty text="채점 없음" />}
          {data && !done && <Empty text={`실측 4시간이 모두 도착하면 자동으로 채점합니다 (${shown}/${total}).`} />}
          {data && done && (
            <>
              <div className="rounded-lg bg-zinc-50 p-3 text-sm">
                <div className={UI.label}>실제 결과</div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Badge tone={STATUS_STYLE[data.verdict.status].chip}>{data.verdict.violation ? '위반 (y = 1)' : '위반 없음 (y = 0)'}</Badge>
                  {data.verdict.reasons.map((r) => (
                    <Badge key={r} tone={TONE.neutral}>
                      <span className={UI.mono}>{r}</span>
                      <span className="text-zinc-500">{REASON_LABEL[r] ?? ''}</span>
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Stat label="정답 여부" value={correct == null ? '—' : correct ? '✓ 맞음' : '✗ 틀림'} tone={correct ? 'text-emerald-700' : 'text-red-700'} hint={`결정 ${data.answer.decision ?? '—'}`} />
                <Stat label="후회 (regret)" value={`${usd(regret)}/acre`} tone={regret > 0 ? 'text-red-700' : 'text-emerald-700'} hint={`필지 전체 ≈ ${usd(regret * data.task.field.acres)}`} />
                <Stat label="Brier" value={num(data.score.brier, 3)} hint="낮을수록 좋음 (0~1)" />
                <Stat label="Skill" value={signed(data.score.skill)} hint={SKILL_HINT} />
              </div>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-zinc-500">
                <dt>비용 / 최선의 비용</dt>
                <dd className={UI.mono}>
                  {usd(data.score.costUsd ?? 0)} / {usd(data.score.oracleCostUsd ?? 0)} per acre
                </dd>
                <dt>가정값</dt>
                <dd className={UI.mono}>
                  미루기 {usd(data.assumptions.costUsdPerAcre)}, 재살포 {usd(data.assumptions.lossUsdPerAcre)}
                </dd>
                <dt>미래 정보 차단</dt>
                <dd>{data.score.leakFlags.length === 0 ? '통과 (과제 이후 데이터를 쓰지 않음)' : `${data.score.leakFlags.length}건`}</dd>
                <dt>채점 근거</dt>
                <dd className={UI.mono}>{data.score.resolvedWith ? `${data.score.resolvedWith.stationId} @ ${hhmmZ(data.score.resolvedWith.at)}` : '—'}</dd>
              </dl>
            </>
          )}
        </StepCard>
      </div>
    </div>
  )
}

export default function LivePage() {
  const [scenario, setScenario] = useState<string>(DEFAULT_SCENARIO)

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('scenario')
    if (q) setScenario(q)
  }, [])

  const choose = (next: string) => {
    setScenario(next)
    const url = new URL(window.location.href)
    url.searchParams.set('scenario', next)
    window.history.replaceState(null, '', url)
  }
  const known = SCENARIOS.some((s) => s.id === scenario)

  return (
    <main className="break-keep">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold">채점 과정</h1>
            <Badge tone={TONE.neutral}>{ASSUMPTION_BADGE}</Badge>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-[var(--ink-2)]">상황</span>
            <select value={scenario} onChange={(e) => choose(e.target.value)} className="rounded-sm border border-[var(--rule)] bg-[var(--paper-2)] px-3 py-1.5 text-sm">
              {SCENARIOS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
              {!known && <option value={scenario}>{scenario} (알 수 없음)</option>}
            </select>
          </label>
        </header>
        <p className="max-w-3xl text-sm text-zinc-600">
          농약 살포 판단 과제 하나를 처음부터 채점까지 따라갑니다. 모델은 과제를 낸 시점의 예보만 보고 답하고, 이후 4시간 관측이 들어오면 자동으로 채점됩니다.
        </p>
        <ReplayPanel key={scenario} scenario={scenario} />
      </div>
    </main>
  )
}
