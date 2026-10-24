'use client'
// 납품: 과제 묶음(TaskPack)을 JSON·JSONL·데이터 카드로 내려받는다 (데모 장면 2:35 "오늘 바로 데이터 회사에 보낼 수 있다")
import { useEffect, useState } from 'react'
import type { FamilyId, Score, Task } from '../../core/types'
import { FAMILY_LABEL, usd } from '../arena/format'
import { Badge, Card, Empty, Stat, TONE, UI } from '../arena/ui'

type TasksResponse = { tasks: Task[]; models: string[]; replayable: boolean }
type Format = 'json' | 'jsonl' | 'card'

const FAMILIES: FamilyId[] = ['nowcasting', 'downscaling', 'decision', 's2s']
const PRICE_PER_TASK_USD = 100 // PLAN 9-4 가정값 (src/arena/export.ts와 같은 값)
const FORMATS: { id: Format; label: string; hint: string }[] = [
  { id: 'json', label: 'TaskPack JSON', hint: '과제 + t0 스냅샷 (+ 정답 관측)' },
  { id: 'jsonl', label: 'JSONL', hint: '한 줄에 과제 하나, RL 파이프라인·verifiers 입력' },
  { id: 'card', label: '데이터 카드', hint: 'Markdown, 출처·누출 방지·baseline' },
]

async function exportPack(tasks: Task[], scores: Score[], format: Format, holdout: boolean, download: boolean) {
  const q = new URLSearchParams({ format, ...(holdout && { holdout: '1' }), ...(download && { download: '1' }) })
  const res = await fetch(`/api/export?${q}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ tasks, scores }) })
  if (!res.ok) throw new Error((await res.json()).error ?? `HTTP ${res.status}`)
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
    <main className="min-h-screen break-keep bg-zinc-50 text-zinc-900">
      <div className="mx-auto flex max-w-screen-xl flex-col gap-5 px-4 py-6 sm:px-6">
        <header className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">납품</h1>
          <Badge tone={TONE.demo}>DEMO DATA</Badge>
          <Badge tone={TONE.neutral}>가정: 과제당 {usd(PRICE_PER_TASK_USD)}</Badge>
        </header>
        <p className="max-w-3xl text-sm text-zinc-600">
          과제와 t0 스냅샷을 묶어 RL 데이터 회사에 보낼 형식으로 내려받습니다. 비공개 평가셋은 정답(관측·라벨)을 빼고 보냅니다.
        </p>
        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">오류: {error}</div>}

        <div className="grid gap-5 lg:grid-cols-[22rem_1fr]">
          <div className="flex flex-col gap-5">
            <Card title="묶음 구성">
              <fieldset className="flex flex-col gap-2">
                <legend className={UI.label}>패밀리</legend>
                {FAMILIES.map(f => (
                  <label key={f} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={picked.has(f)} onChange={() => toggle(f)} />
                    {FAMILY_LABEL[f]}
                    <span className={`ml-auto text-zinc-400 ${UI.mono}`}>{all?.tasks.filter(t => t.family === f).length ?? 0}</span>
                  </label>
                ))}
              </fieldset>
              <label className="flex items-center justify-between gap-2 text-sm">
                <span className={UI.label}>패밀리당 과제 수</span>
                <select className={UI.select} value={count} onChange={e => setCount(Number(e.target.value))}>
                  {[1, 2, 3, 5, 10].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-1" checked={holdout} onChange={e => setHoldout(e.target.checked)} />
                <span>
                  비공개 평가셋 (holdout)
                  <span className="block text-xs text-zinc-500">정답 관측·라벨을 빼고 보냄. 채점은 우리 서버에서</span>
                </span>
              </label>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <Stat label="과제 수" value={tasks.length} />
              <Stat label="시장가 추정" value={usd(tasks.length * PRICE_PER_TASK_USD)} hint="가정값" />
            </div>

            <Card title="내려받기">
              <div className="flex flex-col gap-2">
                {FORMATS.map(f => (
                  <button key={f.id} className={`${UI.buttonGhost} justify-between`} disabled={tasks.length === 0} onClick={() => download(f.id)}>
                    <span>{f.label}</span>
                    <span className="text-xs font-normal text-zinc-500">{f.hint}</span>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          <Card title="데이터 카드 미리보기" aside={scores.length > 0 && <Badge tone={TONE.info}>Arena baseline 포함 (저장 응답)</Badge>}>
            {card ? <pre className="max-h-[40rem] overflow-auto whitespace-pre-wrap rounded-lg bg-zinc-50 p-4 text-xs leading-relaxed text-zinc-800">{card}</pre> : <Empty text="패밀리를 하나 이상 고르세요" />}
          </Card>
        </div>
      </div>
    </main>
  )
}
