'use client';

import React from 'react';
import { Info } from 'lucide-react';

interface StockShareholdingTabProps {
  promoter: number;
  fii: number;
  dii: number;
  mf: number;
  otherDii: number;
  retail: number;
}

const DonutChart = ({ segments }: { segments: { label: string; val: number; color: string }[] }) => {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-8 justify-center p-4">
      <div className="relative w-40 h-40">
        <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
          <circle cx="60" cy="60" r={radius} fill="transparent" stroke="var(--border)" strokeWidth="12" className="opacity-20" />
          {segments.map((seg, idx) => {
            const strokeDash = circumference;
            const strokeOffset = circumference - (seg.val / 100) * circumference;
            const rotation = (accumulatedPercent / 100) * 360;
            accumulatedPercent += seg.val;
            
            return (
              <circle
                key={idx}
                cx="60"
                cy="60"
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth="12"
                strokeDasharray={strokeDash}
                strokeDashoffset={strokeOffset}
                transform={`rotate(${rotation} 60 60)`}
                className="transition-all duration-500 ease-out hover:stroke-[14px] cursor-pointer"
              >
                <title>{`${seg.label}: ${seg.val}%`}</title>
              </circle>
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] text-text-secondary uppercase tracking-widest font-black">Holdings</span>
          <span className="text-xl font-black text-text-primary">100%</span>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex-1 space-y-2.5 w-full">
        {segments.map((seg, idx) => (
          <div key={idx} className="flex items-center justify-between text-xs font-bold p-2 hover:bg-background/40 rounded-lg transition-colors border border-transparent hover:border-border/30">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md shrink-0" style={{ backgroundColor: seg.color }} />
              <span className="text-text-secondary">{seg.label}</span>
            </div>
            <span className="text-text-primary font-black">{seg.val.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function StockShareholdingTab({
  promoter,
  fii,
  dii,
  mf,
  otherDii,
  retail,
}: StockShareholdingTabProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-soft dark:shadow-soft-dark space-y-6 animate-fade-in">
      <div>
        <h3 className="font-extrabold text-sm text-text-primary uppercase tracking-wider">
          Shareholding Pattern
        </h3>
        <p className="text-[10px] text-text-secondary font-medium mt-0.5">Equity distribution across promoter, public, and institutional bodies.</p>
      </div>

      {/* Circular SVG Donut Chart */}
      <DonutChart 
        segments={[
          { label: 'Promoter Holdings', val: promoter, color: '#6366f1' },
          { label: 'Foreign Institutional Investors (FII)', val: fii, color: '#a855f7' },
          { label: 'Mutual Funds', val: mf, color: '#f59e0b' },
          { label: 'Other Domestic Institutions (DII)', val: otherDii, color: '#3b82f6' },
          { label: 'Retail & Public float', val: retail, color: '#10b981' }
        ]} 
      />

      {/* Trend Summary */}
      <div className="p-4 bg-background/40 border border-border/50 rounded-xl">
        <h4 className="text-xs font-black text-text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Info className="h-4 w-4 text-profit" /> Shareholding Analysis
        </h4>
        <p className="text-[11px] text-text-secondary font-medium leading-relaxed">
          {promoter > 50 
            ? `Promoters hold a majority control over ${promoter.toFixed(1)}%, signaling solid corporate backing and alignment of board direction with long-term plans.` 
            : `Un-pledged float is distributed widely, ensuring rich market liquidity. Promoter holdings stand at ${promoter.toFixed(1)}%.`}
          {` Institutional investors (FII & DII) hold an aggregated ${(fii + dii).toFixed(1)}% of the equity, indicating high market capital confidence.`}
        </p>
      </div>

    </div>
  );
}
