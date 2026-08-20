import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Regulation Rule Details",
  description:
    "Detailed 4-bucket manifest breakdown for an ingested statutory regulation source.",
  openGraph: {
    title: "Regulation Rule Details | FerretOPS",
    description:
      "Detailed 4-bucket manifest breakdown for an ingested statutory regulation source.",
  },
};

export default function RegulationDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
