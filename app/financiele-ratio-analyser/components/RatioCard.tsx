import React, { useState } from 'react';
import { RatioResult, Comment } from '../types';
import { MessageSquare, Send, MoreHorizontal } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Cell } from 'recharts';

interface Props {
  ratio: RatioResult;
  period: string;
  comments: Comment[];
  onAddComment: (text: string) => void;
}

// Helper configuration for health benchmarks per ratio
const getHealthConfig = (key: string) => {
  // format: min/max for scale, low/high for colored zones, inverse (true = lower is better)
  switch (key) {
    case 'currentRatio': // Liquiditeit > 1 is ok, > 1.5 is goed
      return { min: 0, max: 3, low: 1.0, high: 1.5, inverse: false, labelLow: ' < 1.0', labelHigh: ' > 1.5' };
    case 'quickRatio': // Iets strenger dan current
      return { min: 0, max: 2.5, low: 0.8, high: 1.2, inverse: false, labelLow: ' < 0.8', labelHigh: ' > 1.2' };
    case 'debtRatio': // Schulden: Lager is beter. > 70% is riskant
      return { min: 0, max: 100, low: 50, high: 70, inverse: true, labelLow: ' < 50%', labelHigh: ' > 70%' };
    case 'equityRatio': // Solvabiliteit: Hoger is beter. < 25% is zwak
      return { min: 0, max: 80, low: 25, high: 40, inverse: false, labelLow: ' < 25%', labelHigh: ' > 40%' };
    case 'grossMargin':
      return { min: 0, max: 80, low: 20, high: 45, inverse: false, labelLow: ' < 20%', labelHigh: ' > 45%' };
    case 'netProfitMargin':
      return { min: -10, max: 30, low: 5, high: 15, inverse: false, labelLow: ' < 5%', labelHigh: ' > 15%' };
    case 'assetTurnover':
      return { min: 0, max: 2.5, low: 0.8, high: 1.5, inverse: false, labelLow: ' < 0.8', labelHigh: ' > 1.5' };
    default:
      return { min: 0, max: 100, low: 30, high: 70, inverse: false, labelLow: '', labelHigh: '' };
  }
};

// Helper to generate dynamic labels based on period
const getChartLabels = (period: string): string[] => {
  const now = new Date();
  const getMonthName = (minus: number) => {
    const d = new Date();
    d.setMonth(now.getMonth() - minus);
    return d.toLocaleString('nl-NL', { month: 'short' }).replace('.', '');
  };

  switch (period) {
    case '3m':
      return [getMonthName(3), getMonthName(2), getMonthName(1), 'Nu'];
    case '6m':
      return [getMonthName(6), getMonthName(4), getMonthName(2), 'Nu'];
    case '9m':
      return [getMonthName(9), getMonthName(6), getMonthName(3), 'Nu'];
    case '1y':
      return ['Q-3', 'Q-2', 'Q-1', 'Nu'];
    case 'custom':
      return ['Start', '..', '..', 'Eind'];
    default:
      return ['-3', '-2', '-1', 'Nu'];
  }
};

export const RatioCard: React.FC<Props> = ({ ratio, period, comments, onAddComment }) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      onAddComment(newComment);
      setNewComment('');
    }
  };

  const health = getHealthConfig(ratio.key);
  
  // Calculate position percentage
  // If inverse (Debt Ratio), we invert the percentage so that "Low Value" (Good) is on the Right (100%)
  let rawPercent = ((ratio.value - health.min) / (health.max - health.min)) * 100;
  if (health.inverse) {
    rawPercent = 100 - rawPercent;
  }
  const positionPercent = Math.min(100, Math.max(0, rawPercent));

  // Gradient colors - Always Red -> Yellow -> Green to indicate "Left is Bad/Risk, Right is Good/Safe"
  const gradient = 'linear-gradient(90deg, #ef4444 0%, #fbbf24 40%, #10b981 100%)';

  // Generate dynamic labels and data
  const labels = getChartLabels(period);
  const chartData = [
    { name: labels[0], value: ratio.value * 0.85 },
    { name: labels[1], value: ratio.value * 0.92 },
    { name: labels[2], value: ratio.value * 0.96 },
    { name: labels[3], value: ratio.value },
  ];

  // Determine status text
  const getStatusText = () => {
    const isGood = health.inverse ? ratio.value < health.low : ratio.value > health.high;
    const isBad = health.inverse ? ratio.value > health.high : ratio.value < health.low;
    if (isGood) return { text: 'Gezond', color: 'text-emerald-600' };
    if (isBad) return { text: 'Aandacht nodig', color: 'text-red-600' };
    return { text: 'Gemiddeld', color: 'text-amber-500' };
  };

  const status = getStatusText();

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col h-full overflow-hidden">
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              {ratio.name}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              {ratio.description}
            </p>
          </div>
          <div className="bg-slate-50 text-slate-900 border border-slate-200 text-sm font-mono font-bold px-2 py-0.5 rounded">
             {ratio.unit === '%' ? ratio.value.toFixed(1) + '%' : ratio.value.toFixed(2)}
          </div>
        </div>

        {/* Chart Section */}
        <div className="h-32 w-full mt-2 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#64748b' }} 
                dy={5}
              />
              <YAxis 
                hide={false} 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#94a3b8' }} 
                tickCount={4}
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ fontSize: '12px', borderRadius: '4px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                formatter={(value: number) => [
                  ratio.unit === '%' ? value.toFixed(1) + '%' : value.toFixed(2), 
                  ratio.name
                ]}
              />
              <Bar dataKey="value" radius={[3, 3, 0, 0]} barSize={24}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 3 ? '#ef4444' : '#cbd5e1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Health Meter Section */}
        <div className="mt-auto pt-2 border-t border-slate-50">
          <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
            <span>Zwak</span>
            <span>Sterk</span>
          </div>
          
          <div className="relative h-3 w-full rounded-full mb-2" style={{ background: gradient }}>
            {/* Threshold markers (white lines) */}
            <div className="absolute top-0 bottom-0 w-0.5 bg-white/40" style={{ left: '33%' }}></div>
            <div className="absolute top-0 bottom-0 w-0.5 bg-white/40" style={{ left: '66%' }}></div>

            {/* The Pointer */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-slate-700 rounded-full shadow-md transition-all duration-500 ease-out flex items-center justify-center"
              style={{ left: `calc(${positionPercent}% - 8px)` }}
            >
              <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
            </div>
          </div>
          
          <div className="flex justify-between text-[10px] text-slate-400 font-medium">
             {/* Display the benchmark values based on inverse or not */}
             <span>{health.inverse ? health.labelHigh : health.labelLow}</span>
             <span className={`font-bold text-xs ${status.color}`}>
               {status.text}
             </span>
             <span>{health.inverse ? health.labelLow : health.labelHigh}</span>
          </div>
        </div>
      </div>

      {/* Footer / Actions */}
      <div className="border-t border-slate-100 bg-slate-50 p-3">
        <button 
          onClick={() => setShowComments(!showComments)}
          className="flex items-center text-xs text-slate-500 hover:text-slate-700 font-medium w-full justify-between group"
        >
          <div className="flex items-center">
            <MessageSquare className="h-3.5 w-3.5 mr-1.5 group-hover:text-red-500 transition-colors" />
            Opmerkingen ({comments.length})
          </div>
          <MoreHorizontal className="h-4 w-4" />
        </button>

        {showComments && (
          <div className="mt-3 space-y-3 animate-in slide-in-from-bottom-1 duration-200">
            {comments.map(comment => (
              <div key={comment.id} className="bg-white p-2.5 rounded border border-slate-200 text-xs shadow-sm">
                <div className="flex justify-between mb-1.5">
                  <span className="font-bold text-slate-700">{comment.author}</span>
                  <span className="text-slate-400 text-[10px]">{comment.timestamp.toLocaleDateString()}</span>
                </div>
                <p className="text-slate-600 leading-relaxed">{comment.text}</p>
              </div>
            ))}
            
            <form onSubmit={handleCommentSubmit} className="flex items-center mt-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Schrijf een notitie..."
                className="flex-1 text-xs border-gray-300 rounded-l focus:ring-red-500 focus:border-red-500 py-1.5 shadow-sm"
              />
              <button 
                type="submit" 
                className="bg-red-600 text-white px-2.5 rounded-r hover:bg-red-700 transition-colors shadow-sm"
                disabled={!newComment.trim()}
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};