const tones = {
  canopy: 'bg-[var(--canopy)] text-white',
  corn: 'bg-[var(--corn)] text-[var(--ink)]',
  loam: 'bg-[var(--loam)] text-white',
  frost: 'bg-[var(--frost)] text-white',
  plain: 'border border-[var(--rule)] text-[var(--ink-2)]',
} as const

export function Badge({ tone = 'plain', children }: { tone?: keyof typeof tones; children: React.ReactNode }) {
  return <span className={`inline-block rounded-sm px-1.5 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>
}
