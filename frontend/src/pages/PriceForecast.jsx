import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  RefreshCw, 
  AlertCircle,
  MapPin,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend, 
  Area, 
  ComposedChart 
} from 'recharts';

import { 
  predictPrice, 
  getPriceHistory, 
  getCommodities, 
  getCommodityStates, 
  getCommodityMarkets 
} from '../services/api';

export default function PriceForecast({ 
  setActiveTab, 
  sharedCommodity = 'Onion', 
  sharedState = 'Maharashtra', 
  sharedMarket = 'All Markets (State Avg)',
  onContextChange 
}) {
  // Master lists
  const [commodityList, setCommodityList] = useState([]);
  const [stateList, setStateList] = useState([]);
  const [marketList, setMarketList] = useState([]);

  // Selections
  const [commodity, setCommodity] = useState(sharedCommodity);
  const [state, setState] = useState(sharedState);
  const [market, setMarket] = useState(sharedMarket);
  const [horizon, setHorizon] = useState(7);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [forecastResult, setForecastResult] = useState(null);
  const [historyResult, setHistoryResult] = useState([]);
  const [error, setError] = useState(null);

  // Key staple crops to pin at the top of selector
  const stapleCrops = [
    'Onion', 'Potato', 'Tomato', 'Wheat', 'Rice', 'Cotton', 
    'Green Chilli', 'Banana', 'Apple', 'Garlic', 'Maize', 'Brinjal', 'Soyabean', 'Gram Raw(Chhala)'
  ];

  // 1. Initial Load: Fetch all 357 Commodities
  useEffect(() => {
    getCommodities()
      .then(res => {
        const comms = res?.price_forecasting?.commodities || [];
        setCommodityList(comms);
        if (sharedCommodity && comms.includes(sharedCommodity)) {
          setCommodity(sharedCommodity);
        } else if (comms.includes('Onion')) {
          setCommodity('Onion');
        } else if (comms.length > 0) {
          setCommodity(comms[0]);
        }
      })
      .catch(console.error);
  }, []);

  // 2. Cascade: When Commodity Changes, load available States
  useEffect(() => {
    if (!commodity) return;
    getCommodityStates(commodity)
      .then(res => {
        const states = res?.states || [];
        setStateList(states);
        if (states.includes(state)) {
          // retain current state
        } else if (states.length > 0) {
          setState(states[0]);
        }
      })
      .catch(console.error);
  }, [commodity]);

  // 3. Cascade: When State Changes, load available Markets in that State
  useEffect(() => {
    if (!commodity || !state) return;
    getCommodityMarkets(commodity, state)
      .then(res => {
        const mkts = res?.markets || ['State Average'];
        setMarketList(mkts);
        // Default to first real market or State Average
        const defaultMkt = mkts.length > 1 ? mkts[1] : mkts[0];
        setMarket(defaultMkt);
      })
      .catch(console.error);
  }, [commodity, state]);

  // Sync back to Header & App context
  useEffect(() => {
    if (onContextChange && commodity && state) {
      onContextChange(commodity, state, market);
    }
  }, [commodity, state, market]);

  // Trigger forecast whenever user requests or on initial ready
  const handleExecuteForecast = async () => {
    if (!commodity || !state) return;
    setLoading(true);
    setError(null);
    try {
      const targetMarket = (market === 'State Average' || market === 'All Markets') ? null : market;
      const [forecastRes, histRes] = await Promise.all([
        predictPrice({
          commodity,
          state,
          market: targetMarket,
          horizon_days: horizon
        }),
        getPriceHistory({
          commodity,
          state,
          market: targetMarket,
          limit: 90
        })
      ]);

      setForecastResult(forecastRes);
      setHistoryResult(histRes?.history || []);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.detail || "Failed to execute Universal LSTM inference.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (commodity && state) {
      handleExecuteForecast();
    }
  }, [commodity, state, market, horizon]);

  // Filtered commodity list based on user search term
  const filteredCommodities = commodityList.filter(c => 
    c.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Available staple crops that exist in current dataset
  const availableStaples = stapleCrops.filter(c => commodityList.includes(c));
  const remainingCommodities = filteredCommodities.filter(c => !availableStaples.includes(c));

  // Build sequential plot data combining history and recursive forecast
  const combinedData = [];
  historyResult.slice(-40).forEach(h => {
    combinedData.push({
      date: h.date,
      displayDate: h.date.slice(5),
      actualPrice: h.modal_price,
      minPrice: h.min_price,
      maxPrice: h.max_price,
      predictedPrice: null,
      confidenceLower: null,
      confidenceUpper: null,
    });
  });

  const lastObs = combinedData.length > 0 ? combinedData[combinedData.length - 1] : null;

  (forecastResult?.forecasts || []).forEach((f, idx) => {
    combinedData.push({
      date: f.date,
      displayDate: f.date.slice(5),
      actualPrice: idx === 0 && lastObs ? lastObs.actualPrice : null,
      minPrice: null,
      maxPrice: null,
      predictedPrice: f.predicted_modal_price,
      confidenceLower: f.confidence_band?.lower,
      confidenceUpper: f.confidence_band?.upper,
    });
  });

  return (
    <div className="space-y-6">
      {/* Top Controls Card: Dynamic Cascading Selectors */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <Layers className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">National Agricultural Price Forecasting Engine</h3>
              <p className="text-xs text-slate-500">
                Trained on 10-Year AGMARKNET records • 357 Commodities • 31 States & UTs • All APMC Mandis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-400">Quick Filter:</span>
            <input 
              type="text"
              placeholder="Search crop (e.g. Tomato, Cotton, Wheat)..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-56"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* 1. All Commodities */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Commodity</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold">
                {commodityList.length} crops
              </span>
            </label>
            <select 
              value={commodity} 
              onChange={e => setCommodity(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 hover:bg-slate-100/80 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition cursor-pointer"
            >
              {searchTerm === '' && availableStaples.length > 0 && (
                <optgroup label="⭐ Major Staple Crops">
                  {availableStaples.map(c => (
                    <option key={`staple-${c}`} value={c}>{c}</option>
                  ))}
                </optgroup>
              )}
              <optgroup label={searchTerm ? `Matching Crops (${filteredCommodities.length})` : "All 357 Commodities (A-Z)"}>
                {remainingCommodities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* 2. All States for Selected Commodity */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>State / Province</span>
              <span className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded font-semibold">
                {stateList.length} states
              </span>
            </label>
            <select 
              value={state} 
              onChange={e => setState(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 hover:bg-slate-100/80 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition cursor-pointer"
            >
              {stateList.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* 3. All APMC Mandi Markets for that State */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>APMC Mandi Market</span>
              <span className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded font-semibold">
                {marketList.length} mandis
              </span>
            </label>
            <select 
              value={market} 
              onChange={e => setMarket(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 hover:bg-slate-100/80 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition cursor-pointer"
            >
              {marketList.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* 4. Forecast Horizon */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Forecast Horizon</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold">
                {horizon} Days
              </span>
            </label>
            <select 
              value={horizon} 
              onChange={e => setHorizon(Number(e.target.value))}
              className="w-full text-xs font-semibold bg-slate-50 hover:bg-slate-100/80 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition cursor-pointer"
            >
              <option value={7}>7 Days Ahead (Weekly)</option>
              <option value={14}>14 Days Ahead (Fortnightly)</option>
              <option value={21}>21 Days Ahead (3-Week)</option>
              <option value={30}>30 Days Ahead (Monthly)</option>
              <option value={45}>45 Days Ahead (6-Week)</option>
              <option value={60}>60 Days Ahead (Bi-Monthly)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Active Target: <strong>{commodity}</strong> in <strong>{state}</strong> ({market})</span>
          </div>

          <button 
            onClick={handleExecuteForecast}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition shadow-sm"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <TrendingUp className="w-3.5 h-3.5" />}
            <span>Run Universal LSTM Forecast</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Prediction & Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Forecast Interactive Chart */}
        <div className="lg:col-span-3 bg-white rounded-xl p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {commodity} Price Forecasting ({state} • {market})
              </h3>
              <p className="text-xs text-slate-500">
                Universal Stacked LSTM Model • AGMARKNET Mandi Records (Rs./Quintal) • {horizon}-Day Autoregressive Rollout
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 bg-slate-100 font-semibold rounded-md text-slate-700">
                Horizon: {horizon} Days
              </span>
              <span className={`px-2.5 py-1 font-bold rounded-md ${
                forecastResult?.predicted_trend === 'BULLISH' ? 'bg-emerald-100 text-emerald-800' :
                forecastResult?.predicted_trend === 'BEARISH' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-800'
              }`}>
                {forecastResult?.predicted_trend} TREND
              </span>
            </div>
          </div>

          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={combinedData} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="displayDate" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip 
                  formatter={(val, name) => [
                    val ? `Rs. ${val}` : 'N/A', 
                    name === 'actualPrice' ? 'Historical Modal Price' :
                    name === 'predictedPrice' ? 'LSTM Autoregressive Price' : name
                  ]}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                
                {/* Confidence Area */}
                <Area 
                  type="monotone" 
                  dataKey="confidenceUpper" 
                  stroke="none" 
                  fill="#16A34A" 
                  fillOpacity={0.12} 
                  name="Confidence Band (±6%)"
                />
                
                {/* Observed Historical Price */}
                <Line 
                  type="monotone" 
                  dataKey="actualPrice" 
                  stroke="#1E293B" 
                  strokeWidth={2} 
                  dot={{ r: 2.5 }} 
                  name="Observed Mandi Price" 
                />

                {/* LSTM Prediction */}
                <Line 
                  type="monotone" 
                  dataKey="predictedPrice" 
                  stroke="#16A34A" 
                  strokeWidth={2.5} 
                  strokeDasharray="5 5" 
                  dot={{ r: 4, fill: '#16A34A' }} 
                  name="LSTM Rollout Forecast" 
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-lg text-xs text-emerald-900 flex items-center justify-between">
            <span className="leading-relaxed">
              <strong>Scale-Invariant Inference:</strong> Universal LSTM applies local normalization on the observed 60-day window of {commodity} in {market}, projecting continuous temporal momentum forward.
            </span>
            <button 
              onClick={() => setActiveTab('explainability')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline shrink-0 ml-4"
            >
              Inspect Temporal SHAP Attributions →
            </button>
          </div>
        </div>

        {/* Prediction Breakdown Sidebar */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Model Telemetry</h4>
            
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Current Observed Price</span>
                <span className="text-lg font-bold text-slate-900">Rs.{forecastResult?.last_observed_price}</span>
                <span className="text-[10px] text-slate-400 block">{forecastResult?.last_observed_date}</span>
              </div>

              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <span className="text-[11px] text-emerald-700 block font-medium">Terminal Forecast (Day +{horizon})</span>
                <span className="text-xl font-black text-emerald-900">
                  Rs.{forecastResult?.forecasts?.[forecastResult?.forecasts?.length - 1]?.predicted_modal_price || '--'}
                </span>
                <span className="text-xs font-semibold text-emerald-700 block">
                  {forecastResult?.predicted_pct_change > 0 ? '+' : ''}{forecastResult?.predicted_pct_change}% expected delta
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Selected Jurisdiction</span>
                <span className="text-xs font-bold text-slate-800">{commodity} • {state}</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">{market} APMC Mandi</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <h5 className="text-[11px] font-bold text-slate-700 mb-2">Daily Projected Timeline</h5>
            <div className="max-h-40 overflow-y-auto space-y-1 text-xs pr-1">
              {(forecastResult?.forecasts || []).map((f) => (
                <div key={f.step} className="flex items-center justify-between py-1 border-b border-slate-100 text-[11px]">
                  <span className="text-slate-500">Day +{f.step} ({f.date.slice(5)})</span>
                  <span className="font-bold text-slate-800">Rs.{f.predicted_modal_price}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
