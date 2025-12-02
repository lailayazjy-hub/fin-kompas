
import React from 'react';
import { ThemeName, ThemeColors, AppSettings } from './types';

export const THEMES: Record<ThemeName, ThemeColors> = {
  [ThemeName.TERRA_COTTA]: {
    name: 'Terra Cotta Landscape',
    highRisk: '#D66D6B',
    mediumRisk: '#F3B0A9',
    lowRisk: '#BDD7C6',
    primary: '#52939D',
    text: '#242F4D',
  },
  [ThemeName.FOREST_GREEN]: {
    name: 'Forest Green',
    highRisk: '#9A6C5A',
    mediumRisk: '#E4F46A',
    lowRisk: '#2E7B57',
    primary: '#2E7B57',
    text: '#14242E',
  },
  [ThemeName.AUTUMN_LEAVES]: {
    name: 'Autumn Leaves',
    highRisk: '#2E2421',
    mediumRisk: '#B49269',
    lowRisk: '#B1782F',
    primary: '#B1782F',
    text: '#8B8F92',
  },
};

export const DEFAULT_SETTINGS: AppSettings = {
  appName: 'FinAnalysis Pro',
  language: 'nl',
  theme: ThemeName.TERRA_COTTA,
  showDemo: true,
  showUploadTemplate: true,
  showPeriodSelector: true,
  showAIAnalysis: true,
  showMachineLearning: true,
  showComments: true,
  showUser: true,
  exportButtons: ['pdf', 'excel', 'csv'],
  currencyInThousands: false, // Changed to false as requested
  smallAmountFilter: 50,
  analysisPeriod: 12, // Default 1 year
};

// Woodpecker Logo Component
export const WoodpeckerLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 200 200"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Woodpecker Logo"
  >
    {/* Light gray background circle */}
    <circle cx="100" cy="100" r="95" fill="#E5E7EB" />
    
    {/* Tree Trunk */}
    <path d="M140 190L130 10L170 10L180 190H140Z" fill="#A89F91" />
    <path d="M140 190L130 10" stroke="#8D8070" strokeWidth="2" />
    
    {/* Woodpecker Body - Dark Grey/Black wings */}
    <path d="M135 70C135 70 100 80 100 120C100 150 132 160 132 160L138 130L135 70Z" fill="#2D2D2D" />
    
    {/* White Chest */}
    <path d="M135 70C135 70 100 80 100 120C100 140 115 150 115 150L125 75L135 70Z" fill="white" />
    
    {/* Head - Black and White */}
    <circle cx="125" cy="60" r="15" fill="#2D2D2D" />
    <path d="M125 60L110 65L120 50Z" fill="white" />
    
    {/* Red Spot behind eye */}
    <circle cx="132" cy="58" r="4" fill="#D66D6B" />
    
    {/* Beak */}
    <path d="M112 62L90 65L112 68Z" fill="#4B5563" />
    
    {/* Eye */}
    <circle cx="120" cy="58" r="2" fill="white" />
    <circle cx="120" cy="58" r="1" fill="black" />
  </svg>
);

export const TRANSLATIONS = {
  nl: {
    dashboard: 'Dashboard',
    settings: 'Instellingen',
    upload: 'Uploaden',
    analysis: 'AI Analyse',
    revenue: 'Omzet',
    costs: 'Kosten',
    result: 'Resultaat',
    assets: 'Activa',
    liabilities: 'Passiva',
    netResult: 'Netto Resultaat',
    uploadText: 'Sleep bestanden hierheen of klik om te uploaden',
    uploadSubtext: 'Ondersteunt Excel (.xlsx) of CSV',
    template: 'Download Template',
    demo: 'Demo Data',
    period: 'Periode',
    custom: 'Aangepast',
    months: 'maanden',
    year: 'jaar',
    smallFilter: 'Verberg < €50',
    export: 'Exporteren',
    comments: 'Opmerkingen',
    aiLoading: 'Financiële gegevens analyseren...',
    profitAndLoss: 'Winst & Verlies',
    balanceSheet: 'Balans',
    aiTab: 'AI Analyse',
    aiReportTitle: 'Financiële AI Analyse',
    topCosts: 'Top Kostenposten',
    monthlyTrend: 'Maandelijkse Trend',
    // Detailed Report Items
    total: 'Totaal',
    cogs: 'Kostprijs',
    grossProfit: 'Bruto Winst',
    grossProfitDesc: 'Omzet min Inkoop',
    labor: 'Personeelskosten',
    otherExpenses: 'Overige Kosten',
    generalExpenses: 'Algemene Kosten',
    depreciation: 'Afschrijvingen',
    nonOperational: 'Niet-operationele kosten',
    resultsAdjustments: 'Resultaat & Verrekeningen',
    totalExpenses: 'Totaal Kosten',
    operatingResult: 'Bedrijfsresultaat',
    totalOperationalOther: 'Totaal Operationele Overige Kosten',
    salesTitle: 'Verkoop & Omzet',
    startAnalysis: 'Start uw analyse',
    startAnalysisSub: 'Upload een Exact Online export (CSV/Excel) of gebruik de demo data.',
    loadDemo: 'Laad voorbeeld rapport',
    currentAssets: 'Vlottende Activa',
    fixedAssets: 'Vaste Activa',
    equity: 'Eigen Vermogen',
    shortTermLiabilities: 'Kortlopende Schulden',
    longTermLiabilities: 'Langlopende Schulden',
    // Health Check
    healthCheck2Factor: 'Financiële Gezondheid (2-Factor Model)',
    profitability: 'Winstgevendheid',
    costStructure: 'Kostenstructuur',
    marginLabel: 'Netto Marge',
    costLabel: 'Kosten % van Omzet',
    zoneCritical: 'Verlies',
    zoneRisk: 'Risico',
    zoneHealthy: 'Gezond',
  },
  en: {
    dashboard: 'Dashboard',
    settings: 'Settings',
    upload: 'Upload',
    analysis: 'AI Analysis',
    revenue: 'Revenue',
    costs: 'Costs',
    result: 'Result',
    assets: 'Assets',
    liabilities: 'Liabilities',
    netResult: 'Net Income',
    uploadText: 'Drag files here or click to upload',
    uploadSubtext: 'Supports Excel (.xlsx) or CSV',
    template: 'Download Template',
    demo: 'Demo Data',
    period: 'Period',
    custom: 'Custom',
    months: 'months',
    year: 'year',
    smallFilter: 'Hide < €50',
    export: 'Export',
    comments: 'Comments',
    aiLoading: 'Analyzing financial data...',
    profitAndLoss: 'Profit & Loss',
    balanceSheet: 'Balance Sheet',
    aiTab: 'AI Analysis',
    aiReportTitle: 'Financial AI Analysis',
    topCosts: 'Top Expenses',
    monthlyTrend: 'Monthly Trend',
    // Detailed Report Items
    total: 'Total',
    cogs: 'Cost of Sales',
    grossProfit: 'Gross Profit',
    grossProfitDesc: 'Sales minus COGS',
    labor: 'Labor Expense',
    otherExpenses: 'Other Expenses',
    generalExpenses: 'General Expenses',
    depreciation: 'Depreciation',
    nonOperational: 'Non-operational Expenses',
    resultsAdjustments: 'Results & Adjustments',
    totalExpenses: 'Total Expenses',
    operatingResult: 'Operating Income',
    totalOperationalOther: 'Total Operational Other Expenses',
    salesTitle: 'Sales',
    startAnalysis: 'Start your analysis',
    startAnalysisSub: 'Upload an Exact Online export (CSV/Excel) or use demo data.',
    loadDemo: 'Load example report',
    currentAssets: 'Current Assets',
    fixedAssets: 'Fixed Assets',
    equity: 'Equity',
    shortTermLiabilities: 'Short-term Liabilities',
    longTermLiabilities: 'Long-term Liabilities',
    // Health Check
    healthCheck2Factor: 'Financial Health (2-Factor Model)',
    profitability: 'Profitability',
    costStructure: 'Cost Structure',
    marginLabel: 'Net Margin',
    costLabel: 'Costs % of Revenue',
    zoneCritical: 'Loss',
    zoneRisk: 'Risk',
    zoneHealthy: 'Healthy',
  },
};
