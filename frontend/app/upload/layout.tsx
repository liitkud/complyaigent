import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Upload & Ingest Policy",
  description:
    "Ingest statutory PDFs or markdown constitutions into compiled compliance rules.",
  openGraph: {
    title: "Upload & Ingest Policy | FerretOPS",
    description:
      "Ingest statutory PDFs or markdown constitutions into compiled compliance rules.",
  },
};

export default function UploadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
