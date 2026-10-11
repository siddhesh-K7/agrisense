from fastapi import APIRouter, HTTPException, Query
from app.api.schemas.requests import PricePredictRequest
from app.ml.inference import predict_price_horizon
from app.ml.price_preprocessing import get_daily_series, get_available_commodities_and_markets

router = APIRouter(prefix="/price", tags=["Price Forecasting (LSTM)"])

@router.post("/predict")
def predict_price(req: PricePredictRequest):
    try:
        res = predict_price_horizon(
            commodity=req.commodity,
            state=req.state,
            market=req.market,
            horizon_days=req.horizon_days
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/history")
def get_price_history(
    commodity: str = "Onion",
    state: str = "Maharashtra",
    market: str = None,
    limit: int = Query(default=180, ge=10, le=1000)
):
    try:
        daily = get_daily_series(commodity=commodity, state=state, market=market)
        tail_df = daily.tail(limit)
        
        records = []
        for _, row in tail_df.iterrows():
            records.append({
                "date": row['Arrival_Date_Parsed'].strftime("%Y-%m-%d"),
                "modal_price": round(float(row['Modal_Price']), 2),
                "min_price": round(float(row['Min_Price']), 2),
                "max_price": round(float(row['Max_Price']), 2)
            })
            
        return {
            "commodity": commodity,
            "state": state,
            "market": market or "All Markets (Average)",
            "unit": "Rs./Quintal",
            "total_points": len(records),
            "history": records
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/markets")
def get_markets():
    cov = get_available_commodities_and_markets()
    return {
        "markets": cov["markets"],
        "districts": cov["districts"]
    }
