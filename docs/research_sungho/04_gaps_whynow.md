# 04. Gaps / Failures / Why Now (대형 US 농장 x 정밀 날씨 서비스)

작성일: 2026-10-24
표기: [확인] = 출처 본문/검색 결과에서 직접 확인, [2차] = 2차 매체·벤더 자료, [미확인] = 검증 못함. 링크 없는 주장은 없음.

---

## 1. 선행 스타트업이 실패/고전한 이유와 교훈

### 1.1 Gro Intelligence (2024 폐업)
- 2024년 중반 폐업. 2021년 1월 Series B $85M, 2024년 2월 payroll 지급 불능, 3월 직원 60% 해고. [확인] https://agfundernews.com/breaking-ag-insights-platform-gro-intelligence-is-closing-down
- 전 직원 발언: "fundamental mismatch between the product and the market", "chasing deals for projects that resembled bespoke consultancy work". 매출 대부분이 Unilever 한 곳. [확인] 같은 링크
- CFO 부재, 잘못된 채용 등 경영 이슈. SEC 조사설은 익명 출처 기반이라 [미확인]. https://launchbaseafrica.com/2024/06/02/african-agtech-startup-gro-intelligence-funded-by-echovc-crashes-despite-100m-investment/
- 교훈: (a) 데이터/인사이트 플랫폼은 맞춤 컨설팅으로 변질되기 쉽다. (b) 단일 대형 고객 의존. (c) 반복 가능한 단일 결정(decision) 상품이 없었다.

### 1.2 Farmers Edge (상장 후 몰락)
- IPO 후 주가가 $19 이상에서 약 $0.20대로 하락. 무료 사용자를 유료로 전환하지 못했다는 보도. 2023년 인력 20% 감축, 호주 사무소 폐쇄, 가상 서비스 모델로 전환. [2차] https://thelogic.co/news/why-axis/farmers-edge-announces-20-per-cent-workforce-cut-new-virtual-model-in-effort-to-slash-costs/
- 최대 주주 Fairfax가 주당 $0.35에 잔여 지분 인수, TSX 상장폐지. [2차] https://www.tipranks.com/news/company-announcements/farmers-edge-completes-share-acquisition-plan
- 교훈: 날씨 스테이션 + 위성 + 플랫폼 번들은 하드웨어/현장 서비스 비용이 크고, 구독 전환이 안 되면 무너진다.

### 1.3 Climate Corp (Monsanto, 2013)
- Monsanto가 약 $930M에 인수(2013-10-02 발표). 하이퍼로컬 날씨 모니터링 + 농학 모델링 + 고해상도 날씨 시뮬레이션이 핵심이었다. [확인] https://www.agri-pulse.com/articles/3287-monsanto-acquires-weather-data-company-climate-corporation
- 현재 FieldView 유료 티어는 연 $499부터, 무료 체험 있음. [확인] https://climate.com/en-ca/pricing
- 교훈: 날씨 단독 상품이 아니라 필드 데이터 플랫폼의 한 기능으로 흡수됐다. 날씨는 번들 속에 있다 (단독 가격 근거는 못 찾음).

### 1.4 Indigo Ag
- 직원 80명 감축(약 1,000명 수준), 제품군을 grain marketing/운송/탄소/바이오 4개로 축소. 한때 곡물 판매 대행에서 고전. [2차] https://agfundernews.com/indigo-ag-cuts-80-jobs-across-us-signs-new-carbon-credits-buyers
- 2023년 평가가치 하락 보도와 $250M 추가 조달. https://www.bostonglobe.com/2023/09/15/business/boston-agtech-firm-indigo-ag-raises-big-round-sees-drop-value/
- 2025-2026 현황은 [미확인].
- 교훈: 농민 보상 구조가 불확실한 상품(탄소)은 확장 속도에 비해 수익 전환이 느리다.

### 1.5 투자 동향 (AgFunder)
- 2025년 글로벌 agrifoodtech 투자 $16.2B, 전년 대비 -3%. upstream(농장/바이오) $9B, +7%지만 딜 수는 -12%. 투자자는 unit economics와 명확한 매출 경로를 선호. [2차 요약] https://agfunder.com/research/agfunder-global-agrifoodtech-investment-report-2026/ , https://globalaginvesting.com/lessons-from-the-2026-global-agrifoodtech-report/
- 2022년 -39%, 2023년 -51% 하락(Green Queen의 AgFunder 요약). https://www.greenqueen.com.hk/agfunder-agrifoodtech-investment-report-2025-funding-trump/
- 교훈: "그냥 데이터/AI"로는 펀딩이 안 된다. 입증된 ROI가 필요.

### 1.6 McKinsey Global Farmer Insights 2026 (5,500명, 10개국, 2026-04~07)
- 17%가 generative AI 사용, 4%만 유료(미국은 11%가 유료라는 보도). [2차] https://letsdatascience.com/news/mckinsey-finds-17-of-surveyed-farmers-use-generative-ai-a97bb062 , 원문 PDF: https://www.mckinsey.com/~/media/mckinsey/industries/agriculture/our%20insights/global%20farmer%20insights/global-farmer-insights-2026_vf.pdf
- 의사결정 신뢰 출처: agronomist 56% vs AI 6%. 농민은 구체적 farm-level 문제를 풀고 기존 워크플로에 맞고 로컬 조건에서 가치가 입증되는 기술을 선호. https://www.rfdtv.com/farmers-adopt-ai-while-still-trusting-agronomists-most
- 2024판: 신중한 농민일수록 ROI 민감, 새 기술 실험에 소극적. https://agtechnavigator.com/Article/2024/10/17/What-does-McKinsey-s-new-global-report-tell-us-about-how-agtech-can-best-serve-farmers
- Purdue 2019: farm data platform 사용자의 1/3이 무료, 유료자 51%가 에이커당 $5 미만. [확인] https://ag.purdue.edu/commercialag/home/resource/2019/05/farmer-use-of-ag-data-software

### 1.7 Integration fatigue
- 호주 사례 추정치: 농가 80%가 상호운용 안 되는 앱 5~10개 사용 (창업자 추정, [미확인] 설문). 농민 코멘트: "already using 6 different apps ... weary to add another". https://primefuture.substack.com/p/what-if-it-doesnt-work/comments , https://californiaagtoday.com/ag-tech-needs-to-collaborate/
- Trimble: 여러 벤더 통합은 "high effort and low return". https://globalaginvesting.com/trimble-streamlines/

### 추출 교훈 (설계 원칙)
1. 데이터가 아니라 결정(decision)과 $ 절감/보호를 판다. 한 번에 하나의 결정(예: 오늘 이 필드에 살포 가능한가).
2. 새 대시보드/앱을 만들지 말고 기존 흐름(SMS/이메일/John Deere Ops Center 등)에 얹는다. (통합 방식은 데모에서 "출력 형태"로만 시사)
3. 신뢰: AI가 단독 판단하지 않고, 근거(모델 간 합의, 불확실성, 출처)를 보여 주고 agronomist 검토 경로를 둔다.
4. 하드웨어/온사이트 서비스 없이 공개 데이터 기반으로 낮은 한계비용을 유지.

---

## 2. 농민의 실제 불만 (인용)

주의: 미국 Reddit은 도구 접근 차단, NewAgTalk는 검색 결과 0건. 미국 포럼 직접 인용은 확보 못함 ([미확인], 팀이 직접 수집 권장). 아래는 확인된 인용.

- 호주 농민 (SBS, 연도 미확인): "It just gets people down something terrible especially when 50 to 60 millimetres is forecast and you get 5mm." - Wayne Dunford; "I'm almost getting to the point now where whatever the bureau says you think it's going to be the opposite." - Chris Blunt. https://www.sbs.com.au/news/frustrated-farmers-turn-on-bom-forecasting/6592cb4a-cb8d-41fe-81f4-1a655fa03765
- Iowa 2020 derecho: 농민 Ted Hamer는 아침에 기상학자 전화를 받았지만 바람이 미숙한 옥수수를 쓰러뜨림. https://gizmodo.com/this-week-s-derecho-screwed-iowa-s-farmers-1844715101 ; 농민 Dave Struthers는 폭풍 전 아무 경고도 못 들음. https://kstp.com/?p=73274
- Nutrien 기상학자: 폰 앱 예보는 대개 기상학자 검수 없는 raw model output. [2차] https://goconow.com/mobile-weather-app-forecast-accuracy-discussed-on-daybreak-ag-report/
- Probcast 개발자: 모델 자체는 좋지만 문제는 단일 평균값 표시 방식, 확률/범위를 보여 줘야. [2차] https://www.fwi.co.uk/machinery/technology/probcast-weather-app-gives-growers-insights-into-rain-risk
- 현장 격차: 농장 하나 위치와 기상 관측소 거리 차이로 오해 소지. 학생팀 문서(농민 인터뷰 기반 주장, [2차]) https://abhayratti.notion.site/Cultura-Your-Farm-s-Digital-Consultant-95d681708d4a4cfda9f122eaa0bf458a ; 4km 격자도 국지 강수에는 부정확하다는 Precip 창업자 설명 https://precip.ai/blog/founders-story
- 연구: 오보 후 농민 신뢰가 떨어지고 사용 빈도가 줄어듦(India 2025 working paper, 상세 [미확인]). https://precisiondev.org/wp-content/uploads/2025/03/Weather_CHS.pdf
- 케냐/나이지리아 사례도 있으나 미국 대상 아님: https://blueprint.ng/failed-nimet-forecast-and-looming-food-crisis-in-kwara-state/

핵심 통찰: 불만은 "정확도"뿐 아니라 (1) 단일 값 표시, 불확실성 숨김 (2) 필드 단위 해상도 부재 (3) 예보 -> 행동 변환 부재.

---

## 3. Why Now (2025-2026)

### 3.1 AI 기상 모델이 운영 단계로
- NOAA가 2025-12 AIGFS / AIGEFS / HGEFS 3종 운영 배포. AIGFS는 16일 예보에 GFS 컴퓨팅의 약 0.3%, AIGEFS는 skill 18~24시간 연장, HGEFS는 31 physics + 31 AI 멤버. 원 보도자료는 못 읽고 2차 보도. https://epic.noaa.gov/noaa-deploys-new-ai-driven-global-weather-models/ , https://www.hpcwire.com/aiwire/2025/12/17/noaa-deploys-new-generation-of-ai-driven-global-weather-models/
- Google WeatherNext 2 (2025-06, 64-member ensemble), WeatherNext 3 (2026-08-31, 5km, hourly, 15일). GenCast는 2026-07-29 deprecated. 출처는 Google 공식 release notes, 성능 주장은 개발사 자체. https://developers.google.com/weathernext/release-notes
- ECMWF AIFS가 2025-02 운영 시작이라는 블로그 주장은 낮은 신뢰도 [미확인]. 단, Open-Meteo에서 "ECMWF AIFS 0.25° Single" 모델 선택 가능은 확인. https://open-meteo.com/en/docs
- 의미: 여러 모델(AIFS/GFS/HRRR/ICON)을 공개 API로 받을 수 있어, 3시간 안에 multi-model 합의/불확실성 계산이 가능.

### 3.2 NOAA/NWS 인력·예산 압박
- 2025-03: Omaha, Rapid City 풍선 관측 중단, North Platte/Aberdeen 등 1일 1회로 축소. UNL 기상학자 Eric Hunt: 최악엔 정확도가 2000s~2010년대 초 수준으로 후퇴 가능, "We don't know the degree of forecast skill that will be lost". State Climatologist Deborah Bathke: "It's data that we can't get any other way." [확인] https://nebraskapublicmedia.org/en/news/news-articles/nebraska-south-dakota-hit-with-unprecedented-cuts-to-weather-balloon-launches-across-the-midwest/
- 일부는 이후 복원(Omaha 인력 2명 승인 보도). 현재 상태 [미확인]. https://www.kcur.org/news/2025-04-02/national-weather-service-cuts-forecast-midwest-storms
- FY2027 예산안: NOAA 26% 삭감, 35개 프로그램 폐지, OAR 폐지 제안. 의회는 NWS 인력 우려 표명, 실제 확정 예산은 [미확인]. https://blogs.edf.org/edfish/2026/07/21/noaa-faces-significant-budget-cuts-whats-at-stake.md , https://www.everycrsreport.com/files/2026-03-12_IF13024_eb7ce330a93e719e4ae88b7880d3a76d47b0721b.html
- 의미: "공공 예보 품질 불확실성 + AI 모델 저비용화" = 민간이 보완할 수 있는 윈도우.

### 3.3 EPA dicamba 규정 (살포 판단이 날씨 의존)
- 2026-02-06 OTT dicamba 3개 제품 재등록, 2026-27 시즌용, 2028-02-06 만료. 예보 기온 95F 이상(당일/다음날)이면 살포 금지, 최대 0.5 lb/acre x 2회, VRA 40 oz/acre, RUP 및 연간 교육 유지. 이미 소송 제기. [확인, EPA 요약 기반] https://uaex.uada.edu/media-resources/news/2026/february/02-23-2026-ark-epa-dicamba.aspx , https://www.mda.state.mn.us/pesticide-fertilizer/over-top-dicamba
- Minnesota는 추가로 85F 초과(현장기온 또는 NWS 예보 최고기온) 금지. https://www.mda.state.mn.us/dicamba
- 의미: "예보 기온 기반 법적 금지 조건"이 라벨에 박혀 있어, 날씨 -> 컴플라이언스 -> 기록이 직접 연결. 과거(2017) drift로 2.5~3.6M acre 피해 추정. https://geneticliteracyproject.org/?p=1228944

### 3.4 2026 극단 기상 (대부분 2차 출처)
- 2026-04 중순 freeze: 중부 High Plains(4/18-19), 중부 대서양(4/20-21). 겨울밀 생산 1.05B bu, 전년 1.40B 대비 -25% 전망(cropgpt.ai, 검증 필요). https://cropgpt.ai/us-winter-wheat-production-forecast-down-25-percent-as-drought-and-freeze-damage-compress-2026-output-to-1-05-billion-bushels
- RMA가 2026-04 freeze 긴급 절차(MGR-26-006)를 발표한 것은 공식 확인. https://www.rma.usda.gov/print/pdf/node/7895 ; Pennsylvania 과수 손실 최대 $200M 주장 [2차] https://www.agrolatam.com/news/pennsylvania-freeze-crop-losses-federal-aid/
- 2026-05-02/03 Midwest frost (조기 파종 작물 피해) [2차, 검증 필요]. https://www.agrolatam.com/crops/frost-damage-midwest-corn-soybeans-wheat-2026/
- 2026-07 flash drought 경고(Nutrien 기상학자 Eric Snodgrass, 서부 Corn Belt), 경고 기반이며 피해 수치는 [미확인]. https://www.farms.com/news/weather-outlook-raises-flash-drought-concerns-for-u-s-corn-belt-as-heat-dome-intensifies-244411.aspx
- 2020 derecho: Iowa 최대 1,000만 acre 피해 (과거 사례, 기상 이벤트 서사용). https://www.fox6now.com/news/derecho-damaged-up-to-10-million-acres-of-iowa-farmland-corn-and-soybean-crop-most-impacted
- 참고: 2024/2025 이벤트는 이번 조사에서 확인 못함.

### 3.5 보험 변화
- OBBBA: SCO 보장 86% -> 90%, 보조 65% -> 80%, ARC와 무관하게 구매 가능. 2026은 ECO로 도달, 2027 SCO 변경. 2025-07-01 이후 sales closing date 정책부터 적용. 개별 보험 보조 +3~5%p. [확인] https://www.hoeven.senate.gov/news/news-releases/hoeven-rma-follows-through-on-one-big-beautiful-bill-implements-enhanced-crop-insurance , https://www.rma.usda.gov/policy-procedure/bulletins-memos/managers-bulletin/mgr-25-006-one-big-beautiful-bill-act-amendment
- Prevented planting buy-up 제거 주장은 단일 출처 [미확인]. https://www.farmprogress.com/farm-business/farm-progress-america-jan-2-2026
- 의미: 보험이 넓어질수록 "손실 증빙(날씨 기록, 이벤트 타임스탬프)" 가치가 커진다.

### 3.6 농가 경제 압박
- USDA 2026 순농가소득 $153.4B(2월 예측), 명목 -0.7%. 비용 높음, 정부 지급이 소득 방어. 2025 Chapter 12 파산 +45~46%, 2026 1~6월 208건(National Ag Law Center). 총 농가 부채 $624.7B(2026 전망). [2차, 법무법인/ERS 인용] https://www.adamsandreese.com/the-ledger/rising-farm-distress-preparing-for-increased-agriculture-bankruptcies-in-2026-2027 , https://farmpolicynews.illinois.edu/?p=33967
- Farm Bureau: 1980년대 위기 이후 최대 "generational downturn" 경고(2차 인용). 
- 의미: 마진이 얇아 "투입비 낭비 방지(살포/비료 재작업, 관개 에너지)" 메시지가 먹힘. 단 McKinsey는 이 시기에 farm-specific, 입증 가능한 ROI 도구만 지출 대상이 된다고 시사.

### 3.7 노동
- DOL 2025-10-02 H-2A AEWR 산정 개편 IFR, 2026-01-01 확대 관련 긴급 규칙, FY2026 상반기 25만+ 포지션 인증(Farm Bureau). 2026-08 임금 하한 재작성/법원 판단 팟캐스트 요약은 [미확인]. https://www.fb.org/intel/markets/h-2a-program-usage-continues-to-accelerate , https://www.freshplaza.com/europe/article/9787663/u-s-wage-rule-change-reshapes-farm-labor-and-h-2a-hiring/
- UC Davis Philip Martin은 "대규모 부족" 주장에 회의적. https://www.bostonglobe.com/2026/03/15/nation/address-farm-labor-shortage-trump-administration-turns-migrant-workers
- 의미: 작업 일정(crew/sprayer/harvest) 조율이 날씨 창(window)에 더 민감. 직접 날씨 연결 증거는 못 찾음 (추론).

---

## 4. 좁은 문제 정의 후보 (5-8개, 3시간 데모 가능성 포함)

공통 데이터 소스(무료): Open-Meteo (HRRR/GFS/ICON/ECMWF IFS+AIFS, soil moisture, soil temp, ET0, VPD 제공 확인, 상업 사용은 API key 필요) https://open-meteo.com/en/docs ; NWS API(api.weather.gov, 미조사: 데모 시 확인).

| # | 문제 | 한 줄 근거 | 데모 난이도 |
|---|---|---|---|
| A | 필드별 "오늘 살포해도 되는가" 판정 + 라벨 컴플라이언스 증빙 로그 (dicamba 95F/85F 규칙, wind, Delta T, 강우 임박) | dicamba 2026 라벨이 예보 기온 조건 명시, 재소송 중 [확인] uaex/MDA 링크 | 낮음 (규칙 + API + Claude 설명/로그 생성) |
| B | 모델 불일치 -> 불확실성 + 근거 설명 브리핑 ("5개 모델 중 3개가 내일 비 > 10mm") | 단일 값 표시 문제, 호주 농민 "50~60mm 예보에 5mm" 인용, Probcast 주장 | 낮음~중간 (multi-model fetch + 합의 계산) |
| C | Freeze/frost 알림 + 보험 클레임용 이벤트 증빙 패키지 (필드 좌표별 최저기온, 타임스탬프, RMA 절차 연결) | 2026-04 freeze, RMA MGR-26-006 [확인] | 중간 |
| D | Flash drought 조기 경보 (soil moisture + ET0 + VPD + 예보 -> 관개/마케팅/보험 결정) | 2026-07 flash drought 경고, 서부 Corn Belt 전망 [2차] | 중간 |
| E | NWS 관측 공백 지역(풍선/인력 축소) 필드를 위한 "공공 예보 신뢰 보정" 레이어: 모델 간 편차/지역 관측 격차 표시 | 2025-03 Omaha/Rapid City 중단, Hunt/Bathke 인용 [확인] | 중간~높음 (보정 증명 어려움, 서사는 강함) |
| F | 노동/장비 스케줄링 에이전트: 7일 날씨 윈도우 + crew 제약 -> 작업 계획 자동 재조정 | H-2A 개편으로 노동 변동성, 얇은 마진 [2차] | 중간 (가짜 크루 데이터 필요) |
| G | 농민 자연어 질의 에이전트("내 North 80은 이번 주 언제 들어갈 수 있나?") + 도구 호출로 근거 제시, 신뢰 확보 위해 출처/불확실성 노출 | McKinsey: AI 신뢰 6% vs agronomist 56%, 근거 제시/로컬화 필요 [2차] | 낮음 (A/B와 결합) |
| H | 생산 전 파종/출아 위험: 조기 파종 후 frost 위험 (soil temp, 10일 최저기온) | 2026-05-02/03 Midwest frost [2차 검증 필요] | 낮음~중간 |

---

## 5. 추천 우선순위 (데모 가능성 x 고통 x 근거 신뢰도 x 심사 적합도)

1. A + G 결합: "Spray Window & Compliance Agent". 공식 라벨 규칙이 근거라 신뢰도 높음, 데모 시각화 쉬움, 에이전트가 규칙 해석/설명/기록 작성.
2. B: Multi-model 불확실성 브리핑. 농민 불만의 핵심(단일 값/오보)과 AI 모델 운영화 서사를 한 번에 사용.
3. C: Freeze 이벤트 증빙(보험). "ROI = 클레임 시간 단축" 서사.
4. D: Flash drought 경보.
5. H, F, E 순.

팀 제안: 1+2를 한 제품으로 (필드 입력 -> 멀티모델 -> 규칙 판정 -> Claude 설명 + 로그), 슬라이드엔 3.2(NWS 약화), 3.3(dicamba), 1(실패 교훈: 결정을 판다) 사용.

---

## 6. 앤트로픽 해커톤 심사 관점

- 공식 루브릭은 확인 못함. 다른 Claude 해커톤(Opus 4.6)의 규칙 문서 기준(비공식, 해당 행사 미확인): Demo 30%, Impact 25%, Model 활용 창의성 25%, Depth & Execution 20%. https://huggingface.co/datasets/introvoyz041/postvisit/blob/main/data/docs/hackathon-rules.md [미확인: 우리 행사와 동일 여부]
- 시사점: (1) 라이브 동작하는 데모 최우선, (2) Claude를 단순 요약이 아니라 tool use 에이전트(API 호출, 규칙 검증, 근거 인용, 로그 생성)로, (3) 실제 임팩트: 숫자 하나(예: 오살포 1회 방지 비용, 클레임 소요시간) 제시, (4) 첫 아이디어 너머 깊이: 불확실성 처리, 실패 시 "모르겠다" 말하기, 규칙 버전/출처 표기.
- 신뢰 이슈를 설계에 반영(McKinsey 인용): AI 단독 결정 대신 근거와 "agronomist에게 확인" 경로.

## 7. 한계
- 미국 포럼(NewAgTalk/Reddit) 직접 인용 확보 실패. 2024-2025 극단 기상 이벤트 및 NWS 현재 인력 상태 미확인. 2026 극단 기상 다수 출처가 agrolatam/cropgpt 같은 2차 집계라 사용 전 USDA NASS/RMA로 교차검증 필요. NOAA AIGFS 원 보도자료 미열람.
