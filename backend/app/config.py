import os
from pathlib import Path

# Base directories
BACKEND_DIR = Path(__file__).resolve().parent.parent
AGRISENSE_DIR = BACKEND_DIR.parent

DATA_DIR = AGRISENSE_DIR / "data"
MODELS_DIR = AGRISENSE_DIR / "models"
EXPLAINABILITY_DIR = AGRISENSE_DIR / "explainability"
REPORTS_DIR = AGRISENSE_DIR / "reports"

# Model paths
LSTM_MODEL_PATH = MODELS_DIR / "price" / "lstm_model.keras"
LSTM_LEGACY_PATH = MODELS_DIR / "price" / "legacy_lstm.h5"
LSTM_SCALER_PATH = MODELS_DIR / "price" / "scaler.pkl"
PRICE_CONFIG_PATH = MODELS_DIR / "price" / "feature_config.json"
PRICE_METADATA_PATH = MODELS_DIR / "price" / "metadata.json"

XGB_MODEL_PATH = MODELS_DIR / "demand" / "xgboost_model.json"
XGB_PIPELINE_PATH = MODELS_DIR / "demand" / "xgboost_pipeline.joblib"
XGB_PREPROCESSOR_PATH = MODELS_DIR / "demand" / "preprocessor.pkl"
DEMAND_CONFIG_PATH = MODELS_DIR / "demand" / "feature_config.json"
DEMAND_METADATA_PATH = MODELS_DIR / "demand" / "metadata.json"

# Dataset paths
PRICE_PROCESSED_CSV = DATA_DIR / "processed" / "price" / "price_processed.csv"
DEMAND_TRAIN_CSV = DATA_DIR / "processed" / "demand" / "train_features.csv"
DEMAND_TEST_CSV = DATA_DIR / "processed" / "demand" / "test_features.csv"
DEMAND_RAW_XLSX = DATA_DIR / "raw" / "demand" / "raw_demand_data.xlsx"

# Explainability output folders
SHAP_PLOTS_DIR = EXPLAINABILITY_DIR / "generated_plots"
SHAP_CACHE_DIR = EXPLAINABILITY_DIR / "cached_explanations"
os.makedirs(SHAP_PLOTS_DIR, exist_ok=True)
os.makedirs(SHAP_CACHE_DIR, exist_ok=True)

# Application Settings
APP_NAME = "AgriSense API"
API_PREFIX = "/api"
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "*"
]
