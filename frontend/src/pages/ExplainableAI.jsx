import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  Layers, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  TrendingUp,
  BarChart2,
  HelpCircle,
  FileText
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Cell, 
  ReferenceLine 
} from 'recharts';

import { 
  getPriceGlobalSHAP, 
  getDemandGlobalSHAP, 
  getDemandLocalSHAP 
} from '../services/api';

export default function ExplainableAI() {
  const [activeTab, setActiveTab] = useState('demand'); // 'demand' or 'price'
  
  // Demand SHAP state
  const [demandGlobal, setDemandGlobal] = useState(null);
  const [demandLocal, setDemandLocal] = useState(null);
  const [loadingDemand, setLoadingDemand] = useState(false);

  // Price LSTM SHAP state
  const [priceTemporal, setPriceTemporal] = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(false);

  useEffect(() => {
    fetchDemandExplains();
    fetchPriceExplains();
  }, []);

  const fetchDemandExplains = async () => {
    setLoadingDemand(true);
    try {
      const [glob, loc] = await Promise.all([
        getDemandGlobalSHAP(),
        getDemandLocalSHAP({
          state: 'Maharashtra',
          district: 'Nashik',
          market: 'Lasalgaon',
          commodity: 'Onion',
          modal_price: 2500,
          crop_seasonality_index: 1.15,
          festival_multiplier: 1.2
        })
      ]);
      setDemandGlobal(glob);
      setDemandLocal(loc);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDemand(false);
    }
  };

  const fetchPriceExplains = async () => {
    setLoadingPrice(true);
    try {
      const res = await getPriceGlobalSHAP();
      setPriceTemporal(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPrice(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher & Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">Explainable AI & Attribution Framework</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Shapley Additive Explanations (SHAP) grounding black-box forecasts in cooperative game theory
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setActiveTab('demand')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md transition ${
              activeTab === 'demand' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>XGBoost Demand (TreeExplainer)</span>
          </button>
          <button
            onClick={() => setActiveTab('price')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md transition ${
              activeTab === 'price' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>LSTM Temporal (GradientExplainer)</span>
          </button>
        </div>
      </div>

      {/* TAB 1: XGBoost SHAP (TreeExplainer) */}
      {activeTab === 'demand' && (
        <div className="space-y-6">
          {/* Top Explanation Banner */}
          <div className="bg-white rounded-xl p-6 border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Local Prediction Attribution</span>
              <span className="text-xs font-mono bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded font-semibold">
                Base ({demandLocal?.expected_baseline}) + Sum(SHAP) = Predicted ({demandLocal?.predicted_value})
              </span>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
              {demandLocal?.narrative_explanation || "Loading natural language explanation..."}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[10px]">Expected Baseline</span>
                <span className="font-bold text-slate-800 text-sm">{demandLocal?.expected_baseline}</span>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-100">
                <span className="text-emerald-700 block text-[10px]">Model Output</span>
                <span className="font-bold text-emerald-900 text-sm">{demandLocal?.predicted_value}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[10px]">Net SHAP Contribution</span>
                <span className="font-bold text-slate-800 text-sm">{demandLocal?.sum_of_shap}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[10px]">Attribution Integrity</span>
                <span className="font-bold text-emerald-700 text-sm flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Exact Additive
                </span>
              </div>
            </div>
          </div>

          {/* Feature Breakdown Table & Global Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Global Feature Ranking Chart */}
            <div className="bg-white rounded-xl p-6 border border-slate-200/90 shadow-xs">
              <h4 className="text-sm font-bold text-slate-900 mb-1">Global Feature Importance (TreeExplainer)</h4>
              <p className="text-xs text-slate-500 mb-4">Mean absolute SHAP value across 300 held-out test evaluations</p>

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    layout="vertical"
                    data={(demandGlobal?.feature_ranking || []).slice(0, 10).reverse()}
                    margin={{ top: 5, right: 20, left: 60, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <YAxis dataKey="feature" type="category" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <Tooltip 
                      formatter={(val) => [`${val}`, 'Mean |SHAP|']}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                    />
                    <Bar dataKey="mean_abs_shap" fill="#16A34A" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Local Feature Contributions Table */}
            <div className="bg-white rounded-xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">Individual Prediction Decomposition</h4>
                <p className="text-xs text-slate-500 mb-3">Feature impacts for target: Onion in Lasalgaon, Maharashtra</p>

                <div className="overflow-x-auto max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="py-2 px-3 font-semibold">Feature</th>
                        <th className="py-2 px-3 font-semibold">Raw Value</th>
                        <th className="py-2 px-3 font-semibold text-right">SHAP Impact</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(demandLocal?.contributions || []).map((c, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-medium text-slate-800">{c.feature}</td>
                          <td className="py-2 px-3 text-slate-500">{String(c.raw_value)}</td>
                          <td className={`py-2 px-3 text-right font-bold ${
                            c.shap_value > 0 ? 'text-emerald-600' : 'text-red-600'
                          }`}>
                            {c.shap_value > 0 ? '+' : ''}{c.shap_value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-600"></span> Positive Driver</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-600"></span> Negative Driver</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LSTM SHAP (GradientExplainer) */}
      {activeTab === 'price' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Temporal Memory Attribution</span>
              <span className="text-xs font-semibold bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded">
                Algorithm: GradientExplainer (60 Timesteps)
              </span>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
              {priceTemporal?.narrative_explanation || "Loading LSTM temporal gradient attributions..."}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <span className="text-emerald-700 block text-[10px] font-bold">Short-Term Memory (Lags 1-7 Days)</span>
                <span className="font-bold text-emerald-950 text-base">
                  {priceTemporal?.memory_partition_impact?.short_term_days_1_to_7 || 0}
                </span>
                <span className="text-[10px] text-emerald-600 block mt-0.5">Captures immediate shock persistence</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[10px] font-bold">Medium-Term Momentum (Lags 8-30 Days)</span>
                <span className="font-bold text-slate-900 text-base">
                  {priceTemporal?.memory_partition_impact?.medium_term_days_8_to_30 || 0}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Captures cyclical mandi waves</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[10px] font-bold">Long-Term Baseline (Lags 31-60 Days)</span>
                <span className="font-bold text-slate-900 text-base">
                  {priceTemporal?.memory_partition_impact?.long_term_days_31_to_60 || 0}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Anchors structural seasonal floor</span>
              </div>
            </div>
          </div>

          {/* Temporal Attribution Bar Chart */}
          <div className="bg-white rounded-xl p-6 border border-slate-200/90 shadow-xs">
            <h4 className="text-sm font-bold text-slate-900 mb-1">Lag Attribution Spectrum (t-60 to t-1)</h4>
            <p className="text-xs text-slate-500 mb-4">
              SHAP gradient contribution of each prior calendar day towards the next modal price prediction
            </p>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={priceTemporal?.temporal_series || []}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="lag_days_ago" tick={{ fontSize: 10 }} stroke="#94a3b8" label={{ value: 'Days Prior (Lag)', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <Tooltip 
                    formatter={(val, name, props) => [
                      `${val} (Observed: Rs.${props.payload.observed_price})`, 
                      'SHAP Gradient Attribution'
                    ]}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                  />
                  <ReferenceLine y={0} stroke="#94a3b8" />
                  <Bar dataKey="shap_attribution">
                    {(priceTemporal?.temporal_series || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.shap_attribution > 0 ? '#16A34A' : '#DC2626'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-600 rounded-xs"></span> Positive Gradient (Pushes Price Up)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-red-600 rounded-xs"></span> Negative Gradient (Pulls Price Down)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
