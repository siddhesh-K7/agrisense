import React from 'react';
import { 
  Info, 
  GraduationCap, 
  BookOpen, 
  Cpu, 
  ShieldCheck, 
  BrainCircuit, 
  Layers,
  Database,
  FileCode2
} from 'lucide-react';

export default function About() {
  return (
    <div className="space-y-6 max-w-5xl">
      {/* Title Hero */}
      <div className="bg-white rounded-xl p-8 border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider">
          <GraduationCap className="w-4 h-4" />
          <span>M.Tech Computer Science & Engineering Final-Year Project</span>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 leading-tight">
          AgriSense: An Explainable and Risk-Aware Framework for Agricultural Price and Demand Forecasting
        </h2>

        <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
          A full-stack agricultural decision support platform integrating recurrent deep learning (LSTM) for commodity price rollouts, gradient boosting (XGBoost) for destination demand estimation, game-theoretic SHAP explainability, and multi-attribute heuristic risk scoring.
        </p>

        <div className="flex flex-wrap gap-2 pt-2">
          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-md border border-emerald-200">
            Deep Learning (LSTM)
          </span>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-md border border-emerald-200">
            Gradient Boosting (XGBoost)
          </span>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-md border border-emerald-200">
            Explainable AI (SHAP)
          </span>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-md border border-emerald-200">
            FastAPI Backend
          </span>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-md border border-emerald-200">
            React + Vite Frontend
          </span>
        </div>
      </div>

      {/* Research Objectives & Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>Problem Statement & Objectives</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Agricultural markets in India suffer from severe informational asymmetry and high price volatility. While black-box AI models have been proposed for price forecasting, they often lack:
          </p>
          <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4 leading-relaxed">
            <li><strong>Actionable Interpretability:</strong> Farmers and traders cannot trust predictions without understanding why the model expects a price shift.</li>
            <li><strong>Demand Interlocking:</strong> Price models rarely integrate destination absorption capacity.</li>
            <li><strong>Downside Risk Awareness:</strong> Point predictions do not account for storage expenses, market spread, and holding risk.</li>
          </ul>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>System Architecture</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            The platform is structured into modular layers:
          </p>
          <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4 leading-relaxed">
            <li><strong>Inference Service Layer:</strong> Autoregressive LSTM multi-step horizon forecasting & XGBoost demand scoring.</li>
            <li><strong>Explainability Layer:</strong> SHAP TreeExplainer (XGBoost) and GradientExplainer (LSTM 60-lag temporal attribution).</li>
            <li><strong>Risk Engine:</strong> Deterministic normalization and weighted combination of volatility, momentum, spread, and demand signals.</li>
            <li><strong>Decision Engine:</strong> Dynamic SELL / STORE / WAIT rules incorporating storage arbitrage economics.</li>
          </ul>
        </div>
      </div>

      {/* Datasets & Models Disclosure */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-2">
          <Database className="w-4 h-4 text-emerald-600" />
          <span>Datasets & Model Integrity Disclosures</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-900">1. AGMARKNET Price Mandi Dataset</h4>
            <p className="text-slate-600 leading-relaxed">
              Extracted from official AGMARKNET daily arrivals spanning 2016 through 2026 for Maharashtra onion mandis (over 225 APMC market centers).
            </p>
            <span className="text-[11px] text-slate-500 block">
              <strong>Preprocessing:</strong> Daily aggregation, chronological 80/20 train/test split, MinMaxScaler(0, 1), 60-day lookback sequence.
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-900">2. Destination Demand Index Dataset</h4>
            <p className="text-slate-600 leading-relaxed">
              Consists of 50,000 multi-state records covering 58 commodities and 26 states.
            </p>
            <span className="text-[11px] text-slate-500 block">
              <strong>Transparency Disclosure:</strong> Targets are synthetic econometric simulations (labeled <code>simulated_demand_index</code>) engineered using price elasticity and seasonality.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
