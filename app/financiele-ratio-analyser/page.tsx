'use client';

import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { InputSection } from './components/InputSection';
import { RatioCard } from './components/RatioCard';
import { EMPTY_DATA, DEMO_DATA, MOCK_COMMENTS } from './constants';
import { FinancialData, Comment } from './types';
import { calculateRatios } from './utils/financialUtils';
import { Download, Printer, PieChart, PlayCircle, RotateCcw } from 'lucide-react';

const FinancieleRatioAnalyserPage: React.FC = () => {
  const [data, setData] = useState<FinancialData>(EMPTY_DATA);
  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS);
  const [period, setPeriod] = useState('3m');
  const [customStartDate, setCustomStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDataUpdate = (key: keyof FinancialData, value: number) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const loadDemoData = () => {
    setData(DEMO_DATA);
  };

  const clearData = () => {
    setData(EMPTY_DATA);
  };

  const handleAddComment = (ratioKey: string, text: string) => {
    const newComment: Comment = {
      id: Math.random().toString(36).substr(2, 9),
      ratioKey,
      author: 'U', // Current user
      text,
      timestamp: new Date(),
    };
    setComments(prev => [...prev, newComment]);
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    const element = document.getElementById('report-container');
    
    if (!element) {
      setIsGeneratingPDF(false);
      return;
    }

    // Temporarily show the print header for the PDF
    const printHeader = document.getElementById('print-header');
    if (printHeader) {
        printHeader.classList.remove('hidden');
        printHeader.classList.add('block');
    }

    const opt = {
      margin: [5, 5] as [number, number], // Small margins for landscape dashboard feel
      filename: `financieel-rapport-${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' as const }, // Changed to LANDSCAPE
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
      const html2pdf = (await import('html2pdf.js')).default;
      html2pdf().set(opt).from(element).save().then(() => {
        // Re-hide print header
        if (printHeader) {
            printHeader.classList.add('hidden');
            printHeader.classList.remove('block');
        }
        setIsGeneratingPDF(false);
      });
    } catch (error) {
      console.error("PDF generation failed", error);
      alert("PDF bibliotheek kon niet geladen worden.");
      setIsGeneratingPDF(false);
    }
  };

  const ratios = useMemo(() => calculateRatios(data), [data]);

  const groupedRatios = {
    liquiditeit: ratios.filter(r => r.category === 'liquiditeit'),
    solvabiliteit: ratios.filter(r => r.category === 'solvabiliteit'),
    rentabiliteit: ratios.filter(r => r.category === 'rentabiliteit'),
    efficientie: ratios.filter(r => r.category === 'efficientie'),
  };

  const SectionHeader = ({ title, icon: Icon }: { title: string, icon: any }) => (
    <div className="flex items-center space-x-2 mb-4 mt-6 pb-2 border-b border-gray-200 break-after-avoid break-inside-avoid print:mt-4">
      <div className="bg-slate-100 p-1.5 rounded-md">
        <Icon className="h-5 w-5 text-slate-700" />
      </div>
      <h2 className="text-lg font-bold text-slate-800">{title}</h2>
    </div>
  );

  // Check if data is empty to show placeholder or demo prompt
  const isDataEmpty = Object.values(data).every(val => val === 0);

  return (
    <div className="min-h-screen bg-gray-100 text-slate-900 font-sans pb-12 print:bg-white print:pb-0 print:w-full" id="report-container">
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { 
              background: white !important; 
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
          }
          /* Ensure charts and backgrounds print correctly */
          * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
          }
          .break-before-page { page-break-before: always; }
          .break-after-page { page-break-after: always; }
          .break-inside-avoid { page-break-inside: avoid; }
          .break-after-avoid { page-break-after: avoid; }
        }
      `}</style>
      <div className="no-print" data-html2canvas-ignore="true">

        <Header />
      </div>
      
      {/* Header for print/PDF only */}
      <div id="print-header" className="hidden print:block border-b-2 border-red-600 mb-6 pb-4 pt-6 px-8">
        <div className="flex justify-between items-end">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Financieel Ratio Rapport</h1>
                <p className="text-sm text-slate-500">Gegenereerd op {new Date().toLocaleDateString('nl-NL')}</p>
            </div>
            <div className="text-right">
                <p className="text-xs text-slate-400 uppercase tracking-wider">Periode</p>
                <p className="font-bold text-slate-800">{period === 'custom' ? 'Aangepast' : 
                   period === '3m' ? 'Afgelopen 3 Maanden' :
                   period === '6m' ? 'Afgelopen 6 Maanden' :
                   period === '9m' ? 'Afgelopen 9 Maanden' : 'Afgelopen Jaar'
                }</p>
            </div>
        </div>
      </div>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-4 print:max-w-none">
        
        {/* Controls Bar - Hidden in PDF via data-html2canvas-ignore */}
        <div data-html2canvas-ignore="true" className="no-print flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-8 bg-white p-4 rounded border border-gray-200 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Analyse Periode</label>
               <select 
                  value={period} 
                  onChange={(e) => setPeriod(e.target.value)}
                  className="block w-48 pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded bg-white text-slate-700"
               >
                 <option value="3m">Afgelopen 3 maanden</option>
                 <option value="6m">Afgelopen 6 maanden</option>
                 <option value="9m">Afgelopen 9 maanden</option>
                 <option value="1y">Afgelopen 1 jaar</option>
                 <option value="custom">Aangepast bereik...</option>
               </select>

               {period === 'custom' && (
                 <div className="flex space-x-2 mt-2 animate-in fade-in slide-in-from-top-1">
                   <div>
                     <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Van</label>
                     <input 
                       type="date" 
                       value={customStartDate}
                       onChange={(e) => setCustomStartDate(e.target.value)}
                       className="block w-32 px-2 py-1 text-xs border-gray-300 rounded focus:ring-red-500 focus:border-red-500 text-slate-700"
                     />
                   </div>
                   <div>
                     <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Tot</label>
                     <input 
                       type="date" 
                       value={customEndDate}
                       onChange={(e) => setCustomEndDate(e.target.value)}
                       className="block w-32 px-2 py-1 text-xs border-gray-300 rounded focus:ring-red-500 focus:border-red-500 text-slate-700"
                     />
                   </div>
                 </div>
               )}
            </div>
            
            {/* Demo Button */}
            <div className="sm:mt-5">
              {isDataEmpty ? (
                <button 
                  onClick={loadDemoData}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
                >
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Start Demo
                </button>
              ) : (
                <button 
                  onClick={clearData}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded text-slate-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </button>
              )}
            </div>
          </div>

          <div className="flex space-x-2 lg:mt-5">
            <button 
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-wait"
            >
              <Download className={`h-4 w-4 mr-2 ${isGeneratingPDF ? 'animate-bounce' : ''}`} />
              {isGeneratingPDF ? 'Bezig...' : 'Download PDF'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:block">
          
          {/* Left Column: Inputs */}
          <div className="lg:col-span-1 print:hidden">
            <InputSection data={data} onUpdate={handleDataUpdate} />
            
            {/* Quick Summary Card */}
            {!isDataEmpty && (
              <div className="bg-slate-800 rounded shadow-lg p-6 text-white border-t-4 border-red-500 mt-4 lg:mt-0">
                <h3 className="text-lg font-bold mb-4 flex items-center">
                  <PieChart className="h-5 w-5 mr-2 text-red-400" />
                  Korte Samenvatting
                </h3>
                <div className="space-y-4">
                   <div className="flex justify-between border-b border-slate-700 pb-2">
                     <span className="text-slate-400 text-sm">Netto Winst</span>
                     <span className="font-mono font-bold text-emerald-400">
                       € {(data.revenue - data.costOfGoodsSold - data.operatingExpenses - data.interestExpenses - data.taxExpenses).toFixed(1)}k
                     </span>
                   </div>
                   <div className="flex justify-between border-b border-slate-700 pb-2">
                     <span className="text-slate-400 text-sm">Totaal Activa</span>
                     <span className="font-mono font-bold">
                       € {(data.fixedAssets + data.currentAssets).toFixed(1)}k
                     </span>
                   </div>
                   <div className="mt-4 p-3 bg-slate-700/50 rounded border border-slate-600">
                     <p className="text-xs text-slate-300 italic">
                       "De solvabiliteitspositie oogt gezond op basis van de ingevoerde kerncijfers."
                     </p>
                   </div>
                </div>
              </div>
            )}
            {isDataEmpty && (
              <div className="p-6 bg-blue-50 border border-blue-100 rounded text-center">
                <p className="text-blue-800 text-sm mb-2">Geen gegevens aanwezig.</p>
                <button onClick={loadDemoData} className="text-xs font-bold text-blue-600 underline">Laad voorbeeld data</button>
              </div>
            )}
          </div>

          {/* Right Column: Ratios */}
          <div className="lg:col-span-2 space-y-2 print:space-y-0 print:col-span-3 print:w-full w-full">
            
            {/* Print Summary */}
            <div className="hidden print:block mb-6 p-4 border border-slate-200 bg-slate-50 rounded">
               <h3 className="font-bold text-sm mb-2">Samenvatting Kerncijfers</h3>
               <div className="grid grid-cols-3 gap-4 text-xs">
                 <div>
                   <span className="text-slate-500 block">Omzet</span>
                   <span className="font-bold">€ {data.revenue}k</span>
                 </div>
                 <div>
                   <span className="text-slate-500 block">Netto Winst</span>
                   <span className="font-bold">€ {(data.revenue - data.costOfGoodsSold - data.operatingExpenses - data.interestExpenses - data.taxExpenses).toFixed(1)}k</span>
                 </div>
                 <div>
                   <span className="text-slate-500 block">Eigen Vermogen</span>
                   <span className="font-bold">€ {data.equity}k</span>
                 </div>
               </div>
            </div>

            <SectionHeader title="Liquiditeit" icon={PieChart} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-3 print:gap-4">
              {groupedRatios.liquiditeit.map(r => (
                <div key={r.key} className="break-inside-avoid">
                    <RatioCard 
                    ratio={r} 
                    period={period}
                    comments={comments.filter(c => c.ratioKey === r.key)}
                    onAddComment={(text) => handleAddComment(r.key, text)}
                    />
                </div>
              ))}
            </div>

            <SectionHeader title="Solvabiliteit" icon={PieChart} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-3 print:gap-4">
              {groupedRatios.solvabiliteit.map(r => (
                <div key={r.key} className="break-inside-avoid">
                    <RatioCard 
                    ratio={r} 
                    period={period}
                    comments={comments.filter(c => c.ratioKey === r.key)}
                    onAddComment={(text) => handleAddComment(r.key, text)}
                    />
                </div>
              ))}
            </div>

            <SectionHeader title="Rentabiliteit" icon={PieChart} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-3 print:gap-4">
              {groupedRatios.rentabiliteit.map(r => (
                <div key={r.key} className="break-inside-avoid">
                    <RatioCard 
                    ratio={r} 
                    period={period}
                    comments={comments.filter(c => c.ratioKey === r.key)}
                    onAddComment={(text) => handleAddComment(r.key, text)}
                    />
                </div>
              ))}
            </div>
             
            <SectionHeader title="Efficiency" icon={PieChart} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-3 print:gap-4">
               {groupedRatios.efficientie.map(r => (
                <div key={r.key} className="break-inside-avoid">
                    <RatioCard 
                    ratio={r} 
                    period={period}
                    comments={comments.filter(c => c.ratioKey === r.key)}
                    onAddComment={(text) => handleAddComment(r.key, text)}
                    />
                </div>
              ))}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default FinancieleRatioAnalyserPage;