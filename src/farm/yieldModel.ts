// 농장별 생산량 예측 (평년 기대 대비 %).
// 그 필지의 시즌 기상 지표(서리 밤, 폭우일, 건조 주)로 회귀식을 맞추고, 실제 수확 기록으로 필지 보정값을 추정한다.
// 시즌이 끝나 실제 수확량이 들어오면 다시 학습한다: 학습 시즌이 늘수록 필지 보정값이 정확해진다.

export interface SeasonWeather { frostNights: number; heavyRainDays: number; dryWeeks: number }
export interface SeasonYield { fieldId: string; season: string; weather: SeasonWeather; expectedYieldBuAc: number; actualYieldBuAc: number; pctOfExpected: number }

export interface YieldModel {
  seasons: string[]
  coef: { intercept: number; frostNights: number; heavyRainDays: number; dryWeeks: number }
  fieldAdj: Record<string, number>
  fieldSeasons: Record<string, number>
  residualSd: number
}

const SHRINK = 0.5 // 필지 보정값을 0 쪽으로 당기는 정도: 기록이 적을수록 크게 당긴다
const features = (w: SeasonWeather) => [1, w.frostNights, w.heavyRainDays, w.dryWeeks]

/** 최소제곱: X'X b = X'y (가우스 소거) */
function leastSquares(X: number[][], y: number[]): number[] {
  const k = X[0].length
  const A = Array.from({ length: k }, (_, i) => Array.from({ length: k }, (_, j) => X.reduce((s, r) => s + r[i] * r[j], 0) + (i === j ? 1e-6 : 0)))
  const b = Array.from({ length: k }, (_, i) => X.reduce((s, r, n) => s + r[i] * y[n], 0))
  for (let c = 0; c < k; c++) {
    let p = c
    for (let r = c + 1; r < k; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r
    ;[A[c], A[p]] = [A[p], A[c]]
    ;[b[c], b[p]] = [b[p], b[c]]
    for (let r = 0; r < k; r++) {
      if (r === c) continue
      const f = A[r][c] / A[c][c]
      for (let j = c; j < k; j++) A[r][j] -= f * A[c][j]
      b[r] -= f * b[c]
    }
  }
  return b.map((v, i) => v / A[i][i])
}

export function trainYieldModel(yields: SeasonYield[], seasons: string[]): YieldModel {
  const rows = yields.filter((y) => seasons.includes(y.season))
  const [intercept, frostNights, heavyRainDays, dryWeeks] = leastSquares(rows.map((r) => features(r.weather)), rows.map((r) => r.pctOfExpected))
  const coef = { intercept, frostNights, heavyRainDays, dryWeeks }
  const base = (w: SeasonWeather) => intercept + frostNights * w.frostNights + heavyRainDays * w.heavyRainDays + dryWeeks * w.dryWeeks

  const resid = new Map<string, number[]>()
  for (const r of rows) resid.set(r.fieldId, [...(resid.get(r.fieldId) ?? []), r.pctOfExpected - base(r.weather)])
  const fieldAdj: Record<string, number> = {}
  const fieldSeasons: Record<string, number> = {}
  for (const [id, rs] of resid) {
    fieldAdj[id] = rs.reduce((a, c) => a + c, 0) / (rs.length + SHRINK)
    fieldSeasons[id] = rs.length
  }
  const after = rows.map((r) => r.pctOfExpected - base(r.weather) - (fieldAdj[r.fieldId] ?? 0))
  const residualSd = Math.sqrt(after.reduce((s, v) => s + v * v, 0) / Math.max(1, after.length - 4))
  return { seasons, coef, fieldAdj, fieldSeasons, residualSd }
}

export function predictYield(model: YieldModel, fieldId: string, weather: SeasonWeather) {
  const c = model.coef
  const weatherEffect = {
    frost: round1(c.frostNights * weather.frostNights),
    rain: round1(c.heavyRainDays * weather.heavyRainDays),
    dry: round1(c.dryWeeks * weather.dryWeeks),
  }
  const adj = model.fieldAdj[fieldId] ?? 0
  const pct = c.intercept + weatherEffect.frost + weatherEffect.rain + weatherEffect.dry + adj
  // 이 필지의 수확 기록이 적을수록 범위가 넓다
  const n = model.fieldSeasons[fieldId] ?? 0
  const half = 1.645 * Math.sqrt(model.residualSd ** 2 + 16 / (n + SHRINK + 1))
  return {
    pct: round1(pct),
    range: [round1(pct - half), round1(pct + half)] as [number, number],
    parts: { normal: round1(c.intercept), weatherEffect, fieldAdj: round1(adj) },
    trainedOn: model.seasons,
    fieldSeasons: n,
  }
}

/**
 * 재귀 학습 검증: 맞힐 시즌(마지막 시즌)을 고정하고, 그 직전 시즌을 1개, 2개, 3개… 쌓아 학습해 본다.
 * 같은 시즌을 맞히므로 학습 데이터 양의 효과만 비교된다. 기준선은 '평년 100%' 가정.
 */
export function backtest(yields: SeasonYield[], seasons: string[]) {
  const target = seasons[seasons.length - 1]
  const prior = seasons.slice(0, -1)
  const rows = yields.filter((y) => y.season === target)
  const baselineMaePct = round1(mean(rows.map((r) => Math.abs(100 - r.pctOfExpected))))
  return prior.map((_, i) => {
    const trainedOn = prior.slice(prior.length - 1 - i)
    const model = trainYieldModel(yields, trainedOn)
    return {
      trainedOn,
      predicted: target,
      maePct: round1(mean(rows.map((r) => Math.abs(predictYield(model, r.fieldId, r.weather).pct - r.pctOfExpected)))),
      baselineMaePct,
    }
  })
}

/** 시즌 진행 중: 지금까지 관측된 지표 + 남은 기간의 평년 기대치 */
export function seasonOutlook(soFar: SeasonWeather, climatology: { frostNightsMay10y: number; heavyRainDaysJun10y: number; dryWeeksJul10y: number }, remaining = 0.6): SeasonWeather {
  return {
    frostNights: round1(soFar.frostNights + (climatology.frostNightsMay10y / 10) * 0.5 * remaining * 0.2), // 서리는 봄에 몰려 6월 이후 기대치가 작다
    heavyRainDays: round1(soFar.heavyRainDays + (climatology.heavyRainDaysJun10y / 10) * 1.5 * remaining),
    dryWeeks: round1(soFar.dryWeeks + (climatology.dryWeeksJul10y / 10) * 1.2 * remaining),
  }
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1)
const round1 = (x: number) => Math.round(x * 10) / 10
