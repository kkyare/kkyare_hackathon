// 상자를 남발하지 않는다: 구획은 위쪽 굵은 선과 제목으로만 나눈다
export function Section({ title, note, children, className = '' }: { title?: string; note?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`border-t border-[var(--ink)] pt-3 ${className}`}>
      {title && (
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold">{title}</h2>
          {note && <p className="text-xs text-[var(--ink-2)]">{note}</p>}
        </div>
      )}
      {children}
    </section>
  )
}

export function Figure({ label, value, tone, size = 'md' }: { label: string; value: string; tone?: 'canopy' | 'corn' | 'loam' | 'frost'; size?: 'md' | 'lg' }) {
  return (
    <div>
      <p className={`figure font-semibold leading-none ${size === 'lg' ? 'text-5xl' : 'text-3xl'}`} style={tone ? { color: `var(--${tone})` } : undefined}>
        {value}
      </p>
      <p className="mt-1 text-xs text-[var(--ink-2)]">{label}</p>
    </div>
  )
}
