from fastapi import APIRouter, HTTPException
from app.services.evaluation_service import get_lstm_evaluation_metrics, get_xgboost_evaluation_metrics

router = APIRouter(prefix="/metrics", tags=["Model Performance & Academic Evaluation"])

@router.get("/price")
def get_price_metrics():
    try:
        return get_lstm_evaluation_metrics()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/demand")
def get_demand_metrics():
    try:
        return get_xgboost_evaluation_metrics()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
