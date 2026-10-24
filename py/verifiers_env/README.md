# weather-decision-gym

Agricultural weather decisions scored by what the weather actually did.

Each task gives the agent only what was knowable at a fixed time `t0`: forecast runs issued before `t0` and station observations before `t0`. The answer is graded against observations recorded after `t0`, so the label cannot be in any pretraining corpus and no human labeler is involved.

> **DEMO DATA.** The bundled `data/sample.jsonl` is a mock scenario set (central Iowa, DSM station) built in the real Open-Meteo / IEM ASOS formats. Field locations, forecasts, and observations are synthetic.

## Task families

| Family | Agent output | Reward |
|---|---|---|
| Nowcasting (spray now vs. delay 3 h) | probability of a spray-window violation + decision | `-(regret / L) - 0.5 * Brier` |
| Frost decision (protect tonight?) | probability of frost (≤ 32°F) + decision | `-(regret / L) - 0.5 * Brier` |
| Downscaling (field minimum temperature) | quantiles 0.1 / 0.5 / 0.9 in °F | CRPS skill vs. the raw grid forecast, clipped to [-1, 1] |

Plus `0.1 * format` for a parseable answer. An unparseable answer gets the worst reward (-1.5 binary, -1 quantile).

Regret is the extra cost over an oracle that knew the outcome, using the task's cost `C` and loss `L` per acre (assumed values: frost C = $120, L = $1,200; spray delay $7, re-spray $31).

## Usage

```python
from weather_decision_gym import load_environment

env = load_environment()                                   # bundled sample (24 tasks)
env = load_environment(data_path="pack.jsonl")             # your own export
env = load_environment(families=["downscaling"], brier_weight=0.5)
```

`data_path` takes a JSONL file exported from the Weather Decision Gym app (`POST /api/export?format=jsonl`). Each line is one self-contained task: prompt, field, `t0` snapshot, and (for public feeds) the `label`. Held-out evaluation sets are exported without labels and are skipped here.

Targets the legacy verifiers API (`verifiers==0.3.1`, `vf.SingleTurnEnv`).

## Data sources

Forecast format: Open-Meteo Single Runs API (HRRR, NBM, ECMWF IFS, GFS) and NOAA CPC outlooks. Observation format: Iowa Environmental Mesonet ASOS (knots converted to mph ×1.151, missing values as null). Units: °F, mph, inch, acre, USD; times in UTC ISO 8601.
