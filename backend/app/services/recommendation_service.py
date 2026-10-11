from app.services.risk_service import calculate_risk_profile
from app.ml.inference import predict_price_horizon, predict_demand_single

def generate_decision_recommendation(
    commodity="Onion",
    state="Maharashtra",
    market=None,
    horizon_days=7,
    estimated_storage_cost_per_qtl=50.0
):
    # 1. Gather price forecast
    price_forecast = predict_price_horizon(
        commodity=commodity,
        state=state,
        market=market,
        horizon_days=horizon_days
    )
    
    # 2. Gather risk profile
    risk_profile = calculate_risk_profile(
        commodity=commodity,
        state=state,
        market=market,
        horizon_days=horizon_days
    )

    # 3. Gather demand signal
    try:
        demand_data = predict_demand_single(
            state=state,
            district="Nashik" if state == "Maharashtra" else "Central",
            market=market or "Lasalgaon",
            commodity=commodity,
            modal_price=price_forecast['last_observed_price']
        )
        demand_index = demand_data['predicted_demand_index']
    except Exception:
        demand_index = None

    pct_change = price_forecast['predicted_pct_change']
    risk_score = risk_profile['composite_risk_score']
    risk_level = risk_profile['risk_level']
    last_price = price_forecast['last_observed_price']
    expected_future_price = price_forecast['forecasts'][-1]['predicted_modal_price']
    gross_gain_per_qtl = expected_future_price - last_price
    net_gain_after_storage = gross_gain_per_qtl - estimated_storage_cost_per_qtl

    # 4. Transparent Rule-Based Decision Logic
    # Scenario A: STORE
    # Requirements: Positive price growth exceeding storage cost, and risk is LOW or MEDIUM
    if net_gain_after_storage > 0 and pct_change >= 2.5 and risk_score <= 65:
        action = "STORE"
        action_color = "#16A34A" # Emerald
        confidence = "HIGH" if (demand_index and demand_index > 105 and risk_score < 40) else "MODERATE"
        reason = (
            f"LSTM model predicts a {pct_change:.1f}% price appreciation (from Rs.{last_price:.2f} to Rs.{expected_future_price:.2f}/Qtl). "
            f"After factoring storage expenses (~Rs.{estimated_storage_cost_per_qtl:.2f}/Qtl), the net margin remains positive (+Rs.{net_gain_after_storage:.2f}/Qtl) "
            f"under {risk_level.lower()} conditions."
        )
        suggested_action = f"Hold stock in cold/ventilated storage for {horizon_days} days. Monitor weekly mandi arrival trends."

    # Scenario B: SELL
    # Requirements: Bearish price projection OR high risk with decaying demand
    elif pct_change <= -2.0 or risk_score >= 70 or (net_gain_after_storage <= 0 and pct_change < 0.5):
        action = "SELL"
        action_color = "#DC2626" # Muted Red
        confidence = "HIGH" if pct_change < -4.0 or risk_score >= 75 else "MODERATE"
        reason = (
            f"Forecast points to downside risk with {pct_change:.1f}% expected price change and composite risk index at {risk_score}/100 ({risk_level}). "
            f"Holding produce incurs holding costs and exposes farmers to further mandi depreciation."
        )
        suggested_action = "Liquidate batches at current market rates in active APMC mandis to lock in prevailing realizations."

    # Scenario C: WAIT / STAGGER
    # Requirements: Mixed signals, narrow price movements within storage margin bounds
    else:
        action = "WAIT"
        action_color = "#F59E0B" # Amber
        confidence = "MODERATE"
        reason = (
            f"Price movement is projected to be within a narrow margin ({pct_change:.1f}%), where gross gain does not significantly outweigh storage costs. "
            f"Market volatility ({risk_level}) indicates conflicting signals."
        )
        suggested_action = "Maintain existing operational inventory and defer large forward commitments for 3 to 5 days until clearer arrival patterns emerge."

    return {
        "commodity": commodity,
        "state": state,
        "market": market or "State Average",
        "action": action,
        "action_color": action_color,
        "confidence_level": confidence,
        "horizon_days": horizon_days,
        "decision_summary": reason,
        "recommended_operational_strategy": suggested_action,
        "economic_metrics": {
            "current_modal_price": last_price,
            "projected_modal_price": expected_future_price,
            "gross_price_change": round(gross_gain_per_qtl, 2),
            "percentage_change": pct_change,
            "estimated_storage_cost_per_qtl": estimated_storage_cost_per_qtl,
            "net_gain_per_qtl": round(net_gain_after_storage, 2),
            "composite_risk_score": risk_score,
            "risk_level": risk_level,
            "simulated_demand_index": demand_index
        },
        "rule_parameters_used": {
            "store_min_appreciation_pct": 2.5,
            "store_max_risk_score": 65,
            "sell_depreciation_pct_trigger": -2.0,
            "sell_high_risk_score_trigger": 70
        },
        "academic_disclosure": (
            "This decision engine utilizes deterministic multi-attribute rule sets incorporating LSTM price momentum, "
            "XGBoost demand absorption, and multi-factor volatility metrics. It is designed for decision support research."
        )
    }
