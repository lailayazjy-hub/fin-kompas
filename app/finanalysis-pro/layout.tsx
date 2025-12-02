import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FinAnalysis Pro",
  description: "Geavanceerde financiële visualisatie tool voor Exact Online rapportages met AI-ondersteuning, thema-opties en interactieve dashboards.",
};

export default function FinAnalysisProLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
