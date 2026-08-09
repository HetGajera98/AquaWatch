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
    Heuristic scoring mirroring the same signature used to label training
    data: high, steady, sustained flow well above what's expected for the
    time of day = leak-like.
    """
    deviation = req.mean_flow_lpm - req.expected_flow_lpm
    steadiness = 1.0 - min(req.std_flow_lpm / max(req.mean_flow_lpm, 0.1), 1.0)

    score = 0.0
    score += np.clip(deviation / 8.0, 0, 1) * 0.5       # abnormally high vs schedule
    score += req.pct_time_flowing * 0.3                  # continuous flow
    score += steadiness * 0.2                             # leaks are steady, usage is bursty
    return float(np.clip(score, 0, 1))


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
