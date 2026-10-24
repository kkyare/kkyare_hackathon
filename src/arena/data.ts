// Arena가 과제의 스냅샷·정답 관측을 찾는 곳. 패밀리마다 fixtures 구조가 달라 여기서 한 줄씩 연결한다.
import * as fs from 'node:fs'
import * as path from 'node:path'
import { loadObservationForTask, loadSnapshotForTask } from '../families/nowcasting/index'
import type { FamilyId, Observation, Snapshot, Task } from '../core/types'
import type { ArenaRun } from './run'

interface TaskData { snapshot(task: Task): Snapshot; observation(task: Task): Observation }

const loaders: Partial<Record<FamilyId, TaskData>> = {
  nowcasting: { snapshot: loadSnapshotForTask, observation: loadObservationForTask },
}

// runArena에 넘길 조회 함수. 과제마다 한 번씩 미리 불러 둔다 (못 찾으면 runArena가 errors로 보고)
export function taskData(tasks: Task[]) {
  const snapshots = new Map<string, Snapshot>()
  const observations = new Map<string, Observation>()
  for (const task of tasks) {
    const l = loaders[task.family]
    if (!l) continue
    try {
      snapshots.set(task.snapshotId, l.snapshot(task))
      observations.set(task.id, l.observation(task))
    } catch {
      // 스냅샷·관측을 못 찾은 과제는 runArena에서 오류로 남는다
    }
  }
  return {
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
