import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ingestion Pipeline Status",
  description:
    "Real-time extraction, deduplication, and classification progress tracker.",
  openGraph: {
    title: "Ingestion Pipeline Status | FerretOPS",
    description:
      "Real-time extraction, deduplication, and classification progress tracker.",
  },
};

export default function IngestStatusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
