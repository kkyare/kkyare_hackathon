'use client'
// 보정 곡선(reliability diagram): 예측 확률 구간별 실제 발생 빈도. 대각선에 가까울수록 확률이 정직하다
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Calibration } from '../../arena/calibration'
import { modelColor, modelLabel, num } from './format'
import { UI } from './ui'

type Point = { meanProbability: number; frequency: number; n: number; model: string }

function PointTooltip({ active, payload }: { active?: boolean; payload?: { payload: Point }[] }) {
  const p = payload?.[0]?.payload
  if (!active || !p) return null
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs shadow-sm">
      <div className="font-medium text-zinc-900">{modelLabel(p.model)}</div>
      <div className={`text-zinc-600 ${UI.mono}`}>예측 평균 {num(p.meanProbability)} · 실제 빈도 {num(p.frequency)}</div>
      <div className="text-zinc-500">과제 {p.n}개</div>
    </div>
  )
}

export function CalibrationChart({ calibrations }: { calibrations: Calibration[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <LineChart margin={{ top: 8, right: 16, bottom: 20, left: 0 }}>
          <CartesianGrid stroke="#e4e4e7" strokeDasharray="3 3" />
          <XAxis
            type="number" dataKey="meanProbability" domain={[0, 1]} ticks={[0, 0.2, 0.4, 0.6, 0.8, 1]}
            tick={{ fontSize: 12, fill: '#71717a' }} stroke="#d4d4d8"
            label={{ value: '예측 확률', position: 'insideBottom', offset: -12, fontSize: 12, fill: '#52525b' }}
          />
          <YAxis
            type="number" domain={[0, 1]} ticks={[0, 0.2, 0.4, 0.6, 0.8, 1]} width={56}
            tick={{ fontSize: 12, fill: '#71717a' }} stroke="#d4d4d8"
            label={{ value: '실제 빈도', angle: -90, position: 'insideLeft', offset: 4, dy: 28, fontSize: 12, fill: '#52525b' }}
          />
          <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} stroke="#a1a1aa" strokeDasharray="4 4" ifOverflow="extendDomain" />
          <Tooltip content={<PointTooltip />} cursor={{ stroke: '#d4d4d8' }} />
          <Legend verticalAlign="top" height={28} iconType="circle" itemSorter={null} wrapperStyle={{ fontSize: 12, color: '#3f3f46' }} />
          {calibrations.map(c => (
            <Line
              key={c.model}
              name={modelLabel(c.model)}
              data={c.bins.map(b => ({ ...b, model: c.model }))}
              dataKey="frequency"
              stroke={modelColor(c.model)}
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 2, stroke: '#ffffff', fill: modelColor(c.model) }}
              activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
