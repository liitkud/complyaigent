import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Policy Dashboard & Manifest",
  description:
    "Governance rule buckets, regex-enforceable constraints, and active statutory regulations.",
  openGraph: {
    title: "Policy Dashboard & Manifest | FerretOPS",
    description:
      "Governance rule buckets, regex-enforceable constraints, and active statutory regulations.",
  },
};

export default function PolicyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
