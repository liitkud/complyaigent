"use client";

import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  variant?: "default" | "success" | "warning" | "danger";
}

const variantStyles = {
  default: "border-[#4d8eff]/40 bg-[#4d8eff]/10 text-[#adc6ff]",
  success: "border-[#4edea3]/40 bg-[#4edea3]/10 text-[#4edea3]",
  warning: "border-[#adc6ff]/40 bg-[#adc6ff]/10 text-[#adc6ff]",
  danger: "border-[#ff5451]/40 bg-[#ff5451]/10 text-[#ffb3ad]",
};

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
}: MetricCardProps) {
  return (
    <div className="ops-panel p-4 transition-colors hover:border-[#4d8eff]/40">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="ops-label text-[#8e8e8e]">
            {title}
          </p>
          <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-[#f1f1f1]">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-[#737373]">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`rounded-sm border p-2 ${variantStyles[variant]}`}>
          <Icon size={20} />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          <span
            className={trend.value >= 0 ? "text-[#4edea3]" : "text-[#ff5451]"}
          >
            {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%
          </span>
          <span className="text-[#737373]">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
