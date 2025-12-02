export interface FinancialData {
  // Balans (Balance Sheet)
  fixedAssets: number; // Vaste Activa
  currentAssets: number; // Vlottende Activa (incl. liquide middelen)
  liquidAssets: number; // Liquide Middelen (subset of current)
  inventory: number; // Voorraden
  
  equity: number; // Eigen Vermogen
  longTermDebt: number; // Langlopende Schulden
  shortTermDebt: number; // Kortlopende Schulden

  // Winst & Verlies (P&L)
  revenue: number; // Omzet
  costOfGoodsSold: number; // Kostprijs van de omzet
  operatingExpenses: number; // Bedrijfskosten
  interestExpenses: number; // Rentelasten
  taxExpenses: number; // Belastingen
}

export interface RatioResult {
  key: string;
  name: string;
  value: number;
  unit: string; // '%', 'ratio', 'dagen'
  description: string;
  category: 'liquiditeit' | 'solvabiliteit' | 'rentabiliteit' | 'efficientie';
}

export interface AIInterpretation {
  text: string;
  loading: boolean;
}

export interface Comment {
  id: string;
  ratioKey: string;
  author: string;
  text: string;
  timestamp: Date;
}
