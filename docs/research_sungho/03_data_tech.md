# 03. 데이터 및 기술 조사: 3시간 해커톤에서 실제로 쓸 수 있는 것

기준일: 2026-10-24. 아래 "curl 검증"이라고 표시한 항목은 이 문서 작성 중 실제로 호출해 응답을 확인한 것이다. "미검증"은 검색 결과나 사전 지식에 기반한 것이다.

## 0. 결론 요약

| 용도 | 선택 | 키 필요 | 검증 |
|---|---|---|---|
| 메인 예보 (시간별, 3km) | Open-Meteo `ncep_hrrr_conus` | 없음 | curl 검증 |
| 멀티모델 블렌딩 | Open-Meteo `models=` 에 `ecmwf_aifs025_single, ecmwf_ifs025, gfs_seamless, ncep_nbm_conus, ncep_hrrr_conus` | 없음 | curl 검증 |
| 확률/불확실성 | Open-Meteo Ensemble API (ECMWF IFS 51 members, GEFS) | 없음 | curl 검증 |
| 바이어스 보정용 관측 | Iowa Environmental Mesonet (IEM) ASOS/현재 관측 | 없음 | curl 검증 |
| 과거 예보 vs 관측 검증 | Open-Meteo Previous Runs API | 없음 | curl 검증 |
| 스프레이 조건 (inversion, mixing height) | NWS `api.weather.gov/gridpoints` (mixingHeight, transportWindSpeed, windGust) | 없음 (User-Agent 필수) | curl 검증 |
| 경보 | NWS `alerts/active?point=` | 없음 | curl 검증 |
| 토양 정보 | USDA SDA (SSURGO) REST | 없음 | curl 검증 |
| 가뭄 | US Drought Monitor 데이터 서비스 | 없음 | curl 검증 |
| 작물 통계 | USDA NASS Quick Stats | 무료 키 (가입 필요) | 키 없이 호출 시 `unauthorized` 확인 |
| LLM | Claude API | 키 | 이 문서 범위 밖 |

핵심 판단: 3시간 안에 "더 정확하다"를 신뢰성 있게 주장하려면 새 AI 모델을 돌리는 것이 아니라, (1) 여러 모델을 블렌딩하고 (2) 근처 ASOS 관측으로 바이어스를 보정하고 (3) 그 개선을 과거 데이터로 수치로 보여 주는 것이 현실적이다. GPU가 필요한 GraphCast/Aurora/Earth-2 직접 실행은 3시간에 불가능하다.

---

## 1. 무료 예보 API

### 1.1 Open-Meteo (메인)

- 약관: 무료 API는 **비상업적 용도만** 허용, 일 10,000콜 미만 / 시간 5,000 / 분 600, CC BY 4.0 attribution 필요 ("Weather data by Open-Meteo.com" 링크), SLA 없음. 상업 사용은 유료 구독(API key) 필요. 가격은 공식 페이지에서 직접 확인하지 못했다 (미검증).
  - 해커톤 데모는 evaluation/prototyping 범위이므로 문제없다. 단, 슬라이드에 "상용화 시 유료 플랜 또는 NWS/NOAA 직접 수집으로 전환"을 한 줄 넣으면 대형 농장 타깃의 신뢰도에 도움이 된다.
- 지연: curl 측정 약 1.2~1.6초/요청 (한국 회선 기준 왕복). 서버 생성 시간은 0.1~1ms 수준.
- 모델 (문서 및 curl 확인):
  - `ncep_hrrr_conus`: 3km, 시간별, 매시 갱신, 18시간 (00/06/12/18z는 48시간). 미국 한정.
  - `ncep_nbm_conus`: 2.5km, 최대 11일. NOAA 블렌딩 결과물이라 "공식 블렌드" 기준선으로 쓰기 좋다.
  - `ecmwf_ifs025`, `ecmwf_aifs025_single` (AI 모델 AIFS), `gfs_seamless`: curl로 daily 값 반환 확인.
  - AIFS가 Open-Meteo를 통해 API로 접근 가능하다는 점이 핵심이다. GPU 없이 "AI 기상 모델"을 데모에 포함할 수 있다.
- 농업 변수 (curl 확인): `et0_fao_evapotranspiration`, `vapour_pressure_deficit`, `soil_moisture_0_to_1cm`(m³/m³), `soil_moisture_3_to_9cm`, `soil_temperature_6cm`, `wind_gusts_10m`, `precipitation_probability`, `dew_point_2m`, `relative_humidity_2m`, `wind_direction_10m`.
  - HRRR 모델 지정 시 ET0와 soil moisture는 `undefined` 단위가 붙고 값이 비는 경우가 있었다. 단위 `undefined`로 응답한 필드는 값을 반드시 확인하고, soil/ET0는 모델 지정 없이(best match) 별도 호출하는 것이 안전하다.
- GDD: 전용 변수는 없다. daily `temperature_2m_max/min` 으로 직접 계산한다 (옥수수 86/50 방식: `max(0, (min(Tmax,86)+max(Tmin,50))/2 - 50)`, °F).
- Delta-T: 전용 변수는 없다. `temperature_2m`, `relative_humidity_2m` 로 wet-bulb 계산 (Stull 근사식). 데모에서는 `Tdb - Twb` 를 코드로 계산한다.
- 역사: `archive-api.open-meteo.com` (ERA5 계열), 시간 단위 및 daily ET0 확인.
- Previous Runs API: 과거 N일 전에 발행된 예보 값을 받을 수 있다 (`temperature_2m_previous_day1` 등). 예보 정확도 검증에 직접 쓸 수 있다 (4절 참조).

curl 예시 (HRRR, Des Moines 부근):
```bash
curl "https://api.open-meteo.com/v1/forecast?latitude=41.88&longitude=-93.6&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,wind_speed_10m,wind_gusts_10m,wind_direction_10m&models=ncep_hrrr_conus&forecast_days=1&wind_speed_unit=mph&temperature_unit=fahrenheit"
```
응답 발췌 (10~12시 UTC):
```json
{"temperature_2m":[55.6,55.0,54.6],"relative_humidity_2m":[77,79,80],"dew_point_2m":[48.5,48.6,48.5],
 "wind_speed_10m":[8.7,9.0,8.8],"wind_gusts_10m":[17.7,16.8,17.2],"wind_direction_10m":[164,159,162]}
```

멀티모델 비교 (최고기온, °F):
```bash
curl "https://api.open-meteo.com/v1/forecast?latitude=41.88&longitude=-93.6&daily=temperature_2m_max&models=ecmwf_aifs025_single,ecmwf_ifs025,gfs_seamless,ncep_nbm_conus&forecast_days=3&temperature_unit=fahrenheit"
```
```json
"daily":{"time":["2026-10-24","2026-10-25","2026-10-26"],
 "temperature_2m_max_ecmwf_aifs025_single":[74.6,68.4,64.8],
 "temperature_2m_max_ecmwf_ifs025":[73.4,72.1,68.4],
 "temperature_2m_max_gfs_seamless":[76.6,74.6,68.0],
 "temperature_2m_max_ncep_nbm_conus":[76.9,73.0,66.4]}
```
모델 간 최고 4~5°F 차이가 보인다. 이것이 "단일 모델에 의존하면 위험하다"는 시연 포인트가 된다.

Ensemble (확률):
```bash
curl "https://ensemble-api.open-meteo.com/v1/ensemble?latitude=41.88&longitude=-93.6&hourly=precipitation&models=ecmwf_ifs025&forecast_days=2"
```
`precipitation`, `precipitation_member01` ... 으로 총 51개 시계열 반환 확인. 멤버 중 강수 > 0.2mm 비율 = 비 확률.

Soil (curl 확인): `soil_moisture_0_to_1cm: 0.147 m³/m³`, `soil_moisture_3_to_9cm: 0.174`, `soil_temperature_6cm: 18.6 °C`.

출처: https://open-meteo.com/en/terms , https://open-meteo.com/en/pricing , https://open-meteo.com/en/docs/gfs-api , https://openmeteo.substack.com/p/high-resolution-models-and-hourly

### 1.2 NWS api.weather.gov

- 키 불필요, 무료, 미국 정부 데이터(저작권 제한 없음), 상업 사용 가능. `User-Agent` 헤더 필수 (예: `hackathon (email)`). 공식 rate limit 수치는 공개되지 않았고 "합리적 사용"이다 (미검증). 캐싱을 권장한다.
- 흐름: `/points/{lat},{lon}` -> `gridId/gridX/gridY` -> `/gridpoints/{office}/{x},{y}` (raw gridded data). curl 확인: 41.88,-93.6 -> `DMX 74,63`.
- gridpoints 응답에는 ag에 유용한 변수가 있다 (curl 확인, 총 68개 키): `windGust` (km/h), `windSpeed`, `probabilityOfPrecipitation`, `mixingHeight` (m; 예시값 369m), `transportWindSpeed`, `relativeHumidity`. 단위가 `wmoUnit:km_h-1` 이므로 mph 변환 필요.
  - `mixingHeight` 는 inversion proxy로 쓸 수 있다. mixing height가 낮고 풍속이 낮으면 안정층(inversion) 가능성이 높다. 완전한 inversion 측정은 아니므로 "proxy"로 표기해야 한다.
- 응답이 크다 (약 230KB). 필요한 키만 파싱한다. 응답이 `/points` 에서 반환한 URL 형식과 일치하는 좌표를 써야 한다 (임의 좌표 추정 금지).
- 경보: `https://api.weather.gov/alerts/active?point=41.88,-93.6` -> `features: []` (현재 경보 없음) 확인.
- 출처: https://www.weather.gov/documentation/services-web-api

### 1.3 기타

- Tomorrow.io 무료: 500 req/일, 25 req/시간, 3 req/초 (공식 지원 문서). 키 필요. 시간당 25콜은 다수 필드 데모에는 빡빡하다. 비추천.
  - 출처: https://support.tomorrow.io/hc/en-us/articles/20273728362644-Free-API-Plan-Rate-Limits
- Meteomatics: 검색에서 공개 무료 티어 정보를 찾지 못했다. 교육/체험 계정이 있을 수 있으나 미검증. 3시간 안에 신청/대기하는 위험을 지지 말 것.
- NOAA NBM / ECMWF open data 원본(GRIB2): 직접 파싱은 3시간 안에 비현실적이다. Open-Meteo가 이미 이를 API로 제공하므로 우회한다.
- NASA POWER (키 불필요): `community=AG`, 일 단위 `T2M_MAX`, `PRECTOTCORR`, `GWETROOT`(뿌리층 토양 습윤) 응답 확인. 단 2026-10-01 `PRECTOTCORR=586.56` 은 비정상적인 값이었다 (데이터 이상 가능성). 데모에서 쓰려면 sanity check 필요하다. 신뢰도 낮음.

---

## 2. "더 정확하다"를 신뢰성 있게 만드는 방법

### 2.1 3시간 안에 가능한 것 (추천 순)

1. **멀티모델 블렌딩 + 스프레드 표시**: HRRR(단기) + NBM + IFS + AIFS + GFS를 한 번에 호출. 리드타임별 가중치(0~18h: HRRR/NBM 비중 높게, 2일 이상: IFS/AIFS)를 단순 규칙으로 정한다. 모델 간 스프레드를 "불확실성"으로 표시.
2. **관측 기반 바이어스 보정**: IEM의 근처 ASOS 관측과 모델 예보를 비교해 최근 7일 평균 오차를 빼 준다.
3. **Ensemble 확률**: IFS 51 멤버로 "2시간 내 비 확률", "풍속 > 10 mph 확률" 같은 의사결정용 확률 산출.
4. **Previous Runs로 백테스트**: 과거 예보와 관측의 오차를 숫자로 보여 준다. 슬라이드에 들어갈 증거가 된다.

### 2.2 실제 측정 결과 (이 조사 중 수행)

Des Moines ASOS(KDSM) 관측 vs Open-Meteo `gfs_seamless` 1일 전 예보 (2026-10-17~24, 시간별, n=168):

- 바이어스: -1.98°F (예보가 평균적으로 더 낮음)
- MAE: 2.42°F
- 단순 평균 바이어스 제거 후 MAE: 1.95°F (약 19% 개선)

해석 주의: 이것은 한 지점, 일주일, 한 모델, 온도에 대한 in-sample 결과이다. 제거한 바이어스를 같은 데이터에서 추정했으므로 개선폭이 과대 평가되었다. 데모에서는 "첫 5일로 보정값 추정, 나머지 2일로 검증" 식의 out-of-sample 분할을 해야 정직하다. 슬라이드에는 "한 지점 1주일 시험에서 MAE 2.4 -> 1.9°F"처럼 범위를 밝히고 쓴다.

관측 API 확인 (curl):
```bash
curl "https://mesonet.agron.iastate.edu/json/current.py?station=DSM&network=IA_ASOS"
# -> {"last_ob":{"airtemp[F]":69.0,"dewpointtemp[F]":48.0,"windspeed[kt]":10.0,"winddirection[deg]":140.0,...}}
curl "https://mesonet.agron.iastate.edu/cgi-bin/request/asos.py?station=DSM&data=tmpf&data=sknt&data=gust&year1=2026&month1=10&day1=21&year2=2026&month2=10&day2=22&tz=Etc/UTC&format=onlycomma&latlon=no&missing=M&report_type=3"
```
주의: `report_type=3` (정시 관측)을 지정하면 5분 단위 특수 관측 행(`tmpf=M` 이 많음)을 피할 수 있다. 처음 요청은 이를 빼서 값이 `M`(missing) 투성이였다.

ASOS는 공항에 있으므로 농장 포인트와의 거리, 토지 피복 차이로 대표성이 한계가 있다. Mesonet(예: Iowa State soil moisture/ISU Ag Climate)이나 주별 Mesonet은 더 낫지만 API 포맷이 제각각이라 3시간 안에는 ASOS 하나로 제한하는 것이 좋다.

### 2.3 AI 기상 모델 접근성

| 모델 | API 접근 | GPU 필요 | 3시간 내 현실성 |
|---|---|---|---|
| ECMWF AIFS | Open-Meteo `ecmwf_aifs025_single` (curl 확인) | 불필요 | 높음 |
| Google WeatherNext (Gen/Graph/2/3) | Earth Engine / BigQuery, allowlist(신청) 방식. 구 버전 Gen/Graph는 2026-07 중 deprecated, WeatherNext 3 권장 (Google 문서) | 불필요 (호스팅) | 낮음 (접근 승인 필요) |
| GraphCast / GenCast / Aurora | 오픈 가중치 있으나 직접 추론 필요 | 필요 | 비현실적 |
| NVIDIA Earth-2 | 이번 조사에서 확인하지 못함 (미검증) | 대개 필요 | 비현실적으로 가정 |

권장: "AI 모델(AIFS)을 고전 NWP(IFS/GFS/HRRR)와 블렌딩"이라고 말하는 것이 사실에 부합한다. WeatherNext를 쓴다고 주장하지 말 것.

Google 문서 출처: https://developers.google.com/weathernext/guides/deprecation

### 2.4 Downscaling
HRRR/NBM은 이미 2.5~3km로, 격자 -> 필드 좌표로는 Open-Meteo가 보간한다. 직접 통계적 downscaling은 3시간 안에 불필요하다. 고도 보정이 필요하면 Open-Meteo `elevation` 파라미터를 쓴다.

---

## 3. 농업 컨텍스트 데이터

| 데이터 | 접근 | 상태 |
|---|---|---|
| USDA NASS Quick Stats | `https://quickstats.nass.usda.gov/api/api_GET/?key=KEY&commodity_desc=CORN&year=2025&state_alpha=IA&statisticcat_desc=YIELD&format=JSON` | 키 없이 `{"error":["unauthorized"]}` 확인. 무료 키 즉시 발급 (https://quickstats.nass.usda.gov/api). 해커톤 시작 전에 신청해 둘 것. |
| SSURGO 토양 | SDA REST `POST https://sdmdataaccess.sc.egov.usda.gov/Tabular/post.rest`, 쿼리로 점 좌표 -> mukey | curl 확인 (아래) |
| US Drought Monitor | `https://usdmdataservices.unl.edu/api/CountyStatistics/GetDroughtSeverityStatisticsByAreaPercent?aoi=19153&startdate=10/1/2026&enddate=10/20/2026&statisticsType=1` | curl 확인: Polk County, IA `none:100.0` (가뭄 없음) |
| Cropland Data Layer (CDL) | CropScape `GetCDLValue` | 시도했으나 `Failed to get value` 오류. 서비스 불안정 가능. 데모에서는 CDL에 의존하지 말고 필드 작물을 사용자 입력(또는 샘플 데이터)으로 두는 것이 안전하다. |
| NASA SMAP | Earthdata 로그인 필요, 3시간 부적합 | 미검증. 건너뛴다. |
| 작물 생육 단계 | GDD 누적으로 직접 계산. 옥수수 기준 V6 ~ 475 GDD, 실킹 ~ 1,400 GDD 등 (정확 값은 extension 자료에서 확인; 미검증) | 코드로 구현 |

SSURGO 예시 (curl 확인):
```bash
curl -X POST https://sdmdataaccess.sc.egov.usda.gov/Tabular/post.rest -H 'Content-Type: application/json' \
 -d '{"query":"SELECT TOP 3 mu.mukey, mu.muname, mu.musym FROM mapunit mu INNER JOIN SDA_Get_Mukey_from_intersection_with_WktWgs84('"'"'point(-93.6 41.88)'"'"') k ON mu.mukey=k.mukey","format":"JSON+COLUMNNAME"}'
# -> {"Table":[["mukey","muname","musym"],["2835021","Webster clay loam, Bemis moraine, 0 to 2 percent slopes","L107"]]}
```
토양 이름은 LLM이 "배수/침투 특성 때문에 이 필드는 비 후 진입 가능 시점이 늦다" 같은 맥락 설명에 쓸 수 있다. 정확 파라미터(drainage class 등)는 추가 쿼리 필요하다.

---

## 4. Claude가 진짜 가치를 더하는 곳

이 부분이 심사에서 "그냥 날씨 앱이 아니다"를 가르는 차별점이다. 수치 계산은 코드가 하고 Claude는 해석/의사결정/대화를 맡는 분업을 권장한다.

1. **확률 예보 -> 운영 결정 번역**: "내일 08~11시 spray window: 풍속 3~10 mph 확률 82%, delta-T 2~8 범위, 비 확률 5%. 권고: GO (낮은 신뢰도 구간 14시 이후 제외)". 정량 값은 코드가 계산해 구조화된 JSON으로 Claude에 전달하고, 이유 설명과 trade-off를 Claude가 쓴다.
2. **농약 라벨 읽기**: 라벨 PDF/텍스트에서 풍속 한계, 기온 한계, 비 오기 전 rainfast 시간, buffer, inversion 금지 문구를 구조화 추출 (JSON schema). 이후 예보 조건과 매칭. 라벨 문구는 제품마다 다르므로 LLM의 장점이 크다. 일반 가이드: 풍속 3~10 mph, 3 mph 미만은 inversion 가능성 확인 의무(라벨 예시), delta-T는 대략 2~10°F 가 권장되나 제품 라벨 표준이 아니다 (검색 결과, 상업 weather 문서 및 호주 GRDC 가이드 기준).
   - 출처: https://cropwatch.unl.edu/managing-pesticide-applications-avoid-drift , https://www.mda.state.mn.us/sites/default/files/2020-01/herbdriftmgmt.pdf , https://grdc.com.au/resources-and-publications/grdc-update-papers/tab-content/grdc-update-papers/2017/07/10-tips-for-reducing-spray-drift
   - 데모 주의: 라벨은 법적 구속력이 있다. 데모 화면에 "라벨이 우선, 이것은 의사결정 지원"이라는 문구를 넣는다. 한 개 실제 라벨(EPA PDF)을 미리 골라 텍스트를 넣어 두면 안정적이다.
3. **불확실성 설명**: 모델 간 불일치(AIFS 74.6 vs GFS 76.6 등)를 농부 언어로 설명한다.
4. **다중 필드 에이전틱 플래닝**: 필드 N개 x 작업(spray, 수확, 관개) x 시간 창 -> 작업 순서 및 장비 배치. Claude tool use로 `get_forecast(field)`, `check_label(product)`, `get_soil(field)` 를 호출하게 한다. 3시간 데모에서는 필드 3~5개 샘플로 충분하다.
5. **SMS/음성 인터페이스**: Twilio 등을 쓰면 외부 계정 설정이 필요하다. 3시간 안에는 채팅 UI로 대체하고, 슬라이드에서 로드맵으로 언급하는 것을 권장한다.

---

## 5. 최소 기술 스택 (3시간, 공개 링크)

추천: **Next.js (App Router) + Vercel + Leaflet(react-leaflet) + Anthropic SDK**, 또는 팀이 Python에 더 익숙하면 **Streamlit Community Cloud + folium**.

- 이유: Open-Meteo, NWS, IEM, SDA 모두 키 불필요 REST이고 CORS 문제는 서버 라우트에서 호출하면 회피된다. Anthropic API 키는 서버 환경변수로만 두고 클라이언트에 노출하지 않는다.
- 구조:
  - `/api/forecast?lat&lon`: Open-Meteo 멀티모델 + ensemble 호출 -> 블렌딩/바이어스 보정/GDD/delta-T 계산 -> JSON
  - `/api/obs?station`: IEM 관측
  - `/api/advice` (POST): 위 JSON + 라벨 텍스트 + 작물 정보 -> Claude (structured output) -> 결정 카드
  - 프론트: 지도(필드 3~5개 마커/폴리곤) + 시간대별 spray window 막대 + 모델 스프레드 차트 + 채팅
- 팁:
  - 외부 API 응답은 요청 시 캐시(예: 10분 메모리 캐시)해서 속도와 rate limit을 지킨다.
  - 데모 당일 API가 죽을 경우를 대비해 샘플 응답 JSON 폴백을 넣는다.
  - Open-Meteo attribution 링크를 푸터에 넣는다 (CC BY 4.0).
  - Claude 모델 ID와 SDK 사용법은 구현 전에 공식 문서로 확인한다.

### 3시간 타임라인 (제안)
- 0:00~0:30: 스캐폴딩, Vercel 배포 파이프라인 먼저 (빈 페이지라도 공개 링크 확보)
- 0:30~1:30: 예보/관측/블렌딩 API 라우트 + 백테스트 수치
- 1:30~2:15: Claude 라벨 추출 + 결정 카드 + 채팅
- 2:15~2:45: 지도 UI, 폴리싱
- 2:45~3:00: 2-slide 덱, 리허설, 폴백 확인

---

## 6. 한계와 미검증 항목 (정직한 목록)

- 바이어스 보정 개선폭은 소규모(1지점, 7일, in-sample)이다. 대규모 정확도 주장 금지.
- Open-Meteo 무료는 비상업 전용이다. 제품 주장 시 이를 명시한다.
- NASS는 키 필요, CDL 서비스는 오류, SMAP은 로그인 필요라서 시도하지 않았다 (미검증).
- NVIDIA Earth-2, Meteomatics 무료 티어, NWS의 정확한 rate limit 수치는 확인하지 못했다.
- NASA POWER 값 중 이상치(PRECTOTCORR 586.56)를 확인했다. 데모 사용 시 검증 필요.
- 이 환경의 Python은 SSL 인증서 문제로 urllib 호출이 실패했다 (로컬 Mac 설정 문제). curl로 우회했다. 팀원 환경에서도 Python `requests` 사용 시 같은 문제가 있다면 `certifi` 설치를 확인한다.
