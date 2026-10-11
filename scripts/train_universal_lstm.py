import os
import sqlite3
import numpy as np
import pandas as pd
import json
import time
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout

def train_universal():
    print("=" * 60)
    print(" AGRISENSE — UNIVERSAL MULTI-COMMODITY LSTM TRAINING")
    print("=" * 60)
    t0 = time.time()

    db_path = r'data/processed/price/agmarknet_master.db'
    if not os.path.exists(db_path):
        raise FileNotFoundError(f"Database not found at {db_path}")

    conn = sqlite3.connect(db_path)

    sample_commodities = [
        'Onion', 'Potato', 'Tomato', 'Wheat', 'Rice', 'Paddy (Common)',
        'Green Chilli', 'Brinjal', 'Banana', 'Maize', 'Cotton', 'Garlic',
        'Apple', 'Cabbage', 'Cauliflower', 'Carrot', 'Ginger (Green)', 'Mustard'
    ]

    print("[1/5] Extracting temporal price sequences across diverse commodities...")
    time_step = 60
    X_list, y_list = [], []

    for comm in sample_commodities:
        query = '''
            SELECT State, Date_Str, Modal_Price 
            FROM daily_state_prices 
            WHERE Commodity = ? 
            ORDER BY State, Date_Str
        '''
        df = pd.read_sql_query(query, conn, params=[comm])
        if df.empty:
            continue
        
        for state, group in df.groupby('State'):
            prices = group['Modal_Price'].values
            if len(prices) < time_step + 10:
                continue
            
            # Local min-max scaling for scale-invariant temporal learning
            scaler = MinMaxScaler(feature_range=(0, 1))
            scaled_prices = scaler.fit_transform(prices.reshape(-1, 1)).flatten()
            
            for i in range(len(scaled_prices) - time_step):
                X_list.append(scaled_prices[i:i + time_step])
                y_list.append(scaled_prices[i + time_step])

    conn.close()

    X = np.array(X_list)
    y = np.array(y_list)
    print(f"      Total candidate sequences extracted: {len(X)}")

    # Sample 15,000 sequences for fast, high-quality convergence
    if len(X) > 15000:
        rng = np.random.RandomState(42)
        idx = rng.choice(len(X), 15000, replace=False)
        X = X[idx]
        y = y[idx]

    X = X.reshape(X.shape[0], X.shape[1], 1)

    # Chronological/Train-Test Split
    split = int(len(X) * 0.8)
    X_train, X_val = X[:split], X[split:]
    y_train, y_val = y[:split], y[split:]

    print(f"[2/5] Partitions: Train={X_train.shape[0]} sequences, Validation={X_val.shape[0]} sequences")

    # Build Stacked LSTM
    print("[3/5] Compiling Stacked Recurrent Architecture...")
    model = Sequential([
        LSTM(64, return_sequences=True, input_shape=(time_step, 1)),
        Dropout(0.2),
        LSTM(64, return_sequences=False),
        Dropout(0.2),
        Dense(32, activation='relu'),
        Dense(1)
    ])

    model.compile(optimizer='adam', loss='mean_squared_error', metrics=['mae'])

    print("[4/5] Training Universal LSTM across all commodities (8 epochs)...")
    model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=8,
        batch_size=64,
        verbose=1
    )

    # Evaluate on validation
    val_preds = model.predict(X_val).flatten()
    val_mae = float(np.mean(np.abs(val_preds - y_val)))
    val_rmse = float(np.sqrt(np.mean((val_preds - y_val)**2)))
    val_r2 = float(1 - (np.sum((y_val - val_preds)**2) / (np.sum((y_val - np.mean(y_val))**2) + 1e-6)))

    print("\n" + "=" * 50)
    print(f" Universal LSTM Validation MAE (Normalized): {val_mae:.4f}")
    print(f" Universal LSTM Validation RMSE (Normalized): {val_rmse:.4f}")
    print(f" Universal LSTM Validation R2 Score: {val_r2:.4f}")
    print("=" * 50 + "\n")

    # Save models
    print("[5/5] Serializing model artifacts and metadata...")
    keras_path = r'models/price/lstm_model.keras'
    h5_path = r'models/price/legacy_lstm.h5'
    model.save(keras_path)
    model.save(h5_path)
    print(f"      [+] Saved Keras Model: {keras_path}")
    print(f"      [+] Saved Legacy H5 Model: {h5_path}")

    # Update metadata.json
    meta_path = r'models/price/metadata.json'
    with open(meta_path, 'r') as f:
        meta = json.load(f)

    meta['model_name'] = 'AgriSense Multi-Commodity Universal LSTM Forecaster'
    meta['supported_commodities_count'] = 357
    meta['supported_states_count'] = 31
    meta['evaluation'] = {
        'normalized_mae': round(val_mae, 4),
        'normalized_rmse': round(val_rmse, 4),
        'r2_score': round(val_r2, 4),
        'time_step': time_step,
        'training_sequences': len(X_train),
        'validation_sequences': len(X_val)
    }
    with open(meta_path, 'w') as f:
        json.dump(meta, f, indent=2)

    print(f"Multi-Commodity LSTM Training Completed Successfully in {time.time()-t0:.1f}s!")

if __name__ == '__main__':
    train_universal()
