'use client';

import React, { useState } from 'react';

interface FinancialItem {
  year: string;
  revenue: number;
  profit: number;
  ebitda: number;
  margin: number;
  cashflow: number;
}

interface FinancialsData {
  annual: FinancialItem[];
  quarterly: FinancialItem[];
}

interface StockFinancialsTabProps {
  financialsData: FinancialsData;
  isPositive: boolean;
  formatIndianNumber: (num: number, isCurrency?: boolean) => string;
}

export default function StockFinancialsTab({
  financialsData,
  isPositive,
  formatIndianNumber,
}: StockFinancialsTabProps) {
  const [finPeriod, setFinPeriod] = useState<'annual' | 'quarterly'>('annual');
  const [finMetric, setFinMetric] = useState<'revenue' | 'profit' | 'ebitda' | 'margin' | 'cashflow'>('revenue');
  const [hoveredFinBar, setHoveredFinBar] = useState<number | null>(null);

  const activeList = finPeriod === 'annual' ? financialsData.annual : financialsData.quarterly;

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-soft dark:shadow-soft-dark space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <h3 className="font-extrabold text-sm text-text-primary uppercase tracking-wider">
            Financial Performance
          </h3>
          <p className="text-[10px] text-text-secondary font-medium mt-0.5">Visualize income statements and cash flow trends.</p>
        </div>

        {/* Toggle Annual/Quarterly */}
        <div className="flex items-center gap-1.5 p-0.5 bg-background border border-border rounded-xl self-start">
          <button
            onClick={() => setFinPeriod('annual')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              finPeriod === 'annual'
                ? 'bg-card text-profit shadow-sm font-extrabold'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Annual
          </button>
          <button
            onClick={() => setFinPeriod('quarterly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              finPeriod === 'quarterly'
                ? 'bg-card text-profit shadow-sm font-extrabold'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Quarterly
          </button>
        </div>
      </div>

      {/* Metric Selection pills */}
      <div className="flex overflow-x-auto gap-2 scrollbar-none pb-1">
        {[
          { id: 'revenue', label: 'Revenue' },
          { id: 'profit', label: 'Net Profit' },
          { id: 'ebitda', label: 'EBITDA' },
          { id: 'margin', label: 'Operating Margin (%)' },
          { id: 'cashflow', label: 'Free Cash Flow' }
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => setFinMetric(m.id as any)}
            className={`px-3.5 py-1.5 text-[11px] font-black rounded-lg border transition-all cursor-pointer ${
              finMetric === m.id
                ? 'bg-profit/15 border-profit/30 text-profit font-black shadow-xs'
                : 'border-border text-text-secondary hover:text-text-primary hover:bg-background'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Interactive SVG Bar Chart */}
      <div className="relative py-4">
        <div className="h-64 w-full flex items-end justify-around border-b border-border/80 pb-2 relative">
          
          {/* Background Grid Lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 z-0">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border-t border-border w-full h-0" />
            ))}
          </div>

          {activeList.map((d: any, idx, arr) => {
            const value = d[finMetric];
            const maxVal = Math.max(...arr.map((x: any) => x[finMetric]));
            const heightPct = maxVal > 0 ? (value / maxVal) * 80 : 10;
            const isHovered = hoveredFinBar === idx;

            return (
              <div 
                key={idx} 
                className="flex flex-col items-center group relative z-10 w-16"
                onMouseEnter={() => setHoveredFinBar(idx)}
                onMouseLeave={() => setHoveredFinBar(null)}
              >
                {/* Value Tooltip */}
                <div className={`absolute -top-12 bg-slate-900 text-white dark:bg-white dark:text-slate-950 px-2.5 py-1.5 rounded-lg text-[10px] font-black shadow-lg transition-all duration-200 pointer-events-none whitespace-nowrap z-20 ${
                  isHovered ? 'opacity-100 transform -translate-y-1' : 'opacity-0'
                }`}>
                  {finMetric === 'margin' ? `${value.toFixed(1)}%` : formatIndianNumber(value, true)}
                </div>

                {/* SVG Bar */}
                <div 
                  className={`w-10 sm:w-12 rounded-t-lg transition-all duration-300 cursor-pointer ${
                    isHovered 
                      ? 'bg-profit' 
                      : isPositive 
                      ? 'bg-profit/60' 
                      : 'bg-loss/60'
                  }`}
                  style={{ height: `${heightPct}%`, minHeight: '8px' }}
                />

                {/* Label */}
                <span className="text-[10px] font-black text-text-secondary mt-2 select-none">
                  {d.year}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Data Table details */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[500px]">
          <thead>
            <tr className="border-b border-border/80 text-[10px] font-bold text-text-secondary uppercase">
              <th className="py-2.5">Timeline</th>
              <th className="py-2.5 text-right">Revenue</th>
              <th className="py-2.5 text-right">EBITDA</th>
              <th className="py-2.5 text-right">Net Income</th>
              <th className="py-2.5 text-right">Net Margin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 font-bold">
            {activeList.map((d: any, idx) => (
              <tr key={idx} className="hover:bg-background/40 transition-colors">
                <td className="py-3 text-text-primary font-black">{d.year}</td>
                <td className="py-3 text-right">{formatIndianNumber(d.revenue, true)}</td>
                <td className="py-3 text-right">{formatIndianNumber(d.ebitda, true)}</td>
                <td className="py-3 text-right">{formatIndianNumber(d.profit, true)}</td>
                <td className="py-3 text-right text-profit">{d.margin.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
