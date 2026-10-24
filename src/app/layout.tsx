import type { Metadata } from 'next'
import Link from 'next/link'
import { nav } from './nav'
import './globals.css'

export const metadata: Metadata = {
  title: 'Weather Decision Gym',
  description: '실제 날씨로 맞았는지를 판정하는 엔진 - 작물보험 요율 range와 RL 평가 과제',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen antialiased">
        <header className="sticky top-0 z-10 border-b border-[var(--line)] bg-[var(--bg)]/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
            <Link href="/" className="font-semibold tracking-tight">
              ◉ Weather Decision Gym
            </Link>
            <nav className="flex flex-wrap gap-4 text-sm text-[var(--muted)]">
              {nav.map((n) => (
                <Link key={n.href} href={n.href} className="hover:text-[var(--text)]">
                  {n.label}
                </Link>
              ))}
            </nav>
            <span className="ml-auto rounded border border-amber-500/50 px-2 py-0.5 text-xs text-amber-400">DEMO DATA</span>
          </div>
        </header>
        {children}
        <footer className="mx-auto max-w-6xl px-4 py-8 text-xs text-[var(--muted)]">
          모든 수치는 임의의 아이오와 농장 목업 데이터입니다. 판정 기준·가격은 가정값입니다.
        </footer>
      </body>
    </html>
  )
}
