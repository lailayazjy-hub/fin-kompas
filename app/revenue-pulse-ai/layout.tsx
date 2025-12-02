import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RevenuePulse AI",
  description: "Een tracker voor terugkerende omzet-KPI's met geautomatiseerde Gemini AI-inzichten, analyse van datumbereiken en functies voor samenwerking.",
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
