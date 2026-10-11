import os
import sys
from pathlib import Path

def verify():
    root = Path(__file__).resolve().parent.parent
    print("=" * 65)
    print("      AGRISENSE PLATFORM — ARTIFACT & VERIFICATION AUDIT")
    print("=" * 65)

    checks = [
        ("LSTM Price Model (.keras)", root / "models" / "price" / "lstm_model.keras"),
        ("LSTM Scaler (.pkl)", root / "models" / "price" / "scaler.pkl"),
        ("Price Feature Config", root / "models" / "price" / "feature_config.json"),
        ("XGBoost Demand Model (.json)", root / "models" / "demand" / "xgboost_model.json"),
        ("XGBoost Preprocessor (.pkl)", root / "models" / "demand" / "preprocessor.pkl"),
        ("Demand Feature Config", root / "models" / "demand" / "feature_config.json"),
        ("AGMARKNET Processed Data", root / "data" / "processed" / "price" / "price_processed.csv"),
        ("Demand Test Features CSV", root / "data" / "processed" / "demand" / "test_features.csv"),
        ("Backend Main Entrypoint", root / "backend" / "app" / "main.py"),
        ("Frontend Build Dist", root / "frontend" / "dist" / "index.html"),
    ]

    all_passed = True
    for name, path in checks:
        if path.exists():
            print(f" [PASS] {name:<32} -> {path.name}")
        else:
            print(f" [FAIL] {name:<32} -> Missing at {path}")
            all_passed = False

    print("=" * 65)
    if all_passed:
        print(" SUCCESS: All models, preprocessors, datasets & builds verified!")
    else:
        print(" WARNING: Some components require attention.")
    print("=" * 65)

if __name__ == "__main__":
    verify()
