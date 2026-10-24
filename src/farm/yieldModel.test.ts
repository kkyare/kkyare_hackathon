import { describe, expect, it } from 'vitest'
import yieldsJson from '../../fixtures/farm/yields.json'
import { backtest, predictYield, trainYieldModel, type SeasonYield } from './yieldModel'

const yields = yieldsJson.yields as SeasonYield[]

describe('생산량 예측 모델', () => {
  const steps = backtest(yields, ['2022', '2023', '2024', '2025'])
  it('평년 100% 가정보다 정확하다', () => {
    console.log(JSON.stringify(steps))
    for (const s of steps) expect(s.maePct).toBeLessThan(s.baselineMaePct)
  })
  it('학습 시즌이 늘수록 다음 시즌 예측 오차가 줄어든다', () => {
    expect(steps[1].maePct).toBeLessThanOrEqual(steps[0].maePct)
    expect(steps[2].maePct).toBeLessThan(steps[0].maePct)
  })
  it('서리 밤이 늘면 예상 생산량이 내려가고 범위가 있다', () => {
    const m = trainYieldModel(yields, ['2022', '2023', '2024', '2025'])
    const calm = predictYield(m, 'field-ia-04', { frostNights: 0, heavyRainDays: 1, dryWeeks: 1 })
    const frost = predictYield(m, 'field-ia-04', { frostNights: 3, heavyRainDays: 1, dryWeeks: 1 })
    expect(frost.pct).toBeLessThan(calm.pct)
    expect(calm.range[0]).toBeLessThan(calm.pct)
  })
})
