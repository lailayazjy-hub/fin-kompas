import React, { useState } from 'react';
import { FinancialData } from '../types';
import { ChevronDown, ChevronUp, Calculator, FileSpreadsheet, RefreshCw, CheckCircle } from 'lucide-react';

interface Props {
  data: FinancialData;
  onUpdate: (key: keyof FinancialData, value: number) => void;
}

export const InputSection: React.FC<Props> = ({ data, onUpdate }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'balans' | 'winst'>('balans');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processSuccess, setProcessSuccess] = useState(false);

  const triggerProcessing = () => {
    setIsProcessing(true);
    setProcessSuccess(false);
    // Simulate calculation delay for UX
    setTimeout(() => {
      setIsProcessing(false);
      setProcessSuccess(true);
      setTimeout(() => setProcessSuccess(false), 3000);
    }, 800);
  };

  const InputRow = ({ label, dataKey, bold = false }: { label: string, dataKey: keyof FinancialData, bold?: boolean }) => (
    <div className={`grid grid-cols-12 gap-4 py-2 items-center border-b border-gray-100 hover:bg-slate-50 transition-colors ${bold ? 'font-semibold bg-slate-50/50' : ''}`}>
      {/* Changed from col-span-8 to col-span-7 to give input more space */}
      <div className="col-span-7 pl-4 text-sm text-slate-700 flex items-center">
         {bold && <span className="mr-2 text-slate-400">▸</span>} {label}
      </div>
      {/* Changed from col-span-4 to col-span-5 */}
      <div className="col-span-5 pr-4">
        <div className="relative rounded-md shadow-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-gray-400 sm:text-sm">€</span>
          </div>
          <input
            type="number"
            value={data[dataKey] || ''}
            onChange={(e) => onUpdate(dataKey, parseFloat(e.target.value) || 0)}
            className="block w-full rounded border-gray-300 pl-7 pr-8 py-1.5 focus:border-red-500 focus:ring-red-500 sm:text-sm text-right font-mono text-slate-900 bg-white"
            placeholder="0"
          />
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="text-gray-400 sm:text-xs font-medium">k</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded border border-gray-300 mb-6 overflow-hidden shadow-sm">
      <div 
        className="bg-slate-50 px-4 py-3 flex items-center justify-between cursor-pointer border-b border-gray-300"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-2">
          <Calculator className="h-5 w-5 text-slate-600" />
          <h2 className="font-semibold text-slate-800">Financiële Gegevens (x € 1.000)</h2>
        </div>
        <div className="flex items-center space-x-4">
           {/* Primary Process Button */}
           <button 
             onClick={(e) => { e.stopPropagation(); triggerProcessing(); }}
             disabled={isProcessing}
             className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded shadow-sm transition-all ${
               processSuccess 
                 ? 'bg-green-600 text-white border border-green-700' 
                 : 'bg-red-600 text-white border border-red-700 hover:bg-red-700'
             } disabled:opacity-50 disabled:cursor-wait`}
           >
             {isProcessing ? (
               <RefreshCw className="h-3.5 w-3.5 animate-spin" />
             ) : processSuccess ? (
               <CheckCircle className="h-3.5 w-3.5" />
             ) : (
               <RefreshCw className="h-3.5 w-3.5" />
             )}
             <span>{processSuccess ? 'Verwerkt' : isProcessing ? 'Verwerken...' : 'Verwerken'}</span>
           </button>

          {isOpen ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
        </div>
      </div>

      {isOpen && (
        <div className="p-0">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-slate-50">
            <button
              onClick={() => setActiveTab('balans')}
              className={`flex-1 py-2 text-sm font-medium text-center border-t-2 transition-colors ${activeTab === 'balans' ? 'border-t-red-600 bg-white text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Balans
            </button>
            <button
              onClick={() => setActiveTab('winst')}
              className={`flex-1 py-2 text-sm font-medium text-center border-t-2 transition-colors ${activeTab === 'winst' ? 'border-t-red-600 bg-white text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Winst & Verlies
            </button>
          </div>

          <div className="p-0">
            {activeTab === 'balans' && (
              <div className="space-y-0 divide-y divide-gray-100">
                <div className="bg-gray-50/50 px-4 py-1 border-b border-gray-100">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Activa</h3>
                </div>
                <InputRow label="Vaste Activa" dataKey="fixedAssets" bold />
                <InputRow label="Vlottende Activa (Totaal)" dataKey="currentAssets" bold />
                <InputRow label=" Waaronder: Voorraden" dataKey="inventory" />
                <InputRow label=" Waaronder: Liquide Middelen" dataKey="liquidAssets" />
                
                <div className="bg-gray-50/50 px-4 py-1 border-b border-gray-100 border-t border-gray-100">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Passiva</h3>
                </div>
                <InputRow label="Eigen Vermogen" dataKey="equity" bold />
                <InputRow label="Langlopende Schulden" dataKey="longTermDebt" />
                <InputRow label="Kortlopende Schulden" dataKey="shortTermDebt" />
              </div>
            )}

            {activeTab === 'winst' && (
              <div className="space-y-0 divide-y divide-gray-100">
                 <div className="bg-gray-50/50 px-4 py-1 border-b border-gray-100">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Resultaat</h3>
                </div>
                <InputRow label="Netto Omzet" dataKey="revenue" bold />
                <InputRow label="Kostprijs van de omzet" dataKey="costOfGoodsSold" />
                <div className="bg-slate-50 h-1 w-full"></div>
                <InputRow label="Bedrijfskosten (OPEX)" dataKey="operatingExpenses" />
                <InputRow label="Rentelasten" dataKey="interestExpenses" />
                <InputRow label="Belastingen (Vpb)" dataKey="taxExpenses" />
              </div>
            )}
          </div>
          
          <div className="bg-slate-50 px-4 py-2 border-t border-gray-200 text-xs text-slate-500 flex justify-end items-center">
             <FileSpreadsheet className="h-3 w-3 mr-1" />
             Bedragen in duizenden euro's (x 1.000)
          </div>
        </div>
      )}
    </div>
  );
};