"""
Sanity-checks the pump-control rule engine against the wide scenario dataset
(data/pump_control_dataset.csv) rather than a held-out test set — since it's
rules, not a trained model, "correctness" means the rules never violate the
two physical safety invariants below across thousands of scenarios.
"""
import os
import pandas as pd
from types import SimpleNamespace
from app.services.pump_control_service import decide_pump_action

HERE = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(HERE, "..", "data", "pump_control_dataset.csv")


def test_rules_never_turn_on_pump_when_full_or_leaking():
    df = pd.read_csv(DATA_PATH)
    violations = []

    for i, row in df.iterrows():
        req = SimpleNamespace(
            pump_id=f"pump_{i}",
            tank_level_pct=row["tank_level_pct"],
            float_switch_full=bool(row["float_switch_full"]),
            shortage_severity=row["shortage_severity"],
            leak_detected=bool(row["leak_detected"]),
        )
        result = decide_pump_action(req)

        # Safety invariant 1: never pump while a leak is flagged
        if req.leak_detected and result["action"] == "on":
            violations.append((i, "pumped during leak"))

        # Safety invariant 2: never pump when float switch says full
        if req.float_switch_full and result["action"] == "on":
            violations.append((i, "pumped while tank full"))

    assert not violations, f"Safety rule violations found: {violations[:5]}"


def test_rules_turn_on_for_low_tank_no_leak_not_full():
    df = pd.read_csv(DATA_PATH)
    low_safe = df[
        (df["tank_level_pct"] < 30)
        & (~df["leak_detected"])
        & (~df["float_switch_full"])
    ]
    assert len(low_safe) > 0, "dataset should contain this scenario"

    for i, row in low_safe.iterrows():
        req = SimpleNamespace(
            pump_id=f"pump_{i}",
            tank_level_pct=row["tank_level_pct"],
            float_switch_full=bool(row["float_switch_full"]),
            shortage_severity=row["shortage_severity"],
            leak_detected=bool(row["leak_detected"]),
        )
        result = decide_pump_action(req)
        assert result["action"] == "on", f"expected pump ON for row {i}: {row.to_dict()}"
