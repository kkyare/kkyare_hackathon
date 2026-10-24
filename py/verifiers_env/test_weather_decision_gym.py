import json
import unittest

import weather_decision_gym as g

INFO = {"task_id": "t", "family": "nowcasting", "outcome": 1, "cost": 7.0, "loss": 31.0, "protective": "delay", "risky": "spray"}


def reply(obj) -> list[dict]:
    text = obj if isinstance(obj, str) else json.dumps(obj)
    return [{"role": "assistant", "content": f"판단 결과입니다.\n{text}"}]


class Rewards(unittest.TestCase):
    def test_oracle_decision_has_zero_regret(self):
        self.assertEqual(g.regret_usd("delay", INFO), 0.0)
        self.assertEqual(g.regret_usd("spray", {**INFO, "outcome": 0}), 0.0)
        self.assertEqual(g.regret_usd("spray", INFO), 24.0)  # L - C
        self.assertEqual(g.regret_usd("delay", {**INFO, "outcome": 0}), 7.0)  # C

    def test_rewards(self):
        good = reply({"probability": 0.9, "decision": "delay", "rationale": "돌풍"})
        self.assertAlmostEqual(g.decision_reward(good, INFO), 1.0)
        self.assertAlmostEqual(g.brier_reward(good, INFO), 1 - 0.01)
        bad = reply({"probability": 0.1, "decision": "spray", "rationale": ""})
        self.assertAlmostEqual(g.decision_reward(bad, INFO), 1 - 24 / 31)
        self.assertAlmostEqual(g.brier_reward(bad, INFO), 1 - 0.81)

    def test_bad_format_scores_zero(self):
        for c in [reply("모르겠다"), reply({"probability": 1.5, "decision": "delay"}), reply({"probability": 0.5, "decision": "protect"}), [], "plain"]:
            self.assertEqual(g.format_reward(c, INFO), 0.0)
            self.assertEqual(g.decision_reward(c, INFO), 0.0)
        self.assertEqual(g.format_reward('{"probability": 0.2, "decision": "spray"}', INFO), 1.0)


class Data(unittest.TestCase):
    def test_sample_rows(self):
        rows = g.load_rows()
        self.assertEqual(len(rows), 12)
        self.assertEqual({r["info"]["outcome"] for r in rows}, {0, 1})
        q = rows[0]["question"]
        self.assertIn("기준 시각 t0", q)
        self.assertIn("[예보]", q)
        self.assertIn('"decision": "delay" | "spray"', q)

    def test_question_has_no_data_after_t0_in_observations(self):
        task = json.loads(g.DEFAULT_DATA.read_text(encoding="utf-8").splitlines()[0])
        q = g.build_question(task)
        obs_part = q.split("[관측]")[1]
        times = [line.split(" | ")[0] for line in obs_part.splitlines() if line.startswith("20")]
        self.assertTrue(times)
        self.assertTrue(all(g._ms(t) <= g._ms(task["t0"]) for t in times))

    def test_holdout_rows_are_skipped(self):
        import tempfile
        from pathlib import Path

        lines = g.DEFAULT_DATA.read_text(encoding="utf-8").splitlines()
        stripped = [json.dumps({k: v for k, v in json.loads(l).items() if k not in ("label", "resolution")}) for l in lines]
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "holdout.jsonl"
            p.write_text("\n".join(stripped), encoding="utf-8")
            self.assertEqual(g.load_rows(p), [])


class Environment(unittest.TestCase):
    def test_load_environment(self):
        env = g.load_environment()
        self.assertEqual(len(env.dataset), 12)
        # SingleTurnEnv는 rubric을 RubricGroup으로 감싸고 턴 수 모니터를 붙인다
        ours = env.rubric.rubrics[0]
        self.assertEqual(ours._get_reward_func_names(), ["decision_reward", "brier_reward", "format_reward"])
        self.assertEqual(ours.weights, [1.0, 0.5, 0.1])


if __name__ == "__main__":
    unittest.main()
