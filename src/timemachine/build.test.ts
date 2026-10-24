import { describe, expect, it } from 'vitest'
import { fieldObs, fields, snapshots } from '../insurance/data'
import { buildReplay } from './build'

describe('buildReplay', () => {
  const frost = buildReplay('frost-0512', fields, snapshots, fieldObs)
  it('필지 8개, 시간 25개', () => {
    expect(frost.fields).toHaveLength(8)
    expect(frost.fields[0].hours).toHaveLength(25)
  })
  it('서리 밤: 원천 예보는 서리를 놓치고, 골짜기 필지는 실제로 서리', () => {
    const valley = frost.fields.find((f) => f.field.id === 'field-ia-04')!
    expect(valley.rawFrost).toBe(false)
    expect(valley.observedFrost).toBe(true)
  })
  it('서리가 온 필지는 모두 엔진이 방제를 권고했다', () => {
    for (const f of frost.fields.filter((x) => x.observedFrost)) expect(f.protect).toBe(true)
  })
  it('엔진의 손해(regret)와 Brier가 원천 예보보다 작다', () => {
    const sum = (k: 'regretUsdAc' | 'rawRegretUsdAc' | 'brier' | 'rawBrier') => frost.fields.reduce((s, f) => s + f[k], 0)
    expect(sum('regretUsdAc')).toBeLessThan(sum('rawRegretUsdAc'))
    expect(sum('brier')).toBeLessThan(sum('rawBrier'))
  })
})
