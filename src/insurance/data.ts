// 유진 영역 fixtures 로더 (목업, demo: true). 화면·API는 여기서 데이터를 받는다.
import type { Claim, Field, Observation, Snapshot } from '../core/types'
import fieldsJson from '../../fixtures/downscaling/fields.json'
import snapshotsJson from '../../fixtures/downscaling/snapshots.json'
import stationObsJson from '../../fixtures/downscaling/station-observations.json'
import fieldObsJson from '../../fixtures/downscaling/field-observations.json'
import claimsJson from '../../fixtures/insurance/claims.json'
import climJson from '../../fixtures/insurance/climatology.json'
import type { Climatology, VerifyContext } from './verify'

export const station = fieldsJson.station
export const fields = fieldsJson.fields as Field[]
export const snapshots = snapshotsJson.snapshots as Snapshot[]
export const stationObs = stationObsJson.observations as Observation[]
export const fieldObs = fieldObsJson.observations as (Observation & { fieldId: string; scenario: string })[]
export const claims = claimsJson.claims as Claim[]
export const climatology = climJson.climatology as Climatology[]

export const verifyContext: VerifyContext = { fields, station, stationObs, fieldObs, snapshots }

/** 과제 채점용 정답: 연결된 농장의 필지 센서 관측 (목업) */
export function observationFor(fieldId: string, t0: string): Observation | undefined {
  return fieldObs.find((o) => o.fieldId === fieldId && o.hourly[0]?.time === t0)
}
export const snapshotById = (id: string) => snapshots.find((s) => s.id === id)
