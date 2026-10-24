import { describe, expect, it } from 'vitest'
import { leakFlagsOf, makeTools } from './tools'
import { snapshot, T0, task } from './__fixtures__/mini'

const t0 = Date.parse(T0)
type Hourly = { hourly: { time: string }[] }

describe('tools: 누출 방지', () => {
  it('t0 이후 발표된 예보 런은 목록에 없다', () => {
    const tb = makeTools(task, snapshot)
    const { models } = tb.call('list_forecast_models', {}) as { models: { model: string; issuedAt: string }[] }
    expect(models.length).toBe(3)
    for (const m of models) expect(Date.parse(m.issuedAt)).toBeLessThanOrEqual(t0)
    expect(models.map(m => m.model)).not.toContain('nbm')
    expect(tb.snapshotIssues.length).toBeGreaterThan(0)
  })

  it('같은 모델이면 t0 이전 런 중 가장 최근 런을 준다', () => {
    const tb = makeTools(task, snapshot)
    const r = tb.call('get_forecast', { model: 'hrrr' }) as { issuedAt: string }
    expect(r.issuedAt).toBe('2026-05-11T18:00:00Z')
  })

  it('t0 이후 런만 있는 모델을 요청하면 오류 + 누출 시도로 기록', () => {
    const tb = makeTools(task, snapshot)
    const r = tb.call('get_forecast', { model: 'nbm' }) as { error?: string }
    expect(r.error).toBeDefined()
    expect(leakFlagsOf(tb)).toEqual(['tool:forecast_after_t0'])
  })

  it('없는 모델은 오류지만 누출 시도는 아니다', () => {
    const tb = makeTools(task, snapshot)
    expect((tb.call('get_forecast', { model: 'gfs' }) as { error?: string }).error).toBeDefined()
    expect(tb.leakAttempts).toEqual([])
  })

  it('관측은 어떤 인자로도 t0 이후가 나오지 않는다', () => {
    const argsList: unknown[] = [
      {}, undefined, null, 'garbage',
      { from: '2026-05-01T00:00:00Z', to: '2026-06-01T00:00:00Z' },
      { from: T0 }, { to: T0 }, { from: '2026-05-12T03:00:00Z', to: '2026-05-12T05:00:00Z' },
      { from: 'not-a-date', to: 'also-bad' }, { to: '2099-01-01T00:00:00Z' },
    ]
    for (const args of argsList) {
      const tb = makeTools(task, snapshot)
      const { hourly } = tb.call('get_observations', args) as Hourly
      for (const p of hourly) expect(Date.parse(p.time)).toBeLessThan(t0)
    }
  })

  it('t0 이후 관측을 요청하면 잘리고 누출 시도로 기록', () => {
    const tb = makeTools(task, snapshot)
    const r = tb.call('get_observations', { from: '2026-05-11T20:00:00Z', to: '2026-05-12T05:00:00Z' }) as Hourly & { note?: string }
    expect(r.hourly.map(p => p.time).at(-1)).toBe('2026-05-11T23:00:00.000Z')
    expect(r.note).toBeDefined()
    expect(leakFlagsOf(tb)).toEqual(['tool:obs_after_t0'])
  })

  it('기본 관측 구간은 t0 직전 24시간', () => {
    const tb = makeTools(task, snapshot)
    const { hourly } = tb.call('get_observations', {}) as Hourly
    expect(hourly.length).toBe(24)
    expect(tb.leakAttempts).toEqual([])
  })

  it('예보 응답에 t0 이후 발표 런의 값이 섞이지 않는다', () => {
    const tb = makeTools(task, snapshot)
    for (const model of ['hrrr', 'ecmwf_ifs']) {
      const r = tb.call('get_forecast', { model, from: '2026-05-01T00:00:00Z', to: '2026-06-01T00:00:00Z' }) as Hourly & { issuedAt: string }
      expect(Date.parse(r.issuedAt)).toBeLessThanOrEqual(t0)
    }
  })

  it('모든 호출은 toolCalls에 기록된다', () => {
    const tb = makeTools(task, snapshot)
    tb.call('get_field_info', {})
    tb.call('nope', {})
    expect(tb.calls.map(c => c.name)).toEqual(['get_field_info', 'nope'])
    expect(tb.call('nope', {})).toEqual({ error: "unknown tool 'nope'" })
  })
})
