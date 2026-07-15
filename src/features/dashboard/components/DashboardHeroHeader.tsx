'use client';

import React from 'react';
import { useMarketHours } from '@/hooks/useMarketHours';
import { TrendingUp } from 'lucide-react';

export default function DashboardHeroHeader() {
  const { label, className, dotColor, timeStr } = useMarketHours();

  return (
    <div className="mb-6 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-border bg-card/65 backdrop-blur-md shadow-premium relative overflow-hidden animate-fade-in">
      {/* Decorative corner background gradient blur glow */}
      <div className="absolute top-0 right-0 h-40 w-40 bg-gradient-to-br from-emerald-500/5 to-indigo-500/5 rounded-full blur-3xl pointer-events-none select-none" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] font-black uppercase tracking-widest bg-profit/15 text-profit px-1.5 py-0.5 rounded border border-profit/20">
              PRO PLATFORM
            </span>
            <div className="flex items-center gap-1.5 text-[10px] text-text-secondary font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-border" />
              <span>Exchange: NSE India</span>
            </div>
          </div>
          
          <h1 className="text-xl sm:text-3xl font-black tracking-tight text-text-primary mt-1 flex items-center gap-2">
            Market Dashboard — <span className="text-profit font-black">OnlyProfit</span>
          </h1>
          <p className="hidden sm:block text-xs sm:text-sm text-text-secondary font-medium max-w-2xl leading-relaxed">
            Real-time analytics, interactive trading charts, and sector valuation metrics for NSE-listed equities.
          </p>
        </div>
        
        {/* Status widgets panel */}
        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          {/* Live Clock Widget */}
          {timeStr && (
            <div className="px-3 py-1.5 rounded-xl sm:rounded-2xl bg-background border border-border/85 flex flex-col items-center justify-center shadow-inner select-none font-mono">
              <span className="text-[7px] sm:text-[8px] font-extrabold text-text-secondary uppercase tracking-widest">LOCAL TIME</span>
              <span className="text-2xs sm:text-xs font-black text-text-primary tracking-wider mt-0.5">{timeStr}</span>
            </div>
          )}
          
          {/* Live Market Hours Status Widget */}
          <div className="px-3 py-1.5 rounded-xl sm:rounded-2xl bg-background border border-border/85 flex flex-col items-start shadow-inner select-none animate-fade-in">
            <span className="text-[7px] sm:text-[8px] font-extrabold text-text-secondary uppercase tracking-widest">MARKET STATUS</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`h-1.5 w-1.5 rounded-full ${dotColor} shrink-0`} />
              <span className={`text-[9px] sm:text-[10px] font-black uppercase ${className}`}>
                {label}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
