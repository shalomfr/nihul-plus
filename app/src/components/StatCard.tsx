"use client";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  change?: string;
  trend?: "up" | "down";
  color: string;
}

export default function StatCard({ icon: Icon, label, value, change, trend, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[#e8ecf4] hover-lift" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18` }}
        >
          <Icon size={20} style={{ color }} />
        </div>
        {change && (
          <div
            className={`flex items-center gap-1 text-xs font-semibold ${
              trend === "up" ? "text-[#16a34a]" : "text-[#ef4444]"
            }`}
          >
            {trend === "up" ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {change}
          </div>
        )}
      </div>
      <div className="text-xl md:text-2xl font-extrabold text-[#1e293b] mb-1">{value}</div>
      <div className="text-xs text-[#64748b] font-medium">{label}</div>
    </div>
  );
}
