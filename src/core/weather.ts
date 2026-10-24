// Mock mode only: data comes from fixtures/. Live adapters (Open-Meteo Single Runs, IEM ASOS) are P1.
import * as fs from 'node:fs'
import * as path from 'node:path'
import type { Field, ForecastRun, Observation } from './types'

export const SCENARIOS = ['gust-block', 'calm-go', 'forecast-miss'] as const
export type ScenarioId = (typeof SCENARIOS)[number]

function readJson(...parts: string[]): any {
  const p = path.join(process.cwd(), 'fixtures', ...parts)
  if (!fs.existsSync(p)) throw new Error(`fixture not found: ${p}`)
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

export function loadFields(): Field[] {
  const j = readJson('common', 'fields.json')
  if (!Array.isArray(j.fields)) throw new Error('fixtures/common/fields.json: missing "fields" array')
  return j.fields as Field[]
}

export function loadForecastRuns(scenario: ScenarioId): ForecastRun[] {
  const j = readJson('nowcasting', scenario, 'snapshot-source.json')
  if (!Array.isArray(j.runs)) throw new Error(`fixtures/nowcasting/${scenario}/snapshot-source.json: missing "runs" array`)
  return j.runs as ForecastRun[]
}

export function loadObservation(scenario: ScenarioId): Observation {
  const j = readJson('nowcasting', scenario, 'observation.json')
  if (!Array.isArray(j.hourly)) throw new Error(`fixtures/nowcasting/${scenario}/observation.json: missing "hourly" array`)
  return { stationId: j.stationId, hourly: j.hourly }
}

export function knotToMph(k: number | null): number | null {
  return k == null ? null : Math.round(k * 1.151 * 100) / 100
}

export function parseIemValue(s: string): number | null {
  const t = s.trim()
  if (t === '' || t === 'M') return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}
