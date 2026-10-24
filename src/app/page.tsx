'use client'

// 대시보드: 같은 검증기로 두 고객에게 판다 + 4개 패밀리 과제 자동 생성 (사람 라벨 0명, 시장가 $ 카운터)
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { animate } from 'motion'
import type { FamilyId, Task } from '@/core/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, Stat } from '@/components/ui/card'
import { getJson, usd } from '@/lib/format'

const FAMILIES: { id: FamilyId; label: string; market: string }[] = [
  { id: 'downscaling', label: '① 초국지 다운스케일링', market: '필지 최저기온 분포 · CRPS' },
  { id: 'nowcasting', label: '② 나우캐스팅', market: '살포 vs 연기 · 결정 손익' },
  { id: 's2s', label: '③ S2S·계절', market: '3분위 확률 · Brier' },
  { id: 'decision', label: '④ 의사결정·가격', market: '서리 방제 · 비용-손실 regret' },
]
const PRICE_PER_TASK = 100 // 과제당 시장 하단 가정 (시장 단가 $200-2,000)

export default function Dashboard() {
  const [byFamily, setByFamily] = useState<Partial<Record<FamilyId, Task[]>>>({})
  const [shown, setShown] = useState(0)
  const [running, setRunning] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const shownRef = useRef(0)

  const total = Object.values(byFamily).reduce((s, t) => s + (t?.length ?? 0), 0)

  useEffect(() => {
    const controls = animate(shownRef.current, total, {
      duration: 2.5,
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
          setErrors((prev) => [...prev, `${f.label}: ${(e as Error).message}`])
        }
      }),
    )
    setRunning(false)
  }

  const recent = FAMILIES.flatMap((f) => (byFamily[f.id] ?? []).slice(0, 2))

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">실제 날씨로 "맞았는지"를 판정하는 엔진</h1>
        <p className="max-w-3xl text-[var(--muted)]">
          미국 작물보험금의 약 73%가 날씨 때문에 나갑니다. 우리는 필지 단위 위험점수를 실제 손해로 검증해 보험 요율 range를 내고,
          같은 검증기를 AI 에이전트 채점 과제로 RL 데이터 회사에 팝니다.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/insurance" className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4 hover:border-neutral-500">
            <Badge tone="caution">고객 ①</Badge>
            <p className="mt-2 font-medium">작물보험사 · 재보험사</p>
            <p className="text-sm text-[var(--muted)]">위험점수 × 실제 손해 → 보험수가 · 피해보상액 · 갱신 요율 range, 청구 검증</p>
          </Link>
          <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4">
            <Badge tone="live">고객 ②</Badge>
            <p className="mt-2 font-medium">RL 데이터 회사 (Mercor, Surge, Fleet AI …)</p>
            <p className="text-sm text-[var(--muted)]">같은 검증기로 자동 채점되는 날씨 판단 과제 · 비공개 평가셋</p>
          </div>
        </div>
      </section>

      <Card title="과제 자동 생성 - 사람 라벨 0명, 정답은 실제 날씨가 준다">
        <div className="flex flex-wrap items-center gap-4">
          <Button onClick={generate} disabled={running} active>{running ? '생성 중…' : '4개 패밀리 과제 생성'}</Button>
          <span className="text-xs text-[var(--muted)]">시장가 환산은 과제당 {usd(PRICE_PER_TASK)} 가정 (Epoch AI 기준 시장 단가 $200-2,000의 하단)</span>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Stat label="생성된 과제" value={shown.toLocaleString('en-US')} tone="accent" />
          <Stat label="시장가 환산" value={usd(shown * PRICE_PER_TASK)} tone="go" />
          <Stat label="사람 라벨" value="0명" />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FAMILIES.map((f) => (
            <div key={f.id} className="rounded-md border border-[var(--line)] p-3">
              <p className="text-sm font-medium">{f.label}</p>
              <p className="text-xs text-[var(--muted)]">{f.market}</p>
              <p className="num mt-2 text-xl">{byFamily[f.id]?.length ?? (running ? '…' : 0)}</p>
            </div>
          ))}
        </div>
        {errors.length > 0 && <p className="mt-3 text-sm text-red-400">{errors.join(' / ')}</p>}
        {recent.length > 0 && (
          <ul className="mt-4 space-y-1 text-xs text-[var(--muted)]">
            {recent.map((t) => (
              <li key={`${t.family}-${t.id}`} className="truncate">
                <span className="num text-[var(--text)]">{t.id}</span> · {t.field.name} · {t.prompt}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </main>
  )
}
