// 공통 데이터 형식. PLAN.md 9절 합의안. 필드 추가는 자유, 이름 변경·삭제는 팀에 먼저 알리기.
// 단위: 기온 °F, 풍속 mph, 강수 inch, 면적 acre, 고도 m, 돈 USD. 시각은 ISO 8601 UTC.

export type FamilyId = 'downscaling' | 'nowcasting' | 's2s' | 'decision'
export type ModelId = string            // 'claude-haiku-5-5' | 'claude-sonnet-5-5' | 'claude-opus-5-5' | ...

export interface Field {
  id: string; name: string; farmId: string
  lat: number; lon: number; elevationM: number
  acres: number; crop: 'corn' | 'soybean' | 'orchard'
  stationId: string                     // 가장 가까운 ASOS (예: 'DSM')
  terrain?: 'valley' | 'flat' | 'ridge' // 냉기 고임 보정용
}

export interface HourlyPoint {
  time: string
  tempF: number | null; dewF?: number | null
  windMph: number | null; gustMph: number | null; windDirDeg?: number | null
  precipIn: number | null
}

export interface ForecastRun { model: string; issuedAt: string; gridElevationM?: number; hourly: HourlyPoint[] }

export interface Snapshot {                // t0 시점에 알 수 있었던 것만
  id: string; t0: string; fieldId: string
  forecasts: ForecastRun[]
  obsUntilT0: HourlyPoint[]
}

export interface Observation { stationId: string; hourly: HourlyPoint[] }

export interface Task {
  id: string; family: FamilyId
  t0: string; resolveAt: string
  field: Field; snapshotId: string
  prompt: string
  context: { costUsdPerAcre?: number; lossUsdPerAcre?: number; thresholdF?: number; rules?: Record<string, number> }
  difficulty?: 'easy' | 'medium' | 'hard'
}

export interface Answer {
  taskId: string; model: ModelId
  probability?: number                      // 이진 사건 확률 (0-1)
  quantiles?: { q: number; value: number }[] // 연속 변수 분포 (q: 0.1, 0.5, 0.9 ...)
  terciles?: [number, number, number]       // S2S: [below, near, above], 합 1
  decision?: string                         // 'protect' | 'none' | 'spray' | 'delay' ...
  rationale: string
  toolCalls: { name: string; args: unknown; at: string }[]
}

export interface Score {
  taskId: string; model: ModelId; family: FamilyId
  brier?: number; crps?: number
  regretUsd?: number; costUsd?: number; oracleCostUsd?: number
  skill: number
  correct?: boolean
  leakFlags: string[]
  resolvedWith?: { stationId: string; at: string }   // 어떤 관측으로 채점했는지 (재현성)
}

export interface TaskPack {
  id: string; families: FamilyId[]; tasks: Task[]
  snapshots: Snapshot[]                     // 과제 입력(t0 예보)을 묶음만으로 재현하기 위해 포함
  resolutions?: Observation[]               // 공개 피드에만 포함, 비공개 평가셋은 뺌
  meta: { count: number; marketValueUsd: number; period: string; region: string; demo: boolean; includesResolution: boolean }
}

export type Peril = 'frost' | 'hail' | 'excess_rain' | 'drought'

export interface Claim { id: string; fieldId: string; peril: Peril; date: string; claimedLossUsd: number }

export interface ClaimReport {
  claimId: string; peril: Peril
  conditionProbability: number              // 피해 조건이 실제로 있었을 확률
  verdict: 'supported' | 'unclear' | 'not_supported'
  evidence: {
    fieldEstimate: { variable: string; value: number; sigma: number; unit: string }
    nearbyObs: { stationId: string; value: number | null; unit: string }
    forecastAtT0?: { model: string; value: number | null; unit: string }[]
  }
  explanation?: string                      // Claude 해설 (선택)
}

export interface RiskScore { fieldId: string; peril: Peril; season: string; score: number /* 0-100 */; drivers: string[] }

export interface Family {
  id: FamilyId
  generate(opts: { fields: Field[]; snapshots: Snapshot[]; count?: number }): Task[]
  answerSchema: import('zod').ZodTypeAny
  score(task: Task, answer: Answer, obs: Observation, snapshot: Snapshot): Score
}
