// 유진 영역 fixtures 로더 (목업, demo: true). 화면·API는 여기서 데이터를 받는다.
import type { Claim, Field, Observation, Peril, RiskScore, Snapshot } from '../core/types'
import fieldsJson from '../../fixtures/downscaling/fields.json'
import snapshotsJson from '../../fixtures/downscaling/snapshots.json'
import stationObsJson from '../../fixtures/downscaling/station-observations.json'
import fieldObsJson from '../../fixtures/downscaling/field-observations.json'
import claimsJson from '../../fixtures/insurance/claims.json'
import climJson from '../../fixtures/insurance/climatology.json'
import portfolioJson from '../../fixtures/insurance/portfolio.json'
import { riskScore, type Climatology, type VerifyContext } from './verify'
import { lossCurve, rateRange, type Portfolio } from './rates'

export const station = fieldsJson.station
export const fields = fieldsJson.fields as Field[]
export const snapshots = snapshotsJson.snapshots as Snapshot[]
export const stationObs = stationObsJson.observations as Observation[]
export const fieldObs = fieldObsJson.observations as (Observation & { fieldId: string; scenario: string })[]
export const claims = claimsJson.claims as Claim[]
export const climatology = climJson.climatology as Climatology[]

export const PERILS: Peril[] = ['frost', 'excess_rain', 'drought']

export const portfolio: Portfolio = {
  pricesUsdBu: portfolioJson.pricesUsdBu,
  basePremiumUsdAc: portfolioJson.basePremiumUsdAc,
  fields: portfolioJson.fields as Field[],
  history: portfolioJson.history as Claim[],
  seasons: 3,
}

/** 포트폴리오 전체 필지 × 위험 종류의 위험점수 */
export const riskScores: RiskScore[] = portfolio.fields.flatMap((f) =>
  PERILS.map((peril) => riskScore(f, peril, station.elevationM, climatology.find((c) => c.fieldId === f.id))),
)

export const scoreFor = (fieldId: string, peril: Peril) => riskScores.find((r) => r.fieldId === fieldId && r.peril === peril)
export const curveFor = (peril: Peril) => lossCurve(peril, portfolio, riskScores)
export function rateFor(fieldId: string, peril: Peril) {
  const field = portfolio.fields.find((f) => f.id === fieldId)
  const score = scoreFor(fieldId, peril)
  return field && score ? rateRange(field, peril, score.score, portfolio, riskScores) : undefined
}

export const verifyContext: VerifyContext = { fields: portfolio.fields, station, stationObs, fieldObs, snapshots, rateFor }

/** 과제 채점용 정답: 연결된 농장의 필지 센서 관측 (목업) */
export function observationFor(fieldId: string, t0: string): Observation | undefined {
  return fieldObs.find((o) => o.fieldId === fieldId && o.hourly[0]?.time === t0)
}
export const snapshotById = (id: string) => snapshots.find((s) => s.id === id)

/** Arena(`runArena`)에 넘길 조회 함수: 다운스케일링·의사결정 과제용 */
export const getSnapshot = (snapshotId: string) => snapshotById(snapshotId)
export const getObservation = (task: { field: { id: string }; t0: string }) => observationFor(task.field.id, task.t0)
