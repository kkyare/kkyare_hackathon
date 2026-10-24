# 간이 기획 - Weather Decision Gym (가칭)

- 작성자: 홍유진 · 2026-10-24
- 기준 문서: **`attentionx-weather-rl-gym.md`**. 이 문서는 그 안을 4명이 5시간에 만드는 계획이다.
- 참고: `docs/team_plan_draft.md`(화면·UI 참고), `docs/research_*`

## 1. 무엇을 만드나

**실제 날씨로 "맞았는지"를 자동 판정하는 엔진.** 같은 엔진으로 두 고객에게 판다.

| 고객 | 우리가 판정하는 것 | 한 줄 |
|---|---|---|
| **RL 데이터 회사** (AfterQuery, Fleet AI, Mercor, Surge, Handshake, Scale 등) | AI 에이전트의 날씨 판단 | "AI를 채점하는 과제와 검증기" |
| **작물보험사** (미국 작물보험 인수사, 재보험사) | 농장의 피해 청구 | "그날 그 필지에 정말 서리·우박·폭우가 있었나" |

- 정답 도메인: 미국 대형농 (선언 타깃). 관측은 IEM ASOS, 예보는 ECMWF·NOAA·Open-Meteo
- 왜 날씨인가: 결과가 **반드시·수치로·매시간·모든 지점에서** 확정되고, 미래 사건이라 오염이 불가능하다
- 3번 트랙 조건("미국 RL Eval·데이터 회사가 돈 내고 쓸 서비스")은 첫 번째 고객으로 충족하고, 보험사는 **누구나 바로 이해하는 두 번째 매출**로 보여 준다

## 2. 수익 모델

### 고객 ① RL 데이터 회사 - 데이터 회사의 문제를 푼다
| 그들의 문제 | 우리가 주는 것 |
|---|---|
| 원가: 전문가 라벨에 매출의 60-70%가 나감 | 정답을 날씨가 무료로 줌 |
| 공급: 자동 채점·무오염·매일 새 과제가 수학·코드 밖엔 없음 | 4개 시장 과제를 무한 생성 |
| 품질: 꼼수·누출·확률 보정 문제 | 누출 감사, 스킬 점수, Brier/CRPS |

**과금:** 과제 묶음(과제당 $50-300 볼륨가, 시장 단가 $200-2,000 대비 하단) / 생성·검증 콘솔 구독 / 비공개 평가셋 / 맞춤 환경(6자리 $, 독점 4-5배)

### 고객 ② 작물보험사 - 청구 검증과 리스크 점수
- 근거: 2001-2022년 미국 작물보험금의 약 73%($118.7B)가 가뭄·습해·우박·폭염·서리 등 날씨 원인(EWG/USDA). 2025 작물년도 보험금 약 $11.5B(RMA, 2026.9 기준)
| 상품 | 내용 | 과금 (가정) |
|---|---|---|
| **청구 검증 리포트** | 청구된 필지·날짜에 대해 필지 보정 기온·강수·바람 + 인근 관측 + 당시 예보를 묶은 근거 리포트, "피해 조건 충족 확률" | 청구 건당 |
| **필지 리스크 점수** | 필지별 서리·폭우·가뭄 위험 점수 (언더라이팅·포트폴리오 관리) | 에이커당 연 / API 호출 |
| 지수형 트리거 데이터 (P2) | 필지 단위 지수 산출 | 계약 |
- 정직하게: 기상 기록으로 보험료를 할인해 준 근거는 못 찾았다. 우리는 **"보험료 절감"이 아니라 "손해사정 시간 단축과 근거 강화"**를 판다. 보험사 구매 의사는 아직 검증 전이다.

### 농장 - 데이터가 쌓이는 곳 (해자)
- 농장에는 필지 단위 예보·작업 판단을 무료/할인으로 주고, 동의를 받아 결과 데이터(필지 실측, 작업 기록, 수확량, 피해)를 받는다. 연동: John Deere Operations Center 등 농장주 권한 기반 API, 데이터 제공 농장에 수익 공유
- **플라이휠:** 농장 연결 ↑ → 판단-결과 데이터 ↑ → 모델 정확도·고유 과제 ↑ → 데이터 회사·보험사 매출 ↑ → 농장에 주는 가치 ↑
- **해자:** 공개 데이터 과제는 따라 할 수 있지만, **농장의 판단-결과 데이터는 따라 할 수 없다**

```
 RL 데이터 회사 ◀── 과제·검증기 ──┐                ┌── 청구 검증·리스크 점수 ──▶ 작물보험사
                                  │   판정 엔진     │
                                  └──  (우리)  ─────┘
                                         ▲  │ 필지 예보·작업 판단
                          결과 데이터 축적 │  ▼
                                       미국 대형농
```

## 3. 워크플로 (모든 기능이 공유하는 뼈대)

```
① 과제/청구 입력 ─▶ ② 판단 (AI 에이전트) ─▶ ③ 실제 날씨 확정 ─▶ ④ 검증기 ─▶ ⑤ 아카이브 ─▶ ⑥ 판매
 t0 스냅샷만 공개     도구로 예보·관측·       (IEM ASOS)          Brier/CRPS      정답 확정       RL: 과제 묶음·평가셋
 (누출 방지)         필지 조회 후                                regret·스킬     기록 누적       보험: 청구 검증·리스크 점수
                    확률+결정 제출
```
- **같은 검증기가 두 고객에게 쓰인다.** AI의 판단을 실측으로 채점하는 것 = 보험 청구를 실측으로 검증하는 것.

## 4. 과제 패밀리 4개 (4개 시장)

| 패밀리 | 과제 예시 | 정답 확정 | 채점 | 보험사 쓰임 |
|---|---|---|---|---|
| **① 초국지 다운스케일링** | "A필지 내일 최저기온 분포를 제시하라" | 1일 | CRPS + 스킬 | 필지 단위 피해 조건 재구성 (청구 검증의 핵심) |
| **② 나우캐스팅** | "지금 살포 vs 3시간 연기", "수확 강행 vs 대기" | 1-6시간 | 결정 손익 + Brier | 작업 시점 기록 → 비산 분쟁 근거 |
| **③ S2S·계절** | "3주 뒤 파종 적기", "다음 달 관개 용수 확보량" | 2-6주 | 3분위 Brier (NOAA CPC 전망 형식) | 시즌 리스크 점수 |
| **④ 의사결정·가격** | "오늘 밤 서리 방제할까"(비용-손실), "서리 지수보험 보험료 산정" | 다양 | 오라클 대비 regret | 보험료·지수 산정 |

서리 방제 채점 예: 방제 비용 C = $120/acre, 피해 L = $1,200/acre (**가정값, 화면에도 "가정" 표시**) → P(서리) > C/L = 0.10 이면 방제가 최적. 보상 = −regret(정규화) + λ·(−Brier)

## 5. 역할 (4명)

| 담당 | 맡는 일 | 데모 장면 |
|---|---|---|
| **영모님** | 전체 화면 흐름과 셸 UI, **자동 생성 대시보드**(4개 패밀리 일괄 생성, 시장가 $ 카운터), **보험사 콘솔**(청구 입력 → 검증 리포트, 필지 리스크 점수 화면), **Time Machine 지도**, 데모 진행·PPT 총괄 | 자동 생성, 보험 청구 검증, Time Machine |
| **성제님** | **Arena 전담**: 에이전트 실행기(`core/agent.ts`), 모델 비교, 점수표, 보정 곡선, 리더보드, 누출 감사 / RL 데이터 회사 납품(JSON·데이터 카드, P1: verifiers 패키지 + Hub 공개) | Arena, 납품 |
| **성호님** | **② 나우캐스팅** + 살포 규칙 + **목업 데이터 총괄**(예보 스냅샷·관측·필지 fixtures를 같은 형식으로 제작, P1: 라이브 과제) / **③ S2S**(NOAA CPC 전망 수집·파싱) / 날씨 수집(`core/weather.ts`, `core/snapshot.ts`) | 라이브 채점 |
| **유진님** | **① 다운스케일링** + **④ 의사결정·보험 엔진**(서리 비용-손실, 청구 검증 판정, 리스크 점수 계산) / 채점(`core/scoring.ts`) / P2: 농장 연결 화면(데이터가 늘수록 오차가 줄어드는 곡선, 백테스트 수치) | 서리 결과, 청구 검증 엔진 |

- 화면은 영모님이 셸·대시보드·보험사 콘솔·지도를 맡고, 다른 세 명은 각자 엔진 + 자기 장면 카드를 붙인다.
- verifiers 패키지는 P1. 먼저 끝난 사람이 돕고, 안 되면 JSON 내보내기로 충분.

## 6. 데모 (3분)

| 시간 | 장면 | 담당 | 메시지 |
|---|---|---|---|
| 0:00 | 문제 | 영모 | "날씨 때문에 미국 작물보험금 73%가 나가고, AI 랩은 자동 채점되는 실세계 과제가 없다. 둘 다 '실제 날씨로 맞았는지 판정'이 필요하다" |
| 0:20 | **자동 생성**: 4개 패밀리 과제 수백 개, $ 카운터 | 영모 | "사람 라벨 0명" |
| 0:45 | **Arena**: Claude Haiku/Sonnet/Opus 비교, 점수표·보정 곡선 | 성제 | "최고 모델도 틀린다 = 데이터 회사가 사는 이유" |
| 1:20 | **채점 과정**: 과제 발행 → 시간이 흐르고 실측이 도착 → 자동 채점되는 흐름을 재생 | 성호 | "채점자는 사람이 아니라 실제 날씨다" |
| 1:45 | **보험 청구 검증**: "6/12 A필지 서리 피해 청구" → 필지 보정 최저기온 분포 + 관측 + 당시 예보 → 검증 리포트 | 영모·유진 | "같은 엔진이 보험 청구를 몇 초 만에 검증한다" |
| 2:15 | Time Machine / 서리 결과 카드 | 영모·유진 | "필지 단위로, 확률과 돈으로" |
| 2:35 | **납품**: 과제 묶음 내보내기 | 성제 | "오늘 바로 데이터 회사에 보낼 수 있다" |
| 2:50 | 마무리 | 영모 | "데이터 회사와 보험사에 팔고, 농장과는 연결을 잇습니다. 농장 데이터가 쌓일수록 우리 판정은 더 정확해집니다." |

**데모는 목업 데이터로 진행한다** (아래 "데이터 방침"). 화면에 **DEMO DATA** 배지를 붙이고, Claude 호출처럼 실제로 돌린 부분만 **LIVE**로 표시한다. 시간이 넘치면 Time Machine → 서리 카드 순으로 줄인다.

### 데이터 방침 (데모)

- **기본은 목업 데이터.** 모든 화면과 데모는 `fixtures/`만으로 끝까지 돈다. 외부 API가 죽어도 데모는 멈추지 않는다.
- **목업은 실제 데이터 형식 그대로 만든다.** Open-Meteo 응답, IEM ASOS 관측, NOAA CPC 전망의 필드·단위를 따라 해서, 나중에 실데이터로 바꿔 끼우기만 하면 되게 한다. 가능하면 실제 과거 데이터(2026년 6월 아이오와)를 미리 받아 fixtures로 저장한다.
- **시나리오를 의도적으로 만든다:** 서리가 있었던 날·없었던 날, 돌풍으로 살포가 막힌 날, 예보와 실측이 갈린 날, 보험 청구가 맞는 경우·안 맞는 경우.
- **실제로 돌리는 것:** Claude 호출(에이전트 판단, 청구 검증 해설)은 실제로 돌려도 비용이 작다. 결과가 흔들리면 저장한 응답으로 대체.
- **정직하게:** 화면에 DEMO DATA 배지. 발표에서 "실제 날씨 데이터로 동작하도록 만든 엔진을 목업 시나리오로 시연한다"고 말한다. 실데이터 연결(Single Runs API, CPC, IEM)은 P1이며 9-10절에 확인 결과가 있다.

## 7. 합치기 쉬운 구조

```
src/
  core/
    types.ts        ← 공통 데이터 형식 (9절)                    [4명 합의]
    weather.ts      ← Open-Meteo·CPC·IEM 수집, 캐시              [성호]
    snapshot.ts     ← t0 스냅샷 (Single Runs API만, 누출 방지)    [성호]
    tools.ts        ← 에이전트 도구, t0 이전 정보만 반환           [성제]
    agent.ts        ← Claude 실행기, 확률+결정 구조화 출력         [성제]
    scoring.ts      ← Brier, CRPS, regret, 오라클, 스킬            [유진]
  families/
    downscaling/  decision/   [유진]     nowcasting/  s2s/   [성호]
  insurance/        ← 청구 검증·리스크 점수 로직                  [유진]
  app/
    page.tsx(대시보드)  insurance/  timemachine/                 [영모]
    arena/  export/                                              [성제]
    live/                                                        [성호]
  components/ui/    ← shadcn 공용                                [영모, 처음에 설치]
fixtures/           ← 패밀리·청구별 가짜 데이터
py/verifiers_env/   ← P1
```

- 패밀리는 같은 인터페이스만 지키면 Arena·대시보드·납품에 자동으로 붙는다:
  ```ts
  interface Family {
    id: 'downscaling' | 'nowcasting' | 's2s' | 'decision'
    generate(opts): Task[]
    answerSchema: ZodSchema
    score(task, answer, observation): Score
  }
  ```
- 보험 청구 검증도 같은 재료를 쓴다: `verifyClaim(claim) = 필지 보정(①) + 관측 + 당시 스냅샷 → 조건 충족 확률 + 근거`
- 겹치는 파일은 `core/types.ts`와 `src/families/index.ts`(각자 한 줄 등록)뿐. 각 화면은 `?mock=1`이면 fixtures로 뜬다.

### 파일 주인 (겹치지 않게)

| 영역 | 주인 | 비고 |
|---|---|---|
| `package.json`, lock 파일, 설정 파일 | 영모 | 뼈대 때 10절 버전 표의 패키지를 **전부 한 번에 설치**해서 올린다. 추가가 필요하면 그때만 따로 올림 |
| `app/layout.tsx`, `app/nav.ts`, `components/ui/` | 영모 | 메뉴는 `nav.ts` 배열에 각자 한 줄씩 추가 |
| `api/insurance/`, `api/families/downscaling/`, `api/families/decision/` | 유진 | 영모님 화면(보험사 콘솔·지도)은 이 API를 호출만 함 |
| `api/families/nowcasting/`, `api/families/s2s/`, `api/live/` | 성호 | |
| `api/arena/`, `api/export/`, `py/` (verifiers) | 성제 | verifiers는 다른 사람이 도와도 주인은 성제님 |
| `fixtures/` | 영역별 폴더 | `fixtures/downscaling/`, `fixtures/insurance/`, `fixtures/nowcasting/`처럼 담당 영역별로 나눔 |
| 환경 변수 | 영모 | `.env.example`만 커밋, `.env.local`은 커밋 금지, 키는 팀 채팅으로 공유 |
| `core/types.ts`, `families/index.ts` | 공용 | 필드 추가는 자유, 이름 변경·삭제는 먼저 알리고 |

## 8. 일정 (5시간)

| 시간 | 영모 | 성제 | 성호 | 유진 |
|---|---|---|---|---|
| 0:00-0:15 | **4명: `types.ts`·`Family` 인터페이스·보험 청구 형식 합의** | | | |
| 0:15-0:45 | 버전 고정 뼈대, 셸 UI, Vercel 배포 | `agent.ts`, `tools.ts` | `weather.ts`, `snapshot.ts`, **목업 데이터 형식·첫 fixtures** | `scoring.ts` + 경계값 테스트 |
| 0:45 | **core 머지 + 목업 fixtures 1차** → 모두 fixtures로 개발 시작 | | | |
| 0:45-2:00 | 대시보드(자동 생성, $ 카운터) | Arena 실행·점수표 | 나우캐스팅 생성기 + 살포 규칙 | 다운스케일링 생성기 + CRPS |
| 2:00 | **1차 합치기**: 패밀리가 Arena에서 도는지 | | | |
| 2:00-3:30 | 보험사 콘솔, Time Machine 지도 | 보정 곡선, 리더보드, 누출 감사, 내보내기 | S2S 생성기, 채점 과정 재생 화면, 시나리오별 fixtures(서리 있던 날·없던 날, 돌풍, 예보와 실측이 갈린 날) | 서리 비용-손실, 청구 검증·리스크 점수 엔진 |
| 3:30 | **2차 합치기**: 데모 순서대로 전체 1회 | | | |
| 3:30-4:00 | P1(verifiers, 농장 연결 화면, 실데이터 연결), 테스트 보강 | | | |
| 4:00 | **기능 동결** | | | |
| 4:00-4:30 | 데모 순서대로 전체 통과, fixtures 누락 점검 | | | |
| 4:30-5:00 | 리허설, PPT 2장 (영모님 총괄, 각자 장면 캡처 + 숫자 1개) | | | |

## 9. 공통 데이터 형식

```ts
Field        { id, name, lat, lon, acres, crop, stationId }
Snapshot     { t0, forecasts: { model, issuedAt, hourly[] }[], obsUntilT0[] }
Task         { id, family, t0, horizon, field, snapshotRef, prompt, context: { C?, L?, rules? }, resolveAt }
Answer       { taskId, model, probability | quantiles, decision, rationale, toolCalls[] }
Observation  { stationId, hourly: { time, tempF, windMph, gustMph, precipIn }[] }   // knot → mph ×1.151
Score        { taskId, model, brier?, crps?, regretUsd?, oracleCostUsd?, skill, leakFlags[] }
TaskPack     { id, families[], tasks: Task[], meta: { count, marketValueUsd, period, region } }
Claim        { id, fieldId, peril: 'frost'|'hail'|'excess_rain'|'drought', date, claimedLossUsd }
ClaimReport  { claimId, conditionProbability, evidence: { fieldEstimate, nearbyObs, forecastAtT0 }, verdict: 'supported'|'unclear'|'not_supported' }
RiskScore    { fieldId, peril, season, score, drivers[] }
```

## 10. 기술적으로 가능한가

| 필요한 것 | 해결 수단 | 비용·조건 | 위험 |
|---|---|---|---|
| 원천 예보 | **ECMWF Open Data**(IFS·AIFS, CC-BY 4.0), **NOAA GFS/GEFS**, **Open-Meteo** | 무료. Open-Meteo 무료 API는 비상업, 출처 표기 | 낮음 |
| 과거 시점 예보 (t0 스냅샷) | **Open-Meteo Single Runs API** `run=2026-06-10T12:00` (**확인됨**). HRRR 12Z, NBM, ECMWF IFS 00Z, AIFS, GFS는 `gfs_seamless` | 무료(비상업) | HRRR은 6시간 간격 런·49시간까지, IFS는 00Z만, AIFS는 돌풍 없음, `gfs_global`은 값 비어 있음. Historical Forecast API는 미래 정보가 섞여 **화면 표시용으로만** |
| S2S 예보 | **NOAA CPC 전망 아카이브** (6-10일·8-14일 매일, 3-4주 매주 금요일), 3구간 확률 (**확인됨**) | 무료 | Open-Meteo 과거 계절 런은 없음. CPC 형식 파싱 필요 |
| 실측 관측 | **Iowa Environmental Mesonet ASOS** | 무료, 키 없음 | 매시 :54 관측, 확인 시점 약 56분 전 값. knot → mph ×1.151, 돌풍 결측(M) 처리 |
| 에이전트·판정·해설 | **Claude API** (tool use, structured output) | API 키 | 낮음 |
| 모델 비교 | Claude Haiku/Sonnet/Opus 3종, 타사 모델은 키가 있으면 추가(평가 대상으로만) | | 키 없으면 Claude 3종 |
| 지도·차트·UI | deck.gl/MapLibre, Recharts, shadcn/ui, motion | 오픈소스 | 낮음 |
| RL 환경 패키징 | **Prime Intellect verifiers** + `prime env push` | 오픈소스, Hub 계정 | P1. 안 되면 JSON + 채점 함수 |
| 배포 | Vercel | 무료 | 낮음 |

**결론:** 모두 오픈 데이터·오픈소스·Claude API로 해결된다. 직접 만드는 것은 **과제 생성기, 청구 검증 로직, 검증기, 화면**이고 이것이 제품의 본체다. 데모 날짜 데이터는 0:45 전에 받아 `fixtures/`에 저장한다.

### 버전 고정 (4명 환경 통일)

2026-10-24 기준 npm·PyPI 조회. 나온 지 2주가 안 된 최신판은 피하고 직전 안정판으로 고정. `package.json`에는 `^` 없이 정확한 버전, lock 파일 커밋.

| 구분 | 도구 | 고정 버전 | 비고 |
|---|---|---|---|
| 런타임 | Node.js | **24.x LTS** | Next 16은 Node 20.9 이상 |
| 패키지 매니저 | pnpm | **10.33.0** | `"packageManager": "pnpm@10.33.0"`, `corepack enable` |
| 프레임워크 | next | **16.4.0** | 16.4.3은 10/23 출시라 제외 |
| | react, react-dom | **19.3.0** | |
| 언어 | typescript | **6.0.3** | 7.x는 Next 빌드 호환 미확인 |
| 스타일 | tailwindcss | **4.3.3** | |
| 컴포넌트 | shadcn (CLI) | **4.21.4** | |
| AI | @anthropic-ai/sdk | **0.133.0** | 1.0.0(10/21) 메이저 변경 회피 |
| 지도 | deck.gl, @deck.gl/react | **9.4.0** | |
| | maplibre-gl / react-map-gl | **6.13.0 / 8.1.3** | |
| 차트 | recharts | **3.10.1** | |
| 애니메이션 | motion | **14.1.0** | |
| 검증 | zod | **4.6.5** | `answerSchema`에 사용 |
| 테스트 | vitest / @vitejs/plugin-react | **5.0.3 / 6.1.2** | |
| Python | Python / verifiers | **3.12 / 0.3.1** | verifiers는 3.11 이상 필요 |
| Claude 모델 | API 모델 ID | `claude-sonnet-5-5` 기본, `claude-opus-5-5`, `claude-haiku-5-5` | Arena 비교에 3종 모두 |

## 11. 테스트

| 대상 | 방법 | 담당 |
|---|---|---|
| `scoring.ts` | Brier·CRPS 알려진 값, C/L 경계(0.10), 오라클 regret, 예보 복사 시 스킬 0 | 유진 |
| `snapshot.ts`·`tools.ts` | t0 이후 데이터가 절대 반환되지 않는지 (누출 테스트) | 성호·성제 |
| 청구 검증 | 실제로 서리가 있었던 날/없었던 날 fixture로 verdict 확인 | 유진 |
| 각 패밀리 | fixtures로 `generate → score` 한 바퀴, `answerSchema` 검증 | 각자 |
| 화면 | `?mock=1`과 실제 데이터로 각 1회 | 각자 |
| 합친 뒤 | 6절 데모 순서 그대로 처음부터 끝까지 | 전원 |

## 12. 해커톤 점검

| 기준 | 보여 주는 것 | 남은 구멍과 대응 |
|---|---|---|
| Demo | 자동 생성, Arena(실제 Claude 호출), 채점 과정 재생, **보험 청구 검증** | 장면 8개 → 순서 고정, 리허설 2회 |
| Impact | 두 고객의 돈: RL 환경 시장($1B+ 논의) + 작물보험(날씨 원인 보험금 73%) | 두 고객 모두 구매 증거 없음 → "검증 중"으로 말함 |
| 창의성 | "AI 채점 = 보험 검증" 같은 엔진 하나로 두 시장 | Maingen·Lightning Rod와 차이 한 문장 준비 |
| Depth | t0 스냅샷 누출 방지, 스킬 점수, 보정 곡선, 근거 리포트 | 실제 RL 학습·실제 보험 심사는 못 보여 줌 |

**예상 질문**
| 질문 | 답 |
|---|---|
| 주제는 RL 데이터 회사인데 보험사는? | 첫 고객은 RL 데이터 회사(트랙 조건). 보험사는 같은 검증기의 두 번째 매출이라 수익 모델이 직관적이 된다 |
| 랩이 직접 만들면? | 랩도 외부 공급사를 씀(약 12곳 보도). 공개 데이터 과제는 따라 할 수 있어도 **농장 판단-결과 데이터는 못 따라 함** |
| 예보를 베끼면 정답? | 스킬 점수: 원천 예보 그대로면 0점 |
| 미래 관측을 검색하면? | 도구는 t0 이전만 반환 (누출 테스트로 확인) |
| 보험사는 이미 날씨 데이터를 사지 않나? | 그들은 지역 날씨를 산다. 우리는 **필지 단위 재구성 + 확률 + 근거 리포트**를 청구 건별로 준다 |
| DTN Spray Outlook 같은 도구는? | 농민용 예보 앱. 우리는 데이터 회사·보험사용 판정 엔진 |
| 비슷한 RL 환경 회사는? | RL 환경 벤더(rl-list.com 42곳)·Prime Intellect 공개 환경에 날씨·농업 전문 없음. 가까운 곳: Maingen(산업 운영, 채점이 사람이 만든 시뮬), Lightning Rod(사건 기반 예측) |
| 누가 얼마 내나? | 데이터 회사: 과제 묶음·콘솔·평가셋·맞춤 환경. 보험사: 청구 건당·에이커당. 숫자는 모두 가정 |

## 13. 운영진 안내 반영

- **핵심 AI 판단·대화 기능은 Claude로.** 과제 생성, 에이전트 실행기, 청구 검증 해설, 누출 감사는 Claude. 타사 모델은 Arena의 평가 대상으로만.
- **이미지·영상 도구(힉스필드 등)** 발표자료·비주얼에 사용 가능, 비용 각자 부담.
- **제출 "오늘 새로 만든 부분 (한 줄)"** 초안:
  > 날씨 판정 엔진(4개 과제 패밀리 생성·Brier/CRPS/regret 채점)·모델 Arena·채점 흐름·보험 청구 검증·납품까지 전체 흐름을 오늘 직접 구현. 예보·관측 데이터는 Open-Meteo·ECMWF·NOAA CPC·IEM ASOS 사용.

## 14. 시작 전에 정할 것

1. 서비스 이름
2. 데모 지역·날짜 (아이오와, 서리·우박 등 피해가 있었던 날 = 청구 검증 데모용)
3. Arena 모델 구성 (Claude 3종 / 타사 키)
4. 가정값 (C, L, 청구 건당·에이커당 가격)
