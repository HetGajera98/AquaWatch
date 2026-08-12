"""
AquaWatch — Synthetic Dataset Generator
=========================================
Generates three labeled datasets that mirror the real sensor/weather signals
described in the AquaWatch roadmap (tank level, flow rate, float switch,
rainfall, consumption). No real deployment data exists yet during the
hackathon, so we simulate physically-plausible time series and derive labels
from the same domain logic a water-utility operator would use, then add
noise so the models have something non-trivial to learn.

Run:
    python3 generate_datasets.py

Outputs (into this data/ folder):
    shortage_dataset.csv        -> for the water-shortage risk model
    leak_dataset.csv            -> for the leak-detection model
    pump_control_dataset.csv    -> for validating the pump-control rules
"""

import numpy as np
import pandas as pd

RNG = np.random.default_rng(42)
N_ZONES = 12
DAYS_PER_ZONE = 90          # 90 days of daily aggregates per zone for shortage
FLOW_WINDOWS_PER_ZONE = 400  # 10-minute flow windows for leak detection
PUMP_SAMPLES = 3000


# ---------------------------------------------------------------------------
# 1. WATER-SHORTAGE DATASET
#    Features an operator/model would see once a day per zone:
#      - tank_level_pct            : current tank level (%)
#      - tank_level_trend_7d       : slope of tank level over last 7 days (%/day)
#      - avg_daily_consumption_l   : rolling 7-day average consumption (liters)
#      - consumption_trend_7d      : % change in consumption vs prior week
#      - rainfall_forecast_mm_7d   : total rainfall forecast for next 7 days (mm)
#      - days_of_supply_left       : tank_level / (consumption - inflow) estimate
#    Label:
#      - stress_score  (0-100, continuous)
#      - severity       (low / medium / high) derived from stress_score
# ---------------------------------------------------------------------------
def generate_shortage_dataset():
    rows = []
    for zone in range(N_ZONES):
        # Each zone has its own baseline behavior
        base_capacity = RNG.uniform(5000, 40000)      # liters
        base_consumption = RNG.uniform(500, 3000)     # liters/day
        seasonal_phase = RNG.uniform(0, 2 * np.pi)

        tank_level = RNG.uniform(40, 95)  # start somewhere reasonable

        for day in range(DAYS_PER_ZONE):
            # Seasonal rainfall pattern + noise (mm over 7 days)
            rainfall_forecast = max(
                0,
                20 + 18 * np.sin(2 * np.pi * day / 90 + seasonal_phase) + RNG.normal(0, 8),
            )

            # Consumption drifts with mild noise + occasional spikes (e.g. festival, heatwave)
            consumption = base_consumption * (1 + RNG.normal(0, 0.08))
            if RNG.random() < 0.05:
                consumption *= RNG.uniform(1.3, 1.8)  # demand spike

            # Inflow roughly proportional to rainfall, plus a fixed supply trickle
            inflow = (rainfall_forecast / 7) * RNG.uniform(15, 40) + RNG.uniform(50, 150)

            net_change_pct = ((inflow - consumption) / base_capacity) * 100
            tank_level = np.clip(tank_level + net_change_pct + RNG.normal(0, 1.0), 0, 100)

            rows.append(
                dict(
                    zone_id=f"zone_{zone}",
                    day=day,
                    tank_level_pct=round(tank_level, 2),
                    base_capacity_liters=round(base_capacity, 1),
                    avg_daily_consumption_l=round(consumption, 1),
                    rainfall_forecast_mm_7d=round(rainfall_forecast, 2),
                )
            )

    df = pd.DataFrame(rows)

    # Derive rolling trend features per zone
    df = df.sort_values(["zone_id", "day"]).reset_index(drop=True)
    df["tank_level_trend_7d"] = (
        df.groupby("zone_id")["tank_level_pct"]
        .transform(lambda s: s.diff(7) / 7)
        .fillna(0)
    )
    df["consumption_trend_7d"] = (
        df.groupby("zone_id")["avg_daily_consumption_l"]
        .transform(lambda s: (s - s.shift(7)) / s.shift(7) * 100)
        .fillna(0)
    )
    df["net_daily_change_l"] = (
        df["base_capacity_liters"] * df["tank_level_trend_7d"] / 100
    )
    df["days_of_supply_left"] = np.where(
        df["net_daily_change_l"] < 0,
        (df["tank_level_pct"] / 100 * df["base_capacity_liters"])
        / np.abs(df["net_daily_change_l"]).clip(lower=1),
        99,  # effectively "not depleting"
    ).clip(0, 99)

    # ---- Label: stress_score (0-100, higher = worse) ----
    # Domain-driven weighted formula (mirrors the roadmap's "explainable weighted
    # score" baseline) + noise, so a learned model can approximate/generalize it.
    stress = (
        0.45 * (100 - df["tank_level_pct"])
        + 0.25 * np.clip(-df["tank_level_trend_7d"] * 10, 0, 40)
        + 0.15 * np.clip(df["consumption_trend_7d"] * 0.4, 0, 25)
        + 0.15 * np.clip((30 - df["rainfall_forecast_mm_7d"]) * 0.8, 0, 25)
    )
    stress = stress + RNG.normal(0, 4, size=len(df))
    df["stress_score"] = stress.clip(0, 100).round(2)

    def severity(s):
        if s < 40:
            return "low"
        elif s < 70:
            return "medium"
        return "high"

    df["severity"] = df["stress_score"].apply(severity)

    cols = [
        "zone_id", "day", "tank_level_pct", "tank_level_trend_7d",
        "avg_daily_consumption_l", "consumption_trend_7d",
        "rainfall_forecast_mm_7d", "days_of_supply_left",
        "stress_score", "severity",
    ]
    return df[cols]


# ---------------------------------------------------------------------------
# 2. LEAK-DETECTION DATASET
#    Features per 10-minute flow window per sensor:
#      - mean_flow_lpm, std_flow_lpm, max_flow_lpm
#      - pct_time_flowing        : fraction of the window with nonzero flow
#      - expected_flow_lpm       : scheduled/typical flow for this time of day
#      - deviation_from_expected : mean_flow - expected_flow
#      - hour_of_day
#    Label:
#      - is_leak (0/1), leak_probability (soft label for regression-style eval)
#    Leak signature (per the roadmap): continuous or abnormally high flow with
#    no matching scheduled demand.
# ---------------------------------------------------------------------------
def generate_leak_dataset():
    rows = []
    for zone in range(N_ZONES):
        sensor_id = f"sensor_flow_{zone}"
        # A simple daily usage schedule: higher expected flow during
        # morning (6-9) and evening (18-21) hours, near-zero at night.
        def expected_flow(hour):
            if 6 <= hour <= 9 or 18 <= hour <= 21:
                return RNG.uniform(4, 9)
            elif 10 <= hour <= 17:
                return RNG.uniform(1, 3)
            return RNG.uniform(0, 0.5)

        for i in range(FLOW_WINDOWS_PER_ZONE):
            hour = RNG.integers(0, 24)
            expected = expected_flow(hour)
            is_leak = RNG.random() < 0.12  # ~12% of windows are leak events

            if is_leak:
                # Leak signature: continuous flow, doesn't match schedule,
                # abnormally steady (low variance) or abnormally high.
                mean_flow = expected + RNG.uniform(3, 12)
                std_flow = RNG.uniform(0.1, 0.6)  # leaks tend to be steady
                pct_time_flowing = RNG.uniform(0.85, 1.0)
            else:
                mean_flow = max(0, expected + RNG.normal(0, 0.7))
                std_flow = RNG.uniform(0.3, 1.5)
                pct_time_flowing = np.clip(
                    (expected / 9) + RNG.normal(0, 0.15), 0, 1
                )

            max_flow = mean_flow + std_flow * RNG.uniform(1.5, 3)
            deviation = mean_flow - expected

            rows.append(
                dict(
                    sensor_id=sensor_id,
                    hour_of_day=hour,
                    mean_flow_lpm=round(mean_flow, 3),
                    std_flow_lpm=round(std_flow, 3),
                    max_flow_lpm=round(max_flow, 3),
                    pct_time_flowing=round(pct_time_flowing, 3),
                    expected_flow_lpm=round(expected, 3),
                    deviation_from_expected=round(deviation, 3),
                    is_leak=int(is_leak),
                )
            )

    df = pd.DataFrame(rows)
    # Soft leak_probability label for reference/calibration checks
    df["leak_probability"] = df["is_leak"].astype(float)
    return df


# ---------------------------------------------------------------------------
# 3. PUMP-CONTROL VALIDATION DATASET
#    The roadmap explicitly wants pump control to be transparent RULES, not a
#    black-box model ("frame it as transparent rules, not a black box").
#    So this dataset isn't used to train a model — it's used to unit-test /
#    threshold-tune the rule engine (see app/services/pump_control_service.py)
#    against a wide variety of realistic scenarios.
# ---------------------------------------------------------------------------
def generate_pump_control_dataset():
    rows = []
    for _ in range(PUMP_SAMPLES):
        tank_level_pct = RNG.uniform(0, 100)
        float_switch_full = bool(tank_level_pct > 95 and RNG.random() < 0.9)
        shortage_severity = RNG.choice(["low", "medium", "high"], p=[0.5, 0.3, 0.2])
        leak_detected = bool(RNG.random() < 0.1)

        rows.append(
            dict(
                tank_level_pct=round(tank_level_pct, 2),
                float_switch_full=float_switch_full,
                shortage_severity=shortage_severity,
                leak_detected=leak_detected,
            )
        )
    return pd.DataFrame(rows)


if __name__ == "__main__":
    shortage_df = generate_shortage_dataset()
    leak_df = generate_leak_dataset()
    pump_df = generate_pump_control_dataset()

    shortage_df.to_csv("shortage_dataset.csv", index=False)
    leak_df.to_csv("leak_dataset.csv", index=False)
    pump_df.to_csv("pump_control_dataset.csv", index=False)

    print(f"shortage_dataset.csv        -> {len(shortage_df)} rows")
    print(f"leak_dataset.csv            -> {len(leak_df)} rows "
          f"({leak_df['is_leak'].mean():.1%} positive)")
    print(f"pump_control_dataset.csv    -> {len(pump_df)} rows")
