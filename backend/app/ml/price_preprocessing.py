import os
import json
import sqlite3
import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.preprocessing import MinMaxScaler
from app.config import DATA_DIR
from app.ml.model_loader import model_loader

DB_PATH = DATA_DIR / "processed" / "price" / "agmarknet_master.db"
HIERARCHY_PATH = DATA_DIR / "processed" / "price" / "hierarchy.json"

_cached_hierarchy = None

def get_hierarchy():
    global _cached_hierarchy
    if _cached_hierarchy is None:
        if os.path.exists(HIERARCHY_PATH):
            with open(HIERARCHY_PATH, "r", encoding="utf-8") as f:
                _cached_hierarchy = json.load(f)
        else:
            _cached_hierarchy = {}
    return _cached_hierarchy

def get_available_commodities_and_markets():
    hierarchy = get_hierarchy()
    commodities = sorted(list(hierarchy.keys()))
    
    return {
        "commodities": commodities,
        "total_commodities": len(commodities),
        "hierarchy": hierarchy
    }

def get_daily_series(commodity="Onion", state=None, market=None):
    if not os.path.exists(DB_PATH):
        raise FileNotFoundError(f"Database not found at {DB_PATH}")

    conn = sqlite3.connect(DB_PATH)
    
    # If both state and market are provided, query market table first
    if state and market and market != "All Markets" and market != "State Average":
        query = '''
            SELECT Date_Str as Arrival_Date_Parsed, Modal_Price, Min_Price, Max_Price
            FROM daily_market_prices
            WHERE Commodity = ? AND State = ? AND Market = ?
            ORDER BY Date_Str ASC
        '''
        df = pd.read_sql_query(query, conn, params=[commodity, state, market])
        if len(df) >= 20:
            conn.close()
            df['Arrival_Date_Parsed'] = pd.to_datetime(df['Arrival_Date_Parsed'])
            return df

    # If market has insufficient rows or not specified, query state average
    if state:
        query = '''
            SELECT Date_Str as Arrival_Date_Parsed, Modal_Price, Min_Price, Max_Price
            FROM daily_state_prices
            WHERE Commodity = ? AND State = ?
            ORDER BY Date_Str ASC
        '''
        df = pd.read_sql_query(query, conn, params=[commodity, state])
        if not df.empty:
            conn.close()
            df['Arrival_Date_Parsed'] = pd.to_datetime(df['Arrival_Date_Parsed'])
            return df

    # Fallback to national commodity average if state has no data
    query = '''
        SELECT Date_Str as Arrival_Date_Parsed, 
               AVG(Modal_Price) as Modal_Price, 
               MIN(Min_Price) as Min_Price, 
               MAX(Max_Price) as Max_Price
        FROM daily_state_prices
        WHERE Commodity = ?
        GROUP BY Date_Str
        ORDER BY Date_Str ASC
    '''
    df = pd.read_sql_query(query, conn, params=[commodity])
    conn.close()
    
    if df.empty:
        raise ValueError(f"No historical arrival data found for commodity '{commodity}'.")
        
    df['Arrival_Date_Parsed'] = pd.to_datetime(df['Arrival_Date_Parsed'])
    return df

def prepare_lstm_input(daily_series, time_step=60):
    prices = daily_series[['Modal_Price']].values
    if len(prices) == 0:
        raise ValueError("Price series is empty.")

    # Local scale transformation to preserve the scale-invariant temporal dynamics
    local_scaler = MinMaxScaler(feature_range=(0, 1))
    
    if len(prices) < time_step:
        # If fewer than 60 points, replicate / pad the earliest available observation smoothly
        pad_needed = time_step - len(prices)
        padded_prices = np.vstack([np.tile(prices[0:1], (pad_needed, 1)), prices])
        scaled = local_scaler.fit_transform(padded_prices)
        recent_prices = padded_prices
    else:
        recent_prices = prices[-time_step:]
        # Fit scaler on recent historical context for accurate inversion
        context_window = prices[-max(time_step, min(len(prices), 180)):]
        local_scaler.fit(context_window)
        scaled = local_scaler.transform(recent_prices)

    tensor = scaled.reshape(1, time_step, 1)
    return tensor, recent_prices, local_scaler
