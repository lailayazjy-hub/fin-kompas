import { FinancialData } from './types';

export const EMPTY_DATA: FinancialData = {
  fixedAssets: 0,
  currentAssets: 0,
  liquidAssets: 0,
  inventory: 0,
  equity: 0,
  longTermDebt: 0,
  shortTermDebt: 0,
  revenue: 0,
  costOfGoodsSold: 0,
  operatingExpenses: 0,
  interestExpenses: 0,
  taxExpenses: 0,
};

export const DEMO_DATA: FinancialData = {
  fixedAssets: 450,
  currentAssets: 200,
  liquidAssets: 50,
  inventory: 80,
  equity: 300,
  longTermDebt: 250,
  shortTermDebt: 100,
  revenue: 800,
  costOfGoodsSold: 450,
  operatingExpenses: 200,
  interestExpenses: 15,
  taxExpenses: 35,
};

export const MOCK_COMMENTS = [
  {
    id: '1',
    ratioKey: 'currentRatio',
    author: 'Manager Jan',
    text: 'Dit ziet er stabiel uit t.o.v. vorig kwartaal.',
    timestamp: new Date(Date.now() - 86400000),
  }
];