import os
import pandas as pd
import numpy as np
from datetime import datetime

from app.config import DEMAND_TEST_CSV, DEMAND_RAW_XLSX
from app.ml.model_loader import model_loader

_cached_demand_test = None
_cached_demand_raw = None

def get_demand_test_df():
    global _cached_demand_test
    if _cached_demand_test is None:
        if os.path.exists(DEMAND_TEST_CSV):
            _cached_demand_test = pd.read_csv(DEMAND_TEST_CSV)
        else:
            raise FileNotFoundError(f"Demand test dataset not found at {DEMAND_TEST_CSV}")
    return _cached_demand_test

def get_demand_raw_df():
    global _cached_demand_raw
    if _cached_demand_raw is None:
        if os.path.exists(DEMAND_RAW_XLSX):
            _cached_demand_raw = pd.read_excel(DEMAND_RAW_XLSX)
            _cached_demand_raw['Arrival_Date'] = pd.to_datetime(_cached_demand_raw['Arrival_Date'])
        else:
            raise FileNotFoundError(f"Demand raw dataset not found at {DEMAND_RAW_XLSX}")
    return _cached_demand_raw

def get_demand_metadata_options():
    _, prep, _, _ = model_loader.get_xgboost()
    if prep is None:
        return {}
    
    encoders = prep.get('encoders', {})
    return {
        "commodities": sorted(list(encoders.get('Commodity', {}).classes_)) if 'Commodity' in encoders else [],
        "states": sorted(list(encoders.get('State', {}).classes_)) if 'State' in encoders else [],
        "districts": sorted(list(encoders.get('District', {}).classes_)) if 'District' in encoders else [],
        "markets": sorted(list(encoders.get('Market', {}).classes_)) if 'Market' in encoders else [],
        "target_col": prep.get('target_col', 'simulated_demand_index'),
        "feature_cols": prep.get('feature_cols', []),
        "is_synthetic_demand": True,
        "demand_metric": "simulated_demand_index (Simulated Agricultural Demand Index)"
    }

def prepare_demand_feature_vector(
    state: str,
    district: str,
    market: str,
    commodity: str,
    date_str: str,
    real_modal_price: float = 2500.0,
    real_min_price: float = 2000.0,
    real_max_price: float = 3000.0,
    variety_count: float = 1.0,
    grade_count: float = 1.0,
    crop_seasonality_index: float = 1.0,
    annual_growth_factor: float = 1.02,
    day_of_week_factor: float = 1.0,
    festival_multiplier: float = 1.0,
    stochastic_shock: float = 0.0
):
    _, prep, _, _ = model_loader.get_xgboost()
    if prep is None:
        raise ValueError("XGBoost preprocessor not loaded")

    scaler = prep['scaler']
    encoders = prep['encoders']
    feature_cols = prep['feature_cols']

    # Date parsing
    try:
        dt = pd.to_datetime(date_str)
    except Exception:
        dt = datetime.now()

    year = dt.year
    month = dt.month
    day = dt.day
    day_of_week = dt.dayofweek
    is_weekend = 1 if day_of_week in [5, 6] else 0

    # Categorical encodings with safe fallback
    def encode_val(col_name, val):
        le = encoders.get(col_name)
        if le is None:
            return 0
        if val in le.classes_:
            return int(le.transform([str(val)])[0])
        else:
            return 0

    state_enc = encode_val('State', state)
    district_enc = encode_val('District', district)
    market_enc = encode_val('Market', market)
    commodity_enc = encode_val('Commodity', commodity)

    real_price_spread = float(real_max_price - real_min_price)

    # Feature dictionary aligning with train_features.csv
    raw_dict = {
        'State_enc': state_enc,
        'District_enc': district_enc,
        'Market_enc': market_enc,
        'Commodity_enc': commodity_enc,
        'real_modal_price': float(real_modal_price),
        'real_min_price': float(real_min_price),
        'real_max_price': float(real_max_price),
        'variety_count': float(variety_count),
        'grade_count': float(grade_count),
        'real_price_spread': float(real_price_spread),
        'crop_seasonality_index': float(crop_seasonality_index),
        'annual_growth_factor': float(annual_growth_factor),
        'day_of_week_factor': float(day_of_week_factor),
        'festival_demand_multiplier': float(festival_multiplier),
        'stochastic_shock_factor': float(stochastic_shock),
        'Year': year,
        'Month': month,
        'Day': day,
        'DayOfWeek': day_of_week,
        'IsWeekend': is_weekend
    }

    df_row = pd.DataFrame([raw_dict])[feature_cols]
    scaled_array = scaler.transform(df_row)
    df_scaled = pd.DataFrame(scaled_array, columns=feature_cols)

    return df_scaled, raw_dict
