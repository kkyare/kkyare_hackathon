// tools·agent 테스트용 미니 스냅샷. 일부러 t0 이후 데이터(오염)를 섞어 두었다.
import type { Field, HourlyPoint, Snapshot, Task } from '../types'

export const T0 = '2026-05-12T00:00:00Z'

const hours = (startIso: string, n: number, tempF: (i: number) => number): HourlyPoint[] =>
  Array.from({ length: n }, (_, i) => ({
    time: new Date(Date.parse(startIso) + i * 3_600_000).toISOString(),
    tempF: tempF(i), windMph: 6, gustMph: null, precipIn: 0,
  }))

export const field: Field = {
  id: 'field-ia-01', name: 'Ankeny North', farmId: 'farm-ia-01',
  lat: 41.73, lon: -93.6, elevationM: 290, acres: 160, crop: 'corn',
  stationId: 'DSM', terrain: 'valley',
}

export const snapshot: Snapshot = {
  id: 'snap-0001', t0: T0, fieldId: field.id,
  forecasts: [
    { model: 'hrrr', issuedAt: '2026-05-11T18:00:00Z', hourly: hours('2026-05-11T18:00:00Z', 48, i => 50 - i * 0.4) },
    { model: 'hrrr', issuedAt: '2026-05-11T12:00:00Z', hourly: hours('2026-05-11T12:00:00Z', 48, i => 52 - i * 0.4) },
    { model: 'ecmwf_ifs', issuedAt: '2026-05-11T00:00:00Z', hourly: hours('2026-05-11T00:00:00Z', 96, i => 55 - i * 0.2) },
    // 오염: t0 이후 발표된 런
    { model: 'hrrr', issuedAt: '2026-05-12T06:00:00Z', hourly: hours('2026-05-12T06:00:00Z', 24, () => 29) },
    { model: 'nbm', issuedAt: '2026-05-12T01:00:00Z', hourly: hours('2026-05-12T01:00:00Z', 24, () => 30) },
  ],
  // 05-11T00Z ~ 05-12T05Z: 마지막 6개(t0 포함 이후)는 오염
  obsUntilT0: hours('2026-05-11T00:00:00Z', 30, i => 60 - i * 0.8),
}

export const task: Task = {
  id: 'task-dc-0001', family: 'decision', t0: T0, resolveAt: '2026-05-12T14:00:00Z',
  field, snapshotId: snapshot.id,
  prompt: '오늘 밤 이 필지에서 서리(최저기온 ≤ 32°F)가 올 확률을 추정하고, 방제(protect) 여부를 결정하라.',
  context: { costUsdPerAcre: 120, lossUsdPerAcre: 1200, thresholdF: 32 },
}
