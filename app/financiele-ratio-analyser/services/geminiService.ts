import { GoogleGenAI } from "@google/genai";
import { RatioResult } from "../types";

const apiKey = process.env.API_KEY || '';
// Initialize safe AI client
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export const getRatioInterpretation = async (ratio: RatioResult): Promise<string> => {
  if (!ai) return "API Key ontbreekt. Configureer process.env.API_KEY.";

  try {
    const prompt = `
      Analyseer de volgende financiële ratio voor een Nederlands bedrijf:
      Ratio: ${ratio.name}
      Waarde: ${ratio.value.toFixed(2)} ${ratio.unit}
      Categorie: ${ratio.category}
      
      Geef een strikt zakelijke, feitelijke interpretatie in het Nederlands.
      Maximaal 2 zinnen. Maximaal 15 woorden.
      Geen advies, alleen observatie van de stand van zaken (goed/slecht/gemiddeld).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text?.trim() || "Geen analyse beschikbaar.";
  } catch (error) {
    console.error("Fout bij AI analyse:", error);
    return "Fout bij ophalen analyse.";
  }
};
