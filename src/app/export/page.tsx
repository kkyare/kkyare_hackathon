'use client'
// 납품: 과제 묶음(TaskPack)을 JSON·JSONL·데이터 카드로 내려받는다 (데모 장면 2:35 "오늘 바로 데이터 회사에 보낼 수 있다")
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Figure, Section } from '@/components/ui/card'
import type { FamilyId, Score, Task } from '@/core/types'
import { FAMILY_LABEL, usd } from '../arena/format'

type TasksResponse = { tasks: Task[]; models: string[]; replayable: boolean }
type Format = 'json' | 'jsonl' | 'card'

const FAMILIES: FamilyId[] = ['nowcasting', 'downscaling', 'decision', 's2s']
const PRICE_PER_TASK_USD = 100 // PLAN 9-4 가정값 (src/arena/export.ts와 같은 값)
const FORMATS: { id: Format; label: string; hint: string }[] = [
  { id: 'json', label: 'TaskPack JSON', hint: '과제와 과제 시점 예보 자료. 공개용이면 정답 관측 포함' },
  { id: 'jsonl', label: 'JSONL', hint: '한 줄에 과제 하나. 학습 파이프라인과 verifiers에 바로 넣는 형식' },
  { id: 'card', label: '데이터 카드', hint: 'Markdown 문서. 데이터 출처, 미래 정보 차단 방식, 기준 성능' },
]

async function exportPack(tasks: Task[], scores: Score[], format: Format, holdout: boolean, download: boolean) {
  const q = new URLSearchParams({ format, ...(holdout && { holdout: '1' }), ...(download && { download: '1' }) })
  const res = await fetch(`/api/export?${q}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ tasks, scores }) })
  if (!res.ok) throw new Error((await res.json()).error ?? `/api/export → HTTP ${res.status}`)
  return res
}

async function saveAs(res: Response, fallback: string) {
  const name = /filename="([^"]+)"/.exec(res.headers.get('content-disposition') ?? '')?.[1] ?? fallback
  const url = URL.createObjectURL(await res.blob())
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  a.click()
  URL.revokeObjectURL(url)
}

export default function ExportPage() {
  const [count, setCount] = useState(2)
  const [all, setAll] = useState<TasksResponse>()
  const [picked, setPicked] = useState<Set<FamilyId>>(new Set(FAMILIES))
  const [holdout, setHoldout] = useState(false)
  const [scores, setScores] = useState<Score[]>([])
  const [card, setCard] = useState<string>()
  const [error, setError] = useState<string>()

  // 요청이 겹치면 늦게 도착한 옛 응답이 최신 결과를 덮어쓰지 않게, effect가 바뀌면 이전 응답은 버린다
  useEffect(() => {
    let stale = false
    fetch(`/api/arena/tasks?count=${count}`)
      .then(r => r.json() as Promise<TasksResponse>)
      .then(r => { if (!stale) setAll(r) })
      .catch(e => setError((e as Error).message))
    return () => { stale = true }
  }, [count])

  const tasks = all?.tasks.filter(t => picked.has(t.family)) ?? []

  // 데이터 카드의 Arena baseline: 저장 응답 재생으로 채점 (Claude 호출 없음)
  useEffect(() => {
    let stale = false
    if (!all?.replayable || tasks.length === 0) {
      setScores([])
      return
    }
    fetch('/api/arena/run?mock=1', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ tasks }) })
      .then(r => r.json())
      .then(r => { if (!stale) setScores(r.scores ?? []) })
      .catch(() => { if (!stale) setScores([]) })
    return () => { stale = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, picked])

  useEffect(() => {
    let stale = false
    if (tasks.length === 0) {
      setCard(undefined)
      return
    }
    exportPack(tasks, scores, 'card', holdout, false)
      .then(r => r.text())
      .then(text => { if (!stale) setCard(text) })
      .catch(e => { if (!stale) setError((e as Error).message) })
    return () => { stale = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, picked, holdout, scores])

  const toggle = (f: FamilyId) => setPicked(prev => {
    const next = new Set(prev)
    if (next.has(f)) next.delete(f)
    else next.add(f)
    return next
  })

  const download = async (format: Format) => {
    setError(undefined)
    try {
      await saveAs(await exportPack(tasks, scores, format, holdout, true), `taskpack.${format === 'card' ? 'md' : format}`)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 py-8">
      <header className="max-w-3xl space-y-2">
        <h1 className="text-2xl font-semibold">데이터 납품</h1>
        <p className="text-[var(--ink-2)]">
          과제와 과제 시점의 예보 자료를 묶어 AI 학습 데이터 회사가 쓰는 형식으로 내려받습니다. 비공개 평가용은 정답 관측을 빼고 보내고, 채점은 저희 서버에서 합니다.
        </p>
      </header>
      {error && <p className="border-l-4 border-[var(--loam)] pl-3 text-sm">{error}</p>}

      <div className="grid gap-10 lg:grid-cols-[20rem_1fr]">
        <div className="space-y-10">
          <Section title="묶음 구성">
            <fieldset className="space-y-2">
              <legend className="mb-1 text-xs text-[var(--ink-2)]">과제 패밀리</legend>
              {FAMILIES.map(f => (
                <label key={f} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="accent-[var(--ink)]" checked={picked.has(f)} onChange={() => toggle(f)} />
                  {FAMILY_LABEL[f]}
                  <span className="tnum ml-auto text-[var(--ink-2)]">{all?.tasks.filter(t => t.family === f).length ?? 0}</span>
                </label>
              ))}
            </fieldset>
            <label className="mt-4 flex items-center justify-between gap-2 text-sm">
              <span className="text-xs text-[var(--ink-2)]">패밀리당 과제 수</span>
              <select className="rounded-sm border border-[var(--rule)] bg-[var(--paper-2)] px-2 py-1" value={count} onChange={e => setCount(Number(e.target.value))}>
                {[1, 2, 3, 5, 10].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <label className="mt-4 flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1 accent-[var(--ink)]" checked={holdout} onChange={e => setHoldout(e.target.checked)} />
              <span>
                비공개 평가셋
                <span className="block text-xs text-[var(--ink-2)]">정답 관측을 빼고 보냅니다</span>
              </span>
            </label>
          </Section>

          <Section>
            <div className="grid grid-cols-2 gap-6">
              <Figure label="과제 수" value={String(tasks.length)} />
              <Figure label={`시장가 추정 (과제당 ${usd(PRICE_PER_TASK_USD)}, 가정)`} value={usd(tasks.length * PRICE_PER_TASK_USD)} />
            </div>
          </Section>

          <Section title="내려받기">
            <div className="space-y-2">
              {FORMATS.map(f => (
                <Button key={f.id} className="flex w-full flex-col items-start text-left" disabled={tasks.length === 0} onClick={() => download(f.id)}>
                  <span>{f.label}</span>
                  <span className="text-xs font-normal text-[var(--ink-2)]">{f.hint}</span>
                </Button>
              ))}
            </div>
          </Section>
        </div>

        <Section title="데이터 카드" note={scores.length > 0 ? '기준 성능은 저장된 Claude 응답으로 계산' : undefined}>
          {scores.length > 0 && <div className="mb-3"><Badge tone="frost">모델 비교 결과 포함</Badge></div>}
          {card
            ? <pre className="max-h-[40rem] overflow-auto whitespace-pre-wrap bg-[var(--paper-2)] p-4 text-xs leading-relaxed">{card}</pre>
            : <p className="text-sm text-[var(--ink-2)]">패밀리를 하나 이상 고르세요.</p>}
        </Section>
      </div>
    </main>
  )
}
