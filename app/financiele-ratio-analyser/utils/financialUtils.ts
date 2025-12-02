import { FinancialData, RatioResult } from '../types';

export const formatCurrencyK = (value: number): string => {
  // Value is already in thousands (e.g. 450 means 450k)
  return `€ ${value.toLocaleString('nl-NL', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}k`;
};

export const calculateRatios = (data: FinancialData): RatioResult[] => {
  const totalAssets = data.fixedAssets + data.currentAssets;
  const totalDebt = data.longTermDebt + data.shortTermDebt;
  const grossProfit = data.revenue - data.costOfGoodsSold;
  const operatingIncome = grossProfit - data.operatingExpenses;
  const netIncome = operatingIncome - data.interestExpenses - data.taxExpenses;

  const ratios: RatioResult[] = [
    // Liquiditeit
    {
      key: 'currentRatio',
      name: 'Current Ratio',
      category: 'liquiditeit',
      value: data.shortTermDebt > 0 ? data.currentAssets / data.shortTermDebt : 0,
      unit: 'ratio',
      description: 'Vlottende activa / Kortlopende schulden'
    },
    {
      key: 'quickRatio',
      name: 'Quick Ratio',
      category: 'liquiditeit',
      value: data.shortTermDebt > 0 ? (data.currentAssets - data.inventory) / data.shortTermDebt : 0,
      unit: 'ratio',
      description: '(Vlottende activa - Voorraad) / Kortlopende schulden'
    },
    // Solvabiliteit
    {
      key: 'debtRatio',
      name: 'Debt Ratio',
      category: 'solvabiliteit',
      value: totalAssets > 0 ? (totalDebt / totalAssets) * 100 : 0,
      unit: '%',
      description: 'Totaal vreemd vermogen / Totaal vermogen'
    },
    {
      key: 'equityRatio',
      name: 'Solvabiliteitsratio',
      category: 'solvabiliteit',
      value: totalAssets > 0 ? (data.equity / totalAssets) * 100 : 0,
      unit: '%',
      description: 'Eigen vermogen / Totaal vermogen'
    },
    // Rentabiliteit
    {
      key: 'grossMargin',
      name: 'Brutowinstmarge',
      category: 'rentabiliteit',
      value: data.revenue > 0 ? (grossProfit / data.revenue) * 100 : 0,
      unit: '%',
      description: 'Brutowinst / Omzet'
    },
    {
      key: 'netProfitMargin',
      name: 'Nettowinstmarge',
      category: 'rentabiliteit',
      value: data.revenue > 0 ? (netIncome / data.revenue) * 100 : 0,
      unit: '%',
      description: 'Nettowinst / Omzet'
    },
    // Efficiency (Simplified snapshot)
    {
      key: 'assetTurnover',
      name: 'Omloopsnelheid Activa',
      category: 'efficientie',
      value: totalAssets > 0 ? data.revenue / totalAssets : 0,
      unit: 'x',
      description: 'Omzet / Totaal vermogen'
    }
  ];

  return ratios;
};