'use client'

// 보험사 콘솔: 필지 위험점수 지도 → 점수 구간별 실제 손해율 → 선택 필지의 요율 range → 청구 검증
import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Claim, ClaimReport, Field, LossCurve, Peril, RateRange, RiskScore } from '@/core/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Figure, Section } from '@/components/ui/card'
import { getJson, pct, usd, usd2 } from '@/lib/format'

type Scored = RiskScore & { field: Field }
const PERILS: { id: Peril; label: string }[] = [
  { id: 'frost', label: '서리' },
  { id: 'excess_rain', label: '폭우' },
  { id: 'drought', label: '가뭄' },
]
const perilLabel = (p: Peril) => PERILS.find((x) => x.id === p)?.label ?? p
const riskTone = (score: number): 'loam' | 'corn' | 'canopy' => (score >= 70 ? 'loam' : score >= 40 ? 'corn' : 'canopy')
const riskColor = (score: number) => `var(--${riskTone(score)})`
const signed = (n: number) => `${n > 0 ? '+' : ''}${n}%`

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
  // 제목 아래 한 줄: 이 화면 데이터에서 가장 먼저 봐야 할 사실
  const finding = useMemo(() => {
    const bins = curve?.bins.filter((b) => b.n > 0) ?? []
    if (bins.length < 2) return null
    const lo = bins[0]
    const hi = bins[bins.length - 1]
    const times = lo.lossRatio > 0 ? Math.round(hi.lossRatio / lo.lossRatio) : null
    return `${perilLabel(peril)} 위험점수 ${hi.scoreFrom}점 이상 필지의 실제 손해율은 ${pct(hi.lossRatio)}로, ${lo.scoreFrom}-${lo.scoreTo}점 필지(${pct(lo.lossRatio)})${times && times > 1 ? `의 ${times}배` : '보다 높습니다'}입니다.`.replace('높습니다입니다', '높습니다')
  }, [curve, peril])
  const verify = async (claim: Claim) => {
    setReports((r) => ({ ...r, [claim.id]: 'loading' }))
    try {
      const report = await getJson<ClaimReport>('/api/insurance/verify', { claimId: claim.id })
      setReports((r) => ({ ...r, [claim.id]: report }))
    } catch (e) {
      setError(`청구 ${claim.id} 검증에 실패했습니다: ${(e as Error).message}`)
    }
  }

  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 py-8">
      <header className="max-w-3xl space-y-2">
        <h1 className="text-2xl font-semibold">요율 검증</h1>
        <p className="text-[var(--ink-2)]">{finding ?? '지난 세 시즌 청구를 필지별 위험점수와 맞춰 보는 중입니다.'}</p>
        <div className="flex gap-2 pt-2" role="tablist" aria-label="위험 종류">
          {PERILS.map((p) => (
            <Button key={p.id} role="tab" aria-selected={p.id === peril} active={p.id === peril} onClick={() => setPeril(p.id)}>{p.label}</Button>
          ))}
        </div>
      </header>
      {error && <p className="border-l-4 border-[var(--loam)] pl-3 text-sm">{error}</p>}

      <div className="grid gap-10 lg:grid-cols-[3fr_2fr]">
        <Section title={`${perilLabel(peril)} 위험점수, 필지 ${scores.length}곳`} note="사각형 크기는 면적, 굵은 선은 6마일 타운십 경계">
          <PlatMap scores={scores} selected={selected} onSelect={setSelected} />
          <p className="mt-2 text-xs text-[var(--ink-2)]">
            <Swatch c="canopy" /> 0-39점 <Swatch c="corn" /> 40-69점 <Swatch c="loam" /> 70점 이상. 필지를 누르면 아래 요율이 바뀝니다.
          </p>
        </Section>

        <Section title="점수 구간별 실제 손해율" note="2023-2025 청구, 손해율 = 지급 보험금 / 보험료">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={curve?.bins.map((b) => ({ ...b, label: `${b.scoreFrom}-${b.scoreTo}` })) ?? []} margin={{ left: -12 }}>
              <CartesianGrid stroke="var(--rule)" vertical={false} />
              <XAxis dataKey="label" stroke="var(--ink-2)" fontSize={12} tickLine={false} />
              <YAxis stroke="var(--ink-2)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${Math.round(v * 100)}%`} />
              <Tooltip
                cursor={{ fill: 'rgba(28,38,32,0.06)' }}
                contentStyle={{ background: 'var(--paper-2)', border: '1px solid var(--rule)', borderRadius: 2 }}
                formatter={(v, _n, item) => [`${Math.round(Number(v) * 100)}% (청구 ${(item?.payload as { n: number })?.n ?? 0}건)`, '손해율']}
                labelFormatter={(l) => `위험점수 ${l}`}
              />
              <Bar dataKey="lossRatio" radius={[2, 2, 0, 0]} isAnimationActive={false}>
                {curve?.bins.map((b) => <Cell key={b.scoreFrom} fill={riskColor(b.scoreFrom + 10)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-sm text-[var(--ink-2)]">아래 요율 범위는 이 표에서 나옵니다. 같은 점수 구간 필지들의 실제 손해로 보험료를 정합니다.</p>
        </Section>
      </div>

      {field && rate && (
        <Section title={field.field.name} note={`${field.field.crop}, ${field.field.acres} acre, ${field.field.terrain ?? 'flat'} 지형, ${perilLabel(peril)} 위험점수 ${field.score}점`}>
          <div className="grid gap-x-12 gap-y-6 sm:grid-cols-2">
            <Figure size="lg" label="보험수가, acre당 (가입 시)" value={`${usd2(rate.premiumUsdAc[0])}-${usd2(rate.premiumUsdAc[1])}`} />
            <Figure size="lg" label="피해보상액, 필지 전체 (청구 시)" value={`${usd(rate.indemnityUsdAc[0] * field.field.acres)}-${usd(rate.indemnityUsdAc[1] * field.field.acres)}`} />
            <Figure size="lg" label="갱신 요율 (갱신 시)" value={`${signed(rate.renewalRateChangePct[0])} ~ ${signed(rate.renewalRateChangePct[1])}`} tone={rate.renewalRateChangePct[1] > 0 ? 'loam' : 'canopy'} />
            <Figure size="lg" label="기대 손해율 (목표 75%)" value={pct(rate.expectedLossRatio)} />
          </div>
          <p className="mt-4 max-w-3xl text-sm text-[var(--ink-2)]">
            같은 점수 구간의 청구 {rate.basis.nClaims}건을 근거로 했습니다. 위험 요인: {field.drivers.join(', ') || '없음'}. 보장률 75%와 작물 단가는 가정값입니다.
          </p>
        </Section>
      )}

      <Section title="청구 검증" note="청구된 날씨 원인이 실제로 있었는지, 청구액이 예상 보상액 범위 안인지">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-[var(--ink-2)]">
            <tr className="border-b border-[var(--rule)]">
              <th className="py-2 font-normal">청구</th>
              <th className="py-2 font-normal">필지와 날짜</th>
              <th className="py-2 font-normal">원인</th>
              <th className="py-2 text-right font-normal">청구액</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {claims.map((c) => {
              const r = reports[c.id]
              return (
                <ClaimRow key={c.id} claim={c} report={r} onVerify={() => verify(c)} />
              )
            })}
          </tbody>
        </table>
      </Section>
    </main>
  )
}

function ClaimRow({ claim, report, onVerify }: { claim: Claim; report?: ClaimReport | 'loading'; onVerify: () => void }) {
  const done = report && report !== 'loading'
  return (
    <>
      <tr className={done ? '' : 'border-b border-[var(--rule)]'}>
        <td className="py-2.5 tnum">{claim.id}</td>
        <td className="py-2.5">{claim.fieldId}, {claim.date}</td>
        <td className="py-2.5">{perilLabel(claim.peril)}</td>
        <td className="figure py-2.5 text-right text-lg">{usd(claim.claimedLossUsd)}</td>
        <td className="py-2.5 pl-4 text-right">
          <Button variant="solid" disabled={report === 'loading'} onClick={onVerify}>{report === 'loading' ? '검증하는 중' : done ? '다시 검증' : '검증하기'}</Button>
        </td>
      </tr>
      {done && (
        <tr className="border-b border-[var(--rule)]">
          <td colSpan={5} className="pb-4">
            <ClaimResult report={report} claimed={claim.claimedLossUsd} />
          </td>
        </tr>
      )}
    </>
  )
}

function ClaimResult({ report, claimed }: { report: ClaimReport; claimed: number }) {
  const verdict =
    report.verdict === 'within_range'
      ? { tone: 'canopy' as const, text: '범위 안: 바로 지급 검토' }
      : report.verdict === 'outside_range'
        ? { tone: 'loam' as const, text: '범위 밖: 정밀 손해사정으로' }
        : { tone: 'corn' as const, text: '판단 보류' }
  const e = report.evidence
  const [lo, hi] = report.indemnityRange
  const max = Math.max(hi, claimed) * 1.1 || 1
  return (
    <div className="grid gap-4 border-l-4 pl-4 lg:grid-cols-[2fr_3fr]" style={{ borderColor: `var(--${verdict.tone})` }}>
      <div className="space-y-3">
        <Badge tone={verdict.tone}>{verdict.text}</Badge>
        <p className="text-sm">
          피해 조건이 실제로 있었을 확률 <b className="figure text-xl">{pct(report.conditionProbability)}</b>
        </p>
        {/* 예상 보상액 범위 막대 위에 청구액 위치 */}
        <div>
          <div className="relative h-3 rounded-sm bg-[var(--rule)]">
            <div className="absolute inset-y-0 rounded-sm bg-[var(--canopy)]/60" style={{ left: `${(lo / max) * 100}%`, width: `${((hi - lo) / max) * 100}%` }} />
            <div className="absolute -top-1 h-5 w-0.5 bg-[var(--ink)]" style={{ left: `${(claimed / max) * 100}%` }} title="청구액" />
          </div>
          <p className="mt-1 text-xs text-[var(--ink-2)]">
            예상 보상액 {usd(lo)}-{usd(hi)}, 청구액 {usd(claimed)} (검은 선)
          </p>
        </div>
      </div>
      <div className="space-y-2 text-sm">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[var(--ink-2)]">
          <dt>필지 추정</dt>
          <dd className="tnum text-[var(--ink)]">{Number.isFinite(e.fieldEstimate.value) ? `${e.fieldEstimate.value}${e.fieldEstimate.unit} (오차 ±${e.fieldEstimate.sigma})` : '자료 없음'}</dd>
          <dt>인근 관측소 {e.nearbyObs.stationId}</dt>
          <dd className="tnum text-[var(--ink)]">{e.nearbyObs.value ?? '자료 없음'}{e.nearbyObs.value !== null ? e.nearbyObs.unit : ''}</dd>
          {e.forecastAtT0 && (
            <>
              <dt>당시 예보</dt>
              <dd className="tnum text-[var(--ink)]">{e.forecastAtT0.map((f) => `${modelName(f.model)} ${f.value}°F`).join(', ')}</dd>
            </>
          )}
        </dl>
        {report.explanation && <p className="leading-relaxed">{report.explanation}</p>}
      </div>
    </div>
  )
}

const modelName = (m: string) => ({ ncep_hrrr_conus: 'HRRR', ecmwf_ifs025: 'ECMWF', gfs_seamless: 'GFS', ncep_nbm_conus: 'NBM' })[m] ?? m

function Swatch({ c }: { c: 'canopy' | 'corn' | 'loam' }) {
  return <i className="mx-1 inline-block h-2.5 w-2.5 align-[-1px]" style={{ background: `var(--${c})` }} />
}

// 아이오와는 공공토지측량(PLSS) 격자로 나뉜다: 6마일 타운십 선 위에 필지를 면적 비례 사각형으로
function PlatMap({ scores, selected, onSelect }: { scores: Scored[]; selected: string; onSelect: (id: string) => void }) {
  const box = useMemo(() => {
    const lats = scores.map((s) => s.field.lat)
    const lons = scores.map((s) => s.field.lon)
    const pad = 0.04
    return { minLat: Math.min(...lats) - pad, maxLat: Math.max(...lats) + pad, minLon: Math.min(...lons) - pad, maxLon: Math.max(...lons) + pad }
  }, [scores])
  if (!scores.length) return <div className="aspect-[16/10] bg-[var(--paper-2)]" />
  const W = 640
  const H = 400
  const x = (lon: number) => ((lon - box.minLon) / (box.maxLon - box.minLon)) * W
  const y = (lat: number) => H - ((lat - box.minLat) / (box.maxLat - box.minLat)) * H
  const TOWNSHIP_LAT = 6 / 69 // 6마일
  const TOWNSHIP_LON = 6 / 51.8 // 6마일 (북위 41.5도)
  const latLines = range(Math.ceil(box.minLat / TOWNSHIP_LAT), Math.floor(box.maxLat / TOWNSHIP_LAT)).map((i) => i * TOWNSHIP_LAT)
  const lonLines = range(Math.ceil(box.minLon / TOWNSHIP_LON), Math.floor(box.maxLon / TOWNSHIP_LON)).map((i) => i * TOWNSHIP_LON)
  const pxPerMile = W / ((box.maxLon - box.minLon) * 51.8)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full bg-[var(--paper-2)]" role="img" aria-label="필지 위험점수 지도">
      {latLines.map((l) => <line key={`a${l}`} x1={0} x2={W} y1={y(l)} y2={y(l)} stroke="var(--rule)" strokeWidth={1.5} />)}
      {lonLines.map((l) => <line key={`o${l}`} y1={0} y2={H} x1={x(l)} x2={x(l)} stroke="var(--rule)" strokeWidth={1.5} />)}
      {scores.map((s) => {
        const side = Math.sqrt(s.field.acres / 640) * pxPerMile * 1.6 // 1제곱마일 = 640 acre (가독성 위해 1.6배)
        const isSel = s.fieldId === selected
        return (
          <g key={s.fieldId}>
            <rect
              x={x(s.field.lon) - side / 2}
              y={y(s.field.lat) - side / 2}
              width={side}
              height={side}
              fill={riskColor(s.score)}
              stroke={isSel ? 'var(--ink)' : 'var(--paper-2)'}
              strokeWidth={isSel ? 3 : 1}
              tabIndex={0}
              role="button"
              aria-label={`${s.field.name}, 위험점수 ${s.score}`}
              onClick={() => onSelect(s.fieldId)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(s.fieldId) }}
              className="cursor-pointer"
            >
              <title>{`${s.field.name}, 위험점수 ${s.score}`}</title>
            </rect>
          </g>
        )
      })}
    </svg>
  )
}

function range(a: number, b: number) {
  return Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => a + i)
}
