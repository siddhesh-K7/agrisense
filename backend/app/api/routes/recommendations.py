from fastapi import APIRouter, HTTPException
from app.api.schemas.requests import RecommendationRequest
from app.services.recommendation_service import generate_decision_recommendation

router = APIRouter(prefix="/recommendations", tags=["Decision Support Recommendations"])

@router.post("/generate")
def get_recommendation(req: RecommendationRequest):
    try:
        return generate_decision_recommendation(
            commodity=req.commodity,
            state=req.state,
            market=req.market,
            horizon_days=req.horizon_days,
            estimated_storage_cost_per_qtl=req.estimated_storage_cost_per_qtl
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
