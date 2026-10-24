'use client'

// Time Machine: 하루를 재생하며 원천 예보 / 필지 보정 예보 / 실측(농장 센서)을 비교하고, 끝나면 서리 판정 ✓/✗
import { useEffect, useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Field } from '@/core/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, Stat } from '@/components/ui/card'
import { getJson } from '@/lib/format'

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
  { id: 'frost-0512', label: '5/12 늦서리 밤' },
  { id: 'mild-0520', label: '5/20 따뜻한 밤' },
]

function tempColor(t: number | null, threshold: number) {
  if (t === null) return '#333'
  if (t <= threshold) return 'var(--nogo)'
  if (t <= threshold + 3) return 'var(--caution)'
  return 'var(--go)'
}
const localTime = (iso: string) => {
  const d = new Date(iso)
  const h = (d.getUTCHours() + 24 - 5) % 24
  return `${String(h).padStart(2, '0')}:00 CDT`
}

export default function TimeMachine() {
  const [scenario, setScenario] = useState('frost-0512')
  const [data, setData] = useState<Replay | null>(null)
  const [hour, setHour] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [selected, setSelected] = useState('field-ia-04')

  useEffect(() => {
    setData(null)
    setHour(0)
    getJson<Replay>(`/api/timemachine?scenario=${scenario}`).then(setData).catch(() => setData(null))
  }, [scenario])

  const last = (data?.fields[0]?.hours.length ?? 1) - 1
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => setHour((h) => { if (h >= last) { setPlaying(false); return h } return h + 1 }), 400)
    return () => clearInterval(id)
  }, [playing, last])

  const done = hour >= last
  const sel = data?.fields.find((f) => f.field.id === selected)
  const chartData = useMemo(() => sel?.hours.map((h, i) => ({ ...h, label: localTime(h.time), observed: i <= hour ? h.observed : null })) ?? [], [sel, hour])
  const sum = (k: 'regretUsdAc' | 'rawRegretUsdAc') => data?.fields.reduce((s, f) => s + f[k], 0) ?? 0

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Time Machine</h1>
          <p className="text-sm text-[var(--muted)]">발행 시점의 예보로 판단하고, 시간이 흐르며 실측이 도착하면 자동 채점됩니다.</p>
        </div>
        <div className="flex gap-2">
          {SCENARIOS.map((s) => <Button key={s.id} active={s.id === scenario} onClick={() => setScenario(s.id)}>{s.label}</Button>)}
        </div>
      </header>

      {data && (
        <>
          <Card>
            <div className="flex flex-wrap items-center gap-4">
              <Button onClick={() => { if (done) setHour(0); setPlaying((p) => !p) }}>{playing ? '일시정지' : done ? '다시 재생' : '재생'}</Button>
              <input type="range" min={0} max={last} value={hour} onChange={(e) => { setPlaying(false); setHour(Number(e.target.value)) }} className="flex-1" />
              <span className="num w-28 text-right text-sm">{localTime(data.fields[0].hours[hour].time)}</span>
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.fields.map((f) => {
              const h = f.hours[hour]
              const correct = f.regretUsdAc === 0
              return (
                <button key={f.field.id} onClick={() => setSelected(f.field.id)}
                  className={`rounded-lg border p-3 text-left ${f.field.id === selected ? 'border-[var(--accent)]' : 'border-[var(--line)]'} bg-[var(--panel)]`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{f.field.name}</span>
                    <span className="h-3 w-3 rounded-full" style={{ background: tempColor(h.observed, data.thresholdF) }} />
                  </div>
                  <p className="text-xs text-[var(--muted)]">{f.field.terrain ?? 'flat'} · {f.field.elevationM}m</p>
                  <p className="num mt-2 text-sm">실측 {h.observed ?? '-'}°F <span className="text-[var(--muted)]">/ 보정 예보 {h.engine ?? '-'}°F</span></p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    서리 확률 <b className="num text-[var(--text)]">{Math.round(f.pFrost * 100)}%</b> → {f.protect ? '방제 권고' : '방제 안 함'}
                    <span className="ml-1">(원천 예보 {Math.round(f.rawPFrost * 100)}%)</span>
                  </p>
                  {done && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      <Badge tone={f.observedFrost ? 'nogo' : 'muted'}>실제 {f.observedFrost ? `서리 ${f.observedMin}°F` : '서리 없음'}</Badge>
                      <Badge tone={correct ? 'go' : 'caution'}>{correct ? '✓ 손해 0' : `헛방제 $${f.regretUsdAc}/ac`}</Badge>
                      {f.rawRegretUsdAc > 0 && <Badge tone="nogo">원천 예보대로면 ${f.rawRegretUsdAc}/ac 손해</Badge>}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {done && (
            <div className="grid gap-4 sm:grid-cols-3">
              <Stat label="실제 서리가 온 필지" value={`${data.fields.filter((f) => f.observedFrost).length} / ${data.fields.length}`} tone="nogo" />
              <Stat label="원천 격자 예보대로 했을 때 손해 (acre당 합계)" value={`$${sum('rawRegretUsdAc').toLocaleString('en-US')}`} tone="nogo" />
              <Stat label="필지 보정 엔진 권고대로 했을 때 손해" value={`$${sum('regretUsdAc').toLocaleString('en-US')}`} tone="go" />
            </div>
          )}
          <p className="text-xs text-[var(--muted)]">방제 비용 ${data.costUsdAc}/acre, 서리 피해 ${data.lossUsdAc}/acre (가정) → 서리 확률이 {Math.round((data.costUsdAc / data.lossUsdAc) * 100)}%를 넘으면 방제가 이득.</p>

          {sel && (
            <Card title={`${sel.field.name}: 원천 예보 · 보정 예보 · 실측 (°F)`}>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid stroke="#262626" strokeDasharray="3 3" />
                  <XAxis dataKey="label" stroke="#888" interval={3} />
                  <YAxis stroke="#888" domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip contentStyle={{ background: '#111', border: '1px solid #333' }} />
                  <ReferenceLine y={data.thresholdF} stroke="var(--nogo)" strokeDasharray="4 4" label={{ value: '서리 32°F', fill: '#ef4444', fontSize: 11 }} />
                  <Line dataKey="raw" name="원천 격자 예보" stroke="#666" strokeDasharray="4 4" dot={false} />
                  <Line dataKey="engine" name="필지 보정 예보" stroke="var(--accent)" dot={false} />
                  <Line dataKey="observed" name="실측 (농장 센서)" stroke="#f5f5f5" strokeWidth={2} dot={false} connectNulls={false} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}
        </>
      )}
      {!data && <p className="text-sm text-[var(--muted)]">불러오는 중…</p>}
    </main>
  )
}
