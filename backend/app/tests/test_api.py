import pytest
import sys
from pathlib import Path

# Add backend to sys.path
backend_path = Path(__file__).resolve().parent.parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["models_status"]["lstm_price_model"] == "loaded"
    assert data["models_status"]["xgboost_demand_model"] == "loaded"

def test_commodities_and_hierarchy_endpoint():
    response = client.get("/api/commodities")
    assert response.status_code == 200
    data = response.json()
    assert "Onion" in data["price_forecasting"]["commodities"]
    assert "Tomato" in data["price_forecasting"]["commodities"]
    assert "Wheat" in data["price_forecasting"]["commodities"]
    assert data["price_forecasting"]["total_commodities"] >= 300

    # Test states for Tomato
    res_states = client.get("/api/commodities/states?commodity=Tomato")
    assert res_states.status_code == 200
    assert len(res_states.json()["states"]) > 0

    # Test markets for Tomato
    state0 = res_states.json()["states"][0]
    res_mkts = client.get(f"/api/commodities/markets?commodity=Tomato&state={state0}")
    assert res_mkts.status_code == 200
    assert len(res_mkts.json()["markets"]) > 0

def test_multicommodity_price_predict():
    # Test Onion
    p1 = client.post("/api/price/predict", json={
        "commodity": "Onion",
        "state": "Maharashtra",
        "market": "Lasalgaon",
        "horizon_days": 7
    })
    assert p1.status_code == 200
    assert len(p1.json()["forecasts"]) == 7

    # Test Tomato
    p2 = client.post("/api/price/predict", json={
        "commodity": "Tomato",
        "state": "Karnataka",
        "horizon_days": 14
    })
    assert p2.status_code == 200
    assert len(p2.json()["forecasts"]) == 14

    # Test Wheat
    p3 = client.post("/api/price/predict", json={
        "commodity": "Wheat",
        "state": "Punjab",
        "horizon_days": 30
    })
    assert p3.status_code == 200
    assert len(p3.json()["forecasts"]) == 30

def test_demand_predict_endpoint():
    payload = {
        "state": "Maharashtra",
        "district": "Nashik",
        "market": "Lasalgaon",
        "commodity": "Onion",
        "modal_price": 2500,
        "crop_seasonality_index": 1.1,
        "festival_multiplier": 1.2
    }
    response = client.post("/api/demand/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "predicted_demand_index" in data
    assert data["is_synthetic_demand"] is True

def test_risk_and_recommendation_multi_commodity():
    r1 = client.post("/api/risk/analyze", json={
        "commodity": "Potato",
        "state": "Uttar Pradesh",
        "horizon_days": 7
    })
    assert r1.status_code == 200
    assert 0 <= r1.json()["composite_risk_score"] <= 100

    rec = client.post("/api/recommendations/generate", json={
        "commodity": "Tomato",
        "state": "Karnataka",
        "horizon_days": 7,
        "estimated_storage_cost_per_qtl": 40.0
    })
    assert rec.status_code == 200
    assert rec.json()["action"] in ["STORE", "SELL", "WAIT"]
