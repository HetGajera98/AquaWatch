"""
Water-shortage prediction service.

Uses the trained GradientBoostingRegressor if the artifact is present;
falls back to the transparent rule-based weighted score (identical formula
used to label the training data) if the model file is missing — so the
service degrades gracefully instead of crashing, matching the platform's
"safety-first fallback" philosophy end to end.
"""
import os
import joblib
import numpy as np
import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
ARTIFACT_PATH = os.path.join(HERE, "..", "ml", "artifacts", "shortage_model.joblib")

MODEL_VERSION_ML = "shortage-gbr-v1"
MODEL_VERSION_RULE = "shortage-rule-fallback-v1"

_artifact = None
if os.path.exists(ARTIFACT_PATH):
    _artifact = joblib.load(ARTIFACT_PATH)


def _rule_based_score(
    tank_level_pct, tank_level_trend_7d, consumption_trend_7d, rainfall_forecast_mm_7d
) -> float:
    """Same weighted formula used to generate training labels (data/generate_datasets.py)."""
    score = (
        0.45 * (100 - tank_level_pct)
        + 0.25 * np.clip(-tank_level_trend_7d * 10, 0, 40)
        + 0.15 * np.clip(consumption_trend_7d * 0.4, 0, 25)
        + 0.15 * np.clip((30 - rainfall_forecast_mm_7d) * 0.8, 0, 25)
    )
    return float(np.clip(score, 0, 100))


def _severity(score: float, thresholds=None) -> str:
    thresholds = thresholds or {"low_max": 35, "medium_max": 55}
    if score < thresholds["low_max"]:
        return "low"
    elif score < thresholds["medium_max"]:
        return "medium"
    return "high"


def _explain(req) -> list[str]:
    factors = []
    if req.tank_level_pct < 35:
        factors.append(f"tank level low ({req.tank_level_pct:.1f}%)")
    if req.tank_level_trend_7d < -1:
        factors.append(f"tank draining ({req.tank_level_trend_7d:.1f}%/day)")
    if req.consumption_trend_7d > 15:
        factors.append(f"consumption rising ({req.consumption_trend_7d:.1f}% vs last week)")
    if req.rainfall_forecast_mm_7d < 10:
        factors.append(f"low rainfall forecast ({req.rainfall_forecast_mm_7d:.1f}mm/7d)")
    if not factors:
        factors.append("all inputs within normal range")
    return factors


def predict_shortage(req) -> dict:
    days_of_supply = req.days_of_supply_left
    if days_of_supply is None:
        # Rough same-day estimate if backend didn't precompute it
        drain_rate = max(-req.tank_level_trend_7d, 0.01)
        days_of_supply = float(np.clip(req.tank_level_pct / drain_rate, 0, 99))

    if _artifact is not None:
        model = _artifact["model"]
        features = _artifact["features"]
        thresholds = _artifact.get("thresholds", {"low_max": 40, "medium_max": 70})
        row = {
            "tank_level_pct": req.tank_level_pct,
            "tank_level_trend_7d": req.tank_level_trend_7d,
            "avg_daily_consumption_l": req.avg_daily_consumption_l,
            "consumption_trend_7d": req.consumption_trend_7d,
            "rainfall_forecast_mm_7d": req.rainfall_forecast_mm_7d,
            "days_of_supply_left": days_of_supply,
        }
        X = pd.DataFrame([[row[f] for f in features]], columns=features)
        score = float(np.clip(model.predict(X)[0], 0, 100))
        version = MODEL_VERSION_ML
    else:
        score = _rule_based_score(
            req.tank_level_pct,
            req.tank_level_trend_7d,
            req.consumption_trend_7d,
            req.rainfall_forecast_mm_7d,
        )
        thresholds = {"low_max": 35, "medium_max": 55}
        version = MODEL_VERSION_RULE

    return {
        "zone_id": req.zone_id,
        "stress_score": round(score, 2),
        "severity": _severity(score, thresholds),
        "top_factors": _explain(req),
        "model_version": version,
    }
