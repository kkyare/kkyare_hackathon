import { describe, expect, it } from 'vitest'
import { claims, climatology, fields, snapshots, station, verifyContext, observationFor, snapshotById } from './data'
import { riskScore, verifyClaim } from './verify'
import * as downscaling from '../families/downscaling'
import * as decision from '../families/decision'

const claim = (id: string) => claims.find((c) => c.id === id)!

describe('verifyClaim (목업 시나리오)', () => {
  it('골짜기 과수원 5/12 서리 청구는 supported', () => {
    const r = verifyClaim(claim('claim-0001'), verifyContext)
    expect(r.verdict).toBe('supported')
    expect(r.evidence.forecastAtT0?.length).toBe(3)
  })
  it('같은 날 능선 필지 서리 청구는 supported가 아니다', () => {
    const r = verifyClaim(claim('claim-0002'), verifyContext)
    expect(r.verdict).not.toBe('supported')
  })
  it('6/18 폭우 청구는 supported (관측 2.6 inch)', () => {
    const r = verifyClaim(claim('claim-0003'), verifyContext)
    expect(r.verdict).toBe('supported')
    expect(r.evidence.nearbyObs.value).toBeCloseTo(2.6, 1)
  })
  it('따뜻했던 5/20 서리 청구는 not_supported', () => {
    expect(verifyClaim(claim('claim-0004'), verifyContext).verdict).toBe('not_supported')
  })
  it('우박은 근거가 없어 unclear', () => {
    expect(verifyClaim(claim('claim-0005'), verifyContext).verdict).toBe('unclear')
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
