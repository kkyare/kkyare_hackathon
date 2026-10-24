'use client'

// 농장 지도: 위성 영상 위에서 필지를 고르면 그 필지의 날씨와 올해 생산량 예측, 학습 기록, 요율이 나온다.
import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Field, Peril, RateRange, RiskScore } from '@/core/types'
import type { ColorBy, MapField } from '@/components/FarmMap'
import { TaskGenerator } from '@/components/TaskGenerator'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Figure, Section } from '@/components/ui/card'
import { getJson, usd, usd2 } from '@/lib/format'

const FarmMap = dynamic(() => import('@/components/FarmMap').then((m) => m.FarmMap), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-[var(--paper-2)]" />,
})

interface Weather { frostNights: number; heavyRainDays: number; dryWeeks: number }
interface Brief {
  field: Field
  scores: RiskScore[]
  topPeril: Peril
  rate?: RateRange
  frostNight: { date: string; fieldMinF: number; sigmaF: number; gridMinF: number; pFrost: number; gridPFrost: number } | null
  yield: {
    season: string; asOf: string | null; soFar: Weather | null; outlook: Weather
    pct: number; range: [number, number]; fieldSeasons: number; trainedOn: string[]
    parts: { normal: number; fieldAdj: number; weatherEffect: { frost: number; rain: number; dry: number } }
  }
  history: { season: string; pct: number; weather: Weather }[]
  learning: { trainedOn: string[]; predicted: string; maePct: number; baselineMaePct: number }[]
  claims: { count: number; paidUsd: number }
  briefing: { text: string; by: 'claude' | 'template' }
}

const PERIL_KO: Record<Peril, string> = { frost: '서리', excess_rain: '폭우', drought: '가뭄' }
const COLOR_BY: { id: ColorBy; label: string }[] = [
  { id: 'yield', label: '올해 예상 생산량' },
  { id: 'frost', label: '서리 위험' },
  { id: 'excess_rain', label: '폭우 위험' },
  { id: 'drought', label: '가뭄 위험' },
]
const signedPts = (n: number) => `${n > 0 ? '+' : ''}${n}%p`

export default function FarmMapPage() {
  const [fields, setFields] = useState<MapField[]>([])
  const [selected, setSelected] = useState<string | null>('field-ia-05')
  const [brief, setBrief] = useState<Brief | null>(null)
  const [loadingBrief, setLoadingBrief] = useState(false)
  const [colorBy, setColorBy] = useState<ColorBy>('yield')
  const [satellite, setSatellite] = useState(true)
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState<{ fieldIds: string[]; reason: string; by: string } | null>(null)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getJson<{ fields: MapField[] }>('/api/farm/map').then((d) => setFields(d.fields)).catch((e: Error) => setError(e.message))
  }, [])

  useEffect(() => {
    if (!selected) return
    setLoadingBrief(true)
    getJson<Brief>(`/api/farm/brief?fieldId=${selected}`)
      .then(setBrief)
      .catch((e: Error) => setError(`농장 정보를 불러오지 못했습니다: ${e.message}`))
      .finally(() => setLoadingBrief(false))
  }, [selected])

  const runSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    try {
      const r = await getJson<{ fieldIds: string[]; reason: string; by: string }>('/api/farm/search', { query })
      setSearch(r)
      if (r.fieldIds[0]) setSelected(r.fieldIds[0])
    } catch (err) {
      setError(`농장을 찾지 못했습니다: ${(err as Error).message}`)
    } finally {
      setSearching(false)
    }
  }

  const lowest = useMemo(() => [...fields].sort((a, b) => a.yieldPct - b.yieldPct)[0], [fields])

  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">농장 지도</h1>
        <p className="max-w-3xl text-[var(--ink-2)]">
          {lowest
            ? `아이오와 필지 ${fields.length}곳의 올해 생산량을 예측했습니다. 가장 낮은 곳은 ${lowest.name}으로 평년의 ${lowest.yieldPct}%입니다.`
            : '필지마다 날씨를 다시 계산해 올해 생산량을 예측합니다.'}
        </p>
      </header>
      {error && <p className="border-l-4 border-[var(--loam)] pl-3 text-sm">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={runSearch} className="flex min-w-[18rem] flex-1 gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="예: 서리 위험이 큰 골짜기 콩밭"
            aria-label="농장 찾기"
            className="flex-1 rounded-sm border border-[var(--rule)] bg-[var(--paper-2)] px-3 py-1.5 text-sm placeholder:text-[var(--ink-2)]"
          />
          <Button variant="solid" disabled={searching}>{searching ? '찾는 중' : 'AI로 찾기'}</Button>
        </form>
        <select value={colorBy} onChange={(e) => setColorBy(e.target.value as ColorBy)} aria-label="필지 색 기준"
          className="rounded-sm border border-[var(--rule)] bg-[var(--paper-2)] px-3 py-1.5 text-sm">
          {COLOR_BY.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <div className="flex gap-1">
          <Button active={satellite} onClick={() => setSatellite(true)}>위성</Button>
          <Button active={!satellite} onClick={() => setSatellite(false)}>지도</Button>
        </div>
      </div>
      {search && (
        <p className="-mt-6 text-sm text-[var(--ink-2)]">
          {search.reason} {search.fieldIds.length > 1 && (
            <>다른 후보: {search.fieldIds.slice(1).map((id) => (
              <button key={id} onClick={() => setSelected(id)} className="mr-2 underline underline-offset-4">{fields.find((f) => f.id === id)?.name ?? id}</button>
            ))}</>
          )}
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-[7fr_5fr]">
        <div className="h-[560px] overflow-hidden rounded-sm border border-[var(--rule)] lg:sticky lg:top-4">
          <FarmMap fields={fields} selected={selected} highlighted={search?.fieldIds ?? []} colorBy={colorBy} satellite={satellite} onSelect={setSelected} />
        </div>
        <aside className="min-h-[560px]">
          {!brief && <p className="text-sm text-[var(--ink-2)]">지도에서 필지를 누르세요.</p>}
          {brief && <FarmPanel b={brief} loading={loadingBrief} />}
        </aside>
      </div>

      <TaskGenerator />
    </main>
  )
}

function FarmPanel({ b, loading }: { b: Brief; loading: boolean }) {
  const y = b.yield
  const chart = [...b.history.map((h) => ({ season: h.season, pct: h.pct, kind: 'actual' })), { season: `${y.season} 예측`, pct: y.pct, kind: 'pred' }]
  const lastLearning = b.learning[b.learning.length - 1]
  const firstLearning = b.learning[0]
  return (
    <div className={`space-y-6 ${loading ? 'opacity-60' : ''}`}>
      <div>
        <h2 className="text-lg font-semibold">{b.field.name}</h2>
        <p className="text-sm text-[var(--ink-2)]">{b.field.crop === 'corn' ? '옥수수' : b.field.crop === 'soybean' ? '콩' : '과수'}, {b.field.acres} acre, {b.field.terrain === 'valley' ? '골짜기' : b.field.terrain === 'ridge' ? '능선' : '평지'}, 고도 {b.field.elevationM}m</p>
      </div>

      <div>
        <p className="text-xs text-[var(--ink-2)]">{y.season}년 예상 생산량 (평년 대비)</p>
        <p className="figure text-4xl font-semibold">{y.pct}%</p>
        <p className="text-sm text-[var(--ink-2)]">범위 {y.range[0]}~{y.range[1]}%. {y.asOf ? `${Number(y.asOf.slice(5, 7))}월 ${Number(y.asOf.slice(8, 10))}일까지 관측된 날씨와 남은 기간의 평년값으로 계산했습니다.` : ''}</p>
      </div>

      <dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-1 text-sm">
        <dt className="text-[var(--ink-2)]">평년 기준</dt><dd className="tnum text-right">{y.parts.normal}%</dd>
        <dt className="text-[var(--ink-2)]">서리 (서리 밤 {y.outlook.frostNights}회 예상)</dt><dd className="tnum text-right">{signedPts(y.parts.weatherEffect.frost)}</dd>
        <dt className="text-[var(--ink-2)]">폭우 (폭우일 {y.outlook.heavyRainDays}일 예상)</dt><dd className="tnum text-right">{signedPts(y.parts.weatherEffect.rain)}</dd>
        <dt className="text-[var(--ink-2)]">가뭄 (건조 주 {y.outlook.dryWeeks}주 예상)</dt><dd className="tnum text-right">{signedPts(y.parts.weatherEffect.dry)}</dd>
        <dt className="text-[var(--ink-2)]">이 필지 보정 (수확 기록 {y.fieldSeasons}시즌)</dt><dd className="tnum text-right">{signedPts(y.parts.fieldAdj)}</dd>
      </dl>

      <Section title="실제 수확과 올해 예측" note="평년 대비 %">
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={chart} margin={{ left: -18 }}>
            <CartesianGrid stroke="var(--rule)" vertical={false} />
            <XAxis dataKey="season" stroke="var(--ink-2)" fontSize={11} tickLine={false} />
            <YAxis stroke="var(--ink-2)" fontSize={11} domain={[(min: number) => Math.floor(min - 5), 105]} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: 'var(--paper-2)', border: '1px solid var(--rule)', borderRadius: 2 }} formatter={(v) => [`${v}%`, '생산량']} />
            <Bar dataKey="pct" isAnimationActive={false} radius={[2, 2, 0, 0]}>
              {chart.map((c) => <Cell key={c.season} fill={c.kind === 'pred' ? 'var(--frost)' : 'var(--canopy)'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Section>

      {b.frostNight && (
        <Section title="5월 12일 밤 서리 예측" note="전날 오후 예보 기준">
          <div className="flex gap-8">
            <Figure label={`이 필지 최저기온 (공개 예보 ${b.frostNight.gridMinF}°F)`} value={`${b.frostNight.fieldMinF}°F`} tone="frost" />
            <Figure label={`서리 확률 (공개 예보 ${Math.round(b.frostNight.gridPFrost * 100)}%)`} value={`${Math.round(b.frostNight.pFrost * 100)}%`} tone={b.frostNight.pFrost > 0.3 ? 'loam' : undefined} />
          </div>
        </Section>
      )}

      {lastLearning && firstLearning && (
        <Section title="수확 기록이 쌓일수록" note={`${lastLearning.predicted}년 생산량 예측 오차, 필지 48곳 평균`}>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-[var(--rule)]"><td className="py-1.5 text-[var(--ink-2)]">평년 100%로 가정</td><td className="tnum py-1.5 text-right">±{firstLearning.baselineMaePct}%p</td></tr>
              {b.learning.map((l) => (
                <tr key={l.trainedOn.join()} className="border-b border-[var(--rule)]">
                  <td className="py-1.5 text-[var(--ink-2)]">수확 기록 {l.trainedOn.length}시즌으로 학습 ({l.trainedOn[0]}{l.trainedOn.length > 1 ? `~${l.trainedOn[l.trainedOn.length - 1]}` : ''})</td>
                  <td className="tnum py-1.5 text-right">±{l.maePct}%p</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-[var(--ink-2)]">시즌이 끝나 실제 수확량이 들어오면 모델을 다시 학습합니다. 올해 예측은 {y.trainedOn.length}시즌 기록으로 학습했습니다.</p>
        </Section>
      )}

      {b.rate && (
        <Section title="보험" note={`위험이 가장 큰 항목: ${PERIL_KO[b.topPeril]}`}>
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {b.scores.map((s) => <Figure key={s.peril} label={`${PERIL_KO[s.peril]} 위험점수`} value={`${s.score}`} />)}
          </div>
          <p className="mt-3 text-sm">보험료 범위 acre당 {usd2(b.rate.premiumUsdAc[0])}-{usd2(b.rate.premiumUsdAc[1])}, 지난 청구 {b.claims.count}건 {usd(b.claims.paidUsd)}.</p>
        </Section>
      )}

      <Section title="AI 브리핑" note={b.briefing.by === 'claude' ? 'Claude 분석 결과' : 'Claude 키가 없어 규칙 기반 문장'}>
        <p className="leading-relaxed">{b.briefing.text}</p>
        {b.briefing.by === 'claude' && <div className="mt-2"><Badge tone="frost">Claude</Badge></div>}
      </Section>
    </div>
  )
}
