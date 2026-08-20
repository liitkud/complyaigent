"use client";

import Link from "next/link";
import { Upload, ShieldCheck } from "lucide-react";
import type { ComponentType, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary: "border border-[#4d8eff] bg-[#4d8eff] text-[#08101f] hover:bg-[#adc6ff]",
  secondary: "border border-[#4edea3]/60 bg-[#4edea3]/10 text-[#4edea3] hover:bg-[#4edea3]/20",
  ghost: "border border-[#343434] bg-transparent text-[#c5c5c5] hover:border-[#4d8eff]/60 hover:bg-[#202020]",
};

const sizeClasses: Record<Size, string> = {
  sm: "gap-1.5 px-3 py-1.5 text-xs",
  md: "gap-2 px-4 py-2 text-sm",
  lg: "gap-2 px-5 py-2.5 text-sm",
};

interface CTAButtonProps {
  href: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  iconSize?: number;
  children?: ReactNode;
}

export function CTAButton({
  href,
  icon: Icon,
  label,
  variant = "primary",
  size = "md",
  className = "",
  iconSize,
}: CTAButtonProps) {
  const resolvedIconSize = iconSize ?? (size === "sm" ? 14 : 16);
  return (
    <Link
      href={href}
      className={`inline-flex items-center rounded-sm font-medium transition-colors ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      <Icon size={resolvedIconSize} className="shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

export function UploadCTA(props: Omit<CTAButtonProps, "href" | "icon" | "label"> & { label?: string }) {
  const { label = "Upload Policy", ...rest } = props;
  return <CTAButton href="/policy" icon={Upload} label={label} variant="primary" {...rest} />;
}

export function ValidateCTA(props: Omit<CTAButtonProps, "href" | "icon" | "label"> & { label?: string }) {
  const { label = "Validate", ...rest } = props;
  return <CTAButton href="/validate" icon={ShieldCheck} label={label} variant="secondary" {...rest} />;
}
