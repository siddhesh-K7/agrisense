import React from 'react';
import { 
  LayoutDashboard, 
  TrendingUp, 
  BarChart3, 
  BrainCircuit, 
  ShieldAlert, 
  Compass, 
  Award, 
  Info,
  Sprout,
  CheckCircle2
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'price', label: 'Price Forecasting', icon: TrendingUp },
    { id: 'demand', label: 'Demand Forecasting', icon: BarChart3 },
    { id: 'explainability', label: 'Explainable AI (SHAP)', icon: BrainCircuit },
    { id: 'risk', label: 'Risk Analysis', icon: ShieldAlert },
    { id: 'recommendations', label: 'Smart Recommendations', icon: Compass },
    { id: 'performance', label: 'Model Performance', icon: Award },
    { id: 'about', label: 'About AgriSense', icon: Info },
  ];

  return (
    <aside className="w-64 bg-[#123B2A] text-slate-100 flex flex-col shrink-0 min-h-screen border-r border-emerald-950/40">
      {/* Brand Header */}
      <div className="p-6 border-b border-emerald-800/40 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-inner">
          <Sprout className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-white tracking-wide">AgriSense</h1>
          <p className="text-[10px] text-emerald-300 font-medium tracking-wider uppercase">AI Forecasting Platform</p>
        </div>
      </div>

      {/* Model Readiness Indicator */}
      <div className="mx-4 my-4 p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-xs">
        <div className="flex items-center gap-2 text-emerald-400 font-medium mb-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Trained Models Active</span>
        </div>
        <p className="text-[11px] text-slate-300 leading-tight">LSTM (Price) & XGBoost (Demand) connected</p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive 
                  ? 'bg-emerald-600 text-white shadow-xs font-semibold' 
                  : 'text-slate-300 hover:bg-emerald-900/50 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-emerald-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

    </aside>
  );
}
