# 02. 고객 및 지불 주체 분석 (대규모 US 농장 x 날씨 데이터)

작성일: 2026-10-24 / 방법: WebSearch 요약 기반(원문 전체 fetch는 하지 않음). 표기: **[검증됨]** = 검색 결과가 1차/신뢰 출처를 직접 인용, **[미검증]** = 2차 출처, 마케팅 자료, 추정, 또는 출처 연도 불명.

## 1. 대규모 US 농장 현황

| 항목 | 수치 | 출처 |
|---|---|---|
| 전체 농장 수 (2022 Census) | 190만 (2017년 204만) | https://data-origin.nass.usda.gov/Publications/Highlights/2024/Census22_HL_FarmEconomics_FINAL.pdf [검증됨] |
| 판매액 $1M 이상 농장 | 105,384개, 전체 농장의 6% 미만, 전체 농산물 판매의 3/4 이상 (NASS 표상 $5M+ 1%/42%, $1-4.99M 5%/36%) | 위와 동일 [검증됨] |
| 총 생산액 2022 | $543.1B | 위와 동일 [검증됨] |
| ERS 유형 (GCFI $1M+ "large-scale family farm", 2024 기준) | 농장의 약 5%, 생산액의 50%, 농지의 33% | https://www.ers.usda.gov/data-products/charts-of-note/114161 및 https://extension.illinois.edu/blogs/farm-focus/2026-03-04-insights-2025-farms-and-ranches-glance-report [검증됨, 검색요약 경유] |
| Midsize family farm (GCFI $350K-$999K) | 6%, 농지 18%, 생산액 18%; cash grains/soybeans에서 존재감 25% | 위와 동일 |
| 곡물/유지작물 특화 농장 | 전체 농장 17%, 농지 32%, 수확 농지의 69%. 1,000에이커 이상 수확 농장의 76%가 곡물/유지작물. 판매 비중 Iowa 14%, Illinois 13%, Minnesota 9% | https://data-origin.nass.usda.gov/Publications/Highlights/2024/census22-grain-oilseed.pdf [검증됨] |
| 옥수수/콩 특화 | 330,930개 곡물 농장 중 253,599개 | 위와 동일 |

해석: 타깃 고객 풀은 약 8.5만~10.5만 개 농장(대형 가족농장 + $1M+ 판매). 주력 작물은 corn/soy(Corn Belt: IA, IL, MN, IN, NE), wheat/cotton(Plains, Delta, Texas), 특수작물(CA almond/produce, 관개 중심). 작물별 대형농장 면적 비중과 지역별 평균 농장 규모는 이번 조사에서 확보하지 못함 **[미확인]**.

## 2. 날씨 민감 의사결정과 금액

| 결정 | 정량 근거 | 출처 / 상태 |
|---|---|---|
| 파종 시기 | 옥수수(Illinois, Nafziger): 4/30 -1%(2bu), 5/10 -4%(8bu), 5/20 -8%(17bu), 5/30 -14%(29bu), 6월은 일 2bu 이상. 콩: 5/10 -7%(4bu), 5/30 -16%(11bu), 6/10 -21%. 옥수수 $4/bu 가정 시 5/20 지연 시 약 $68/acre, 콩 $10/bu 가정 시 5/30 약 $110/acre (직접 계산) | https://farmdoc.illinois.edu/?p=3564 , https://farmdoc.illinois.edu/?p=2166 [검증됨, 가격은 가정] |
| Prevented planting | 2019년 PP 1,960만 acre(옥수수 1,140만), 보험금 $4.2B+ (최종 $4.264B), 평균 $224/acre, South Dakota만 $925M. 2000-2018 연평균 410만 acre, $680M | https://www.everycrsreport.com/reports/R46180.html , https://www.nxtbook.com/allen/cint/53-02/index.php?startid=25 [검증됨] |
| 질소(N) 손실 | 습한 봄 N 손실 시 옥수수 25% N 손실 미보충 -11bu, 약 $66/acre; 75% 손실 시 약 $462/acre(출처 지역 불명). Missouri 한 필지: 45bu 손실, 약 $169/acre(검색 요약자의 계산). Iowa tile: 평년 15-25 lb N/acre -> 습한 봄 40-50 lb. Illinois: 과습 시 60-70 lb N/acre 탈질. 반론: Illinois 전문가는 2017년 "10 lb 미만" 추정 -> 편차 큼 | https://extension.missouri.edu/media/wysiwyg/Extensiondata/Pro/NutrientManagement/Docs/NitrogenLossAndLateSeasonNAppForCorn.pdf , https://crops.extension.iastate.edu/cropnews/2011/06/estimating-nitrogen-losses , https://www.farmprogress.com/management/how-to-estimate-nitrogen-losses [검증됨(단일 사례, 범위 넓음)] |
| 살포 윈도우(바람/역전층/drift) | 라벨은 대체로 풍속 3-10 mph(일부 15 mph 상한), 3 mph 미만 시 inversion 확인 의무, 책임은 applicator. 2026-02 EPA가 OTT dicamba 재등록(2026, 2027 시즌): 연 2회 0.5 lb 상한, 기온 기반 제한, 일부 주는 더 엄격한 날짜/기온 컷오프. 2026-02-20 Ninth Circuit에 취소 소송 제기(2020, 2024에도 등록 취소 전례) | https://www.mda.state.mn.us/sites/default/files/docs/2026-04/herbdriftmgmt_0.pdf , https://www.dtnpf.com/agriculture/web/ag/crops/article/2026/02/20/groups-petition-federal-court-vacate [검증됨] |
| Drift 소송 | Bader Farms(Missouri 복숭아): 2020 배심 $265M(=$15M 손해 + $250M 징벌) -> 이후 징벌 $60M로 감액, 총 $75M. Bayer/BASF 항소 의사. 2016 EPA: Missouri 4.2만 acre 피해 | https://www.feedstuffs.com/agribusiness-news/court-sides-with-peach-farmer-in-dicamba-drift-case , https://www.stlpr.org/post/jury-awards-missouri-peach-farmer-15-million-damages-dicamba-suit [검증됨, 감액 시점 불명확] |
| 관개 스케줄링 | Nebraska 시범: 토양수분 모니터링으로 1.5-2.0 inch 절감. $/acre-inch 양수비용은 검색 결과에 없음 **[미확인]**. Pivot 설치비 $650-750/acre(Texas A&M) | https://www.k-state.edu/irrigate/oow/p11/Kranz11a.pdf [검증됨(물 절감량만)] |
| 서리 방어(almond 등) | 26 F 미만에서 개화~착과 초기 심각한 손실, 2도 상승만으로 상당 부분 방어 가능. 2024 UC Davis almond 운영비 $3,807/acre(SJV North). 서리 손실 $ 및 wind machine 현재 비용은 미확인 **[미확인]**. 1948 자료의 $350/acre는 무의미 | https://www.growingproduce.com/?p=179452 (운영비), West Coast Nut 2018 (임계온도) |
| 수확/건조 | 프로판 0.02 gal/bu/수분 1pt. 20% -> 15%: 약 17.5c/bu(프로판 $1.75). 26% -> 16%: 30-40c/bu (2017-19 가격). 10월 중순까지는 field drydown이 경제적 | https://www.farmprogress.com/planting/cut-your-propane-use-and-costs-when-drying-corn , https://cropwatch.unl.edu/harvesting-drying-storing-late-maturing-high-moisture-corn [검증됨, 가격 구식] |
| 작업 가능성(workability), 곡물 마케팅/헤지, 보험 청구 입증 | 정량 근거 확보 못 함 **[미확인]**. 가설: 보험 청구 시 field-level 실측 강수/기온 증빙 수요 | - |
| 전체 날씨 손실 | 2024 날씨 손실 약 $20.3B (가뭄/폭염/산불 $11B+, 과습/홍수/허리케인 $6.7B, 우박 $1.2B, 동해 $854M). RMA 보험 가입 총 가치 $158B 중 7%에서 보험금 지급 | https://www.fb.org/market-intel/hurricanes-heat-and-hardship-counting-2024s-crop-losses [검증됨, AFBF 추정(전 면적 100% 가입 가정)] |

### 날씨 정보의 가치 (지불의사 관점, 중요 경고)
- Ohio 농지 대상 연구에서 개선된 날씨 정보 지불의사는 약 $0.15/acre라는 요약이 있음 (https://u.osu.edu/ohioagmanager/?p=192) **[미검증: 연도/방법 확인 필요]**.
- 완벽한 3주 강수 예보의 가치 $90.95/acre는 1960년대 raisin 사례이며 가격 효과를 넣으면 산업 전체로는 과대평가 (https://econometricsociety.org/publications/econometrica/browse/article-comments/1963/01/01/value-better-weather-information-raisin-industry) [검증됨, 구식].
- 시사점: "날씨 데이터 자체"는 싸게 평가되고, "특정 결정(N 타이밍, 살포 윈도우, PP 판단)을 $로 연결"해야 지불이 발생.

## 3. 기존 날씨 도구의 불만 (포럼 직접 근거는 확보 못함)

AgTalk/Reddit/Successful Farming 스레드는 검색에서 나오지 않음 -> 팀이 직접 확인 필요 **[미확인]**. 확보한 간접 근거:
- DTN 자체 연구(2019, 벤더 연구): 보간 추정 날씨 vs 5,000+ on-farm 스테이션 비교, 실측 강수 약 20% 더 정확, 추정 날씨 기반 모델 오차 20-25%. https://www.dtn.com/wp-content/uploads/2019/05/how-on-farm-weather-stations-deliver-greater-accuracy.pdf [벤더 편향]
- 문제는 모델 품질보다 앱의 "평균화"라는 주장(UK Catchment AI/Probcast): 10mm/24h 같은 의사결정 임계값 확률 대신 평균 예보 제공. https://www.fwi.co.uk/machinery/technology/probcast-weather-app-gives-growers-insights-into-rain-risk [검증됨, 영국 사례]
- Maine 재배자 설문(n=48): 정확도(31%), 현지화(19%)가 최우선, 의사결정 도구 사용 34%, 향후 관심 86%. https://commons.joe.org/joe/vol60/iss3/1 [소표본, 소규모 과수농 위주 추정]
- 가설(미검증): inversion 판단은 라벨상 applicator 책임인데 도구는 모호함 -> "spray window + inversion/drift risk" 틈새.

디지털 농업 채택과 지불의사:
- Purdue/CME Ag Economy Barometer(2026-07, n=400): 52%가 AI/데이터 도구가 "의미 있는 이득 없다"고 응답, 농가 재무 건전성 제약 1위 투입비 42%, 저가격 17%, 날씨 리스크 14%. https://www.fertilizerdaily.com/20260716-farm-ai-adoption-survey/md/ , https://www.dtnpf.com/agriculture/web/AG/news/article/2026/07/07/purdue-barometer-shows-farmer-high [2차 출처 경유, 원문 확인 권장]
- CropLife/Purdue 정밀농업 딜러 설문(2025, 딜러 93): 농가 소득이 최대 장벽(55%), 비용>효익이 2위. https://www.croplife.com/?p=104775 계열 [검증됨]
- Purdue 21년 570농장 연구: 대부분 기술이 효율을 올리지 않고 이득은 저성과 농가에 집중 (Purdue 요약) [미검증 세부]
- ERS 2023 채택률(auto-steer 대형 70% vs 중형 52% 등)은 마케팅 페이지 인용이라 **[미검증]** (https://farmonaut.com/?p=138793). 1차 출처: https://ers.usda.gov/publications/105894 (EIB-248, 작물별 ARMS).
- 시사점: 2026년 투입비 압박 속에서 "추가 비용" 도구는 거부감. 비용 절감/손실 방지로 ROI를 입증해야 함.

## 4. 구매자 분석

예산/구매 프로세스/영업 사이클은 대부분 검색에서 직접 근거가 없어 **[팀 가설, 미검증]** 표기.

| 구매자 | 근거/규모 | 지불 의향 영역 | 영업 사이클(가설) | 스타트업 첫 판매 적합도 |
|---|---|---|---|---|
| 대형 grower/farm manager | 대상 약 9-10만 농장. 직접 구매는 소득 압박으로 보수적 | 파종/N/살포/건조 결정 지원 | 시즌 전 결정, 1-3개월 | 중. 파일럿 가능, 단 ROI 증명 필요 |
| 독립 CCA/크롭 컨설턴트 | 비용 $4-7/acre(스카우팅), 풀 패키지 $8-10/acre(Canola Council, 캐나다), $5.75-6.75/acre(ZenBusiness, 광고성) https://www.canolacouncil.org/canola-watch/fundamentals/shopping-for-an-agronomist/ . 1994 Iowa 설문 $3-5/acre. 현재 미국 데이터 부족 | 고객 권고 정당화, 시간 절약 도구 | 짧음(개인 사업자, 월 단위) | 높음. 결정권자, 소규모 도구 구독 가능, 평판 레버리지 |
| Ag retailer (Nutrien, Helena, 협동조합) | Nutrien: 약 1,800 지점, 4,200+ crop consultants, 60만+ 고객 계정 https://www.nutrien.com/about/our-business/retail ; 자체 디지털 플랫폼 보유. Helena 데이터 미확인 | 자사 앱/에이전트에 날씨 인텔리전스 임베드, 화학/비료 판매 연계 | 길다(6-18개월, 가설) | 장기 채널. 해커톤 이후 목표 |
| Custom applicator / aerial | 라벨상 drift 책임 applicator, dicamba 규제 강화 (섹션 2). 사업자 수 미확인 | 스프레이 윈도우, 기록/증빙(소송 방어) | 중간 | 중-높음. 책임/법적 리스크로 지불 동기 명확 |
| Seed/chem 회사 | Corteva(Granular), Bayer(FieldView) 자체 보유. 신규 데이터 조달 가능성 | 데이터/API | 매우 길다 | 낮음 |
| Crop insurer/agent | 2024 날씨 손실 $20B, RMA 지급 $10.9B 규모(AFBF). Farmers Edge-Munich Re parametric, DigiAg(미국 자회사 2022), Kansas OpenET 보험 조정 파일럿 https://www.businesswire.com/news/home/20220208005612/en/Farmers-Edge-Inc.-Launches-DigiAg-Risk-Management-US-LLC-Subsidiary , https://blogs.edf.org/growingreturns/2025/06/26/modernizing-agricultural-insurance/ | 청구 검증, parametric trigger, 리스크 모델 | 길다 | 낮음(규제, 규모). 비전 슬라이드용 확장 시장 |
| Ag lender (Farm Credit) / 농지 관리(Farmers National) | 직접 근거 못 찾음 **[미확인]** | 포트폴리오 리스크 모니터링 | 길다 | 낮음 |

**가장 현실적인 첫 구매자(판단)**: 대형 농장을 고객으로 두는 독립 CCA/농장 매니저(= 결정자이자 소수 의사결정 체인)와 custom applicator. 이유: (1) 구매 사이클 짧음, (2) 결정이 날씨 임계값에 직결, (3) 대형 농장 한 곳당 수천~수만 acre를 대리하므로 acre당 가격이 낮아도 계정 단가 충분, (4) retailer/insurer는 영업 사이클이 길어 3시간 해커톤 데모 스토리로는 확장 경로로만 제시. 단 이것은 문헌이 아닌 추론이며 CCA 수/담당 면적은 **[미확인]**.

## 5. SaaS 가격대 (농업)

| 제품 | 가격 | 출처/상태 |
|---|---|---|
| Climate FieldView Plus | 연 $649 (2026 분석 기준, 1,000 acre 가정 시 약 $0.65/acre, 필자 계산이 아닌 출처 계산). 2018: Plus $3/acre ($4 번들). Seed Script는 과거 $1/acre. 획득 면적 기준 tier | https://fieldview.com/blog/a-bigger--better-fieldview---introducing-our-new-subscription-tiers , https://us.fitgap.com/products/climate-fieldview [2차, 현재 가격은 미검증] |
| Farmers Edge | 2015: $3.95/acre 풀서비스(2014 보도, 구식) | https://www.grainews.ca/features/a-new-business-model-for-precision-ag-data-packages/ [구식] |
| Semios (과수 IoT, 센서 포함) | 연 $180-260/acre 추정, Frost module +$10/acre | https://us.fitgap.com/products/semios [미검증, 집계 사이트] |
| Arable | 기기당 연 $850~ (구식 가능) | https://flypix.ai/arable-tool-review/ [미검증] |
| Granular | 공개 가격표 없음 | 검색 요약 [미검증] |
| CCA 서비스 | $4-10/acre (위 표) | 위 참조 |

해석: row crop 소프트웨어는 $0.5-4/acre/yr, 서비스 인력 포함은 $4-10/acre, 고가치 특수작물 IoT는 $100+/acre. Row crop 대형 농장 대상이라면 $1-3/acre/yr(5,000 acre 농장 $5-15K/yr) 가정이 합리적이나 팀 가정이다 **[미검증]**.

## 6. 요약 판단 (팀 의사결정용)

1. 금액 상위 3개 날씨 결정(근거 기준): (a) 파종 시기/prevented planting(2019 단일년 $4.2B 보험금, 평균 $224/acre; 파종 지연 $68-110/acre), (b) 질소 타이밍/손실(사례별 $66-462/acre, 편차 큼), (c) 살포 윈도우/drift(법적 책임 $75M급 판결, 규제 변화) 및 특수작물 서리 방어/관개(정량 미확보).
2. 가장 유망한 구매자: CCA/농장 매니저 + custom applicator. 확장 경로: ag retailer, 보험.
3. 리스크: 2026 농가 투입비 압박과 AI 도구 회의론(52%). "정확한 날씨"가 아니라 "결정 임계값 확률 + $ 영향"으로 포지셔닝.
4. 후속 조사 필요: AgTalk/Reddit 원문, CCA 수/면적, 건조/마케팅/관개 $ 근거, Helena 및 Farm Credit 사례, Purdue barometer 원문.
