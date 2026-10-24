// 유진 담당 API 라우트가 types.ts 모양대로 응답하는지 확인
import { describe, expect, it } from 'vitest'
import * as dsGenerate from '../app/api/families/downscaling/generate/route'
import * as dsScore from '../app/api/families/downscaling/score/route'
import * as dcGenerate from '../app/api/families/decision/generate/route'
import * as dcScore from '../app/api/families/decision/score/route'
import * as verify from '../app/api/insurance/verify/route'
import * as risk from '../app/api/insurance/risk/route'
import * as claimsRoute from '../app/api/insurance/claims/route'
import * as lossCurveRoute from '../app/api/insurance/loss-curve/route'
import * as rateRoute from '../app/api/insurance/rate-range/route'
import * as learning from '../app/api/farm/learning-curve/route'

const post = (body: unknown) => new Request('http://local/api', { method: 'POST', body: JSON.stringify(body) })

describe('families API', () => {
  for (const [name, gen, sc] of [['downscaling', dsGenerate, dsScore], ['decision', dcGenerate, dcScore]] as const) {
    it(`${name}: generate → score(엔진 답)`, async () => {
      const tasks = await (await gen.POST(post({ count: 3 }))).json()
      expect(tasks).toHaveLength(3)
      const res = await sc.POST(post({ task: tasks[0] }))
      expect(res.status).toBe(200)
      const { score } = await res.json()
      expect(score.family).toBe(name)
      expect(typeof score.skill).toBe('number')
    })
  }
  it('잘못된 답은 400', async () => {
    const [task] = await (await dcGenerate.POST(post({ count: 1 }))).json()
    const res = await dcScore.POST(post({ task, answer: { taskId: task.id, model: 'x', probability: 2, decision: 'maybe', rationale: '', toolCalls: [] } }))
    expect(res.status).toBe(400)
  })
})

describe('insurance API', () => {
  it('claimId로 검증', async () => {
    const r = await (await verify.POST(post({ claimId: 'claim-0001' }))).json()
    expect(r.verdict).toBe('within_range')
  })
  it('리스크 점수 전체 필지', async () => {
    const r = await (await risk.GET(new Request('http://local/api/insurance/risk?peril=frost'))).json()
    expect(r).toHaveLength(48)
  })
  it('청구 목록', async () => {
    const r = await (await claimsRoute.GET()).json()
    expect(r.claims.length).toBeGreaterThan(0)
  })
  it('손해율 곡선', async () => {
    const r = await (await lossCurveRoute.GET(new Request('http://local/api/insurance/loss-curve?peril=excess_rain'))).json()
    expect(r.bins).toHaveLength(5)
  })
  it('요율 range 단일·전체', async () => {
    const one = await (await rateRoute.GET(new Request('http://local/api/insurance/rate-range?fieldId=field-ia-03&peril=frost'))).json()
    expect(one.premiumUsdAc).toHaveLength(2)
    const all = await (await rateRoute.GET(new Request('http://local/api/insurance/rate-range?peril=drought'))).json()
    expect(all).toHaveLength(48)
  })
  it('농장 연결 곡선', async () => {
    const r = await (await learning.GET(new Request('http://local/api/farm/learning-curve'))).json()
    expect(r.points.length).toBeGreaterThan(1)
    expect(r.ranges.length).toBeGreaterThan(1)
  })
})
