"""
Train the leak-detection model.

Input features (per flow window, matches /predict-leak contract):
    mean_flow_lpm, std_flow_lpm, max_flow_lpm, pct_time_flowing,
    expected_flow_lpm, deviation_from_expected, hour_of_day

Output: leak_probability (0-1), is_leak (bool)

Model: RandomForestClassifier — chosen over a black-box deep model because
it's fast to train on limited hackathon data, gives calibrated-ish
probabilities via predict_proba, and feature_importances_ can be shown to
judges as "here's what the model is keying off" (keeps it explainable per
the roadmap's philosophy even though it's a real trained model).
"""
import os
import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score

HERE = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(HERE, "..", "..", "data", "leak_dataset.csv")
ARTIFACT_PATH = os.path.join(HERE, "artifacts", "leak_model.joblib")

FEATURES = [
    "mean_flow_lpm", "std_flow_lpm", "max_flow_lpm",
    "pct_time_flowing", "expected_flow_lpm",
    "deviation_from_expected", "hour_of_day",
]
TARGET = "is_leak"


def train():
    df = pd.read_csv(DATA_PATH)
    X = df[FEATURES]
    y = df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=8,
        min_samples_leaf=5,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    proba = model.predict_proba(X_test)[:, 1]

    print("=== Leak Detection Model — Evaluation ===")
    print(classification_report(y_test, preds, target_names=["no_leak", "leak"]))
    print(f"ROC AUC: {roc_auc_score(y_test, proba):.4f}")
    print("\nFeature importances:")
    for f, imp in sorted(zip(FEATURES, model.feature_importances_), key=lambda x: -x[1]):
        print(f"  {f:28s} {imp:.4f}")

    os.makedirs(os.path.dirname(ARTIFACT_PATH), exist_ok=True)
    joblib.dump({"model": model, "features": FEATURES}, ARTIFACT_PATH)
    print(f"\nSaved model -> {ARTIFACT_PATH}")


if __name__ == "__main__":
    train()
