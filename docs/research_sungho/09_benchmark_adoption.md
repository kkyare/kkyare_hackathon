# 09. 도메인 에이전트 벤치마크의 채택 사례와 RL environment 시장 (조사일 2026-10-24)

표기: [확인] = 1차 출처(원문 페이지)를 직접 읽음 / [2차] = 블로그·집계 사이트·뉴스 요약 / [미검증] = 못 찾았거나 출처가 충돌함.
한계: 일부 1차 페이지(openai.com)는 403으로 열리지 않았다. 해당 항목은 [미검증]으로 표시했다. 가격·계약 규모는 모두 인터뷰나 보도 기반이다.

## 0. 한 줄 결론

- 도메인 벤치마크가 "중요한 지표"가 되는 경로는 보통 (a) 랩이 launch post에 인용하거나 (b) 랩이 환경을 사서 학습에 쓰는 것이다. 둘 다 headroom, 싼 채점, 현실성이 필요하다.
- 랩이 non-coding RL environment를 사는 것은 사실이다. 다만 수요는 enterprise workflow, finance, law, healthcare 쪽에 몰려 있다. 날씨·농업·운영 환경을 샀다는 증거는 찾지 못했다 [미검증].
- 해커톤 결과물 그대로 "중요한 metric"이 될 확률은 매우 낮다. 현실적인 목표는 "랩이나 벤더가 관심 가질 수 있는 데모 + 설계 문서"다 (섹션 4).

## 1. 채택 사례

### 1.1 τ-bench / τ²-bench (Sierra)
- 제작: Sierra 연구팀, 2024년 6월. pass^k로 "여러 번 반복해도 일관되게 성공하는가"를 측정한다. [확인] https://sierra.ai/blog/tau-bench-shaping-development-evaluation-agents
- 확장판 τ²-bench(telecom 추가)는 Princeton과 Sierra가 2025년 6월 발표했다고 한다. [2차] https://www.datalearner.com/en/benchmarks/Tau-Squared-Benchmark
- 채택:
  - Anthropic Claude 3.7 Sonnet 발표에서 인용 [2차: Sierra 블로그가 링크]. https://www.anthropic.com/news/claude-3-7-sonnet
  - Claude 4 발표에서는 TAU-bench를 쓰되 "no results w/o extended thinking reported"라고 적었다. [확인] https://www.anthropic.com/news/claude-4
  - Claude Opus 4.5 발표에서 "τ2-bench, which measures the performance of agents in real-world, multi-turn tasks"로 인용 [확인] https://www.anthropic.com/news/claude-opus-4-5
  - OpenAI GPT-5 발표에서 τ²-bench telecom 인용: 리더보드 집계상 GPT-5 95.8~96.7 [2차] https://www.datalearner.com/benchmarks/Tau-Squared-Benchmark-Telecom . openai.com 원문은 403이라 직접 확인 못 함 [미검증].
  - Google Gemini 3 발표 블로그에는 τ²-bench가 없었다. [확인] https://blog.google/products/gemini/gemini-3/
- 측정 능력: 정책 문서를 따르면서 유저와 대화하고 tool을 호출해 DB 상태를 바꾸는 능력. 채점은 최종 DB 상태 비교라 싸다.
- 교훈(headroom 소진): telecom은 2026-02 기준 Claude Opus 4.6이 99.25로 사실상 포화다. [2차] https://www.datalearner.com/benchmarks/Tau-Squared-Benchmark-Telecom 도메인이 현실적이어도 headroom이 없어지면 launch post에서 사라진다.
- 수익화: τ-bench 자체로 돈을 번다는 근거는 없다. Sierra는 에이전트 제품 회사이고, 벤치마크는 신뢰도와 채용·마케팅 자산으로 보인다. [확인] 위 Sierra 블로그에 수익화 언급 없음.

### 1.2 Vending-Bench / Vending-Bench 2 (Andon Labs)
- 제작: Axel Backlund, Lukas Petersson. 자판기 사업을 장기간(20M tokens 이상) 운영하며 coherence를 유지하는지를 측정한다. 모델마다 meltdown loop 실패가 있다. [확인] https://arxiv.org/abs/2502.15840
- Vending-Bench 2: 1년 시뮬레이션, $500 시작, 최종 잔고로 채점 [확인] https://andonlabs.com/evals/vending-bench-2
- 채택:
  - Gemini 3 발표: "topping the leaderboard on Vending-Bench 2" [확인] https://blog.google/products/gemini/gemini-3/
  - Claude Opus 4.5 발표: "earning 29% more than Sonnet 4.5 on Vending-Bench" [확인] https://www.anthropic.com/news/claude-opus-4-5
  - Anthropic과 실제 사무실 가게를 운영한 Project Vend(2025-06-27) [확인] https://www.anthropic.com/research/project-vend-1
- 안 된 이유가 아니라 된 이유: 점수가 달러라서 직관적이고, 모델 간 격차가 크며(±표준편차가 큼에도), "실패 일화"가 이야기가 된다. 현재도 상위 모델 점수가 $9k~$15k로 분포해 headroom이 있다. [확인] 위 andonlabs 페이지
- 수익화: 벤치마크는 비공개(held-out)로 두고 평가를 팔고, 자체 AI 운영 사업과 Pion 플랫폼(2026-09-14 research preview)을 운영한다. 고객으로 확인된 곳은 Anthropic(Project Vend/Pilot), xAI. OpenAI·DeepMind는 자기 홈페이지 주장뿐이다. 펀딩은 YC W24 pre-seed, 금액은 PitchBook ~$500K vs Tracxn unfunded로 충돌한다. [2차] https://www.rl-list.com/vendors/andon-labs , https://www.ycombinator.com/companies/andon-labs
- 시사점: 가장 비슷한 선례다. "시뮬레이션 + 장기 운영 + 돈으로 채점"이다. 그러나 이 팀은 랩 협업(Project Vend)이라는 입구를 별도로 만들었다.

### 1.3 SWE-bench / Terminal-Bench
- SWE-bench: GitHub issue 2,294개, unit test로 결정적 채점. Cognition이 Devin 출시 때 13.86% vs 이전 1.96%로 사용했다. [확인(2차 요약 포함)] https://cognition.ai/blog/swe-bench-technical-report . Princeton 기원과 OpenAI Verified 세부는 못 열어 [미검증].
- 거의 모든 Anthropic/Google launch post에 등장한다. Claude 4 "leading on SWE-bench (72.5%)" [확인] https://www.anthropic.com/news/claude-4 , Gemini 3 "SWE-bench Verified (76.2%)" [확인] https://blog.google/products/gemini/gemini-3/
- Terminal-Bench(Stanford + Laude Institute): Laude 자체 글은 "From idea to industry-standard benchmark in 126 days"라고 주장하며, Dario Amodei가 Claude 4 출시 때 인용한 두 benchmark 중 하나라고 한다(자기 보고). [확인(자기 보고)] https://www.laude.org/updates/hello-world . Claude 4 발표에 "Terminal-bench (43.2%)" 확인 [확인] https://www.anthropic.com/news/claude-4 . Gemini 3 "Terminal-Bench 2.0 54.2%" [확인] https://blog.google/products/gemini/gemini-3/
- 공통점: 채점이 결정적이고 싸다 + 개발자가 직접 쓰는 현실 과제 + 랩들이 같은 숫자를 자랑할 이유가 있다.
- 수익화: 둘 다 학술/비영리 성격이다. Cognition은 점수로 제품을 홍보했다. [2차]

### 1.4 GDPval (OpenAI)
- 44개 직업, 9개 GDP 상위 산업, 평균 14년 경력 전문가가 만든 과제. 골드 220개 공개, 자동 채점 서비스 제공. [확인] https://arxiv.org/abs/2510.04374
- 외부 확장: Artificial Analysis가 GDPval-AA(Elo, 블라인드 pairwise)로 리더보드화 [2차] https://artificialanalysis.ai/evaluations/gdpval-aa . 2026년 모델 순위가 launch 맥락에서 인용된다. [2차] https://www.benchlm.ai/benchmarks/gdpvalAaNormalized
- 어느 랩 카드가 정확히 인용하는지는 못 확인했다 [미검증].
- 시사점: non-coding 현실 업무가 "랩이 직접 만든" 경우에는 쉽게 표준이 된다. 외부 팀이 같은 지위를 얻으려면 리더보드 운영자(Artificial Analysis 등)를 통하는 길이 있다.

### 1.5 BrowseComp (OpenAI)
- 원문(openai.com/index/browsecomp)은 403이라 직접 읽지 못했다 [미검증]. "찾기 어렵고 검증은 쉬운 질문"이라는 설계로 알려져 있으나 이 조사에서 1차 확인은 못 했다.

### 1.6 ForecastBench / Prophet Arena (예측 계열, 우리와 가장 가까운 "실제 결과로 채점")
- ForecastBench(Forecasting Research Institute): 동적 벤치마크, 미래 사건 질문 약 1,000개로 contamination 회피. 2025-10 업데이트에서 최고 LLM 0.101 vs superforecaster 0.081(낮을수록 좋음), 외삽 parity 시점 약 2026-11(구간 2025-12~2028-01). [2차] https://forecastingresearch.substack.com/p/ai-llm-forecasting-model-forecastbench-benchmark , https://arxiv.org/pdf/2409.19839 (ICLR 2025 게재 [2차])
- 비판: yes/no 문항만 다룬다. https://goodjudgment.com/human-vs-ai-forecasts/ [2차]
- Prophet Arena(U. Chicago): prediction market(Kalshi, Polymarket) 미해결 사건으로 live 평가, ICLR 2026. [2차] https://arxiv.org/abs/2510.17638v1 , https://decrypt.co/336298/ai-now-matches-prediction-markets-in-forecasting-real-events-study-finds
- 이 둘이 Anthropic/OpenAI/Google launch post에 인용된다는 증거는 이번 조사에서 못 찾았다 [미검증]. 학계와 forecasting 커뮤니티에서는 알려졌지만 랩 headline metric은 아닌 것으로 보인다.
- 시사점: "실제 관측 결과로 채점"은 contamination 방어가 강하지만, 채점이 느리고(결과를 기다려야 함) 랩이 학습 루프에 쓰기 어렵다. 우리가 "결정 시점 forecast 대비 규칙 준수"를 즉시 채점하고 "실제 날씨 대비 outcome"을 사후 채점으로 분리한 것은 올바른 설계다.

### 1.7 날씨·농업 인접 벤치마크 (경쟁/선행)
- AgriWorld/AgroBench(arXiv 2026-02): 농업 tool 환경, 코드 실행 에이전트. 날씨 forecast 기반 규제 준수 dispatch는 아님. [2차] https://arxiv.org/abs/2602.15325
- DeLLMa: USDA 데이터로 불확실성 하 의사결정 평가(학술). [2차] https://arxiv.org/pdf/2402.02392
- 정확히 "농약 살포 dispatcher + 규제 + forecast 갱신"인 공개 벤치마크는 못 찾았다 [미검증]. 빈 자리는 맞지만, 빈 자리가 곧 수요는 아니다.

## 2. 랩/데이터 기업이 non-coding 환경을 사는가

### 2.1 수요 증거
- Epoch AI 인터뷰(2026-01-12): RL이 주 용도이고 benchmark 요청보다 약 10~20배 많다는 한 창업자 추정. 구매자는 frontier lab과 neolab. enterprise workflow가 가장 빠르게 성장("going to explode this year"). [확인] https://epoch.ai/gradient-updates/state-of-rl-envs , https://epochai.substack.com/p/an-faq-on-reinforcement-learning
- TechCrunch(2025-09-16): a16z Jennifer Li "All the big AI labs are building RL environments in-house," 그러나 외부 벤더도 본다. The Information 보도로 Anthropic 리더들이 1년에 $1B 이상 환경에 쓰는 것을 논의했다. [확인] https://techcrunch.com/2025/09/16/silicon-valley-bets-big-on-environments-to-train-ai-agents/ (보도이며 확정 수치 아님)
- Anthropic 채용: Domain Scaling 팀은 finance, healthcare, legal 등의 실무 지식 작업 개선을 위해 RL environment 생성(과제 선정, 보상 설계, 벤더 관리)을 담당한다. 2026-06-20 게시 미러, 연봉 USD 350k~850k. Cowork 역할은 재무 모델 작성 등 현실 과제로 환경을 설계한다. [2차: 채용 미러] https://jobs.accel.com/companies/anthropic/jobs/83501891-research-engineer-domain-scaling , https://jobs.accel.com/companies/anthropic/jobs/69412086-research-engineer-virtual-collaborator-cowork
- 제3자 계약직: XOR.ai가 규제 도메인(금융, 의료) 환경 엔지니어를 시간당 $90~160에 채용. 어떤 랩 소속도 아님. [2차] https://jobs.signalfire.com/companies/xor-ai-2/jobs/69849407-reinforcement-learning-environments-engineer
- Mercor: finance, law, healthcare 환경 피치, 평가 $10B [확인(보도)] 위 TechCrunch. Surge: 연 매출 $1.2B 보도, 내부 환경 팀 신설 [확인(보도)] 동일. Scale: 신규 학습 프로젝트의 약 절반이 RL environment라는 주장(Scale 자체) [2차] https://www.itiger.com/news/1158607486
- 2026 펀딩(집계 사이트 기준, 1차 아님):
  - Prime Intellect $130M Series A(2026-07-08, 약 $1B 평가) [2차] https://www.rl-list.com/vendors/prime-intellect
  - Bespoke Labs $31.8M Series A(2026-07-06) [2차] https://seedtable.com/companies/bespoke-labs
  - Idler $9M seed(Paradigm, 2026-08-19) [2차] https://dealroom.co/news/146192-idler-raises-9m-seed-from-paradigm-to-build-rl-environments/
  - Preference Model $16M seed(a16z, 2026-10-07), reward hack 저항 환경 프레임워크 [2차] https://dealroom.co/news/160734-a16z-leads-16m-seed-for-ai-data-startup-preference-model/
  - Mechanize $9.1M 보고, 코딩 환경 중심 [2차] https://www.rl-list.com/
  - HUD는 $500K Series A로 적혀 있어 의심스럽다 [미검증] https://www.vcbacked.co/company/hud-san-francisco
  - Fleet, Plato, Veris, Deeptune, Proximal: 이번 조사에서 확인 가능한 자료를 못 찾았다 [미검증].

### 2.2 가격
- 과제당 보통 $200~$2,000, $20k는 드묾. 계약은 분기당 6~7자리 수, 한 neolab 연구자는 $300k~$500k. website 복제 환경 약 $20k, Slack급 고충실도 복제 약 $300k. 독점 계약은 비독점의 4~5배(두 창업자). [확인] https://epoch.ai/gradient-updates/state-of-rl-envs
- Mechanize 추산: 과제당 run 연산비 약 $480, 5회 재사용 시 약 $2,400. "labs will likely soon spend a few thousand dollars per task". [확인] https://www.mechanize.work/blog/cheap-rl-tasks-will-waste-compute/
- 의미: 우리 한 개 환경(수십 시나리오)의 시장 가격은 단발이면 낮고, 대량의 다양한 과제(수백~수천) 패키지일 때만 큰 돈이다.

### 2.3 non-coding 중 날씨·농업·운영
- 랩이 날씨·농업·logistics 환경을 샀다는 보도·채용·펀딩은 찾지 못했다. [미검증] 검색 결과는 학술 논문과 벤더 블로그뿐이었다.
- 가까운 수요: enterprise workflow, finance terminal, 생물(Benchling-Anthropic 파트너십), 헬스, 장기 horizon 다중 도구 작업. [확인] Epoch FAQ 위 링크.

## 3. 랩이 원하는 기준 (인용)
- Soundness(보상이 진짜 해결을 뜻함): "Soundness matters most: high reward must mean the task was actually solved, not hacked." [확인] https://epoch.ai/gradient-updates/state-of-rl-envs
- 난이도 보정: 최소 pass rate 약 2~3%(64~128 rollout 중 최소 1회 성공), 난이도 분포(0%대, 5%, 30%), 70% 근처는 은퇴. [확인] 동일
- 검증 가능성: "labs index very heavily on what's valuable and what is quantifiable." [확인] https://epochai.substack.com/p/an-faq-on-reinforcement-learning
- 품질: "a large amount of useless bad environments out there." grader는 reward hacking 방어에 "many many iterations"가 든다. [확인] 동일
- 장기 horizon과 다중 도구 사용이 미래 방향. [확인] 동일
- 공통 기술 활용: 과제들이 "disparate"하지 않고 "leverage common skills"해야 한다. [확인] epoch state-of-rl-envs
- 품질 vs 수량: 절차적 생성은 값싸지만 신호가 약하다. [확인] Mechanize 위 링크
- 회의론: Ross Taylor "people are underestimating how difficult it is to scale environments", OpenAI Sherwin Wu는 RL environment 스타트업에 "short", Karpathy "bullish on environments ... bearish on reinforcement learning specifically". [확인] https://techcrunch.com/2025/09/16/silicon-valley-bets-big-on-environments-to-train-ai-agents/
- 랩의 in-housing 증가("substantially more in-housing"), 데이터 벤더는 인력 확보 속도로 평가받음("they have the guys"). [확인] Epoch FAQ
- Wing VC 인용문은 찾지 못했다 [미검증]. (Wing VC는 Bespoke Labs 투자자로만 확인됨 [2차] https://www.mayfield.com/reinforcement-learning-rl-environments-issue-36/)

## 4. 우리에게 주는 시사점

### 4.1 "중요한 metric"이 되려면 필요한 조건
1. Headroom: 현재 frontier 모델이 20~60%대여야 한다. τ² telecom은 99%대라 죽었다. 먼저 Claude/GPT/Gemini 최신을 돌려 점수 분포를 얻어라. 이게 가장 중요한 한 장의 그래프다.
2. 결정적이고 싼 채점: 규칙 준수 채점은 forecast 시점 데이터로 즉시 계산 가능하게 하라(우리 설계 강점). outcome 채점은 사전 기록된 관측 날씨로 재현 가능하게 고정하라.
3. Reward hacking 방어: 에이전트가 규칙을 우회하는 경로(예: 마지막에 acreage 쪼개기, forecast tool 재호출로 값 고르기, 라벨 규칙 해석 모호성)를 직접 공격해 보고 grader를 수정한 기록을 남겨라. 랩은 이걸 가장 먼저 본다.
4. Contamination 방어: 규칙 파라미터, 필드, 날씨 시나리오를 절차적으로 변형하고, 일부는 비공개 held-out으로 두라. 단, 품질 없는 절차 생성은 약한 신호라는 비판을 받는다. 변형 축과 난이도 보정이 필요하다.
5. 다양성과 공통 기술: 한 규칙 하나가 아니라 여러 label/주(州) 규칙과 replan 유형을 묶어 "공통 기술(정책 준수 + 불확실성 하 계획 갱신)"을 보여라. 이는 τ-bench 계열과 연결되는 포인트다.
6. 현실성의 증거: 실제 label 문서, 실제 forecast API 응답 형식, 도메인 전문가(농학자, 면허 살포 업자)의 검수 기록. Mercor 방식의 "전문가가 만든 과제"가 곧 판매 포인트다.
7. 유통 경로: 리더보드를 직접 운영하거나(Vending-Bench 방식) 제3자 리더보드(Artificial Analysis 유형)와 오픈 프레임워크(Prime Intellect Environments Hub, Harbor 같은 harness 형식 호환)에 올려라. 호환 형식은 이번에 개별 확인하지 못했다 [미검증].
8. 랩 입구: Andon Labs는 Anthropic과 Project Vend 협업으로 신뢰를 얻었다. 벤치마크만으로는 부족하고 "랩 팀과 같이 한 실험" 서사가 필요하다.

### 4.2 정직한 확률 (주관적 추정, 근거 약함)
- 이 해커톤 결과물이 12개월 내 Anthropic/OpenAI/Google의 launch post에 인용될 확률: 1% 미만. 인용된 사례들(SWE-bench, τ-bench, Terminal-Bench, Vending-Bench, GDPval)은 모두 큰 기관·대학·랩 자신이 만들었거나 광범위한 개발자 수요가 있었다. 날씨/농업은 니치다.
- 랩이나 데이터 벤더(Mercor, Surge, Turing 등)와 한 번이라도 평가·샘플 환경 미팅을 잡을 확률: 5~15%. 콜드 접근보다 소개(YC, 연구자 커뮤니티)가 필요하다.
- 소규모 유상 계약(파일럿, 수만 달러 규모)에 이를 확률: 2~5%. 수요가 enterprise workflow, finance, law, healthcare에 쏠려 있고, 랩은 in-house 비중을 늘리고 있기 때문이다.
- 대안 가치: 가장 높은 현실적 가치는 (1) 해커톤 데모의 완성도와 (2) 범용화 서사("규제 하 operations dispatcher" 환경 템플릿, 여러 산업으로 확장)다. 농약 하나로는 시장이 작지만, "규제 규칙 + 갱신되는 불확실한 정보 + 사후 결과 채점"은 물류, 에너지, 항공 운영으로 일반화된다. 이 일반화 주장은 [미검증] 가설이다.

### 4.3 다음에 확인하면 좋은 것
- 최신 frontier 모델 3개 이상으로 pass rate 측정(headroom 증거).
- openai.com 원문(GPT-5 launch, GDPval, BrowseComp)을 브라우저로 열어 인용 확인.
- Preference Model, Bespoke Labs, Idler 같은 신생 벤더에 직접 문의해 도메인 수요 확인.
- Epoch 인터뷰의 "enterprise workflows" 범주에 우리 환경을 어떻게 포지셔닝할지 결정.
