import numpy as np
import pandas as pd
from app.ml.price_preprocessing import get_daily_series
from app.ml.inference import predict_price_horizon, predict_demand_single

def calculate_risk_profile(commodity="Onion", state="Maharashtra", market=None, horizon_days=7):
    # 1. Fetch price forecast & historical window
    forecast_data = predict_price_horizon(
        commodity=commodity,
        state=state,
        market=market,
        horizon_days=horizon_days
    )
    
    daily = get_daily_series(commodity=commodity, state=state, market=market)
    recent_prices = daily['Modal_Price'].tail(30).values
    
    # Factor A: Historical Volatility (Coefficient of Variation)
    mean_price = np.mean(recent_prices)
    std_price = np.std(recent_prices)
    volatility_cv = (std_price / (mean_price + 1e-6)) * 100 # In percentage
    
    # Normalize volatility factor: CV of 25% or more maps to 100
    norm_volatility_score = min(100.0, (volatility_cv / 25.0) * 100.0)

    # Factor B: Forecast Rate of Decline / Downward Momentum
    pct_change = forecast_data['predicted_pct_change']
    # If price drops rapidly, market holding risk spikes
    if pct_change < 0:
        norm_trend_risk = min(100.0, abs(pct_change) * 10.0)
    else:
        norm_trend_risk = max(10.0, 30.0 - (pct_change * 2.0))

    # Factor C: Price Spread (Arrival volatility / Intraday dispersion)
    recent_min = daily['Min_Price'].tail(30).values
    recent_max = daily['Max_Price'].tail(30).values
    avg_spread = np.mean(recent_max - recent_min)
    norm_spread_score = min(100.0, (avg_spread / (mean_price * 0.3 + 1e-6)) * 100.0)

    # Factor D: Demand Absorption Risk (via XGBoost if commodity supported)
    try:
        demand_res = predict_demand_single(
            state=state,
            district="Nashik" if state == "Maharashtra" else "Central",
            market=market or "Lasalgaon",
            commodity=commodity,
            modal_price=float(mean_price)
        )
        demand_index = demand_res['predicted_demand_index']
        # If simulated demand index is low (<100), holding crops risks inventory glut
        if demand_index < 100:
            norm_demand_risk = min(100.0, (100.0 - demand_index) * 4.0 + 30.0)
        else:
            norm_demand_risk = max(10.0, 50.0 - (demand_index - 100.0) * 2.0)
    except Exception:
        demand_index = None
        norm_demand_risk = 50.0

    # 2. Transparent Weighted Formula
    weights = {
        "volatility_weight": 0.35,
        "trend_risk_weight": 0.25,
        "spread_risk_weight": 0.20,
        "demand_absorption_weight": 0.20
    }

    composite_risk_score = (
        (norm_volatility_score * weights["volatility_weight"]) +
        (norm_trend_risk * weights["trend_risk_weight"]) +
        (norm_spread_score * weights["spread_risk_weight"]) +
        (norm_demand_risk * weights["demand_absorption_weight"])
    )
    composite_risk_score = round(float(composite_risk_score), 2)

    # 3. Categorization
    if composite_risk_score <= 35.0:
        risk_level = "LOW RISK"
        risk_color = "#16A34A" # Emerald
        guidance = "Market indicators reflect high stability. Mild volatility and stable price expectations minimize downside risk."
    elif composite_risk_score <= 65.0:
        risk_level = "MEDIUM RISK"
        risk_color = "#F59E0B" # Amber
        guidance = "Moderate price swings detected. Farmers and traders should hedge exposure and avoid over-leveraged inventory holding."
    else:
        risk_level = "HIGH RISK"
        risk_color = "#DC2626" # Muted Red
        guidance = "Elevated volatility and deteriorating price/demand momentum. Immediate hedging or staged liquidation recommended."

    return {
        "commodity": commodity,
        "state": state,
        "market": market or "State Average",
        "composite_risk_score": composite_risk_score,
        "risk_level": risk_level,
        "risk_color": risk_color,
        "risk_factors": [
            {
                "name": "Historical Price Volatility",
                "raw_value": f"{round(volatility_cv, 2)}% CV",
                "normalized_score": round(norm_volatility_score, 1),
                "weight": weights["volatility_weight"],
                "description": "30-day coefficient of variation of daily modal prices in AGMARKNET."
            },
            {
                "name": "Forecasted Downward Momentum",
                "raw_value": f"{round(pct_change, 2)}% change",
                "normalized_score": round(norm_trend_risk, 1),
                "weight": weights["trend_risk_weight"],
                "description": "LSTM multi-step price projection rate over the target forecast horizon."
            },
            {
                "name": "Mandi Arrival Price Spread",
                "raw_value": f"Rs.{round(avg_spread, 2)}/Qtl",
                "normalized_score": round(norm_spread_score, 1),
                "weight": weights["spread_risk_weight"],
                "description": "Intraday gap between minimum and maximum quoted modal mandi prices."
            },
            {
                "name": "Market Demand Absorption",
                "raw_value": f"{round(demand_index, 2)} Index" if demand_index else "N/A",
                "normalized_score": round(norm_demand_risk, 1),
                "weight": weights["demand_absorption_weight"],
                "description": "XGBoost simulated market demand index reflecting consumer absorption capacity."
            }
        ],
        "mathematical_formula": "Risk = (0.35 * Volatility) + (0.25 * TrendRisk) + (0.20 * SpreadRisk) + (0.20 * DemandAbsorptionRisk)",
        "guidance": guidance,
        "limitations": "Heuristic risk score developed for academic research and educational decision support. Does not constitute guaranteed financial advice."
    }
