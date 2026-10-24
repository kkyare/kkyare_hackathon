// 결정적 fixtures 생성기 (seed 42). 실행: npx -y tsx scripts/build-fixtures.ts
// 모든 값은 목업(DEMO DATA)이다. 형식은 src/core/types.ts를 따른다.
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import type { Field, ForecastRun, HourlyPoint } from '../src/core/types'

const ROOT = resolve(dirname(process.argv[1]), '..')
const OUT = join(ROOT, 'fixtures')
const SEED = 42
const HOUR = 3_600_000
const OBS_START = Date.parse('2026-06-09T00:00:00Z')
const OBS_HOURS = 72

const iso = (ms: number) => new Date(ms).toISOString().replace('.000Z', 'Z')
const r1 = (x: number) => Math.round(x * 10) / 10

type Rng = () => number
function mulberry32(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const between = (rng: Rng, lo: number, hi: number) => lo + rng() * (hi - lo)

// JSON 출력: HourlyPoint는 한 줄로 접어 파일 길이를 줄인다.
function fmt(v: unknown): string {
  const s = JSON.stringify(v, null, 2).replace(/\{\n\s+"time": [^{}]*\}/g, (m) => JSON.stringify(JSON.parse(m)))
  return s + '\n'
}
function writeJson(path: string, v: unknown) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, fmt(v))
}

const DSM = { lat: 41.53, lon: -93.65 }
const FARMS: [string, string][] = [
  ['farm-ia-a', 'Miller'],
  ['farm-ia-b', 'Johnson'],
  ['farm-ia-c', 'Anderson'],
  ['farm-ia-d', 'Olson'],
]
const DIRS = ['North', 'South', 'East', 'West']
const TERRAINS = ['valley', 'flat', 'ridge'] as const

function buildFields(): Field[] {
  const rng = mulberry32(SEED)
  const fields: Field[] = []
  for (let j = 0; j < 8; j++) {
    const k = Math.floor(j / 2)
    const [farmId, family] = FARMS[k]
    const km = between(rng, 5, 25)
    const ang = between(rng, 0, 2 * Math.PI)
    const lat = DSM.lat + (km * Math.sin(ang)) / 111.2
    const lon = DSM.lon + (km * Math.cos(ang)) / (111.2 * Math.cos((DSM.lat * Math.PI) / 180))
    const acres = 80 + 10 * Math.floor(rng() * 25)
    fields.push({
      id: `field-ia-${String(j + 1).padStart(2, '0')}`,
      name: `${family} ${DIRS[(2 * k + (j % 2)) % 4]} ${acres}`,
      farmId,
      lat: Math.round(lat * 1e4) / 1e4,
      lon: Math.round(lon * 1e4) / 1e4,
      elevationM: 250 + Math.floor(rng() * 71),
      acres,
      crop: rng() < 0.5 ? 'corn' : 'soybean',
      stationId: 'DSM',
      terrain: TERRAINS[Math.floor(rng() * 3)],
    })
  }
  return fields
}

type Scn = 'gust-block' | 'calm-go' | 'forecast-miss'
interface P { wind: number; gust: number; temp: number; dew: number; dir: number; precip: number }

// 6/10 = 하루 중 index 24..47. UTC 시각 h 의 절대 인덱스는 24 + h.
function buildTruth(scn: Scn, rng: Rng): P[] {
  const out: P[] = []
  for (let i = 0; i < OBS_HOURS; i++) {
    const day = 9 + Math.floor(i / 24)
    const h = i % 24
    let wind = h < 12 ? between(rng, 2, 6) : between(rng, 4, 9)
    let gust = wind + between(rng, 1, 2.5)
    let dir = 190 + between(rng, -20, 20)
    if (scn === 'calm-go') gust = Math.min(gust, 10)
    if (day === 10 && scn === 'gust-block') {
      if (h >= 12 && h <= 16) {
        wind = between(rng, 5, 8)
        gust = Math.min(wind + between(rng, 1, 2.5), 10)
      } else if (h >= 17) {
        wind = between(rng, 9, 13)
        gust = between(rng, 16, 20)
        dir = 290 + between(rng, -15, 15)
      }
    }
    if (day === 10 && scn === 'forecast-miss' && h >= 15 && h <= 19) {
      if (h >= 16 && h <= 18) {
        wind = between(rng, 11, 12)
        gust = 16
      } else {
        wind = between(rng, 7, 8)
        gust = between(rng, 9, 10)
      }
    }
    const temp = 70 + 12 * Math.sin((2 * Math.PI * (h - 15)) / 24) + between(rng, -0.8, 0.8)
    const dew = Math.min(temp - 2, temp - 13 + between(rng, -1.5, 1.5))
    out.push({
      wind: r1(wind),
      gust: r1(Math.max(gust, wind)),
      temp: r1(temp),
      dew: r1(dew),
      dir: Math.round(dir),
      precip: scn === 'gust-block' && i === 50 ? 0.05 : 0,
    })
  }
  return out
}

function buildObservation(truth: P[], rng: Rng) {
  const nullIdx = new Set<number>()
  while (nullIdx.size < 3) {
    const i = Math.floor(rng() * OBS_HOURS)
    if (i >= 24 && i < 48) continue
    nullIdx.add(i)
  }
  const hourly: HourlyPoint[] = truth.map((p, i) => ({
    time: iso(OBS_START + i * HOUR),
    tempF: p.temp,
    dewF: p.dew,
    windMph: p.wind,
    gustMph: nullIdx.has(i) ? null : p.gust, // IEM 'M' 모사
    windDirDeg: p.dir,
    precipIn: p.precip,
  }))
  return { demo: true, stationId: 'DSM', hourly }
}

const MODELS = [
  { model: 'ncep_hrrr_conus', sigma: 0.8, tBias: 0, gridElevationM: 292 },
  { model: 'ncep_nbm_conus', sigma: 1.0, tBias: 0.3, gridElevationM: 290 },
  { model: 'gfs_seamless', sigma: 1.8, tBias: -1.0, gridElevationM: 281 },
  { model: 'ecmwf_ifs025', sigma: 1.8, tBias: 0.6, gridElevationM: 285 },
]
const ISSUED = ['2026-06-09T12:00:00Z', '2026-06-10T00:00:00Z']
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))

function buildRuns(scn: Scn, truth: P[], rng: Rng): ForecastRun[] {
  const runs: ForecastRun[] = []
  for (const m of MODELS) {
    ISSUED.forEach((issuedAt, runIdx) => {
      const s = m.sigma * (runIdx === 0 ? 1 : 0.6)
      const t0 = Date.parse(issuedAt)
      const hourly: HourlyPoint[] = []
      for (let k = 0; k < 48; k++) {
        const tMs = t0 + k * HOUR
        const i = (tMs - OBS_START) / HOUR
        const p = truth[i]
        const day = 9 + Math.floor(i / 24)
        const h = i % 24
        let wind = Math.max(0.5, p.wind + between(rng, -s, s))
        let gust = Math.max(wind + 0.5, p.gust + between(rng, -s, s))
        if (day === 10 && scn === 'gust-block') {
          if (h >= 12 && h <= 16) {
            wind = clamp(wind, 5, 8)
            gust = clamp(gust, wind, 10)
          } else if (h >= 17) {
            wind = clamp(wind, 9, 13)
            gust = clamp(gust, 16, 20)
          }
        }
        if (scn === 'calm-go') {
          if (day === 10 && h >= 12) wind = clamp(wind, 4, 9)
          gust = clamp(gust, wind, 10)
        }
        if (day === 10 && scn === 'forecast-miss' && h >= 15 && h <= 19) {
          if (m.model === 'ncep_hrrr_conus' || m.model === 'ncep_nbm_conus') {
            wind = between(rng, 6, 8)
            gust = 8
          } else {
            wind = between(rng, 8, 10)
            gust = between(rng, 11, 13)
          }
        }
        const temp = p.temp + m.tBias + between(rng, -s, s) * 1.2
        const dew = Math.min(temp - 1, p.dew + between(rng, -s, s))
        const missingGust = scn === 'gust-block' && m.model === 'ecmwf_ifs025'
        hourly.push({
          time: iso(tMs),
          tempF: r1(temp),
          dewF: r1(dew),
          windMph: r1(wind),
          gustMph: missingGust ? null : r1(gust),
          windDirDeg: (Math.round(p.dir + between(rng, -15, 15)) + 360) % 360,
          precipIn: p.precip,
        })
      }
      runs.push({ model: m.model, issuedAt, gridElevationM: m.gridElevationM, hourly })
    })
  }
  return runs
}

const SCENARIOS: { id: Scn; story: string; expected: unknown }[] = [
  {
    id: 'gust-block',
    story: '6월 10일 오전(12~16Z)에는 바람이 잔잔해 살포가 가능하지만, 17Z(현지 낮 12시)부터 돌풍이 16~20mph로 올라 살포 창이 막히는 날이다.',
    expected: {
      windowHours: 3,
      windows: [
        { start: '2026-06-10T13:00:00Z', violation: false },
        { start: '2026-06-10T16:00:00Z', violation: true },
      ],
    },
  },
  {
    id: 'calm-go',
    story: '6월 10일은 하루 종일 바람이 4~9mph로 잔잔하고 돌풍도 10mph 이하라 15Z(현지 오전 10시)에 살포를 시작해도 문제없는 날이다.',
    expected: { windowHours: 3, windows: [{ start: '2026-06-10T15:00:00Z', violation: false }] },
  },
  {
    id: 'forecast-miss',
    story: 'HRRR·NBM은 15~19Z 돌풍을 8mph로 예보했지만 실측은 16~18Z에 16mph까지 올라, 예보만 믿고 살포했다면 위반이 되는 날이다.',
    expected: {
      windowHours: 3,
      windows: [{ start: '2026-06-10T15:00:00Z', violation: true, basis: 'observation' }],
      forecastHrrrViolation: false,
    },
  },
]

writeJson(join(OUT, 'common', 'fields.json'), { demo: true, fields: buildFields() })

SCENARIOS.forEach((sc, idx) => {
  const rng = mulberry32(SEED + idx + 1)
  const truth = buildTruth(sc.id, rng)
  const dir = join(OUT, 'nowcasting', sc.id)
  writeJson(join(dir, 'snapshot-source.json'), { demo: true, scenario: sc.id, runs: buildRuns(sc.id, truth, rng) })
  writeJson(join(dir, 'observation.json'), buildObservation(truth, rng))
  writeJson(join(dir, 'meta.json'), { demo: true, story: sc.story, expected: sc.expected })
})

console.log(`fixtures written to ${OUT}`)
