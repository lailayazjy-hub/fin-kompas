
export enum ThemeName {
  TERRA_COTTA = 'Terra Cotta Landscape',
  FOREST_GREEN = 'Forest Green',
  AUTUMN_LEAVES = 'Autumn Leaves',
}

export interface ThemeColors {
  highRisk: string;
  mediumRisk: string;
  lowRisk: string;
  primary: string;
  text: string;
  name: string;
}

export interface FinancialRecord {
  id: string;
  boekstuknummer?: string; // Exact Online
  relatie?: string; // Exact Online
  dagboek?: string;
  grootboek: string; // Account Code
  omschrijving: string;
  datum: string; // YYYY-MM-DD
  debet: number;
  credit: number;
  type: 'debet' | 'credit'; // For validation/metadata
}

export interface AppSettings {
  appName: string;
  language: 'nl' | 'en';
  theme: ThemeName;
  showDemo: boolean;
  showUploadTemplate: boolean;
  showPeriodSelector: boolean;
  showAIAnalysis: boolean;
  showMachineLearning: boolean;
  showComments: boolean;
  showUser: boolean;
  exportButtons: ('pdf' | 'excel' | 'csv')[];
  currencyInThousands: boolean;
  smallAmountFilter: number; // Default 50
  analysisPeriod: number | 'custom'; // Months, or custom
  customStartDate?: string;
  customEndDate?: string;
}

export interface ReportItem {
  name: string;
  value: number;
}

export interface ReportSection {
  items: ReportItem[];
  total: number;
}

export interface ProcessedData {
  records: FinancialRecord[];
  meta?: {
    year?: string;
    period?: string;
  };
  availableYears?: string[]; // List of years found in the upload
  validationTotals?: { name: string; value: number; year?: string }[];
  
  // High level P&L
  netIncome: number;
  grossProfit: number;
  operatingIncome: number; // Bedrijfsresultaat
  totalOperationalOtherExpenses: number; // Totaal Operationele Overige Kosten
  totalExpenses: number;

  // P&L Sections
  sales: ReportSection;
  cogs: ReportSection;
  labor: ReportSection;
  otherExpenses: ReportSection;
  depreciation: ReportSection; // Afschrijvingen
  nonOperationalExpenses: ReportSection;
  resultsAdjustments: ReportSection; // Resultaat gbr & Onverwerkt verleden

  // Balance Sheet Sections
  balanceSheet?: {
    assets: ReportSection;
    liabilities: ReportSection;
    equity: ReportSection;
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
  };

  // Charting
  expenseDistribution: { name: string; value: number; color: string }[];
  monthlyData: { month: string; revenue: number; costs: number; result: number }[];
}

export interface ChartDataPoint {
  name: string;
  value: number;
  type?: 'income' | 'expense' | 'asset' | 'liability';
}