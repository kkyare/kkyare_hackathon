# 07b. Ag retail / custom applicator dispatch 소프트웨어 경쟁 조사

조사일: 2026-10-24. 표기: [확인] = 벤더/공식 페이지에서 직접 확인, [2차] = 뉴스·대학 extension·검색 요약 등 간접, [미검증] = 근거 못 찾음 또는 추정.
주의: 검색은 요약 기반이라 벤더 마케팅 문구가 대부분이다. 가격은 거의 비공개.

## 1. 경쟁 제품 요약

| 제품 | 주요 기능 | 날씨 사용 방식 | 가격 | 고객/비고 |
|---|---|---|---|---|
| Agvance SKY Dispatch (SSI) + Inform/Apply -> Ops 앱 | Inform(영업)에서 work order를 "Ready"로 표시 -> Dispatcher가 배정, 지도, turn-by-turn, 앱 내 메시지, 전자서명, custom application record 연동 | Dispatch 화면에 radar, 과거 강수, wind map, 현재 기온 표시 + Apply 앱이 현장 날씨 자동 기록. 표시/기록 전용 [확인] | 비공개 | ag retail ERP(Agvance) 사용자. 출처: https://agvance.net/products/agronomy/dispatch (날씨/메시지/스케줄 [확인]), https://apps.apple.com/pg/app/agvance-apply/id1352554449 , https://www.agvance.net/post/time-saving-dispatch-technology (스케줄에서 job 재정렬 [확인]) |
| Raven Slingshot Dispatch Pro + AgSync | work order를 장비/applicator에 배정, 라우팅, 제품/고객/위치별 스케줄, 복수 applicator 배정, Viper 4 cab 컴퓨터로 전송, Field Ops 앱으로 완료. 일정 변경 시 "자동 통신으로 즉시 재경로" 문구 [2차] | 완료 기록에 온도/습도/풍향 로그. 날씨 기반 자동 재스케줄 언급은 못 찾음 [미검증]. AgSync 설명 기사에 "날씨로 지연 시 매니저가 reroute"(수동) [2차] | 비공개 | AgSync: 2018 Raven이 인수. 고객은 ag retailer, aerial applicator, 임업, seed company [2차]. https://edge.ravenprecision.com/resource-library/slingshot-dispatch-pro-overview ([확인]: AgSync 필요, Viper 4+ 3.8.0+, Field Ops 앱), https://winfieldunited.com/news-and-insights/enhance-work-flow-using-agsync , https://pl.ravenind.com/resources/news/raven-industries-agrees-to-acquire-agsync |
| John Deere Operations Center PRO (PRO Dispatch / PRO Run) | web에서 work order 배정/재우선순위, 복수 applicator, 장비·tender 위치, JDLink cab 디스플레이로 전송, 완료 정보가 back-office로 회신, 타 브랜드 지원 | 검색 결과에 날씨 기능 언급 없음 [미검증] | 비공개 | 2023-01 ag retailer 대상 출시 [2차]. https://www.deere.com/OperationsCenterPRO , https://deere.com/en/news/all-news/pro-ag-retailers |
| Solinftec Applicator / Farmer 앱 | custom application fleet(sprayer, spreader, tender) 모니터링, 스케줄/경로, 라이브 날씨, 현장 hazard 미리보기, 앱 내 work order 서명(감사용 보관) | 라이브 날씨/예보 표시 [2차] (App Store 설명) | 비공개 | https://apps.apple.com/us/app/id1601876935 , https://apps.apple.com/us/app/id1582527232 |
| Traction Ag (Traction Enterprise, Granular 계열) | 모바일 work order 수신/완료, 매니저 스케줄/생성, 길안내, 노트/사진, 사용량 확인, tank mix calculator | 못 찾음 [미검증] | 비공개 | farm 운영 관리 중심(retail dispatch 아님). SMS 근거 없음. https://success.tractionag.com/enterprise-knowledge/mobile |
| Bushel Mobile | 생산자가 자기 필드의 작업(농약/비료 적용) 이력 열람 | - | - | 생산자 열람용, applicator 배차 아님 [2차]. https://bushelpowered.com/products/bushel-mobile/mobile-features |
| Agrian (TELUS Agriculture & Consumer Goods) | label database(제조사 승인, 매일 갱신, rate/REI/PHI/PPE), record-keeping, 추천 | - | Capterra 페이지에 가격 섹션 있으나 수치 미확보 | TELUS가 ag tech사에 label/compliance 데이터 API 라이선스 제공(담당자 문의). https://www.telus.com/agcg/agriculture/agriculture-api , https://www.capterra.com/p/207291/Agrian/ |
| GROWMARK myFS Agronomy AI agent (Intelinair 협력) | 2026 시즌 도입. crop plan/soil/field boundary/적용 이력/이미지 기반 질의, in-season decision support. crop specialist 보조용 | 날씨 데이터 활용 가능하나 dispatch 아님 | - | 2026-04-14 발표. dispatch/work order 라우팅 언급 없음 [2차]. https://www.growmark.com/news-center/growmark-launches-ai-agronomy-agent-in-myfs-agronomy-platform , https://www.croplife.com/?p=108484 |
| Intelinair AGMRI AI Agent | advisor/grower 필드 질의(영상, 토양, 날씨, 입력 이력) | 질의 데이터 | - | https://igrownews.com/intelinair-latest-news/ [2차] |

조사했으나 근거를 못 찾은 항목: AGRIntelligence, Rhiza, FarmQA, Ag Leader Spray app, Spraytec, ApplicatorPro, Croptracker(일반 traceability 툴로 보임), GoField, Farmbrite 는 dispatch/날씨 자동화 관련 자료를 확보하지 못했다 [미검증]. CNH, Climate FieldView 는 agronomy 추천 중심이며 retail dispatch 증거 없음 [미검증]. 발표 전에 벤더 데모/문의로 확인 필요.

## 2. 핵심 질문: 날씨 기반 multi-field/multi-sprayer 자동 재스케줄 + label rule 체크를 하는 제품이 있는가

결론: 이번 조사 범위에서는 발견하지 못했다. 다만 "없다"를 증명하지는 못한다 (벤더 내부 기능, 비공개 문서, 신생 스타트업 가능성).

근거:
- 확인된 날씨 사용은 전부 표시/기록 수준이다: Agvance는 radar/wind map 표시와 현장 날씨 자동 기록 [확인] (https://agvance.net/products/agronomy/dispatch), Solinftec은 라이브 날씨/예보 표시 [2차], Raven은 완료 시 온도/습도/풍향 로그 [2차].
- 재스케줄은 수동이다: Agvance는 드래그앤드롭으로 job 재배정/재정렬 [확인], AgSync는 날씨 지연 시 "관리자가 reroute" [2차] (https://winfieldunited.com/news-and-insights/enhance-work-flow-using-agsync). Raven Dispatch Pro의 "일정 변경 시 자동 통신으로 즉시 재경로"는 변경 통지 자동화이지 날씨 판단이 아니다 [2차, 해석].
- label rule(풍속, 온도, 강우, buffer, 제품별 제한)을 스케줄러가 평가한다는 근거는 없다. label 데이터는 Agrian/TELUS 같은 별도 DB로 존재한다 [2차].
- "AI agent ag retail dispatch" 검색에서 일치하는 스타트업은 나오지 않았다. 나온 AI는 agronomy 자문형(GROWMARK, Intelinair, Taranis Ag Assistant)이다 [2차]. 검색 결과에는 Agzen(정밀 살포 서비스)도 있었으나 내용 미확인 [미검증].
- 따라서 gap 가설: (주문 자연어 intake) + (multi-model forecast + label 조건 평가) + (자동 재계획) + (메시지 초안) 결합은 비어 있어 보인다. 단, 기존 제품이 이미 보유한 work order/장비/기록 시스템과의 통합이 진입장벽이므로, 데모는 "기존 dispatch 위에 얹는 AI 레이어" 포지셔닝이 현실적이다 [의견].

## 3. 레지스트리 및 규제 데이터

### FieldWatch (DriftWatch, BeeCheck, CropCheck, FieldCheck)
- 규모: 공식 사이트 "30개 이상 geography", 28개 US 주 + DC + 캐나다 3개 주, Vermont 2026 활성화 [확인] (https://fieldwatch.com ; 방문자 카운터는 0으로 표시되어 등록 site 수 미확보). 구 NAAA 자료: 68,000 registered sites, 53,000 users, 2.44M mapped acres (날짜 불명) [2차] (https://www.agaviation.org/?p=17713). 2019: 22개 주, 37,000+ sites [2차] (Maine DACF 문서). 2021 DTN: applicator 10,000+ 등록 [2차].
- 접근: applicator는 무료로 FieldCheck 사용(DriftWatch/BeeCheck/SeedFieldCheck), 등록 시 지정 지역의 신규 site 이메일 알림 [확인] (https://fieldwatch.com). 공개 API는 공식 사이트에 언급 없음 [확인(부재)]. 다만 "12개 이상 precision ag 소프트웨어 회사가 패키지로 접근 제공"이라는 2024 기사가 있어 partner 데이터 스트림이 존재 [2차] (https://vegetablegrowersnews.com/article/a-map-to-success-fieldwatch-highlights-locations-of-organic-crops-bees/). 메릴랜드 fact sheet도 "technology partners를 통해 스트리밍" 언급 [2차] (https://mda.maryland.gov/plants-pests/Documents/PesticideSensitiveCropLocatorFieldWatch.pdf). 파트너 신청 절차/약관 [미검증].
- 법적 요구: 주별 상이. 2026 over-the-top dicamba (Engenia, Stryax, Tavium; EPA 2026-02-06 등록, 2028-02-06 만료) 라벨은 sensitive crop registry를 확인했다는 문서화를 요구하고, 적용 전에 확인해야 한다 [2차] (https://crops.extension.iastate.edu/post/have-you-checked-fieldwatch-recently , https://www.mda.state.mn.us/pesticide-fertilizer/over-top-dicamba). 라벨 원문은 직접 확인하지 못했다 [미검증]. Iowa Bee Rule: 활성 hive 1마일 이내 개화 작물에서 bee-toxic 제품은 오전 8시~오후 6시 살포 제한 [2차, 같은 Iowa State 글].

### EPA Endangered Species Protection Bulletins (Bulletins Live! Two, BLT)
- 라벨이 Bulletin을 참조하는 경우에만 필요. 라벨 참조 시 FIFRA 하 집행 가능한 use limitation, 적용 전 6개월 이내(또는 당일)에 bulletin 확보, 요청 시 취득 증거 제시 필요 [2차] (https://19january2021snapshot.epa.gov/endangered-species/endangered-species-protection-bulletins_.html , https://smallgrains.wsu.edu/new-compliance-requirements-coming-to-pesticide-labels/). Tennessee 가이드는 2026 dicamba에서 BLT 확인을 6개월 이내로 안내 [2차] (https://psep.tennessee.edu/dicamba/).
- API: EPA가 BLT web services(RESTful, 기본 JSON)로 공개 PULA 데이터를 EPA 등록번호, PULA ID 등으로 조회하게 함. CSV 다운로드와 GIS map service도 있음 [확인] (https://www.epa.gov/endangered-species/advanced-resources-bulletins-live-two). ArcGIS REST 엔드포인트 예: https://blt.epa.gov/arcgis/rest/services/BLT/PesticideUsageLimitationAreasExpired/MapServer [2차]. 단 EPA는 이 자료가 정보/연구용이며 라벨 준수를 위해 BLT 시스템 자체를 대체하지 않는다고 명시 [확인]. 문의: espp@epa.gov. 인증/rate limit은 문서에서 확인 못함 [미검증].

### 2026 dicamba 라벨 조건 (스케줄 엔진 규칙 후보) [2차, 요약 간 불일치 있음]
- 풍속 3~10 mph(boom height), 역전층 금지, 95F 이상 예보/실측 시 금지, 85~95F 구간은 면적 절반만(대기 2일) (Tennessee). 240 ft downwind buffer(완화 시 축소). 풍속/온도는 적용 전, refill마다, 최소 매시간 측정. 상세 application record 필수. 출처: https://psep.tennessee.edu/dicamba/ , https://eupdate.agronomy.ksu.edu/article/epa-approves-dicamba-over-the-top-applications-through-2027-682-1 , https://www.aces.edu/blog/topics/agronomic-crops/updated-epa-requirements-for-2026-over-the-top-dicamba-applications/ , Nebraska 가이드 https://nda.nebraska.gov/sites/default/files/pesticide/dicamba/DicambaBestManagementPractices.pdf (직접 열람 실패, 검색 요약).
- 불일치: 강우 제한이 Kansas State는 "4시간 내 예상 시 금지", ACES는 "48시간"으로 상이. 주별 차단일(Minnesota 6/12, 6/30) 존재. 데모에서는 라벨 원문을 직접 인용해 규칙 파일을 만들 것 [미검증 -> 확인 필요].

## 4. 메시징
- Agvance Ops/Apply: dispatcher와 applicator/driver 간 앱 내 메시지(Blend/Delivery Ticket 번호 참조) 및 파일 전송, Inform 앱으로 고객에 진행 상황 공유, 고객용 grower portal [확인] (https://agvance.net/products/agronomy/dispatch , https://www.agvance.net/post/time-saving-dispatch-technology). 최신 Ops 앱 업데이트에 Samsara 연동, offline mode 개선 언급 [2차] (App Store 목록).
- Raven: AgSync/Field Ops 앱으로 현장에 자동 통신 [2차]. Deere: PRO Run 앱 + JDLink cab 디스플레이로 work order 자동 전송 [2차].
- Traction: 모바일 work order 수신. SMS 근거 없음 [미검증]. 전반적으로 SMS 기반 operator/grower 소통을 핵심 기능으로 문서화한 벤더는 확인하지 못함 [미검증]. 이는 AI agent가 SMS/전화 intake와 메시지 초안을 제공할 여지를 시사한다 [의견].

## 5. 데모용 데이터 접근 옵션 (권장)
1. 날씨: multi-model forecast(예: Open-Meteo가 다중 모델 제공 [미검증, 별도 확인 필요]) + 위 dicamba 규칙을 JSON rule로 구현.
2. Sensitive crop: FieldWatch는 공개 API 없음 -> 데모에서는 mock registry(가상 DriftWatch/BeeCheck 폴리곤) + "FieldCheck 확인 및 문서화" 단계를 workflow에 포함. 실제 연동은 FieldWatch partner 문의 필요.
3. ESA: EPA BLT web services/ArcGIS REST로 실제 PULA 조회 가능(공개). 단 라벨 준수 대체 불가 고지 포함.
4. label 데이터: Agrian/TELUS는 라이선스 필요 -> 데모는 수동 작성한 소수 제품 라벨 JSON 사용.
5. 기록: Nebraska 2026 dicamba application record 양식을 레코드 스키마 참고로 사용 (https://nda.nebraska.gov/sites/default/files/pesticide/dicamba/RUP%20Dicamba%20Application%20Record%202026.pdf) [2차].
