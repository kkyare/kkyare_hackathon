'use client'
// 보정 곡선(reliability diagram): 예측 확률 구간별 실제 발생 빈도. 대각선에 가까울수록 확률이 정직하다
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Calibration } from '@/arena/calibration'
import { modelColor, modelLabel, num } from './format'

type Point = { meanProbability: number; frequency: number; n: number; model: string }

function PointTooltip({ active, payload }: { active?: boolean; payload?: { payload: Point }[] }) {
  const p = payload?.[0]?.payload
  if (!active || !p) return null
  return (
    <div className="rounded-sm border border-[var(--rule)] bg-[var(--paper-2)] px-3 py-2 text-xs">
      <p className="font-semibold">{modelLabel(p.model)}</p>
      <p className="tnum text-[var(--ink-2)]">예측 평균 {num(p.meanProbability)}, 실제 빈도 {num(p.frequency)}</p>
      <p className="text-[var(--ink-2)]">과제 {p.n}개</p>
    </div>
  )
}

export function CalibrationChart({ calibrations }: { calibrations: Calibration[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart margin={{ top: 4, right: 16, bottom: 20, left: -4 }}>
        <CartesianGrid stroke="var(--rule)" />
        <XAxis
          type="number" dataKey="meanProbability" domain={[0, 1]} ticks={[0, 0.2, 0.4, 0.6, 0.8, 1]}
          stroke="var(--ink-2)" fontSize={12} tickLine={false}
          label={{ value: '예측 확률', position: 'insideBottom', offset: -12, fontSize: 12, fill: 'var(--ink-2)' }}
        />
        <YAxis
          type="number" domain={[0, 1]} ticks={[0, 0.2, 0.4, 0.6, 0.8, 1]} width={52}
          stroke="var(--ink-2)" fontSize={12} tickLine={false} axisLine={false}
          label={{ value: '실제 빈도', angle: -90, position: 'insideLeft', offset: 4, dy: 28, fontSize: 12, fill: 'var(--ink-2)' }}
        />
        <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} stroke="var(--ink-2)" strokeDasharray="4 4" ifOverflow="extendDomain" />
        <Tooltip content={<PointTooltip />} cursor={{ stroke: 'var(--rule)' }} />
        <Legend verticalAlign="top" height={28} iconType="circle" itemSorter={null} wrapperStyle={{ fontSize: 12, color: 'var(--ink)' }} />
        {calibrations.map(c => (
          <Line
            key={c.model}
            name={modelLabel(c.model)}
            data={c.bins.map(b => ({ ...b, model: c.model }))}
            dataKey="frequency"
            stroke={modelColor(c.model)}
            strokeWidth={2}
            dot={{ r: 4, strokeWidth: 2, stroke: 'var(--paper)', fill: modelColor(c.model) }}
            activeDot={{ r: 6, stroke: 'var(--paper)', strokeWidth: 2 }}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
