"""
Smart pump-control decision logic.

Deliberately rule-based, not a trained model — the roadmap is explicit about
this: "frame it as transparent rules, not a black box." A pump relay is a
physical actuator; an operator needs to be able to point at exactly why it
fired. The rules below are validated against data/pump_control_dataset.csv
(see tests/test_pump_control_rules.py) rather than trained on it.

Rule priority (checked top to bottom, first match wins):
  1. Leak detected               -> pump OFF  (never push more water into a leak)
  2. Float switch reports full   -> pump OFF  (physical overflow guard)
  3. Tank level below LOW_THRESHOLD
       AND shortage severity is 'medium' or 'high' -> pump ON (urgent refill)
  4. Tank level below LOW_THRESHOLD (severity 'low') -> pump ON (routine refill)
  5. Otherwise                   -> pump OFF  (tank adequately full)
"""

LOW_THRESHOLD_PCT = 30.0


def decide_pump_action(req) -> dict:
    pump_id = req.pump_id
    rule_version = "pump-rules-v1"

    if req.leak_detected:
        return {
            "pump_id": pump_id,
            "action": "off",
            "reason": "leak_detected",
            "rule_version": rule_version,
        }

    if req.float_switch_full or req.tank_level_pct >= 95:
        return {
            "pump_id": pump_id,
            "action": "off",
            "reason": "tank_full",
            "rule_version": rule_version,
        }

    if req.tank_level_pct < LOW_THRESHOLD_PCT:
        reason = (
            "tank_low_urgent_shortage"
            if req.shortage_severity in ("medium", "high")
            else "tank_low"
        )
        return {
            "pump_id": pump_id,
            "action": "on",
            "reason": reason,
            "rule_version": rule_version,
        }

    return {
        "pump_id": pump_id,
        "action": "off",
        "reason": "tank_level_adequate",
        "rule_version": rule_version,
    }
