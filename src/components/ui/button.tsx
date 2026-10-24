export function Button({ children, active, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      {...props}
      className={`rounded-md border px-3 py-1.5 text-sm transition disabled:opacity-50 ${
        active ? 'border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--text)]' : 'border-[var(--line)] hover:border-neutral-500'
      } ${props.className ?? ''}`}
    />
  )
}
