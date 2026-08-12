"""
AquaWatch AI Microservice
=========================
FastAPI service implementing the three prediction endpoints from the
AquaWatch roadmap (section 11 — API Reference). This service is internal —
only the Node.js backend calls it directly; the frontend never talks to it.

Run locally:
    uvicorn app.main:app --reload --port 8000

Endpoints:
    POST /predict-shortage
    POST /predict-leak
    POST /predict-pump-control
    GET  /health
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import (
    ShortageRequest, ShortageResponse,
    LeakRequest, LeakResponse,
    PumpControlRequest, PumpControlResponse,
)
from app.services.shortage_service import predict_shortage, _artifact as shortage_artifact
from app.services.leak_service import predict_leak, _artifact as leak_artifact
from app.services.pump_control_service import decide_pump_action

app = FastAPI(
    title="AquaWatch AI Service",
    description="Water-shortage forecasting, leak detection, and smart pump-control logic.",
    version="1.0.0",
)

# Node.js backend runs on a different port during local dev — keep CORS open
# internally since this service is never exposed to the public internet.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "shortage_model_loaded": shortage_artifact is not None,
        "leak_model_loaded": leak_artifact is not None,
        "pump_control": "rule-based (always available)",
    }


@app.post("/predict-shortage", response_model=ShortageResponse)
def predict_shortage_endpoint(req: ShortageRequest):
    try:
        result = predict_shortage(req)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"shortage prediction failed: {e}")


@app.post("/predict-leak", response_model=LeakResponse)
def predict_leak_endpoint(req: LeakRequest):
    try:
        result = predict_leak(req)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"leak prediction failed: {e}")


@app.post("/predict-pump-control", response_model=PumpControlResponse)
def predict_pump_control_endpoint(req: PumpControlRequest):
    try:
        result = decide_pump_action(req)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"pump control decision failed: {e}")
