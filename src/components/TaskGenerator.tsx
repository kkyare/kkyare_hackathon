'use client'

// AI 학습 데이터 회사용: 4개 과제 종류를 한 번에 만들어 예상 판매가로 환산한다.
import { useEffect, useRef, useState } from 'react'
import { animate } from 'motion'
import type { FamilyId, Task } from '@/core/types'
import { Button } from '@/components/ui/button'
import { Figure, Section } from '@/components/ui/card'
import { getJson, usd } from '@/lib/format'

const FAMILIES: { id: FamilyId; label: string; question: string; scoring: string }[] = [
  { id: 'downscaling', label: '필지 기온 예측', question: '이 필지의 내일 아침 최저기온 분포는?', scoring: '분포 오차(CRPS), 공개 예보 대비 개선' },
  { id: 'nowcasting', label: '살포 시점', question: '지금 살포할까, 3시간 미룰까?', scoring: '결정 손익, 확률 오차(Brier)' },
  { id: 's2s', label: '3-4주 전망', question: '3-4주 뒤 기온은 평년보다 높을까?', scoring: '3구간 확률 오차' },
  { id: 'decision', label: '서리 방제', question: '오늘 밤 서리 방제를 할까?', scoring: '최선 대비 손해' },
]
const PRICE_PER_TASK = 100 // 시장 단가 $200-2,000의 하단으로 가정

export function TaskGenerator() {
  const [byFamily, setByFamily] = useState<Partial<Record<FamilyId, Task[]>>>({})
  const [shown, setShown] = useState(0)
  const [running, setRunning] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const shownRef = useRef(0)
  const total = Object.values(byFamily).reduce((s, t) => s + (t?.length ?? 0), 0)

  // 버튼을 누른 뒤 숫자가 올라가는 것만 움직인다
  useEffect(() => {
    const controls = animate(shownRef.current, total, {
      duration: 1.8,
      ease: 'easeOut',
      onUpdate: (v) => { shownRef.current = v; setShown(Math.round(v)) },
    })
    return () => controls.stop()
  }, [total])

  const generate = async () => {
    setRunning(true)
    setErrors([])
    setByFamily({})
    await Promise.all(
      FAMILIES.map(async (f) => {
        try {
          const tasks = await getJson<Task[]>(`/api/families/${f.id}/generate`, {})
          setByFamily((prev) => ({ ...prev, [f.id]: tasks }))
        } catch (e) {
          setErrors((prev) => [...prev, `${f.label} 과제를 만들지 못했습니다 (${(e as Error).message}).`])
        }
      }),
    )
    setRunning(false)
  }

  return (
    <Section title="AI 학습 데이터 회사용 채점 과제" note={`예상 판매가는 과제당 ${usd(PRICE_PER_TASK)}로 계산 (시장 단가 $200-2,000의 하단, 가정)`}>
      <p className="mb-4 max-w-3xl text-sm text-[var(--ink-2)]">
        위 예측에 쓰는 같은 필지 날씨 계산으로 AI 모델의 날씨 판단을 채점하는 과제를 만듭니다. 정답은 다음 날 관측값이 정합니다.
      </p>
      <div className="flex flex-wrap items-end gap-10">
        <Button variant="solid" onClick={generate} disabled={running}>{running ? '과제를 만드는 중' : '과제 만들기'}</Button>
        <Figure size="lg" label="만든 과제" value={shown.toLocaleString('en-US')} />
        <Figure size="lg" label="예상 판매가" value={usd(shown * PRICE_PER_TASK)} tone="canopy" />
      </div>
      <table className="mt-8 w-full text-sm">
        <thead className="text-left text-xs text-[var(--ink-2)]">
          <tr className="border-b border-[var(--rule)]">
            <th className="py-2 font-normal">과제 종류</th>
            <th className="py-2 font-normal">모델이 받는 질문</th>
            <th className="py-2 font-normal">채점 기준</th>
            <th className="py-2 text-right font-normal">만든 수</th>
          </tr>
        </thead>
        <tbody>
          {FAMILIES.map((f) => (
            <tr key={f.id} className="border-b border-[var(--rule)]">
              <td className="py-3 font-medium">{f.label}</td>
              <td className="py-3">{f.question}</td>
              <td className="py-3 text-[var(--ink-2)]">{f.scoring}</td>
              <td className="figure py-3 text-right text-xl">{byFamily[f.id]?.length ?? (running ? '' : '0')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {errors.map((e) => <p key={e} className="mt-3 border-l-4 border-[var(--loam)] pl-3 text-sm">{e}</p>)}
    </Section>
  )
}
