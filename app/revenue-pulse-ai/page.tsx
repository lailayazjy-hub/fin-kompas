'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Download, Share2, Calculator, FileSpreadsheet } from 'lucide-react';
import { DataInput } from './components/DataInput';
import { ManualEntryRow } from './components/ManualEntryRow';
import { MetricCard } from './components/MetricCard';
import { Button } from './components/Button';
import { Transaction, KPIMetric, DateRange, DateRangeType } from './types';

// Date format helpers for Dutch
const formatDate = (d: Date) => d.toLocaleDateString('nl-NL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

const getPastDate = (months: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().split('T')[0];
};

function App() {
  // --- State ---
  const [currentTime, setCurrentTime] = useState(new Date());
  const [rawData, setRawData] = useState<Transaction[]>([]);
  
  // Mode Selection: 'manual' is now default as requested
  const [inputMode, setInputMode] = useState<'manual' | 'import'>('manual');
  
  const [dateRange, setDateRange] = useState<DateRange>({
    type: '3m',
    startDate: getPastDate(3),
    endDate: new Date().toISOString().split('T')[0]
  });
  
  // KPIs initialized with Dutch descriptions
  const [kpis, setKpis] = useState<KPIMetric[]>([
    { id: 'mrr', name: 'MRR', description: 'Maandelijkse Terugkerende Omzet', value: 0, unit: 'EUR', trend: 0, history: [], isLoadingAI: false },
    { id: 'arr', name: 'ARR', description: 'Jaarlijkse Terugkerende Omzet', value: 0, unit: 'EUR', trend: 0, history: [], isLoadingAI: false },
    { id: 'churn', name: 'Churn Rate', description: 'Percentage Klantenverloop', value: 0, unit: '%', trend: 0, history: [], isLoadingAI: false },
    { id: 'nrr', name: 'Net Revenue Retention', description: 'Netto Omzetbehoud', value: 0, unit: '%', trend: 0, history: [], isLoadingAI: false },
  ]);

  // --- Effects ---

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Recalculate KPIs when data or range changes (ONLY if NOT in manual mode)
  useEffect(() => {
    if (inputMode === 'import') {
        calculateKPIs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawData, dateRange, inputMode]);

  
  const calculateKPIs = useCallback(async () => {
    if (rawData.length === 0) return;

    const sortedData = [...rawData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const start = new Date(dateRange.startDate || '2000-01-01');
    const end = new Date(dateRange.endDate);

    const customerMRR = new Map<string, number>();
    
    let activeCustomersStart = 0;
    let mrrStart = 0;
    let mrrEnd = 0;
    let customersChurnedCount = 0;
    let expansionRevenue = 0;
    let contractionRevenue = 0;
    let churnedRevenue = 0;
    
    const mrrHistory: { date: string; value: number }[] = [];
    const allDates = Array.from(new Set(sortedData.map(t => t.date))).sort();
    let tIndex = 0;

    for (const dateStr of allDates) {
        const currentDate = new Date(dateStr);
        const isInPeriod = currentDate >= start && currentDate <= end;
        
        while(tIndex < sortedData.length && sortedData[tIndex].date === dateStr) {
            const t = sortedData[tIndex];
            const currentVal = customerMRR.get(t.customerId) || 0;
            
            if (t.type === 'new') {
                customerMRR.set(t.customerId, t.amount);
            } else if (t.type === 'expansion') {
                customerMRR.set(t.customerId, currentVal + t.amount);
                if (isInPeriod) expansionRevenue += t.amount;
            } else if (t.type === 'contraction') {
                customerMRR.set(t.customerId, Math.max(0, currentVal - t.amount));
                if (isInPeriod) contractionRevenue += t.amount;
            } else if (t.type === 'churn') {
                customerMRR.delete(t.customerId);
                if (isInPeriod) {
                    customersChurnedCount++;
                    churnedRevenue += t.amount;
                }
            }
            tIndex++;
        }

        let currentTotalMRR = 0;
        customerMRR.forEach(v => currentTotalMRR += v);
        
        mrrHistory.push({ date: dateStr, value: currentTotalMRR });

        if (currentDate < start) {
             activeCustomersStart = customerMRR.size;
             mrrStart = currentTotalMRR;
        }
        
        if (currentDate <= end) {
            mrrEnd = currentTotalMRR;
        }
    }

    const relevantHistory = mrrHistory.filter(h => {
        const d = new Date(h.date);
        return d >= start && d <= end;
    });
    
    const step = Math.ceil(relevantHistory.length / 30) || 1;
    const chartData = relevantHistory.filter((_, i) => i % step === 0);

    const mrrValue = mrrEnd;
    const mrrTrend = mrrStart > 0 ? ((mrrEnd - mrrStart) / mrrStart) * 100 : 0;
    const arrValue = mrrValue * 12;
    const churnRate = activeCustomersStart > 0 ? (customersChurnedCount / activeCustomersStart) * 100 : 0;
    const nrrValue = mrrStart > 0 ? ((mrrStart + expansionRevenue - contractionRevenue - churnedRevenue) / mrrStart) * 100 : 100;

    const generateRateHistory = (val: number) => chartData.map(d => ({ date: d.date, value: val }));

    const newKPIs: KPIMetric[] = [
        { ...kpis[0], value: mrrValue, history: chartData, trend: mrrTrend },
        { ...kpis[1], value: arrValue, history: chartData, trend: mrrTrend }, 
        { ...kpis[2], value: churnRate, history: generateRateHistory(churnRate), trend: 0 }, 
        { ...kpis[3], value: nrrValue, history: generateRateHistory(nrrValue), trend: nrrValue >= 100 ? 1 : -1 },
    ];

    setKpis(newKPIs);

  }, [rawData, dateRange]);

  // --- Handlers ---

  const handleRangeChange = (type: DateRangeType) => {
    const end = new Date();
    let start = new Date();
    
    if (type === '3m') start.setMonth(end.getMonth() - 3);
    else if (type === '6m') start.setMonth(end.getMonth() - 6);
    else if (type === '9m') start.setMonth(end.getMonth() - 9);
    else if (type === '1y') start.setFullYear(end.getFullYear() - 1);
    else if (type === 'custom') {
        const currentStart = new Date(dateRange.startDate);
        if (isNaN(currentStart.getTime())) start.setMonth(end.getMonth() - 1);
        else start = currentStart;
    }

    setDateRange({
        type,
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
    });
  };

  const handleDataLoaded = (data: Transaction[]) => {
      setRawData(data);
  };

  const handleManualInputUpdate = (metrics: { id: string; value: number; trend: number }[]) => {
    const generateSyntheticHistory = (val: number, trend: number) => {
        const points = 30;
        const safeTrend = isNaN(trend) ? 0 : trend;
        // Calculate start value based on trend
        const startVal = val / (1 + (safeTrend / 100));
        
        const history: { date: string; value: number }[] = [];
        const now = new Date();
        
        for (let i = 0; i < points; i++) {
            const d = new Date();
            d.setDate(now.getDate() - (points - i));
            // Linear interpolation from startVal to current val
            const currentV = startVal + ((val - startVal) * (i / points));
            history.push({
                date: d.toISOString().split('T')[0],
                value: currentV
            });
        }
        return history;
    };

    setKpis(prevKPIs => prevKPIs.map(kpi => {
        const input = metrics.find(m => m.id === kpi.id);
        if (input) {
            return {
                ...kpi,
                value: input.value,
                trend: input.trend,
                history: generateSyntheticHistory(input.value, input.trend),
            };
        }
        return kpi;
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900 hidden sm:block">RevenuePulse AI</h1>
          </div>
          
          <div className="flex items-center space-x-6">
             <div className="hidden md:flex flex-col items-end">
                <div className="flex items-center text-slate-600 text-sm font-medium">
                    <Calendar size={14} className="mr-2" />
                    {formatDate(currentTime)}
                </div>
             </div>
             <div className="flex items-center space-x-2">
                 <Button variant="outline" size="sm" onClick={() => {}} icon={<Download size={14} />}>Export</Button>
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Tabs for Mode Switching */}
        <div className="border-b border-slate-200 mb-6">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                    onClick={() => setInputMode('manual')}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                        inputMode === 'manual'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                >
                    <Calculator size={18} className="mr-2" />
                    Calculator (Stapsgewijs)
                </button>
                <button
                    onClick={() => setInputMode('import')}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                        inputMode === 'import'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                >
                    <FileSpreadsheet size={18} className="mr-2" />
                    Excel Import
                </button>
            </nav>
        </div>

        {/* Date Range Controls (Only visible for charts/dashboard view, disabled during wizard if desired, but kept here for consistency) */}
        <div className="flex justify-end mb-4">
             <div className="flex flex-col sm:flex-row items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm w-auto">
                {(['3m', '6m', '9m', '1y'] as DateRangeType[]).map((t) => (
                    <button
                        key={t}
                        onClick={() => handleRangeChange(t)}
                        disabled={inputMode === 'manual'}
                        className={`px-3 py-1 text-xs rounded-md font-medium transition-all whitespace-nowrap ${dateRange.type === t ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'} ${inputMode === 'manual' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {t}
                    </button>
                ))}
                <button
                        onClick={() => handleRangeChange('custom')}
                        disabled={inputMode === 'manual'}
                        className={`px-3 py-1 text-xs rounded-md font-medium transition-all whitespace-nowrap ${dateRange.type === 'custom' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'} ${inputMode === 'manual' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    Aangepast
                </button>

                {dateRange.type === 'custom' && inputMode !== 'manual' && (
                    <div className="flex items-center gap-1 ml-2 pl-2 border-l border-slate-200">
                        <input 
                            type="date" 
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                            className="text-xs border border-slate-300 rounded px-2 py-1" 
                        />
                        <span className="text-slate-400">-</span>
                        <input 
                            type="date" 
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                            className="text-xs border border-slate-300 rounded px-2 py-1" 
                        />
                    </div>
                )}
            </div>
        </div>

        {/* CONDITIONAL RENDER: Input Mode */}
        {inputMode === 'import' && (
            <DataInput onDataLoaded={handleDataLoaded} />
        )}

        {inputMode === 'manual' && (
            <ManualEntryRow 
                onUpdate={handleManualInputUpdate} 
                initialValues={{}}
            />
        )}

        {/* KPI Grid */}
        {(rawData.length > 0 || inputMode === 'manual') ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                {kpis.map(kpi => (
                    <MetricCard 
                        key={kpi.id} 
                        metric={kpi} 
                        dateRangeType={dateRange.type}
                    />
                ))}
             </div>
        ) : (
            /* Empty State (Only shown in Import Mode when no data) */
            inputMode === 'import' && (
                <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center">
                    <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-400">
                        <Share2 className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">Start Analyse</h3>
                    <p className="text-sm text-slate-500 mb-6 max-w-sm">
                        Upload data of gebruik de Calculator tab om te starten.
                    </p>
                </div>
            )
        )}

      </main>
    </div>
  );
}

export default App;