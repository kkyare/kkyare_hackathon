'use client'

// 농장 연결: 연결된 농장과 검증된 청구가 늘수록 필지 추정 오차와 요율 범위가 줄어든다 (목업)
import { useEffect, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Figure, Section } from '@/components/ui/card'
import { getJson } from '@/lib/format'

interface CurvePoint { connectedFields: number; maeF: number; rawGridMaeF: number }
interface RangePoint { verifiedClaims: number; premiumWidthUsdAc: number; premiumRelativeWidthPct: number; renewalWidthPct: number }
interface Payload { demo: boolean; points: CurvePoint[]; ranges: RangePoint[] }

const tooltipStyle = { background: 'var(--paper-2)', border: '1px solid var(--rule)', borderRadius: 2 }

export default function FarmConnectionPage() {
  const [data, setData] = useState<Payload | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getJson<Payload>('/api/farm/learning-curve?fieldId=field-ia-04&peril=frost').then(setData).catch((e: Error) => setError(e.message))
  }, [])

  if (error) return <main className="mx-auto max-w-6xl px-4 py-8"><p className="border-l-4 border-[var(--loam)] pl-3 text-sm">농장 연결 데이터를 불러오지 못했습니다: {error}</p></main>
  if (!data) return <main className="mx-auto max-w-6xl px-4 py-8 text-sm text-[var(--ink-2)]">불러오는 중입니다.</main>

  const first = data.points[0]
  const last = data.points.at(-1)!
  const r0 = data.ranges[0]
  const rN = data.ranges.at(-1)!

  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 py-8">
      <header className="max-w-3xl space-y-2">
        <h1 className="text-2xl font-semibold">농장 데이터</h1>
        <p className="text-[var(--ink-2)]">
          필지 센서 {last.connectedFields}곳을 연결하면 최저기온 추정 오차가 {first.maeF.toFixed(1)}°F에서 {last.maeF.toFixed(1)}°F로 줄어듭니다. 농장에는 필지 예보와 방제 판단을 주고, 동의를 받아 실측과 수확량을 받습니다.
        </p>
      </header>

      <div className="flex flex-wrap gap-12">
        <Figure size="lg" label="원천 격자 예보의 필지 최저기온 오차" value={`${first.rawGridMaeF.toFixed(1)}°F`} />
        <Figure size="lg" label="필지 보정, 연결된 농장 없음" value={`${first.maeF.toFixed(1)}°F`} />
        <Figure size="lg" label={`필지 ${last.connectedFields}곳 연결 후`} value={`${last.maeF.toFixed(1)}°F`} tone="canopy" />
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <Section title="연결된 필지 수와 최저기온 추정 오차" note="평균 절대 오차, °F">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.points} margin={{ left: -12 }}>
              <CartesianGrid stroke="var(--rule)" vertical={false} />
              <XAxis dataKey="connectedFields" stroke="var(--ink-2)" fontSize={12} tickLine={false} />
              <YAxis stroke="var(--ink-2)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line isAnimationActive={false} dataKey="rawGridMaeF" name="원천 격자 예보" stroke="var(--ink-2)" strokeDasharray="4 4" dot={false} />
              <Line isAnimationActive={false} dataKey="maeF" name="필지 보정 엔진" stroke="var(--canopy)" strokeWidth={2.5} />
            </LineChart>
          </ResponsiveContainer>
        </Section>

        <Section title="검증된 청구 수와 보험수가 범위 폭" note="범위 가운데 값 대비 %">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.ranges} margin={{ left: -12 }}>
              <CartesianGrid stroke="var(--rule)" vertical={false} />
              <XAxis dataKey="verifiedClaims" stroke="var(--ink-2)" fontSize={12} tickLine={false} />
              <YAxis stroke="var(--ink-2)" fontSize={12} unit="%" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line isAnimationActive={false} dataKey="premiumRelativeWidthPct" name="보험수가 범위 폭" stroke="var(--corn)" strokeWidth={2.5} />
              <Line isAnimationActive={false} dataKey="renewalWidthPct" name="갱신 요율 범위 폭 (%p)" stroke="var(--frost)" />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-sm">
            검증 청구가 {r0.verifiedClaims}건일 때 범위 폭은 {r0.premiumRelativeWidthPct}%, {rN.verifiedClaims}건이면 {rN.premiumRelativeWidthPct}%입니다.
          </p>
        </Section>
      </div>
    </main>
  )
}
