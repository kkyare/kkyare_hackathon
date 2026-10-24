import type { Field, ForecastRun, Observation, Snapshot } from './types'

export function buildSnapshot(field: Field, t0: string, runs: ForecastRun[], obs: Observation): Snapshot {
  const t0ms = Date.parse(t0)
  const latest = new Map<string, ForecastRun>()
  for (const r of runs) {
    if (Date.parse(r.issuedAt) > t0ms) continue
    const cur = latest.get(r.model)
    if (!cur || Date.parse(r.issuedAt) > Date.parse(cur.issuedAt)) latest.set(r.model, r)
  }
  const compact = new Date(t0ms).toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '').replace('T', 't').toLowerCase()
  return {
    id: `snap-${field.id}-${compact}`.toLowerCase(),
    t0,
    fieldId: field.id,
    forecasts: [...latest.values()],
    obsUntilT0: obs.hourly.filter(h => Date.parse(h.time) <= t0ms),
  }
}

export function assertNoLeak(s: Snapshot): string[] {
  const t0ms = Date.parse(s.t0)
  const flags: string[] = []
  for (const f of s.forecasts) {
    if (Date.parse(f.issuedAt) > t0ms) flags.push(`forecast ${f.model} issuedAt ${f.issuedAt} > t0 ${s.t0}`)
  }
  for (const h of s.obsUntilT0) {
    if (Date.parse(h.time) > t0ms) flags.push(`obs time ${h.time} > t0 ${s.t0}`)
  }
  return flags
}
