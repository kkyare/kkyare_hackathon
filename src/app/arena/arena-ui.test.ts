// 화면 렌더링은 build·실제 화면으로 확인한다 (팀 vitest 설정에 @/ 별칭이 없어 페이지를 불러오지 않는다)
import { describe, expect, it } from 'vitest'
import { handleArenaTasks, handleAudit } from '../../arena/api'
import { loadSavedRuns } from '../../arena/data'
import { answerSummary, isBlockedAttempt, leakLabel, modelColor, modelLabel, scoreSummary } from './format'

describe('표시 함수', () => {
  it('패밀리별 답 요약', () => {
    expect(answerSummary({ probability: 0.25, decision: 'spray' })).toBe('P = 0.25  → spray')
    expect(answerSummary({ terciles: [0.2, 0.3, 0.5], decision: 'wait' })).toBe('낮음 0.20 · 보통 0.30 · 높음 0.50  → wait')
    expect(answerSummary({ quantiles: [{ q: 0.9, value: 34 }, { q: 0.1, value: 29.5 }, { q: 0.5, value: 31.2 }] })).toBe('q10 29.5 · q50 31.2 · q90 34.0 °F')
    expect(answerSummary({})).toBe('—')
  })

  it('점수 요약은 있는 지표만', () => {
    expect(scoreSummary({ taskId: 't', model: 'm', family: 'decision', brier: 0.04, regretUsd: 120, skill: -1, leakFlags: [] }))
      .toBe('Brier 0.040 · regret $120/acre · skill -1.00')
    expect(scoreSummary({ taskId: 't', model: 'm', family: 'downscaling', crps: 0.72, skill: 0.15, leakFlags: [] })).toBe('CRPS 0.72 · skill +0.15')
    expect(scoreSummary({ taskId: 't', model: 'm', family: 'decision', brier: 0.16, skill: -63, leakFlags: [] })).toBe('Brier 0.160 · skill -1.00 (원값 -63.00)')
  })

  it('모델 색은 모델에 고정, 누출 라벨은 차단된 요청과 실제 적발을 구분', () => {
    expect(modelLabel('claude-opus-5-5')).toBe('Opus')
    expect(new Set(['claude-haiku-5-5', 'claude-sonnet-5-5', 'claude-opus-5-5'].map(modelColor)).size).toBe(3)
    expect(isBlockedAttempt('tool:obs_after_t0')).toBe(true)
    expect(isBlockedAttempt('audit:future_knowledge')).toBe(false)
    expect(leakLabel('tool:obs_after_t0')).toContain('잘려서')
  })
})

describe('GET /api/arena/tasks, POST /api/arena/audit', () => {
  it('저장 응답이 있는 개수면 재생 가능', () => {
    const saved = loadSavedRuns()
    const two = handleArenaTasks({ count: 2, saved, hasKey: false })
    expect(two.tasks.map(t => t.family)).toEqual(['nowcasting', 'nowcasting', 'downscaling', 'downscaling', 'decision', 'decision', 's2s', 's2s'])
    expect(two).toMatchObject({ replayable: true, liveAvailable: false })
    expect(handleArenaTasks({ count: 3, saved, hasKey: true })).toMatchObject({ replayable: false, liveAvailable: true })
  })

  it('mock 감사는 도구 기록만, Claude 호출 없음', async () => {
    const saved = loadSavedRuns()
    const { tasks } = handleArenaTasks({ count: 2, saved, hasKey: false })
    const r = await handleAudit({ tasks, runs: saved }, { mock: true })
    expect(r.rationaleChecked).toBe(false)
    expect(r.findings.every(f => f.source === 'tool')).toBe(true)
    // 실제 기록: S2S에서 t0를 넘은 관측 요청 3건 (잘려서 반환)
    expect(r.findings).toHaveLength(3)
    expect(r.summary.map(s => s.model).sort()).toEqual(['claude-haiku-5-5', 'claude-opus-5-5', 'claude-sonnet-5-5'])
  })
})
