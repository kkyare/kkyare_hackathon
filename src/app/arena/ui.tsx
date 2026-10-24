// Arena·납품 화면 공용 조각. 성호님 live 화면과 같은 zinc 톤
// TODO(shadcn): components/ui 가 생기면 Card·Badge·Button·Table로 교체
import type { ReactNode } from 'react'

export const UI = {
  card: 'flex min-w-0 flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm',
  badge: 'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
  label: 'text-xs font-medium tracking-wide text-zinc-500',
  mono: 'font-mono tabular-nums',
  button:
    'inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40',
  buttonGhost:
    'inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40',
  select: 'rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm',
  th: 'py-1.5 pr-3 text-left text-xs font-medium tracking-wide text-zinc-500 whitespace-nowrap',
  td: 'py-1.5 pr-3 whitespace-nowrap',
}

export const TONE = {
  neutral: 'bg-zinc-100 text-zinc-700 ring-zinc-200',
  demo: 'bg-amber-50 text-amber-800 ring-amber-200',
  live: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  info: 'bg-sky-50 text-sky-700 ring-sky-200',
  bad: 'bg-red-50 text-red-700 ring-red-200',
  good: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
}

export function Badge({ tone, children, title }: { tone: string; children: ReactNode; title?: string }) {
  return (
    <span className={`${UI.badge} ${tone}`} title={title}>
      {children}
    </span>
  )
}

export function Card({ title, aside, className = '', children }: { title: ReactNode; aside?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section className={`${UI.card} ${className}`}>
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold">{title}</h2>
        {aside}
      </header>
      {children}
    </section>
  )
}

export function Stat({ label, value, hint, tone = 'text-zinc-900' }: { label: string; value: ReactNode; hint?: ReactNode; tone?: string }) {
  return (
    <div className="rounded-lg bg-zinc-50 p-3">
      <div className={UI.label}>{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${UI.mono} ${tone}`}>{value}</div>
      {hint && <div className="mt-0.5 text-xs text-zinc-500">{hint}</div>}
    </div>
  )
}

export function Empty({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-zinc-200 p-4 text-sm text-zinc-400">{text}</div>
}

// 모델 이름 앞의 색 점. 색만으로 구분하지 않게 이름과 항상 같이 쓴다
export function ModelDot({ color }: { color: string }) {
  return <span aria-hidden className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
}
