// 농장 화면 데이터 (목업, demo: true)
import yieldsJson from '../../fixtures/farm/yields.json'
import { claims as demoClaims, climatology, portfolio, rateFor, riskScores, snapshots } from '../insurance/data'
import type { FarmData } from './brief'
import type { SeasonWeather, SeasonYield } from './yieldModel'

export const farmData: FarmData = {
  fields: portfolio.fields,
  climatology,
  riskScores,
  rateFor,
  yields: yieldsJson.yields as SeasonYield[],
  seasons: yieldsJson.seasons,
  current: yieldsJson.current as { fieldId: string; season: string; asOf: string; weather: SeasonWeather }[],
  snapshots,
  claims: [...portfolio.history, ...demoClaims],
}

export const candidates = () => farmData.fields.map((field) => ({ field, scores: riskScores.filter((s) => s.fieldId === field.id) }))
