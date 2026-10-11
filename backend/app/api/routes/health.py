from fastapi import APIRouter
from app.ml.model_loader import model_loader

router = APIRouter(prefix="/health", tags=["System Health"])

@router.get("")
def health_check():
    lstm_m, lstm_sc, _, _ = model_loader.get_lstm()
    xgb_m, xgb_prep, _, _ = model_loader.get_xgboost()
    
    return {
        "status": "healthy",
        "system": "AgriSense Final-Year Academic Platform",
        "models_status": {
            "lstm_price_model": "loaded" if (lstm_m is not None and lstm_sc is not None) else "unavailable",
            "xgboost_demand_model": "loaded" if (xgb_m is not None and xgb_prep is not None) else "unavailable"
        },
        "explainability_engine": "active (SHAP TreeExplainer & GradientExplainer)"
    }
