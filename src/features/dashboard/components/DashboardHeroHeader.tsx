'use client';

import React from 'react';
import { useMarketHours } from '@/hooks/useMarketHours';
import { TrendingUp, Clock, Activity } from 'lucide-react';

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
        <div className="flex items-center gap-2 sm:gap-3 self-start md:self-auto flex-wrap select-none">
          {/* Live Clock Widget */}
          {timeStr && (
            <div className="px-2.5 py-1 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl bg-indigo-500/5 dark:bg-indigo-400/5 border border-indigo-500/15 dark:border-indigo-400/15 flex items-center gap-1.5 sm:gap-2.5 shadow-sm hover:scale-[1.02] transition-transform duration-200">
              <div className="flex h-5 w-5 sm:h-7 sm:w-7 items-center justify-center rounded-lg sm:rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 shrink-0">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[6px] sm:text-[8px] font-black text-text-secondary uppercase tracking-widest leading-none">LOCAL TIME</span>
                <span className="text-[9px] sm:text-xs font-black text-text-primary tracking-wider font-mono mt-0.5 sm:mt-1 leading-none">{timeStr}</span>
              </div>
            </div>
          )}
          
          {/* Live Market Hours Status Widget */}
          <div className={`px-2.5 py-1 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl border flex items-center gap-1.5 sm:gap-2.5 shadow-sm hover:scale-[1.02] transition-transform duration-200 ${
            label.toLowerCase().includes('open')
              ? 'bg-emerald-500/5 border-emerald-500/15 text-emerald-500'
              : 'bg-slate-500/5 border-slate-500/15 text-slate-400'
          }`}>
            <div className={`flex h-5 w-5 sm:h-7 sm:w-7 items-center justify-center rounded-lg sm:rounded-xl shrink-0 ${
              label.toLowerCase().includes('open')
                ? 'bg-emerald-500/10 text-emerald-500'
                : 'bg-slate-500/10 text-slate-400'
            }`}>
              <Activity className={`h-3 w-3 sm:h-4 sm:w-4 ${label.toLowerCase().includes('open') ? 'animate-pulse' : ''}`} />
            </div>
            <div className="flex flex-col">
              <span className="text-[6px] sm:text-[8px] font-black text-text-secondary uppercase tracking-widest leading-none">MARKET STATUS</span>
              <div className="flex items-center gap-1 sm:gap-1.5 mt-0.5 sm:mt-1 leading-none">
                <span className={`h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full ${dotColor} shrink-0`} />
                <span className={`text-[8px] sm:text-[10px] font-black uppercase ${className}`}>
                  {label}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
