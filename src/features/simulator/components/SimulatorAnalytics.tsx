'use client';

import React from 'react';

interface HoldingSegment {
  symbol: string;
  value: number;
}

interface SimulatorAnalyticsProps {
  holdingsCount: number;
  holdingsSegments: HoldingSegment[];
  totalHoldingVal: number;
  overallPnL: number;
  netWorth: number;
}

export default function SimulatorAnalytics({
  holdingsCount,
  holdingsSegments,
  totalHoldingVal,
  overallPnL,
  netWorth,
}: SimulatorAnalyticsProps) {
  const colors = ['#10b981', '#6366f1', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'];
  let accumulatedPercent = 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
      
      {/* Allocation SVG Donut */}
      <div className="md:col-span-1 bg-card border border-border rounded-3xl p-6 flex flex-col justify-between shadow-sm">
        <div>
          <h3 className="text-sm font-black text-text-primary uppercase tracking-wider mb-1">
            Holding Allocation
          </h3>
          <p className="text-[10px] text-text-secondary font-bold">Asset distribution by market value weights</p>
        </div>

        <div className="flex flex-col items-center justify-center py-4">
          <div className="relative w-36 h-36">
            <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
              <circle cx="60" cy="60" r="45" fill="transparent" stroke="var(--border)" strokeWidth="12" className="opacity-20" />
              {holdingsSegments.map((seg, idx) => {
                const pct = totalHoldingVal > 0 ? (seg.value / totalHoldingVal) * 100 : 0;
                const circumference = 2 * Math.PI * 45;
                const strokeOffset = circumference - (pct / 100) * circumference;
                const rotation = (accumulatedPercent / 100) * 360;
                accumulatedPercent += pct;
                
                return (
                  <circle
                    key={idx}
                    cx="60"
                    cy="60"
                    r="45"
                    fill="transparent"
                    stroke={colors[idx % colors.length]}
                    strokeWidth="12"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeOffset}
                    transform={`rotate(${rotation} 60 60)`}
                    className="transition-all duration-300"
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-[10px] font-black text-text-secondary uppercase">Stocks</span>
              <span className="text-xs font-black text-text-primary">{holdingsCount}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[10px] font-bold border-t border-border pt-4">
          {holdingsSegments.slice(0, 4).map((seg, idx) => {
            const pct = totalHoldingVal > 0 ? (seg.value / totalHoldingVal) * 100 : 0;
            return (
              <div key={idx} className="flex items-center gap-1.5 truncate">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colors[idx % colors.length] }} />
                <span className="text-text-primary truncate">{seg.symbol}</span>
                <span className="text-text-secondary ml-auto">{pct.toFixed(0)}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Net Worth Growth Graph */}
      <div className="md:col-span-2 bg-card border border-border rounded-3xl p-6 flex flex-col justify-between shadow-sm">
        <div>
          <h3 className="text-sm font-black text-text-primary uppercase tracking-wider mb-1">
            Net Worth Growth
          </h3>
          <p className="text-[10px] text-text-secondary font-bold">Simulated daily performance trajectory</p>
        </div>

        <div className="h-40 w-full flex items-end justify-between gap-1 pt-6 px-2">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 500 120">
            <defs>
              <linearGradient id="gradient-line" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
            </defs>
            
            <line x1="0" y1="30" x2="500" y2="30" stroke="var(--border)" strokeOpacity="0.3" strokeDasharray="3" />
            <line x1="0" y1="60" x2="500" y2="60" stroke="var(--border)" strokeOpacity="0.3" strokeDasharray="3" />
            <line x1="0" y1="90" x2="500" y2="90" stroke="var(--border)" strokeOpacity="0.3" strokeDasharray="3" />

            <path
              d={`M 0 90 Q 100 ${overallPnL >= 0 ? 80 : 95} 200 85 T 400 ${overallPnL >= 0 ? 70 : 100} T 500 ${overallPnL >= 0 ? 40 : 105}`}
              fill="transparent"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d={`M 0 90 Q 100 ${overallPnL >= 0 ? 80 : 95} 200 85 T 400 ${overallPnL >= 0 ? 70 : 100} T 500 ${overallPnL >= 0 ? 40 : 105} L 500 120 L 0 120 Z`}
              fill="url(#gradient-line)"
            />
            <circle cx="500" cy={overallPnL >= 0 ? 40 : 105} r="4.5" fill="#10b981" />
          </svg>
        </div>

        <div className="flex justify-between items-center text-[10px] text-text-secondary font-bold border-t border-border pt-4 mt-2">
          <span>Start: ₹10,00,000</span>
          <span>Interval: Past 7 Days</span>
          <span className="text-emerald-400">Current: ₹{netWorth.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
        </div>
      </div>

    </div>
  );
}
