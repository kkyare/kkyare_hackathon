const tones = {
  go: 'border-green-500/50 text-green-400',
  caution: 'border-yellow-500/50 text-yellow-400',
  nogo: 'border-red-500/50 text-red-400',
  live: 'border-sky-500/50 text-sky-400',
  muted: 'border-neutral-700 text-neutral-400',
} as const

export function Badge({ tone = 'muted', children }: { tone?: keyof typeof tones; children: React.ReactNode }) {
  return <span className={`inline-block rounded border px-2 py-0.5 text-xs ${tones[tone]}`}>{children}</span>
}
