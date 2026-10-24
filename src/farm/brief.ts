// 농장 하나에 대한 예측 묶음: 필지 날씨 예측, 올해 예상 생산량, 위험점수와 요율, 모델이 데이터로 나아진 기록.
import type { Field, Peril, RateRange, RiskScore, Snapshot } from '../core/types'
import { normalCdf } from '../core/scoring'
import { fieldMinDistribution, rawGridMin } from '../families/downscaling/model'
import { referenceProbability } from '../families/decision'
import type { Climatology } from '../insurance/verify'
import { backtest, predictYield, seasonOutlook, trainYieldModel, type SeasonWeather, type SeasonYield } from './yieldModel'

export interface FarmData {
  fields: Field[]
  climatology: Climatology[]
  riskScores: RiskScore[]
  rateFor: (fieldId: string, peril: Peril) => RateRange | undefined
  yields: SeasonYield[]
  seasons: string[]
  current: { fieldId: string; season: string; asOf: string; weather: SeasonWeather }[]
  snapshots: Snapshot[]
  claims: { fieldId: string; peril: Peril; date: string; paidLossUsd?: number }[]
}

export const FROST_NIGHT_T0 = '2026-05-11T18:00:00Z'

export function farmBrief(fieldId: string, d: FarmData) {
  const field = d.fields.find((f) => f.id === fieldId)
  if (!field) return null
  const clim = d.climatology.find((c) => c.fieldId === fieldId)
  const scores = d.riskScores.filter((s) => s.fieldId === fieldId)
  const top = [...scores].sort((a, b) => b.score - a.score)[0]

  // 올해 예상 생산량: 4시즌 실제 수확으로 학습한 모델 + 5월까지 관측된 기상 지표 + 남은 기간 평년 기대
  const model = trainYieldModel(d.yields, d.seasons)
  const soFar = d.current.find((c) => c.fieldId === fieldId)
  const outlook = soFar && clim ? seasonOutlook(soFar.weather, clim) : { frostNights: 0, heavyRainDays: 0, dryWeeks: 0 }
  const prediction = predictYield(model, fieldId, outlook)
  const history = d.yields.filter((y) => y.fieldId === fieldId).map((y) => ({ season: y.season, pct: y.pctOfExpected, weather: y.weather }))

  // 필지 날씨 예측: 5월 11일 오후 예보로 본 그날 밤 최저기온과 서리 확률 (예보 자료가 있는 필지만)
  const snap = d.snapshots.find((s) => s.fieldId === fieldId && s.t0 === FROST_NIGHT_T0)
  const frostNight = snap
    ? (() => {
        const dist = fieldMinDistribution(field, snap)
        const raws = snap.forecasts.map(rawGridMin).filter((v): v is number => v !== null)
        return {
          date: '2026-05-12',
          fieldMinF: round1(dist.mean),
          sigmaF: round1(dist.sigma),
          gridMinF: round1(raws.reduce((a, b) => a + b, 0) / raws.length),
          pFrost: round2(normalCdf(32, dist.mean, dist.sigma)),
          gridPFrost: round2(referenceProbability(snap)),
        }
      })()
    : null

  const claims = d.claims.filter((c) => c.fieldId === fieldId)
  return {
    field,
    scores,
    topPeril: top?.peril ?? 'frost',
    rate: d.rateFor(fieldId, top?.peril ?? 'frost'),
    frostNight,
    yield: { season: '2026', asOf: soFar?.asOf ?? null, soFar: soFar?.weather ?? null, outlook, ...prediction },
    history,
    learning: backtest(d.yields, d.seasons),
    claims: { count: claims.length, paidUsd: claims.reduce((s, c) => s + (c.paidLossUsd ?? 0), 0) },
  }
}

export type FarmBrief = NonNullable<ReturnType<typeof farmBrief>>

const PERIL_KO: Record<Peril, string> = { frost: '서리', excess_rain: '폭우', drought: '가뭄' }

/** Claude가 없을 때 쓰는 브리핑. 계산된 숫자만 문장으로 옮긴다 */
export function templateBriefing(b: FarmBrief): string {
  const y = b.yield
  const effects = [
    ['서리로', y.parts.weatherEffect.frost],
    ['폭우로', y.parts.weatherEffect.rain],
    ['가뭄으로', y.parts.weatherEffect.dry],
  ] as const
  const worst = [...effects].sort((a, c) => a[1] - c[1])[0]
  const avg = b.history.length ? round1(b.history.reduce((s, h) => s + h.pct, 0) / b.history.length) : null
  const lines = [
    `올해 예상 생산량은 평년의 ${y.pct}%(범위 ${y.range[0]}~${y.range[1]}%)입니다.`,
    worst[1] < -0.5 ? `올해 날씨 중에서는 ${worst[0]} ${Math.abs(worst[1])}%p가 가장 많이 줄어듭니다.` : '올해 날씨로 인한 감소는 크지 않습니다.',
    avg !== null ? `이 필지는 지난 ${b.history.length}시즌 평균 ${avg}%를 거뒀고, 이 기록이 필지 보정값(${y.parts.fieldAdj >= 0 ? '+' : ''}${y.parts.fieldAdj}%p)에 들어갑니다.` : '',
    b.frostNight ? `5월 12일 밤 서리 확률은 ${Math.round(b.frostNight.pFrost * 100)}%로 봤고, 공개 격자 예보는 ${Math.round(b.frostNight.gridPFrost * 100)}%였습니다.` : '',
    `위험이 가장 큰 항목은 ${PERIL_KO[b.topPeril]}(${b.scores.find((s) => s.peril === b.topPeril)?.score ?? '-'}점)입니다.`,
  ]
  return lines.filter(Boolean).join(' ')
}

const round1 = (x: number) => Math.round(x * 10) / 10
const round2 = (x: number) => Math.round(x * 100) / 100
