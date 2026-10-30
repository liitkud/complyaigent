"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/services/api";

/**
 * Pins to the bottom of a console page's scroll container (via mt-auto on
 * a flex-col parent) so the page visually terminates instead of trailing
 * off into empty space below the last card. Doubles as a real status
 * indicator — the edge proxy connectivity it reports is live, not
 * decorative.
 */
export default function ConsoleFooter() {
  const [status, setStatus] = useState<"checking" | "healthy" | "down">(
    "checking",
  );

  useEffect(() => {
    let cancelled = false;
    apiClient
      .healthCheck()
      .then(() => {
        if (!cancelled) setStatus("healthy");
      })
      .catch(() => {
        if (!cancelled) setStatus("down");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <footer className="mt-auto flex items-center justify-between gap-3 border-t border-[#262626] px-4 py-3 text-[11px] text-[#5e5e5e] sm:px-6">
      <span className="font-mono">FerretOPS Edge Proxy</span>
      <span className="flex items-center gap-1.5 font-mono">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            status === "healthy"
              ? "bg-[#4edea3]"
              : status === "down"
                ? "bg-[#ff5451]"
                : "bg-[#5e5e5e]"
          }`}
        />
        {status === "checking" && "checking status…"}
        {status === "healthy" && "connected"}
        {status === "down" && "unreachable"}
      </span>
    </footer>
  );
}
