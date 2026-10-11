import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Activity, 
  HelpCircle, 
  RefreshCw,
  Sliders,
  Scale
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  RadialBarChart, 
  RadialBar, 
  PolarAngleAxis 
} from 'recharts';

import { analyzeRisk } from '../services/api';

export default function RiskAnalysis({
  sharedCommodity = 'Onion',
  sharedState = 'Maharashtra',
  sharedMarket = 'State Average',
  onContextChange
}) {
  const [commodity, setCommodity] = useState(sharedCommodity);
  const [state, setState] = useState(sharedState);
  const [market, setMarket] = useState(sharedMarket);
  const [horizon, setHorizon] = useState(7);

  const [loading, setLoading] = useState(false);
  const [riskData, setRiskData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (sharedCommodity) setCommodity(sharedCommodity);
    if (sharedState) setState(sharedState);
    if (sharedMarket) setMarket(sharedMarket);
  }, [sharedCommodity, sharedState, sharedMarket]);

  const fetchRisk = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await analyzeRisk({
        commodity: commodity || sharedCommodity || 'Onion',
        state: state || sharedState || 'Maharashtra',
        market: (market === 'All Markets' || market === 'State Average' || !market) ? null : market,
        horizon_days: Number(horizon) || 7
      });
      setRiskData(res);
    } catch (err) {
      console.error(err);
      setError("Failed to calculate risk analysis.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRisk();
  }, [commodity, state, market, horizon]);

  const score = riskData?.composite_risk_score || 50;
  const gaugeData = [{ name: 'Risk', value: score, fill: riskData?.risk_color || '#F59E0B' }];

  return (
    <div className="space-y-6">
      {/* Top Banner & Control */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900">Multi-Factor Risk Assessment Engine</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent scoring model synthesizing price volatility, LSTM forecast trends, and market absorption for <strong>{commodity}</strong> ({state} • {market})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select 
            value={horizon}
            onChange={e => setHorizon(Number(e.target.value))}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
          >
            <option value={7}>7-Day Risk Horizon</option>
            <option value={14}>14-Day Risk Horizon</option>
            <option value={21}>21-Day Risk Horizon</option>
            <option value={30}>30-Day Risk Horizon</option>
            <option value={45}>45-Day Risk Horizon</option>
            <option value={60}>60-Day Risk Horizon</option>
          </select>

          <button 
            onClick={fetchRisk}
            disabled={loading}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Risk Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Gauge Card */}
        <div className="bg-white rounded-xl p-6 border border-slate-200/90 shadow-xs flex flex-col items-center justify-between text-center">
          <div className="w-full">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Composite Risk Gauge</span>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
              riskData?.risk_level === 'LOW RISK' ? 'bg-emerald-100 text-emerald-800' :
              riskData?.risk_level === 'MEDIUM RISK' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
            }`}>
              {riskData?.risk_level || 'EVALUATING'}
            </span>
          </div>

          {/* Circular Radial Chart */}
          <div className="relative w-48 h-48 my-4 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart 
                cx="50%" 
                cy="50%" 
                innerRadius="75%" 
                outerRadius="100%" 
                barSize={14} 
                data={gaugeData} 
                startAngle={210} 
                endAngle={-30}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background={{ fill: '#f1f5f9' }} dataKey="value" cornerRadius={10} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-slate-900">{score}</span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">out of 100</span>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200 text-left w-full">
            {riskData?.guidance || "Evaluating risk factors..."}
          </p>
        </div>

        {/* Risk Factor Breakdown */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Deterministic Risk Factor Breakdown</h4>
              <p className="text-xs text-slate-500">Each signal is normalized to [0, 100] before weighted synthesis</p>
            </div>
            <Scale className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="space-y-4">
            {(riskData?.risk_factors || []).map((factor, i) => (
              <div key={i} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{factor.name}</span>
                    <span className="text-[10px] text-slate-400">({factor.weight * 100}% Weight)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-500 text-[11px]">{factor.raw_value}</span>
                    <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                      Score: {factor.normalized_score}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      factor.normalized_score > 65 ? 'bg-red-500' :
                      factor.normalized_score > 35 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, factor.normalized_score)}%` }}
                  />
                </div>

                <p className="text-[11px] text-slate-500">{factor.description}</p>
              </div>
            ))}
          </div>

          {/* Formula Callout */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-lg text-xs text-emerald-900">
            <span className="font-semibold block mb-0.5">Mathematical Aggregation Formula:</span>
            <code className="text-[11px] font-mono text-emerald-800">{riskData?.mathematical_formula}</code>
          </div>
        </div>
      </div>
    </div>
  );
}
