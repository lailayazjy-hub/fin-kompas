import { GoogleGenAI } from "@google/genai";
import { KPIMetric } from "../types";

const getClient = () => {
  const apiKey = process.env.NEXT_PUBLIC_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY is missing");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateKPIInsight = async (metric: KPIMetric): Promise<string> => {
  const ai = getClient();
  if (!ai) return "AI Niet beschikbaar (Controleer API Key)";

  const prompt = `
    Analyseer deze KPI voor terugkerende omzet (SaaS context):
    Metric: ${metric.name}
    Huidige Waarde: ${metric.value} ${metric.unit}
    Trend: ${metric.trend > 0 ? '+' : ''}${metric.trend}% t.o.v. vorige periode.
    
    Constraint: Geef een strikt zakelijke, feitelijke managementsamenvatting.
    Constraint: Antwoord in het Nederlands.
    Constraint: Maximaal 2 zinnen.
    Constraint: Maximaal 15 woorden in totaal.
    Constraint: Geen vulwoorden zoals "De gegevens tonen". Wees direct.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text?.trim() || "Geen inzicht gegenereerd.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Analyse mislukt.";
  }
};