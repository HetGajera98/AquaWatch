"""
Leak detection service.

Uses the trained RandomForestClassifier if the artifact is present; falls
back to the rule-based signature described in the roadmap — "continuous or
abnormally high flow with no matching scheduled demand" — if the model
file is missing.
"""
import os
import joblib
import numpy as np
import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
ARTIFACT_PATH = os.path.join(HERE, "..", "ml", "artifacts", "leak_model.joblib")

MODEL_VERSION_ML = "leak-rf-v1"
MODEL_VERSION_RULE = "leak-rule-fallback-v1"

LEAK_PROB_THRESHOLD = 0.5

_artifact = None
if os.path.exists(ARTIFACT_PATH):
    _artifact = joblib.load(ARTIFACT_PATH)


def _rule_based_probability(req) -> float:
    """
    Heuristic scoring: a LEAK is signalled by unexpected, continuous, steady
    flow that exceeds the scheduled baseline for this hour.

    Key insight: low tank_level_pct alone is a SHORTAGE signal, not a leak
    signal. 28% tank + normal flow = low leak risk, high shortage risk.

    Formula:
      - Deviation above expected flow    → primary driver  (weight 0.55)
      - Extreme absolute flow (>10 L/min)→ secondary signal (weight 0.25)
      - Pct-time-flowing above 90%       → corroborating   (weight 0.20)
      - Low tank level acts as mild negative modifier (saves from false positive)
    """
    deviation = req.mean_flow_lpm - req.expected_flow_lpm

    # Main signal: how far above the expected baseline are we?
    deviation_score = float(np.clip(deviation / 8.0, 0.0, 1.0))

    # Absolute flow is suspiciously high regardless of expected
    extreme_score = float(np.clip((req.mean_flow_lpm - 10.0) / 10.0, 0.0, 1.0))

    # Continuous 24/7 flow (>90% of the window) is suspicious
    continuous_score = float(np.clip((req.pct_time_flowing - 0.90) / 0.10, 0.0, 1.0))

    score = 0.55 * deviation_score + 0.25 * extreme_score + 0.20 * continuous_score

    # Low tank_level_pct alone means shortage, not leak — apply mild penalty
    # to avoid false-positive leak when the tank is simply draining normally
    tank_level_pct = getattr(req, 'tank_level_pct', 50.0)
    if tank_level_pct < 40 and deviation <= 1.0:
        # Tank is low but flow isn't anomalous — dampen the score
        score *= 0.40

    return float(np.clip(score, 0.02, 0.98))


def _reason(req, is_leak: bool) -> str:
    if not is_leak:
        return "flow pattern consistent with expected usage"
    deviation = req.mean_flow_lpm - req.expected_flow_lpm
    parts = []
    if req.pct_time_flowing > 0.8:
        parts.append("continuous flow")
    if deviation > 2:
        parts.append(f"{deviation:.1f} L/min above expected for this hour")
    if req.std_flow_lpm < 0.6:
        parts.append("unusually steady (not typical intermittent usage)")
    return "; ".join(parts) if parts else "flow deviates from expected pattern"


def predict_leak(req) -> dict:
    if _artifact is not None:
        model = _artifact["model"]
        features = _artifact["features"]
        row = {
            "mean_flow_lpm": req.mean_flow_lpm,
            "std_flow_lpm": req.std_flow_lpm,
            "max_flow_lpm": req.max_flow_lpm,
            "pct_time_flowing": req.pct_time_flowing,
            "expected_flow_lpm": req.expected_flow_lpm,
            "deviation_from_expected": req.mean_flow_lpm - req.expected_flow_lpm,
            "hour_of_day": req.hour_of_day,
        }
        X = pd.DataFrame([[row[f] for f in features]], columns=features)
        probability = float(model.predict_proba(X)[0][1])
        version = MODEL_VERSION_ML
    else:
        probability = _rule_based_probability(req)
        version = MODEL_VERSION_RULE

    is_leak = probability >= LEAK_PROB_THRESHOLD

    return {
        "sensor_id": req.sensor_id,
        "leak_probability": round(probability, 4),
        "is_leak": is_leak,
        "reason": _reason(req, is_leak),
        "model_version": version,
    }
