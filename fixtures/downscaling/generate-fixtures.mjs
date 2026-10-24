// 유진 영역 목업 데이터 생성기 (downscaling / decision / insurance).
// 실행: node fixtures/downscaling/generate-fixtures.mjs
// 결과는 모두 "demo": true. 실제 API 응답 형식(Open-Meteo 시간별, IEM ASOS)에 맞춘 목업이다.
import { mkdirSync, writeFileSync } from 'node:fs'
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
const fields = [
  { id: 'field-ia-01', name: 'Miller North 160', farmId: 'farm-miller', lat: 41.62, lon: -93.71, elevationM: 298, acres: 160, crop: 'corn', terrain: 'flat' },
  { id: 'field-ia-02', name: 'Miller South 80', farmId: 'farm-miller', lat: 41.6, lon: -93.7, elevationM: 285, acres: 80, crop: 'soybean', terrain: 'flat' },
  { id: 'field-ia-03', name: 'Raccoon Bottom 120', farmId: 'farm-johnson', lat: 41.55, lon: -93.82, elevationM: 262, acres: 120, crop: 'orchard', terrain: 'valley' },
  { id: 'field-ia-04', name: 'Johnson East 240', farmId: 'farm-johnson', lat: 41.57, lon: -93.78, elevationM: 290, acres: 240, crop: 'corn', terrain: 'flat' },
  { id: 'field-ia-05', name: 'Walnut Creek 90', farmId: 'farm-olsen', lat: 41.48, lon: -93.86, elevationM: 268, acres: 90, crop: 'orchard', terrain: 'valley' },
  { id: 'field-ia-06', name: 'Olsen Ridge 200', farmId: 'farm-olsen', lat: 41.46, lon: -93.9, elevationM: 326, acres: 200, crop: 'corn', terrain: 'ridge' },
  { id: 'field-ia-07', name: 'Ankeny West 300', farmId: 'farm-hansen', lat: 41.72, lon: -93.65, elevationM: 305, acres: 300, crop: 'soybean', terrain: 'flat' },
  { id: 'field-ia-08', name: 'Hansen Hill 150', farmId: 'farm-hansen', lat: 41.75, lon: -93.6, elevationM: 318, acres: 150, crop: 'corn', terrain: 'ridge' },
].map((f) => ({ ...f, stationId: station.id }))

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

const claims = [
  { id: 'claim-0001', fieldId: 'field-ia-03', peril: 'frost', date: '2026-05-12', claimedLossUsd: 96000 },
  { id: 'claim-0002', fieldId: 'field-ia-06', peril: 'frost', date: '2026-05-12', claimedLossUsd: 150000 },
  { id: 'claim-0003', fieldId: 'field-ia-02', peril: 'excess_rain', date: '2026-06-18', claimedLossUsd: 42000 },
  { id: 'claim-0004', fieldId: 'field-ia-05', peril: 'frost', date: '2026-05-20', claimedLossUsd: 60000 },
  { id: 'claim-0005', fieldId: 'field-ia-04', peril: 'hail', date: '2026-06-18', claimedLossUsd: 85000 },
]

// 지난 10년 5월 서리 밤 수 (목업 기후값)
const climatology = fields.map((f) => ({
  fieldId: f.id,
  frostNightsMay10y: Math.max(0, Math.round(6 - ((f.elevationM - station.elevationM) / 100) * 4 + { valley: 8, flat: 0, ridge: -3 }[f.terrain])),
  heavyRainDaysJun10y: f.terrain === 'valley' ? 9 : 6,
}))

write('downscaling/fields.json', { demo: true, station, fields })
write('downscaling/snapshots.json', { demo: true, snapshots })
write('downscaling/station-observations.json', { demo: true, observations: [stationObs] })
write('downscaling/field-observations.json', { demo: true, note: '농장 센서 목업 (연결된 농장의 필지 실측)', observations: fieldObs })
write('insurance/claims.json', { demo: true, claims })
write('insurance/climatology.json', { demo: true, climatology })
console.log(`fields ${fields.length}, snapshots ${snapshots.length}, field obs ${fieldObs.length}, claims ${claims.length}`)
