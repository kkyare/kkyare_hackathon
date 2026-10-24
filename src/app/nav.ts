// 상단 메뉴. 새 화면을 만든 사람이 한 줄씩 추가한다 (PLAN 7절).
export interface NavItem { href: string; label: string }

export const nav: NavItem[] = [
  { href: '/', label: '농장 지도' },
  { href: '/insurance', label: '요율 검증' },
  { href: '/timemachine', label: '하루 재생' },
  { href: '/live', label: '채점 과정' },
  { href: '/arena', label: '모델 비교' },
  { href: '/export', label: '데이터 납품' },
  { href: '/farm', label: '농장 데이터' },
]
