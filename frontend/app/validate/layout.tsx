import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Risk & Code Validator",
  description:
    "Simulate and test code snippets against active governance manifests and deterministic regex rules.",
  openGraph: {
    title: "Risk & Code Validator | FerretOPS",
    description:
      "Simulate and test code snippets against active governance manifests and deterministic regex rules.",
  },
};

export default function ValidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
