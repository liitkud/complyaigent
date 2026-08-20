import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/ui/Sidebar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://complyaigent.ferretops.dev",
  ),
  title: {
    default: "FerretOPS — Continuous Compliance Gate & Policy Extraction Engine",
    template: "%s | FerretOPS",
  },
  description:
    "Compliance operations console for statutory policies, deterministic regex compilation, pre-push git guardrails, and verifiable audit trails.",
  keywords: [
    "FerretOPS",
    "compliance",
    "governance",
    "pre-push hook",
    "policy engine",
    "security guardrails",
    "HITL",
    "regex compiler",
    "SOC2",
    "ISO 27001",
    "GDPR",
    "audit trail",
  ],
  authors: [{ name: "FerretOPS Team" }],
  creator: "FerretOPS",
  publisher: "FerretOPS",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://complyaigent.ferretops.dev",
    siteName: "FerretOPS",
    title: "FerretOPS — Continuous Compliance Gate & Policy Extraction Engine",
    description:
      "Turn statutory policy into compile-time pre-push guardrails and deterministic regex filters.",
  },
  twitter: {
    card: "summary_large_image",
    title: "FerretOPS — Continuous Compliance Gate & Policy Extraction Engine",
    description:
      "Turn statutory policy into compile-time pre-push guardrails and deterministic regex filters.",
    creator: "@FerretOPS",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} min-h-full scroll-smooth antialiased`}
    >
      <body className="flex h-full min-h-screen flex-col bg-[#131313] text-[#e7e7e7] md:flex-row">
        <Sidebar />
        {children}
      </body>
    </html>
  );
}
