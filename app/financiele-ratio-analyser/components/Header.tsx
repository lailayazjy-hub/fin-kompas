import React, { useState, useEffect } from 'react';
import { Clock, Calendar, User, FileText } from 'lucide-react';

export const Header: React.FC = () => {
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = date.toLocaleDateString('nl-NL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const formattedTime = date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-red-600 p-1.5 rounded">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Financieel Rapport</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Geautomatiseerde Analyse</p>
          </div>
        </div>

        <div className="flex items-center space-x-6 text-sm text-slate-300">
          <div className="hidden md:flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-slate-500" />
            <span>{formattedDate}</span>
          </div>
          <div className="hidden md:flex items-center space-x-2 min-w-[80px]">
            <Clock className="h-4 w-4 text-slate-500" />
            <span>{formattedTime}</span>
          </div>
          <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <User className="h-4 w-4 text-slate-400" />
            <span className="font-medium text-slate-200">Manager Jan</span>
          </div>
        </div>
      </div>
    </header>
  );
};