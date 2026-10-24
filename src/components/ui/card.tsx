export function Card({ title, children, className = '' }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4 ${className}`}>
      {title && <h2 className="mb-3 text-sm font-medium text-neutral-300">{title}</h2>}
      {children}
    </section>
  )
}

export function Stat({ label, value, tone }: { label: string; value: string; tone?: 'go' | 'caution' | 'nogo' | 'accent' }) {
  const color = tone ? `text-[var(--${tone})]` : ''
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className={`num mt-1 text-2xl ${color}`}>{value}</p>
    </div>
  )
}
