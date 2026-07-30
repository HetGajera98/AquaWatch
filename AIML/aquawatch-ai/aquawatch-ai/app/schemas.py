"""
Pydantic schemas for the three AquaWatch AI endpoints.
These are the exact request/response shapes shared with Backend (M2) —
see roadmap section 11 (API Reference) and section 5 (workflow).
"""
from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# POST /predict-shortage
# ---------------------------------------------------------------------------
class ShortageRequest(BaseModel):
    zone_id: str
    tank_level_pct: float = Field(..., ge=0, le=100)
    tank_level_trend_7d: float = Field(
        0.0, description="%/day change in tank level over the last 7 days (negative = draining)"
    )
    avg_daily_consumption_l: float = Field(..., ge=0)
    consumption_trend_7d: float = Field(
        0.0, description="% change in consumption vs the prior 7-day window"
    )
    rainfall_forecast_mm_7d: float = Field(0.0, ge=0)
    days_of_supply_left: Optional[float] = Field(
        None, description="Optional precomputed estimate; derived server-side if omitted"
    )

    model_config = ConfigDict(json_schema_extra={
            "example": {
                "zone_id": "zone_3",
                "tank_level_pct": 28.5,
                "tank_level_trend_7d": -3.2,
                "avg_daily_consumption_l": 2100.0,
                "consumption_trend_7d": 12.0,
                "rainfall_forecast_mm_7d": 4.0,
            }
        })


class ShortageResponse(BaseModel):
    zone_id: str
    stress_score: float = Field(..., ge=0, le=100)
    severity: Literal["low", "medium", "high"]
    top_factors: list[str] = Field(
        default_factory=list,
        description="Human-readable explanation of the biggest contributors to this score",
    )
    model_version: str


# ---------------------------------------------------------------------------
# POST /predict-leak
# ---------------------------------------------------------------------------
class LeakRequest(BaseModel):
    sensor_id: str
    mean_flow_lpm: float = Field(..., ge=0, description="Mean flow rate over the window, L/min")
    std_flow_lpm: float = Field(..., ge=0)
    max_flow_lpm: float = Field(..., ge=0)
    pct_time_flowing: float = Field(..., ge=0, le=1)
    expected_flow_lpm: float = Field(
        0.0, description="Scheduled/typical flow for this sensor at this time of day"
    )
    hour_of_day: int = Field(..., ge=0, le=23)

    model_config = ConfigDict(json_schema_extra={
            "example": {
                "sensor_id": "sensor_flow_2",
                "mean_flow_lpm": 8.7,
                "std_flow_lpm": 0.3,
                "max_flow_lpm": 9.4,
                "pct_time_flowing": 0.97,
                "expected_flow_lpm": 1.0,
                "hour_of_day": 2,
            }
        })


class LeakResponse(BaseModel):
    sensor_id: str
    leak_probability: float = Field(..., ge=0, le=1)
    is_leak: bool
    reason: str = Field(..., description="Short explanation of what triggered the flag")
    model_version: str


# ---------------------------------------------------------------------------
# POST /predict-pump-control
# ---------------------------------------------------------------------------
class PumpControlRequest(BaseModel):
    pump_id: str
    tank_level_pct: float = Field(..., ge=0, le=100)
    float_switch_full: bool
    shortage_severity: Literal["low", "medium", "high"] = "low"
    leak_detected: bool = False

    model_config = ConfigDict(json_schema_extra={
            "example": {
                "pump_id": "pump_7",
                "tank_level_pct": 18.0,
                "float_switch_full": False,
                "shortage_severity": "high",
                "leak_detected": False,
            }
        })


class PumpControlResponse(BaseModel):
    pump_id: str
    action: Literal["on", "off"]
    reason: str
    rule_version: str
