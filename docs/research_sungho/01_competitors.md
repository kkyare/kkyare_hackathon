# 01. 경쟁 환경 조사: Weather data → Agricultural value (US 대규모 농장 중심)

조사일: 2026-10-24. 방법: WebSearch/WebFetch. 표기 규칙: **[확인]** = 출처 URL에서 직접 확인, **[2차]** = aggregator/블로그 등 2차 출처, **[미검증]** = 출처를 찾지 못했거나 일반 지식/추정. 가격은 대부분 비공개라서 "비공개"로 표기했다.

---

## 0. 핵심 요약 (TL;DR)

1. **Forecast 자체는 빠르게 commodity화** 되고 있다. NVIDIA Earth-2 open models (2026-01), Google WeatherNext, OpenAI Foundation의 $60M AI weather 지원 (2026-09)처럼 모델이 무료/오픈으로 풀린다. 차별점은 "더 정확한 grid forecast"가 아니라 **"field-level 관측 + 의사결정 연결"** 이다.
2. **Station/sensor 하드웨어 + 구독** 모델 (Arable, Sencrop, Semios, Pessl/METOS, Davis, Farmers Edge)은 영업이 무겁고, 최근 **인수·합병·구조조정**이 이어졌다 (Sencrop→Isagri, Farmers Edge→Fairfax 비공개화, Semios→Almanac 리브랜드 후 Gro IP 인수).
3. **Gro Intelligence 사망 교훈**: 데이터 breadth는 있었으나 고객의 구체적 문제에 집중하지 못했고, 자금 조달 실패로 종료.
4. **AI weather 스타트업**(WindBorne, Brightband, Silurian, Excarta, Atmo 등)은 대부분 horizontal(에너지, 보험, 금융)이며 **농업 workflow까지 내려오지 않는다.** Atmo는 2026-06 Vaisala에 최대 $130M에 인수 합의 (instrument 회사가 AI team을 흡수하는 패턴).
5. **가장 큰 gap**: "예보 → 이 필드에서 오늘/이번 주에 무엇을 할지 (spray, 관개, 파종, 수확, 서리 방어, 질소 시비)" 를 **대규모 농장 operation 단위로** 근거와 함께 제시하는 layer.

---

## 1. 비교 표

| 회사 | 무엇을 파는가 | 데이터 접근 | 주 buyer | 가격 | 펀딩/단계 | 상태 | 출처 |
|---|---|---|---|---|---|---|---|
| **DTN** | WeatherSentry, DTN Ag Weather Tools(farm-level forecast, 알림, 강수/ET), 시장·곡물 데이터, 2025-07 "Operational Decisioning Platform", Grain Discovery 인수(2025), Ag Hub(2026) | 자체 weather 모델 + 인수한 WDT/MeteoGroup/Weatherzone, sensor 데이터(PraxSoft) | grower, grain 기업, retailer, energy | 비공개 | PE/TBG 소유 (비공개 기업) | alive, 활발한 M&A | [WDT 인수](https://coverager.com/dtn-signs-agreement-to-acquire-weather-decision-technologies/), [2025 플랫폼](https://secure.businesswire.com/news/home/20250722404207/en/DTN-Launches-Industry-First-Operational-Decisioning-Platform-to-Transform-How-Businesses-Compete-in-a-Volatile-World), [Grain Discovery](https://www.fertilizerdaily.com/20250812-dtn-acquires-canadas-grain-discovery-to-expand-agtech-capabilities/md/) |
| **aWhere** | ag weather + agronomic modeling data API (Wilbur-Ellis AgVerdict, SageInsight 등에 공급) | 위성/관측 기반 grid 데이터 | ag-software 제공자, 개발 기관 | 비공개 | - | **DTN 인수 건은 검색으로 확인 못함 [미검증]**. 2015년 파트너십 기사만 확인 | [Wilbur-Ellis](https://www.precisionfarmingdealer.com/articles/1808-awhere-to-provide-ag-intelligence-data-to-wilbur-ellis), [SageInsight](https://www.prnewswire.com/news-releases/awhere-to-provide-agricultural-intelligence-data-to-sageinsights-myagcentral-300164197.html) |
| **Bayer Climate FieldView** | 팜 데이터 플랫폼(Basic/Plus/Premium 구독) + FieldView Drive 하드웨어. weather는 기본 기능(현재 날씨 모니터링은 Basic) | 기계 데이터 + 위성 + 외부 weather | grower (US/Brazil 대규모 row crop) | 2018년 문서 기준 $3-4/acre, 최근 "Plus $649/yr" 헤드라인은 2차 출처 [2차/미검증] | Bayer 소유 | alive | [tier 블로그](https://climate.com/blog/a-fresh-look-at-the-fieldview--subscription-tiers), [Plus 가격 2차](https://yespress.io/climate) |
| **The Weather Company (IBM→Francisco Partners)** | 소비자·미디어·enterprise weather data. IBM은 sustainability/Environmental Intelligence Suite 유지 | NWP + 관측 통합 | 미디어, 항공, adtech, enterprise | 비공개 | 2023-08 Francisco Partners 매각 합의 (금액 비공개) | alive(소유 변경). **ag 전용 제품 현황은 검증 못함 [미검증]** | [Verdict](https://www.verdict.co.uk/ibm-sell-weather-company-francisco/), [Paul Weiss](https://www.paulweiss.com/insights/client-news/ibm-to-sell-the-weather-company-to-francisco-partners) |
| **Tomorrow.io** | Weather intelligence API/플랫폼, 자체 위성(DeepSky), ag용 alert(heat/frost/lightning)와 free API, 농업 개발 이니셔티브 | 자체 radar 위성 + 생성형 AI forecast | enterprise(항공, 에너지, 물류, 정부), 일부 ag | 비공개 (ag용 free API 있음) | Series F $175M(2026 초) + $35M 확장 = $210M (2026-05). Series E $87M(2023) | alive, 자본 풍부 | [Series F 확장](https://pulse2.com/tomorrow-io-210-million-series-f-expanded-with-additional-investment-from-pitango-and-harel-insurance/amp/), [Ag 페이지](https://tomorrow.io/solutions/agriculture/), [Philippines](https://www.satnow.com/news/details/3409-tomorrow-io-to-provide-ai-driven-weather-intelligence-for-farmers-in-philippines) |
| **ClimateAi** | 장기(seasonal) forecast + 공급망/작물 리스크 플랫폼 | AI 기반 climate 모델 | 식품 기업, 곡물 buyer, 공급망 | 비공개 | Series A $12M(2021), Series B $22M(2023). 이후 신규 라운드 **확인 못함** | alive(추정) | [Series B](https://www.gunder.com/en/news-insights/client-news/climateai-announces-22m-series-b-financing), [Series A](https://agfundernews.com/climateai-raises-12m-series-a-with-r-downey-jnrs-fund-others-to-help-supply-chain-adapt-to-weather-risk.html) |
| **Salient Predictions** | S2S(2주~3개월) AI forecast + ag 지표(soil moisture, runoff, frost/drought index) | ML 기반 S2S | 에너지, 상품 trader, ag | 비공개 | Seed ~$5.3-5.4M(2022), Gates $2.9M grant(2023), NOAA SBIR | alive(추정) | [Axios](https://www.axios.com/2022/06/02/salient-predictions-ambitious-weather-firm-new-funding), [Gates grant](https://spaceinafrica.com/2023/10/12/salient-secures-usd-2-9-million-grant-to-improve-weather-forecasts-for-east-african-farmers/) |
| **Arable** | Mark 3 in-field 센서(날씨+식물+토양+관개) + Arable Vision 이미지 + crop 분석 | 현장 센서 + 위성 | 대형 grower, 식품/ag 기업, 연구 | 비공개 | Series B $20M(2020), 누적 $100M+ 주장 [2차]. 2025 Google 협업은 2차 출처 | alive(추정) | [Mark 3](https://www.businesswire.com/news/home/20221206005042/en/The-Future-of-Digital-Agriculture-Has-Arrived-Arable-Unveils-Mark-3-and-Arable-Vision), [$20M](https://venturebeat.com/business/arable-raises-20-million-to-make-connected-devices-for-farmers) |
| **Sencrop** | 연결형 weather station (프랑스/EU 중심) + 알림 | 현장 station 약 35-40k대 | 소규모~중규모 EU 농가 | 비공개 | 누적 약 $30M(출처마다 상이). **2025-01 Isagri 인수** (가격 비공개, 매출 약 €8M) | acquired | [FutureFarming](https://www.futurefarming.com/smart-farming/groupe-isagri-acquires-sencrop/), [Reussir](https://www.reussir.fr/agro-meteo-isagri-rachete-sencrop-et-devient-le-numero-1-en-europe) |
| **Semios → Almanac** | 과수원 IoT(pheromone dispenser, 센서, 카메라 trap), frost/물/pest 관리. 2024-10 Almanac으로 리브랜드, Agworld 포함 | 자체 sensor mesh (50만+ 센서 주장, 수치 상이) | permanent crop(견과/과일) grower | 구독 (비공개) | 2021 $100M, 누적 $225M [2차] | alive. **Gro IP 인수** | [Techcouver](https://techcouver.com/2024/10/22/agtech-unicorn-semios-rebrands-as-almanac/), [AgFunder](https://agfundernews.com/almanac-acquires-gro-intelligence-ip-to-deliver-actionable-insights-across-the-global-agricultural-sector) |
| **Farmers Edge** | 팜 플랫폼 + 자체 weather station + 위성/모델 | station + 위성 | Canada/US grower | 비공개 | **2024-03 Fairfax가 C$0.35/주로 비공개화** | alive(비상장) | [Torys](https://www.torys.com/en/work/2024/01/d1555c11-4a40-4890-94d5-6ba58779681d), [Pulse2](https://pulse2.com/farmers-edge-to-go-private-in-deal-with-fairfax/) |
| **Gro Intelligence** | ag 데이터·AI 모델 플랫폼 (food security 포지셔닝) | 위성+공공+상업 데이터 통합 | 상품 trader, 정부, 식품 기업 | 고가 enterprise | 누적 약 $117M | **dead (2024-06)**. IP는 Almanac이 경매로 인수 | [AgFunder](https://agfundernews.com/almanac-acquires-gro-intelligence-ip-to-deliver-actionable-insights-across-the-global-agricultural-sector), [TechCabal](https://techcabal.com/2024/06/02/kenya-data-analytics-gro-intelligence-shuts-down/) |
| **Agrograph** | AGROS: field-level yield 예측(위성+weather+ML) | 공공 위성(NASA, EU) | 작물보험사, 대출기관, grain 유통 | 비공개 | seed $500k(2018 시점) | **현재 상태 확인 못함 [미검증]** | [Farms.com](https://www.farms.com/news/turning-satellite-data-into-smarter-decisions-for-agriculture-245254.aspx), [Precision Farming Dealer](https://www.precisionfarmingdealer.com/articles/3564-ag-data-start-up-raises-500000-in-seed-funding) |
| **Jupiter Intelligence** | 기후 리스크 분석(홍수, 열, 가뭄, 우박 등), 다산업 | 기후 모델 downscaling | 금융, 보험, 대기업 (농업은 일부) | 연 $1M+ 보도(2022) [2차] | MS&AD Ventures 등 | alive(추정) | [Terra.do](https://terra.do/climate-companies/jupiter-intelligence), [Techleap](https://finder.techleap.nl/companies/jupiter_intelligence) |
| **Pessl / METOS (FieldClimate)** | 무선 solar station + FieldClimate 플랫폼 (병해 모델, 관개) | 현장 station | 대형 specialty/row 농가, 유통사(Lindsay 등) | 비공개(딜러 견적) | 비공개 | alive. Lindsay가 US 유통 | [METOS 카탈로그](https://metos.global/wp-content/uploads/2026/05/Technical-Catalogue-METOS.pdf), [Lindsay](https://lindsay.com/uploads/files/resources/40991-Pessl-Metos%20Fact%20Sheet_2024_WEB%20(24072).pdf) |
| **Davis / WeatherLink** | 저가 weather station + WeatherLink 클라우드 | 현장 station | 소농, 취미, 연구, 학교 | 비공개(조사 안 됨) | - | **조사 못함 [미검증]** | (검색 결과 없음) |
| **Understory** | 지상 weather network(우박, 강수, 풍속), 보험/ag 분석 | 자체 ground sensor 그리드 | 보험사, ag, 에너지 | 비공개 | 누적 약 $22M(2차), 투자자 Monsanto Growth Ventures, True 등 | **2025-26 소식 못 찾음. 상태 불명 [미검증]** | [VentureBeat](https://venturebeat.com/ai/wisconsins-understory-raises-7-5-million-for-on-the-ground-weather-stations), [Wikipedia](https://en.wikipedia.org/wiki/Understory_(company)) |
| **Spire Weather** | 위성 기반(RO, GNSS) 데이터 + AI weather. 농업은 soil moisture 등 | 위성 constellation | 금융, 에너지, 정부, ag | 비공개 | 상장(Spire Global). 2025 maritime 부문을 Kpler에 매각 | alive, weather가 core로 남음 | [10-K FY2025](https://www.sec.gov/Archives/edgar/data/1816017/000119312526116169/spir-20251231.htm) |
| **Brightband** | AI weather 모델(raw 관측 학습), NOAA CRADA | 관측 데이터 + AI | 보험, 금융, ag, 에너지 | 비공개 | Series A $10M(2024-09, Prelude) | alive | [Heatmap](https://heatmap.news/economy/brightband-ai-weather-forecasts), [MTI](https://www.meteorologicaltechnologyinternational.com/news/data/noaa-partners-with-brightband-to-make-observational-data-ai-ready.html) |
| **WindBorne** | 풍선 기반 관측 네트워크 + WeatherMesh AI 모델 | 자체 풍선 600+, AI | 정부, 에너지, 보험 등 (농업은 부수) | 비공개 | **Series B $37M (2026-08)**, 누적 $62M+ | alive, 성장 중 | [Pulse2](https://pulse2.com/windborne-systems-raises-37-million-series-b-to-expand-atmospheric-sensing-network-and-ai-weather-models/) |
| **Atmo** | AI weather forecasting | AI 모델 | 정부, 방위, enterprise | 비공개 | 2025 매출 $2M, 2026 계약 $6M+ | **2026-06 Vaisala 인수 합의 ($70M + earn-out 최대 $60M), 연말 종결 예정** | [Let's Data Science](https://letsdatascience.com/news/vaisala-acquires-ai-weather-company-atmo-34c27035) |
| **Excarta** | 시간 단위 14일 AI forecast + ensemble, ag 활용(살포, 병해) | AI 모델 | ag, 에너지, 보험 | 비공개 | Seed $2.5M | alive(추정) | [iGrow News](https://igrownews.com/excarta-revolutionizing-business-weather-forecasting-with-ai/) |
| **Silurian** | Generative Forecasting Transformer (foundation model) | AI foundation model | 에너지, 보험, 물류 | 비공개 | $6M(2026-04) [2차] | alive | [Techleap](https://finder.techleap.nl/news/feed/silurian-raises-6m-for-ai-driven-weather-forecasting-foundation-models) |
| **Sencrop 외 신규: Rainbow Weather** | nowcasting(위성+radar), ag 포함 | satellite + radar | 다산업 | 비공개 | Seed $5.5M (2026-01) [2차] | alive | [CB Insights](https://www.cbinsights.com/company/rainbow-weather) |
| **Causal Labs** | AI weather prediction | AI | 비공개 | 비공개 | $5.5-6M (2025-03) | alive | [Fortune](https://fortune.com/2025/03/12/exclusive-causal-labs-emerges-from-stealth-raises-5-5-million-for-ai-weather-prediction) |
| **Octopusbot** | 곡물 생산량 예측(공식 통계 7개월 앞) | 비공개 | trader 등 | 비공개 | Seed $1M (2026-07) | alive | [SaaSRise](https://www.saasrise.com/deals/octopusbot-raises-1m-in-first-raise-e43f3232-8580-4942-b05c-be3cde64c137) |
| **Beyond Weather** | 장기 AI forecast (에너지, ag, 인도주의) | AI | 에너지, ag | 비공개 | Seed(2024-04) | alive | [IO+](https://ioplus.nl/archive/en/beyond-weather-secures-investment-for-its-long-range-weather-forecast-ai/) |
| **Arbol** | Parametric 보험(가뭄, 서리, 과습). specialty crop 중심. MPCI와 달리 loss adjustment 없음 | weather/위성/IoT/historical | 농가, 중개사, 식품 기업, 에너지 | 비공개 | **Series B $60M (2024-04)**, GWP $250M(전년) | alive | [Arbol 블로그](https://www.arbol.io/post/how-ai-and-parametric-models-are-revolutionizing-risk-protection-for-crop-insurance), [InsurTech Insights](https://www.insurtechinsights.com/arbol-raises-us60-million-in-series-b-funding-to-expand-climate-based-insurance-coverage/) |
| **Descartes Underwriting** | Parametric drought/yield/frost/hail. 미국 가뭄 상품은 계약당 최대 $80M | 위성 + climate model | 농가, co-op, 공급망 | 비공개 | 2024 GWP $200M+ (자사 발표) | alive | [Descartes drought NA](https://descartesunderwriting.com/solutions/drought-na), [Year in Review](https://descartesunderwriting.com/newsroom/2024-year-review-descartes-underwriting) |
| **OpenAI Foundation 이니셔티브** (경쟁이라기보다 시장 신호) | AI weather + 작물 병해 forecast를 smallholder 1억 명에게. Chicago, Berkeley, Digital Green 등 | 각국 기상청과 AI 모델 | 개발 농가 | 무료/공공 | $60M, 3년 (2026-09-11) | 진행 | [Global Agriculture](https://www.global-agriculture.com/mechanization-technology/openai-foundation-invests-60-million-to-bring-ai-weather-and-crop-disease-forecasts-to-100-million-farmers/) |

---

## 2. 주요 회사별 메모

### Gro Intelligence (실패 사례)
- 2024년 2월 급여/연금 지급 지연 보도, 3월 인력 60% 감축, CEO 교체, 2024-06 폐업. 누적 약 $117M 조달. 이유 요약: **추가 자금 조달 실패** + 제품-시장 적합성 문제 (food security 포지셔닝을 소국/산유국에 팔려다 실패) [2차 해석]. SEC 조사 보도는 미확인 보도로 취급. 출처: [TechCabal](https://techcabal.com/2024/06/02/kenya-data-analytics-gro-intelligence-shuts-down/) (직접 fetch는 403, 검색 요약 기준), [AgFunder](https://agfundernews.com/almanac-acquires-gro-intelligence-ip-to-deliver-actionable-insights-across-the-global-agricultural-sector).
- Almanac CEO 발언: "고객 문제에 집중을 잘 못 했다", 업계 소스: "좋은 제품이었지만 파는 법을 몰랐다". IP(브랜드, 데이터셋, 고객 연락처, AI 모델)는 경매로 Almanac이 인수, 부채는 인수 안 함 [확인: AgFunder].

### DTN
- 확인된 weather 관련 인수: Weather Decision Technologies (2018), PraxSoft/Weatherzone/MeteoGroup (2019 보도), ClearAg (2020 Mergr), Grain Discovery (2025). **aWhere 인수는 이번 검색에서 확인하지 못했다 [미검증]**. 팀에 이 가정이 있다면 사용 전 재확인 필요.
- 위협도 최대: 이미 farm-level forecast, 알림, 곡물 시장, 의사결정 플랫폼 narrative를 가짐. 다만 UX는 legacy, 대규모 농장 workflow 통합이 약하다는 것은 일반 인식일 뿐 이번 조사에서 검증하지 못했다 [미검증].

### 보험/금융
- Arbol과 Descartes는 **지수형(parametric)** 으로 specialty crop, 가뭄, 서리 중심. 미국 commodity row crop은 연방 보조 MPCI가 지배 (Arbol 글: corn/soy/wheat가 1995-2023 $90B+ 지원, specialty crop은 0-20% 수준) [출처: Arbol 블로그, 회사 마케팅이므로 편향 가능].
- 이 영역은 자본과 규제 진입장벽이 높아 해커톤 범위 밖. 대신 "보험 증빙(documentation)"이나 "basis risk 계산기"는 add-on 아이디어가 될 수 있다 [제안].

### 하드웨어 consolidation
- Sencrop → Isagri (2025-01): 창업자들은 "추가 자본이 필요한 시점이었고 투자 환경이 빡빡해서 산업 소유주를 선택". [확인: FutureFarming/Reussir].
- Farmers Edge: 상장 후 C$0.35/주로 비공개화 (Fairfax는 이전에 C$75M 대출) [확인].
- Semios: Almanac 리브랜드 (고객이 여러 인수 브랜드로 혼란), Gro IP 인수로 데이터/AI 확장 [확인].

### 모델 commodity화
- NVIDIA Earth-2 open family (2026-01, 15일 medium range, nowcasting, data assimilation) [확인: HPCwire/Bloomberg 헤드라인; 성능 수치는 NVIDIA 주장]. Google WeatherNext 2는 출처 약함 [2차].
- Vaisala가 Atmo를 인수한 것은 "instrument 회사가 AI forecast 팀을 사는" 패턴이라는 해석은 해당 기사의 editorial framing.

---

## 3. 분석

### (1) 포화된 segment
1. **일반 hyperlocal forecast / API** (Tomorrow.io, DTN, The Weather Company, Spire, 신규 AI 모델 스타트업 다수, 오픈 모델). 이 층에서 "더 정확하다"는 주장은 방어하기 어렵다.
2. **Station/sensor 하드웨어 + 앱** (Arable, Sencrop, METOS, Davis, Farmers Edge, Semios). 하드웨어 영업과 유지가 무겁고 consolidation 중.
3. **Farm management 플랫폼** (FieldView, Farmers Edge, Almanac/Agworld). weather는 부속 기능.
4. **AI foundation weather model** (WindBorne, Brightband, Silurian, Excarta, Atmo, Causal Labs 등). 자본이 이미 몰려 있고 모델 단독 차별화가 어렵다.

### (2) 미충족 gap (특히 forecast → field decision)
아래는 조사에서 직접 확인된 빈틈과 추론을 구분한다.

| gap | 근거 | 구분 |
|---|---|---|
| **Spray window 의사결정**: Delta T, inversion, wind, rain-free time를 결합한 hourly 가이드. 현재 눈에 띄는 것은 WSU AgWeatherNet(WA 한정 무료), Field Insights(NAU), WAND(호주) 같은 공공/지역 도구 | [WSU](https://smallgrains.wsu.edu/spraytool/), [NAU](https://naucountry.com/about-us/news/news-detail/2018/02/23/field-insights-spray-advisor) | 확인 (범용 상용 대규모 농장용 도구 부재는 **추정**) |
| **Operation 단위 스케줄링**: 수천 에이커·다수 필드·장비·인력 제약 하에서 "이번 주 어느 필드를 어떤 순서로 spray/수확/파종" | 확인된 상용 제품 없음 | **추정/미검증** (DTN, FieldView 기능 전수 확인 못함) |
| **Forecast 신뢰도와 불확실성의 의사결정화**: ensemble 확률을 "행동 임계값(예: 비 올 확률 30% 이상이면 연기)"과 비용(손실 vs 지연)으로 번역 | Excarta 등이 ensemble 제공, 의사결정 번역은 미확인 | 추정 |
| **Specialty가 아닌 row crop(corn/soy/wheat) 대규모 농장용 parametric/risk 도구** | 보험 중 지수형은 specialty 중심, row crop은 MPCI 지배 | Arbol 글 기반 확인 + 해석 |
| **관측 + 모델 보정(bias correction)**: 농장 자체 station/기계 센서 데이터로 forecast를 localize | Arable, METOS, Farmers Edge가 센서는 공급하지만 forecast 보정은 제각각 | 추정 |
| **자연어/에이전트 인터페이스**: 농장주가 "내일 질소 살포해도 돼?" 라고 물으면 근거 있는 답 | 조사에서 해당 제품 못 찾음 | 추정 (WayBeyond GrowPilot 등 일부 앱 존재 가능) |

### (3) 실패/교훈에서 얻는 시사점
1. **Gro**: breadth(모든 데이터)보다 **한 customer job**에 집중하라. 판매 모델(누구에게, 얼마에)을 명확히. 펀딩 환경이 나빠지면 narrative만으로 생존 불가.
2. **Sencrop / Farmers Edge / Semios**: 하드웨어 중심 모델은 자본 집약적이고 결국 대형 소유주에게 흡수된다. 해커톤 MVP는 **hardware 없이** 기존 데이터(공공 API, 오픈 AI 모델, 농장 기존 센서)로 시작하는 편이 합리적.
3. **Semios 리브랜드**: 인수 브랜드가 많아 고객이 혼란스러워했다. 메시지는 하나의 문장으로.
4. **Atmo (2025 매출 $2M, $70M+ 인수)**: 모델 기술은 인수 대상이 되지만 독립 성장 모델은 약하다. 모델 정확도만으로 pitch하면 약하다.
5. **OpenAI Foundation, NVIDIA 등**: 기초 forecast는 무료/공공으로 수렴 중이므로, 우리는 **그 위의 decision layer**에서 경쟁해야 한다.

---

## 4. 해커톤에 대한 시사점 (제안, 구현은 승인 후)

- 포지셔닝 후보: "예보를 필드별 오늘의 작업 결정(spray / irrigate / harvest)으로 번역하는 decision layer for large US farms".
- 차별화: 오픈 AI 모델 + 공공 데이터(NOAA, 기상청 API 등)를 입력으로 쓰고, **필드 단위 + operational constraint + 불확실성**을 출력으로 만든다.
- 데모에서 보여줄 것: 한 농장(예: 5,000 acre, 20개 필드)의 주간 spray window 캘린더와 "왜 이 필드가 먼저인가" 설명.
- 슬라이드 1장용 경쟁 맵 축 후보: X = 데이터 층(모델 ↔ 현장), Y = 의사결정 깊이(forecast ↔ action). 대부분 경쟁자는 좌하단(forecast)이나 하드웨어, DTN만 중앙으로 이동 중.

---

## 5. 조사 한계 (정직한 공개)

- WebSearch 요약에 의존한 항목이 많고, 가격은 거의 확인 못 했다.
- 미확인: aWhere↔DTN 인수, The Weather Company의 현재 ag 제품, Davis/WeatherLink 전반, Understory 현재 상태, Agrograph 현재 상태, Spire의 ag 제품 구체, ClimateAi/Salient/Arable/Semios의 2025-26 최신 소식, FieldView 현재 가격표.
- 펀딩 수치는 출처 간 불일치가 있다 (예: ClimateAi 누적 $22M vs $34M vs $38.2M, Sencrop $29-38M, Semios $115M vs $225M).
- Tomorrow.io의 초기 $175M Series F는 확장 라운드 기사의 서술에 근거하며 원 발표는 직접 확인하지 못했다.
- 2차 출처(yespress.io, CB Insights, Dealroom, terra.do 등)는 [2차]로 표기했다.
