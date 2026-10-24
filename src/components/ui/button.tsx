export function Button({ children, active, variant = 'line', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean; variant?: 'line' | 'solid' }) {
  const base = 'rounded-sm px-3 py-1.5 text-sm font-medium disabled:opacity-50'
  const look =
    variant === 'solid'
      ? 'bg-[var(--ink)] text-[var(--paper-2)] hover:bg-[var(--ink-2)]'
      : active
        ? 'border border-[var(--ink)] bg-[var(--ink)] text-[var(--paper-2)]'
        : 'border border-[var(--rule)] hover:border-[var(--ink)]'
  return <button {...props} className={`${base} ${look} ${props.className ?? ''}`}>{children}</button>
}
