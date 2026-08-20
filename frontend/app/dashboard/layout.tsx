import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Command Console",
  description:
    "Real-time compliance verdicts, violation tracking, and human-in-the-loop approvals in one unified workspace.",
  openGraph: {
    title: "Command Console | FerretOPS",
    description:
      "Real-time compliance verdicts, violation tracking, and human-in-the-loop approvals in one unified workspace.",
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
