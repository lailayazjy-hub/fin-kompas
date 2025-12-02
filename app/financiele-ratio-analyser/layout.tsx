import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Financiële Ratio Analyser",
  description: "Geautomatiseerde berekening en AI-interpretatie van financiële ratio's (Liquiditeit, Solvabiliteit, Rentabiliteit) met Exact Online stijl rapportage.",
};

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {children}
    </>
  );
}
