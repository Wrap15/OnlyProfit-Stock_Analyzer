'use client';

import React from 'react';
import { 
  Briefcase, ArrowUpRight, TrendingUp, TrendingDown, 
  Clock, Eye, EyeOff, RefreshCw, Plus 
} from 'lucide-react';

interface SimulatorHeroProps {
  cash: number;
  holdingsCurrentValue: number;
  totalInvested: number;
  dayPnL: number;
  overallPnL: number;
  isMasked: boolean;
  setIsMasked: (val: boolean) => void;
  onAddMoney: () => void;
  onResetSimulator: () => void;
  loading: boolean;
}

export default function SimulatorHero({
  cash,
  holdingsCurrentValue,
  totalInvested,
  dayPnL,
  overallPnL,
  isMasked,
  setIsMasked,
  onAddMoney,
  onResetSimulator,
  loading,
}: SimulatorHeroProps) {
  const overallPnLPct = totalInvested > 0 ? (overallPnL / totalInvested) * 100 : 0;
  const dayPnLPct = (holdingsCurrentValue - dayPnL) > 0 ? (dayPnL / (holdingsCurrentValue - dayPnL)) * 100 : 0;

  const isOverallProfit = overallPnL >= 0;
  const isDayProfit = dayPnL >= 0;

  return (
    <div className="w-full space-y-6">
      
      {/* Title & Action controls header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
        <div className="space-y-0.5">
          <h1 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
            Virtual Paper Trading Simulator
          </h1>
          <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">
            Practice real-time trading with simulated virtual capital
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Mask toggle */}
          <button
            onClick={() => setIsMasked(!isMasked)}
            className="p-2 border border-border bg-card/40 hover:bg-card hover:text-text-primary text-text-secondary rounded-xl transition-all cursor-pointer"
            title={isMasked ? 'Show values' : 'Hide values'}
          >
            {isMasked ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
          </button>
          
          {/* Add Cash Button */}
          <button
            onClick={onAddMoney}
            className="inline-flex items-center gap-1 px-3 py-2 border border-emerald-500/30 bg-emerald-500/10 text-emerald-450 hover:bg-emerald-500 hover:text-black font-black text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> Add ₹1L Cash
          </button>

          {/* Reset Button */}
          <button
            onClick={onResetSimulator}
            disabled={loading}
            className="p-2 border border-border text-text-secondary hover:text-loss rounded-xl bg-card/40 hover:bg-loss/5 transition-colors cursor-pointer disabled:opacity-50"
            title="Reset Simulator Account"
          >
            <RefreshCw className={`h-4.5 w-4.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Grid of four horizontal portfolio metrics cards (exactly matching the user's uploaded image style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Invested Amount */}
        <div className="flex items-center gap-4 bg-card/25 border border-border/80 p-4 rounded-2xl shadow-soft">
          <div className="h-10 w-10 shrink-0 bg-blue-500/10 text-blue-450 border border-blue-500/15 rounded-xl flex items-center justify-center">
            <Briefcase className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex flex-col">
            <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">
              Invested Amount
            </span>
            <span className="text-base sm:text-lg font-black text-text-primary tracking-tight font-mono mt-0.5">
              {isMasked ? '•••••' : `₹ ${totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`}
            </span>
          </div>
        </div>

        {/* Card 2: Current Value */}
        <div className="flex items-center gap-4 bg-card/25 border border-border/80 p-4 rounded-2xl shadow-soft">
          <div className="h-10 w-10 shrink-0 bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 rounded-xl flex items-center justify-center">
            <ArrowUpRight className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex flex-col">
            <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">
              Current Value
            </span>
            <span className="text-base sm:text-lg font-black text-text-primary tracking-tight font-mono mt-0.5">
              {isMasked ? '•••••' : `₹ ${holdingsCurrentValue.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`}
            </span>
          </div>
        </div>

        {/* Card 3: Overall Profit / Loss */}
        <div className="flex items-center gap-4 bg-card/25 border border-border/80 p-4 rounded-2xl shadow-soft">
          <div className={`h-10 w-10 shrink-0 border rounded-xl flex items-center justify-center ${
            isOverallProfit 
              ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/15' 
              : 'bg-rose-500/10 text-rose-500 border-rose-500/15'
          }`}>
            {isOverallProfit ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
          </div>
          <div className="min-w-0 flex flex-col">
            <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">
              {isOverallProfit ? 'Overall Profit' : 'Overall Loss'}
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className={`text-base sm:text-lg font-black tracking-tight font-mono ${isOverallProfit ? 'text-profit' : 'text-loss'}`}>
                {isMasked ? '•••••' : `₹ ${Math.abs(overallPnL).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              </span>
              <span className={`text-[10px] font-black tracking-tight ${isOverallProfit ? 'text-profit' : 'text-loss'}`}>
                {isOverallProfit ? '+' : '-'}{Math.abs(overallPnLPct).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Today's Profit / Loss */}
        <div className="flex items-center gap-4 bg-card/25 border border-border/80 p-4 rounded-2xl shadow-soft">
          <div className={`h-10 w-10 shrink-0 border rounded-xl flex items-center justify-center ${
            isDayProfit 
              ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/15' 
              : 'bg-rose-500/10 text-rose-500 border-rose-500/15'
          }`}>
            <Clock className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex flex-col">
            <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">
              {isDayProfit ? "Today's Profit" : "Today's Loss"}
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className={`text-base sm:text-lg font-black tracking-tight font-mono ${isDayProfit ? 'text-profit' : 'text-loss'}`}>
                {isMasked ? '•••••' : `₹ ${Math.abs(dayPnL).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              </span>
              <span className={`text-[10px] font-black tracking-tight ${isDayProfit ? 'text-profit' : 'text-loss'}`}>
                {isDayProfit ? '+' : '-'}{Math.abs(dayPnLPct).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Cash Liquid Balance Banner */}
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-card/10 border border-border/60 rounded-2xl text-[10px] font-black uppercase tracking-wider">
        <span className="text-text-secondary">Simulated Cash Balance (Unallocated Liquid Funds)</span>
        <span className="text-text-primary font-mono text-xs font-black">
          {isMasked ? '•••••' : `₹ ${cash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
        </span>
      </div>

    </div>
  );
}
