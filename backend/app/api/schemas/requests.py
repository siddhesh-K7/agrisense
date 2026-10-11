from typing import Optional
from pydantic import BaseModel, Field

class PricePredictRequest(BaseModel):
    commodity: str = Field(default="Onion", description="Commodity name")
    state: str = Field(default="Maharashtra", description="State name")
    market: Optional[str] = Field(default=None, description="Specific APMC market")
    horizon_days: int = Field(default=7, ge=1, le=90, description="Forecast horizon in days")

class DemandPredictRequest(BaseModel):
    state: str = Field(default="Maharashtra")
    district: str = Field(default="Nashik")
    market: str = Field(default="Lasalgaon")
    commodity: str = Field(default="Onion")
    date_str: Optional[str] = Field(default=None)
    modal_price: float = Field(default=2500.0, description="Real modal price in Rs./Qtl")
    min_price: float = Field(default=2000.0)
    max_price: float = Field(default=3000.0)
    variety_count: float = Field(default=1.0)
    grade_count: float = Field(default=1.0)
    crop_seasonality_index: float = Field(default=1.0)
    annual_growth_factor: float = Field(default=1.02)
    day_of_week_factor: float = Field(default=1.0)
    festival_multiplier: float = Field(default=1.0)
    stochastic_shock: float = Field(default=0.0)

class RiskAnalysisRequest(BaseModel):
    commodity: str = Field(default="Onion")
    state: str = Field(default="Maharashtra")
    market: Optional[str] = Field(default=None)
    horizon_days: int = Field(default=7, ge=1, le=90)

class RecommendationRequest(BaseModel):
    commodity: str = Field(default="Onion")
    state: str = Field(default="Maharashtra")
    market: Optional[str] = Field(default=None)
    horizon_days: int = Field(default=7, ge=1, le=90)
    estimated_storage_cost_per_qtl: float = Field(default=50.0)
