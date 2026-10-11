from fastapi import APIRouter, HTTPException
from app.api.schemas.requests import PricePredictRequest, DemandPredictRequest
from app.services.shap_price_service import explain_lstm_price_forecast
from app.services.shap_demand_service import get_global_demand_shap, explain_local_demand_prediction

router = APIRouter(prefix="/explainability", tags=["Explainable AI (SHAP)"])

@router.get("/price/global")
def get_price_global_explanation():
    try:
        # For sequential LSTM, global is synthesized across representative temporal sequences
        return explain_lstm_price_forecast(commodity="Onion", state="Maharashtra")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/price/local")
def get_price_local_explanation(req: PricePredictRequest):
    try:
        return explain_lstm_price_forecast(
            commodity=req.commodity,
            state=req.state,
            market=req.market
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/demand/global")
def get_demand_global_shap():
    try:
        return get_global_demand_shap()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/demand/local")
def get_demand_local_shap(req: DemandPredictRequest):
    try:
        return explain_local_demand_prediction(
            state=req.state,
            district=req.district,
            market=req.market,
            commodity=req.commodity,
            date_str=req.date_str,
            modal_price=req.modal_price,
            min_price=req.min_price,
            max_price=req.max_price,
            variety_count=req.variety_count,
            grade_count=req.grade_count,
            crop_seasonality_index=req.crop_seasonality_index,
            annual_growth_factor=req.annual_growth_factor,
            day_of_week_factor=req.day_of_week_factor,
            festival_multiplier=req.festival_multiplier,
            stochastic_shock=req.stochastic_shock
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
