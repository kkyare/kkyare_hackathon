// 상단 메뉴. 새 화면을 만든 사람이 한 줄씩 추가한다 (PLAN 7절).
export interface NavItem { href: string; label: string }

export const nav: NavItem[] = [
  { href: '/', label: '대시보드' },
  { href: '/insurance', label: '보험사 콘솔' },
  { href: '/timemachine', label: 'Time Machine' },
  { href: '/farm', label: '농장 연결' },
]
