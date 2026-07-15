'use client';

import React, { useState } from 'react';
import { 
  Coins, PiggyBank, Target, Compass, Layers, ArrowUpDown, ChevronDown, X, Star
} from 'lucide-react';
import MutualFundCard from '@/components/MutualFundCard';

interface MutualFundsSectionProps {
  mutualFunds: any[];
  mfLoading: boolean;
  activeMFCategory: string;
  setActiveMFCategory: (category: string) => void;
  mfReturnDuration: '1y' | '3y';
  setMfReturnDuration: (duration: '1y' | '3y') => void;
}

export default function MutualFundsSection({
  mutualFunds,
  mfLoading,
  activeMFCategory,
  setActiveMFCategory,
  mfReturnDuration,
  setMfReturnDuration,
}: MutualFundsSectionProps) {
  const [isMfDrawerOpen, setIsMfDrawerOpen] = useState(false);

  const MF_CATEGORIES = [
    { id: 'largecap', label: 'Large Cap', icon: Target, color: 'text-profit' },
    { id: 'midcap', label: 'Mid Cap', icon: Compass, color: 'text-sky-500' },
    { id: 'smallcap', label: 'Small Cap', icon: Coins, color: 'text-amber-500' },
    { id: 'flexicap', label: 'Flexi Cap', icon: Compass, color: 'text-indigo-500' },
    { id: 'multicap', label: 'Multi Cap', icon: Layers, color: 'text-purple-500' },
    { id: 'taxsaving', label: 'Tax Saving', icon: PiggyBank, color: 'text-slate-500' },
    { id: 'index', label: 'Index Funds', icon: Target, color: 'text-emerald-500' },
    { id: 'etf', label: 'ETFs', icon: ArrowUpDown, color: 'text-violet-500' }
  ];

  const activeMFObj = MF_CATEGORIES.find((cat) => cat.id === activeMFCategory) || MF_CATEGORIES[0];
  const ActiveCatIcon = activeMFObj.icon;

  return (
    <div id="mutual-funds" className="bg-card border border-border p-5 md:p-6 rounded-2xl shadow-sm space-y-6">
      
      {/* Header with Return Duration Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
        <div>
          <h2 className="text-sm font-extrabold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500/20" /> Mutual Funds & ETFs
          </h2>
          <p className="text-[10px] text-text-secondary font-medium mt-0.5">Top-rated direct mutual funds by asset class.</p>
        </div>

        {/* 1Y vs 3Y duration toggle */}
        <div className="flex items-center gap-1 bg-background p-0.5 rounded-lg border border-border/80 self-start sm:self-auto">
          {(['1y', '3y'] as const).map((duration) => (
            <button
              key={duration}
              onClick={() => setMfReturnDuration(duration)}
              className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                mfReturnDuration === duration
                  ? 'bg-card text-text-primary shadow-xs border border-border'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {duration === '1y' ? '1Y Return' : '3Y Return'}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Category Filter Pills */}
      <div className="hidden sm:flex overflow-x-auto scrollbar-none max-w-full gap-2.5 py-1">
        {MF_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeMFCategory === cat.id;
          
          return (
            <button
              key={cat.id}
              onClick={() => setActiveMFCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all duration-200 shrink-0 flex items-center gap-2 border select-none cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white border-transparent shadow-md dark:bg-slate-800 dark:text-white hover:bg-transparent hover:text-text-primary hover:border-border/60 hover:shadow-none'
                  : 'bg-card text-text-primary border-border hover:bg-slate-50 dark:hover:bg-slate-800/30'
              }`}
            >
              <Icon className={`h-4.5 w-4.5 shrink-0 transition-colors ${isActive ? 'text-white' : cat.color}`} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Mobile Category Toggle Menu Bar (Mobile Only) */}
      <div className="flex sm:hidden items-center justify-between bg-card border border-border px-4 py-2.5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-text-secondary uppercase tracking-wider">Asset Class:</span>
          <span className="text-xs font-extrabold text-text-primary">{activeMFObj.label}</span>
        </div>
        <button
          onClick={() => setIsMfDrawerOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-slate-50 text-text-primary text-xs font-black select-none shadow-xs transition-all active:scale-95 cursor-pointer"
        >
          <ActiveCatIcon className={`h-4 w-4 ${activeMFObj.color}`} />
          <span>Select Class</span>
          <ChevronDown className="h-3.5 w-3.5 text-text-secondary animate-pulse" />
        </button>
      </div>

      {/* Mobile bottom sheet drawer overlay for selecting category */}
      {isMfDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs sm:hidden animate-fade-in">
          <div className="absolute inset-0" onClick={() => setIsMfDrawerOpen(false)} />
          <div className="relative w-full bg-card rounded-t-3xl border-t border-border p-6 pb-8 space-y-4 animate-slide-up max-h-[85vh] overflow-y-auto z-50 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/40 pb-3.5">
              <h3 className="text-xs font-black text-text-secondary uppercase tracking-wider">Select Asset Class</h3>
              <button 
                onClick={() => setIsMfDrawerOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Grid of categories */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {MF_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeMFCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveMFCategory(cat.id);
                      setIsMfDrawerOpen(false);
                    }}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all active:scale-98 cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 border-transparent text-white dark:bg-slate-800'
                        : 'bg-background border-border text-text-primary hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <Icon className={`h-6 w-6 mb-2 ${isActive ? 'text-white' : cat.color}`} />
                    <span className="text-[11px] font-black tracking-tight">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Table column headers */}
      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-text-secondary select-none px-4 pb-2 border-b border-border/40 mt-4">
        <span>Funds</span>
        <span className="mr-14">Returns ({mfReturnDuration.toUpperCase()})</span>
      </div>

      {/* Mutual Funds List (Tabular Clean/Minimal Layout) */}
      {mfLoading ? (
        <div className="divide-y divide-border/30 bg-card border border-border rounded-3xl overflow-hidden shadow-soft dark:shadow-soft-dark">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-card">
              <div className="flex items-center gap-3.5 flex-1">
                <div className="h-11 w-11 animate-shimmer rounded-xl shrink-0" />
                <div className="space-y-2 flex-1 max-w-[50%]">
                  <div className="h-4 w-3/4 animate-shimmer rounded" />
                  <div className="h-3 w-1/4 animate-shimmer rounded" />
                </div>
              </div>
              <div className="h-4 w-12 animate-shimmer rounded shrink-0 mr-4" />
              <div className="h-8 w-8 animate-shimmer rounded-lg shrink-0" />
            </div>
          ))}
        </div>
      ) : mutualFunds.length > 0 ? (
        <div className="divide-y divide-border/30 bg-card border border-border rounded-3xl overflow-hidden shadow-soft dark:shadow-soft-dark">
          {mutualFunds.map((fund) => (
            <MutualFundCard key={fund.code} fund={fund} returnDuration={mfReturnDuration} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-sm text-text-secondary font-black bg-card border border-border rounded-2xl">
          No mutual funds found in this category.
        </div>
      )}
    </div>
  );
}
