# fixtures

> **모든 값은 목업(DEMO DATA)입니다.** 실제 관측·예보가 아니라 시나리오에 맞춰 만든 가짜 값이며, 모든 JSON 최상위에 `"demo": true`가 들어 있습니다.

`scripts/build-fixtures.ts`가 seed 42(mulberry32)로 만듭니다. 같은 코드를 다시 돌리면 같은 파일이 나옵니다.

```bash
npx -y tsx scripts/build-fixtures.ts   # 생성
npx -y tsx scripts/check-fixtures.ts   # 검증 (--dir <경로>로 다른 폴더 검사)
```

## 파일 구성

```
fixtures/
  common/fields.json                      필지 8개
  nowcasting/<scenario>/
    snapshot-source.json                  모델별 예보 run 8개
    observation.json                      DSM 관측 72시간
    meta.json                             시나리오 설명과 기대값
```

| 파일 | 내용 |
|---|---|
| `common/fields.json` | `{demo, fields: Field[8]}`. id `field-ia-01..08`, farmId `farm-ia-a..d`(농장당 2필지), DSM(41.53, -93.65) 반경 30 km 이내, 고도 250-320 m, 80-320 acre, corn/soybean, stationId `DSM` |
| `snapshot-source.json` | `{demo, scenario, runs: ForecastRun[]}`. 모델 `ncep_hrrr_conus`, `ncep_nbm_conus`, `gfs_seamless`, `ecmwf_ifs025`마다 run 2개(issuedAt `2026-06-09T12:00:00Z`, `2026-06-10T00:00:00Z`), run마다 issuedAt부터 48시간 |
| `observation.json` | `{demo, stationId: 'DSM', hourly: HourlyPoint[72]}`, `2026-06-09T00:00Z`~`2026-06-11T23:00Z`. `gustMph`가 몇 개 `null`(IEM `M` 모사) |
| `meta.json` | `{demo, story, expected}` |

## 단위와 시각

- 기온·이슬점 °F, 풍속·돌풍 mph, 풍향 도, 강수 inch, 면적 acre, 고도 m (`src/core/types.ts` 헤더와 동일)
- 시각은 모두 UTC ISO 8601, 끝이 `Z`. 6월 현지(CDT)는 UTC-5
- 결측은 `null`. `ecmwf_ifs025`의 gust는 `gust-block`에서 전부 `null`

## 시나리오 (모두 2026-06-10, UTC)

| scenario | 상황 | expected |
|---|---|---|
| `gust-block` | 12-16Z 바람 5-8 mph, 돌풍 10 이하. 17-23Z 바람 9-13, 돌풍 16-20. 예보도 같은 모양. 6/11 02Z에 0.05 in 약한 비(창 밖) | 13Z 시작 위반 없음, 16Z 시작 위반 |
| `calm-go` | 하루 종일 바람 4-9 mph, 돌풍 10 이하, 강수 0. 밤(00-11Z)에는 3 미만으로 떨어질 수 있음 | 15Z 시작 위반 없음 |
| `forecast-miss` | HRRR·NBM은 15-19Z 바람 6-8, 돌풍 8로 예보. 실측은 16-18Z 돌풍 16. GFS·IFS는 돌풍 11-13으로 조금 더 가까움 | 15Z 시작 관측 기준 위반, HRRR 예보 기준 위반 없음 |

`meta.json`의 `expected.windows[]`는 `{start, violation}` 목록이고, `windowHours: 3`(살포 창 길이)을 가정해 만들었습니다. 위반 기준은 돌풍 약 15 mph 초과로 설계했습니다.

강수는 `gust-block`의 6/11 02Z(0.05 in)를 빼면 모든 시나리오에서 0입니다.
