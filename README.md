# AGRISENSE

## An Explainable and Risk-Aware Framework for Agricultural Price and Demand Forecasting
*M.Tech Computer Science and Engineering Final-Year Project*

---

### Project Overview
AgriSense is a production-style, research-oriented agricultural intelligence platform designed to address price volatility, market information asymmetry, and post-harvest risk. The system combines:
1. **Recurrent Deep Learning (Stacked LSTM)** for multi-step daily modal price forecasting across AGMARKNET APMC mandis.
2. **Gradient Tree Boosting (XGBoost Regressor)** for destination market demand index estimation across 20 standardized agro-economic features.
3. **Dual Explainable AI (SHAP)**:
   - **TreeExplainer** for additive feature attributions and waterfall breakdowns on XGBoost.
   - **GradientExplainer** for temporal lag memory attribution on sequential LSTM inputs.
4. **Deterministic Multi-Signal Risk Engine** classifying volatility, momentum, spread, and demand absorption into Low, Medium, and High risk profiles.
5. **Smart Decision Support Advisory** delivering actionable **SELL**, **STORE**, or **WAIT** recommendations accounting for holding expenses and net arbitrage margins.
6. **Executive React + Vite Frontend** with a SaaS design system and interactive charts.

---

### Folder Architecture
```
AgriSense/
│
├── README.md
├── IMPLEMENTATION_STATUS.md
├── .gitignore
├── .env.example
│
├── data/
│   ├── raw/
│   │   ├── price/
│   │   └── demand/
│   ├── processed/
│   │   ├── price/ (price_processed.csv)
│   │   └── demand/ (train_features.csv, test_features.csv)
│   └── predictions/ (price_predictions.xlsx, demand_predictions.xlsx)
│
├── models/
│   ├── price/
│   │   ├── lstm_model.keras
│   │   ├── legacy_lstm.h5
│   │   ├── scaler.pkl
│   │   ├── feature_config.json
│   │   └── metadata.json
│   └── demand/
│       ├── xgboost_model.json
│       ├── xgboost_pipeline.joblib
│       ├── preprocessor.pkl
│       ├── feature_config.json
│       └── metadata.json
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── api/routes/ (price, demand, explainability, risk, recommendations, metrics, health)
│   │   ├── services/ (price, demand, shap_price, shap_demand, risk, recommendation, evaluation)
│   │   ├── ml/ (model_loader, price_preprocessing, demand_preprocessing, inference)
│   │   └── tests/ (test_api.py)
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── pages/ (Dashboard, PriceForecast, DemandForecast, ExplainableAI, RiskAnalysis, Recommendations, ModelPerformance, About)
│   │   ├── components/
│   │   └── services/api.js
│   ├── package.json
│   └── vite.config.js
│
├── explainability/
│   ├── generated_plots/ (demand_shap_summary.png, lstm_shap_temporal.png)
│   └── cached_explanations/
│
└── scripts/
    ├── verify_installation.py
    ├── start_backend.bat
    └── start_frontend.bat
```

---

### Machine Learning Specifications

#### Model 1: Price Forecaster (LSTM)
- **Algorithm**: Deep Stacked LSTM (2 LSTM layers with Dropout + Dense head)
- **Input Representation**: Sliding lookback tensor of shape `(batch, 60, 1)`
- **Target**: Next-day Mean Modal Price in Rs./Quintal
- **Dataset**: AGMARKNET Mandi Price Dataset (Maharashtra Onion, 2016–2026, 225 APMC markets)
- **Scaling**: Scikit-Learn `MinMaxScaler(feature_range=(0, 1))`
- **Explainability**: SHAP `GradientExplainer` analyzing 60 historical time-lags

#### Model 2: Demand Forecaster (XGBoost)
- **Algorithm**: `XGBRegressor` (150 estimators, max_depth 6, learning_rate 0.08)
- **Features (20)**: Encodings for State, District, Market, Commodity + 11 numerical market signals + 5 calendar/temporal flags
- **Target**: `simulated_demand_index` (Test baseline mean: 108.55)
- **Dataset**: 50,000 multi-state agricultural arrival records across 26 states & 58 crops
- **Test Performance**: MAE = 7.76, RMSE = 10.24, R² = 0.6425 (64.25% variance explained)
- **Explainability**: SHAP `TreeExplainer` yielding exact additivity `E[Y] + sum(phi) = Y`

---

### Quickstart & Execution (Windows)

#### 1. Backend Startup
```powershell
cd AgriSense\backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be available at: `http://localhost:8000/docs`

#### 2. Frontend Startup
```powershell
cd AgriSense\frontend
npm run dev
```
Open your browser at: `http://localhost:5173`

#### 3. Run Automated Tests
```powershell
cd AgriSense
python -m pytest backend/app/tests/test_api.py -v
```

---

### Academic Integrity & Research Disclosures
- **Genuine Predictions**: All predictions are computed directly by the pre-trained weights (`lstm_model.keras` and `xgboost_model.json`).
- **Transparency on Demand**: The demand target is transparently documented as `simulated_demand_index` (econometric simulation) rather than physical consumer checkout data.
- **Decision Engine Disclaimer**: Decision recommendations (SELL/STORE/WAIT) and risk scores are mathematical heuristics designed for research simulation and do not constitute certified financial guarantees.
