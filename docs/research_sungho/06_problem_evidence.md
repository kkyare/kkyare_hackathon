# 고객 문제 입증 자료: Custom applicator와 살포 날씨 판단

> 작성일: 2026-10-24
> 질문: 주 고객(custom applicator / CCA)이 이 문제를 실제로 느끼는가?
> 결론: **applicator에게 직접 묻은 설문은 찾지 못했다.** 대신 규제, 공공 투자, 피해 통계, 기후 데이터라는 네 갈래 간접 증거는 단단하다.

---

## A. [가장 강함] 규제가 날씨 판단을 법적 의무로 만들었다

### 2026 dicamba OTT 라벨 조건 (EPA 재등록 2026-02-06)

| 조건 | 내용 |
|---|---|
| 기온 상한 | 당일이나 다음 날 예보 최고기온이 95°F 이상이면 살포 금지 |
| 기온 85~94°F | 농가의 카운티 내 DT 대두·면화 면적의 50% 이하만 처리하고, 나머지는 3일째에 처리 |
| 풍속 | 3~10 mph |
| Inversion | inversion 중 살포 금지 |
| 풍향 | 민감 작물이나 주거지 쪽으로 풍향이 바뀌면 즉시 중단 |

출처: [UNL CropWatch 2026](https://cropwatch.unl.edu/using-dicamba-over-top-dicamba-tolerant-soybean-nebraska-2026)

**시사점**: applicator는 **이틀 치 예보와 필드별 면적 배분을 동시에 계산**해야 한다. 사람이 머리로 풀기 어려운 계획 문제다.

### 기록 의무
- 연방·주 공무원에게 기록을 제출해야 한다. 상세 항목은 라벨 Section 7.4에 있다(Tavium은 7.4.3).
- 2026년부터 **기온 예보**도 기록 항목에 들어갔다.
- 출처: [UNL](https://cropwatch.unl.edu/using-dicamba-over-top-dicamba-tolerant-soybean-nebraska-2026), [Nebraska 2026 기록 양식](https://nda.nebraska.gov/sites/default/files/pesticide/dicamba/RUP%20Dicamba%20Application%20Record%202026.pdf)
- 각 주가 2026 시즌용 지침과 양식을 새로 냈다: [Tennessee 2026](https://psep.tennessee.edu/wp-content/uploads/sites/91/2026/05/2026-Dicamba-Guidance-Form-Final.pdf), [Alabama](https://www.aces.edu/blog/topics/crop-production/updated-epa-requirements-for-2026-over-the-top-dicamba-applications/), [K-State](https://eupdate.agronomy.ksu.edu/article/epa-approves-dicamba-over-the-top-applications-through-2027-682-1)
- Tennessee 지침은 살포 시작 전, sprayer 재충전 때마다, 또는 최소 1시간마다 기온과 풍속을 측정하라고 한다.

---

## B. [강함] 공공 부문이 이미 돈을 써서 도구를 만들었다 (드러난 수요)

| 주 | 도구 | 특징 | 출처 |
|---|---|---|---|
| South Dakota | SD Mesonet Spray Tool | 대두 checkoff 자금. 5분마다 갱신. 2018년 inversion 센서 추가. **주 농업부가 살포 기록으로 인정** | [SDSU](https://extension.sdstate.edu/use-sd-spray-tool-inversion-detection-and-weather-pesticide-application) |
| Missouri | Mesonet "Temperature Inversion Potential" | 실시간 관측 | [MU Extension](https://extension.missouri.edu/news/mu-extension-weather-stations-help-farmers-know-when-to-spray) |
| Kansas | Mesonet inversion 정보(2017) | 관리자 본인이 "정확한 살포 시점보다 경향 파악용"이라고 했다 | [K-State](https://www.ksre.k-state.edu/news/stories/2017/11/mesonet-temp-inversions.html) |
| 민간 | Spectrum Technologies 스테이션 | 지면과 10ft 온도차로 inversion 감지, 기록 | [CropLife](https://www.croplife.com/?p=76129) |

**빈틈**: 모두 **주 단위로 흩어져 있고, 현재 관측만 보여 준다.** "내일 어느 필드를 언제, 어떤 순서로"라는 다중 필드 계획을 해 주는 도구는 없다.

---

## C. [중간] Drift는 자주 일어나고 비싸다 (대부분 2017~2020 자료)

- **2017년**: 17개 주에서 공식 민원 1,400건 이상, 피해 약 250만 acre. [EcoWatch/Reuters](https://www.ecowatch.com/monsanto-dicamba-2468298141-2468298141.html)
- **2017년**: dicamba 관련 보험 청구 2,700건 이상, 그중 약 1,000건이 Arkansas. [Farm Progress](https://www.farmprogress.com/crop-protection/check-spray-drift-insurance)
- **Missouri**:
  - dicamba 민원이 2017년 315건, 2018년 220건, 2019년 98건이었다.
  - 설문 응답자들은 지역 피해의 **70~80%가 신고되지 않는다**고 추정했다(University of Missouri 설문).
  - 출처: [St. Louis Public Radio 2020](https://www.stlpr.org/health-science-environment/2020-02-07/missouri-department-of-agriculture-has-hundreds-of-unresolved-pesticide-complaints)
- **중서부 drift 신고**: Iowa 2010~2015년 471건, Indiana 2011~2016년 391건, Michigan 2014~2016년 91건. [U of Iowa](https://iro.uiowa.edu/esploro/outputs/9983777110802771)
- **사업자 손실**: 평균 손실이 보험금의 **4배**다. [UW Extension](https://fyi.extension.wisc.edu/pat/files/2017/09/driftdoc.pdf)
- **소매상 부담**: "보험사만이 아니라 retailer가 큰 타격을 입는다." [DTN 2017](https://www.dtnpf.com/agriculture/web/ag/crops/article/2017/10/20/insurance-claims-denied-companies-2)
- **보험 한도**: 표준 농장 책임보험의 drift 보장은 누적 $25,000 한도다. [Business Insurance](https://www.businessinsurance.com/article/00010101/NEWS06/302029995/Herbicide-risks-force-conventional-farmers-to-seek-higher-coverage-limits)
- **최대 판결**: Bader Farms 사건은 $265M에서 $75M로 감액됐다(02_customers.md 참고).

---

## D. [중간] 살포 윈도우 자체가 좁다

- **Iowa State 30년 풍속 분석(1987~2016, 3개 지점)**
  - 하루 중 상당 시간 동안 평균 풍속이 라벨 상한에 가깝거나 넘었고, 시즌 초반에 특히 그랬다.
  - 바람은 오전 7시부터 세져서 오후 4시에 정점이다. 북서 Iowa가 더 바람이 세다.
  - 출처: [ISU, Hartzler 2017](https://crops.extension.iastate.edu/cropnews/2017/01/wind-speed-and-herbicide-application)
- **Iowa 농민 인터뷰**: "바람 부는 날이 계속돼 파종은 해도 살포는 밀린다." [Brownfield](https://www.brownfieldagnews.com/news/iowa-farmer-concerned-about-timely-herbicide-applications/)
- **Georgia 자가 살포 농민 설문(n=105, 주관식)**: 가장 큰 과제는 drift·규제 18%, 살포 타이밍 16%, 날씨 15%였다. 지역과 대상이 달라 참고용이다. [Weed Technology](https://www.cambridge.org/core/journals/weed-technology/article/survey-of-pesticide-application-practices-and-technologies-in-georgia-agronomic-crops/3BB846A190337DCFCDE8ABE1D354C1AA)
- **업계지**: "어떤 custom applicator에게 물어도 top 5 걱정에 drift가 들어간다." [CropLife 2013](https://www.croplife.com/management/eight-keys-to-managing-spray-drift/)

---

## ⚠️ 서비스 설계에 반영할 발견

1. **예보만으로는 법적 기록이 되지 않는다.**
   - 라벨은 **붐 높이에서 살포 시작과 종료 시점에 측정한 풍속·풍향**을 요구한다.
   - Purdue: "현장 휴대용 측정기가 법적 요건을 충족한다." **2개 이상 소스를 기록하면** 조사 시 성실 의무를 입증할 수 있다고 권한다.
   - 출처: [Purdue 2018](https://extension.entm.purdue.edu/newsletters/pestandcrop/article/use-caution-with-weather-prediction-tools-and-dicamba-recordkeeping)
   - 결정: "준수 로그 자동 생성"이 아니라 **"계획 단계 예보 근거(2026년부터 기온 예보 기록 의무) + 현장 측정값 입력"을 합친 기록**으로 포지셔닝한다.
2. **"일출 1시간 후~일몰 2시간 전" 규칙은 2026 라벨에서 확인되지 않았다.** 판정 규칙에서 뺀다.
3. **85~94°F일 때 50% 면적 제한 규칙을 추가한다.** Claude 다중 필드 계획의 핵심 근거가 된다.
4. 72시간 내 기록 의무는 2024 Illinois 자료([IFCA](https://ifca.com/files/IFCA%202024%20Dicamba%20Recommendations.pdf))에만 있다. 2026년에는 미확인이다.

---

## 비어 있는 것

- [ ] **2024~2026년 drift 민원 통계**: 각 주 농업부 자료를 직접 확인해야 한다.
- [ ] **applicator 대상 설문과 직접 인용**: Reddit과 NewAgTalk는 접근이 막혔다.
- [ ] **2026 라벨 원문(Engenia, Stryax, Tavium) Section 7.4**: 2차 해설만 확인했다.
- 해커톤용 보완책: Iowa·Nebraska applicator 협회나 지인 1~2명에게 연락해 인용 한 줄을 확보한다. 안 되면 "규제 강화 + 공공 도구 공백"이라는 구조적 근거로 덱을 구성한다.

---

## 덱용 한 줄

> **"2026 dicamba 라벨은 이틀 치 예보와 면적 배분을 함께 계산하라고 요구한다. 그런데 applicator에게 있는 건 주마다 흩어진 '현재 관측' 도구뿐이다."**
