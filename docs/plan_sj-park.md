# 성제 작업 플랜 — Arena + 납품

- 기준: `PLAN.md` 5절(역할), 7절(파일 주인), 8절(일정), 9절(합의안), `src/core/types.ts`
- 데모 장면: 2:05 **Arena**(Claude Haiku/Sonnet/Opus 비교, 점수표·보정 곡선, "최고 모델도 틀린다"), 2:35 **납품**(과제 묶음 내보내기)
- 진행하면서 체크박스를 채운다.

## 내 파일

| 파일/폴더 | 내용 |
|---|---|
| `src/core/tools.ts` | 에이전트 도구. **t0 이전 정보만 반환** |
| `src/core/agent.ts` | Claude 실행기. tool use 루프 → `Answer` |
| `src/arena/` | Arena 로직(실행·집계·보정 곡선·누출 감사) — 화면/라우트와 분리해 테스트 |
| `src/app/arena/`, `src/app/api/arena/` | Arena 화면, `POST /api/arena/run` |
| `src/app/export/`, `src/app/api/export/` | 납품 화면, `POST /api/export` |
| `fixtures/arena/` | 저장된 모델 응답 (키 없을 때·결과 흔들릴 때) |
| `py/verifiers_env/` | P1 verifiers 패키지 |

## 의존

- `types.ts` (완료, 9절) — `Answer.toolCalls = { name, args, at }[]`, `Score.leakFlags: string[]`, `TaskPack.meta.demo`
- 패밀리 `score(task, answer, obs, snapshot)` (성호·유진) — Arena는 직접 채점하지 않고 이걸 부른다
- `snapshot.ts`·fixtures (성호) — 0:45 전에는 `src/core/__fixtures__/`의 미니 스냅샷으로 개발
- 뼈대·패키지 (영모) — 그 전에는 `package.json`을 커밋하지 않는다

## 단계

### 1. `tools.ts` + 누출 테스트 (0:15-0:45)
- [x] `makeTools(task, snapshot)` → `{ definitions, call(name, args), calls, leakAttempts }`
  - `get_field_info()` — 필지 정보
  - `list_forecast_models()` — 스냅샷 안 예보 모델·발표 시각
  - `get_forecast({ model, from?, to? })` — `issuedAt <= t0`인 런만
  - `get_observations({ from?, to? })` — `time < t0` 관측만
- [x] 방어는 두 겹: (1) 스냅샷에 t0 이후 데이터가 섞여 있어도 걸러 냄 (2) t0 이후 구간 요청은 잘라내고 `leakAttempts`에 기록
- [x] vitest: 어떤 인자로도 t0 이후 관측·t0 이후 발표 예보가 나오지 않음

### 2. `agent.ts` (0:15-0:45)
- [x] `runAgent({ task, snapshot, model, answerSchema, client? }) → { answer, leakAttempts, usage }`
- [x] 도구 루프(최대 8턴, 마지막 턴·도구 없이 끝난 다음 턴은 제출 강제) → `submit_answer` 도구(입력 스키마 = 패밀리 `answerSchema`의 JSON Schema)로 종료
- [x] `submit_answer` 입력을 `answerSchema`로 검증, 실패하면 오류를 돌려주고 한 번 더
- [x] 모델 ID: `claude-haiku-5-5`, `claude-sonnet-5-5`, `claude-opus-5-5`. 키는 서버에서만
- [x] vitest: 가짜 client로 도구 호출 → 제출 흐름, `toolCalls` 기록
- [ ] 실제 키로 3모델 스모크 테스트 (키 받으면)

### 3. Arena 실행·점수표 (0:45-2:00)
- [x] `src/arena/run.ts`: 과제 × 모델 실행(동시 3개 제한) → 패밀리 `score()` → `leakAttempts`를 `leakFlags`에 합침
  - 진행 이벤트(`start/answer/score/error`)로 스트리밍, 실패는 `errors`로 모으고 계속
  - `replayRunner(saved)`(저장 기록 재생), `withFallback(실제, saved)`(실패 시 대체)
- [x] `POST /api/arena/run` `{ tasks, models? }` → `{ answers, scores, errors, live, replayed }`. `?mock=1`이거나 키가 없으면 `fixtures/arena/runs.json`
  - 실제 호출이 실패하면 저장 응답으로 대체, 하나라도 대체되면 `live: false` (LIVE 배지는 실제 호출만)
  - 과제별 스냅샷·관측 연결은 `src/arena/data.ts`: 나우캐스팅·다운스케일링·서리 결정·S2S 4개 모두 (`src/arena/families.test.ts`). `taskIds`는 아직 미지원
  - S2S는 t0 예보 런이 없어 빈 스냅샷 → 에이전트가 CPC 전망을 도구로 볼 수 없음 (도구 추가는 성호님과 상의)
- [ ] `/arena` 화면: 모델 레인 3개(도구 호출 로그·확률·결정·실측·점수), LIVE/DEMO DATA 배지
- [x] 점수표 집계 `src/arena/scoreboard.ts`: 모델 × 패밀리 (Brier·CRPS·regret $·skill·정답률·누출 수)
- [ ] 점수표 화면
- [ ] 실제 키로 3모델 한 번 돌려 `fixtures/arena/`에 저장
- [x] **2:00 1차 합치기**: 나우캐스팅으로 generate → run → score 한 바퀴 (`src/arena/integration.test.ts`, 예보 복사 답은 skill 0 확인)

### 4. 보정 곡선·리더보드·누출 감사 (2:00-3:30)
- [x] `src/arena/calibration.ts`: 10구간 binning, 모델별 (예측 확률, 실제 빈도, 개수) + Brier 분해(reliability·resolution·uncertainty)
  - 실제 결과는 `Score.outcome`(types.ts에 추가), 없으면 brier에서 역산
- [ ] 보정 곡선(Recharts) + 대각선
- [x] 리더보드 집계: `leaderboard()`(패밀리별 평균 skill을 다시 평균), `topModelMissRate()`
- [ ] 리더보드 화면: "최고 모델도 틀린 과제 비율" 강조
- [x] 누출 감사 로직 `src/arena/leakAudit.ts`: 도구 기록 집계 + Claude(`report_audit` 강제)로 rationale 검사 → `audit:future_knowledge`, `applyAudit`, 모델별 요약
- [ ] 누출 감사 화면: 적발 카드

### 5. 납품 (2:00-3:30)
- [x] `src/arena/export.ts`: `buildTaskPack(tasks, { snapshots, resolutions?, holdout })` — `meta.marketValueUsd = 과제 수 × $100`(9-4 가정), `demo: true`
  - 과제가 참조하는 `snapshots`를 반드시 포함 (묶음만으로 재현)
  - 공개 피드는 `resolutions` 포함·`includesResolution: true`, 비공개 평가셋(holdout)은 빼고 `false`
  - `resolutions[i]` = `tasks[i]`의 t0~resolveAt 관측 (같은 관측소라도 시나리오마다 달라 과제 단위로 담음)
- [x] JSONL `toJsonl(pack)`: 한 줄 = 과제 + 스냅샷 (+ t0~resolveAt 관측)
- [x] `POST /api/export?format=json|jsonl|card&holdout=1&download=1` `{ tasks, scores? }` → TaskPack JSON / JSONL / 데이터 카드
- [x] 데이터 카드 `dataCard(pack, baseline)` (Markdown)
- [ ] 데이터 카드 화면: 출처(Open-Meteo·IEM ASOS·NOAA CPC), 기간·지역, 패밀리별 개수, 누출 방지 방식, Arena baseline 점수, "가정" 표시

### 6. P1 verifiers (3:30-4:00)
- [x] `py/verifiers_env/`: TaskPack JSONL 로드, `load_environment()` (`SingleTurnEnv`)
  - 이진(나우캐스팅·서리 결정): `scoring.ts reward()`와 같은 -(regret/L) - 0.5·Brier, 분위수(다운스케일링): CRPS 스킬 [-1, 1], + 0.1·형식. 형식 위반은 최저점
  - 정답은 내보내기 JSONL의 `label`(이진 `outcome`, 다운스케일링 `value`·`reference`, TS 패밀리 함수로 계산, holdout이면 빠짐) — Python이 패밀리 규칙을 다시 구현하지 않게
  - 샘플 `data/sample.jsonl`: 나우캐스팅 12 + 다운스케일링 6 + 서리 결정 6 (DEMO DATA)
- [x] CRPS 보상 (다운스케일링)
- [ ] `prime env push`
- [ ] 안 되면 JSON 내보내기로 충분

## 검증
- `vitest` — 누출 테스트, agent 가짜 client 테스트, calibration·export 단위 테스트
- `?mock=1`로 `/arena`, `/export`가 키 없이 끝까지 뜸
- 실제 키로 3모델 × 소량 과제 → 점수표·보정 곡선 채워짐
- 내보낸 TaskPack을 다시 읽어 `score()` 재현
