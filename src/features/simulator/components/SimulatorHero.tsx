'use client';

import React from 'react';
import { Wallet, RefreshCw, Eye, EyeOff } from 'lucide-react';

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
  const portfolioValue = holdingsCurrentValue;
  const totalAccountValue = cash + holdingsCurrentValue;
  const capitalBase = totalAccountValue - overallPnL;
  
  const dayPnLPct = (totalAccountValue - dayPnL) > 0 ? (dayPnL / (totalAccountValue - dayPnL)) * 100 : 0;
  const overallPnLPct = capitalBase > 0 ? (overallPnL / capitalBase) * 100 : 0;

  return (
    <div className="bg-gradient-to-br from-card via-card to-emerald-500/5 border border-border/80 rounded-3xl p-6 md:p-8 shadow-soft dark:shadow-soft-dark space-y-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-profit/5 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-indigo-500/5 rounded-full filter blur-2xl pointer-events-none" />

      {/* Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
            Virtual Paper Trading Simulator
          </h1>
          <p className="text-xs text-text-secondary font-medium">
            Practice real-time trading with 10 Lakhs of simulated virtual cash capital.
          </p>
        </div>

        <div className="flex items-center gap-2 select-none">
          <button
            onClick={() => setIsMasked(!isMasked)}
            className="p-2 border border-border rounded-xl text-text-secondary hover:text-text-primary bg-card hover:bg-background transition-colors cursor-pointer"
            title={isMasked ? 'Show values' : 'Hide values'}
          >
            {isMasked ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
          </button>
          
          <button
            onClick={onAddMoney}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-black font-black text-xs rounded-xl transition-all cursor-pointer"
          >
            <Wallet className="h-4 w-4" /> Add ₹1L Cash
          </button>

          <button
            onClick={onResetSimulator}
            disabled={loading}
            className="p-2 border border-border text-text-secondary hover:text-loss rounded-xl bg-card hover:bg-loss/5 transition-colors cursor-pointer disabled:opacity-50"
            title="Reset Simulator Account"
          >
            <RefreshCw className={`h-4.5 w-4.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-border/60 relative z-10">
        
        {/* Portfolio Value */}
        <div className="space-y-1.5">
          <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">
            Current Portfolio Value
          </span>
          <h3 className="text-2xl font-black text-text-primary tracking-tight font-mono">
            {isMasked ? '•••••' : `₹${portfolioValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          </h3>
        </div>

        {/* Invested Value */}
        <div className="space-y-1.5">
          <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">
            Invested Capital
          </span>
          <h3 className="text-2xl font-black text-text-primary tracking-tight font-mono">
            {isMasked ? '•••••' : `₹${totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          </h3>
        </div>

        {/* 1D Returns */}
        <div className="space-y-1.5">
          <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">
            1D Returns (Today)
          </span>
          <div className={`text-2xl font-black tracking-tight font-mono flex items-baseline gap-1.5 ${dayPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
            <span>{isMasked ? '•••••' : `${dayPnL >= 0 ? '+' : ''}₹${dayPnL.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}</span>
            <span className="text-xs font-black">({dayPnL >= 0 ? '+' : ''}{dayPnLPct.toFixed(2)}%)</span>
          </div>
        </div>

        {/* Total Returns */}
        <div className="space-y-1.5">
          <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">
            Total Profit & Loss
          </span>
          <div className={`text-2xl font-black tracking-tight font-mono flex items-baseline gap-1.5 ${overallPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
            <span>{isMasked ? '•••••' : `${overallPnL >= 0 ? '+' : ''}₹${overallPnL.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}</span>
            <span className="text-xs font-black">({overallPnL >= 0 ? '+' : ''}{overallPnLPct.toFixed(2)}%)</span>
          </div>
        </div>

        {/* Available cash balance */}
        <div className="col-span-1 sm:col-span-2 lg:col-span-4 p-4 rounded-2xl bg-background/50 border border-border/50 flex justify-between items-center text-xs font-bold">
          <span className="text-text-secondary">Simulated Cash Balance (Unallocated Liquid Funds)</span>
          <span className="text-text-primary font-black font-mono text-sm">
            {isMasked ? '•••••' : `₹${cash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          </span>
        </div>
      </div>
    </div>
  );
}
