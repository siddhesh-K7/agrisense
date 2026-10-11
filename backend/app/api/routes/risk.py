from fastapi import APIRouter, HTTPException
from app.api.schemas.requests import RiskAnalysisRequest
from app.services.risk_service import calculate_risk_profile

router = APIRouter(prefix="/risk", tags=["Risk Analysis Engine"])

@router.post("/analyze")
def analyze_risk(req: RiskAnalysisRequest):
    try:
        return calculate_risk_profile(
            commodity=req.commodity,
            state=req.state,
            market=req.market,
            horizon_days=req.horizon_days
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
