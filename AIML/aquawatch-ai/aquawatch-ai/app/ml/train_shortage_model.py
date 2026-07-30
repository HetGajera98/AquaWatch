"""
Train the water-shortage risk model.

Input features (matches /predict-shortage contract):
    tank_level_pct, tank_level_trend_7d, avg_daily_consumption_l,
    consumption_trend_7d, rainfall_forecast_mm_7d, days_of_supply_left

Output: stress_score (0-100, continuous) -> mapped to severity (low/medium/high)

Model: GradientBoostingRegressor predicting the continuous stress_score.
Regression (not classification) is used because the score itself is shown
on the dashboard as a number, and severity buckets are then derived from it
with fixed, documented thresholds — keeping the low/medium/high cutoffs
transparent and tunable without retraining, per the roadmap's "tune
thresholds so the demo triggers cleanly" guidance.
"""
import os
import joblib
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score

HERE = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(HERE, "..", "..", "data", "shortage_dataset.csv")
ARTIFACT_PATH = os.path.join(HERE, "artifacts", "shortage_model.joblib")

FEATURES = [
    "tank_level_pct", "tank_level_trend_7d", "avg_daily_consumption_l",
    "consumption_trend_7d", "rainfall_forecast_mm_7d", "days_of_supply_left",
]
TARGET = "stress_score"

# Severity thresholds — kept as plain constants (not learned) so they can be
# tuned live during demo rehearsal without retraining the model.
# Tuned for the real data distribution (scores range 3–68, mean ~45):
#   low    < 35 : tank healthy, trend positive, good rainfall
#   medium 35–55: moderate stress, worth watching
#   high   >= 55: urgent — tank low, draining, poor outlook  ← demo trigger
SEVERITY_THRESHOLDS = {"low_max": 35, "medium_max": 55}


def score_to_severity(score: float) -> str:
    if score < SEVERITY_THRESHOLDS["low_max"]:
        return "low"
    elif score < SEVERITY_THRESHOLDS["medium_max"]:
        return "medium"
    return "high"


def train():
    df = pd.read_csv(DATA_PATH)
    X = df[FEATURES]
    y = df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = GradientBoostingRegressor(
        n_estimators=250,
        max_depth=3,
        learning_rate=0.05,
        subsample=0.9,
        random_state=42,
    )
    model.fit(X_train, y_train)

    preds = model.predict(X_test).clip(0, 100)

    print("=== Water-Shortage Model — Evaluation ===")
    print(f"MAE:  {mean_absolute_error(y_test, preds):.3f} (stress-score points)")
    print(f"R^2:  {r2_score(y_test, preds):.4f}")

    # Sanity-check severity agreement against the rule-derived labels in the dataset
    pred_severity = pd.Series(preds, index=y_test.index).apply(score_to_severity)
    true_severity = df.loc[y_test.index, "severity"]
    agreement = (pred_severity == true_severity).mean()
    print(f"Severity bucket agreement vs dataset labels: {agreement:.1%}")

    print("\nFeature importances:")
    for f, imp in sorted(zip(FEATURES, model.feature_importances_), key=lambda x: -x[1]):
        print(f"  {f:28s} {imp:.4f}")

    os.makedirs(os.path.dirname(ARTIFACT_PATH), exist_ok=True)
    joblib.dump(
        {"model": model, "features": FEATURES, "thresholds": SEVERITY_THRESHOLDS},
        ARTIFACT_PATH,
    )
    print(f"\nSaved model -> {ARTIFACT_PATH}")


if __name__ == "__main__":
    train()
