"use client";

import {
  LayoutDashboard,
  Shield,
  FileCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UploadCTA, ValidateCTA } from "./CTAButton";

const navItems = [
  { icon: LayoutDashboard, label: "Command Console", href: "/dashboard" },
  { icon: Shield, label: "Policy Dashboard", href: "/policy" },
  { icon: FileCheck, label: "Validate", href: "/validate" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  // Keep landing page completely fullscreen
  if (pathname === "/" || pathname === "/landing") {
    return null;
  }

  return (
    <aside
      aria-label="Sidebar navigation"
      className={`ops-sidebar flex shrink-0 flex-col border-r border-[#343434] bg-[#171717] transition-all duration-300 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Logo */}
      <div className="sidebar-brand flex h-16 items-center gap-3 border-b border-[#343434] px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-[#4d8eff] bg-[#4d8eff]/15 font-mono text-sm font-bold text-[#adc6ff]">
          F
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="font-mono text-sm font-bold tracking-wide text-[#f1f1f1]">
              FerretOPS
            </p>
            <p className="ops-label text-[#737373]">Operations Console</p>
          </div>
        )}
      </div>

      {/* Nav (analytics / read-only) */}
      <nav aria-label="Main console navigation" className="sidebar-nav flex flex-1 flex-col space-y-1 px-2 py-4">
        {!collapsed && (
          <p className="ops-label px-3 pb-1 font-semibold text-[#737373]">
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
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 rounded-sm border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4d8eff] ${
                isActive
                  ? "border-[#4d8eff]/40 bg-[#4d8eff]/10 text-[#adc6ff]"
                  : "border-transparent text-[#8e8e8e] hover:border-[#343434] hover:bg-[#202020] hover:text-[#f1f1f1]"
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
      <div className="sidebar-actions space-y-2 border-t border-[#343434] px-2 py-3">
        {!collapsed && (
          <p className="ops-label px-1 pb-1 font-semibold text-[#737373]">
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
      <div className="sidebar-toggle border-t border-[#343434] p-2">
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand sidebar navigation" : "Collapse sidebar navigation"}
          className="flex w-full items-center justify-center rounded-sm p-2 text-[#737373] transition-colors hover:bg-[#202020] hover:text-[#f1f1f1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4d8eff]"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  );
}
