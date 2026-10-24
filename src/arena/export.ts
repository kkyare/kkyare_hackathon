// 납품: TaskPack(JSON), RL 파이프라인용 JSONL, 데이터 카드(Markdown)
import type { Family, FamilyId, Observation, Snapshot, Task, TaskPack } from '../core/types'
import type { Cell } from './scoreboard'

export const PRICE_PER_TASK_USD = 100      // PLAN 9-4 가정값 (시장 하단)

export interface BuildTaskPackOptions {
  snapshots: Snapshot[]                     // 가진 스냅샷 전부를 넘겨도 된다. 과제가 참조하는 것만 담는다
  resolutionFor?(task: Task): Observation | undefined   // 과제의 정답 관측 (같은 관측소라도 시나리오마다 다를 수 있어 과제 단위로 받는다)
  holdout?: boolean                         // 비공개 평가셋: 정답(관측)을 빼고 보낸다
  id?: string
  region?: string
  demo?: boolean
}

const day = (iso: string) => iso.slice(0, 10)

export function buildTaskPack(tasks: Task[], opts: BuildTaskPackOptions): TaskPack {
  if (tasks.length === 0) throw new Error('no tasks to export')
  const byId = new Map(opts.snapshots.map(s => [s.id, s]))
  const missing = [...new Set(tasks.map(t => t.snapshotId))].filter(id => !byId.has(id))
  if (missing.length) throw new Error(`missing snapshots: ${missing.join(', ')}`)

  const snapshotIds = new Set(tasks.map(t => t.snapshotId))
  // resolutions[i]는 tasks[i]의 t0 ~ resolveAt 구간 관측 (못 찾으면 hourly 빈 배열)
  const resolutions = !opts.holdout && opts.resolutionFor ? tasks.map(t => resolutionSlice(t, opts.resolutionFor!(t))) : undefined
  const includesResolution = !!resolutions?.some(o => o.hourly.length > 0)
  const t0s = tasks.map(t => t.t0).sort()
  const families = [...new Set(tasks.map(t => t.family))] as FamilyId[]

  return {
    id: opts.id ?? `pack-${day(t0s[0])}-${tasks.length}`,
    families,
    tasks,
    snapshots: opts.snapshots.filter(s => snapshotIds.has(s.id)),
    ...(includesResolution && { resolutions }),
    meta: {
      count: tasks.length,
      marketValueUsd: tasks.length * PRICE_PER_TASK_USD,
      period: `${day(t0s[0])} ~ ${day(t0s.at(-1)!)}`,
      region: opts.region ?? 'Central Iowa, US (DSM)',
      demo: opts.demo ?? true,
      includesResolution,
    },
  }
}

function resolutionSlice(task: Task, obs: Observation | undefined): Observation {
  const from = Date.parse(task.t0), to = Date.parse(task.resolveAt)
  return {
    stationId: obs?.stationId ?? task.field.stationId,
    hourly: (obs?.hourly ?? []).filter(h => Date.parse(h.time) >= from && Date.parse(h.time) <= to),
  }
}

// 정답 라벨: 패밀리 score()로 판정한 이진 사건 결과. Python 쪽(verifiers)이 규칙을 다시 구현하지 않게 미리 붙인다
export interface Label { outcome: 0 | 1 }

export function labelOf(family: Family, task: Task, obs: Observation, snapshot: Snapshot): Label | undefined {
  // p = 0으로 채점하면 brier = (0 - y)² = y
  const s = family.score(task, { taskId: task.id, model: 'label', probability: 0, rationale: '', toolCalls: [] }, obs, snapshot)
  if (s.outcome === 0 || s.outcome === 1) return { outcome: s.outcome }
  if (typeof s.brier === 'number') return { outcome: s.brier > 0.5 ? 1 : 0 }
  return undefined
}

// 한 줄 = 과제 하나. 입력(t0 스냅샷)을 같이 넣어 줄 단위로 독립 실행되게 하고, 정답(관측·라벨)이 있으면 붙인다.
export function toJsonl(pack: TaskPack, labels: Map<string, Label> = new Map()): string {
  const snaps = new Map(pack.snapshots.map(s => [s.id, s]))
  return pack.tasks.map((t, i) => {
    const resolution = pack.resolutions?.[i]
    const label = labels.get(t.id)
    return JSON.stringify({
      id: t.id, family: t.family, prompt: t.prompt, t0: t.t0, resolveAt: t.resolveAt,
      field: t.field, context: t.context, snapshot: snaps.get(t.snapshotId),
      ...(pack.meta.includesResolution && resolution && { resolution }),
      ...(pack.meta.includesResolution && label && { label }),
    })
  }).join('\n') + '\n'
}

const FAMILY_LABEL: Record<FamilyId, string> = {
  downscaling: '초국지 다운스케일링 (CRPS)',
  nowcasting: '나우캐스팅 (결정 손익 + Brier)',
  s2s: 'S2S·계절 (3분위 Brier)',
  decision: '의사결정·가격 (오라클 대비 regret)',
}

const fmt = (x: number | undefined, digits = 3) => (typeof x === 'number' ? x.toFixed(digits) : '-')

// Hugging Face 데이터셋 카드 형식 (Markdown)
export function dataCard(pack: TaskPack, baseline: Cell[] = []): string {
  const counts = pack.families.map(f => `| ${FAMILY_LABEL[f]} | ${pack.tasks.filter(t => t.family === f).length} |`)
  const lines = [
    `# ${pack.id}`,
    '',
    pack.meta.demo ? '> **DEMO DATA** — 실제 데이터 형식에 맞춘 목업 시나리오입니다.' : '',
    '',
    '## 개요',
    `- 과제 수: ${pack.meta.count}`,
    `- 기간: ${pack.meta.period}`,
    `- 지역: ${pack.meta.region}`,
    `- 정답(관측) 포함: ${pack.meta.includesResolution ? '예 (공개 피드)' : '아니오 (비공개 평가셋)'}`,
    `- 시장가 추정: $${pack.meta.marketValueUsd.toLocaleString('en-US')} (과제당 $${PRICE_PER_TASK_USD}, **가정**)`,
    '',
    '## 과제 패밀리',
    '| 패밀리 (채점) | 과제 수 |',
    '|---|---|',
    ...counts,
    '',
    '## 데이터 출처',
    '- 예보: Open-Meteo Single Runs API (HRRR, NBM, ECMWF IFS/AIFS, GFS), NOAA CPC 전망',
    '- 실측: Iowa Environmental Mesonet ASOS (knot → mph ×1.151, 결측은 null)',
    '- 단위: °F, mph, inch, acre, USD. 시각은 UTC ISO 8601',
    '',
    '## 누출 방지',
    '- 과제 입력은 t0 시점 스냅샷뿐이다: t0 이전 발표 예보 런, t0 이전 관측',
    '- 에이전트 도구는 t0 이후 데이터를 반환하지 않고, 요청 시도는 `leakFlags`로 기록한다',
    '- 정답은 t0 이후 실제 관측으로 확정되므로 사전학습 데이터에 있을 수 없다',
    '',
    '## 채점',
    '- Brier·CRPS·regret은 낮을수록 좋다. skill은 1 = 완벽, 0 = 원천 예보를 그대로 쓴 수준, 음수 = 그보다 나쁨',
  ]
  if (baseline.length) {
    lines.push(
      '',
      '## Baseline (Arena)',
      '| 모델 | 패밀리 | n | Brier | CRPS | regret $ | skill |',
      '|---|---|---|---|---|---|---|',
      ...baseline.map(c => `| ${c.model} | ${c.family} | ${c.n} | ${fmt(c.brier)} | ${fmt(c.crps)} | ${fmt(c.regretUsd, 1)} | ${fmt(c.skill, 2)} |`),
    )
  }
  return lines.filter((l, i, a) => !(l === '' && a[i - 1] === '')).join('\n') + '\n'
}
