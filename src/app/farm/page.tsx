'use client'

// 농장 연결 화면 (P2): 연결된 농장·검증 청구가 늘수록 필지 추정 오차와 요율 range가 줄어드는 모습.
// 데이터: GET /api/farm/learning-curve (목업). 셸·내비게이션은 영모님 레이아웃을 따른다.
import { useEffect, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface CurvePoint { connectedFields: number; maeF: number; rawGridMaeF: number }
interface RangePoint { verifiedClaims: number; premiumWidthUsdAc: number; premiumRelativeWidthPct: number; renewalWidthPct: number }
interface Payload { demo: boolean; points: CurvePoint[]; ranges: RangePoint[] }

export default function FarmConnectionPage() {
  const [data, setData] = useState<Payload | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/farm/learning-curve?fieldId=field-ia-04&peril=frost')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setData)
      .catch((e: Error) => setError(e.message))
  }, [])

  if (error) return <p className="p-6 text-red-400">불러오지 못했습니다: {error}</p>
  if (!data) return <p className="p-6 text-neutral-400">불러오는 중…</p>

  const first = data.points[0]
  const last = data.points.at(-1)!
  const r0 = data.ranges[0]
  const rN = data.ranges.at(-1)!

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">농장 연결</h1>
          <p className="text-sm text-neutral-400">농장이 연결될수록 필지 판정이 정확해지고, 보험 요율 range가 좁아집니다.</p>
        </div>
        {data.demo && <span className="rounded border border-amber-500/50 px-2 py-1 text-xs text-amber-400">DEMO DATA</span>}
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Stat label="원천 격자 예보 오차" value={`${first.rawGridMaeF.toFixed(2)}°F`} />
        <Stat label="필지 보정 (연결 0곳)" value={`${first.maeF.toFixed(2)}°F`} />
        <Stat label={`농장 ${last.connectedFields}곳 연결 후`} value={`${last.maeF.toFixed(2)}°F`} accent />
      </section>

      <Card title="연결된 농장 필지 수 → 필지 최저기온 추정 오차 (MAE, °F)">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data.points} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid stroke="#333" strokeDasharray="3 3" />
            <XAxis dataKey="connectedFields" stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip contentStyle={{ background: '#111', border: '1px solid #333' }} />
            <Line type="monotone" dataKey="rawGridMaeF" name="원천 격자 예보" stroke="#666" strokeDasharray="4 4" dot={false} />
            <Line type="monotone" dataKey="maeF" name="우리 엔진" stroke="#22c55e" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card title="검증된 청구 수 → 보험수가 range 폭 (가운데 값 대비 %)">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data.ranges} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid stroke="#333" strokeDasharray="3 3" />
            <XAxis dataKey="verifiedClaims" stroke="#888" />
            <YAxis stroke="#888" unit="%" />
            <Tooltip contentStyle={{ background: '#111', border: '1px solid #333' }} />
            <Line type="monotone" dataKey="premiumRelativeWidthPct" name="보험수가 range 폭" stroke="#eab308" strokeWidth={2} />
            <Line type="monotone" dataKey="renewalWidthPct" name="갱신 요율 range 폭 (%p)" stroke="#60a5fa" />
          </LineChart>
        </ResponsiveContainer>
        <p className="mt-2 text-sm text-neutral-400">
          검증 청구 {r0.verifiedClaims}건일 때 range 폭 {r0.premiumRelativeWidthPct}% → {rN.verifiedClaims}건일 때 {rN.premiumRelativeWidthPct}%.
          필지 단위로 맞춰진 날씨-생산량 데이터는 공개 데이터로 만들 수 없습니다.
        </p>
      </Card>
    </main>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-neutral-800 p-4">
      <p className="text-xs text-neutral-400">{label}</p>
      <p className={`mt-1 font-mono text-2xl ${accent ? 'text-green-400' : ''}`}>{value}</p>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-neutral-800 p-4">
      <h2 className="mb-3 text-sm font-medium text-neutral-300">{title}</h2>
      {children}
    </section>
  )
}
