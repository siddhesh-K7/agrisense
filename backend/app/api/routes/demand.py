from fastapi import APIRouter, HTTPException, Query
from app.api.schemas.requests import DemandPredictRequest
from app.ml.inference import predict_demand_single
from app.ml.demand_preprocessing import get_demand_raw_df, get_demand_metadata_options

router = APIRouter(prefix="/demand", tags=["Demand Forecasting (XGBoost)"])

@router.post("/predict")
def predict_demand(req: DemandPredictRequest):
    try:
        res = predict_demand_single(
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
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/history")
def get_demand_history(
    commodity: str = "Onion",
    state: str = "Maharashtra",
    limit: int = Query(default=50, ge=10, le=200)
):
    try:
        df = get_demand_raw_df()
        sub = df[(df['Commodity'] == commodity) & (df['State'] == state)]
        if sub.empty:
            sub = df[df['Commodity'] == commodity]
        if sub.empty:
            sub = df.head(limit)
        else:
            sub = sub.head(limit)

        records = []
        for _, row in sub.iterrows():
            records.append({
                "date": row['Arrival_Date'].strftime("%Y-%m-%d") if hasattr(row['Arrival_Date'], 'strftime') else str(row['Arrival_Date']),
                "market": str(row.get('Market', 'N/A')),
                "modal_price": float(row.get('real_modal_price', 0.0)),
                "simulated_demand_index": round(float(row.get('simulated_demand_index', 0.0)), 2),
                "seasonality_index": round(float(row.get('crop_seasonality_index', 1.0)), 2)
            })

        return {
            "commodity": commodity,
            "state": state,
            "target_unit": "Simulated Demand Index",
            "is_synthetic_demand": True,
            "count": len(records),
            "history": records
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
