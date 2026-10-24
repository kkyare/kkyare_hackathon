// Arena가 과제의 스냅샷·정답 관측을 찾는 곳. 패밀리마다 fixtures 구조가 달라 여기서 한 줄씩 연결한다.
import * as fs from 'node:fs'
import * as path from 'node:path'
import { loadFields } from '../core/weather'
import { families } from '../families/index'
import { buildDemoTasks, loadObservationForTask, loadSnapshotForTask } from '../families/nowcasting/index'
import { buildS2sTasks, loadS2sObservationForTask } from '../families/s2s/index'
import { fields as insuranceFields, observationFor, snapshotById, snapshots as insuranceSnapshots } from '../insurance/data'
import type { FamilyId, Observation, Snapshot, Task } from '../core/types'
import type { ArenaRun } from './run'

interface TaskData { snapshot(task: Task): Snapshot | undefined; observation(task: Task): Observation | undefined }

// 다운스케일링·서리 결정: fixtures/downscaling (유진님 insurance/data)
const downscalingData: TaskData = {
  snapshot: task => snapshotById(task.snapshotId),
  observation: task => observationFor(task.field.id, task.t0),
}

const loaders: Partial<Record<FamilyId, TaskData>> = {
  nowcasting: { snapshot: loadSnapshotForTask, observation: loadObservationForTask },
  downscaling: downscalingData,
  decision: downscalingData,
  // S2S는 t0 예보 런이 없다 (CPC 전망은 과제 prompt에 담김). score 라우트와 같은 빈 스냅샷
  s2s: {
    snapshot: task => ({ id: task.snapshotId, t0: task.t0, fieldId: task.field.id, forecasts: [], obsUntilT0: [] }),
    observation: loadS2sObservationForTask,
  },
}

// 패밀리별 데모 과제 (fixtures). id가 고정이라 저장 응답(fixtures/arena/runs.json)과 맞춰 재생할 수 있다
export function demoTasks(family: FamilyId, count: number): Task[] {
  switch (family) {
    case 'nowcasting': return buildDemoTasks(count).tasks
    case 'downscaling': return families.downscaling?.generate({ fields: insuranceFields, snapshots: insuranceSnapshots, count }) ?? []
    case 'decision': return families.decision?.generate({ fields: insuranceFields, snapshots: insuranceSnapshots, count }) ?? []
    case 's2s': return buildS2sTasks(loadFields()).slice(0, count)
  }
}

const attempt = <T,>(fn: () => T | undefined): T | undefined => {
  try {
    return fn()
  } catch {
    return undefined
  }
}

// runArena에 넘길 조회 함수. 과제마다 한 번씩 미리 불러 둔다 (못 찾으면 runArena가 errors로 보고)
export function taskData(tasks: Task[]) {
  const snapshots = new Map<string, Snapshot>()
  const observations = new Map<string, Observation>()
  for (const task of tasks) {
    const l = loaders[task.family]
    if (!l) continue
    // 못 찾으면 비워 둔다: 스냅샷이 없으면 runArena가 오류로 남기고, 관측이 없으면 답만 받고 채점은 건너뛴다
    const snapshot = attempt(() => l.snapshot(task))
    const obs = attempt(() => l.observation(task))
    if (snapshot) snapshots.set(task.snapshotId, snapshot)
    if (obs) observations.set(task.id, obs)
  }
  return {
    snapshots: [...snapshots.values()],
    getSnapshot: (id: string) => snapshots.get(id),
    getObservation: (task: Task) => observations.get(task.id),
  }
}

// 저장된 모델 응답 (fixtures/arena/runs.json). 없으면 빈 배열
export function loadSavedRuns(): ArenaRun[] {
  const p = path.join(process.cwd(), 'fixtures', 'arena', 'runs.json')
  if (!fs.existsSync(p)) return []
  const j = JSON.parse(fs.readFileSync(p, 'utf8'))
  return Array.isArray(j.runs) ? (j.runs as ArenaRun[]) : []
}
