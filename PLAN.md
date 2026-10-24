# 간이 기획 - Weather Decision Gym (가칭)

- 작성자: 홍유진 · 2026-10-24
- 자세한 근거와 화면 설계: `docs/team_plan_draft.md`, `docs/research_*`, `attentionx-weather-rl-gym.md`

## 1. 무엇을 만드나

**규정과 날씨를 넣으면, 실측으로 자동 채점되는 RL 환경을 만들어 주는 공장.** 첫 환경은 미국 대형농의 농약 살포 결정이다.

- 돈 내는 쪽: RL·Eval 데이터 회사(Scale, Surge, Mercor 등), AI 랩
- 정답 도메인: 미국 대형농 (아이오와, 2026년 6월 재생)
- 핵심 엔진 하나: 같은 판정 규칙을 **예보에 돌리면 "판단"**, **실측에 돌리면 "정답"**
- 에이전트는 **확률 + 결정**을 같이 낸다. 예: "P(살포 조건 위반) = 0.35, 결정 = 보류". 그래서 맞혔나(정답/오답)뿐 아니라 **확률을 잘 맞혔나(Brier·CRPS)**와 **그 결정이 돈이 됐나(비용-손실 regret)**까지 채점된다. 정답/오답 보상만 쓰면 모델의 확률 보정이 나빠진다는 연구 흐름에 맞춘 설계다 (`attentionx-weather-rl-gym.md` 1·2-3절).
- 왜 날씨인가: 결과가 **반드시·수치로·매시간·모든 지점에서** 확정되고, 미래 사건이라 정답 유출(오염)이 불가능하다.

### 데모의 결정타: 오늘 아침 발행한 과제를 발표 시간에 채점
- 해커톤 시작(0:45)에 아이오와 필지들의 **앞으로 1-6시간 나우캐스팅 과제**를 실제로 발행해 둔다.
- 발표 시점엔 실제 관측(IEM ASOS)이 도착해 있다 → **무대 위에서 진짜로 채점**한다.
- "미리 만든 결과 아니냐"는 질문에 대한 답. 2026년 6월 재생(REPLAY)과 오늘 라이브(LIVE)를 배지로 구분한다.

## 2. 기능 4개 = 개발자 4명

각자 **화면 → API → 로직 → 테스트**까지 한 기능을 끝까지 맡는다.

| 담당 | 기능 | 데모 장면 | P0 (꼭) | P1 (와우) |
|---|---|---|---|---|
| **1** | **Studio** - 규정 → 환경 + 무결성 | 라벨 붙여넣기 → 30초 만에 규칙 카드 | Claude로 규칙 JSON 추출, 원문 하이라이트, 손실 함수(C/L) 설정 | 비농업 규정 예시, **Hack Hunter**(꼼수 공격·적발, 패치 전/후), **누출 감사**(t0 이후 정보를 쓰려는 시도 적발) |
| **2** | **Factory** - 과제 공장 + 납품 | 과제 1,000개 스트리밍, 시장가 $ 카운터 | 살포 과제 생성, 라이브 나우캐스팅 과제 발행, JSON 내보내기 | 과제 패밀리 추가(**서리 대응** 비용-손실, **필지 기온 분포** CRPS), 난이도 분포, Buyer Copilot, **`verifiers` 패키지 + Prime Intellect Environments Hub 공개** |
| **3** | **Arena** - 모델 경기장 | 모델들이 줄줄이 틀림, headroom 차트 | 모델 2-3개 실행(tool use), 확률+결정 제출, 점수표(준수·Brier·regret·스킬) | 병렬 추론 스트리밍, **보정 곡선**, 틀린 사례 해설, **"환경이 가르친다"**(채점 피드백을 받은 모델의 점수가 회차마다 오르는 모습, 인컨텍스트 학습이라고 명시) |
| **4** | **Time Machine** + Ops Board | 지도 위에서 예보 갱신 → 실측 도착 → ✓/✗ | 시간 슬라이더, 필지 판정 색, 라이브 과제 채점 화면 | 바람 레이어, 농장용 Ops Board(Claude 작업 순서) |

공통 엔진(**core**)은 처음 45분 동안 1·2번이 함께 만들고, 3·4번은 그동안 화면 틀과 데모 데이터를 준비한다.

## 3. 합치기 쉬운 구조

```
src/
  core/                    ← 공통 엔진 (모두 사용)
    types.ts               ← 데이터 형식 (아래 4절)
    weather.ts             ← Open-Meteo 예보·과거 런, IEM 실측
    rules.ts               ← 판정 엔진 (GO/CAUTION/NO-GO + 사유 코드)
    score.ts               ← 채점 (준수, Brier/CRPS, 오라클 대비 regret, 스킬)
    tools.ts               ← 에이전트 도구. 과제의 t0 이전에 발행된 예보만 돌려줌 (누출 방지)
  features/
    studio/   factory/   arena/   timemachine/    ← 각자 로직 + 테스트
  app/
    studio/   factory/   arena/   timemachine/    ← 각자 페이지
    api/studio/  api/factory/  api/arena/  api/timemachine/   ← 각자 API
  components/ui/           ← shadcn 공용 컴포넌트 (처음에 한 번 설치)
fixtures/                  ← 가짜 데이터 (core 타입과 같은 모양)
```

- **폴더가 기능별로 갈라져 있어서** 같은 파일을 동시에 고칠 일이 거의 없다.
- **겹치는 곳은 core뿐.** core는 처음 45분에 얇게라도 "끝까지 도는" 버전을 먼저 `main`에 올린다. 이후 고칠 때는 한마디 하고 작은 PR로.
- **각 페이지는 혼자서도 돈다.** `?mock=1`이면 `fixtures/`만으로 화면이 뜬다. 남의 기능이 늦어도 내 기능은 개발·시연 가능.
- **기능 간 연결은 데이터로만.** Factory가 만든 과제 묶음(`TaskPack`)을 Arena가 받고, Arena 결과(`RunResult`)를 Time Machine이 지도에 그린다. 함수 직접 호출 대신 JSON 모양을 맞춘다.
- 상단 내비게이션은 `src/app/nav.ts` 배열에 각자 한 줄씩 추가.
- 패키지는 처음에 한 번에 설치(Next.js, shadcn/ui, Tailwind, Recharts, deck.gl 또는 MapLibre, Framer Motion, `@anthropic-ai/sdk`, Vitest)해서 `package.json` 충돌을 줄인다.

## 4. 공통 데이터 형식 (처음 15분에 같이 정하기)

```ts
Field        { id, name, lat, lon, acres, crop, farmId, sensitiveNeighbors[] }
Forecast     { fieldId, model, issuedAt, hourly: { time, windMph, gustMph, windDir, tempF, dewF, precipIn }[] }
Observation  { fieldId|stationId, hourly: 같은 모양 }
RuleSet      { id, source, rules: { code, kind, params, quote }[] }   // quote = 라벨 원문 근거
Verdict      { fieldId, time, status: 'GO'|'CAUTION'|'NO_GO', reasons: string[] }
Task         { id, field, issuedAt, horizonH, forecastSnapshot, ruleSet, question, difficulty }
TaskPack     { id, tasks: Task[], meta: { region, period, count, marketValueUsd } }
AgentAnswer  { taskId, model, decision, probability, trace[] }      // 확률 필수
Score        { taskId, model, compliance, brier, crps?, regretUsd, oracleCostUsd, skill, hackFlags[], leakFlags[] }
RunResult    { packId, answers: AgentAnswer[], scores: Score[] }
```

## 5. 테스트

| 대상 | 방법 | 누가 |
|---|---|---|
| core 판정·채점 | Vitest 단위 테스트, 경계값(풍속 3/10mph, 85/95°F, 50% 면적) | 1·2번 |
| 각 기능 로직 | Vitest + fixtures (Claude 호출은 저장된 응답으로 대체) | 각자 |
| 각 API | fixture 입력 → 응답 모양이 `types.ts`와 맞는지 | 각자 |
| 화면 | `?mock=1`과 실제 데이터 두 번 수동 확인, 체크리스트 | 각자 |
| 합친 뒤 | 데모 스크립트 그대로 처음부터 끝까지 1회 | 전원 |

- PR마다 `npm run typecheck && npm test`가 통과하면 머지 (GitHub Actions 한 개로 자동 실행해 두면 편함).

## 6. 일정 (5시간)

| 시간 | 1 · Studio | 2 · Factory | 3 · Arena | 4 · Time Machine |
|---|---|---|---|---|
| 0:00-0:15 | **4명: 데이터 형식 합의** | | | |
| 0:15-0:45 | core: 판정 엔진 + 테스트 | core: 날씨 수집 + 과제 형식 | 셸 UI(탭, 하단 바, 다크 테마), Vercel 배포 | 데모 데이터: 아이오와 필지, 예보·실측 갈린 날 찾기 |
| 0:45 | **core 첫 버전 `main` 머지** → 모두 rebase. **2번: 라이브 나우캐스팅 과제 발행** (발표 때 채점용) | | | |
| 0:45-1:45 | 규칙 추출(P0) | 과제 생성(P0) | 모델 실행·점수(P0) | 슬라이더·지도(P0) |
| 1:45 | **1차 합치기**: 각자 PR 머지, Vercel 미리보기 확인 | | | |
| 1:45-3:00 | 원문 하이라이트, Hack Hunter | 스트리밍, 난이도, 내보내기 | 병렬 스트리밍, headroom | 예보→실측 애니메이션, Ops Board |
| 3:00 | **2차 합치기**: Factory → Arena → Time Machine 데이터 연결 확인 | | | |
| 3:00-4:00 | P1 마무리, 테스트 보강 | | | |
| 4:00 | **기능 동결.** 이후 버그 수정만 | | | |
| 4:00-4:30 | 데모 스크립트 통과 테스트, 캐시 폴백 점검 | | | |
| 4:30-5:00 | 리허설, PPT 2장 (각자 자기 장면 캡처 + 숫자 1개) | | | |

## 7. 기술적으로 가능한가 - 외부 도구로 모두 해결 가능

| 필요한 것 | 해결 수단 | 비용·조건 | 위험 |
|---|---|---|---|
| 시간별 멀티모델 예보 (HRRR, GFS, ECMWF, NBM) | **Open-Meteo** Forecast API | 무료(비상업, 일 1만 회), CC BY 4.0 표기 | 낮음 |
| 과거 시점의 예보 (2026년 6월 재생) | **Open-Meteo Previous Runs / Historical Forecast API** | 무료(비상업) | 일부 모델·변수는 비어 있을 수 있음 → 미리 받아 캐시 |
| 실측 관측 | **Iowa Environmental Mesonet ASOS** CSV 다운로드 | 무료, 키 없음 | 낮음 |
| 혼합층 높이(기온역전 추정) | NWS api.weather.gov | 무료, `User-Agent` 필요, 실시간만 | 재생에는 못 씀 → 생략 또는 추정 |
| 규칙 추출·에이전트·감사 | **Claude API** (tool use, structured output, 스트리밍) | 유료 API 키 | 낮음 |
| 모델 여러 개 비교 | Claude Haiku / Sonnet / Opus 3종만으로도 가능. 다른 회사 모델은 OpenRouter 등 키가 있으면 추가 | 키 여부 | 키 없으면 Claude 3종으로 |
| 지도·애니메이션 | **deck.gl / MapLibre**(오픈소스), 무료 타일(OSM 등) | 타일 이용 조건 표기 | 바람 입자 애니메이션은 시간 들면 화살표로 대체 |
| 차트·UI | Recharts, shadcn/ui, Framer Motion | 오픈소스 | 낮음 |
| RL 환경 납품 형식 | Prime Intellect **verifiers**(Python) 형식으로 과제 데이터 + 채점 함수 패키지 생성, `prime env push`로 Environments Hub 공개 | 오픈소스, Hub 계정 필요 | Python 패키지를 한 명이 따로 맞춰야 함. 안 되면 JSON + 채점 함수 내보내기까지만 |
| 라이브 과제 채점 | IEM ASOS 준실시간 관측 | 무료 | 관측 도착 지연(대략 1시간 안팎 추정) → 과제는 발표 2시간 이상 전에 끝나는 구간으로 발행 |
| 라벨 원문 | EPA·제조사 공개 라벨 PDF에서 발췌 | 공개 문서 | 2026 라벨 원문 확보 필요, 못 구하면 "발췌 예시"로 표시 |
| 배포 | Vercel | 무료 플랜 | 낮음 |

**결론:** 데이터·지도·AI·배포 모두 무료 오픈 API와 오픈소스, Claude API로 해결된다. 자체 개발이 필요한 건 **판정 엔진, 과제 생성기, 채점기, 화면**이고, 이것이 우리 제품의 본체다. 범위는 넓지만 P0만으로 데모가 끝까지 이어지게 짰고, P1은 남는 시간만큼 붙인다. 가장 큰 위험은 기술이 아니라 **시간**(5시간)과 **과거 예보 데이터 공백**이라, 데모 날짜 데이터는 0:45 전에 미리 받아 `fixtures/`에 저장해 둔다.

### 버전 고정 (4명 환경 통일)

2026-10-24 기준 npm·PyPI에서 조회. **나온 지 2주가 안 된 최신판은 피하고**, 그 직전의 안정판으로 고정한다(행사 당일 버그 회피). `package.json`에는 `^` 없이 정확한 버전으로 적고, lock 파일(`pnpm-lock.yaml`)을 커밋한다.

| 구분 | 도구 | 고정 버전 | 비고 |
|---|---|---|---|
| 런타임 | Node.js | **24.x LTS** (예: 24.13.1) | Next 16은 Node 20.9 이상 요구 |
| 패키지 매니저 | pnpm | **10.33.0** | `package.json`의 `"packageManager": "pnpm@10.33.0"`, 모두 `corepack enable` |
| 프레임워크 | next | **16.4.0** | 최신 16.4.3은 10/23 출시라 제외 |
| | react, react-dom | **19.3.0** | |
| 언어 | typescript | **6.0.3** | 7.x(네이티브 컴파일러)는 Next 빌드와 호환 미확인이라 보류 |
| 스타일 | tailwindcss | **4.3.3** | |
| 컴포넌트 | shadcn (CLI) | **4.21.4** | `pnpm dlx shadcn@4.21.4 init` |
| AI | @anthropic-ai/sdk | **0.133.0** | 1.0.0이 10/21에 나온 메이저 변경이라 0.x 마지막판 고정 |
| 지도 | deck.gl, @deck.gl/react | **9.4.0** | |
| | maplibre-gl | **6.13.0** | |
| | react-map-gl | **8.1.3** | |
| 차트 | recharts | **3.10.1** | |
| 애니메이션 | motion (구 Framer Motion) | **14.1.0** | |
| 검증 | zod | **4.6.5** | API 입출력 형식 검사, `types.ts`와 같이 사용 |
| 테스트 | vitest | **5.0.3** | |
| | @vitejs/plugin-react | **6.1.2** | |
| Python (verifiers 패키지용) | Python | **3.12** | verifiers는 3.11 이상 필요. 로컬에 3.10이면 설치 필요 |
| | verifiers | **0.3.1** | 0.4.0은 10/12 출시. API 차이가 있을 수 있어 문서 버전을 맞춰 볼 것 |
| Claude 모델 | API 모델 ID | `claude-sonnet-5-5` 기본, `claude-opus-5-5`(라벨 추출·감사), `claude-haiku-5-5`(대량·Arena 비교) | |

- 시작 뼈대를 만드는 사람이 위 버전으로 `package.json`과 lock 파일을 만들어 올리고, 나머지는 `pnpm install`만 한다.
- 새 패키지를 추가할 때도 정확한 버전으로 적고 팀 채팅에 알린다.
- `.nvmrc`(또는 `.node-version`)에 `24`를 적어 Node 버전을 맞춘다.

## 8. 해커톤에서 충분한가 - 심사 기준으로 점검

다른 Claude 해커톤 기준(Demo 30%, Impact 25%, 창의성 25%, Depth 20%, `docs/research_sungho/00_summary.md`)과 sj-park 리서치의 심사위원 예상 질문으로 점검했다. 이번 행사 공식 루브릭은 확인 필요.

| 기준 | 우리가 보여 주는 것 | 남은 구멍 |
|---|---|---|
| Demo | 규정 → 환경 30초, 과제 스트리밍, 모델 비교, **무대 위 라이브 채점** | 장면이 많아 3분에 다 못 보여 줄 수 있음 → 장면 순서 고정, 리허설 2회 |
| Impact | RL 환경 시장($1B+ 논의, 과제 $200-2,000), 데이터사 원가 구조(정답을 사람 대신 날씨가 줌) | **날씨·농업 환경을 산 구매자 증거 없음** → "수요 검증 중"으로 말하고, Prime Intellect Hub 공개를 첫 유통 증거로 |
| 창의성 | "현실이 채점자", 규정 문서 → 환경 컴파일, 확률+결정 동시 채점 | Lightning Rod·Prophet Arena와 차이를 한 문장으로 준비: "사건이 아니라 수치·고빈도·돈으로 채점" |
| Depth | 4층 채점, 누출 방지, 꼼수 적발, 보정 곡선, verifiers 납품 | 실제 RL 학습은 못 보여 줌 → "환경이 가르친다"(인컨텍스트)로 대신하고 그렇게 명시 |

**예상 질문과 답 (attentionx 11절, sj-park 3절 기반)**
| 질문 | 답 |
|---|---|
| 랩이 직접 만들면? | 랩도 외부 공급사를 씀(약 12곳 보도). 도메인 손실 함수와 로컬 관측은 랩의 핵심 역량이 아님 |
| 예보를 베끼면 정답 아닌가? | 스킬 점수: 원천 예보를 그대로 따르면 0점 |
| 오늘 실제로 채점된 건가? | 아침에 발행한 라이브 과제를 지금 채점 (LIVE 배지) |
| 에이전트가 미래 관측을 검색하면? | 도구가 t0 이전 정보만 반환, 누출 감사로 적발 |
| 누가 얼마 내나? | 환경 피드 구독(과제당 $50-300 볼륨가), 비공개 평가셋, 맞춤 환경(6자리 $, 독점 4-5배). 1년차 가정: 고객 5곳 × 연 $300K |

**판단:** 기능 범위와 와우 장면은 해커톤에 충분하다. 승부를 가르는 건 (1) 라이브 채점이 실제로 돌아가는지, (2) 3분 안에 장면을 매끄럽게 넘기는지, (3) "누가 사나" 질문에 정직하게 답하는지다.

## 9. 시작 전에 정할 것

1. 서비스 이름
2. 데모 날짜 (2026년 6월 중 예보와 실측이 갈린 날)
3. Arena 모델 구성 (Claude 3종 / 다른 회사 모델 키)
4. 담당 1-4 배정
