"use client";

type BadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "processing";

const styles: Record<BadgeVariant, string> = {
  success: "border-[#4edea3]/40 bg-[#4edea3]/10 text-[#4edea3]",
  warning: "border-[#adc6ff]/40 bg-[#adc6ff]/10 text-[#adc6ff]",
  danger: "border-[#ff5451]/40 bg-[#ff5451]/10 text-[#ffb3ad]",
  info: "border-[#4d8eff]/40 bg-[#4d8eff]/10 text-[#adc6ff]",
  neutral: "border-[#343434] bg-[#202020] text-[#8e8e8e]",
  processing: "border-[#4d8eff]/40 bg-[#4d8eff]/10 text-[#adc6ff]",
};

const dotStyles: Record<BadgeVariant, string> = {
  success: "bg-[#4edea3]",
  warning: "bg-[#adc6ff]",
  danger: "bg-[#ff5451]",
  info: "bg-[#4d8eff]",
  neutral: "bg-[#737373]",
  processing: "animate-pulse bg-[#4d8eff]",
};

interface StatusBadgeProps {
  label: string;
  variant: BadgeVariant;
  dot?: boolean;
}

export default function StatusBadge({
  label,
  variant,
  dot = false,
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[10px] font-medium ${styles[variant]}`}
    >
      {dot && (
        <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[variant]}`} />
      )}
      {label}
    </span>
  );
}
