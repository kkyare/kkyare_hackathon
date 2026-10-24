// 유진 영역 목업 데이터 생성기 (downscaling / decision / insurance).
// 실행: node fixtures/downscaling/generate-fixtures.mjs
// 결과는 모두 "demo": true. 실제 API 응답 형식(Open-Meteo 시간별, IEM ASOS)에 맞춘 목업이다.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const write = (rel, data) => {
  const p = join(root, rel)
  mkdirSync(dirname(p), { recursive: true })
  writeFileSync(p, JSON.stringify(data, null, 2) + '\n')
}

// 아이오와 중부, DSM(Des Moines 공항, 고도 292m) 주변 필지
const station = { id: 'DSM', name: 'Des Moines Intl', lat: 41.534, lon: -93.653, elevationM: 292 }
// 필지는 성호님 공통 fixtures(fixtures/common/fields.json)를 그대로 쓴다 (같은 ID = 같은 필지)
const fields = JSON.parse(readFileSync(join(root, 'common/fields.json'), 'utf8')).fields

const iso = (d) => d.toISOString().replace('.000Z', 'Z')
const hours = (startIso, n) => Array.from({ length: n }, (_, i) => new Date(Date.parse(startIso) + i * 3600e3))

// 밤 기온 곡선: 18Z(현지 13시) 최고 → 11Z(현지 6시) 최저 → 다시 상승
function tempCurve(t, maxF, minF) {
  const localHour = (t.getUTCHours() + 24 - 5) % 24 // CDT
  const phase = localHour >= 13 ? (localHour - 13) / 17 : (localHour + 11) / 17 // 13시=0, 6시=1
  const cool = Math.sin((Math.min(phase, 1) * Math.PI) / 2)
  if (localHour >= 6 && localHour < 13) return minF + ((localHour - 6) / 7) * (maxF - minF)
  return maxF - cool * (maxF - minF)
}
const round1 = (x) => Math.round(x * 10) / 10

function series(startIso, n, { maxF, minF, wind = 6, gust = 12, precip = () => 0 }) {
  return hours(startIso, n).map((t, i) => ({
    time: iso(t),
    tempF: round1(tempCurve(t, maxF, minF)),
    dewF: round1(tempCurve(t, maxF, minF) - 6),
    windMph: round1(wind + Math.sin(i / 3) * 2),
    gustMph: round1(gust + Math.sin(i / 3) * 3),
    windDirDeg: 320,
    precipIn: round1(precip(t, i) * 100) / 100,
  }))
}

// 서리 시나리오: 격자 예보는 33-35°F(서리 아님), 실제로 DSM 33°F, 골짜기 필지는 29-30°F
const scenarios = [
  {
    key: 'frost-0512', t0: '2026-05-11T18:00:00Z', resolveAt: '2026-05-12T18:00:00Z',
    models: [
      { model: 'ncep_hrrr_conus', gridElevationM: 295, minF: 34, maxF: 58 },
      { model: 'ecmwf_ifs025', gridElevationM: 300, minF: 33, maxF: 57 },
      { model: 'gfs_seamless', gridElevationM: 290, minF: 35, maxF: 59 },
    ],
    stationMinF: 33, stationMaxF: 58,
  },
  {
    key: 'mild-0520', t0: '2026-05-19T18:00:00Z', resolveAt: '2026-05-20T18:00:00Z',
    models: [
      { model: 'ncep_hrrr_conus', gridElevationM: 295, minF: 47, maxF: 72 },
      { model: 'ecmwf_ifs025', gridElevationM: 300, minF: 46, maxF: 71 },
      { model: 'gfs_seamless', gridElevationM: 290, minF: 48, maxF: 73 },
    ],
    stationMinF: 46, stationMaxF: 72,
  },
]

// 필지 실측(농장 센서 목업): 고도 보정 + 지형 효과 + 작은 잡음
const terrainNight = { valley: -2.5, flat: 0, ridge: 1 }
const noise = (id) => ((id.charCodeAt(id.length - 1) * 37) % 10) / 10 - 0.5
const fieldMin = (f, stationMinF) => round1(stationMinF - ((f.elevationM - station.elevationM) / 100) * 1.2 + terrainNight[f.terrain] + noise(f.id))

const snapshots = []
const stationObs = { stationId: station.id, hourly: [] }
const fieldObs = []

for (const s of scenarios) {
  for (const f of fields) {
    snapshots.push({
      id: `snap-${s.key}-${f.id}`,
      t0: s.t0,
      fieldId: f.id,
      forecasts: s.models.map((m) => ({
        model: m.model,
        issuedAt: s.t0.replace('18:00', '12:00'),
        gridElevationM: m.gridElevationM,
        hourly: series(s.t0, 25, { maxF: m.maxF, minF: m.minF }),
      })),
      obsUntilT0: series(new Date(Date.parse(s.t0) - 6 * 3600e3).toISOString(), 6, { maxF: s.stationMaxF, minF: s.stationMinF }),
    })
    fieldObs.push({
      stationId: `farm-sensor-${f.id}`,
      fieldId: f.id,
      scenario: s.key,
      hourly: series(s.t0, 25, { maxF: s.stationMaxF, minF: fieldMin(f, s.stationMinF) }),
    })
  }
  stationObs.hourly.push(...series(s.t0, 25, { maxF: s.stationMaxF, minF: s.stationMinF }))
}

// 폭우 시나리오 2026-06-18: DSM 24시간 2.6 inch
const rainHourly = series('2026-06-18T00:00:00Z', 24, {
  maxF: 78, minF: 64, wind: 12, gust: 24,
  precip: (_t, i) => (i >= 4 && i < 12 ? [0.15, 0.3, 0.5, 0.6, 0.4, 0.3, 0.2, 0.15][i - 4] : 0),
})
stationObs.hourly.push(...rainHourly)

// 데모 청구 (화면에서 직접 검증해 보는 청구). 수확량은 bu/acre (사과도 bushel 단위)
const claims = [
  { id: 'claim-0001', fieldId: 'field-ia-04', peril: 'frost', date: '2026-05-12', claimedLossUsd: 25000, expectedYieldBuAc: 58, actualYieldBuAc: 46 },
  { id: 'claim-0002', fieldId: 'field-ia-02', peril: 'frost', date: '2026-05-12', claimedLossUsd: 150000, expectedYieldBuAc: 195, actualYieldBuAc: 120 },
  { id: 'claim-0003', fieldId: 'field-ia-03', peril: 'excess_rain', date: '2026-06-18', claimedLossUsd: 8000, expectedYieldBuAc: 58, actualYieldBuAc: 45 },
  { id: 'claim-0004', fieldId: 'field-ia-05', peril: 'frost', date: '2026-05-20', claimedLossUsd: 30000, expectedYieldBuAc: 58, actualYieldBuAc: 52 },
  { id: 'claim-0005', fieldId: 'field-ia-07', peril: 'excess_rain', date: '2026-06-18', claimedLossUsd: 250000, expectedYieldBuAc: 195, actualYieldBuAc: 170 },
]

// 지난 10년 기후값 (목업)
let cseed = 11
const crand = () => ((cseed = (cseed * 16807) % 2147483647) / 2147483647)
const jitter = (n) => Math.round((crand() - 0.5) * 2 * n)
const climFor = (f) => ({
  fieldId: f.id,
  frostNightsMay10y: Math.max(0, Math.round(6 - ((f.elevationM - station.elevationM) / 100) * 4 + { valley: 8, flat: 0, ridge: -3 }[f.terrain]) + jitter(3)),
  heavyRainDaysJun10y: Math.max(1, (f.terrain === 'valley' ? 9 : f.terrain === 'flat' ? 6 : 4) + jitter(3)),
  dryWeeksJul10y: Math.max(1, (f.terrain === 'ridge' ? 9 : f.terrain === 'flat' ? 6 : 3) + jitter(3)),
})

// 보험 포트폴리오: 데모 필지 8개 + 임의의 아이오와 필지 40개, 지난 시즌 청구·생산량 이력.
// 손해는 위험 요인과 양의 상관이지만 잡음이 있게 만든다 (완벽하면 가짜처럼 보임).
let seed = 7
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
const terrains = ['valley', 'flat', 'flat', 'ridge']
const portfolioFields = [
  ...fields,
  ...Array.from({ length: 40 }, (_, i) => {
    const terrain = terrains[Math.floor(rand() * terrains.length)]
    const crop = rand() < 0.55 ? 'corn' : 'soybean'
    return {
      id: `field-ia-${String(i + 9).padStart(2, '0')}`,
      name: `Iowa Field ${i + 9}`,
      farmId: `farm-${String.fromCharCode(97 + (i % 12))}`,
      lat: round1(41.3 + rand() * 0.8),
      lon: round1(-94.2 + rand() * 1.0),
      elevationM: Math.round(station.elevationM + (terrain === 'valley' ? -30 : terrain === 'ridge' ? 30 : 0) + (rand() - 0.5) * 20),
      acres: Math.round(80 + rand() * 320),
      crop,
      terrain,
      stationId: station.id,
    }
  }),
]
const climatology = portfolioFields.map(climFor)

const PRICE = { corn: 4.5, soybean: 11, orchard: 9 } // $/bu, 가정
const EXPECTED = { corn: 195, soybean: 58, orchard: 750 } // bu/acre
const perilWeight = {
  frost: (c, f) => c.frostNightsMay10y / 14 + (f.crop === 'orchard' ? 0.3 : 0),
  excess_rain: (c) => c.heavyRainDaysJun10y / 10,
  drought: (c) => c.dryWeeksJul10y / 10,
}
const history = []
for (const season of ['2023', '2024', '2025']) {
  for (const f of portfolioFields) {
    const c = climatology.find((x) => x.fieldId === f.id)
    for (const peril of Object.keys(perilWeight)) {
      const w = perilWeight[peril](c, f)
      // 위험이 클수록 청구가 잦고 크다. 잡음을 넣어 완벽한 상관은 피한다
      const q = Math.min(0.6, 0.02 + 0.22 * w * w)
      if (rand() >= q) continue
      const lossFrac = Math.max(0.03, Math.min(0.6, 0.06 + 0.12 * w + (rand() - 0.5) * 0.12))
      const expected = EXPECTED[f.crop]
      const actual = Math.round(expected * (1 - lossFrac))
      const paid = Math.round((expected - actual) * PRICE[f.crop] * f.acres * 0.75) // 보장 75% 가정
      history.push({ id: `hist-${season}-${f.id}-${peril}`, fieldId: f.id, peril, date: `${season}-06-15`, claimedLossUsd: Math.round(paid * 1.05), paidLossUsd: paid, expectedYieldBuAc: expected, actualYieldBuAc: actual })
    }
  }
}

write('downscaling/fields.json', { demo: true, note: '필지는 fixtures/common/fields.json과 같음', station, fields })
write('downscaling/snapshots.json', { demo: true, snapshots })
write('downscaling/station-observations.json', { demo: true, observations: [stationObs] })
write('downscaling/field-observations.json', { demo: true, note: '농장 센서 목업 (연결된 농장의 필지 실측)', observations: fieldObs })
write('insurance/claims.json', { demo: true, claims })
write('insurance/climatology.json', { demo: true, climatology })
write('insurance/portfolio.json', {
  demo: true,
  note: '임의의 아이오와 필지 48개, 2023-2025 청구·생산량 이력 (목업). 가격 $/bu와 보장률 75%는 가정',
  pricesUsdBu: PRICE,
  basePremiumUsdAc: { corn: 40, soybean: 29, orchard: 300 },
  fields: portfolioFields,
  history,
})
console.log(`fields ${fields.length}, portfolio ${portfolioFields.length}, history ${history.length}, claims ${claims.length}`)
