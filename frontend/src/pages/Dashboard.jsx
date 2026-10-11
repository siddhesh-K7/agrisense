import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  BarChart2, 
  ShieldCheck, 
  Compass, 
  ArrowUpRight, 
  RefreshCw,
  Sparkles,
  Layers
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

import StatCard from '../components/common/StatCard';
import { 
  predictPrice, 
  predictDemand, 
  analyzeRisk, 
  generateRecommendation,
  getCommodities,
  getCommodityStates
} from '../services/api';

export default function Dashboard({ 
  setActiveTab, 
  sharedCommodity = 'Onion', 
  sharedState = 'Maharashtra', 
  onContextChange 
}) {
  const [commodity, setCommodity] = useState(sharedCommodity);
  const [state, setState] = useState(sharedState);
  const [commodityList, setCommodityList] = useState([]);
  const [stateList, setStateList] = useState([]);

  const [loading, setLoading] = useState(true);
  const [priceData, setPriceData] = useState(null);
  const [demandData, setDemandData] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [error, setError] = useState(null);

  // Load commodities on mount
  useEffect(() => {
    getCommodities()
      .then(res => {
        const comms = res?.price_forecasting?.commodities || [];
        setCommodityList(comms);
      })
      .catch(console.error);
  }, []);

  // Update states when commodity changes
  useEffect(() => {
    if (!commodity) return;
    getCommodityStates(commodity)
      .then(res => {
        const states = res?.states || [];
        setStateList(states);
        if (states.includes(state)) {
          // keep state
        } else if (states.length > 0) {
          setState(states[0]);
        }
      })
      .catch(console.error);
  }, [commodity]);

  // Sync to parent Header
  useEffect(() => {
    if (onContextChange && commodity && state) {
      onContextChange(commodity, state, null);
    }
  }, [commodity, state]);

  const fetchDashboardData = async () => {
    if (!commodity) return;
    setLoading(true);
    setError(null);
    try {
      const [priceRes, demandRes, riskRes, recRes] = await Promise.all([
        predictPrice({ commodity, state, horizon_days: 7 }),
        predictDemand({ state: state || 'Maharashtra', commodity: commodity, modal_price: 2200 }),
        analyzeRisk({ commodity, state, horizon_days: 7 }),
        generateRecommendation({ commodity, state, horizon_days: 7 })
      ]);

      setPriceData(priceRes);
      setDemandData(demandRes);
      setRiskData(riskRes);
      setRecommendation(recRes);
    } catch (err) {
      console.error(err);
      setError("Unable to load dashboard telemetry. Please ensure the backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [commodity, state]);

  // Combined chart dataset for recent price + forecast
  const chartHistory = (priceData?.recent_history || []).slice(-20).map(h => ({
    date: h.date.slice(5),
    actualPrice: h.modal_price,
    forecastPrice: null
  }));

  const lastActual = chartHistory.length > 0 ? chartHistory[chartHistory.length - 1] : null;

  const chartForecast = (priceData?.forecasts || []).map((f, idx) => ({
    date: f.date.slice(5),
    actualPrice: idx === 0 && lastActual ? lastActual.actualPrice : null,
    forecastPrice: f.predicted_modal_price
  }));

  const priceChartData = [...chartHistory, ...chartForecast];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="gradient-forest rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-500/30 text-emerald-200 rounded-full border border-emerald-400/30 uppercase tracking-wider">
            All-India Multi-Commodity Intelligence Core
          </span>
          <h2 className="text-2xl font-bold mt-2">AgriSense Executive Dashboard</h2>
          <p className="text-sm text-emerald-100/90 max-w-2xl mt-1 leading-relaxed">
            350+ Commodities and 30+ States supported. Multi-model framework integrating Universal Stacked LSTM price rollout with gradient-boosted demand modeling and game-theoretic SHAP attributions.
          </p>
        </div>

        {/* Global Quick Selector */}
        <div className="flex flex-wrap items-center gap-2 bg-emerald-950/60 p-2 rounded-xl border border-emerald-700/50">
          <select 
            value={commodity} 
            onChange={e => setCommodity(e.target.value)}
            className="text-xs font-bold bg-[#123B2A] text-white border border-emerald-500/50 rounded-lg p-2 max-w-[160px]"
          >
            {commodityList.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select 
            value={state} 
            onChange={e => setState(e.target.value)}
            className="text-xs font-bold bg-[#123B2A] text-white border border-emerald-500/50 rounded-lg p-2"
          >
            {stateList.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <button 
            onClick={fetchDashboardData}
            className="flex items-center gap-1.5 px-3 py-2 bg-white text-[#123B2A] text-xs font-bold rounded-lg hover:bg-emerald-50 transition shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Update</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title={`${commodity} LSTM Price`}
          value={`Rs.${priceData?.forecasts?.[0]?.predicted_modal_price || '--'}`}
          badge={priceData?.predicted_trend}
          subtitle={`Prev: Rs.${priceData?.last_observed_price} (${priceData?.predicted_pct_change > 0 ? '+' : ''}${priceData?.predicted_pct_change}%)`}
          icon={TrendingUp}
          color={priceData?.predicted_pct_change >= 0 ? "emerald" : "amber"}
        />

        <StatCard 
          title="XGBoost Demand Index"
          value={demandData?.predicted_demand_index || '--'}
          badge={demandData?.demand_level}
          subtitle="Destination Absorption Metric"
          icon={BarChart2}
          color="blue"
        />

        <StatCard 
          title="Risk Assessment"
          value={`${riskData?.composite_risk_score} / 100`}
          badge={riskData?.risk_level}
          subtitle={riskData?.risk_factors?.[0]?.raw_value + " 30d Volatility"}
          icon={ShieldCheck}
          color={riskData?.composite_risk_score > 65 ? "red" : (riskData?.composite_risk_score > 35 ? "amber" : "emerald")}
        />

        <StatCard 
          title="Decision Support Action"
          value={recommendation?.action || '--'}
          badge={`${recommendation?.confidence_level} Confidence`}
          subtitle={`Net Exp: ${recommendation?.economic_metrics?.net_gain_per_qtl > 0 ? '+' : ''}Rs.${recommendation?.economic_metrics?.net_gain_per_qtl}/Qtl`}
          icon={Compass}
          color={recommendation?.action === "STORE" ? "emerald" : (recommendation?.action === "SELL" ? "red" : "amber")}
        />
      </div>

      {/* Main Charts & Telemetry Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Price Trajectory Line Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {commodity} Historical Mandi Prices vs 7-Day LSTM Rollout
              </h3>
              <p className="text-xs text-slate-500">
                State: {state} • Agmarknet APMC Modal Prices (Rs./Quintal)
              </p>
            </div>
            <button 
              onClick={() => setActiveTab('price')} 
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>Explore All Markets</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip 
                  formatter={(value, name) => [
                    value ? `Rs. ${value}` : 'N/A', 
                    name === 'actualPrice' ? 'Observed Agmarknet Price' : 'Universal LSTM Forecast'
                  ]}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="actualPrice" 
                  stroke="#1E293B" 
                  strokeWidth={2} 
                  dot={{ r: 2.5 }} 
                  name="actualPrice" 
                  connectNulls={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="forecastPrice" 
                  stroke="#16A34A" 
                  strokeWidth={2.5} 
                  strokeDasharray="4 4" 
                  dot={{ r: 4, fill: '#16A34A' }} 
                  name="forecastPrice" 
                  connectNulls={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-slate-900 inline-block"></span> Observed Modal Price</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-emerald-600 inline-block border-b border-dashed"></span> Universal LSTM Rollout</span>
            </div>
            <span className="font-medium text-emerald-800">Target Horizon: 7 Days</span>
          </div>
        </div>

        {/* Right: Decision Support & Risk Card */}
        <div className="bg-white rounded-xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Decision Support Advisory</h3>
              <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                recommendation?.action === 'STORE' ? 'bg-emerald-100 text-emerald-800' :
                recommendation?.action === 'SELL' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {recommendation?.action}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
              {recommendation?.decision_summary}
            </p>

            <div className="mt-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Recommended Policy</span>
                <span className="font-semibold text-slate-800">{recommendation?.action} PRODUCE</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Projected Price Delta</span>
                <span className={`font-semibold ${recommendation?.economic_metrics?.gross_price_change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {recommendation?.economic_metrics?.gross_price_change >= 0 ? '+' : ''}Rs.{recommendation?.economic_metrics?.gross_price_change}/Qtl
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Storage Expense Allowance</span>
                <span className="font-semibold text-slate-800">Rs.{recommendation?.economic_metrics?.estimated_storage_cost_per_qtl}/Qtl</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Net Expected Margin</span>
                <span className="font-bold text-emerald-700">Rs.{recommendation?.economic_metrics?.net_gain_per_qtl}/Qtl</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100">
            <button 
              onClick={() => setActiveTab('recommendations')}
              className="w-full py-2 px-3 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>Explore Decision Matrix & Rules</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
