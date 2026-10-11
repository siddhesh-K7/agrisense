import os
import shap
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

from app.config import SHAP_PLOTS_DIR
from app.ml.model_loader import model_loader
from app.ml.price_preprocessing import get_daily_series, prepare_lstm_input

_cached_lstm_explainer = None
_cached_background_data = None

def get_lstm_gradient_explainer():
    global _cached_lstm_explainer, _cached_background_data
    if _cached_lstm_explainer is None:
        model, _, _, _ = model_loader.get_lstm()
        if model is None:
            raise ValueError("LSTM model not loaded")

        # Bounded representative normalized background sequences
        # Generate 20 synthetic/empirical normalized sequences in [0, 1]
        rng = np.random.RandomState(42)
        base_trend = np.linspace(0.2, 0.8, 60)
        bg_list = []
        for _ in range(20):
            noise = rng.normal(0, 0.05, 60)
            seq = np.clip(base_trend + noise, 0, 1).reshape(60, 1)
            bg_list.append(seq)

        _cached_background_data = np.array(bg_list)  # (20, 60, 1)
        _cached_lstm_explainer = shap.GradientExplainer(model, _cached_background_data)
        print(f"[SHAP Price] Initialized Universal GradientExplainer with {_cached_background_data.shape[0]} sequences")

    return _cached_lstm_explainer

def explain_lstm_price_forecast(commodity="Onion", state=None, market=None):
    explainer = get_lstm_gradient_explainer()
    daily = get_daily_series(commodity=commodity, state=state, market=market)
    
    tensor, raw_recent, _ = prepare_lstm_input(daily, time_step=60) # (1, 60, 1)
    
    shap_vals = explainer.shap_values(tensor)
    shap_arr = np.array(shap_vals).squeeze() # shape: (60,)
    
    lags = []
    short_term_impact = 0.0
    medium_term_impact = 0.0
    long_term_impact = 0.0

    for i in range(60):
        lag_days = 60 - i # lag_days = 1 for yesterday, 60 for 60 days ago
        attr_val = float(shap_arr[i])
        raw_p = float(raw_recent[i][0])
        lags.append({
            "timestep_index": i,
            "lag_days_ago": lag_days,
            "observed_price": round(raw_p, 2),
            "shap_attribution": round(attr_val, 6),
            "impact_direction": "UPWARD PUSH" if attr_val > 0 else "DOWNWARD PULL"
        })
        
        if lag_days <= 7:
            short_term_impact += attr_val
        elif lag_days <= 30:
            medium_term_impact += attr_val
        else:
            long_term_impact += attr_val

    ranked_lags = sorted(lags, key=lambda x: abs(x['shap_attribution']), reverse=True)
    top_lags = ranked_lags[:5]

    dominant_regime = "Recent High Frequency Shock (Days t-1 to t-7)" if abs(short_term_impact) > max(abs(medium_term_impact), abs(long_term_impact)) else "Medium-Term Price Momentum (Days t-8 to t-30)"

    narrative = (
        f"Temporal gradient attribution for {commodity} indicates the forecast is dominated by {dominant_regime}. "
        f"The most decisive historical day was t-{top_lags[0]['lag_days_ago']} (Price: Rs.{top_lags[0]['observed_price']}), "
        f"which contributed {top_lags[0]['impact_direction'].lower()} with attribution {top_lags[0]['shap_attribution']:.5f}."
    )

    return {
        "commodity": commodity,
        "state": state or "National Average",
        "market": market or "All Markets",
        "algorithm": "Universal LSTM Recurrent Neural Network (GradientExplainer)",
        "sequence_length": 60,
        "dominant_regime": dominant_regime,
        "memory_partition_impact": {
            "short_term_days_1_to_7": round(short_term_impact, 5),
            "medium_term_days_8_to_30": round(medium_term_impact, 5),
            "long_term_days_31_to_60": round(long_term_impact, 5)
        },
        "top_influential_lags": top_lags,
        "temporal_series": lags,
        "narrative_explanation": narrative
    }
