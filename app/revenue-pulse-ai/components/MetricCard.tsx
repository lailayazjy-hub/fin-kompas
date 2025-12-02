import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { KPIMetric, DateRangeType } from '../types';

interface MetricCardProps {
  metric: KPIMetric;
  dateRangeType: DateRangeType;
}

export const MetricCard: React.FC<MetricCardProps> = ({ metric, dateRangeType }) => {
  // Format number to 'k' currency
  const formatValue = (val: number, unit: string) => {
    if (unit === 'EUR') {
        return `€${(val / 1000).toFixed(1)}k`;
    }
    return `${val.toFixed(1)}%`;
  };

  const formatXAxis = (dateStr: string) => {
    const date = new Date(dateStr);
    if (dateRangeType === '1y' || dateRangeType === '9m') {
      // Show month for longer ranges
      return date.toLocaleDateString('nl-NL', { month: 'short' });
    }
    // Show day and month for shorter ranges
    return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <div className="flex flex-col">
            <p className="text-sm font-bold text-slate-800 uppercase tracking-wide">{metric.name}</p>
            <p className="text-xs text-slate-400 font-light mt-0.5 mb-2">{metric.description}</p>
            
            <h3 className="text-2xl font-bold text-slate-900">
              {formatValue(metric.value, metric.unit)}
            </h3>
          </div>
          <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${metric.trend >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {metric.trend >= 0 ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
            {Math.abs(metric.trend).toFixed(1)}%
          </div>
        </div>

        {/* Chart with Axis */}
        <div className="flex-1 min-h-[120px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={metric.history} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`color-${metric.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                tickFormatter={formatXAxis} 
                tick={{ fontSize: 10, fill: '#94a3b8' }} 
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={30}
              />
              <Tooltip 
                 contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '12px' }}
                 itemStyle={{ color: '#fff' }}
                 formatter={(value: number) => [value.toFixed(2), metric.name]}
                 labelFormatter={(label) => new Date(label).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#6366f1" 
                strokeWidth={2}
                fillOpacity={1} 
                fill={`url(#color-${metric.id})`} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};