import json
import tempfile
import unittest
from pathlib import Path

import weather_decision_gym as g

BINARY = {"task_id": "t", "family": "nowcasting", "kind": "binary", "outcome": 1, "cost": 7.0, "loss": 31.0, "protective": "delay", "risky": "spray"}
QUANT = {"task_id": "d", "family": "downscaling", "kind": "quantile", "value": 30.0, "reference": 34.0}
reward = g.make_weather_reward(0.5)


def reply(obj) -> list[dict]:
    text = obj if isinstance(obj, str) else json.dumps(obj)
    return [{"role": "assistant", "content": f"판단 결과입니다.\n{text}"}]


def quantiles(*values: float) -> list[dict]:
    return reply({"quantiles": [{"q": q, "value": v} for q, v in zip(g.QUANTILES, values)], "rationale": "r"})


class BinaryRewards(unittest.TestCase):
    def test_oracle_decision_has_zero_regret(self):
        self.assertEqual(g.regret_usd("delay", BINARY), 0.0)
        self.assertEqual(g.regret_usd("spray", {**BINARY, "outcome": 0}), 0.0)
        self.assertEqual(g.regret_usd("spray", BINARY), 24.0)  # L - C
        self.assertEqual(g.regret_usd("delay", {**BINARY, "outcome": 0}), 7.0)  # C

    def test_reward_matches_scoring_ts(self):
        # src/core/scoring.ts reward(regretUsd, loss, brier, 0.5) = -(regret / L) - 0.5·Brier
        good = reply({"probability": 0.9, "decision": "delay", "rationale": "돌풍"})
        self.assertAlmostEqual(reward(good, BINARY), -0.0 - 0.5 * 0.01)
        bad = reply({"probability": 0.1, "decision": "spray", "rationale": ""})
        self.assertAlmostEqual(reward(bad, BINARY), -(24 / 31) - 0.5 * 0.81)
        perfect = reply({"probability": 1, "decision": "delay"})
        self.assertAlmostEqual(reward(perfect, BINARY), 0.0)

    def test_bad_format_gets_worst_reward(self):
        # 이진 보상은 0이 최고라, 형식 위반은 어떤 정상 답보다 낮아야 한다
        worst_valid = reward(reply({"probability": 0, "decision": "spray"}), BINARY)
        for c in [reply("모르겠다"), reply({"probability": 1.5, "decision": "delay"}), reply({"probability": 0.5, "decision": "protect"}), [], "plain"]:
            self.assertEqual(g.format_reward(c, BINARY), 0.0)
            self.assertEqual(reward(c, BINARY), -1.5)
            self.assertLess(reward(c, BINARY), worst_valid)
        self.assertEqual(g.format_reward('{"probability": 0.2, "decision": "spray"}', BINARY), 1.0)


class QuantileRewards(unittest.TestCase):
    def test_crps_matches_scoring_ts(self):
        # src/core/scoring.ts crpsFromQuantiles와 같은 식: 단일 중앙값이면 절대 오차
        self.assertAlmostEqual(g.crps_from_quantiles([{"q": 0.5, "value": 33.0}], 30.0), 3.0)
        qs = [{"q": 0.1, "value": 28.0}, {"q": 0.5, "value": 31.0}, {"q": 0.9, "value": 34.0}]
        expected = 2 * ((0.1 * 2) + (-0.5 * -1) + (-0.1 * -4)) / 3
        self.assertAlmostEqual(g.crps_from_quantiles(qs, 30.0), expected)

    def test_skill(self):
        self.assertAlmostEqual(reward(quantiles(30, 30, 30), QUANT), 1.0)  # 실측 그대로
        self.assertAlmostEqual(reward(quantiles(34, 34, 34), QUANT), 0.0)  # 원천 예보 그대로
        self.assertGreater(reward(quantiles(28, 30.5, 33), QUANT), 0.0)  # 보정한 분포는 원천 예보보다 낫다
        self.assertEqual(reward(quantiles(50, 50, 50), QUANT), -1.0)  # 아주 나쁘면 -1로 자름

    def test_bad_format(self):
        for c in [reply({"quantiles": []}), reply({"quantiles": [{"q": 2, "value": 30}]}), reply({"probability": 0.3, "decision": "none"})]:
            self.assertEqual(g.format_reward(c, QUANT), 0.0)
            self.assertEqual(reward(c, QUANT), -1.0)


class Data(unittest.TestCase):
    def test_sample_rows(self):
        rows = g.load_rows()
        kinds = {}
        for r in rows:
            kinds.setdefault(r["info"]["family"], set()).add(r["info"]["kind"])
        self.assertEqual(kinds, {"nowcasting": {"binary"}, "decision": {"binary"}, "downscaling": {"quantile"}})
        self.assertEqual(len(rows), 24)
        self.assertEqual({r["info"]["outcome"] for r in rows if r["info"]["kind"] == "binary"}, {0, 1})

        q = next(r["question"] for r in rows if r["info"]["family"] == "nowcasting")
        self.assertIn("기준 시각 t0", q)
        self.assertIn('"decision": "delay" | "spray"', q)
        ds = next(r["question"] for r in rows if r["info"]["family"] == "downscaling")
        self.assertIn('"quantiles"', ds)
        self.assertIn("격자 고도", ds)

    def test_family_filter(self):
        self.assertEqual({r["info"]["family"] for r in g.load_rows(families=["downscaling"])}, {"downscaling"})

    def test_question_has_no_observations_after_t0(self):
        for line in g.DEFAULT_DATA.read_text(encoding="utf-8").splitlines():
            task = json.loads(line)
            obs_part = g.build_question(task).split("[관측]")[1]
            times = [l.split(" | ")[0] for l in obs_part.splitlines() if l.startswith("20")]
            self.assertTrue(all(g._ms(t) <= g._ms(task["t0"]) for t in times))

    def test_holdout_rows_are_skipped(self):
        lines = g.DEFAULT_DATA.read_text(encoding="utf-8").splitlines()
        stripped = [json.dumps({k: v for k, v in json.loads(l).items() if k not in ("label", "resolution")}) for l in lines]
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "holdout.jsonl"
            p.write_text("\n".join(stripped), encoding="utf-8")
            self.assertEqual(g.load_rows(p), [])


class Environment(unittest.TestCase):
    def test_load_environment(self):
        env = g.load_environment()
        self.assertEqual(len(env.dataset), 24)
        # SingleTurnEnv는 rubric을 RubricGroup으로 감싸고 턴 수 모니터를 붙인다
        ours = env.rubric.rubrics[0]
        self.assertEqual(ours._get_reward_func_names(), ["weather_reward", "format_reward"])
        self.assertEqual(ours.weights, [1.0, 0.1])
        # 이진·분위수 행이 한 데이터셋에 섞여도 info가 그대로 남는다
        infos = env.dataset["info"]
        self.assertEqual({i["kind"] for i in infos}, {"binary", "quantile"})


if __name__ == "__main__":
    unittest.main()
