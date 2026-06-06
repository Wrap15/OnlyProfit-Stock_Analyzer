'use client';

import React, { useState, useEffect } from 'react';
import { HelpCircle, TrendingUp } from 'lucide-react';

interface SipCalculatorProps {
  expectedReturn?: number | null;
  fundName?: string | null;
}

export default function SipCalculator({ expectedReturn, fundName }: SipCalculatorProps) {
  const [calculatorMode, setCalculatorMode] = useState<'sip' | 'lumpsum'>('sip');
  
  // Inputs
  const [investment, setInvestment] = useState<number>(5000);
  const [rate, setRate] = useState<number>(12);
  const [years, setYears] = useState<number>(10);

  // Sync prop return rate if selected from card
  useEffect(() => {
    if (expectedReturn !== undefined && expectedReturn !== null) {
      setRate(parseFloat(expectedReturn.toFixed(1)));
    }
  }, [expectedReturn]);

  // Calculations
  const [investedAmount, setInvestedAmount] = useState<number>(0);
  const [estReturns, setEstReturns] = useState<number>(0);
  const [totalValue, setTotalValue] = useState<number>(0);

  useEffect(() => {
    if (calculatorMode === 'sip') {
      const P = investment;
      const i = rate / 12 / 100;
      const n = years * 12;
      
      // SIP Formula: M = P * [ ((1 + i)^n - 1) / i ] * (1 + i)
      let total = 0;
      if (i === 0) {
        total = P * n;
      } else {
        total = P * (((Math.pow(1 + i, n) - 1) / i) * (1 + i));
      }
      
      const invested = P * n;
      const returns = Math.max(0, total - invested);

      setInvestedAmount(invested);
      setEstReturns(returns);
      setTotalValue(total);
    } else {
      const P = investment;
      const r = rate / 100;
      const t = years;
      
      // Lumpsum Formula: M = P * (1 + r)^t
      const total = P * Math.pow(1 + r, t);
      const invested = P;
      const returns = Math.max(0, total - invested);

      setInvestedAmount(invested);
      setEstReturns(returns);
      setTotalValue(total);
    }
  }, [investment, rate, years, calculatorMode]);

  // Format Helper
  const formatValue = (val: number) => {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    } else if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)} Lakh`;
    }
    return `₹${Math.round(val).toLocaleString('en-IN')}`;
  };

  // SVG Doughnut Math
  const radius = 60;
  const circumference = 2 * Math.PI * radius; // ~376.99
  const investedPct = totalValue > 0 ? investedAmount / totalValue : 0.5;
  const returnsPct = totalValue > 0 ? estReturns / totalValue : 0.5;

  const investedStrokeLength = circumference * investedPct;
  
  // Rotated starting offsets
  const investedOffset = 0;
  const returnsOffset = -investedStrokeLength;

  return (
    <div 
      id="sip-calculator-section" 
      className="w-full rounded-3xl border border-border bg-card p-6 md:p-8 shadow-soft dark:shadow-soft-dark hover:border-profit/10 transition-all duration-300 animate-fade-in gpu-layer"
    >
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-profit/15 text-profit">
              <TrendingUp className="h-4 w-4" />
            </span>
            <h2 className="text-xl font-black text-text-primary tracking-tight">
              Investment Returns Calculator
            </h2>
          </div>
          <p className="text-xs text-text-secondary font-medium mt-1">
            Simulate your potential returns using SIP (Systematic Investment Plan) or Lumpsum mutual fund growth.
          </p>
        </div>

        {/* Toggle Mode */}
        <div className="flex p-0.5 rounded-xl bg-background border border-border/80 self-start">
          <button
            onClick={() => {
              setCalculatorMode('sip');
              // Adjust default value when switching mode for better UX
              if (investment > 100000) setInvestment(5000);
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all duration-200 ${
              calculatorMode === 'sip'
                ? 'bg-card text-profit shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Monthly SIP
          </button>
          <button
            onClick={() => {
              setCalculatorMode('lumpsum');
              // Adjust default value when switching mode for better UX
              if (investment === 5000) setInvestment(50000);
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all duration-200 ${
              calculatorMode === 'lumpsum'
                ? 'bg-card text-profit shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Lumpsum
          </button>
        </div>
      </div>

      {fundName && (
        <div className="mb-6 px-4 py-2.5 rounded-2xl bg-profit/5 border border-profit/10 text-xs font-bold text-profit flex items-center justify-between animate-fade-in">
          <span>
            Applied rate from: <strong className="text-text-primary">{fundName.replace(' - Growth', '')}</strong>
          </span>
          <span className="text-[10px] bg-profit text-white px-2 py-0.5 rounded-md font-black">
            {rate}% CAGR
          </span>
        </div>
      )}

      {/* Main Form & Output Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Side: Inputs (Col Span 7) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Input 1: Investment Amount */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-extrabold text-text-secondary uppercase tracking-wider">
                {calculatorMode === 'sip' ? 'Monthly Investment' : 'Total Lumpsum'}
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-2.5 text-xs font-bold text-text-secondary">₹</span>
                <input
                  type="number"
                  value={investment}
                  onChange={(e) => setInvestment(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-32 h-8 pl-6 pr-2.5 rounded-lg border border-border bg-background text-xs font-black text-text-primary focus:outline-none focus:border-profit text-right"
                />
              </div>
            </div>
            <input
              type="range"
              min={calculatorMode === 'sip' ? 500 : 5000}
              max={calculatorMode === 'sip' ? 100000 : 5000000}
              step={calculatorMode === 'sip' ? 500 : 5000}
              value={investment}
              onChange={(e) => setInvestment(parseInt(e.target.value))}
              className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-profit"
            />
            <div className="flex justify-between text-[9px] font-black text-text-secondary uppercase">
              <span>{calculatorMode === 'sip' ? '₹500' : '₹5,000'}</span>
              <span>{calculatorMode === 'sip' ? '₹1 Lakh' : '₹50 Lakhs'}</span>
            </div>
          </div>

          {/* Input 2: Expected Return Rate */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-extrabold text-text-secondary uppercase tracking-wider">
                Expected Return Rate (p.a.)
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  step="0.1"
                  value={rate}
                  onChange={(e) => setRate(Math.min(50, Math.max(0, parseFloat(e.target.value) || 0)))}
                  className="w-20 h-8 pl-2 pr-6 rounded-lg border border-border bg-background text-xs font-black text-text-primary focus:outline-none focus:border-profit text-right"
                />
                <span className="absolute right-2 text-xs font-bold text-text-secondary">%</span>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              step="0.5"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
              className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-profit"
            />
            <div className="flex justify-between text-[9px] font-black text-text-secondary uppercase">
              <span>1%</span>
              <span>30%</span>
            </div>
          </div>

          {/* Input 3: Time Period */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-extrabold text-text-secondary uppercase tracking-wider">
                Time Period (Years)
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  value={years}
                  onChange={(e) => setYears(Math.min(40, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-20 h-8 pl-2 pr-6 rounded-lg border border-border bg-background text-xs font-black text-text-primary focus:outline-none focus:border-profit text-right"
                />
                <span className="absolute right-2 text-xs font-bold text-text-secondary">Yr</span>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="40"
              value={years}
              onChange={(e) => setYears(parseInt(e.target.value))}
              className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-profit"
            />
            <div className="flex justify-between text-[9px] font-black text-text-secondary uppercase">
              <span>1 Yr</span>
              <span>40 Yrs</span>
            </div>
          </div>

        </div>

        {/* Right Side: Visualizations & Output (Col Span 5) */}
        <div className="lg:col-span-5 flex flex-col sm:flex-row items-center justify-around gap-6 p-6 rounded-2xl bg-background/50 border border-border/60">
          
          {/* Doughnut Chart */}
          <div className="relative flex items-center justify-center h-32 w-32 shrink-0">
            <svg className="w-full h-full transform rotate-[-90deg]">
              {/* Invested Segment */}
              <circle
                cx="64"
                cy="64"
                r={radius}
                fill="transparent"
                stroke="#6366f1" // Indigo-500
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={investedOffset}
                className="transition-all duration-300"
              />
              {/* Returns Segment */}
              <circle
                cx="64"
                cy="64"
                r={radius}
                fill="transparent"
                stroke="#10b981" // Emerald-500
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={returnsOffset}
                className="transition-all duration-300"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-extrabold text-text-secondary uppercase tracking-widest">Returns</span>
              <span className="text-sm font-black text-profit">
                {Math.round(returnsPct * 100)}%
              </span>
            </div>
          </div>

          {/* Value Labels */}
          <div className="flex-1 space-y-4 min-w-[150px]">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#6366f1] shrink-0" />
                <span className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">Invested Amount</span>
              </div>
              <span className="block text-sm font-black text-text-primary mt-0.5">
                {formatValue(investedAmount)}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] shrink-0" />
                <span className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">Est. Returns</span>
              </div>
              <span className="block text-sm font-black text-profit mt-0.5">
                {formatValue(estReturns)}
              </span>
            </div>

            <div className="pt-2 border-t border-border/80">
              <span className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">Total Value</span>
              <span className="block text-lg font-black text-text-primary tracking-tight">
                {formatValue(totalValue)}
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* Educational Summary Disclaimer */}
      <div className="mt-6 pt-4 border-t border-border/40 flex items-start gap-2.5 text-[10px] text-text-secondary font-medium">
        <HelpCircle className="h-4 w-4 text-profit shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          This calculation is based on standard compound interest equations. Simulated return rates do not guarantee future performance. Standard mutual fund investments are subject to market risks.
        </p>
      </div>

    </div>
  );
}
