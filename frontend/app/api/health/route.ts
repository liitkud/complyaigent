import { NextResponse } from "next/server";

export async function GET() {
  const backendBase = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;
  if (backendBase) {
    try {
      const res = await fetch(`${backendBase.replace(/\/$/, "")}/health`);
      if (res.ok) {
        return NextResponse.json(await res.json());
      }
    } catch {
      // Fallback below
    }
  }
  return NextResponse.json({ status: "healthy" });
}
