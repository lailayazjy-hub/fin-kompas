import { GoogleGenAI } from "@google/genai";
import { ProcessedData } from '../types';

export const generateFinancialAnalysis = async (data: ProcessedData, language: 'nl' | 'en'): Promise<string> => {
  const apiKey = process.env.NEXT_PUBLIC_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    console.warn("No API KEY found");
    return language === 'nl' 
      ? "AI-analyse niet beschikbaar (API Key ontbreekt)." 
      : "AI analysis unavailable (Missing API Key).";
  }

  const ai = new GoogleGenAI({ apiKey });

  // CONVERT DATA FOR AI CONTEXT
  // In the App: Revenue is Credit (Negative). Costs are Debit (Positive).
  // Net Result: Negative value = Profit (Credit balance), Positive value = Loss.
  
  // For the AI prompt, we convert this to standard "Human" logic:
  // Revenue: Positive
  // Costs: Positive
  // Result: Positive = Profit, Negative = Loss

  const totalRevenue = Math.abs(data.sales.total); // Convert -100k to 100k
  const totalCosts = data.cogs.total + data.totalExpenses;
  
  // Invert Net Income sign for AI: 
  // If data.netIncome is -200 (Credit/Profit) -> We send 200.
  // If data.netIncome is 50 (Debit/Loss) -> We send -50.
  const aiNetResult = data.netIncome * -1;

  const prompt = `
    Act as a senior financial analyst.
    Analyze the following financial summary data:
    
    Total Revenue: ${totalRevenue.toLocaleString(language === 'nl' ? 'nl-NL' : 'en-US', { style: 'currency', currency: 'EUR' })}
    Total Costs: ${totalCosts.toLocaleString(language === 'nl' ? 'nl-NL' : 'en-US', { style: 'currency', currency: 'EUR' })}
    Net Result: ${aiNetResult.toLocaleString(language === 'nl' ? 'nl-NL' : 'en-US', { style: 'currency', currency: 'EUR' })}
    
    Context:
    - If Net Result is positive, the company is making a profit.
    - If Net Result is negative, the company is making a loss.
    
    Language: ${language === 'nl' ? 'Dutch' : 'English'}.
    Constraint: Max 2 sentences. Max 20 words total. Business-like and factual tone.
    Focus on the margin and key result.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || (language === 'nl' ? "Geen analyse gegenereerd." : "No analysis generated.");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return language === 'nl' 
      ? "Fout bij ophalen van analyse." 
      : "Error fetching analysis.";
  }
};