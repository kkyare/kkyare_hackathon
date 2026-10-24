# 10. 유사 기업/프로젝트 경쟁 조사 (2026-10-24)

범위: weather-graded agricultural decision task factory (AI data company/lab 대상)와 겹치는 플레이어.
태그: [확인] = 해당 페이지/논문을 직접 열어 확인, [2차] = 디렉터리·위키·블로그·언론 등 2차 출처, [미검증] = 검색했지만 못 찾았거나 출처 간 충돌.
주의: WebFetch/WebSearch 요약 모델을 거친 내용이라 숫자는 인용 전 원문 재확인 권장. 자금/고객 수치는 대부분 자기 보고 또는 2차 출처다.

## 0. 결론 (먼저)

1. **우리의 정확한 조합(weather-graded + 농업 운영 + agentic dispatch + 데이터 회사/랩에 판매)을 이미 하는 곳은 찾지 못했다.** [확인: 아래 각 카테고리 검색에서 일치 사례 0건; 단, "없음"의 증명은 아님 -> 신규 stealth 팀 가능성은 [미검증]]
   - RL env 벤더 목록 42개(rl-list.com)에 농업/날씨/예보/에너지 전문 벤더가 없다고 확인됨. [2차] https://rl-list.com/
   - alignlist 42개사 목록에도 동일. [2차] https://alignlist.com/guides/top-40-rl-environments-startups-and-companies
   - Prime Intellect prime-environments repo 121개 디렉터리 이름에 weather/agri/dispatch/logistics 없음 (tau_bench, taxcalc_bench, med_agent_bench, bixbench 등만 있음). Hub 전체(커뮤니티 업로드 포함)는 JS 로딩으로 열람 불가 -> [미검증]. https://github.com/PrimeIntellect-ai/prime-environments/tree/main/environments
2. **각 구성요소는 따로 존재한다.** (a) 미래 outcome으로 채점/학습: Lightning Rod, FutureWorld, Prophet Arena. (b) 운영 시뮬레이션 RL env를 랩에 판매: Maingen, Idler, Halluminate. (c) 날씨 agent 벤치: AgentCaster, Zephyrus. (d) 농업 agent 프레임워크: AgriWorld. (e) cost-loss 의사결정: FWBench(전력/자전거, 날씨 아님). **교집합(농업 x 날씨 outcome x 비용-손실 regret x 상업 납품)은 비어 있다.**
3. **가장 가까운 위협 3개**: Maingen(산업 운영 RL env, 같은 고객, 같은 "operator 경험을 env화" 서사, YC S26), Lightning Rod(outcome-as-label 파이프라인이 SDK로 이미 제품화, leakage 통제 서사 동일), Mercor/Turing/Halluminate류(고객이자 잠재 in-house 경쟁자, 도메인 expert를 이미 보유; Mercor는 Deeptune/Sepal 인수로 env 내재화 중).
4. **추천 차별화 문장**: "이미 일어난 날씨로 채점하는 유일한 농업 운영 RL 환경 공장 -- 의사결정 시점의 forecast만 보여주고(leakage 차단), 실제 관측 날씨로 cost-loss regret을 계산하고, 기준 forecast 대비 skill score까지 내서, verifiers 포맷과 검증 리포트로 납품한다."

## 1. 비교표

| 플레이어 | 하는 일 | 겹침 (고/중/저, 차원) | 자금/단계 | 고객 | 가격 |
|---|---|---|---|---|---|
| Lightning Rod Labs | Future-as-Label로 타임스탬프 문서 -> 예측 라벨 데이터셋 생성 SDK + Foresight 모델 | 중: grading 철학(미래 outcome = label), leakage 분리. 도메인/태스크 다름 | Phaze Ventures 포트폴리오, 금액 미공개 [2차] | 미공개 (후기만) | 사용량 과금 추정, 신규 $50 크레딧 [2차] |
| FutureWorld (arXiv) | 실세계 outcome 보상 live RL env (verl-tool-future) | 중: grading 방식. 일반 이벤트, 농업/날씨 아님 | 학계 | - | 코드 공개 예정 [확인] |
| Prophet Arena (UChicago SIGMA) | Kalshi/Polymarket live 예측 벤치 | 낮음-중: grading(outcome), 판매 아님 | 학계 | - | - |
| ForecastBench (FRI) | 1,000 문항 dynamic 예측 벤치 | 낮음: 평가 방식만 | 비영리 | - | - |
| FutureX | live future-prediction agent 벤치 | 낮음 | 학계 (ByteDance 등) | - | - |
| Metaculus FutureEval | bot 대회/벤치 | 낮음 | 연 $175k 상금 | - | - |
| Maingen (YC S26) | 산업 운영 RL env + 데이터를 프런티어 랩에 판매; SolarBench(태양광 포트폴리오 on-call, dispatch/발주, P&L 채점) | **높음: 고객, 태스크 유형(운영/dispatch), 비즈니스 모델.** 도메인(태양광)은 다름. 날씨 outcome 채점은 아님 | YC S26, 금액 미공개 | "프런티어 랩과 작업 중"(미명시) | 미공개 |
| Idler | 실제 프로덕션 업무 기반 맞춤 RL env/eval (ShelfLife retail ops sim) | 중: 고객, 운영 sim | $9M seed(Paradigm) 보도, 미확정 [2차] | 미명시 | 맞춤 계약 |
| Halluminate | 금융/컨설팅 RL env, expert network ($100-250/h) | 중: 고객, 납품 형태(expert 작성 task+verifier) | $30M Series A (Oak HC/FT, 2026-10-01), 총 $38.5M [2차] | 5대 랩 중 4곳 주장 | 미공개 |
| Mechanize | 코딩 중심 long-horizon env | 낮음: 고객 | $9.1M @ $500M (2026-04), 공동창업자 DeepMind 이동 보도 [2차] | Anthropic 등(자기주장) | 미공개 |
| Andon Labs | Vending-Bench 등 운영 장기 벤치, held-out eval을 랩에 직접 평가 | 중: 태스크 유형(운영 시뮬), 고객(Anthropic 확인) | YC W24, 약 $500K (출처 충돌) [2차] | Anthropic, xAI | eval 수행, 가격 미공개 |
| Deeptune / Sepal AI | 직장 시뮬 env / 과학 env, 둘 다 Mercor 인수 | 중: 경쟁자이자 고객 내재화 증거 | Deeptune $43M Series A(a16z) 후 인수; Sepal 2026-02 인수 [2차] | - | - |
| Turing (RL gyms / Turing Frontier) | 전문가 프롬프트+verifier, 도메인 SME 연결 | 중-높음: 고객이자 경쟁자 | 비상장 대형 | 랩 | 미공개 |
| Mercor | 전문가 마켓 + APEX 벤치 + env 내재화 | 높음: 고객 (농업 전문가 $55-85/h 공고 확인) | $10B 가치, 연 매출 $2B 보도 [2차] | 랩 | 전문가 시급 |
| Pasiflora AI | 신규 expert network (2026-04), 농업 role $60-85/h | 중: 농업 전문가 공급 (파트너 후보) | 신생 [2차] | 미확인 | - |
| AgentCaster (Caltech) | 토네이도 확률 예측 multimodal agent env + 벤치 | 중: 날씨 agent, 확률 채점(관측 verified). 농업/운영/상용 아님 | 학계 | - | - |
| Zephyrus/ZephyrusBench | 날씨 과학 agent, 2,230 QA/49 tasks, MIT | 낮음-중: 날씨 agent 평가, 의사결정 아님 | 학계 | - | 오픈 |
| AgriWorld | 농업 코드실행 agent + 실행형 checker | 중-높음: 도메인(농업), grading(executable). 날씨 outcome/RL/상용 없음 | 학계 (SYSU) | - | 공개 여부 불명 |
| FWBench | LLM의 예측 도구 선택+용량 결정, loss-cost 채점 | 중: cost-loss 채점 방식. 전력/자전거 도메인 | 개인 논문 | - | - |
| Bayer E.L.Y. | 작물보호 Q&A 모델 + 156문항 공개 벤치 | 낮음-중: 도메인, 농업 incumbents가 eval 자료를 이미 공개 | Bayer | 내부/농업인 | - |

## 2. 카테고리별 상세

### 2.1 Real-world-outcome-graded RL / forecasting 데이터

**Lightning Rod Labs** (가장 주목)
- 판매: 타임스탬프 문서(뉴스, SEC, 이메일, 티켓)에서 질문 생성 -> 이후 증거로 라벨링하는 파이프라인(seed generator -> question generator -> labeler). 질문 생성과 결과 resolution을 분리해 leakage 통제. 출력에 인용과 추론 체인 포함, HuggingFace/Parquet/JSON export. `pip install lightningrod-ai`. [2차: 검색 요약] https://sdk.lightningrod.ai , https://docs.lightningrod.ai/python-sdk/getting-started/quickstart
- 자금/고객/가격: 금액 미공개, Phaze Ventures 포트폴리오. 고객명 미공개. 가격표 없음, 신규 $50 크레딧. [2차] https://www.longtermwiki.com/wiki/lightning-rod-labs (이 위키 자체가 2026-05 이후 미갱신, 일부 인용 부정확 플래그됨 -> 신뢰도 낮음)
- 자체 성과 주장: Foresight-32B가 라이브 Polymarket에서 Brier 0.199로 o3(0.205) 앞섬, Foresight-v3 ProphetArena 1위. 전부 회사 주장 [미검증]. https://blog.lightningrod.ai/p/foresight-32b-beats-frontier-llms-on-live-polymarket-predictions
- 겹침: **grading 철학(미래 = label)**. 차이: 그들은 텍스트 이벤트 예측(yes/no 확률), 우리는 연속 의사결정+비용 모델+도메인 시뮬. 배울 점: 질문 생성/resolution 분리, 인용 포함 provenance 출력, SDK 형태.
- 학계 근거: Turtel et al. outcome-based RL (arXiv 2505.17989), Future-as-Label (2026-01). [확인(검색 스니펫)] https://arxiv.org/html/2505.17989v2

**FutureWorld** (arXiv 2604.26733): 예측-결과 실현-파라미터 업데이트 루프를 닫는 live RL env, 일반 이벤트. 코드는 "곧 공개". 우리와의 차이: 날씨/농업 없음, 의사결정 아님. [확인] https://arxiv.org/abs/2604.26733

**Prophet Arena**: UChicago SIGMA, Kalshi/Polymarket live 이벤트로 LLM 예측 평가. ICLR 2026. 벤치이며 판매 모델 없음. [확인] https://arxiv.org/abs/2510.17638v1
**ForecastBench (FRI)**: 1,000 문항 dynamic 벤치, superforecaster 대비. 2025-10 기준 최고 LLM 0.101 vs superforecaster 0.081, LLM-superforecaster parity를 2026 말로 전망. [2차] https://forecastingresearch.substack.com/p/ai-llm-forecasting-model-forecastbench-benchmark
**FutureX** (ICLR 2026, ByteDance Seed 등): 매일 갱신 live 벤치, 25개 모델/에이전트. [확인] https://arxiv.org/abs/2508.11987
**Metaculus FutureEval**: bot 대회 연 $175k 상금 규모, 2주 단위 MiniBench. [2차] https://metaculus.substack.com/p/metaculus-futureeval-ai-forecasting-benchmark
- Kalshi/Polymarket 기반 "판매용 데이터셋" 업체: 이번 검색에서 별도 발견 못함 [미검증].
- 시사점: "outcome = 정답" 방식 벤치는 학계 표준이 됐다 -> 우리의 outcome 채점은 신기함이 아니라 **전제**. 차별화는 도메인(날씨 x 농업 비용 구조)과 납품 형태에 있다.

### 2.2 Domain-specific (비코딩) RL env 벤더

**Maingen (YC S26)** -- 최우선 경계 대상
- 산업(공장, 발전소, 데이터센터) 운영 RL env를 프런티어 랩에 판매. SolarBench: 태양광 원격 운영 데스크에서 alert, telemetry, work order, 기술자 dispatch, 부품 발주 등 가격이 붙은 비가역 행동으로 포트폴리오 P&L 최대화. 런칭 시 8 task x 11 모델 x 10 run (880 graded weeks) 보고. [2차] https://yespress.io/maingen-yc-s26.md ; [확인] https://www.ycombinator.com/companies/maingen (사업 설명, 창업자 Phillip Yan(0x, Scale, Coinbase)/David Yang(Scale 등), 자금 미기재, "이미 프런티어 랩과 작업 중" 주장)
- 겹침 높음: 고객, 태스크 유형(dispatch/운영), 판매 방식. 다름: 날씨/예보 불확실성이 핵심 채점 축이 아님, 농업 아님, 수작업 operator embed 방식(자동 팩토리 아님).
- 배울 점: "operator 경험을 env로" 서사, P&L로 채점하는 단일 숫자, 한 항목 실패 시 주 전체 실패 같은 엄격 채점.

**Idler**: ShelfLife(실제 이커머스 digital twin 200 env), ShelfLife E-Sim(일 단위 소매 운영 sim), CorpLaw. 채점은 quantitative/integrity/withholding 3종 criteria. $9M seed(Paradigm) 보도 미확정. [2차] https://www.rl-list.com/vendors/idler
**Halluminate**: 금융 RL env, expert 시급 $100-250, Series A $30M(2026-10-01) 보도, 5대 랩 중 4곳 고객 주장, mid-eight-figure 런레이트 자기보고 [2차] https://www.rl-list.com/vendors/halluminate . 시사점: **이 카테고리에 실제 돈이 몰리고 있다**(시장 존재 증거), 동시에 전문 도메인별 벤더가 계속 생기는 중.
**Andon Labs**: Vending-Bench(1년 시뮬 운영, 최종 잔고로 채점), Drone-Bench 등. 랩이 학습 못 하게 held-out eval을 직접 수행하는 모델. Anthropic, xAI 협업 확인. 자금 약 $500K(출처 충돌). [2차] https://www.rl-list.com/vendors/andon-labs ; Vending-Bench 2는 Epoch AI 벤치 페이지에도 등재 https://epoch.ai/benchmarks/vending-bench-2
- 배울 점: held-out(비학습) 평가 판매 모델과, 학습용 env 판매 모델을 구분해 제안할 수 있다. 우리 leakage check/난이도 보정이 "held-out 신뢰성" 가치와 연결된다.
**Mechanize**: 코딩 중심, 비코딩 env 없음. $9.1M @ $500M, 공동창업자 DeepMind 이동 보도. [2차] https://www.rl-list.com/vendors/mechanize
**Deeptune / Sepal AI**: 둘 다 Mercor가 인수(Sepal 2026-02, Deeptune 2026-07 보도). Deeptune $43M Series A(a16z). [2차] https://www.orrick.com/en/News/2026/02/Mercor-Acquires-Sepal-AI , https://finance.yahoo.com/sectors/technology/articles/exclusive-andreessen-horowitz-backs-deeptune-120000793.html
-> 시사점: Mercor는 env 제작을 **인수로 내재화**한다. 우리의 exit/고객 시나리오 둘 다 해당.
**Turing**: RL gyms, "Turing Frontier"(2026-04-09 발표), 전문가가 프롬프트/env/evaluator 제작, pass/fail 평가 리포트. [확인] https://turing.com/advance/rl-gyms , https://www.businesswire.com/news/home/20260409774528/en/Turing-Announces-Turing-Frontier-Connecting-AI-Labs-with-Elite-Domain-Experts
**기타(Veris AI, Plato, Fleet, HUD, Bespoke, Datacurve, Habitat, Matrices)**: 목록상 코드/브라우저/엔터프라이즈 워크플로 중심, 농업/날씨/예보 없음. 자금/가격은 이번 조사에서 미확인 [미검증]. https://rl-list.com/ , https://alignlist.com/guides/top-40-rl-environments-startups-and-companies
**Prime Intellect Environments Hub**: 공식 repo 121개 환경 중 tau_bench, taxcalc_bench, bixbench 등은 있으나 날씨/농업/dispatch 없음 [확인(디렉터리명 기준)]. 커뮤니티 업로드 전체는 열람 실패 [미검증]. -> "Hub 최초의 weather/ag 환경"이 될 가능성은 있으나 Hub 검색으로 반드시 재확인할 것.

### 2.3 날씨/기후/농업 + LLM agent 평가

- **AgentCaster** (Caltech, NeurIPS 2025): 40일, 500+ 토네이도 보고, 12-36시간 예보 지평, 3,625 forecast map/40,125 sounding 풀에서 도구로 조회, 확률 위험 폴리곤을 관측으로 채점(TornadoBench, TornadoHallucination). 인간 예보관이 모델을 크게 앞섬. [확인] https://arxiv.org/abs/2510.03349v1
  - 겹침: **날씨 agent + 관측 기반 확률 채점 + 인터랙티브 env**. 다름: 순수 기상 예측이지 비용 있는 운영 의사결정이 아님, 상용 아님.
- **Zephyrus / ZephyrusBench** (UCSD, ICLR 2026): ZephyrusWorld 환경, 2,230 QA/49 tasks, WeatherBench 2 기반, MIT 라이선스. [확인] https://arxiv.org/abs/2510.04017v1
- **EWE, HVR-Met, ClimateAgent(Climate-Agent-Bench-85), Anemoi**: 극한기상/기후 데이터 분석 agent, 대부분 LLM-judge 또는 QA 채점. [확인(검색 스니펫)] https://arxiv.org/pdf/2511.21444 , https://arxiv.org/pdf/2603.01121 , https://arxiv.org/abs/2511.20109v1
- **AgriWorld** (SYSU, arXiv 2602.15325, 2026-02): 위성/토양/기상/관리 로그 + 코드실행 agent, executable checker(스키마, 수치 허용오차, 반사실 방향, 물리적 타당성), 관개 반사실 개입. RL 언급 없음, 코드/데이터 공개 링크 없음. [확인] https://arxiv.org/html/2602.15325v1
  - 농업 도메인에서 우리와 가장 가까운 학술 연구. 다름: 예보-관측 시차 기반 outcome regret이 아님, 제품화 아님.
- **AgriAgent**(DSSAT 디지털트윈 내 관개/환기/난방 결정), **AgroAskAI**, **Park & Choi 2024**: 농업 날씨 권고 평가 연구. 분무/서리방제 없음. [2차] https://arxiv.org/abs/2408.04640v1 , https://arxiv.org/pdf/2512.14910
- **FWBench** (arXiv 2609.27385, 2026-09-23, 단독 저자): 예측 도구 선택 + 용량 결정을 loss-cost로 채점, 전력/자전거 1,251 케이스. **날씨/농업 아님.** [확인] https://arxiv.org/abs/2609.27385
  - cost-loss류 의사결정 채점이 LLM agent 벤치로 막 등장했다는 신호. 우리가 말하는 "cost-loss"를 이 논문 용어(loss-cost, budgeted forecast)와 맞춰 설명하면 학술적 맥락을 얻는다.
- **Agri-520**(IEEE DataPort): 지역 날씨 기반 분무 결정 라벨 데이터셋, 구독 접근. 에이전트 평가 아님. [2차] https://ieee-dataport.org/documents/agri-520
- **Bayer E.L.Y.**: 작물보호 Q&A 모델(Phi-3 기반 변형이 Azure 카탈로그), 156문항 공개 벤치(미국 옥수수 포트폴리오). "프런티어 모델은 작물보호 고위험 지침의 깊이가 부족"이 Bayer의 공식 전제. [2차] https://www.bayer.com/en/agriculture/article/genai-for-good (직접 열람 403, 검색 요약 기반)
  - 시사점: 농업 incumbents가 "작물보호는 프런티어 모델이 약하다"는 문제 의식을 공개적으로 갖고 있다 -> 우리의 pain-point 근거로 인용 가능.
- NCAR BEACON: AI 기상 모델 vs 기존 NWP 독립 평가 testbed(METplus). LLM agent 평가 아님. [2차] https://ral.ucar.edu/products/beacon-ai-testbed
- Extreme Weather Bench(Google/NVIDIA), TerraBench, RealBench: **이번 검색에서 확인 안 됨** [미검증]. Google WeatherNext 약관은 출력물로 경쟁 제품 개발 금지 조항 존재 (데이터 소스 선택 시 참고) [2차] https://developers.google.com/weathernext/guides/disclaimers
- 2025-2026 날씨/농업 전용 "eval/RL 데이터를 랩에 파는 스타트업": 검색에서 발견 못함 [미검증].
- ClimateAi, Salient, DTN의 LLM 활용 또는 랩 대상 판매: 검색에서 관련 결과 없음 [미검증].

### 2.4 농업 expert 데이터 제공자

- **Mercor**: "Agricultural Science Expert" $55-85/h, PhD+5년, 작물/토양/해충관리/지속가능성, 주 10-20시간. "Agronomy Specialist" $72-80/h, 문제 세트와 참조 해답 작성(작물 수치, 토양 단면, 수확 차트 기반). 별도 "Agriculture Expert"는 모집 종료, 인재 네트워크로 전환. [확인(공고)] https://work.mercor.com/jobs/list_AAABl8hhuyFZA2Ny16JDPoWd/agricultural-science-expert , https://remotive.com/remote/jobs/all-others/agronomy-specialist-4524110
  - 시사점: **Mercor가 농업 문제 세트를 사람 손으로 만들고 있다 = 수요의 직접 증거.** 사람 작성 task는 시간당 $55-85 -> 자동 생성 + outcome 채점은 비용/규모/검증 가능성에서 차별화.
- **Pasiflora AI**: 2026-04 런칭 expert network, 농업 role $60-85/h (석사 이상), 농업 데이터 주석과 AI 농학 조언 오류 검증. 고객명 미확인. [2차] https://alignlist.com/companies/pasiflora-ai , https://remowork.life/jobs/6a6f9cd2e681430a6b694222/agronomy-and-crop-science-expert
- **Outlier/Scale**: 40+ 도메인, 기후과학/지구과학 공고(날짜 불명)는 있으나 농학 전용 공식 프로젝트 확인 못함 [2차] https://outlier.ai/blog/so-what-do-outlier-experts-actually-do
- Handshake AI, Invisible, Toloka, Appen의 농학 프로젝트: 검색 결과 없음 [미검증].

### 2.5 농업 의사결정 incumbents

- Bayer만 확인(위 E.L.Y.). Climate FieldView, Agrian/TELUS, FieldWatch, DTN이 AI 랩에 데이터/eval을 판다는 근거 없음 [미검증].
- 가능성: 라벨 DB(Agrian/TELUS) 라이선스를 쥔 곳이 compliance 룰의 정답 소스가 된다 -> 경쟁보다 데이터 파트너 후보. (가설, 미검증)

## 3. 종합 판단

**이미 완성된 곳이 있는가?** 아니오(확인 범위 내). 가장 가까운 3축 조합:
- Maingen = 운영 dispatch RL env + 랩 판매 (날씨 채점/농업 없음)
- Lightning Rod / FutureWorld = outcome-as-label (운영 의사결정/도메인 시뮬 없음)
- AgentCaster / AgriWorld = 날씨 또는 농업 agent 평가 (상용/regret 없음)

**최대 위협 순위**
1. Mercor/Turing/Halluminate 등 데이터 회사가 도메인 전문가 + 내재화 env로 농업 task를 직접 제작 (Mercor는 이미 농업 전문가 모집 중이고, 인수로 env 역량 확보).
2. Maingen이 날씨 민감 산업(태양광 발전량, 재생에너지 dispatch)에서 weather-graded로 확장 -- 날씨 요소는 이미 자연스러운 확장 후보.
3. Lightning Rod의 SDK에 구조화 데이터 소스(날씨 API)와 수치 outcome 라벨러가 추가되는 경우.
4. 학계 오픈소스(AgriWorld류가 공개되고 RL env로 확장)가 "무료 대체재"가 되는 경우.

**차별화 포인트 (방어 가능한 순서)**
1. **Decision-time forecast vintage 보존**: Open-Meteo previous runs로 "그 시점에 볼 수 있었던 예보"만 재현 + 사후 관측 outcome으로 채점. 사람이 쓴 task나 LLM-judge로는 불가. (AgentCaster는 기상 예보 자체의 채점, 우리는 비용 있는 행동 결정의 채점)
2. **3-layer 채점**(규칙 준수 / cost-loss regret / skill score)은 단일 점수(P&L, Brier)보다 진단력이 높고 reward hacking 구분에 유리.
3. **자동 생성 + leakage check + 난이도 보정 + 검증 리포트**: 수작업 벤더(Mercor/Maingen/Halluminate) 대비 비용과 반복 가능성. held-out 신뢰성은 Andon Labs가 이미 팔고 있는 가치와 같은 계열.
4. **기존 포맷 납품**(verifiers): 랩/데이터 회사 통합 마찰 최소화.
5. 비어 있는 도메인: 농업 운영 + 날씨 불확실성은 RL env 벤더 목록 전체에서 부재.

**추천 한 줄**: "사람이 쓴 농업 문제 세트가 아니라, 실제 날씨가 채점하는 농업 운영 RL 환경을 자동으로 찍어내는 공장 -- 의사결정 시점 예보만 보여주고, 관측 날씨로 regret을 계산합니다."

## 4. 한계와 후속 확인 필요

- Prime Intellect Hub 전체 검색(커뮤니티 업로드 포함)은 페이지가 JS 로딩이라 못 함. 발표 전 직접 검색 필수.
- Lightning Rod, Maingen, Idler, Halluminate의 가격/고객은 비공개 또는 자기주장. 인터뷰/콜드메일로만 확인 가능.
- 날짜가 최신(2026-09, 10월)인 일부 항목(Halluminate Series A, Mechanize DeepMind 이동, Vending-Bench 결과)은 2차 출처만 있다.
- 일부 페이지(Bayer, Lightning Rod foresight-data, Lightning Rod docs forecasting)는 403/404/SSL 오류로 직접 열람 못했다.
