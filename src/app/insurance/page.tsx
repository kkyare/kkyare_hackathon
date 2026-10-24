'use client'

// 보험사 콘솔: 필지 위험점수 지도 → 점수별 손해율 곡선 → 수가·보상액·갱신 요율 range → 청구 검증
import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Claim, ClaimReport, Field, LossCurve, Peril, RateRange, RiskScore } from '@/core/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, Stat } from '@/components/ui/card'
import { getJson, pct, usd, usd2 } from '@/lib/format'

type Scored = RiskScore & { field: Field }
const PERILS: { id: Peril; label: string }[] = [
  { id: 'frost', label: '서리' },
  { id: 'excess_rain', label: '폭우' },
  { id: 'drought', label: '가뭄' },
]
const perilLabel = (p: Peril) => PERILS.find((x) => x.id === p)?.label ?? p

function scoreColor(score: number) {
  if (score >= 70) return 'var(--nogo)'
  if (score >= 40) return 'var(--caution)'
  return 'var(--go)'
}

export default function InsuranceConsole() {
  const [peril, setPeril] = useState<Peril>('frost')
  const [scores, setScores] = useState<Scored[]>([])
  const [curve, setCurve] = useState<LossCurve | null>(null)
  const [selected, setSelected] = useState('field-ia-04')
  const [rate, setRate] = useState<RateRange | null>(null)
  const [claims, setClaims] = useState<Claim[]>([])
  const [reports, setReports] = useState<Record<string, ClaimReport | 'loading'>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getJson<Scored[]>(`/api/insurance/risk?peril=${peril}`), getJson<LossCurve>(`/api/insurance/loss-curve?peril=${peril}`)])
      .then(([s, c]) => { setScores(s); setCurve(c) })
      .catch((e: Error) => setError(e.message))
  }, [peril])

  useEffect(() => {
    getJson<RateRange>(`/api/insurance/rate-range?fieldId=${selected}&peril=${peril}`).then(setRate).catch((e: Error) => setError(e.message))
  }, [selected, peril])

  useEffect(() => {
    getJson<{ claims: Claim[] }>('/api/insurance/claims').then((d) => setClaims(d.claims)).catch((e: Error) => setError(e.message))
  }, [])

  const field = scores.find((s) => s.fieldId === selected)
  const verify = async (claim: Claim) => {
    setReports((r) => ({ ...r, [claim.id]: 'loading' }))
    try {
      const report = await getJson<ClaimReport>('/api/insurance/verify', { claimId: claim.id })
      setReports((r) => ({ ...r, [claim.id]: report }))
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">보험사 콘솔</h1>
          <p className="text-sm text-[var(--muted)]">필지 위험점수를 실제 손해로 검증하고, 그 결과로 보험수가·피해보상액·갱신 요율 range를 냅니다.</p>
        </div>
        <div className="flex gap-2">
          {PERILS.map((p) => (
            <Button key={p.id} active={p.id === peril} onClick={() => setPeril(p.id)}>{p.label}</Button>
          ))}
        </div>
      </header>
      {error && <p className="text-sm text-red-400">오류: {error}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={`필지 ${scores.length}개 ${perilLabel(peril)} 위험점수 (클릭해서 선택)`}>
          <RiskMap scores={scores} selected={selected} onSelect={setSelected} />
          <div className="mt-2 flex gap-3 text-xs text-[var(--muted)]">
            <span><i className="inline-block h-2 w-2 rounded-full bg-[var(--go)]" /> 0-39</span>
            <span><i className="inline-block h-2 w-2 rounded-full bg-[var(--caution)]" /> 40-69</span>
            <span><i className="inline-block h-2 w-2 rounded-full bg-[var(--nogo)]" /> 70-100</span>
          </div>
        </Card>

        <Card title="위험점수 구간별 실제 손해율 (검증된 날씨-생산량 데이터)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={curve?.bins.map((b) => ({ ...b, label: `${b.scoreFrom}-${b.scoreTo}` })) ?? []}>
              <CartesianGrid stroke="#262626" strokeDasharray="3 3" />
              <XAxis dataKey="label" stroke="#888" />
              <YAxis stroke="#888" tickFormatter={(v: number) => `${Math.round(v * 100)}%`} />
              <Tooltip
                contentStyle={{ background: '#111', border: '1px solid #333' }}
                formatter={(v) => [`${Math.round(Number(v) * 100)}%`, '손해율']}
                labelFormatter={(l) => `점수 ${l}`}
              />
              <Bar dataKey="lossRatio">
                {curve?.bins.map((b) => <Cell key={b.scoreFrom} fill={scoreColor(b.scoreFrom + 10)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="mt-2 text-xs text-[var(--muted)]">
            구간별 청구 건수: {curve?.bins.map((b) => `${b.scoreFrom}-${b.scoreTo}점 ${b.n}건`).join(' · ')}
          </p>
        </Card>
      </div>

      {field && rate && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-medium">{field.field.name}</h2>
            <Badge>{field.field.crop} · {field.field.acres} acre · {field.field.terrain ?? 'flat'}</Badge>
            <Badge tone={field.score >= 70 ? 'nogo' : field.score >= 40 ? 'caution' : 'go'}>{perilLabel(peril)} 위험점수 {field.score}</Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="보험수가 range (acre당, 가입 시)" value={`${usd2(rate.premiumUsdAc[0])}-${usd2(rate.premiumUsdAc[1])}`} tone="accent" />
            <Stat label="피해보상액 range (필지 전체, 청구 시)" value={`${usd(rate.indemnityUsdAc[0] * field.field.acres)}-${usd(rate.indemnityUsdAc[1] * field.field.acres)}`} />
            <Stat
              label="갱신 요율 range (갱신 시)"
              value={`${rate.renewalRateChangePct[0] > 0 ? '+' : ''}${rate.renewalRateChangePct[0]}%~${rate.renewalRateChangePct[1] > 0 ? '+' : ''}${rate.renewalRateChangePct[1]}%`}
              tone={rate.renewalRateChangePct[1] > 0 ? 'nogo' : 'go'}
            />
            <Stat label="기대 손해율" value={pct(rate.expectedLossRatio)} />
          </div>
          <p className="text-xs text-[var(--muted)]">
            근거: 같은 점수 구간 청구 {rate.basis.nClaims}건 · 위험 요인: {field.drivers.join(', ') || '-'} · 목표 손해율 75%, 보장률 75% (가정)
          </p>
        </section>
      )}

      <Card title="청구 검증: 청구된 날씨 원인이 실제로 있었나, 청구액이 보상액 range 안인가">
        <div className="space-y-3">
          {claims.map((c) => {
            const r = reports[c.id]
            return (
              <div key={c.id} className="rounded-md border border-[var(--line)] p-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="num text-sm">{c.id}</span>
                  <span className="text-sm">{c.date} · {c.fieldId} · {perilLabel(c.peril)} 피해 청구 <b className="num">{usd(c.claimedLossUsd)}</b></span>
                  <Button className="ml-auto" disabled={r === 'loading'} onClick={() => verify(c)}>{r === 'loading' ? '검증 중…' : '검증'}</Button>
                </div>
                {r && r !== 'loading' && <ClaimResult report={r} claimed={c.claimedLossUsd} />}
              </div>
            )
          })}
        </div>
      </Card>
    </main>
  )
}

function ClaimResult({ report, claimed }: { report: ClaimReport; claimed: number }) {
  const tone = report.verdict === 'within_range' ? 'go' : report.verdict === 'outside_range' ? 'nogo' : 'caution'
  const label = report.verdict === 'within_range' ? 'range 안 → 바로 지급 검토' : report.verdict === 'outside_range' ? 'range 밖 → 정밀 손해사정' : '판단 보류'
  const e = report.evidence
  return (
    <div className="mt-3 space-y-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={tone}>{label}</Badge>
        <span className="text-[var(--muted)]">피해 조건 확률 <b className="num text-[var(--text)]">{pct(report.conditionProbability)}</b></span>
        <span className="text-[var(--muted)]">예상 보상액 <b className="num text-[var(--text)]">{usd(report.indemnityRange[0])}-{usd(report.indemnityRange[1])}</b> vs 청구 <b className="num">{usd(claimed)}</b></span>
      </div>
      <div className="grid gap-2 text-xs text-[var(--muted)] sm:grid-cols-3">
        <span>필지 추정 {Number.isFinite(e.fieldEstimate.value) ? `${e.fieldEstimate.value}${e.fieldEstimate.unit} ±${e.fieldEstimate.sigma}` : '-'}</span>
        <span>인근 관측 {e.nearbyObs.stationId}: {e.nearbyObs.value ?? '-'}{e.nearbyObs.unit}</span>
        <span>당시 예보 {e.forecastAtT0?.map((f) => `${f.model.split('_')[1] ?? f.model} ${f.value}`).join(' · ') ?? '-'}</span>
      </div>
      {report.explanation && <p className="rounded bg-black/30 p-2 text-neutral-300">{report.explanation}</p>}
    </div>
  )
}

function RiskMap({ scores, selected, onSelect }: { scores: Scored[]; selected: string; onSelect: (id: string) => void }) {
  const box = useMemo(() => {
    const lats = scores.map((s) => s.field.lat)
    const lons = scores.map((s) => s.field.lon)
    return { minLat: Math.min(...lats), maxLat: Math.max(...lats), minLon: Math.min(...lons), maxLon: Math.max(...lons) }
  }, [scores])
  if (!scores.length) return <div className="h-64" />
  const W = 520
  const H = 300
  const x = (lon: number) => 20 + ((lon - box.minLon) / (box.maxLon - box.minLon || 1)) * (W - 40)
  const y = (lat: number) => H - 20 - ((lat - box.minLat) / (box.maxLat - box.minLat || 1)) * (H - 40)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded bg-black/40">
      {scores.map((s) => (
        <g key={s.fieldId} onClick={() => onSelect(s.fieldId)} className="cursor-pointer">
          <circle
            cx={x(s.field.lon)}
            cy={y(s.field.lat)}
            r={4 + Math.sqrt(s.field.acres) / 4}
            fill={scoreColor(s.score)}
            fillOpacity={0.75}
            stroke={s.fieldId === selected ? '#fff' : 'none'}
            strokeWidth={2}
          />
          <title>{`${s.field.name} · 점수 ${s.score}`}</title>
        </g>
      ))}
    </svg>
  )
}
