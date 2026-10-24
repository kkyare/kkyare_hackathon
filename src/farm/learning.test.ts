import { describe, expect, it } from 'vitest'
import { fieldObs, fields, snapshots } from '../insurance/data'
import { learningCurve, rangeNarrowing } from './learning'
import { portfolio, riskScores } from '../insurance/data'

describe('learningCurve', () => {
  const pts = learningCurve(fields, snapshots, fieldObs)
  it('연결 0개부터 전체까지 점이 있다', () => {
    expect(pts[0].connectedFields).toBe(0)
    expect(pts.at(-1)!.connectedFields).toBe(8)
  })
  it('보정 엔진은 원천 격자보다 오차가 작고, 농장을 다 연결하면 더 작아진다', () => {
    expect(pts[0].maeF).toBeLessThan(pts[0].rawGridMaeF)
    expect(pts.at(-1)!.maeF).toBeLessThan(pts[0].maeF)
  })
})

describe('rangeNarrowing', () => {
  it('검증 청구가 늘면 보험수가 range(상대 폭)가 좁아진다', () => {
    const f = portfolio.fields.find((x) => x.id === 'field-ia-03')!
    const pts = rangeNarrowing(f, 'frost', 98, portfolio, riskScores)
    expect(pts.at(-1)!.premiumRelativeWidthPct).toBeLessThan(pts[0].premiumRelativeWidthPct)
  })
})
