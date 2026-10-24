'use client'

// 대시보드: 같은 검증기로 두 고객에게 판다. 4개 패밀리 과제를 자동 생성해 시장가로 환산한다.
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { animate } from 'motion'
import type { FamilyId, Task } from '@/core/types'
import { Button } from '@/components/ui/button'
import { Figure, Section } from '@/components/ui/card'
import { getJson, usd } from '@/lib/format'

const FAMILIES: { id: FamilyId; label: string; question: string; scoring: string }[] = [
  { id: 'downscaling', label: '초국지 다운스케일링', question: '이 필지의 내일 아침 최저기온 분포는?', scoring: 'CRPS, 원천 예보 대비 스킬' },
  { id: 'nowcasting', label: '나우캐스팅', question: '지금 살포할까, 3시간 미룰까?', scoring: '결정 손익, Brier' },
  { id: 's2s', label: 'S2S 계절 전망', question: '3-4주 뒤 기온은 평년보다 높을까?', scoring: '3분위 Brier' },
  { id: 'decision', label: '의사결정', question: '오늘 밤 서리 방제를 할까?', scoring: '오라클 대비 손해(regret)' },
]
const PRICE_PER_TASK = 100 // 시장 단가 $200-2,000의 하단으로 가정

export default function Dashboard() {
  const [byFamily, setByFamily] = useState<Partial<Record<FamilyId, Task[]>>>({})
  const [shown, setShown] = useState(0)
  const [running, setRunning] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const shownRef = useRef(0)
  const total = Object.values(byFamily).reduce((s, t) => s + (t?.length ?? 0), 0)

  // 이 화면의 유일한 움직임: 생성 버튼을 누른 뒤 숫자가 올라간다
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
    <main className="mx-auto max-w-6xl space-y-12 px-4 py-10">
      <section className="grid gap-10 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-4">
          <h1 className="figure text-5xl font-bold leading-[1.02] sm:text-6xl">
            그날 그 밭에 정말 서리가 왔는지, 날씨가 채점합니다
          </h1>
          <p className="max-w-xl text-lg text-[var(--ink-2)]">
            미국 작물보험금의 약 73%는 날씨 때문에 나갑니다. 필지 단위로 재구성한 날씨를 실제 손해와 맞춰 보고, 그 검증 결과를 두 고객에게 팝니다.
          </p>
        </div>
        <dl className="space-y-5 self-end">
          <div className="border-l-4 border-[var(--corn)] pl-4">
            <dt className="font-semibold">작물보험사와 재보험사</dt>
            <dd className="text-sm text-[var(--ink-2)]">위험점수와 실제 손해로 보험수가, 피해보상액, 갱신 요율의 범위를 정하고 청구를 검증합니다.</dd>
            <dd className="mt-1 text-sm"><Link href="/insurance" className="underline underline-offset-4">보험사 콘솔 열기</Link></dd>
          </div>
          <div className="border-l-4 border-[var(--frost)] pl-4">
            <dt className="font-semibold">RL 데이터 회사</dt>
            <dd className="text-sm text-[var(--ink-2)]">같은 검증기를 AI 에이전트 채점 과제로 씁니다. 정답은 사람이 아니라 다음 날 관측값이 줍니다.</dd>
          </div>
        </dl>
      </section>

      <Section title="채점 과제 만들기" note={`시장가는 과제당 ${usd(PRICE_PER_TASK)}로 환산 (시장 단가 $200-2,000의 하단, 가정)`}>
        <div className="flex flex-wrap items-end gap-10">
          <Button variant="solid" onClick={generate} disabled={running}>{running ? '과제를 만드는 중' : '네 가지 과제 만들기'}</Button>
          <Figure size="lg" label="만든 과제" value={shown.toLocaleString('en-US')} />
          <Figure size="lg" label="시장가 환산" value={usd(shown * PRICE_PER_TASK)} tone="canopy" />
          <Figure size="lg" label="필요한 사람 라벨" value="0" />
        </div>

        <table className="mt-8 w-full text-sm">
          <thead className="text-left text-xs text-[var(--ink-2)]">
            <tr className="border-b border-[var(--rule)]">
              <th className="py-2 font-normal">과제 종류</th>
              <th className="py-2 font-normal">에이전트가 받는 질문</th>
              <th className="py-2 font-normal">채점</th>
              <th className="py-2 text-right font-normal">과제 수</th>
            </tr>
          </thead>
          <tbody>
            {FAMILIES.map((f) => (
              <tr key={f.id} className="border-b border-[var(--rule)]">
                <td className="py-3 font-medium">{f.label}</td>
                <td className="py-3">{f.question}</td>
                <td className="py-3 text-[var(--ink-2)]">{f.scoring}</td>
                <td className="figure py-3 text-right text-2xl">{byFamily[f.id]?.length ?? (running ? '' : '0')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {errors.map((e) => <p key={e} className="mt-3 border-l-4 border-[var(--loam)] pl-3 text-sm">{e}</p>)}
        {total > 0 && (
          <p className="mt-4 max-w-3xl text-sm text-[var(--ink-2)]">
            예시: {byFamily.decision?.[0]?.prompt ?? byFamily.downscaling?.[0]?.prompt}
          </p>
        )}
      </Section>
    </main>
  )
}
