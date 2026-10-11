import React from 'react';
import { Calendar, Cpu, Sparkles } from 'lucide-react';

export default function Header({ title, subtitle, commodity = "Onion", state = "Maharashtra", market = "Lasalgaon" }) {
  return (
    <header className="bg-white border-b border-slate-200 px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-10 shadow-xs">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Active Context Tag */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Focus: <strong>{commodity}</strong> ({state} • {market})</span>
        </div>

        {/* Date Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>{new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
        </div>

        {/* Inference Mode */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-700">
          <Cpu className="w-3 h-3 text-emerald-600" />
          <span>Live Inference</span>
        </div>
      </div>
    </header>
  );
}
