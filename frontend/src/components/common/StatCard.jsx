import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, badge, color = "emerald" }) {
  const colorMap = {
    emerald: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-100",
      iconBg: "bg-emerald-600 text-white"
    },
    amber: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-100",
      iconBg: "bg-amber-500 text-white"
    },
    red: {
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-100",
      iconBg: "bg-red-600 text-white"
    },
    forest: {
      bg: "bg-slate-50",
      text: "text-[#123B2A]",
      border: "border-emerald-200",
      iconBg: "bg-[#123B2A] text-white"
    },
    blue: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-100",
      iconBg: "bg-blue-600 text-white"
    }
  };

  const scheme = colorMap[color] || colorMap.emerald;

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
        {Icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${scheme.iconBg}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-2xl font-bold tracking-tight text-slate-900">{value}</span>
        {badge && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${scheme.bg} ${scheme.text} border ${scheme.border}`}>
            {badge}
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-slate-500 leading-relaxed">{subtitle}</p>}
    </div>
  );
}
