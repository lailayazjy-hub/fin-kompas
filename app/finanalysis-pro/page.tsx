"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Settings, 
  Upload, 
  Download, 
  Calendar, 
  User, 
  MessageSquare,
  TrendingUp,
  Filter,
  RefreshCw,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
  PieChart as PieIcon,
  Columns,
  CheckCircle2,
  XCircle,
  GripVertical
} from 'lucide-react';
import { 
  PieChart,
  Pie,
  Cell,
  Tooltip, 
  ResponsiveContainer,
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid
} from 'recharts';
import * as XLSX from 'xlsx';

import { AppSettings, ThemeName, ProcessedData, FinancialRecord, ReportSection, ReportItem } from './types';
import { DEFAULT_SETTINGS, THEMES, WoodpeckerLogo, TRANSLATIONS } from './constants';
import SettingsModal from './components/SettingsModal';
import { generateFinancialAnalysis } from './services/geminiService';

// --- MOCK DATA GENERATOR ---
const generateMockData = (lang: 'nl' | 'en'): FinancialRecord[] => {
  const records: FinancialRecord[] = [];
  const isNl = lang === 'nl';

  // P&L Items
  const revenueItems = isNl 
    ? ['Verkoop Eten', 'Verkoop Drank', 'Wijn', 'Bier']
    : ['Food Sales', 'Beverage Sales', 'Wine', 'Beer'];
  const cogsItems = isNl
    ? ['Inkoop Eten', 'Inkoop Drank']
    : ['Food Cost', 'Beverage Cost'];
  const expenseItems = isNl
    ? ['Huur', 'Gas/Water/Licht', 'Marketing', 'Onderhoud']
    : ['Rent', 'Utilities', 'Marketing', 'Repairs & Maintenance'];
  const depItems = isNl
    ? ['Afschrijving Inventaris', 'Afschrijving Verbouwing']
    : ['Depreciation Inventory', 'Depreciation Improvements'];
  const nonOpItems = isNl
    ? ['Rentelasten Bank', 'Vennootschapsbelasting', 'Bankkosten']
    : ['Interest Expense', 'Corporate Tax', 'Bank Charges'];

  // Balance Sheet Items (Mocking with 0xxx, 1xxx, 2xxx)
  const assetItems = isNl 
    ? ['Inventaris', 'Computers', 'Debiteuren', 'Bank ING']
    : ['Inventory', 'Computers', 'Accounts Receivable', 'Bank ING'];
    
  const liabilityItems = isNl
    ? ['Crediteuren', 'Lening Rabobank', 'BTW Te Betalen']
    : ['Accounts Payable', 'Loan Rabobank', 'VAT Payable'];

  const equityItems = isNl
    ? ['Aandelenkapitaal', 'Winstreserve', 'Resultaat geselecteerde perioden']
    : ['Share Capital', 'Retained Earnings', 'Result Current Period'];

  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];

  const addRecord = (desc: string, min: number, max: number, glPrefix: string, type: 'revenue' | 'expense' | 'asset' | 'liability' | 'equity') => {
    const val = Math.floor(Math.random() * (max - min)) + min;
    
    let debet = 0;
    let credit = 0;

    // Determine typical D/C nature
    // Revenue, Liabilities, Equity -> Credit usually
    // Expenses, Assets -> Debit usually
    if (type === 'revenue' || type === 'liability' || type === 'equity') {
        credit = val;
    } else {
        debet = val;
    }

    records.push({
      id: Math.random().toString(36).substr(2, 9),
      datum: dateStr,
      grootboek: glPrefix + Math.floor(Math.random() * 99).toString().padStart(2, '0'),
      omschrijving: desc,
      debet: debet,
      credit: credit,
      type: debet > 0 ? 'debet' : 'credit'
    });
  };

  revenueItems.forEach(i => addRecord(i, 15000, 35000, '80', 'revenue'));
  cogsItems.forEach(i => addRecord(i, 5000, 10000, '70', 'expense'));
  expenseItems.forEach(i => addRecord(i, 1000, 5000, '40', 'expense'));
  depItems.forEach(i => addRecord(i, 500, 1500, '48', 'expense'));
  nonOpItems.forEach(i => addRecord(i, 500, 2000, '90', 'expense'));

  // Add Balance Sheet Data
  assetItems.forEach(i => addRecord(i, 5000, 50000, '01', 'asset')); 
  liabilityItems.forEach(i => addRecord(i, 2000, 20000, '16', 'liability')); 
  equityItems.forEach(i => addRecord(i, 10000, 100000, '05', 'equity')); 

  return records;
};

// --- COMPONENTS ---

interface ReportTableProps {
  id: string; // Unique ID for the section to track sorting
  title: string;
  section: ReportSection;
  currencyFormatter: (v: number) => string;
  themeColor: string;
  totalLabel: string;
  onReorder: (sectionId: string, newOrder: string[]) => void;
  onMoveItem: (itemName: string, fromSection: string, toSection: string) => void;
}

const ReportTable = ({ id, title, section, currencyFormatter, themeColor, totalLabel, onReorder, onMoveItem }: ReportTableProps) => {
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null);

  if (section.items.length === 0) {
      // Allow dropping into empty table
       return (
        <div 
            className="mb-8 break-inside-avoid min-h-[50px] border-2 border-dashed border-gray-100 rounded flex items-center justify-center bg-gray-50/50"
            onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
            }}
            onDrop={(e) => {
                e.preventDefault();
                try {
                    const data = JSON.parse(e.dataTransfer.getData("application/json"));
                    if (data && data.fromSection !== id) {
                        onMoveItem(data.item, data.fromSection, id);
                    }
                } catch (err) { console.error(err); }
            }}
        >
             <div className="text-center text-gray-300 text-xs py-2">
                <p className="font-bold text-gray-400">{title}</p>
                <p>Leeg (Sleep items hierheen)</p>
            </div>
        </div>
       );
  }

  const handleDragStart = (e: React.DragEvent, item: ReportItem) => {
    e.dataTransfer.effectAllowed = "move";
    // Send data to identify item and source section
    e.dataTransfer.setData("application/json", JSON.stringify({ item: item.name, fromSection: id }));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = "move";
    setDraggedOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    setDraggedOverIndex(null);

    try {
        const dataStr = e.dataTransfer.getData("application/json");
        if (!dataStr) return;
        const data = JSON.parse(dataStr);
        
        // CASE 1: Moving from another section
        if (data.fromSection !== id) {
            onMoveItem(data.item, data.fromSection, id);
            return;
        }

        // CASE 2: Reordering within same section
        const draggedItemName = data.item;
        
        // Find current index of dragged item
        const currentIndex = section.items.findIndex(i => i.name === draggedItemName);
        if (currentIndex === -1 || currentIndex === targetIndex) return;

        const newItems = [...section.items];
        const itemToMove = newItems[currentIndex];
        
        newItems.splice(currentIndex, 1);
        newItems.splice(targetIndex, 0, itemToMove);

        // Notify parent
        const newOrder = newItems.map(i => i.name);
        onReorder(id, newOrder);

    } catch (err) {
        console.error("Drop error", err);
    }
  };

  const handleDragLeave = () => {
    setDraggedOverIndex(null);
  };
  
  return (
    <div className="mb-8 break-inside-avoid">
      <h4 className="font-bold text-sm uppercase border-b-2 border-gray-800 pb-1 mb-3 flex justify-between items-end">
        <span>{title}</span>
      </h4>
      <table className="w-full text-sm">
        <tbody
            onDragOver={(e) => {
                 // Allow dropping at end of table (if missed a row)
                 e.preventDefault();
                 e.dataTransfer.dropEffect = "move";
            }}
            onDrop={(e) => {
                 // Handle drop on table body (append to end) if not dropped on specific row
                 e.preventDefault();
                 try {
                    const data = JSON.parse(e.dataTransfer.getData("application/json"));
                    if (data && data.fromSection !== id) {
                        onMoveItem(data.item, data.fromSection, id);
                    }
                 } catch (err) {}
            }}
        >
          {section.items.map((item, idx) => (
            <tr 
              key={item.name} 
              draggable
              onDragStart={(e) => handleDragStart(e, item)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={(e) => {
                  e.stopPropagation(); // Stop bubbling to tbody
                  handleDrop(e, idx);
              }}
              onDragLeave={handleDragLeave}
              className={`border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors cursor-move group ${draggedOverIndex === idx ? 'bg-blue-50 border-t-2 border-blue-400' : ''}`}
            >
              <td className="w-6 py-2 text-gray-300 group-hover:text-gray-500">
                  <GripVertical size={14} />
              </td>
              <td className="py-2 text-gray-600 truncate max-w-[200px]">{item.name}</td>
              <td className="py-2 text-right font-medium text-gray-800">{currencyFormatter(item.value)}</td>
            </tr>
          ))}
          <tr className="border-t border-gray-300 font-bold">
            <td colSpan={2} className="py-3 uppercase text-xs tracking-wide text-gray-500">{totalLabel}</td>
            <td className="py-3 text-right text-base" style={{ color: themeColor }}>{currencyFormatter(section.total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

const App: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [rawData, setRawData] = useState<FinancialRecord[]>([]);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  
  const [metaData, setMetaData] = useState<{year?: string, period?: string} | undefined>(undefined);
  const [validationTotals, setValidationTotals] = useState<{name: string, value: number, year?: string}[]>([]);
  
  // Multi-year support
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');

  // Sorting State: Maps section ID -> Array of Item Names
  const [sortOrder, setSortOrder] = useState<Record<string, string[]>>({});
  
  // Category Override State: Maps Item Name -> Section ID (e.g., "Bank" -> "liabilities")
  const [categoryOverrides, setCategoryOverrides] = useState<Record<string, string>>({});

  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [hideSmallAmounts, setHideSmallAmounts] = useState(false);
  const [viewMode, setViewMode] = useState<'pnl' | 'balance' | 'ai'>('pnl');
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const themeColors = THEMES[settings.theme];
  const t = TRANSLATIONS[settings.language];

  // Helper to apply sort order
  const applySort = (items: ReportItem[], sectionKey: string): ReportItem[] => {
    const order = sortOrder[sectionKey];
    
    // If no manual order, return items as they are (preserving file/insertion order)
    if (!order || order.length === 0) {
        return items;
    }

    // Split into sorted (those in 'order') and unsorted (rest)
    const sortedItems: ReportItem[] = [];
    const unsortedItems: ReportItem[] = [];
    
    // Map for fast lookup
    const itemMap = new Map(items.map(i => [i.name, i]));
    
    // 1. Add items specified in 'order'
    order.forEach(name => {
        const item = itemMap.get(name);
        if (item) {
            sortedItems.push(item);
            itemMap.delete(name); 
        }
    });
    
    // 2. Add remaining items in their original relative order
    items.forEach(item => {
        if (itemMap.has(item.name)) {
            unsortedItems.push(item);
        }
    });

    return [...sortedItems, ...unsortedItems];
  };

  // Data Processor
  useEffect(() => {
    if (rawData.length === 0) {
      setProcessedData(null);
      return;
    }

    const process = (): ProcessedData => {
      let filtered = [...rawData];

      // Filter by selected year if applicable
      if (selectedYear && availableYears.length > 0) {
          filtered = filtered.filter(r => r.datum.startsWith(selectedYear));
      }

      if (hideSmallAmounts) {
        // Filter based on net impact
        filtered = filtered.filter(r => Math.abs(r.debet - r.credit) >= settings.smallAmountFilter);
      }

      // Buckets
      const buckets: Record<string, ReportItem[]> = {
          sales: [],
          cogs: [],
          labor: [],
          otherExpenses: [],
          depreciation: [],
          nonOperationalExpenses: [],
          resultsAdjustments: [],
          assets: [],
          liabilities: [],
          equity: []
      };

      const monthlyStats: Record<string, { revenue: number, costs: number }> = {};

      filtered.forEach(record => {
        const glStr = record.grootboek.replace(/[^0-9]/g, '');
        const gl = parseInt(glStr || '0');
        const desc = record.omschrijving;
        const monthKey = record.datum ? record.datum.substring(0, 7) : 'Unknown';

        // STRICT LOGIC: Amount = Debet - Credit
        const amount = record.debet - record.credit;

        // Determine bucket
        let targetBucket = '';

        // 1. Check Overrides first
        if (categoryOverrides[desc]) {
            targetBucket = categoryOverrides[desc];
        }
        else {
            // 2. Default Logic
            // The user requested NO heuristic forcing based on keywords for Balance Sheet items.
            // Items should only go to Assets/Liabilities/Equity if GL code dictates it (0xxx-3xxx range typically)
            // or if manually dragged. Input file is leading.

            if (gl >= 4000 || isNaN(gl) || gl === 9999 || gl === 0) { // Typical P&L range
                const lowerDesc = desc.toLowerCase();
                
                // --- P&L LOGIC ---
                // We keep P&L categorizations as they are functional groupings within P&L
                if (lowerDesc.includes('onverwerkt') || lowerDesc.includes('onverdeeld') || 
                    lowerDesc.includes('winstverdeling')) {
                     // FIX: User requested these to be on Balance Sheet (Equity)
                     targetBucket = 'equity';
                }
                // Check Non-operational (Rente, Belasting, Tax, VPB, BTW, Bankkosten)
                else if (lowerDesc.includes('rente') || lowerDesc.includes('interest') || 
                    lowerDesc.includes('belasting') || lowerDesc.includes('tax') || 
                    lowerDesc.includes('vpb') || lowerDesc.includes('vennootschap') || 
                    lowerDesc.includes('btw') || lowerDesc.includes('bankkosten')) {
                    targetBucket = 'nonOperationalExpenses';
                } 
                else if (lowerDesc.includes('afschrijving') || lowerDesc.includes('amorti') || lowerDesc.includes('afschr')) {
                    targetBucket = 'depreciation';
                }
                else if (gl >= 8000) {
                    targetBucket = 'sales';
                } else if (gl >= 7000) {
                    targetBucket = 'cogs';
                } else {
                     const laborKeywords = [
                         'salaris', 'loon', 'wage', 'personeel', 'staff',
                         'pensioen', 'lunch', 'reis', 'verzuim', 'wbso',
                         'premie', 'zorg', 'verblijf', 'vakantie',
                         'opleiding', 'kantine', 'vergoeding', 'recruitment',
                         'werving', 'bijdrage'
                     ];

                     if (laborKeywords.some(k => lowerDesc.includes(k))) {
                        targetBucket = 'labor';
                     } else if (lowerDesc.includes('resultaat') && !lowerDesc.includes('perioden') && !lowerDesc.includes('boekjaar')) {
                        // "Resultaat" line item in P&L export
                        targetBucket = 'resultsAdjustments';
                     } else {
                        targetBucket = 'otherExpenses';
                     }
                }
            } else {
                 // Standard Balance Sheet GL ranges (0-3xxx)
                 if (gl < 500 || (gl >= 1000 && gl < 1400)) {
                     targetBucket = 'assets';
                 } else if (gl >= 500 && gl < 1000) {
                     targetBucket = 'equity';
                 } else {
                     targetBucket = 'liabilities';
                 }
            }
        }

        // Add to bucket
        if (buckets[targetBucket]) {
            buckets[targetBucket].push({ name: desc, value: amount });
        }

        // Stats accumulation (simplified for now, mostly for P&L chart)
        if (gl >= 4000 && targetBucket !== 'resultsAdjustments' && targetBucket !== 'equity' && targetBucket !== 'assets' && targetBucket !== 'liabilities') {
             if (!monthlyStats[monthKey]) monthlyStats[monthKey] = { revenue: 0, costs: 0 };
             if (targetBucket === 'sales') {
                 monthlyStats[monthKey].revenue += amount;
             } else {
                 monthlyStats[monthKey].costs += amount;
             }
        }
      });

      // Helper for grouping items by description (summing up ledger accounts)
      const groupItems = (items: ReportItem[]) => {
        const map = new Map<string, number>();
        items.forEach(i => map.set(i.name, (map.get(i.name) || 0) + i.value));
        return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
      };

      const finalSales = applySort(groupItems(buckets.sales), 'sales');
      const finalCogs = applySort(groupItems(buckets.cogs), 'cogs'); 
      const finalLabor = applySort(groupItems(buckets.labor), 'labor');
      const finalOther = applySort(groupItems(buckets.otherExpenses), 'otherExpenses');
      const finalDepreciation = applySort(groupItems(buckets.depreciation), 'depreciation');
      const finalNonOperational = applySort(groupItems(buckets.nonOperationalExpenses), 'nonOperationalExpenses');
      const finalResultsAdjustments = applySort(groupItems(buckets.resultsAdjustments), 'resultsAdjustments');
      
      const finalAssets = applySort(groupItems(buckets.assets), 'assets');
      const finalLiabilities = applySort(groupItems(buckets.liabilities), 'liabilities');
      const finalEquity = applySort(groupItems(buckets.equity), 'equity');

      // Calculate Totals
      const totalSales = finalSales.reduce((sum, i) => sum + i.value, 0);
      const totalCogs = finalCogs.reduce((sum, i) => sum + i.value, 0);
      const totalLabor = finalLabor.reduce((sum, i) => sum + i.value, 0);
      const totalOther = finalOther.reduce((sum, i) => sum + i.value, 0);
      const totalDepreciation = finalDepreciation.reduce((sum, i) => sum + i.value, 0);
      const totalNonOperational = finalNonOperational.reduce((sum, i) => sum + i.value, 0);
      const totalResultsAdjustments = finalResultsAdjustments.reduce((sum, i) => sum + i.value, 0);
      
      const totalAssets = finalAssets.reduce((sum, i) => sum + i.value, 0);
      const totalLiabilities = finalLiabilities.reduce((sum, i) => sum + i.value, 0);
      const totalEquity = finalEquity.reduce((sum, i) => sum + i.value, 0);

      const grossProfit = totalSales + totalCogs;
      // Operating Income (Bedrijfsresultaat) = Gross Profit + Labor + Other + Depreciation
      const operatingIncome = grossProfit + totalLabor + totalOther + totalDepreciation;
      const netIncome = operatingIncome + totalNonOperational; // Result before adjustments
      
      const totalOperationalOtherExpenses = totalOther + totalDepreciation;
      const totalExpenses = totalLabor + totalOther + totalDepreciation + totalNonOperational;

      const expenseDistribution = [
        { name: settings.language === 'nl' ? 'Kostprijs' : 'COGS', value: totalCogs, color: themeColors.primary },
        { name: settings.language === 'nl' ? 'Personeel' : 'Labor', value: totalLabor, color: themeColors.mediumRisk },
        { name: settings.language === 'nl' ? 'Overig' : 'Other', value: totalOther, color: themeColors.highRisk },
        { name: settings.language === 'nl' ? 'Afschrijving' : 'Depreciation', value: totalDepreciation, color: themeColors.lowRisk },
        { name: settings.language === 'nl' ? 'Niet-operationeel' : 'Non-operational', value: totalNonOperational, color: '#9CA3AF' },
      ].filter(d => d.value > 0);

       const monthlyData = Object.entries(monthlyStats)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([month, data]) => ({
          month,
          revenue: Math.abs(data.revenue),
          costs: data.costs,
          result: data.revenue + data.costs
        }));

      return {
        records: filtered,
        meta: metaData,
        availableYears,
        validationTotals,
        netIncome,
        grossProfit,
        operatingIncome,
        totalOperationalOtherExpenses,
        totalExpenses,
        sales: { items: finalSales, total: totalSales },
        cogs: { items: finalCogs, total: totalCogs },
        labor: { items: finalLabor, total: totalLabor },
        otherExpenses: { items: finalOther, total: totalOther },
        depreciation: { items: finalDepreciation, total: totalDepreciation },
        nonOperationalExpenses: { items: finalNonOperational, total: totalNonOperational },
        resultsAdjustments: { items: finalResultsAdjustments, total: totalResultsAdjustments },
        balanceSheet: {
            assets: { items: finalAssets, total: totalAssets },
            liabilities: { items: finalLiabilities, total: totalLiabilities },
            equity: { items: finalEquity, total: totalEquity },
            totalAssets,
            totalLiabilities,
            totalEquity
        },
        expenseDistribution,
        monthlyData
      };
    };

    const data = process();
    setProcessedData(data);
    
    // Auto switch only on initial load
    if (viewMode === 'pnl' && data.balanceSheet && data.balanceSheet.totalAssets > 0 && Math.abs(data.sales.total) === 0 && !processedData) {
        setViewMode('balance');
    }
    
    if (settings.showAIAnalysis) {
      setIsLoadingAi(true);
      generateFinancialAnalysis(data, settings.language)
        .then(setAiAnalysis)
        .finally(() => setIsLoadingAi(false));
    }

  }, [rawData, settings.smallAmountFilter, hideSmallAmounts, settings.theme, settings.language, metaData, validationTotals, sortOrder, categoryOverrides, selectedYear, availableYears]);

  // Handlers
  const handleLoadDemo = () => {
    setUploadError(null);
    setMetaData(undefined);
    setValidationTotals([]);
    setSortOrder({});
    setCategoryOverrides({});
    setAvailableYears([]);
    setSelectedYear('');
    setRawData(generateMockData(settings.language));
  };

  const handleReorder = (sectionId: string, newOrder: string[]) => {
    setSortOrder(prev => ({
        ...prev,
        [sectionId]: newOrder
    }));
  };

  const handleMoveItem = (itemName: string, fromSection: string, toSection: string) => {
      setCategoryOverrides(prev => ({
          ...prev,
          [itemName]: toSection
      }));
  };

  const handleExportPDF = () => {
    const element = document.getElementById('report-content');
    if (!element) return;
    
    // @ts-ignore
    if (window.html2pdf) {
        const opt = {
            margin: 10,
            filename: `${settings.appName}_Report.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        // @ts-ignore
        window.html2pdf().set(opt).from(element).save();
    } else {
        alert("PDF functionaliteit is nog aan het laden. Probeer het over enkele seconden opnieuw.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    setValidationTotals([]);
    setCategoryOverrides({}); 
    setAvailableYears([]);
    setSelectedYear('');
    
    const newRecords: FinancialRecord[] = [];
    const foundTotals: {name: string, value: number, year?: string}[] = [];
    const foundYears = new Set<string>();

    // Row processing helper
    const processRow = (datum: any, gl: any, desc: any, debet: number, credit: number, index: number, yearOverride?: string) => {
      let finalDate = yearOverride ? `${yearOverride}-12-31` : new Date().toISOString().split('T')[0];
      
      if (!yearOverride && datum) {
        if (typeof datum === 'number' && datum > 20000) {
           const d = new Date(Math.round((datum - 25569)*86400*1000));
           finalDate = d.toISOString().split('T')[0];
        } else {
           const dStr = String(datum);
           if (dStr.match(/^\d{2}-\d{2}-\d{4}$/)) {
             const parts = dStr.split('-');
             finalDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
           } else if (dStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
             finalDate = dStr;
           }
        }
      }

      // Handle combined GL - Desc
      let finalGL = String(gl || '');
      let finalDesc = String(desc || 'Onbekend');

      const combinedPattern = /^(\d{3,})\s*-\s*(.*)/;
      const glMatch = finalGL.match(combinedPattern);
      if (glMatch) {
          finalGL = glMatch[1];
          if (finalDesc === 'Onbekend' || finalDesc === '') {
              finalDesc = glMatch[2];
          }
      } else {
          const descMatch = finalDesc.match(combinedPattern);
          if (descMatch) {
              finalGL = descMatch[1];
              finalDesc = descMatch[2];
          }
      }
      
      // If still no GL but we have description and value, try to infer or keep it if description has digits
      if (!finalGL || finalGL === 'undefined') {
          // If description starts with numbers, treat as GL
          const startsWithNum = finalDesc.match(/^(\d{4})\s/);
          if (startsWithNum) {
              finalGL = startsWithNum[1];
          }
      }

      finalGL = finalGL.replace(/[^0-9]/g, '');

      // Fallback: If no GL but we have data, use a dummy GL based on row index to ensure it is added
      // This prevents "No valid transactions" for balance sheet items without explicit codes in header
      if (!finalGL && finalDesc !== 'Onbekend' && (debet !== 0 || credit !== 0)) {
           // Heuristic: If Desc contains "Activa" or "Passiva", treat as header/total row -> skip
           // If it looks like a line item, assign dummy GL
           if (!finalDesc.toLowerCase().includes('totaal') && !finalDesc.toLowerCase().includes('balance')) {
               finalGL = '9999'; // Assign to Other/Unknown
           }
      }

      if (finalGL && (debet !== 0 || credit !== 0)) {
        newRecords.push({
          id: `row-${index}-${yearOverride || 'single'}`,
          datum: finalDate,
          grootboek: finalGL,
          omschrijving: finalDesc,
          debet: debet,
          credit: credit,
          type: debet > 0 ? 'debet' : 'credit'
        });
        if (yearOverride) foundYears.add(yearOverride);
      }
    };

    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      
      if (extension === 'xlsx' || extension === 'xls' || extension === 'csv') {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        if (jsonData.length === 0) throw new Error("Bestand is leeg");

        // Metadata scan
        let detectedYear = new Date().getFullYear().toString();
        let detectedPeriod = '';
        
        for (let i = 0; i < Math.min(jsonData.length, 20); i++) {
           const rowStr = jsonData[i].join(' ').toLowerCase();
           const yearMatch = rowStr.match(/(?:boekjaar|jaar|year|bookyear)\s*[:]?\s*(\d{4})/);
           if (yearMatch) detectedYear = yearMatch[1];
           const periodMatch = rowStr.match(/(?:periode|period)\s*[:]?\s*(\d{1,2}(?:\s*-\s*\d{1,2})?|\d{4})/);
           if (periodMatch) detectedPeriod = periodMatch[1];
        }
        
        setMetaData({ year: detectedYear, period: detectedPeriod });

        // HEADER DETECTION
        let headerRowIndex = -1;
        let maxScore = 0;
        const keywords = ['grootboek', 'code', 'nr', 'omschrijving', 'naam', 'balans', 'bedrag', 'debet', 'credit', 'eindsaldo'];
        
        // Scan for header
        for (let i = 0; i < Math.min(jsonData.length, 25); i++) {
            const row = jsonData[i];
            if (!row || !Array.isArray(row)) continue;
            let score = 0;
            const rowStr = row.map(c => String(c).toLowerCase()).join(' ');
            
            // Avoid metadata rows being detected as headers
            if (rowStr.includes('boekjaar') && !rowStr.includes('bedrag')) continue;

            keywords.forEach(k => { if (rowStr.includes(k)) score++; });
            
            // Year columns count as score
            const yearsInRow = row.filter(c => String(c).match(/\b20\d{2}\b/)).length;
            score += yearsInRow;

            if (score > maxScore && score >= 1) { // Relaxed score requirement
                maxScore = score;
                headerRowIndex = i;
            }
        }

        if (headerRowIndex !== -1) {
            const headerRow = jsonData[headerRowIndex].map(h => String(h).toLowerCase());
            
            // Basic Columns
            let idxGL = headerRow.findIndex(h => h.includes('grootboek') || h.includes('code') || h.includes('nr'));
            let idxDesc = headerRow.findIndex(h => h.includes('omschrijving') || h.includes('naam'));
            // If GL not found, check combined or use Description as generic
            if (idxGL === -1 && idxDesc !== -1) idxGL = idxDesc; 
            if (idxDesc === -1) idxDesc = 0; // Fallback to first column

            let idxDate = headerRow.findIndex(h => h.includes('datum') || h.includes('date'));
            
            // Amount Columns (Single or Split)
            // Priority: Check Debet/Credit first
            let idxDebet = headerRow.findIndex(h => h.includes('debet'));
            let idxCredit = headerRow.findIndex(h => h.includes('credit'));
            let idxAmount = -1;

            if (idxDebet === -1 || idxCredit === -1) {
                // If explicit D/C not found, check "Amount" or "Eindsaldo"
                idxAmount = headerRow.findIndex(h => h.includes('bedrag') || h.includes('amount') || h.includes('saldo'));
            }

            // Year Columns Detection (e.g. "Eindsaldo 2023", "2022")
            const yearCols: {index: number, year: string}[] = [];
            headerRow.forEach((h, idx) => {
                const yMatch = h.match(/\b(20\d{2})\b/);
                if (yMatch) {
                    yearCols.push({ index: idx, year: yMatch[1] });
                }
            });

            const parseVal = (v: any) => {
                if (typeof v === 'number') return v;
                if (!v) return 0;
                let s = String(v).trim();
                
                // Handle trailing negative sign (100-)
                let isNegative = false;
                if (s.endsWith('-')) {
                    isNegative = true;
                    s = s.substring(0, s.length - 1);
                }

                // Check for Dutch format: 1.000,00 (dot thousand, comma decimal)
                // vs English 1,000.00
                const hasComma = s.includes(',');
                const hasDot = s.includes('.');

                if (hasComma && hasDot) {
                   if (s.indexOf('.') < s.indexOf(',')) {
                      // 1.000,00 -> remove dots, replace comma with dot
                      s = s.replace(/\./g, '').replace(',', '.');
                   } else {
                      // 1,000.00 -> remove commas
                      s = s.replace(/,/g, '');
                   }
                } else if (hasComma) {
                   // 100,00 -> replace comma with dot
                   s = s.replace(',', '.');
                }
                
                const val = parseFloat(s);
                return isNaN(val) ? 0 : (isNegative ? -val : val);
            };

            for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
                const row = jsonData[i];
                if (!row) continue;
                
                // VALIDATION TOTALS PARSING
                const rowStr = row.join(' ').toLowerCase();
                if (rowStr.includes('totaal') || rowStr.includes('total')) {
                    // Try to extract amount
                    // Either from explicit columns or scanning row
                    if (yearCols.length > 0) {
                        yearCols.forEach(yc => {
                            const val = parseVal(row[yc.index]);
                            if (val !== 0) {
                                foundTotals.push({ 
                                    name: String(row[idxDesc] || 'Totaal'), 
                                    value: val, // Keep absolute check later
                                    year: yc.year 
                                });
                            }
                        });
                    } else {
                        // Single year total
                        let val = 0;
                        if (idxDebet !== -1 && idxCredit !== -1) {
                            val = parseVal(row[idxDebet]) - parseVal(row[idxCredit]);
                        } else if (idxAmount !== -1) {
                            val = parseVal(row[idxAmount]);
                        } else {
                            // Fallback scan
                            for (let c = 0; c < row.length; c++) {
                                if (typeof row[c] === 'number') { val = row[c]; break; }
                            }
                        }
                        if (val !== 0) foundTotals.push({ name: String(row[idxDesc] || 'Totaal'), value: val });
                    }
                    continue; // Skip processing as record
                }

                // 1. MULTI-YEAR LOOP
                if (yearCols.length > 0) {
                    yearCols.forEach(yc => {
                         const val = parseVal(row[yc.index]);
                         if (val !== 0) {
                             // Logic: Positive = Debet, Negative = Credit
                             const d = val > 0 ? val : 0;
                             const c = val < 0 ? Math.abs(val) : 0;
                             
                             processRow(null, row[idxGL], row[idxDesc], d, c, i, yc.year);
                         }
                    });
                } 
                // 2. SPLIT COLUMNS (Debet / Credit)
                else if (idxDebet !== -1 && idxCredit !== -1) {
                    let d = parseVal(row[idxDebet]);
                    let c = parseVal(row[idxCredit]);
                    
                    // Normalize: If negative debet, move to credit
                    if (d < 0) { c += Math.abs(d); d = 0; }
                    if (c < 0) { d += Math.abs(c); c = 0; }

                    processRow(row[idxDate], row[idxGL], row[idxDesc], d, c, i);
                } 
                // 3. SINGLE COLUMN (Amount)
                else if (idxAmount !== -1) {
                    const val = parseVal(row[idxAmount]);
                    // Positive = Debet, Negative = Credit
                    const d = val > 0 ? val : 0;
                    const c = val < 0 ? Math.abs(val) : 0;
                    processRow(row[idxDate], row[idxGL], row[idxDesc], d, c, i);
                }
            }
        }
      }
      
      if (newRecords.length === 0) throw new Error("Geen geldige transactieregels gevonden in het bestand.");

      // Setup available years
      const years = Array.from(foundYears).sort().reverse();
      setAvailableYears(years);
      if (years.length > 0) setSelectedYear(years[0]);
      
      setRawData(newRecords);
      setValidationTotals(foundTotals);
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "Fout bij uploaden");
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const currencyFormatter = (value: number) => {
    const absVal = Math.abs(value);
    // If settings.currencyInThousands, divide by 1000
    const displayVal = settings.currencyInThousands ? absVal / 1000 : absVal;
    
    // Format options
    const options: Intl.NumberFormatOptions = {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: settings.currencyInThousands ? 0 : 2,
        maximumFractionDigits: settings.currencyInThousands ? 1 : 2,
    };

    let formatted = displayVal.toLocaleString(settings.language === 'nl' ? 'nl-NL' : 'en-US', options);
    
    // Add 'k' suffix if thousands
    if (settings.currencyInThousands) {
        formatted += 'k';
    }

    // Add minus sign for negative values (accounting style often uses parentheses, but minus is clearer for digital)
    return value < 0 ? `-${formatted}` : formatted;
  };

  const renderValidation = (sectionName: string, calcValue: number) => {
      // Find matching total
      // Check absolute values to ignore D/C sign differences
      const match = validationTotals.find(t => {
          // Filter by year if selected
          if (selectedYear && t.year && t.year !== selectedYear) return false;

          const n = t.name.toLowerCase();
          // Heuristic matching
          if (sectionName === 'Activa' && n.includes('activa') && !n.includes('vaste')) return true;
          if (sectionName === 'Passiva' && n.includes('passiva')) return true;
          if (sectionName === 'Eigen Vermogen' && n.includes('eigen vermogen')) return true;
          if (sectionName === 'Resultaat' && (n.includes('resultaat') || n.includes('winst'))) return true;
          return false;
      });

      if (match) {
          // Compare Abs values
          const diff = Math.abs(Math.abs(match.value) - Math.abs(calcValue));
          const isMatch = diff < 1; // Tolerance

          return (
              <div className={`mt-2 text-xs flex items-center gap-1 ${isMatch ? 'text-emerald-600' : 'text-orange-500'}`}>
                  {isMatch ? <CheckCircle2 size={12}/> : <AlertCircle size={12}/>}
                  <span>Bron validatie: {currencyFormatter(match.value)} {isMatch ? 'OK' : '(Verschil)'}</span>
              </div>
          );
      }
      return null;
  };

  return (
    <div className={`min-h-screen text-gray-800 pb-20`} style={{ fontFamily: 'Inter, sans-serif' }}>
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        settings={settings}
        onUpdateSettings={setSettings}
      />
      
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <WoodpeckerLogo className="h-8 w-8" />
              <span className="font-bold text-lg tracking-tight" style={{ color: themeColors.text }}>{settings.appName}</span>
              {metaData && (
                 <span className="ml-4 px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-500 font-medium border border-gray-200">
                    {metaData.year ? `${t.year} ${metaData.year}` : ''} {metaData.period ? `(${t.period} ${metaData.period})` : ''}
                 </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-500 mr-2 hidden sm:block">
                {new Date().toLocaleDateString(settings.language === 'nl' ? 'nl-NL' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
              
              {availableYears.length > 0 && settings.showPeriodSelector && (
                 <select 
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="border border-gray-300 rounded-md text-sm px-2 py-1.5 bg-gray-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-1"
                 >
                    {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                 </select>
              )}

              {settings.showDemo && (
                <button onClick={handleLoadDemo} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full" title={t.loadDemo}>
                  <RefreshCw size={20} />
                </button>
              )}
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
              >
                <Settings size={20} />
              </button>
              {settings.showUser && (
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center ml-2 border border-white shadow-sm">
                  <User size={16} className="text-gray-500" />
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Upload Section (if no data) */}
        {!processedData && (
          <div className="max-w-xl mx-auto mt-20 text-center">
            <div className="bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Upload size={32} className="text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.startAnalysis}</h2>
              <p className="text-gray-500 mb-8">{t.startAnalysisSub}</p>
              
              {isUploading ? (
                  <div className="flex flex-col items-center justify-center py-4">
                      <Loader2 className="animate-spin text-blue-600 mb-2" size={32} />
                      <span className="text-sm text-gray-500">Processing file...</span>
                  </div>
              ) : (
                <div className="relative group cursor-pointer">
                    <input 
                    type="file" 
                    onChange={handleFileUpload}
                    accept=".xlsx, .xls, .csv"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 group-hover:border-blue-500 group-hover:bg-blue-50 transition-all">
                    <p className="font-medium text-gray-700">{t.uploadText}</p>
                    <p className="text-xs text-gray-400 mt-1">{t.uploadSubtext}</p>
                    </div>
                </div>
              )}
              
              {uploadError && (
                  <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center justify-center gap-2">
                      <AlertCircle size={16} />
                      {uploadError}
                  </div>
              )}

              {settings.showUploadTemplate && (
                 <div className="mt-6 pt-6 border-t border-gray-100">
                    <button className="text-sm text-blue-600 hover:underline flex items-center justify-center gap-1 mx-auto">
                        <Download size={14} />
                        {t.template}
                    </button>
                 </div>
              )}
            </div>
          </div>
        )}

        {/* Dashboard (if data) */}
        {processedData && (
          <div className="animate-fade-in space-y-8">
            {/* Top Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
               <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                  <button 
                    onClick={() => setViewMode('pnl')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'pnl' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    {t.profitAndLoss}
                  </button>
                  {processedData.balanceSheet && processedData.balanceSheet.totalAssets > 0 && (
                    <button 
                        onClick={() => setViewMode('balance')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'balance' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        {t.balanceSheet}
                    </button>
                  )}
                  {settings.showAIAnalysis && (
                     <button 
                        onClick={() => setViewMode('ai')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'ai' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                     >
                        {t.aiTab}
                     </button>
                  )}
               </div>

               <div className="flex items-center gap-3">
                   <button 
                     onClick={() => setHideSmallAmounts(!hideSmallAmounts)}
                     className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${hideSmallAmounts ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                   >
                     <Filter size={16} />
                     {t.smallFilter}
                   </button>
                   
                   {settings.exportButtons.includes('pdf') && (
                     <button 
                        onClick={handleExportPDF}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                     >
                        <FileText size={16} />
                        PDF
                     </button>
                   )}
                   
                   <label className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer">
                      <Upload size={16} />
                      <span className="hidden sm:inline">Nieuw Bestand</span>
                      <input type="file" onChange={handleFileUpload} className="hidden" accept=".xlsx, .xls, .csv" />
                   </label>
               </div>
            </div>

            {/* PAPER REPORT VIEW */}
            <div id="report-content" className="bg-white shadow-xl rounded-none md:rounded-lg overflow-hidden border border-gray-200 max-w-[210mm] mx-auto min-h-[297mm] p-10 md:p-16 relative">
                 {/* Paper Header */}
                 <div className="text-center mb-12 border-b-2 border-gray-800 pb-8">
                    <h1 className="text-3xl uppercase tracking-widest font-bold text-gray-900 mb-2">{settings.appName}</h1>
                    <div className="flex justify-between items-end mt-8">
                        <div className="text-left">
                            <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">{t.period}</p>
                            <p className="text-lg font-medium">
                                {metaData && metaData.period ? `${metaData.period} ${metaData.year}` : 
                                 metaData && metaData.year ? metaData.year : 
                                 new Date().getFullYear()}
                            </p>
                        </div>
                        <div className="text-right">
                             <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">{t.netResult}</p>
                             {/* Display Net Income properly: In app logic Negative = Profit (Credit). 
                                 But on report usually Profit is shown as positive number or with (Credit).
                                 Let's stick to the visual format: Abs value with label.
                              */}
                             <p className={`text-2xl font-bold ${processedData.netIncome <= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                                {currencyFormatter(processedData.netIncome)}
                             </p>
                        </div>
                    </div>
                 </div>

                 {/* VISUALS ROW (Chart) - ONLY SHOW ON P&L (Health Indicator removed) */}
                 {viewMode === 'pnl' && (
                    <div className="mb-12 flex justify-center">
                        {/* Pie Chart Centered */}
                        <div className="h-48 w-full max-w-md relative flex items-center justify-center">
                             <ResponsiveContainer width="50%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={processedData.expenseDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={70}
                                        paddingAngle={2}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {processedData.expenseDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        formatter={(val: number) => currencyFormatter(val)}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                </PieChart>
                             </ResponsiveContainer>
                             {/* Legend on the right of pie */}
                             <div className="ml-4 flex flex-col justify-center gap-1 text-xs">
                                 {processedData.expenseDistribution.map(d => {
                                     // Calculate %
                                     const pct = (d.value / processedData.totalExpenses) * 100;
                                     return (
                                         <div key={d.name} className="flex items-center gap-2">
                                             <div className="w-2 h-2 rounded-full" style={{backgroundColor: d.color}}></div>
                                             <span className="text-gray-600 font-medium w-24 truncate">{d.name}</span>
                                             <span className="text-gray-400">{pct.toFixed(0)}%</span>
                                         </div>
                                     );
                                 })}
                             </div>
                        </div>
                    </div>
                 )}

                 {viewMode === 'pnl' && (
                     // PROFIT & LOSS VIEW
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8">
                        {/* LEFT COLUMN: Sales & COGS */}
                        <div>
                            <ReportTable 
                                id="sales"
                                title={t.salesTitle} 
                                section={processedData.sales} 
                                currencyFormatter={currencyFormatter}
                                themeColor={themeColors.text}
                                totalLabel={`${t.total} ${t.revenue}`}
                                onReorder={handleReorder}
                                onMoveItem={handleMoveItem}
                            />
                            
                            <ReportTable 
                                id="cogs"
                                title={t.cogs} 
                                section={processedData.cogs} 
                                currencyFormatter={currencyFormatter}
                                themeColor={themeColors.text}
                                totalLabel={`${t.total} ${t.cogs}`}
                                onReorder={handleReorder}
                                onMoveItem={handleMoveItem}
                            />

                            <div className="mt-8 pt-4 border-t-2 border-gray-800 flex justify-between items-center">
                                <span className="font-bold uppercase tracking-wide text-gray-900">{t.grossProfit}</span>
                                <span className="text-xl font-bold" style={{ color: themeColors.primary }}>
                                    {currencyFormatter(processedData.grossProfit)}
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1 italic">{t.grossProfitDesc}</p>
                        </div>

                        {/* RIGHT COLUMN: Expenses */}
                        <div>
                            <ReportTable 
                                id="labor"
                                title={t.labor} 
                                section={processedData.labor} 
                                currencyFormatter={currencyFormatter}
                                themeColor={themeColors.text}
                                totalLabel={t.total}
                                onReorder={handleReorder}
                                onMoveItem={handleMoveItem}
                            />

                            {/* OTHER EXPENSES BLOCK - FLATTENED */}
                            <div className="mb-8">
                                <h4 className="font-bold text-sm uppercase border-b-2 border-gray-800 pb-1 mb-4">
                                    {t.otherExpenses}
                                </h4>
                                
                                <ReportTable 
                                    id="otherExpenses"
                                    title={t.generalExpenses} 
                                    section={processedData.otherExpenses} 
                                    currencyFormatter={currencyFormatter}
                                    themeColor={themeColors.text}
                                    totalLabel={t.total}
                                    onReorder={handleReorder}
                                    onMoveItem={handleMoveItem}
                                />
                                    
                                <ReportTable 
                                    id="depreciation"
                                    title={t.depreciation} 
                                    section={processedData.depreciation} 
                                    currencyFormatter={currencyFormatter}
                                    themeColor={themeColors.text}
                                    totalLabel={t.total}
                                    onReorder={handleReorder}
                                    onMoveItem={handleMoveItem}
                                />
                                
                                {/* Subtotal Operational Other - Clean line */}
                                <div className="flex justify-between items-center py-2 border-t border-gray-800 font-bold text-sm text-gray-700 mb-6">
                                    <span>{t.totalOperationalOther}</span>
                                    <span>{currencyFormatter(processedData.totalOperationalOtherExpenses)}</span>
                                </div>

                                {/* OPERATING INCOME - Distinct Block */}
                                <div className="py-4 border-y-2 border-gray-800 mb-8 flex justify-between items-center">
                                        <span className="font-bold uppercase text-gray-900">{t.operatingResult}</span>
                                        <span className={`text-lg font-bold ${processedData.operatingIncome <= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                                        {currencyFormatter(processedData.operatingIncome)}
                                        </span>
                                </div>

                                {/* Non-Operational */}
                                <ReportTable 
                                    id="nonOperationalExpenses"
                                    title={t.nonOperational} 
                                    section={processedData.nonOperationalExpenses} 
                                    currencyFormatter={currencyFormatter}
                                    themeColor={themeColors.text}
                                    totalLabel={t.total}
                                    onReorder={handleReorder}
                                    onMoveItem={handleMoveItem}
                                />

                                <div className="mt-4 pt-2 border-t-2 border-gray-800 flex justify-between items-center font-bold text-lg">
                                    <span>{t.totalExpenses} (Incl. Niet-Op)</span>
                                    <span>{currencyFormatter(processedData.totalExpenses)}</span>
                                </div>
                            </div>

                            {/* RESULTS & ADJUSTMENTS */}
                             <ReportTable 
                                id="resultsAdjustments"
                                title={t.resultsAdjustments} 
                                section={processedData.resultsAdjustments} 
                                currencyFormatter={currencyFormatter}
                                themeColor={themeColors.text}
                                totalLabel={t.total}
                                onReorder={handleReorder}
                                onMoveItem={handleMoveItem}
                            />

                        </div>
                     </div>
                 )}

                 {viewMode === 'balance' && (
                     // BALANCE SHEET VIEW
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8 relative">
                         {/* Vertical Divider Line */}
                         <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-200 hidden md:block transform -translate-x-1/2"></div>

                         {/* ASSETS */}
                         <div>
                             <h3 className="text-xl font-bold mb-6 text-gray-900 border-b-4 border-gray-900 pb-2 inline-block">{t.assets}</h3>
                             <ReportTable 
                                id="assets"
                                title={t.assets} 
                                section={processedData.balanceSheet!.assets} 
                                currencyFormatter={currencyFormatter}
                                themeColor={themeColors.text}
                                totalLabel={t.total}
                                onReorder={handleReorder}
                                onMoveItem={handleMoveItem}
                            />
                             
                             <div className="mt-8 pt-4 border-t-4 border-gray-900 flex justify-between items-center">
                                <span className="font-bold text-lg uppercase tracking-wide">Total {t.assets}</span>
                                <span className="text-xl font-bold text-gray-900">
                                    {currencyFormatter(processedData.balanceSheet!.totalAssets)}
                                </span>
                            </div>
                            {renderValidation('Activa', processedData.balanceSheet!.totalAssets)}
                         </div>

                         {/* LIABILITIES & EQUITY */}
                         <div>
                             <h3 className="text-xl font-bold mb-6 text-gray-900 border-b-4 border-gray-900 pb-2 inline-block">{t.liabilities} & {t.equity}</h3>
                             
                             <ReportTable 
                                id="equity"
                                title={t.equity} 
                                section={processedData.balanceSheet!.equity} 
                                currencyFormatter={currencyFormatter}
                                themeColor={themeColors.text}
                                totalLabel={t.total}
                                onReorder={handleReorder}
                                onMoveItem={handleMoveItem}
                            />
                             {renderValidation('Eigen Vermogen', processedData.balanceSheet!.totalEquity)}

                             <div className="my-8"></div>

                             <ReportTable 
                                id="liabilities"
                                title={t.liabilities} 
                                section={processedData.balanceSheet!.liabilities} 
                                currencyFormatter={currencyFormatter}
                                themeColor={themeColors.text}
                                totalLabel={t.total}
                                onReorder={handleReorder}
                                onMoveItem={handleMoveItem}
                            />
                             {renderValidation('Passiva', processedData.balanceSheet!.totalLiabilities)}

                             <div className="mt-8 pt-4 border-t-4 border-gray-900 flex justify-between items-center">
                                <span className="font-bold text-lg uppercase tracking-wide">Total {t.liabilities}</span>
                                <span className="text-xl font-bold text-gray-900">
                                    {currencyFormatter(processedData.balanceSheet!.totalLiabilities + processedData.balanceSheet!.totalEquity)}
                                </span>
                            </div>
                         </div>
                     </div>
                 )}

                 {viewMode === 'ai' && (
                     // AI ANALYSIS VIEW
                     <div className="animate-fade-in">
                         <div className="flex items-center gap-4 mb-8">
                             <div className="p-3 bg-gray-100 rounded-lg">
                                 <MessageSquare size={32} className="text-gray-800" />
                             </div>
                             <div>
                                 <h2 className="text-2xl font-bold text-gray-900">{t.aiReportTitle}</h2>
                                 <p className="text-sm text-gray-500">Gegenereerd door Google Gemini AI</p>
                             </div>
                         </div>

                         {/* 2-FACTOR HEALTH INDICATOR */}
                         <div className="mb-10 bg-gray-50 p-6 rounded-xl border border-gray-200">
                            <h3 className="font-bold text-lg mb-4 text-gray-800 flex items-center gap-2">
                                <TrendingUp size={20} />
                                {t.healthCheck2Factor}
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Factor 1: Profitability (Net Margin) */}
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium">{t.profitability} ({t.marginLabel})</span>
                                        <span className="font-bold">
                                            {/* Logic: Net Income is Negative for Profit. 
                                                Calculate Margin %: (NetProfit / Abs(Revenue)) * 100 
                                            */}
                                            {(() => {
                                                const rev = Math.abs(processedData.sales.total);
                                                const profit = processedData.netIncome * -1; // Convert to positive for logic
                                                const pct = rev !== 0 ? (profit / rev) * 100 : 0;
                                                return `${pct.toFixed(1)}%`;
                                            })()}
                                        </span>
                                    </div>
                                    <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                                        {/* Scale: -20% (Loss) to +40% (Profit) */}
                                        {/* Center at roughly 33% mark (0%) */}
                                        <div className="absolute top-0 bottom-0 left-0 bg-red-400 w-1/3"></div> {/* Loss Zone */}
                                        <div className="absolute top-0 bottom-0 left-1/3 right-0 bg-emerald-500"></div> {/* Profit Zone */}
                                        
                                        {/* Marker */}
                                        {(() => {
                                            const rev = Math.abs(processedData.sales.total);
                                            const profit = processedData.netIncome * -1; 
                                            const pct = rev !== 0 ? (profit / rev) * 100 : 0;
                                            
                                            // Map pct to width. 
                                            // -20% -> 0% width
                                            // 0% -> 33.3% width
                                            // +40% -> 100% width
                                            // Range = 60 points.
                                            let pos = ((pct - (-20)) / 60) * 100;
                                            if (pos < 0) pos = 0;
                                            if (pos > 100) pos = 100;
                                            
                                            return (
                                                <div 
                                                    className="absolute top-0 bottom-0 w-1 bg-black transform -translate-x-1/2"
                                                    style={{ left: `${pos}%` }}
                                                ></div>
                                            );
                                        })()}
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                                        <span>{t.zoneCritical} (-20%)</span>
                                        <span>0%</span>
                                        <span>{t.zoneHealthy} (+40%)</span>
                                    </div>
                                </div>

                                {/* Factor 2: Cost Structure (Costs % of Revenue) */}
                                <div>
                                     <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium">{t.costStructure} ({t.costLabel})</span>
                                        <span className="font-bold">
                                            {(() => {
                                                const rev = Math.abs(processedData.sales.total);
                                                const costs = processedData.totalExpenses;
                                                const pct = rev !== 0 ? (costs / rev) * 100 : 0;
                                                return `${pct.toFixed(1)}%`;
                                            })()}
                                        </span>
                                    </div>
                                    <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                                        {/* REVERSED Scale: High Cost (Left/Red) -> Low Cost (Right/Green) */}
                                        <div className="absolute top-0 bottom-0 left-0 bg-red-400" style={{ width: '17%' }}></div> {/* > 100% */}
                                        <div className="absolute top-0 bottom-0 left-[17%] bg-orange-300" style={{ width: '17%' }}></div> {/* 80-100% */}
                                        <div className="absolute top-0 bottom-0 right-0 bg-emerald-500" style={{ width: '66%' }}></div> {/* < 80% */}

                                         {/* Marker */}
                                         {(() => {
                                            const rev = Math.abs(processedData.sales.total);
                                            const costs = processedData.totalExpenses;
                                            const pct = rev !== 0 ? (costs / rev) * 100 : 0;
                                            
                                            // Map pct to width. 
                                            // 0% cost -> 100% Position (Right)
                                            // 120% cost -> 0% Position (Left)
                                            // Formula: 100 - (pct / 1.2)
                                            
                                            let pos = 100 - (pct / 1.2);
                                            if (pos < 0) pos = 0;
                                            if (pos > 100) pos = 100;
                                            
                                            return (
                                                <div 
                                                    className="absolute top-0 bottom-0 w-1 bg-black transform -translate-x-1/2"
                                                    style={{ left: `${pos}%` }}
                                                ></div>
                                            );
                                        })()}
                                    </div>
                                     <div className="flex justify-between text-xs text-gray-400 mt-1">
                                        <span>120%+</span>
                                        <span>80%</span>
                                        <span>0%</span>
                                    </div>
                                </div>
                            </div>
                         </div>

                         <div className="prose max-w-none text-gray-800 leading-relaxed text-lg">
                             {isLoadingAi ? (
                                 <div className="flex flex-col items-center justify-center py-20 opacity-60">
                                     <Loader2 size={48} className="animate-spin mb-4" />
                                     <p>{t.aiLoading}</p>
                                 </div>
                             ) : (
                                 <div className="whitespace-pre-wrap font-serif">
                                     {aiAnalysis || "Geen analyse beschikbaar."}
                                 </div>
                             )}
                         </div>

                         {/* Add a footer specific to AI */}
                         <div className="mt-16 pt-8 border-t border-gray-200">
                             <p className="text-xs text-gray-400 italic">
                                 Disclaimer: Deze analyse is gegenereerd door kunstmatige intelligentie en dient slechts ter ondersteuning. Controleer altijd de cijfers.
                             </p>
                         </div>
                     </div>
                 )}

                 {/* Footer */}
                 <div className="mt-16 pt-8 border-t border-gray-200 text-center text-xs text-gray-400">
                    Genereerd met {settings.appName} • {new Date().getFullYear()}
                 </div>
            </div>
            
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
