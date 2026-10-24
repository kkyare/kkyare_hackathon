'use client'

// Time Machine: 발행 시점 예보로 판단하고, 하루를 재생하며 실측(농장 센서)이 도착하면 손익으로 채점한다
import { useEffect, useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Field } from '@/core/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Figure, Section } from '@/components/ui/card'
import { getJson, usd } from '@/lib/format'

interface Hour { time: string; raw: number | null; engine: number | null; observed: number | null }
interface ReplayField {
  field: Field; hours: Hour[]
  predictedMin: number; rawMin: number; observedMin: number
  predictedFrost: boolean; rawFrost: boolean; observedFrost: boolean
  pFrost: number; rawPFrost: number; protect: boolean; rawProtect: boolean
  regretUsdAc: number; rawRegretUsdAc: number; brier: number; rawBrier: number
}
interface Replay { scenario: string; label: string; t0: string; thresholdF: number; costUsdAc: number; lossUsdAc: number; fields: ReplayField[] }

const SCENARIOS = [
  { id: 'frost-0512', label: '5월 12일 늦서리 밤' },
  { id: 'mild-0520', label: '5월 20일 따뜻한 밤' },
]
const localTime = (iso: string) => `${String((new Date(iso).getUTCHours() + 19) % 24).padStart(2, '0')}시`

export default function TimeMachine() {
  const [scenario, setScenario] = useState('frost-0512')
  const [data, setData] = useState<Replay | null>(null)
  const [hour, setHour] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [selected, setSelected] = useState('field-ia-04')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setData(null)
    setHour(0)
    setPlaying(false)
    getJson<Replay>(`/api/timemachine?scenario=${scenario}`).then(setData).catch((e: Error) => setError(`재생 데이터를 불러오지 못했습니다: ${e.message}`))
  }, [scenario])

  const last = (data?.fields[0]?.hours.length ?? 1) - 1
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => setHour((h) => { if (h >= last) { setPlaying(false); return h } return h + 1 }), 350)
    return () => clearInterval(id)
  }, [playing, last])

  const done = hour >= last
  const sel = data?.fields.find((f) => f.field.id === selected)
  const chartData = useMemo(() => sel?.hours.map((h, i) => ({ ...h, label: localTime(h.time), observed: i <= hour ? h.observed : null })) ?? [], [sel, hour])
  const sum = (k: 'regretUsdAc' | 'rawRegretUsdAc') => data?.fields.reduce((s, f) => s + f[k], 0) ?? 0

  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 py-8">
      <header className="max-w-3xl space-y-2">
        <h1 className="figure text-4xl font-bold">어제 오후의 예보로 판단하고, 오늘 아침 관측으로 채점합니다</h1>
        <p className="text-[var(--ink-2)]">
          판단은 발행 시점에 알 수 있던 예보만 씁니다. 하루를 재생하면 농장 센서 관측이 시간 순서대로 도착하고, 끝나면 방제 결정의 손익이 확정됩니다.
        </p>
        <div className="flex gap-2 pt-2">
          {SCENARIOS.map((s) => <Button key={s.id} active={s.id === scenario} onClick={() => setScenario(s.id)}>{s.label}</Button>)}
        </div>
      </header>
      {error && <p className="border-l-4 border-[var(--loam)] pl-3 text-sm">{error}</p>}

      {data && (
        <>
          <div className="flex items-center gap-4 border-y border-[var(--ink)] py-3">
            <Button variant="solid" onClick={() => { if (done) setHour(0); setPlaying((p) => !p) }}>{playing ? '멈추기' : done ? '처음부터 재생' : '재생'}</Button>
            <input aria-label="재생 시각" type="range" min={0} max={last} value={hour} onChange={(e) => { setPlaying(false); setHour(Number(e.target.value)) }} className="flex-1 accent-[var(--ink)]" />
            <span className="figure w-20 text-right text-2xl">{localTime(data.fields[0].hours[hour].time)}</span>
          </div>

          <table className="w-full text-sm">
            <thead className="text-left text-xs text-[var(--ink-2)]">
              <tr className="border-b border-[var(--rule)]">
                <th className="py-2 font-normal">필지</th>
                <th className="py-2 text-right font-normal">지금 실측</th>
                <th className="py-2 text-right font-normal">서리 확률 (원천 예보)</th>
                <th className="py-2 pl-8 font-normal">엔진 결정</th>
                <th className="py-2 font-normal">결과</th>
              </tr>
            </thead>
            <tbody>
              {data.fields.map((f) => {
                const now = f.hours[hour].observed
                const isSel = f.field.id === selected
                return (
                  <tr key={f.field.id} onClick={() => setSelected(f.field.id)} className={`cursor-pointer border-b border-[var(--rule)] ${isSel ? 'bg-[var(--paper-2)]' : 'hover:bg-[var(--paper-2)]'}`}>
                    <td className="py-2.5">
                      <span className="font-medium">{f.field.name}</span>
                      <span className="ml-2 text-xs text-[var(--ink-2)]">{f.field.terrain ?? 'flat'}, {f.field.elevationM}m</span>
                    </td>
                    <td className="figure py-2.5 text-right text-lg" style={{ color: now !== null && now <= data.thresholdF ? 'var(--frost)' : undefined }}>{now ?? '-'}°F</td>
                    <td className="py-2.5 text-right tnum">
                      <b className="figure text-lg">{Math.round(f.pFrost * 100)}%</b>
                      <span className="ml-1 text-[var(--ink-2)]">({Math.round(f.rawPFrost * 100)}%)</span>
                    </td>
                    <td className="py-2.5 pl-8">{f.protect ? '방제' : '방제 안 함'}</td>
                    <td className="py-2.5">
                      {done ? (
                        <span className="flex flex-wrap gap-1">
                          {f.observedFrost && <Badge tone="frost">서리 {f.observedMin}°F</Badge>}
                          {f.regretUsdAc === 0 ? <Badge tone="canopy">손해 없음</Badge> : <Badge tone="corn">헛방제 {usd(f.regretUsdAc)}/ac</Badge>}
                          {f.rawRegretUsdAc > 0 && <Badge tone="loam">원천 예보였다면 {usd(f.rawRegretUsdAc)}/ac 손해</Badge>}
                        </span>
                      ) : (
                        <span className="text-[var(--ink-2)]">관측 기다리는 중</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {done && (
            <div className="flex flex-wrap gap-12">
              <Figure size="lg" label="실제로 서리가 온 필지" value={`${data.fields.filter((f) => f.observedFrost).length}곳 / ${data.fields.length}곳`} tone="frost" />
              <Figure size="lg" label="원천 격자 예보대로 했을 때 손해, acre당 합계" value={usd(sum('rawRegretUsdAc'))} tone="loam" />
              <Figure size="lg" label="필지 보정 엔진대로 했을 때 손해" value={usd(sum('regretUsdAc'))} tone="canopy" />
            </div>
          )}
          <p className="text-xs text-[var(--ink-2)]">
            방제 비용 {usd(data.costUsdAc)}/acre, 서리 피해 {usd(data.lossUsdAc)}/acre로 가정하면 서리 확률이 {Math.round((data.costUsdAc / data.lossUsdAc) * 100)}%를 넘을 때 방제하는 편이 이득입니다.
          </p>

          {sel && (
            <Section title={`${sel.field.name}의 하루`} note="회색 점선은 원천 격자 예보, 파란 선은 필지 보정 예보, 검은 선은 농장 센서 실측">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData} margin={{ left: -12 }}>
                  <CartesianGrid stroke="var(--rule)" vertical={false} />
                  <XAxis dataKey="label" stroke="var(--ink-2)" fontSize={12} interval={3} tickLine={false} />
                  <YAxis stroke="var(--ink-2)" fontSize={12} domain={[(min: number) => Math.floor(min - 2), (max: number) => Math.ceil(max + 2)]} allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--paper-2)', border: '1px solid var(--rule)', borderRadius: 2 }} />
                  <ReferenceLine y={data.thresholdF} stroke="var(--frost)" strokeDasharray="2 4" label={{ value: '서리 기준 32°F', fill: 'var(--frost)', fontSize: 11, position: 'insideBottomRight' }} />
                  <Line isAnimationActive={false} dataKey="raw" name="원천 격자 예보" stroke="var(--ink-2)" strokeDasharray="4 4" dot={false} />
                  <Line isAnimationActive={false} dataKey="engine" name="필지 보정 예보" stroke="var(--frost)" strokeWidth={2} dot={false} />
                  <Line isAnimationActive={false} dataKey="observed" name="농장 센서 실측" stroke="var(--ink)" strokeWidth={2.5} dot={false} connectNulls={false} />
                </LineChart>
              </ResponsiveContainer>
            </Section>
          )}
        </>
      )}
      {!data && !error && <p className="text-sm text-[var(--ink-2)]">재생 데이터를 불러오는 중입니다.</p>}
    </main>
  )
}
