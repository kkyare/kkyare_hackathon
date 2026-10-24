import { describe, expect, it } from 'vitest'
import {
  brier, brierMulti, crpsEnsemble, crpsFromQuantiles, crpsPoint,
  normalCdf, optimalProtect, regret, reward, skillScore,
} from './scoring'

describe('brier', () => {
  it('완벽한 예측은 0, 완전히 틀리면 1', () => {
    expect(brier(1, true)).toBe(0)
    expect(brier(0, false)).toBe(0)
    expect(brier(0, true)).toBe(1)
  })
  it('0.7로 예측했는데 발생하면 0.09', () => {
    expect(brier(0.7, true)).toBeCloseTo(0.09)
  })
  it('확률은 0-1로 자른다', () => {
    expect(brier(1.4, true)).toBe(0)
  })
})

describe('brierMulti', () => {
  it('3분위 정답에 1을 주면 0', () => {
    expect(brierMulti([0, 0, 1], 2)).toBe(0)
  })
  it('균등 예측은 2/3', () => {
    expect(brierMulti([1 / 3, 1 / 3, 1 / 3], 0)).toBeCloseTo(2 / 3)
  })
})

describe('crps', () => {
  it('결정값은 절대 오차', () => {
    expect(crpsPoint(30, 33)).toBe(3)
  })
  it('앙상블 멤버가 모두 같으면 절대 오차와 같다', () => {
    expect(crpsEnsemble([30, 30, 30], 33)).toBeCloseTo(3)
  })
  it('관측이 분포 가운데면 분포가 좁을수록 작다', () => {
    const narrow = crpsFromQuantiles([{ q: 0.1, value: 31 }, { q: 0.5, value: 32 }, { q: 0.9, value: 33 }], 32)
    const wide = crpsFromQuantiles([{ q: 0.1, value: 26 }, { q: 0.5, value: 32 }, { q: 0.9, value: 38 }], 32)
    expect(narrow).toBeLessThan(wide)
  })
})

describe('비용-손실', () => {
  const C = 120
  const L = 1200
  it('C/L=0.10 경계: 0.10은 보호 안 함, 0.11은 보호', () => {
    expect(optimalProtect(0.1, C, L)).toBe(false)
    expect(optimalProtect(0.11, C, L)).toBe(true)
  })
  it('서리가 났는데 보호 안 하면 regret = L - C', () => {
    expect(regret(false, true, C, L)).toEqual({ costUsd: 1200, oracleCostUsd: 120, regretUsd: 1080 })
  })
  it('서리가 없었는데 보호하면 regret = C', () => {
    expect(regret(true, false, C, L).regretUsd).toBe(120)
  })
  it('맞는 결정은 regret 0', () => {
    expect(regret(true, true, C, L).regretUsd).toBe(0)
    expect(regret(false, false, C, L).regretUsd).toBe(0)
  })
  it('보상은 regret과 Brier가 작을수록 크다', () => {
    expect(reward(0, L, 0.01)).toBeGreaterThan(reward(1080, L, 0.5))
  })
})

describe('skillScore', () => {
  it('기준 예보를 그대로 따르면 0', () => {
    expect(skillScore(3, 3)).toBe(0)
  })
  it('오차를 절반으로 줄이면 0.5', () => {
    expect(skillScore(1.5, 3)).toBeCloseTo(0.5)
  })
  it('기준보다 나쁘면 음수, 아래쪽은 -1로 자른다', () => {
    expect(skillScore(4.5, 3)).toBeCloseTo(-0.5)
    expect(skillScore(30, 3)).toBe(-1)
  })
})

describe('normalCdf', () => {
  it('평균에서 0.5', () => {
    expect(normalCdf(32, 32, 2)).toBeCloseTo(0.5, 5)
  })
  it('평균보다 1 시그마 아래는 약 0.159', () => {
    expect(normalCdf(30, 32, 2)).toBeCloseTo(0.1587, 3)
  })
})
