import React, { useState, useEffect } from 'react';
import { 
  BarChart2, 
  Sliders, 
  TrendingUp, 
  RefreshCw, 
  Info, 
  HelpCircle,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine 
} from 'recharts';

import { predictDemand, getDemandHistory } from '../services/api';

export default function DemandForecast({ setActiveTab }) {
  // Model Feature Inputs
  const [commodity, setCommodity] = useState('Onion');
  const [state, setState] = useState('Maharashtra');
  const [district, setDistrict] = useState('Nashik');
  const [market, setMarket] = useState('Lasalgaon');
  const [modalPrice, setModalPrice] = useState(2500);
  const [minPrice, setMinPrice] = useState(2000);
  const [maxPrice, setMaxPrice] = useState(3000);
  const [seasonalityIndex, setSeasonalityIndex] = useState(1.15);
  const [festivalMultiplier, setFestivalMultiplier] = useState(1.20);
  const [growthFactor, setGrowthFactor] = useState(1.03);

  const [loading, setLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [historyResult, setHistoryResult] = useState([]);
  const [error, setError] = useState(null);

  const executeDemandInference = async () => {
    setLoading(true);
    setError(null);
    try {
      const [predRes, histRes] = await Promise.all([
        predictDemand({
          state,
          district,
          market,
          commodity,
          modal_price: Number(modalPrice),
          min_price: Number(minPrice),
          max_price: Number(maxPrice),
          crop_seasonality_index: Number(seasonalityIndex),
          festival_multiplier: Number(festivalMultiplier),
          annual_growth_factor: Number(growthFactor)
        }),
        getDemandHistory({ commodity, state, limit: 30 })
      ]);

      setPredictionResult(predRes);
      setHistoryResult(histRes?.history || []);
    } catch (err) {
      console.error(err);
      setError("Failed to run XGBoost demand inference.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeDemandInference();
  }, []);

  const historyChartData = (historyResult || []).map((h, i) => ({
    name: `Obs ${i + 1}`,
    date: h.date,
    demandIndex: h.simulated_demand_index,
    price: h.modal_price
  }));

  return (
    <div className="space-y-6">
      {/* Parameter Controls Panel */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">XGBoost Demand Feature Synthesis & Predictor</h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
            20 Feature Standardized Vector
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Commodity Target</label>
            <select 
              value={commodity} 
              onChange={e => setCommodity(e.target.value)}
              className="w-full font-medium bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
            >
              <option value="Onion">Onion</option>
              <option value="Potato">Potato</option>
              <option value="Tomato">Tomato</option>
              <option value="Wheat">Wheat</option>
              <option value="Rice">Rice</option>
              <option value="Cotton">Cotton</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">State Jurisdiction</label>
            <select 
              value={state} 
              onChange={e => setState(e.target.value)}
              className="w-full font-medium bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
            >
              <option value="Maharashtra">Maharashtra</option>
              <option value="Uttar Pradesh">Uttar Pradesh</option>
              <option value="Gujarat">Gujarat</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Madhya Pradesh">Madhya Pradesh</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">APMC Market / Node</label>
            <input 
              type="text" 
              value={market} 
              onChange={e => setMarket(e.target.value)}
              className="w-full font-medium bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Real Modal Price (Rs./Qtl)</label>
            <input 
              type="number" 
              value={modalPrice} 
              onChange={e => setModalPrice(e.target.value)}
              className="w-full font-medium bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
            />
          </div>
        </div>

        {/* Sliders for Market Elasticity & Seasonality */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 border-t border-slate-100">
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-600">Crop Seasonality Index</span>
              <span className="text-emerald-700">{seasonalityIndex}</span>
            </div>
            <input 
              type="range" 
              min="0.5" 
              max="2.0" 
              step="0.05"
              value={seasonalityIndex} 
              onChange={e => setSeasonalityIndex(e.target.value)}
              className="w-full accent-emerald-600"
            />
            <span className="text-[10px] text-slate-400">Peak harvesting season multiplier</span>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-600">Festival Demand Multiplier</span>
              <span className="text-emerald-700">{festivalMultiplier}</span>
            </div>
            <input 
              type="range" 
              min="0.8" 
              max="2.5" 
              step="0.05"
              value={festivalMultiplier} 
              onChange={e => setFestivalMultiplier(e.target.value)}
              className="w-full accent-emerald-600"
            />
            <span className="text-[10px] text-slate-400">Festive surge procurement factor</span>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-600">Annual Growth Factor</span>
              <span className="text-emerald-700">{growthFactor}</span>
            </div>
            <input 
              type="range" 
              min="0.9" 
              max="1.2" 
              step="0.01"
              value={growthFactor} 
              onChange={e => setGrowthFactor(e.target.value)}
              className="w-full accent-emerald-600"
            />
            <span className="text-[10px] text-slate-400">Year-on-year macroeconomic shift</span>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button 
            onClick={executeDemandInference}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition shadow-xs"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <BarChart2 className="w-3.5 h-3.5" />}
            <span>Compute XGBoost Demand Index</span>
          </button>
        </div>
      </div>

      {/* Demand Results Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Result Card */}
        <div className="bg-white rounded-xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Predicted Demand Index</span>
            <div className="flex items-baseline gap-3 my-2">
              <span className="text-4xl font-extrabold text-slate-900">
                {predictionResult?.predicted_demand_index || '--'}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                predictionResult?.demand_level === 'HIGH' || predictionResult?.demand_level === 'VERY HIGH' 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {predictionResult?.demand_level}
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Target variable: <code>simulated_demand_index</code>. Evaluated against unseen test set baseline mean of ~108.55 (test R² = 0.6425).
            </p>

            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Test Evaluation MAE</span>
                <span className="font-semibold text-slate-800">7.76 units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Test Evaluation RMSE</span>
                <span className="font-semibold text-slate-800">10.24 units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Variance Explained (R²)</span>
                <span className="font-semibold text-emerald-700">64.25%</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100">
            <button 
              onClick={() => setActiveTab('explainability')}
              className="w-full py-2 px-3 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition flex items-center justify-center gap-1.5"
            >
              <span>Explain With SHAP Waterfall</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Historical Demand Benchmark Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Historical Demand Benchmark Index Sample</h4>
              <p className="text-xs text-slate-500">Recorded demand metrics across sample arrivals for {commodity}</p>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
              Mean Benchmark: 108.5
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis domain={[40, 160]} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <Tooltip 
                  formatter={(val) => [`${val} Index`, 'Demand Metric']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <ReferenceLine y={108.55} stroke="#DC2626" strokeDasharray="3 3" label={{ value: 'Baseline', fill: '#DC2626', fontSize: 10 }} />
                <Bar dataKey="demandIndex" fill="#16A34A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Academic Transparency Alert */}
          <div className="mt-3 p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-[11px] text-amber-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Academic Transparency Disclosure:</strong> This dataset utilizes a simulated destination demand index generated via synthetic econometric elasticity functions. It is labeled as <code>simulated_demand_index</code> to preserve research integrity and avoid misrepresenting proxy metrics as physical consumption.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
