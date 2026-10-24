# 꺄레 (kkyare) - 해커톤 리서치

- 작성자: 홍유진
- 작성일: 2026-10-24
- 트랙: **3번 · AttentionX - 미국 RL Eval·데이터 회사가 돈 내고 쓸 서비스**
- 제출 주제: 더욱 정확한 기상 데이터를 가공하여 농업 생산성 증가에 기여하는 서비스
- 제출 타깃: 미국의 기업농 혹은 대형농장
- 조건: 4명(풀스택 4), 개발 5시간, AI 활용 개발, 발표 = 데모 + PPT 2장

> 수치 대부분은 업계 블로그·회사 자체 발표·2차 집계 기준이다. 발표에서는 "약", "보도에 따르면"으로 표현할 것. 신뢰도가 낮은 항목은 ⚠️ 표시.

---

# Part 1. 리서치

## 0. 요약

1. **트랙과 타깃을 하나의 구조로 묶어야 한다.** 3번 트랙의 돈 내는 쪽은 RL/Eval 데이터 회사, 제출 타깃은 기업농. 둘 다 고객으로 두는 2층 구조가 필요하다.
2. **기업농은 이미 데이터를 쌓고 있다.** 수확량 모니터·농기계 텔레메트리·필지 경계가 John Deere Operations Center 같은 플랫폼에 있고, API와 농장주 권한 설정으로 제3자 연동이 가능하다. → 농장에 **필지 단위 기상 보정 + 작업 판단 솔루션**을 판다.
3. **그 과정에서 "실제 날씨로 자동 채점되는 농작업 판단 과제"가 쌓인다.** 수학·코드 밖에서는 채점(검증)이 병목인데, 날씨는 며칠 뒤 관측값이 정답이 된다. → 데이터사·AI 랩에 **RL 환경/Eval**로 판다.
4. **기상·농업 LLM 벤치마크는 이미 있다(ZephyrusBench, AgriBench, AgriWorld 등). 단, 대부분 정적 Q&A다.** 우리의 차별점은 *살아있는(매일 새로 생기는) · 필지 단위 · 의사결정형 · 실측 채점* 과제.
5. **농작업 규칙은 이미 수치로 정해져 있다.** 예: 제초제 라벨의 풍속 3–10mph, 일출~일몰, 기온역전 금지, 예보 강수 24시간 전 금지 / 옥수수 파종 토양온도 50°F 이상. → 과제와 채점 기준을 바로 만들 수 있다.

---

## 1. 돈 내는 쪽 ①: RL 환경·Eval 데이터 시장 (3번 트랙)

### 시장 규모·단가
| 항목 | 내용 | 출처 |
|---|---|---|
| 데이터 라벨링 시장 | 약 $5B (2026.1), 연 50%+ 성장. RL 환경은 그 위의 더 큰 기회 | Wing VC |
| 랩 지출 | 한 대형 랩이 1년간 RL 환경에 $1B+ 지출 논의 (2025.9) | The Information (TechCrunch 인용) |
| 과제 단가 | 과제당 $200–2,000 / 웹사이트 복제 환경 ~$20K / 복잡한 제품 클론 ~$300K | Epoch AI (Troveo 인용) |
| 소형 랩 계약 | 분기당 $300K–500K | Troveo |

### 플레이어
| 구분 | 회사 | 메모 |
|---|---|---|
| 기존 데이터사 | Scale AI | 2024말 ARR $1.5B, 정부·엔터프라이즈로 고객 재편 |
| | Surge AI | ~$1.2B 매출, ~12개 프론티어 랩, RL 환경 전담 조직 |
| | Mercor | 2026.6 연환산 총매출 $2B 보도, 물리·금융 등 도메인 전문가 데이터 |
| | Turing | RL 환경 사업 진출 |
| 환경 전문 | Mechanize, Fleet AI, HUD, Veris AI, Plato, Bespoke Labs | |
| 2026 투자 | Deeptune(시리즈 A $43M, a16z), Proximal(시드 $15M @ $300M, 매출 자체발표 ⚠️) | |
| 랩 내부 | OpenAI Synthetic RL 팀, xAI·Meta 관련 채용 | 내재화 위험 요인 |

### 수요 흐름
- **현재 중심은 코딩·컴퓨터 사용 에이전트.** Thoughtworks·Wing VC 모두 이 분야를 "출발점이지 종착점이 아니다"라고 표현.
- **수학·코드 밖의 병목은 '채점'.** Wing VC: 루브릭+LLM 심판 방식은 주관적 도메인에서 수학·코드(RLVR)만큼의 성능 도약을 못 만들었다. → **객관적으로 채점되는 새 도메인이 귀하다.**
- 의학·화학·경제 등으로 검증 가능한 보상을 넓히는 학술 연구는 진행 중(2025 arXiv).
- 수요는 자격 있는 도메인 전문가 데이터로 이동(시급 ~$100, 금융·법률·코딩).
- ⚠️ 특정 랩이 2026년에 "과학·물리 세계 RL 환경"을 공개적으로 구매한다는 1차 근거는 찾지 못함.

### 기존 기상·농업 LLM 벤치마크 (경쟁/참고)
| 이름 | 형태 | 비고 |
|---|---|---|
| ZephyrusBench (2025) | 기상 과제 49종, ERA5/WeatherBench 2 기반 | 정답은 큐레이션 보고서·검증 코드 |
| CLLMate (2024) | 기상·기후 이벤트 예측 멀티모달 | MLLM 23종 평가 |
| AgriBench-13K (AgriGPT, 2025) | 농업 13개 과제 유형 | BLEU/ROUGE/LLM 점수 |
| AgReason | 전문가 작성 농업 추론 100문항 | 정답 텍스트 |
| Bayer 옥수수 작물보호 Q&A | 156문항, G-Eval | 학습·실제 추천 사용 금지 라이선스 |
| AgriWorld (2026) | 코드 실행 에이전트, 검증 가능한 농업 추론 | ⚠️ 수치는 2차 요약 기준 |

**→ 공백:** 위는 대부분 *과거 데이터 기반 정적 문항*. **미래 날씨로 채점되어 학습 오염이 원천적으로 불가능하고, 특정 필지의 실제 작업 판단을 묻는 '살아있는 환경'은 보이지 않는다.** (ForecastBench·Prophet Arena가 "미래 사건으로 채점"을 일반 도메인에서 검증한 선례)

---

## 2. 돈 내는 쪽 ②: 미국 기업농·대형농장 (제출 타깃)

### 규모·피해
- **2025 작물년도 농작물보험금 약 $11.46B**, 손해율 0.68 (RMA 2026.9.7 기준, 누적치라 계속 증가). 손해율 장기 평균 0.93(1989–2025).
- 작물별 편차 큼: 옥수수 손해율 0.40, 땅콩 1.08, 쌀 2.13 (farmdoc daily).
- **2001–2022 날씨 원인 보험금 $118.7B (전체의 약 73%)** - 가뭄·습해·우박·폭염·서리 (EWG/USDA). 2022년 가뭄만 $7.6B.
- 2024년 미국 농업 날씨 피해 $20.3B (The Weather Company).
- **2,000에이커 이상 경영체가 임차 농지의 약 68%** 운영 (USDA ERS) → 대형 경영체 집중.

### 기업농은 이미 데이터를 쌓고 있다
- 대형 농장의 정밀농업 도입률 높음: 2016년 최대 규모 옥수수 농장 73%가 GPS 가이던스(USDA ERS), 상업농 92% GPS/오토스티어(Purdue 2019), 대형 작물농 68%가 수확량 모니터·토양 지도(2023 ERS ⚠️ 2차 출처).
- **John Deere Operations Center:** 필지·필지 경계·농작업(Field Operations)·농기계 텔레메트리·웹훅 API ⚠️(서드파티 디렉터리 기준). 농장주가 "Connections"로 제3자 공유를 직접 허용/차단, 150+ 소프트웨어사 연동(블로그 기준 ⚠️). Deere 데이터 정책 2026.4 개정.
- 의미: **농장 데이터 연동은 "농장주 동의 → API 연결"이라는 이미 정착된 경로가 있다.** 별도 하드웨어 없이 시작 가능.

### 가격 앵커
| 서비스 | 가격 | 신뢰도 |
|---|---|---|
| Climate FieldView Plus | 연 $649부터 (1,000에이커 기준 약 $0.65/에이커) | ⚠️ 집계 사이트 |
| FieldView Pro 부가 모듈(2018) | 모듈당 $3/에이커, 묶음 $4/에이커 | 오래됨 |
| DTN·Arable | 공개 가격 못 찾음 | - |

→ **에이커당 과금**이 업계 관행. 5,000에이커 농장 × $2–4/에이커 = 연 $10K–20K 수준이 대략적인 감 (내 추정).

---

## 3. 날씨가 돈이 되는 농작업 순간 (과제 설계 재료)

| 작업 | 판단 기준 (공개 자료) | 날씨 변수 | 자동 채점 방법 |
|---|---|---|---|
| **제초제 방제** | 풍속 3–10mph(돌풍 10mph 초과 시 위반 취급), 일출~일몰, 기온역전 시 금지, 예보 강수 24시간 이내 금지 (2017–18 디캄바 라벨·Purdue/OSU/KY 확장센터) | 풍속·돌풍, 기온 연직분포, 강수 | 판단한 시간대의 실측 풍속·강수가 기준 충족했는가 |
| | 2017년 6월 인디애나 서중부: 조건 충족 시간이 **한 달에 48시간뿐** | | → "창이 좁다 = 예보 정확도가 곧 돈" |
| **옥수수 파종** | 토양온도 지속 50°F 이상, 최적 시기 4월 중순~5월 중순(아이오와), 6월 초 파종 시 잠재수량 ~80%, 6월 말 ~40% | 토양온도, 한파, 강수 | 파종 후 N일간 실측 토양온도·한파 발생 여부 |
| | 파종 직후 한파+비 → 오히려 늦게 심은 것보다 수량 저하(ISU 2013) | | → "빨리 심는 게 답이 아님 = 판단 과제로 적합" |
| **서리 대응** | (과수·특용작물) 개화기 영하 | 최저기온, 냉기 고임(저지대) | 실측 최저기온이 임계값 이하였는가 |
| **수확·건조** | (내 추정) 연속 무강수일, 습도 | 강수, 습도 | 실측 강수 발생 여부 |

⚠️ 디캄바 라벨 수치는 2017–18 기준. 현재 라벨·주별 규정은 다를 수 있음 → 데모에서는 "예시 기준"으로 표기.

**과제 형식 예시 (내 제안):**
```
입력: 필지(위경도·고도·작물), 기준 시각, 예보 자료, 농작업 규칙
질문: "앞으로 48시간 중 이 필지에서 제초제를 살포할 수 있는 시간대는?"
정답: 실측 관측값으로 규칙을 적용해 계산 (사람 라벨링 불필요)
점수: 정밀도/재현율, 잘못된 '가능' 판단에 큰 페널티(약해·법규 위반)
```

---

## 4. 기술 가능성

| 구성 | 내용 |
|---|---|
| 오픈소스 AI 기상 모델 | GraphCast/GenCast(Google), Pangu-Weather(Huawei), FourCastNet(NVIDIA), Aurora(Microsoft) |
| 다운스케일링 | **NVIDIA CorrDiff**: 25km → 2km 확산 모델, PhysicsNeMo/Earth2Studio 오픈소스. 미국 HRRR 기반 CorrDiff-Mini는 A100 ~10시간 학습(학습용, 실서비스 금지 명시). NIM은 미국 본토 GEFS 0.25° 입력 |
| 입력 데이터 | GFS/GEFS(NOAA 공개), ERA5 재분석, HRRR(미국 3km) |
| 주의 | 초기장은 공공 관측·재분석 데이터 → "기상청 *예보*에 의존하지 않는다"가 정확한 표현 |

### Open-Meteo (빠른 데이터 소스)
- 무료 API: **비상업 용도**, 일 10,000 / 시 5,000 / 분 600 호출, **CC BY 4.0 출처 표기 필수**.
- 상업: Standard $29/월(100만 호출), Professional $99/월(500만, **과거 관측·앙상블·기후 API 포함**) ⚠️ 블로그 기준, 현재 가격 확인 필요.
- GFS·HRRR 등 제공. 과거 HRRR 아카이브 제공 여부는 미확인.
- 오픈소스라 자체 호스팅도 가능.

### 5시간 데모의 현실적 범위 (내 판단)
- CorrDiff 학습/추론은 5시간 내 불가능에 가까움 → **로드맵으로 명시**.
- 데모: Open-Meteo로 예보·실측 수집 + 단순 지형 보정(고도 기온감률 등) + 규칙 기반 채점 + LLM 에이전트 비교.
- 해커톤 데모 = 비상업 용도 해석 가능, 출처 표기(README Credits)는 필수.

---

## 5. 선행·경쟁사

| 구분 | 회사 | 비고 |
|---|---|---|
| AI 기상 모델 | WindBorne Systems | 2026.8 시리즈 B $37M(Khosla 등), 누적 $62M+. 자체 관측 풍선 + WeatherMesh |
| | Silurian | 2024 창업, 2026.4 $6M. 기상·지구 파운데이션 모델 |
| | Brightband | 2024 시리즈 A $10M. 오픈소스 AI 예보, 농업 포함 다산업 |
| | Excarta | 시드 $2.5M(시점 미확인). 에너지·농업·공급망 |
| 농업 기상·플랫폼 | The Weather Company(GRAF), DTN, Bayer Climate FieldView, John Deere Operations Center, Arable(센서), Sencrop(유럽), Tomorrow.io | 예보·데이터 판매 / 농장 관리 |
| RL 환경 | Mechanize, Fleet AI, HUD, Deeptune, Proximal 등 | 코딩·웹/소프트웨어 중심 |
| 농업·기상 벤치마크 | ZephyrusBench, AgriBench, AgriWorld 등 | 정적 문항 중심 (§1 참고) |

**포지셔닝:**
- 기상 회사는 *예보*를 판다 / 농업 플랫폼은 *기록·관리*를 판다 / RL 환경 회사는 *코딩·웹 환경*을 판다.
- **우리는 "필지 단위 기상 판단 + 실측 채점"을 판다.** 농장에는 판단 솔루션으로, AI 랩에는 검증 가능한 환경으로.

---

## 6. 사업 구조

| 층 | 고객 | 상품 | 과금 (안) |
|---|---|---|---|
| ① 3번 트랙 | Scale·Surge·Mercor 등 데이터사, AI 랩 | 농업·기상 의사결정 RL 환경 + Eval 셋 (매일 갱신) | 과제당 / 환경 패키지 라이선스 |
| ② 제출 타깃 | 미국 기업농·대형 농장 | 필지 단위 보정 예보 + 작업 시점 판단(방제·파종·서리) | 에이커당 구독 |
| 확장 | 작물보험사, 농약·종자사, 중소농·B2C | 피해 평가 데이터, 알림형 서비스 | - |

- 기업농이 쌓아둔 데이터(수확량·작업 기록)를 필지 단위 기상과 결합해 **보정 예보·작업 판단 솔루션으로 판매**, 동의받은 데이터는 환경의 정답·난이도 보강에 활용(데이터 제공 농장에 수익 공유/할인 - 내 제안).
- **"농장은 솔루션을 사고, AI 랩은 그 과정에서 생긴 정답을 산다."**

**플라이휠:** 농장 연결 ↑ → 필지 실측·작업 결과 ↑ → 과제 품질·다양성 ↑ → 데이터사 매출 ↑ → 다운스케일링 모델 개선 → 농장 가치 ↑. GPU가 좋아질수록 예보 품질도 같이 오른다.

---

## 7. 데모 후보: FieldBench

> **FieldBench: 실제 날씨로 자동 채점되는 농업 의사결정 환경 - 미국 대형 농장의 필지 단위 기상 데이터로 만든다.**

### 시나리오 (2–3분)
1. **필지 선택:** 아이오와 옥수수 농장 지도에서 필지 클릭 → 위경도·고도
2. **예보 비교:** 일반 예보(25km 격자) vs 필지 보정 예보
3. **과제 생성:** 과거 날짜로 이동 → "48시간 내 제초제 살포 가능 시간대는?" (풍속 3–10mph, 일출~일몰, 강수 기준)
4. **에이전트 응답:** LLM 2–3개가 판단 + 근거
5. **자동 채점:** 실측 날씨로 정답 계산 → 모델별 점수표
6. **판매 화면:** 과제 패키지 JSON 내보내기 = 데이터사에 파는 상품

→ 한 데모에 **농장 제품**(1–2)과 **RL 환경 상품**(3–6)이 함께 보인다.

### 필요한 화면 (내 정리)
| 화면 | 핵심 요소 |
|---|---|
| 필지 | 지도, 필지 핀, 작물·고도 |
| 예보 비교 | 시간대별 풍속·강수·기온 차트 2줄(일반 vs 보정), 작업 가능 시간대 하이라이트 |
| 벤치마크 | 과제 카드, 모델별 답변, 정답 시간대, 점수, 리더보드 |
| 내보내기 | 과제 JSON 미리보기, 다운로드 |

---

## 8. PPT 2장 재료

**1장 - 문제와 기회**
- 헤드라인 후보: "AI는 코드는 채점할 수 있는데, 날씨는 아직 못 한다"
- 왼쪽(농장): 날씨 원인 보험금 $118.7B / 22년(73%), 2025년 보험금 ~$11.5B, 방제 가능 시간 한 달 48시간 사례
- 오른쪽(AI 랩): RL 환경에 랩당 연 $1B+ 지출 논의, 코딩 밖 도메인은 '채점'이 병목
- 하단: "둘 다 '실제 날씨로 검증되는 필지 단위 데이터'가 없어서 생기는 문제"

**2장 - 솔루션·사업모델·로드맵**
- 2층 구조 표 + 플라이휠
- 가격 앵커: 과제당 $200–2,000(시장 단가) / 에이커당 구독
- 로드맵: 오늘(Open-Meteo + 지형 보정 + 채점 환경) → 3개월(CorrDiff 2km 다운스케일, Deere API 연동 파일럿) → 1년(데이터사 계약, 작물보험사) → B2C
- 하단: "농장은 솔루션을 사고, AI 랩은 그 과정에서 생긴 정답을 산다"

### 예상 질문
| 질문 | 답변 방향 |
|---|---|
| 왜 데이터사가 사나? | 코드 밖 도메인은 채점이 병목. 날씨는 실측이 정답이라 사람 라벨링 없이 무한·저렴하게 검증 가능 |
| 이미 기상·농업 벤치마크 있지 않나? | 정적 문항. 우리는 매일 새로 생기는 미래 과제 → 오염 불가, 필지 단위 의사결정형 |
| 날씨 데이터는 공짜 아닌가? | 원자료는 공개. 가치는 필지 보정 + 농작업 규칙의 과제화 + 채점 파이프라인 + 농장 실측 |
| 기존 업체(DTN, FieldView)는? | 그들은 예보·기록을 판다. 우리는 판단과 그 판단의 채점을 판다 |
| 랩이 직접 만들면? | 농장 실측·작업 결과 데이터 접근이 해자. Deere 등 연동은 농장주 동의 기반 |
| 농장 데이터 확보는? | Deere Operations Center 등 농장주 권한 기반 API 연동 경로가 이미 존재 |
| 왜 이 팀이? | (팀 논의 필요) |

---

## 9. 5시간 개발 분담 (안)

| 담당 | 범위 |
|---|---|
| 풀스택 A | 백엔드: Open-Meteo 연동(예보·과거 관측), 지형 보정, 과제 생성·채점 로직 |
| 풀스택 B | 에이전트: LLM 호출(여러 모델), 응답 파싱, 리더보드 집계 |
| 풀스택 C | 프론트: 지도·필지 선택, 예보 비교 차트, 리더보드, JSON 내보내기 |
| 풀스택 D | 데모 데이터: 예보·실측이 갈린 필지·날짜 탐색 스크립트, 데모 시나리오, PPT 2장, README Credits 정리 |

- 기본 스택(안): Next.js + Claude API + Open-Meteo, DB 없음(과제는 JSON).
- 규칙: 포크 금지, 오픈소스는 복사 후 README `Credits`에 출처, 사전 제작 코드 금지.

---

## 10. 열린 질문

1. 데모 첫 과제를 **방제 / 파종 / 서리** 중 무엇으로 할지 (방제가 규칙이 가장 명확)
2. 데모 필지·날짜: 실제로 조건이 갈렸던(예보는 가능, 실측은 불가) 날을 찾아야 임팩트 있음
3. 피치의 주인공을 **데이터사**로 할지 **농장**으로 할지 (트랙상 데이터사가 1순위)
4. "왜 이 팀이" 답변
5. 과금 단위: 과제당 vs 환경 라이선스 vs 구독

## 11. 미확인

- 2025년 원인별 보험금 내역 (RMA Cause of Loss 원자료)
- 현재 디캄바 등 제초제 라벨의 정확한 풍속·강수 기준
- Open-Meteo 현재 가격·과거 HRRR 제공 여부
- John Deere 공식 개발자 문서의 API 범위·접근 조건
- 2,000에이커 이상 농장의 전체 경작지 점유율 (Census 전국 표)
- 옥수수 파종 지연의 일당 수량 손실 (콩은 5/20 이후 하루 0.62부셸 감소)

---

---

# Part 2. 제품 초안 v0.1 (FieldBench)

> 이 문서는 해커톤 발표용이 아니라, 우리가 이 리스크를 지고 회사를 한다면 무엇을 만들고 무엇으로 검증할지를 적은 문서다. 좋은 말보다 틀릴 수 있는 지점을 먼저 적는다.

---

## P1. 솔직한 판단: 지금 이대로 제품이 되는가

**아직 아니다.** 지금 있는 것은 "시장이 있다"는 근거이고, "우리가 이길 수 있다"는 근거는 아직 없다. 제품이 되려면 아래 세 가지가 증명되어야 한다.

| # | 증명해야 할 것 | 지금 상태 | 못 하면 |
|---|---|---|---|
| 1 | **우리 필지 보정 예보가 무료 예보(NOAA HRRR, NWS 포인트 예보)보다 작업 판단을 더 잘 맞힌다** | 근거 없음. HRRR은 이미 3km·매시간·무료 | 농장이 돈 낼 이유가 사라진다 |
| 2 | **누군가 실제로 돈을 낸다** (농장 쪽 1곳, 데이터사 쪽 1곳) | 인터뷰 0건 | 시장 규모 숫자는 의미 없다 |
| 3 | **RL 환경이 쉽게 복제되지 않는다** | 약함. 공개 기상 데이터 + 규칙만으로는 랩이 직접 만들 수 있다 | 데이터사 매출은 일회성으로 끝난다 |

**결론:** 아이디어를 버릴 단계는 아니지만, "2층 구조라서 좋다"는 말로 넘어가면 안 된다. 진짜 해자는 공개 데이터가 아니라 **농장에서 생기는 판단-결과 기록**이고, 그걸 얻으려면 농장이 먼저 써야 한다. 그래서 순서는 농장 쪽 쐐기(wedge) 제품이 먼저다.

---

## P2. 한 줄 정의

> **FieldBench는 필지 단위 기상으로 "지금 이 밭에서 이 작업을 해도 되는가"를 판단해 주고, 그 판단을 실제 날씨로 채점해 기록하는 엔진이다.**

- 농장에게는: 작업 판단 + 근거 기록
- AI 랩·데이터사에게는: 실측으로 채점되는 농작업 판단 환경
- 공통 자산: **판단-결과 원장(Decision-Outcome Ledger)**

---

## P3. 문제

### 농장 쪽
- 방제·파종·수확은 날씨 창(window)에 맞춰야 한다. 제초제는 풍속, 기온역전, 강수 조건이 라벨로 정해져 있고, 창이 좁다(2017년 6월 인디애나 서중부: 한 달 48시간).
- 대형 농장은 필지가 넓고 흩어져 있어, 같은 농장 안에서도 조건이 다르다. 기존 예보는 필지를 직접 보지 않는다.
- 잘못 판단하면 비용이 크다: 약제 낭비, 재살포, 비산(drift)으로 인한 이웃 피해와 분쟁, 파종 후 한파 피해.
- 판단의 근거를 남기기 어렵다. 누가 언제 어떤 조건에서 작업했는지 기록이 흩어져 있다.

### AI 랩·데이터사 쪽
- RL 환경 수요는 크지만 코딩·웹 중심이다. 코드 밖 도메인은 채점(검증)이 병목이다.
- 기존 농업·기상 벤치마크는 대부분 과거 데이터 기반 정적 문항이라 학습 오염에 취약하다.

---

## P4. 누구를 위한 제품인가

### 첫 고객 (쐐기)
**커스텀 방제업자(custom applicator)와 대형 농장의 농작업 매니저** *(가설, 인터뷰로 검증 필요)*
- 이유: 한 사람이 수천~수만 에이커를 여러 농장에 걸쳐 살포한다. 날씨 창을 놓치면 일정이 밀리고, 비산 사고 시 책임을 진다.
- 이들에게 필요한 것: "오늘 어느 필지부터 돌아야 하나", "이 필지 지금 살포 가능한가", "작업 당시 조건 기록"
- ⚠️ 확인 필요: 디캄바 등 일부 제초제는 살포 시 풍속·기온 등 조건 기록 의무가 있는 것으로 알고 있으나, 현행 라벨 기준으로 재확인 필요. 맞다면 "기록 자동화"가 강력한 구매 이유가 된다.

### 두 번째 고객
**미국 기업농** (수천 에이커 이상, John Deere Operations Center 등에 데이터 축적)
- 필지·작업 기록을 연동해 필지별 작업 판단과 시즌 리포트 제공

### 세 번째 고객 (3번 트랙)
**RL·Eval 데이터사(Scale, Surge, Mercor, Turing 등)와 AI 랩**
- 농장에서 쌓인 판단-결과 원장으로 만든 환경·Eval 셋 구매

### 페르소나 (가설)
| 이름 | 역할 | 하루 | 원하는 것 |
|---|---|---|---|
| 마크 (45) | 아이오와 커스텀 방제업자, 살포기 3대 | 새벽에 날씨 앱 3개를 보고 순서 결정, 낮에는 운전 중 | 한 화면에서 "지금 갈 수 있는 필지" 목록 |
| 사라 (38) | 8,000에이커 기업농 운영 매니저 | Deere Ops Center로 작업 지시, 보험·컴플라이언스 서류 담당 | 필지별 판단 근거와 기록이 자동으로 남는 것 |
| 데이터사 PM | RL 환경 조달 담당 | 코딩 외 도메인 환경을 찾는 중 | 자동 채점되고, 오염되지 않고, 매일 갱신되는 과제 |

---

## P5. 제품 구성

### 5.1 핵심 엔진
| 모듈 | 하는 일 |
|---|---|
| **Field Registry** | 필지(경계·위경도·고도·작물) 등록. 수동 입력 또는 Deere 연동 |
| **Field Forecast** | 공개 예보(GFS/HRRR) + 필지 보정(지형·고도, 이후 CorrDiff 다운스케일, 이후 농장 센서 보정) |
| **Rule Engine** | 작업별 규칙(라벨·확장센터 기준)을 코드로 표현. 예: 풍속 3-10mph, 일출~일몰, 24시간 내 강수 없음 |
| **Window Finder** | 필지 × 시간대별 "작업 가능/불가/주의" 판정과 이유 |
| **Outcome Grader** | 실제 관측값으로 판정을 사후 채점 (예보 판정 vs 실측 판정) |
| **Decision-Outcome Ledger** | 판단, 근거, 실제 작업 여부, 실측 결과, 채점을 한 줄로 기록 |
| **Env Exporter** | 원장에서 RL 환경·Eval 과제 패키지 생성 (JSON, 채점 함수 포함) |

### 5.2 사용자 화면
**농장용 (모바일 우선, 운전 중 사용 고려)**
1. **오늘의 필지 보드:** 필지별 신호등(가능/주의/불가), 다음 가능 시간대, 이유 한 줄
2. **필지 상세:** 시간대별 풍속·돌풍·강수·기온 차트, 작업 가능 구간 하이라이트, 일반 예보와의 차이
3. **작업 기록:** "살포 시작/종료" 버튼 → 당시 조건 자동 첨부 → PDF/CSV 기록
4. **시즌 리포트:** 판단 정확도(우리 판정 vs 실측), 놓친 창, 재작업 건수

**데이터사용 (웹)**
1. **환경 카탈로그:** 작업 유형별 과제 수, 지역, 기간, 난이도
2. **리더보드:** 모델별 점수(우리가 돌린 기준 평가)
3. **패키지 내보내기:** 과제 JSON + 채점 함수 + 라이선스

### 5.3 과제 형식 (환경)
```
task_id, field(위경도·고도·작물), issued_at, horizon(예: 48h)
inputs: 예보 자료(시간별), 작업 규칙, 필지 정보
question: "이 필지에서 제초제 살포 가능한 시간대는?"
answer_format: 시간 구간 리스트
grader: 실측 관측값에 규칙 적용 → 정답 구간 → 점수
scoring: 구간 F1, 잘못된 '가능' 판정(false-go)에 가중 페널티
```
- issued_at이 미래인 과제는 공개 시점에 정답이 존재하지 않음 → 학습 오염 불가
- 난이도 = 예보와 실측이 갈린 정도, 경계 조건(풍속 9-11mph 등) 비율

---

## P6. 범위와 단계

| 단계 | 기간 | 범위 | 성공 기준 |
|---|---|---|---|
| **v0 데모** | 해커톤 5시간 | 아이오와 필지 몇 개, 방제 과제 1종, Open-Meteo 예보·실측, 단순 고도 보정, LLM 2-3개 채점, JSON 내보내기 | 발표에서 "예보는 가능 / 실측은 불가" 사례 1건을 보여준다 |
| **v0.5 백테스트** | 2-4주 | 중서부 관측소(공개 메소넷 데이터) 수백 지점 × 과거 3년, 방제 창 판정 정확도: 우리 vs HRRR vs NWS | **false-go가 HRRR 대비 의미 있게 낮은가.** 못 이기면 예보 개선이 아니라 기록·워크플로로 가치 재정의 |
| **v1 파일럿** | 3개월 (다음 봄 시즌 전) | 방제업자·기업농 3-5곳, 필지 보드 + 작업 기록, 수동 필지 등록 | 주 3회 이상 사용, 1곳 이상 유료 전환 의사 |
| **v1.5 연동** | +3개월 | Deere Operations Center 연동, CorrDiff 2km 다운스케일 | 필지 등록 시간 90% 단축, 정확도 개선 측정 |
| **v2 환경 판매** | 파일럿 1시즌 후 | 원장 기반 환경 패키지, 데이터사 1곳 계약 | 첫 환경 매출 |

**하지 않는 것 (지금):** 하드웨어 센서 제작, 전 지구 모델 자체 학습, 한국·동남아 시장, B2C 앱, 작물 수량 예측.

---

## P7. 지표

| 구분 | 지표 | 의미 |
|---|---|---|
| 예보 품질 | 방제 창 판정 F1, **false-go rate**, false-no-go rate | false-go는 사고, false-no-go는 기회비용 |
| | HRRR/NWS 대비 개선폭 | 이게 없으면 제품 근거가 약해진다 |
| 사용 | 주간 활성 필지 수, 작업 기록 건수 | 원장이 쌓이는 속도 |
| 사업 | 파일럿 에이커, 유료 에이커, LOI 수 | |
| 환경 | 과제 수, 실측 채점 완료율, 데이터사 평가 점수 | |

---

## P8. 사업 모델

| 고객 | 과금 (안) | 근거 |
|---|---|---|
| 방제업자·기업농 | 에이커당 연 구독 ($1-4/에이커 범위에서 검증) | FieldView Plus 연 $649~(1,000에이커 기준 약 $0.65/에이커 ⚠️), 과거 프로 모듈 $3/에이커 |
| 데이터사·AI 랩 | 과제당($200-2,000 시장 단가) 또는 환경 패키지 라이선스 | Epoch AI 단가, 소형 랩 분기 $300-500K 계약 |
| 데이터 제공 농장 | 구독 할인 또는 수익 공유 | 원장 확보 인센티브 |

**단위 경제 감 (추정):** 5,000에이커 농장 × $2/에이커 = 연 $10K. 농장 50곳 = 연 $500K. 데이터사 계약 1건이 농장 수십 곳과 맞먹는다. 그래서 **현금은 데이터사에서, 해자는 농장에서** 나온다.

---

## P9. 리스크와 우리가 질 책임

| 리스크 | 심각도 | 대응 | 포기 기준 |
|---|---|---|---|
| **예보가 무료 예보를 못 이김** | 최상 | v0.5 백테스트를 가장 먼저. 못 이기면 가치를 "기록·워크플로·컴플라이언스"로 옮김 | 백테스트 + 워크플로 가치 모두 근거 없으면 중단 |
| **잘못된 '가능' 판정으로 비산 사고** | 최상 | 판단 보조로 명시, 라벨 우선 원칙, 경계 조건은 '주의'로, false-go 가중 페널티, 배상책임보험 검토, 미국 법률 자문 | - |
| **랩이 환경을 직접 만듦** | 상 | 공개 데이터만으로 만든 과제는 팔지 않는다. 농장 실측·작업 결과가 섞인 과제만 판매 | 원장 없이는 환경 매출 계획을 세우지 않음 |
| **농장 영업이 느림 (계절성, 보수적)** | 상 | 방제업자처럼 의사결정이 빠른 쐐기 고객부터. 시즌 전(겨울~초봄) 파일럿 확보 | 다음 봄 시즌까지 파일럿 0곳이면 쐐기 재검토 |
| **대형 플랫폼(Deere, Bayer, DTN)이 같은 기능 출시** | 중 | 우리는 플랫폼 중립(여러 장비·플랫폼 동시 연동) + 채점 원장. 인수 후보로도 본다 | - |
| **두 고객을 동시에 쫓다 둘 다 놓침** | 상 | 단계표 고수: 농장 파일럿 → 원장 → 환경 판매 | - |
| **한국 팀의 미국 농업 거리감** | 중 | 미국 농학자·방제업자 어드바이저 1명 확보, 원격 인터뷰 20건 | 인터뷰에서 문제 공감이 낮으면 타깃 재정의 |
| **규정 수치 오류** | 중 | 라벨·주별 규정 DB를 출처와 날짜로 관리, 사용자 확인 단계 | - |
| **데이터 라이선스** (Open-Meteo 상업, 농장 데이터 2차 이용) | 중 | 상업 플랜 또는 자체 호스팅, 농장 데이터 2차 이용은 명시적 동의와 수익 공유 | - |

**우리가 지는 책임:** 이 제품의 판단으로 누군가 약을 뿌린다. 틀리면 이웃 밭이 죽고 소송이 난다. 그래서 "정확도"는 마케팅 문구가 아니라 공개 지표로 관리하고, 모르는 것은 "주의"로 말한다.

---

## P10. 해커톤 발표와 실제 제품의 관계

| | 해커톤 (오늘) | 실제 제품 |
|---|---|---|
| 주인공 | 데이터사 (3번 트랙) | 농장 쐐기 고객 → 원장 → 데이터사 |
| 데모 | 과거 날짜 리플레이 + LLM 채점 + JSON 내보내기 | 필지 보드 + 작업 기록 + 사후 채점 |
| 데이터 | Open-Meteo (비상업, 출처 표기) | 상업 데이터 + 다운스케일 + 농장 연동 |
| 말할 것 | "실측으로 채점되는 농업 판단 환경" | "농장이 쓰면서 쌓이는 판단-결과 원장" |

발표에서도 "현금은 데이터사, 해자는 농장"이라는 구조를 숨기지 않는다. 심사위원이 "랩이 직접 만들면?"이라고 물을 때 이게 답이다.

---

## P11. 90일 계획 (해커톤 이후)

| 주차 | 할 일 |
|---|---|
| 1-2 | 미국 방제업자·농작업 매니저 인터뷰 20건 (LinkedIn, 농업 포럼, 확장센터 경유). 디캄바 등 현행 라벨의 기록 의무 확인 |
| 2-4 | v0.5 백테스트: 공개 메소넷 관측 vs HRRR vs 우리 보정. false-go 비교표 |
| 4-6 | 결과로 판단: 예보 우위 있음 → 그대로 / 없음 → 기록·워크플로 중심으로 재정의 |
| 6-10 | v1 파일럿 제품 (필지 보드, 작업 기록), 파일럿 3-5곳 확보 |
| 8-12 | 데이터사 2-3곳과 대화: 원장 기반 환경 샘플 공유, LOI |
| 12 | 다음 봄 시즌 파일럿 시작 |

---

## P12. 팀이 정해야 할 것

1. 첫 쐐기 고객: 방제업자 vs 기업농 매니저
2. 첫 작업 유형: 방제(규칙 명확, 사고 위험 큼) vs 파종(위험 작음, 규칙 덜 명확)
3. 예보 우위가 백테스트에서 안 나오면, 기록·컴플라이언스 제품으로 갈 의지가 있는가
4. 미국 현지 어드바이저 확보 방법
5. 해커톤 이후에도 이 팀으로 계속할 것인가

---

## P13. 아직 모르는 것

- 현행 제초제 라벨의 풍속·강수 기준과 기록 의무
- 방제업자가 지금 쓰는 도구와 지불 의사
- 필지 보정이 HRRR 대비 실제로 얼마나 나아지는지
- Deere 공식 API 접근 조건 (파트너 심사 여부)
- Open-Meteo 상업 조건, 과거 HRRR 제공 여부

---

## Sources

**RL 환경·데이터 시장**
- [Wing VC – Who Will Win the RL Environment Market](https://www.wing.vc/content/who-will-win-the-rl-environment-market--and-why)
- [Wing VC – RL Beyond Verifiable Rewards](https://docs.wing.vc/content/how-ai-learns-tasks-it-cant-verify-rl-beyond-verifiable-rewards)
- [Wing VC – RL Environments by 2030](https://www.wing.vc/content/rl-environments-for-agentic-ai-who-will-win-the-training-verification-layer-by-2030)
- [Thoughtworks Radar – Agentic RL environments](https://www.thoughtworks.com/radar/techniques/agentic-reinforcement-learning-environments)
- [arXiv 2503.23829 – Verifiable rewards across domains](https://arxiv.org/pdf/2503.23829v1)
- [TechCrunch – Silicon Valley bets big on environments](https://techcrunch.com/2025/09/21/silicon-valley-bets-big-on-environments-to-train-ai-agents/)
- [Troveo – RL Environment Companies 2026](https://www.troveo.ai/resources/rl-environment-companies)
- [Troveo – How to Sell RL Environments to AI Labs](https://www.troveo.ai/resources/sell-rl-environments)
- [DataGravity – RL Environments for Agentic AI](https://www.datagravity.dev/p/rl-environments-for-agentic-ai-who)
- [RL-List directory](https://www.rl-list.com/)
- [Dealroom – Mercor $2B run rate](https://dealroom.co/news/137121-mercor-doubles-to-2b-gross-revenue-run-rate-as-ai-labs-buy-expert-data/)
- [HeroHunt – Mercor vs Surge vs Scale 2026](https://www.herohunt.ai/blog/mercor-vs-surge-vs-scale-ai-2026-buyer-guide/)
- [Sacra – Mercor](https://sacra.com/c/mercor/)

**벤치마크**
- [Prophet Arena (ICLR 2026)](https://iclr.cc/virtual/2026/10018231)
- [ForecastBench 관련 – arXiv](https://arxiv.org/html/2510.17638v1)
- [Zephyrus / ZephyrusBench](https://arxiv.org/pdf/2510.04017)
- [CLLMate](https://arxiv.org/pdf/2409.19058)
- [AgriGPT / AgriBench-13K](https://arxiv.org/pdf/2508.08632)
- [AgReason](https://app.alphaneural.io/datasets/BGLab/AgReason)
- [AgriWorld (2차 요약)](https://www.emergentmind.com/papers/2602.15325)
- [CROP (NeurIPS 2024)](https://nips.cc/media/neurips-2024/Slides/97570_Alv5VGi.pdf)

**농업·보험·데이터**
- [RMA Summary of Business 2025 (2026.9.7)](https://public-rma.fpac.usda.gov/ReportShare//Extranet/SOB/WeeklyReports/20260907/insplan2025.pdf)
- [farmdoc daily – Crop insurance loss experience 2025](https://farmdocdaily.illinois.edu/2026/07/crop-insurance-loss-experience-in-2025-more-of-the-same.html)
- [EWG – $118.7B crop losses](https://www.ewg.org/news-insights/news-release/2023/11/ewg-extreme-weather-linked-climate-crisis-triggered-1187b-crop)
- [EWG – Crop Insurance database](https://farm.ewg.org/cropinsurance.php?)
- [AgManager – Losses 2025](https://www.agmanager.info/sites/default/files/pdf/Losses_2025.pdf)
- [USDA ERS – rented farmland & large operations](https://ers.usda.gov/data-products/charts-of-note/109182)
- [USDA ERS chart – precision ag adoption](https://www.ers.usda.gov/data-products/charts-of-note/105914)
- [Investigate Midwest – precision ag on big farms](https://investigatemidwest.org/2023/04/13/graphic-precision-agriculture-technologies-most-common-on-big-farms-in-midwest/)
- [Purdue – Farm data usage in commercial agriculture](https://ag.purdue.edu/commercialag/home/resource/2020/01/farm-data-usage-in-commercial-agriculture)
- [The Weather Company – GRAF ag blog](https://www.weathercompany.com/blog/protecting-crop-yields-and-equipment-with-advanced-weather-data-apis/)
- [John Deere Data Services Statement](https://www.deere.com/en/privacy-and-data/data-services/index.html)
- [API Evangelist – Deere APIs](https://providers.apievangelist.com/providers/deere/)
- [RDO – Operations Center tips](https://www.rdoequipment.com/resources/blogs/tips-for-how-to-use-john-deere-operations-center-to-get-maximum-value)
- [Embedded Computing – JD AI Assistant & data commitments](https://embeddedcomputing.com/technology/ai-machine-learning/john-deere-announces-its-jd-ai-assistant-aiding-in-improved-yields-lower-cost-and-higher-profit)
- [yespress – FieldView pricing ⚠️](https://yespress.io/climate)
- [NDSU – FieldView Plus (2018)](https://www.ag.ndsu.edu/carringtonrec/archive/documents/extensionoutreach/coombe-premium-ag-solutions-planter-clinic-climate-fieldview-plus)

**농작업 기준**
- [Purdue – Wind speeds and new dicamba labels](https://extension.entm.purdue.edu/newsletters/pestandcrop/article/update-on-wind-speeds-and-the-new-dicamba-labels)
- [OSU – Dicamba fact sheet](https://williams.osu.edu/sites/williams/files/imce/Program_Pages/ANR/Dicamba_FactSheet.pdf)
- [UK – Dicamba stewardship](https://weedscience.ca.uky.edu/files/dicamba_stewardshipuk_011518.pdf)
- [AgWeb – Guide to your dicamba label](https://www.agweb.com/news/crops/crop-production/guide-your-dicamba-label)
- [ISU – Weather forecast delays corn planting](https://crops.extension.iastate.edu/cropnews/2013/05/weather-forecast-delays-corn-planting-late-planting-does-not-foretell-lower-yields)
- [Iowa Capital Dispatch – Low soil temps slow planting](https://iowacapitaldispatch.com/2022/05/02/low-soil-temps-soggy-conditions-slow-spring-corn-planting/)
- [Iowa Capital Dispatch – Half of Iowa corn planted](https://iowacapitaldispatch.com/2022/05/16/farmers-plant-nearly-half-of-iowas-corn-in-past-week/)

**기상 기술·경쟁사**
- [NVIDIA CorrDiff 문서](https://docs.nvidia.com/physicsnemo/25.08/physicsnemo/examples/weather/corrdiff/README.html)
- [NVIDIA – Gen AI super-resolution blog](https://developer.nvidia.com/blog/gen-ai-super-resolution-accelerates-weather-prediction-with-scalable-low-compute-models)
- [NVIDIA Earth-2 CorrDiff NIM quickstart](https://docs.nvidia.com/nim/earth-2/corrdiff/latest/quickstart-guide.html)
- [Open-Meteo pricing](https://open-meteo.com/en/pricing)
- [Open-Meteo – API subscriptions for commercial use](https://openmeteo.substack.com/p/api-subscriptions-for-commercial)
- [WindBorne Series B](https://windbornesystems.com/blog/windborne-systems-raises-37-million-to-build-the-worlds-weather-intelligence-infrastructure)
- [Silurian $6M](https://finder.techleap.nl/news/feed/silurian-raises-6m-for-ai-driven-weather-forecasting-foundation-models)
- [Brightband (TechCrunch)](https://techcrunch.com/2024/09/19/brightband-sees-a-bright-and-open-source-future-for-ai-Powered-weather-forecasting)
- [Excarta (iGrow News)](https://igrownews.com/excarta-revolutionizing-business-weather-forecasting-with-ai/)
- [Google 기상 다운스케일링 특허](https://patents.google.com/patent/US11500126)
