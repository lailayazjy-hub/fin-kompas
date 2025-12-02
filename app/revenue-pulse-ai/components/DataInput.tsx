import React, { useRef } from 'react';
import { Upload, Play, Download } from 'lucide-react';
import { Button } from './Button';
import { Transaction } from '../types';
import { generateDemoData } from '../utils/demoData';

interface DataInputProps {
  onDataLoaded: (data: Transaction[]) => void;
}

export const DataInput: React.FC<DataInputProps> = ({ onDataLoaded }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDemoLoad = () => {
    const demoData = generateDemoData();
    onDataLoaded(demoData);
  };

  const handleDownloadTemplate = () => {
    const templateContent = `
      <html xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
      </head>
      <body>
        <table border="1">
          <thead>
            <tr style="background-color: #f3f4f6; font-weight: bold;">
              <th>Date (YYYY-MM-DD)</th>
              <th>Amount (Getal)</th>
              <th>Type (new, expansion, contraction, churn)</th>
              <th>CustomerId (Unieke ID)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>2023-10-01</td>
              <td>1000</td>
              <td>new</td>
              <td>KLANT-001</td>
            </tr>
             <tr>
              <td>2023-10-05</td>
              <td>500</td>
              <td>expansion</td>
              <td>KLANT-001</td>
            </tr>
            <tr>
              <td>2023-10-15</td>
              <td>2000</td>
              <td>new</td>
              <td>KLANT-002</td>
            </tr>
            <tr>
              <td>2023-10-20</td>
              <td>2000</td>
              <td>churn</td>
              <td>KLANT-002</td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `;
    
    const blob = new Blob([templateContent], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "KPI_Data_Sjabloon.xls";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const processCSV = (csvText: string) => {
    try {
      const lines = csvText.split('\n');
      const data: Transaction[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const separator = line.includes(';') ? ';' : ',';
        const parts = line.split(separator);
        
        if (parts.length >= 4) {
             const date = parts[0].trim();
             const amountStr = parts[1].trim();
             const type = parts[2].trim();
             const customerId = parts[3].trim();

             if (date && amountStr) {
                data.push({
                    id: `row-${i}`,
                    date: date,
                    amount: parseFloat(amountStr.replace(',', '.')),
                    type: type as any,
                    customerId: customerId || `unknown-${i}`
                });
            }
        }
      }
      onDataLoaded(data);
    } catch (e) {
      alert("Fout bij verwerken data. Controleer het formaat.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        processCSV(evt.target.result as string);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all mb-6">
      {/* Header Section */}
      <div className="bg-slate-50/50 border-b border-slate-100 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-slate-800">Bestand Import</h3>
          <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-medium border border-indigo-100">Excel / CSV</span>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleDownloadTemplate} 
            className="text-xs h-8"
            icon={<Download size={12} />}
          >
            Sjabloon (.xls)
          </Button>
          <Button 
            size="sm" 
            variant="primary" 
            onClick={handleDemoLoad} 
            className="text-xs h-8 bg-indigo-600 hover:bg-indigo-700 text-white"
            icon={<Play size={12} />}
          >
            Demo Data
          </Button>
        </div>
      </div>

      {/* Upload Content */}
      <div className="p-6">
        <input 
            type="file" 
            accept=".csv,.txt,.xls" 
            onChange={handleFileUpload} 
            className="hidden" 
            ref={fileInputRef} 
            id="file-upload"
        />
        <label 
            htmlFor="file-upload" 
            className="group relative flex flex-col sm:flex-row items-center justify-center gap-4 p-8 border-2 border-dashed border-slate-200 rounded-xl hover:bg-slate-50 hover:border-indigo-400 transition-all cursor-pointer bg-slate-50/30"
        >
            <div className="p-4 bg-white rounded-full shadow-sm border border-slate-100 group-hover:scale-110 transition-transform text-indigo-600">
            <Upload className="h-6 w-6" />
            </div>
            <div className="text-center sm:text-left">
            <span className="block text-base font-medium text-slate-700 group-hover:text-indigo-700 transition-colors">
                Klik om bestand te kiezen
            </span>
            <span className="block text-sm text-slate-400 mt-1">
                Sleep bestand hierheen (Excel of CSV)
            </span>
            </div>
        </label>
      </div>
    </div>
  );
};