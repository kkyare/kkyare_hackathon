import { describe, expect, it } from 'vitest'
import { farmBrief, templateBriefing } from './brief'
import { keywordSearch } from './ai'
import { candidates, farmData } from './data'

describe('농장 브리핑', () => {
  it('골짜기 필지: 생산량 예측, 서리 밤 예측, 학습 기록이 모두 있다', () => {
    const b = farmBrief('field-ia-04', farmData)!
    expect(b.yield.pct).toBeGreaterThan(50)
    expect(b.yield.range[0]).toBeLessThan(b.yield.range[1])
    expect(b.frostNight?.pFrost).toBeGreaterThan(b.frostNight!.gridPFrost)
    expect(b.learning.length).toBe(3)
    expect(templateBriefing(b)).toContain('예상 생산량')
  })
  it('예보 자료가 없는 필지도 생산량은 예측한다', () => {
    const b = farmBrief('field-ia-30', farmData)!
    expect(b.frostNight).toBeNull()
    expect(Number.isFinite(b.yield.pct)).toBe(true)
  })
  it('없는 필지는 null', () => expect(farmBrief('nope', farmData)).toBeNull())
})

describe('농장 찾기 (키워드)', () => {
  it('골짜기 콩밭', () => {
    const ids = keywordSearch('서리 위험 큰 골짜기 콩밭', candidates())
    expect(ids.length).toBeGreaterThan(0)
    const f = farmData.fields.find((x) => x.id === ids[0])!
    expect(f.terrain).toBe('valley')
  })
  it('이름으로 찾기', () => expect(keywordSearch('Johnson West 280 보여줘', candidates())).toEqual(['field-ia-04']))
})
