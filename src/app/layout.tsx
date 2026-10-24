import type { Metadata } from 'next'
import { Barlow_Condensed, Public_Sans } from 'next/font/google'
import Link from 'next/link'
import { nav } from './nav'
import './globals.css'

const publicSans = Public_Sans({ subsets: ['latin'], variable: '--font-public-sans', display: 'swap' })
const barlow = Barlow_Condensed({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-barlow', display: 'swap' })

export const metadata: Metadata = {
  title: 'Weather Decision Gym',
  description: '필지 단위 날씨로 작물보험 요율을 검증하고, 같은 검증기로 AI 판단을 채점합니다',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${publicSans.variable} ${barlow.variable}`}>
      <body className="min-h-screen antialiased">
        <header className="border-b-2 border-[var(--ink)]">
          <div className="mx-auto flex max-w-6xl flex-wrap items-baseline gap-x-8 gap-y-2 px-4 pb-3 pt-5">
            <Link href="/" className="figure text-2xl font-bold">Weather Decision Gym</Link>
            <nav className="flex flex-wrap gap-5 text-sm text-[var(--ink-2)]">
              {nav.map((n) => (
                <Link key={n.href} href={n.href} className="hover:text-[var(--ink)] hover:underline underline-offset-4">
                  {n.label}
                </Link>
              ))}
            </nav>
            <span className="ml-auto text-xs text-[var(--ink-2)]">목업 데이터로 시연 중</span>
          </div>
        </header>
        {children}
        <footer className="mx-auto max-w-6xl border-t border-[var(--rule)] px-4 py-6 text-xs text-[var(--ink-2)]">
          필지와 청구는 임의의 아이오와 농장 목업입니다. 판정 기준과 가격은 가정값입니다.
        </footer>
      </body>
    </html>
  )
}
