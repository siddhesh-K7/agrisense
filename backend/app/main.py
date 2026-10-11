from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import APP_NAME, CORS_ORIGINS, SHAP_PLOTS_DIR
from app.ml.model_loader import model_loader

from app.api.routes.health import router as health_router
from app.api.routes.commodities import router as commodities_router
from app.api.routes.price import router as price_router
from app.api.routes.demand import router as demand_router
from app.api.routes.explainability import router as explainability_router
from app.api.routes.risk import router as risk_router
from app.api.routes.recommendations import router as recommendations_router
from app.api.routes.metrics import router as metrics_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure models are loaded on startup
    print(f"[{APP_NAME}] Initializing AgriSense ML Engine...")
    _ = model_loader.get_lstm()
    _ = model_loader.get_xgboost()
    print(f"[{APP_NAME}] All models and artifacts ready for inference!")
    yield

app = FastAPI(
    title=APP_NAME,
    description="Explainable and Risk-Aware Framework for Agricultural Price & Demand Forecasting",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static Files for SHAP and Model Evaluation Plots
app.mount("/api/plots", StaticFiles(directory=str(SHAP_PLOTS_DIR)), name="plots")

# Register API Routers
app.include_router(health_router, prefix="/api")
app.include_router(commodities_router, prefix="/api")
app.include_router(price_router, prefix="/api")
app.include_router(demand_router, prefix="/api")
app.include_router(explainability_router, prefix="/api")
app.include_router(risk_router, prefix="/api")
app.include_router(recommendations_router, prefix="/api")
app.include_router(metrics_router, prefix="/api")

@app.get("/")
def root():
    return {
        "message": "Welcome to AgriSense API",
        "docs": "/docs",
        "health": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
