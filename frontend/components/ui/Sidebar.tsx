"use client";

import {
  LayoutDashboard,
  Shield,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UploadCTA, ValidateCTA } from "./CTAButton";

const navItems = [
  { icon: LayoutDashboard, label: "Home", href: "/" },
  { icon: Shield, label: "Dashboard", href: "/dashboard" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={`flex flex-col border-r border-slate-200 bg-white transition-all duration-300 dark:border-slate-700 dark:bg-slate-950 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-4 dark:border-slate-700">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-blue-600 to-violet-600 text-sm font-bold text-white">
          C
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              ComplyAIgent
            </p>
            <p className="text-[10px] text-slate-400">Compliance Platform</p>
          </div>
        )}
      </div>

      {/* Nav (analytics / read-only) */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {!collapsed && (
          <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Analytics
          </p>
        )}
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && (pathname?.startsWith(item.href) ?? false));
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={18} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Action CTAs */}
      <div className="space-y-2 border-t border-slate-200 px-2 py-3 dark:border-slate-700">
        {!collapsed && (
          <p className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Actions
          </p>
        )}
        <UploadCTA
          size="sm"
          label={collapsed ? "" : "Upload Policy"}
          className={`w-full justify-center ${collapsed ? "px-2" : ""}`}
        />
        <ValidateCTA
          size="sm"
          label={collapsed ? "" : "Validate"}
          className={`w-full justify-center ${collapsed ? "px-2" : ""}`}
        />
      </div>

      {/* Collapse toggle */}
      <div className="border-t border-slate-200 p-2 dark:border-slate-700">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex w-full items-center justify-center rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  );
}
