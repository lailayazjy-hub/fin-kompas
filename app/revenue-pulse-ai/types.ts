export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  type: 'new' | 'renewal' | 'expansion' | 'contraction' | 'churn';
  customerId: string;
}

export interface KPIMetric {
  id: string;
  name: string;
  description: string; // New field for subtle description
  value: number;
  unit: string; // 'EUR', '%', etc.
  trend: number; // Percentage change
  history: { date: string; value: number }[];
  aiInsight?: string;
  isLoadingAI?: boolean;
}

export interface Comment {
  id: string;
  author: string;
  role: 'User' | 'Manager';
  text: string;
  timestamp: string;
}

export interface KPIComments {
  [kpiId: string]: Comment[];
}

export type DateRangeType = '3m' | '6m' | '9m' | '1y' | 'custom';

export interface DateRange {
  type: DateRangeType;
  startDate: string;
  endDate: string;
}

export enum AnalysisStatus {
  IDLE,
  PROCESSING,
  COMPLETED,
  ERROR
}