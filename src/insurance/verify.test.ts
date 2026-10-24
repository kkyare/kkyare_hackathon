import { describe, expect, it } from 'vitest'
import { claims, climatology, fields, snapshots, station, verifyContext, observationFor, snapshotById, curveFor, rateFor, portfolio, riskScores } from './data'
import { lossCurve, rateRange } from './rates'
import { riskScore, verifyClaim } from './verify'
import * as downscaling from '../families/downscaling'
import * as decision from '../families/decision'

const claim = (id: string) => claims.find((c) => c.id === id)!

describe('verifyClaim (목업 시나리오)', () => {
  it('골짜기 과수원 5/12 서리 청구: 조건 있음 + 청구액이 range 안 → within_range', () => {
    const r = verifyClaim(claim('claim-0001'), verifyContext)
    expect(r.verdict).toBe('within_range')
    expect(r.evidence.forecastAtT0?.length).toBe(3)
    expect(r.indemnityRange[0]).toBeLessThan(r.indemnityRange[1])
  })
  it('같은 날 능선 필지 서리 청구: 조건이 없었음 → outside_range', () => {
    expect(verifyClaim(claim('claim-0002'), verifyContext).verdict).toBe('outside_range')
  })
  it('6/18 폭우 청구(관측 2.6 inch, 청구액 range 안) → within_range', () => {
    const r = verifyClaim(claim('claim-0003'), verifyContext)
    expect(r.verdict).toBe('within_range')
    expect(r.evidence.nearbyObs.value).toBeCloseTo(2.6, 1)
  })
  it('따뜻했던 5/20 서리 청구 → outside_range', () => {
    expect(verifyClaim(claim('claim-0004'), verifyContext).verdict).toBe('outside_range')
  })
  it('폭우는 있었지만 청구액이 range보다 크면 outside_range (과다 청구)', () => {
    const r = verifyClaim(claim('claim-0005'), verifyContext)
    expect(r.conditionProbability).toBeGreaterThan(0.7)
    expect(r.verdict).toBe('outside_range')
  })
  it('필지 센서가 없으면 관측소 보정 추정으로 판단하고 시그마가 커진다', () => {
    const r = verifyClaim(claim('claim-0001'), { ...verifyContext, fieldObs: [] })
    expect(r.evidence.fieldEstimate.sigma).toBe(2)
  })
})

describe('riskScore', () => {
  it('골짜기 과수원이 능선 옥수수보다 서리 위험이 높다', () => {
    const valley = fields.find((f) => f.id === 'field-ia-03')!
    const ridge = fields.find((f) => f.id === 'field-ia-06')!
    const c = (id: string) => climatology.find((x) => x.fieldId === id)
    expect(riskScore(valley, 'frost', station.elevationM, c(valley.id)).score)
      .toBeGreaterThan(riskScore(ridge, 'frost', station.elevationM, c(ridge.id)).score)
  })
})

describe('패밀리 generate → engineAnswer → score', () => {
  for (const [name, fam] of [['downscaling', downscaling], ['decision', decision]] as const) {
    it(`${name}: 과제 16개, 모든 과제 채점 가능`, () => {
      const tasks = fam.generate({ fields, snapshots })
      expect(tasks.length).toBe(16)
      for (const t of tasks) {
        const snap = snapshotById(t.snapshotId)!
        const obs = observationFor(t.field.id, t.t0)!
        const ans = fam.engineAnswer(t, snap)
        expect(fam.answerSchema.safeParse(ans).success).toBe(true)
        const s = fam.score(t, ans, obs, snap)
        expect(Number.isFinite(s.skill)).toBe(true)
      }
    })
  }
  it('서리 밤 골짜기 필지: 엔진은 방제, 원천 예보 기준보다 Brier가 좋다(스킬 > 0)', () => {
    const t = decision.generate({ fields, snapshots }).find((x) => x.field.id === 'field-ia-05' && x.t0.startsWith('2026-05-11'))!
    const snap = snapshotById(t.snapshotId)!
    const ans = decision.engineAnswer(t, snap)
    expect(ans.decision).toBe('protect')
    const s = decision.score(t, ans, observationFor(t.field.id, t.t0)!, snap)
    expect(s.regretUsd).toBe(0)
    expect(s.skill).toBeGreaterThan(0)
  })
  it('예보를 그대로 따른 답은 regret이 크다 (서리를 놓침)', () => {
    const t = decision.generate({ fields, snapshots }).find((x) => x.field.id === 'field-ia-05' && x.t0.startsWith('2026-05-11'))!
    const snap = snapshotById(t.snapshotId)!
    const naive = { taskId: t.id, model: 'naive', probability: 0.05, decision: 'none', rationale: '', toolCalls: [] }
    const s = decision.score(t, naive, observationFor(t.field.id, t.t0)!, snap)
    expect(s.regretUsd).toBe(1080)
  })
})

describe('요율 range (PLAN 11절)', () => {
  it('위험점수가 높은 구간일수록 실제 손해율이 높다 (서리, 표본 있는 구간)', () => {
    const bins = curveFor('frost').bins.filter((b) => b.n > 0)
    expect(bins.at(-1)!.lossRatio).toBeGreaterThan(bins[0].lossRatio)
  })
  it('위험이 높은 필지가 보험수가 range도 높다', () => {
    expect(rateFor('field-ia-03', 'frost')!.premiumUsdAc[0]).toBeGreaterThan(rateFor('field-ia-06', 'frost')!.premiumUsdAc[1])
  })
  it('손해가 없던 필지는 갱신 요율이 내려간다', () => {
    expect(rateFor('field-ia-06', 'frost')!.renewalRateChangePct[1]).toBeLessThanOrEqual(0)
  })
  it('표본이 적으면 range가 넓어진다', () => {
    const f = portfolio.fields.find((x) => x.id === 'field-ia-03')!
    const full = rateRange(f, 'frost', 98, portfolio, riskScores)
    const thin = rateRange(f, 'frost', 98, { ...portfolio, history: portfolio.history.filter((c) => c.peril !== 'frost').concat(portfolio.history.filter((c) => c.peril === 'frost').slice(0, 3)), seasons: 1 }, riskScores)
    expect(thin.renewalRateChangePct[1] - thin.renewalRateChangePct[0]).toBeGreaterThanOrEqual(full.renewalRateChangePct[1] - full.renewalRateChangePct[0])
  })
  it('lossCurve는 구간 5개', () => {
    expect(lossCurve('drought', portfolio, riskScores).bins).toHaveLength(5)
  })
})
