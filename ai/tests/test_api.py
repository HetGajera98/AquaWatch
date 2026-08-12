from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_predict_shortage_low_risk():
    payload = {
        "zone_id": "zone_test",
        "tank_level_pct": 85.0,
        "tank_level_trend_7d": 0.5,
        "avg_daily_consumption_l": 1000.0,
        "consumption_trend_7d": -2.0,
        "rainfall_forecast_mm_7d": 40.0,
    }
    r = client.post("/predict-shortage", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert body["zone_id"] == "zone_test"
    assert body["severity"] == "low"
    assert 0 <= body["stress_score"] <= 100


def test_predict_shortage_high_risk():
    payload = {
        "zone_id": "zone_test2",
        "tank_level_pct": 12.0,
        "tank_level_trend_7d": -5.0,
        "avg_daily_consumption_l": 3000.0,
        "consumption_trend_7d": 30.0,
        "rainfall_forecast_mm_7d": 0.0,
    }
    r = client.post("/predict-shortage", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert body["severity"] in ("medium", "high")


def test_predict_leak_flags_continuous_high_flow():
    payload = {
        "sensor_id": "sensor_test",
        "mean_flow_lpm": 9.5,
        "std_flow_lpm": 0.2,
        "max_flow_lpm": 10.1,
        "pct_time_flowing": 0.98,
        "expected_flow_lpm": 0.5,
        "hour_of_day": 3,
    }
    r = client.post("/predict-leak", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert body["is_leak"] is True
    assert body["leak_probability"] > 0.5


def test_predict_leak_normal_usage_not_flagged():
    payload = {
        "sensor_id": "sensor_test2",
        "mean_flow_lpm": 3.0,
        "std_flow_lpm": 1.2,
        "max_flow_lpm": 5.0,
        "pct_time_flowing": 0.3,
        "expected_flow_lpm": 3.2,
        "hour_of_day": 8,
    }
    r = client.post("/predict-leak", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert body["is_leak"] is False


def test_pump_control_turns_on_when_low():
    payload = {
        "pump_id": "pump_test",
        "tank_level_pct": 15.0,
        "float_switch_full": False,
        "shortage_severity": "high",
        "leak_detected": False,
    }
    r = client.post("/predict-pump-control", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert body["action"] == "on"
    assert body["reason"] == "tank_low_urgent_shortage"


def test_pump_control_stays_off_when_leak_detected():
    payload = {
        "pump_id": "pump_test2",
        "tank_level_pct": 10.0,
        "float_switch_full": False,
        "shortage_severity": "high",
        "leak_detected": True,
    }
    r = client.post("/predict-pump-control", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert body["action"] == "off"
    assert body["reason"] == "leak_detected"


def test_pump_control_stays_off_when_tank_full():
    payload = {
        "pump_id": "pump_test3",
        "tank_level_pct": 98.0,
        "float_switch_full": True,
        "shortage_severity": "low",
        "leak_detected": False,
    }
    r = client.post("/predict-pump-control", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert body["action"] == "off"
    assert body["reason"] == "tank_full"
