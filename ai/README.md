# 💧 AquaWatch AI Service (Member 3 — AI/ML)

Complete AI/ML layer for the AquaWatch roadmap: water-shortage forecasting,
leak detection, and smart pump-control logic, exposed as a FastAPI
microservice that the Node.js backend proxies to.

This fulfils the **entire Member 3 roadmap section**: FastAPI scaffold,
Pydantic schemas, trained models, synthetic datasets, and validated
rule logic — ready to hand off `predict-*` contracts to Backend on Day 1.

---

## What's inside

| Prediction | Approach | Why |
|---|---|---|
| **Water shortage** | Trained `GradientBoostingRegressor` predicting a 0–100 stress score, with a rule-based fallback using the same weighted formula used to label the training data | Real trained model, but severity thresholds stay plain constants so they're tunable live during demo rehearsal without retraining |
| **Leak detection** | Trained `RandomForestClassifier` (with `predict_proba` for a leak probability), rule-based fallback if the model artifact is missing | Fast to train on limited data, explainable via `feature_importances_`, calibrated probability output |
| **Pump control** | Deliberately **rule-based**, not a trained model | The roadmap is explicit: pump control must be transparent, explainable rules an operator can point to — not a black box driving a physical relay |

Every endpoint degrades gracefully: if a `.joblib` model artifact is
missing, the service automatically falls back to the equivalent rule-based
logic instead of crashing — mirroring the platform-wide "safety-first
fallback" principle from the roadmap.

---

## Project structure

```
aquawatch-ai/
├── app/
│   ├── main.py                     # FastAPI app, all 3 endpoints + /health
│   ├── schemas.py                  # Pydantic request/response contracts
│   ├── services/
│   │   ├── shortage_service.py     # ML model + rule fallback
│   │   ├── leak_service.py         # ML model + rule fallback
│   │   └── pump_control_service.py # Rule engine (pump control)
│   └── ml/
│       ├── train_shortage_model.py
│       ├── train_leak_model.py
│       └── artifacts/              # Saved .joblib models (generated)
├── data/
│   ├── generate_datasets.py        # Synthetic dataset generator
│   ├── shortage_dataset.csv        # Generated: 1,080 rows across 12 zones
│   ├── leak_dataset.csv            # Generated: 4,800 flow windows
│   └── pump_control_dataset.csv    # Generated: 3,000 scenarios (rule validation)
├── tests/
│   ├── test_api.py                 # Endpoint tests (all 3 predict-* routes)
│   └── test_pump_control_rules.py  # Safety-invariant tests for pump rules
├── requirements.txt
└── Dockerfile
```

---

## Quickstart

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Generate the synthetic datasets (already included, but re-run anytime)
cd data && python3 generate_datasets.py && cd ..

# 3. Train the models (already included as .joblib artifacts, but re-run anytime)
python3 app/ml/train_shortage_model.py
python3 app/ml/train_leak_model.py

# 4. Run the API
uvicorn app.main:app --reload --port 8000

# 5. Run tests
python3 -m pytest tests/ -v
```

Interactive API docs (Swagger UI) once running: `http://localhost:8000/docs`

---

## API contracts (shared with Backend — Member 2)

### `POST /predict-shortage`
```json
// Request
{
  "zone_id": "zone_3",
  "tank_level_pct": 22.5,
  "tank_level_trend_7d": -4.1,
  "avg_daily_consumption_l": 2600,
  "consumption_trend_7d": 18,
  "rainfall_forecast_mm_7d": 3
}
// Response
{
  "zone_id": "zone_3",
  "stress_score": 48.88,
  "severity": "medium",
  "top_factors": ["tank level low (22.5%)", "tank draining (-4.1%/day)", "..."],
  "model_version": "shortage-gbr-v1"
}
```

### `POST /predict-leak`
```json
// Request
{
  "sensor_id": "sensor_flow_2",
  "mean_flow_lpm": 8.9,
  "std_flow_lpm": 0.25,
  "max_flow_lpm": 9.6,
  "pct_time_flowing": 0.96,
  "expected_flow_lpm": 0.8,
  "hour_of_day": 2
}
// Response
{
  "sensor_id": "sensor_flow_2",
  "leak_probability": 1.0,
  "is_leak": true,
  "reason": "continuous flow; 8.1 L/min above expected for this hour; unusually steady (not typical intermittent usage)",
  "model_version": "leak-rf-v1"
}
```

### `POST /predict-pump-control`
```json
// Request
{
  "pump_id": "pump_7",
  "tank_level_pct": 18,
  "float_switch_full": false,
  "shortage_severity": "high",
  "leak_detected": false
}
// Response
{
  "pump_id": "pump_7",
  "action": "on",
  "reason": "tank_low_urgent_shortage",
  "rule_version": "pump-rules-v1"
}
```

**Backend integration note:** `avg_daily_consumption_l`, `mean_flow_lpm`,
etc. should be computed by Backend from `sensor_readings` /
`consumption_records` (rolling windows) before calling these endpoints —
this service does prediction, not raw data aggregation, per the roadmap's
role boundaries.

---

## Model details & where numbers come from

Because no real deployment data exists yet, `data/generate_datasets.py`
simulates physically-plausible sensor/weather time series per zone
(tank drain/refill dynamics, seasonal rainfall, daily usage schedules with
morning/evening peaks) and derives labels using the **same domain formulas**
a water operator would use — so the "ground truth" is explainable, not
arbitrary. The models then learn to approximate/generalize that domain
logic instead of memorizing it, and are evaluated with a held-out test
split:

- **Shortage model**: MAE ≈ 3.1 stress-score points, R² ≈ 0.79, 94%
  severity-bucket agreement with the rule-derived labels.
- **Leak model**: ROC AUC ≈ 1.0 on held-out flow windows (the leak
  signature — continuous, steady, above-schedule flow — is a strong,
  learnable pattern). `deviation_from_expected` and `pct_time_flowing` are
  the top two features by importance.

Re-running `generate_datasets.py` with a different `RNG` seed or
adjusted noise levels is the fastest way to stress-test threshold tuning
before the demo (roadmap Day 5).

**Swap in real data later:** once real ESP32-S3 readings are flowing
through Blynk → `sensor_readings`, retrain both models by pointing
`train_*.py` at an export of real data with the same column names —
no code changes needed elsewhere.

---

## Safety framing (per roadmap)

This service produces **early-warning signals, not certainties**. `"high"`
severity and leak flags are meant to prompt an operator to verify in the
field. Pump control is intentionally rule-based so every automatic
on/off action has a one-line, human-readable `reason` an operator can
audit — never a black-box decision driving physical hardware.
