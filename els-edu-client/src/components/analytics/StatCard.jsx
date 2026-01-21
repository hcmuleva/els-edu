import React from "react";
import { ArrowUp, ArrowDown } from "lucide-react";

export const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  color = "blue",
}) => {
  const colorStyles = {
    blue: {
      bg: "bg-gradient-to-br from-blue-50 to-blue-100/50",
      icon: "bg-blue-500 text-white shadow-blue-200",
      border: "border-blue-100",
    },
    violet: {
      bg: "bg-gradient-to-br from-violet-50 to-violet-100/50",
      icon: "bg-violet-500 text-white shadow-violet-200",
      border: "border-violet-100",
    },
    emerald: {
      bg: "bg-gradient-to-br from-emerald-50 to-emerald-100/50",
      icon: "bg-emerald-500 text-white shadow-emerald-200",
      border: "border-emerald-100",
    },
    orange: {
      bg: "bg-gradient-to-br from-orange-50 to-orange-100/50",
      icon: "bg-orange-500 text-white shadow-orange-200",
      border: "border-orange-100",
    },
    rose: {
      bg: "bg-gradient-to-br from-rose-50 to-rose-100/50",
      icon: "bg-rose-500 text-white shadow-rose-200",
      border: "border-rose-100",
    },
    red: {
      bg: "bg-gradient-to-br from-red-50 to-red-100/50",
      icon: "bg-red-500 text-white shadow-red-200",
      border: "border-red-100",
    },
  }[color] || {
    bg: "bg-gradient-to-br from-gray-50 to-gray-100/50",
    icon: "bg-gray-500 text-white shadow-gray-200",
    border: "border-gray-100",
  };

  return (
    <div
      className={`${colorStyles.bg} p-5 rounded-2xl border ${colorStyles.border} hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-2xl font-black text-gray-900">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${colorStyles.icon} shadow-lg`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {(trend || trendLabel) && (
        <div className="mt-4 flex items-center gap-2">
          {trend && (
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                trend > 0
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {trend > 0 ? (
                <ArrowUp className="w-3 h-3" />
              ) : (
                <ArrowDown className="w-3 h-3" />
              )}
              {Math.abs(trend)}%
            </span>
          )}
          {trendLabel && (
            <span className="text-xs text-gray-400">{trendLabel}</span>
          )}
        </div>
      )}
    </div>
  );
};
