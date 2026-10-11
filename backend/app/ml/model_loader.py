import os
import json
import pickle
import threading
import numpy as np
import xgboost as xgb
from tensorflow.keras.models import load_model

from app.config import (
    LSTM_MODEL_PATH,
    LSTM_LEGACY_PATH,
    LSTM_SCALER_PATH,
    PRICE_CONFIG_PATH,
    PRICE_METADATA_PATH,
    XGB_MODEL_PATH,
    XGB_PREPROCESSOR_PATH,
    DEMAND_CONFIG_PATH,
    DEMAND_METADATA_PATH
)

class ModelLoader:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(ModelLoader, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self):
        if self._initialized:
            return

        self.lstm_model = None
        self.lstm_scaler = None
        self.price_config = {}
        self.price_metadata = {}

        self.xgb_model = None
        self.xgb_preprocessor = None
        self.demand_config = {}
        self.demand_metadata = {}

        self._load_all()
        self._initialized = True

    def _load_all(self):
        # 1. Load LSTM
        try:
            if os.path.exists(LSTM_MODEL_PATH):
                self.lstm_model = load_model(str(LSTM_MODEL_PATH))
                print(f"[ModelLoader] Loaded LSTM model from {LSTM_MODEL_PATH}")
            elif os.path.exists(LSTM_LEGACY_PATH):
                self.lstm_model = load_model(str(LSTM_LEGACY_PATH))
                print(f"[ModelLoader] Loaded legacy LSTM model from {LSTM_LEGACY_PATH}")
            else:
                print(f"[ModelLoader] Warning: LSTM model file not found")

            if os.path.exists(LSTM_SCALER_PATH):
                with open(LSTM_SCALER_PATH, "rb") as f:
                    self.lstm_scaler = pickle.load(f)
                print(f"[ModelLoader] Loaded LSTM Scaler from {LSTM_SCALER_PATH}")

            if os.path.exists(PRICE_CONFIG_PATH):
                with open(PRICE_CONFIG_PATH, "r") as f:
                    self.price_config = json.load(f)

            if os.path.exists(PRICE_METADATA_PATH):
                with open(PRICE_METADATA_PATH, "r") as f:
                    self.price_metadata = json.load(f)
        except Exception as e:
            print(f"[ModelLoader] Error loading LSTM artifacts: {e}")

        # 2. Load XGBoost
        try:
            if os.path.exists(XGB_MODEL_PATH):
                self.xgb_model = xgb.XGBRegressor()
                self.xgb_model.load_model(str(XGB_MODEL_PATH))
                print(f"[ModelLoader] Loaded XGBoost model from {XGB_MODEL_PATH}")

            if os.path.exists(XGB_PREPROCESSOR_PATH):
                with open(XGB_PREPROCESSOR_PATH, "rb") as f:
                    self.xgb_preprocessor = pickle.load(f)
                print(f"[ModelLoader] Loaded XGBoost Preprocessor from {XGB_PREPROCESSOR_PATH}")

            if os.path.exists(DEMAND_CONFIG_PATH):
                with open(DEMAND_CONFIG_PATH, "r") as f:
                    self.demand_config = json.load(f)

            if os.path.exists(DEMAND_METADATA_PATH):
                with open(DEMAND_METADATA_PATH, "r") as f:
                    self.demand_metadata = json.load(f)
        except Exception as e:
            print(f"[ModelLoader] Error loading XGBoost artifacts: {e}")

    def get_lstm(self):
        return self.lstm_model, self.lstm_scaler, self.price_config, self.price_metadata

    def get_xgboost(self):
        return self.xgb_model, self.xgb_preprocessor, self.demand_config, self.demand_metadata

model_loader = ModelLoader()
