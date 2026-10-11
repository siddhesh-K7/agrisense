import os
import shap
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

from app.config import SHAP_PLOTS_DIR
from app.ml.model_loader import model_loader
from app.ml.demand_preprocessing import prepare_demand_feature_vector, get_demand_test_df

_cached_explainer = None
_cached_background = None
_cached_global_importance = None

def get_tree_explainer():
    global _cached_explainer, _cached_background
    if _cached_explainer is None:
        model, _, _, _ = model_loader.get_xgboost()
        if model is None:
            raise ValueError("XGBoost model not loaded")
        _cached_explainer = shap.TreeExplainer(model)
    return _cached_explainer

def get_global_demand_shap():
    global _cached_global_importance
    if _cached_global_importance is not None:
        return _cached_global_importance

    explainer = get_tree_explainer()
    test_df = get_demand_test_df()
    feature_cols = [c for c in test_df.columns if c != 'simulated_demand_index']
    
    # Representative bounded evaluation sample (300 rows)
    sample_df = test_df[feature_cols].sample(min(300, len(test_df)), random_state=42)
    shap_vals = explainer.shap_values(sample_df)

    mean_abs_shap = np.mean(np.abs(shap_vals), axis=0)
    indices = np.argsort(mean_abs_shap)[::-1]

    feature_ranking = []
    for idx in indices:
        feature_ranking.append({
            "feature": feature_cols[idx],
            "mean_abs_shap": round(float(mean_abs_shap[idx]), 4),
            "rank": int(len(feature_ranking) + 1)
        })

    # Generate and save global SHAP summary plots
    summary_plot_path = os.path.join(SHAP_PLOTS_DIR, "demand_shap_summary.png")
    bar_plot_path = os.path.join(SHAP_PLOTS_DIR, "demand_shap_bar.png")

    try:
        plt.figure(figsize=(9, 5))
        shap.summary_plot(shap_vals, sample_df, show=False)
        plt.title("XGBoost Demand Forecaster — SHAP Feature Attribution", fontsize=12)
        plt.tight_layout()
        plt.savefig(summary_plot_path, dpi=120)
        plt.close()

        plt.figure(figsize=(9, 5))
        shap.summary_plot(shap_vals, sample_df, plot_type="bar", show=False)
        plt.title("Global Feature Importance (Mean |SHAP Value|)", fontsize=12)
        plt.tight_layout()
        plt.savefig(bar_plot_path, dpi=120)
        plt.close()
    except Exception as e:
        print(f"[SHAP] Error saving global plots: {e}")

    _cached_global_importance = {
        "model_type": "XGBoost Regressor (TreeExplainer)",
        "expected_value": round(float(explainer.expected_value), 4),
        "sample_size": len(sample_df),
        "feature_ranking": feature_ranking,
        "summary_plot_file": "demand_shap_summary.png",
        "bar_plot_file": "demand_shap_bar.png",
        "academic_disclosure": "SHAP (SHapley Additive exPlanations) uses cooperative game theory to quantify the exact marginal contribution of each agricultural attribute to the demand index forecast."
    }
    return _cached_global_importance

def explain_local_demand_prediction(
    state="Maharashtra",
    district="Nashik",
    market="Lasalgaon",
    commodity="Onion",
    date_str=None,
    modal_price=2500.0,
    min_price=2000.0,
    max_price=3000.0,
    variety_count=1.0,
    grade_count=1.0,
    crop_seasonality_index=1.0,
    annual_growth_factor=1.02,
    day_of_week_factor=1.0,
    festival_multiplier=1.0,
    stochastic_shock=0.0
):
    explainer = get_tree_explainer()
    df_scaled, raw_dict = prepare_demand_feature_vector(
        state=state,
        district=district,
        market=market,
        commodity=commodity,
        date_str=date_str,
        real_modal_price=modal_price,
        real_min_price=min_price,
        real_max_price=max_price,
        variety_count=variety_count,
        grade_count=grade_count,
        crop_seasonality_index=crop_seasonality_index,
        annual_growth_factor=annual_growth_factor,
        day_of_week_factor=day_of_week_factor,
        festival_multiplier=festival_multiplier,
        stochastic_shock=stochastic_shock
    )

    shap_values = explainer.shap_values(df_scaled)[0]
    expected_value = float(explainer.expected_value)
    predicted_val = expected_value + float(np.sum(shap_values))

    features = list(df_scaled.columns)
    contributions = []
    for f, sv in zip(features, shap_values):
        contributions.append({
            "feature": f,
            "raw_value": raw_dict.get(f.replace("_enc", ""), float(df_scaled[f].iloc[0])),
            "scaled_value": round(float(df_scaled[f].iloc[0]), 3),
            "shap_value": round(float(sv), 4),
            "direction": "INCREASES DEMAND" if sv > 0 else "DECREASES DEMAND"
        })

    # Sort by absolute SHAP impact
    contributions.sort(key=lambda x: abs(x['shap_value']), reverse=True)

    top_positive = [c['feature'] for c in contributions if c['shap_value'] > 0][:3]
    top_negative = [c['feature'] for c in contributions if c['shap_value'] < 0][:3]

    pos_desc = f"{', '.join(top_positive)} elevated the forecast" if top_positive else "no strong positive drivers"
    neg_desc = f"{', '.join(top_negative)} exerted downward pressure" if top_negative else "no downward drivers"

    narrative = (
        f"The model predicted a Demand Index of {predicted_val:.2f} relative to the baseline expectation of {expected_value:.2f}. "
        f"Among all 20 evaluated features, {pos_desc}, while {neg_desc}."
    )

    return {
        "expected_baseline": round(expected_value, 2),
        "predicted_value": round(predicted_val, 2),
        "sum_of_shap": round(float(np.sum(shap_values)), 4),
        "reconstruction_check": round(expected_value + float(np.sum(shap_values)), 2),
        "contributions": contributions,
        "top_positive_features": top_positive,
        "top_negative_features": top_negative,
        "narrative_explanation": narrative
    }
