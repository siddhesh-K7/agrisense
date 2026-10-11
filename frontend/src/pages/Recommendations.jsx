import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  Package, 
  TrendingDown, 
  PauseCircle, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  Coins
} from 'lucide-react';

import { generateRecommendation } from '../services/api';

export default function Recommendations({
  sharedCommodity = 'Onion',
  sharedState = 'Maharashtra',
  sharedMarket = 'State Average',
  onContextChange
}) {
  const [commodity, setCommodity] = useState(sharedCommodity);
  const [state, setState] = useState(sharedState);
  const [market, setMarket] = useState(sharedMarket);
  const [horizon, setHorizon] = useState(7);
  const [storageCost, setStorageCost] = useState(50);

  const [loading, setLoading] = useState(false);
  const [recData, setRecData] = useState(null);
  const [error, setError] = useState(null);

  // Sync when parent props change
  useEffect(() => {
    if (sharedCommodity) setCommodity(sharedCommodity);
    if (sharedState) setState(sharedState);
    if (sharedMarket) setMarket(sharedMarket);
  }, [sharedCommodity, sharedState, sharedMarket]);

  const fetchRecommendation = async () => {
    setLoading(true);
    setError(null);
    try {
      const parsedCost = isNaN(parseFloat(storageCost)) ? 50.0 : Math.max(0, parseFloat(storageCost));
      const res = await generateRecommendation({
        commodity: commodity || sharedCommodity || 'Onion',
        state: state || sharedState || 'Maharashtra',
        market: (market === 'All Markets' || market === 'State Average' || !market) ? null : market,
        horizon_days: Number(horizon) || 7,
        estimated_storage_cost_per_qtl: parsedCost
      });
      setRecData(res);
    } catch (err) {
      console.error(err);
      setError("Failed to generate recommendation.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendation();
  }, [commodity, state, market, horizon, storageCost]);

  const activeAction = recData?.action || 'WAIT';

  return (
    <div className="space-y-6">
      {/* Top Banner & Cost Allowance */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">Decision Support Advisory Framework</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent, rule-governed economic logic evaluating net margins against storage fees and downside risk for <strong>{commodity}</strong> ({state} • {market})
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Storage Fee (Rs./Qtl)</label>
            <input 
              type="number" 
              value={storageCost} 
              onChange={e => setStorageCost(e.target.value)}
              className="w-28 p-1.5 bg-slate-50 border border-slate-200 rounded font-semibold text-slate-800"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Planning Horizon</label>
            <select 
              value={horizon} 
              onChange={e => setHorizon(Number(e.target.value))}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded font-semibold text-slate-800"
            >
              <option value={7}>7 Days Ahead</option>
              <option value={14}>14 Days Ahead</option>
              <option value={21}>21 Days Ahead</option>
              <option value={30}>30 Days Ahead</option>
              <option value={45}>45 Days Ahead</option>
              <option value={60}>60 Days Ahead</option>
            </select>
          </div>

          <button 
            onClick={fetchRecommendation}
            disabled={loading}
            className="mt-3 p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Decision Option Cards (SELL / STORE / WAIT) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. STORE */}
        <div className={`rounded-2xl p-6 border transition-all ${
          activeAction === 'STORE'
            ? 'bg-emerald-50/80 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
            : 'bg-white border-slate-200 opacity-60'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            {activeAction === 'STORE' && (
              <span className="px-2.5 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                Recommended Policy
              </span>
            )}
          </div>
          <h4 className="text-xl font-bold text-slate-900 mb-1">STORE PRODUCE</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Hold produce in ventilated cold storage. Price appreciation is projected to exceed carrying charges under tolerable market volatility.
          </p>
        </div>

        {/* 2. SELL */}
        <div className={`rounded-2xl p-6 border transition-all ${
          activeAction === 'SELL'
            ? 'bg-red-50/80 border-red-500 shadow-md ring-2 ring-red-500/20'
            : 'bg-white border-slate-200 opacity-60'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold">
              <TrendingDown className="w-5 h-5" />
            </div>
            {activeAction === 'SELL' && (
              <span className="px-2.5 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                Recommended Policy
              </span>
            )}
          </div>
          <h4 className="text-xl font-bold text-slate-900 mb-1">SELL AT MANDI</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Liquidate batches immediately. Downward price momentum or excessive market risk threatens to erode crop realizations.
          </p>
        </div>

        {/* 3. WAIT */}
        <div className={`rounded-2xl p-6 border transition-all ${
          activeAction === 'WAIT'
            ? 'bg-amber-50/80 border-amber-500 shadow-md ring-2 ring-amber-500/20'
            : 'bg-white border-slate-200 opacity-60'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <PauseCircle className="w-5 h-5" />
            </div>
            {activeAction === 'WAIT' && (
              <span className="px-2.5 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                Recommended Policy
              </span>
            )}
          </div>
          <h4 className="text-xl font-bold text-slate-900 mb-1">WAIT & STAGGER</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Maintain routine operations without taking aggressive speculative storage positions. Conflicting price/demand signals warrant 3-5 days caution.
          </p>
        </div>
      </div>

      {/* Strategic Explanation Card */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Economic Rationale & Operational Directives</h4>
            <p className="text-xs text-slate-500">Synthesized from LSTM Price Projection, XGBoost Demand, and Storage Arbitrage</p>
          </div>
          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-md">
            Confidence: {recData?.confidence_level}
          </span>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <p className="text-xs text-slate-800 leading-relaxed">
            <strong>Decision Driver:</strong> {recData?.decision_summary}
          </p>
          <p className="text-xs text-emerald-800 font-medium">
            <strong>Actionable Directive:</strong> {recData?.recommended_operational_strategy}
          </p>
        </div>

        {/* Economic Ledger Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs pt-1">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-slate-400 block text-[10px]">Prevailing Modal Price</span>
            <span className="font-bold text-slate-900 text-sm">Rs.{recData?.economic_metrics?.current_modal_price}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-slate-400 block text-[10px]">Terminal Projected Price</span>
            <span className="font-bold text-slate-900 text-sm">Rs.{recData?.economic_metrics?.projected_modal_price}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-slate-400 block text-[10px]">Holding / Storage Cost</span>
            <span className="font-bold text-slate-900 text-sm">Rs.{recData?.economic_metrics?.estimated_storage_cost_per_qtl} / Qtl</span>
          </div>

          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
            <span className="text-emerald-700 block text-[10px] font-semibold">Net Expected Arbitrage</span>
            <span className="font-bold text-emerald-950 text-sm">
              {recData?.economic_metrics?.net_gain_per_qtl > 0 ? '+' : ''}Rs.{recData?.economic_metrics?.net_gain_per_qtl} / Qtl
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
