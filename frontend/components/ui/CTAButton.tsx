"use client";

import Link from "next/link";
import { Upload, ShieldCheck } from "lucide-react";
import type { ComponentType, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600",
  secondary:
    "bg-violet-600 text-white hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600",
  ghost:
    "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-5 py-2.5 text-sm gap-2",
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
      className={`inline-flex items-center rounded-lg font-medium transition-colors ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      <Icon size={resolvedIconSize} className="shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

export function UploadCTA(props: Omit<CTAButtonProps, "href" | "icon" | "label"> & { label?: string }) {
  const { label = "Upload Policy", ...rest } = props;
  return <CTAButton href="/upload" icon={Upload} label={label} variant="primary" {...rest} />;
}

export function ValidateCTA(props: Omit<CTAButtonProps, "href" | "icon" | "label"> & { label?: string }) {
  const { label = "Validate", ...rest } = props;
  return <CTAButton href="/validate" icon={ShieldCheck} label={label} variant="secondary" {...rest} />;
}
