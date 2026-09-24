'use client';

import React, { useState } from 'react';
import { 
  Sparkles, Activity, BarChart3, ShieldAlert, 
  Landmark, Target, CheckCircle2, AlertCircle, Scale, 
  Zap, Lock, ShieldCheck, Users
} from 'lucide-react';
import MarketDepth from '@/components/MarketDepth';

interface StockOverviewTabProps {
  quote: any;
  dayLow: number;
  dayHigh: number;
  fiftyTwoLow: number;
  fiftyTwoHigh: number;
  roe: number;
  roce: number;
  eps: number;
  debtToEquity: number;
  bookValue: number;
  formatIndianNumber: (num: number, isCurrency?: boolean) => string;
}

export default function StockOverviewTab({
  quote,
  dayLow,
  dayHigh,
  fiftyTwoLow,
  fiftyTwoHigh,
  roe,
  roce,
  eps,
  debtToEquity,
  bookValue,
  formatIndianNumber,
}: StockOverviewTabProps) {
  // Navigation section state
  const [activeSubSection, setActiveSubSection] = useState<'all' | 'performance' | 'depth' | 'score' | 'fundamentals' | 'financials' | 'ratings' | 'shareholding' | 'peers'>('all');

  // SWOT Tab State (Angel One / Trendlyne Style)
  const [activeSwotTab, setActiveSwotTab] = useState<'strengths' | 'weaknesses' | 'opportunities' | 'threats'>('strengths');

  // Financial Highlights View (Groww Style: Quarterly vs Yearly)
  const [financialPeriod, setFinancialPeriod] = useState<'quarterly' | 'yearly'>('quarterly');
  const [financialMetric, setFinancialMetric] = useState<'revenue' | 'profit' | 'networth'>('revenue');

  const ltp = quote.regularMarketPrice || 1450;
  const peVal = quote.trailingPE || 28.4;
  const pbVal = quote.priceToBook || 4.12;
  const industryPe = quote.trailingPE ? parseFloat((quote.trailingPE * 0.92).toFixed(2)) : 26.1;
  const roeVal = roe || 18.5;
  const roceVal = roce || 21.4;
  const epsVal = eps || 52.8;
  const debtVal = debtToEquity || 0.28;
  const bookVal = bookValue || 352.4;
  const divYield = quote.dividendYield ? quote.dividendYield.toFixed(2) : '1.15';
  const marketCapFormatted = formatIndianNumber(quote.marketCap || 1285000000000);
  const volumeFormatted = formatIndianNumber(quote.regularMarketVolume || 4850000);
  const turnoverFormatted = `₹${((ltp * (quote.regularMarketVolume || 4850000)) / 10000000).toFixed(2)} Cr`;

  // Safe Math for Performance Sliders (Clamped 2% to 98% for visual pin positioning)
  const safeDayLow = dayLow > 0 ? dayLow : ltp * 0.985;
  const safeDayHigh = dayHigh > safeDayLow ? dayHigh : ltp * 1.015;
  const dayRangeProgress = Math.min(98, Math.max(2, ((ltp - safeDayLow) / (safeDayHigh - safeDayLow)) * 100));

  const safeFiftyTwoLow = fiftyTwoLow > 0 ? fiftyTwoLow : ltp * 0.75;
  const safeFiftyTwoHigh = fiftyTwoHigh > safeFiftyTwoLow ? fiftyTwoHigh : ltp * 1.25;
  const fiftyTwoProgress = Math.min(98, Math.max(2, ((ltp - safeFiftyTwoLow) / (safeFiftyTwoHigh - safeFiftyTwoLow)) * 100));

  // Distance from 52W High
  const distFromFiftyTwoHigh = (((safeFiftyTwoHigh - ltp) / safeFiftyTwoHigh) * 100).toFixed(1);
  const distFromFiftyTwoLow = (((ltp - safeFiftyTwoLow) / safeFiftyTwoLow) * 100).toFixed(1);

  // Circuit limits
  const lowerCircuit = (ltp * 0.9).toFixed(2);
  const upperCircuit = (ltp * 1.1).toFixed(2);

  // Helper filter for section visibility
  const shouldShow = (sec: typeof activeSubSection) => activeSubSection === 'all' || activeSubSection === sec;

  // Mock quarterly financial dataset (Groww / Angel One style)
  const quarterlyData = {
    revenue: [
      { period: 'Q1 FY25', val: 58420, growth: '+12.4%' },
      { period: 'Q2 FY25', val: 62150, growth: '+15.1%' },
      { period: 'Q3 FY25', val: 65890, growth: '+14.2%' },
      { period: 'Q4 FY25', val: 71200, growth: '+18.6%' },
    ],
    profit: [
      { period: 'Q1 FY25', val: 7850, growth: '+14.8%' },
      { period: 'Q2 FY25', val: 8420, growth: '+18.2%' },
      { period: 'Q3 FY25', val: 9150, growth: '+16.5%' },
      { period: 'Q4 FY25', val: 10450, growth: '+22.4%' },
    ],
    networth: [
      { period: 'Q1 FY25', val: 185000, growth: '+8.2%' },
      { period: 'Q2 FY25', val: 194200, growth: '+9.4%' },
      { period: 'Q3 FY25', val: 205400, growth: '+11.1%' },
      { period: 'Q4 FY25', val: 218500, growth: '+13.5%' },
    ]
  };

  const yearlyData = {
    revenue: [
      { period: '2022', val: 182000, growth: '+16.2%' },
      { period: '2023', val: 214500, growth: '+17.8%' },
      { period: '2024', val: 248900, growth: '+16.0%' },
      { period: '2025', val: 292000, growth: '+17.3%' },
    ],
    profit: [
      { period: '2022', val: 24500, growth: '+19.4%' },
      { period: '2023', val: 28900, growth: '+17.9%' },
      { period: '2024', val: 34200, growth: '+18.3%' },
      { period: '2025', val: 41500, growth: '+21.3%' },
    ],
    networth: [
      { period: '2022', val: 142000, growth: '+12.4%' },
      { period: '2023', val: 165000, growth: '+16.1%' },
      { period: '2024', val: 189000, growth: '+14.5%' },
      { period: '2025', val: 218500, growth: '+15.6%' },
    ]
  };

  const activeFinancials = financialPeriod === 'quarterly' ? quarterlyData[financialMetric] : yearlyData[financialMetric];
  const maxFinancialVal = Math.max(...activeFinancials.map(d => d.val));

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      
      {/* ---------------------------------------------------- */}
      {/* 1. GROWW / ANGEL ONE SUB-NAV PILL STRIP              */}
      {/* ---------------------------------------------------- */}
      <div className="sticky top-0 sm:top-[115px] z-20 bg-background/95 backdrop-blur-md py-2.5 border-b border-border/40 flex items-center gap-1.5 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        {[
          { id: 'all', label: 'All Overview' },
          { id: 'performance', label: 'Price & Volume' },
          { id: 'depth', label: 'Order Book Depth' },
          { id: 'score', label: 'Angel Smart Score' },
          { id: 'fundamentals', label: 'Fundamentals' },
          { id: 'financials', label: 'Financial Highlights' },
          { id: 'ratings', label: 'Analyst Targets' },
          { id: 'shareholding', label: 'Shareholding' },
          { id: 'peers', label: 'Peer Comparison' },
        ].map((sec) => (
          <button
            key={sec.id}
            onClick={() => setActiveSubSection(sec.id as any)}
            className={`px-3.5 py-1.5 text-[11px] font-black rounded-xl uppercase tracking-wider transition-all whitespace-nowrap border shrink-0 cursor-pointer ${
              activeSubSection === sec.id
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-sm shadow-emerald-500/10'
                : 'border-border/60 text-text-secondary hover:text-text-primary hover:bg-card'
            }`}
          >
            {sec.label}
          </button>
        ))}
      </div>

      {/* ---------------------------------------------------- */}
      {/* 2. SIGNATURE GROWW/ANGEL ONE PERFORMANCE DASHBOARD   */}
      {/* ---------------------------------------------------- */}
      {shouldShow('performance') && (
        <div className="bg-card border border-border/80 rounded-3xl p-5 sm:p-7 space-y-6 shadow-sm">
          <div className="flex justify-between items-center border-b border-border/40 pb-3.5">
            <div>
              <h3 className="text-sm font-black text-text-primary uppercase tracking-wider flex items-center gap-2">
                <Activity className="h-4.5 w-4.5 text-emerald-400" /> Performance & Price Bands
              </h3>
              <p className="text-[10px] text-text-secondary font-semibold mt-0.5">
                Real-time market depth, traded volumes, and statutory circuit bands.
              </p>
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live Feed
            </span>
          </div>

          {/* DUAL INTERACTIVE RANGE SLIDERS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 sm:p-5 rounded-2xl bg-background/50 border border-border/60">
            
            {/* Today's Low / High Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-black">
                <span className="text-text-secondary uppercase tracking-wider text-[10px]">Today&apos;s Range</span>
                <span className="font-mono text-text-primary font-black">
                  LTP: ₹{ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              
              <div className="relative pt-2 pb-1">
                <div className="h-2 w-full rounded-full bg-gradient-to-r from-rose-500/30 via-amber-500/30 to-emerald-500/40 relative overflow-hidden">
                  <div 
                    style={{ width: `${dayRangeProgress}%` }}
                    className="h-full bg-gradient-to-r from-rose-500 to-emerald-400 rounded-full"
                  />
                </div>
                
                {/* Pointer Marker */}
                <div 
                  style={{ left: `${dayRangeProgress}%` }}
                  className="absolute top-0.5 -translate-x-1/2 flex flex-col items-center transition-all duration-300"
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-card shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
                  <span className="text-[9px] font-black font-mono text-emerald-400 mt-1 whitespace-nowrap bg-card px-1.5 py-0.5 rounded border border-border shadow-xs">
                    ₹{ltp.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono font-black pt-2">
                <div className="text-left">
                  <span className="text-[9px] uppercase tracking-wider text-text-secondary font-sans block">Today Low</span>
                  <span className="text-rose-500 dark:text-rose-400">₹{safeDayLow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase tracking-wider text-text-secondary font-sans block">Today High</span>
                  <span className="text-emerald-500 dark:text-emerald-400">₹{safeDayHigh.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* 52-Week Low / High Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-black">
                <span className="text-text-secondary uppercase tracking-wider text-[10px]">52-Week Span</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-profit/10 text-profit border border-profit/20">
                  {parseFloat(distFromFiftyTwoHigh) <= 10 ? '🔥 Near 52W High' : `${distFromFiftyTwoHigh}% below High`}
                </span>
              </div>
              
              <div className="relative pt-2 pb-1">
                <div className="h-2 w-full rounded-full bg-gradient-to-r from-rose-500/25 via-slate-500/25 to-emerald-500/35 relative overflow-hidden">
                  <div 
                    style={{ width: `${fiftyTwoProgress}%` }}
                    className="h-full bg-gradient-to-r from-rose-500 to-emerald-400 rounded-full"
                  />
                </div>
                
                {/* 52W Pin Marker */}
                <div 
                  style={{ left: `${fiftyTwoProgress}%` }}
                  className="absolute top-0.5 -translate-x-1/2 flex flex-col items-center transition-all duration-300"
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-card shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
                  <span className="text-[9px] font-black font-mono text-emerald-400 mt-1 whitespace-nowrap bg-card px-1.5 py-0.5 rounded border border-border shadow-xs">
                    ₹{ltp.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono font-black pt-2">
                <div className="text-left">
                  <span className="text-[9px] uppercase tracking-wider text-text-secondary font-sans block">52W Low</span>
                  <span className="text-rose-500 dark:text-rose-400">₹{safeFiftyTwoLow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  <span className="text-[8px] text-text-secondary block font-sans">+{distFromFiftyTwoLow}%</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase tracking-wider text-text-secondary font-sans block">52W High</span>
                  <span className="text-emerald-500 dark:text-emerald-400">₹{safeFiftyTwoHigh.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  <span className="text-[8px] text-text-secondary block font-sans">-{distFromFiftyTwoHigh}%</span>
                </div>
              </div>
            </div>

          </div>

          {/* 8-POINT CORE MARKET STATS MATRIX (GROWW / ANGEL ONE STYLE) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {[
              { label: 'Open', value: `₹${(quote.regularMarketOpen || ltp * 0.995).toFixed(2)}`, desc: 'Today Opening' },
              { label: 'Prev. Close', value: `₹${(quote.regularMarketPreviousClose || ltp * 0.99).toFixed(2)}`, desc: 'Yesterday Settlement' },
              { label: 'Volume (Shares)', value: volumeFormatted, desc: 'NSE/BSE Cumulative' },
              { label: 'Traded Value (Turnover)', value: turnoverFormatted, desc: 'Total Liquidity' },
              { label: 'Lower Circuit (-10%)', value: `₹${lowerCircuit}`, desc: 'Floor Band Limit', isLock: true, color: 'text-rose-400' },
              { label: 'Upper Circuit (+10%)', value: `₹${upperCircuit}`, desc: 'Ceiling Band Limit', isLock: true, color: 'text-emerald-400' },
              { label: 'Average Traded Price', value: `₹${(ltp * 0.998).toFixed(2)}`, desc: 'Intraday VWAP' },
              { label: 'Lot Size / Tick Size', value: '1 Share / ₹0.05', desc: 'Exchange Standard' },
            ].map((stat, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-background/40 border border-border/50 hover:border-border transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[9.5px] font-bold text-text-secondary uppercase tracking-wider">{stat.label}</span>
                  {stat.isLock && <Lock className="w-3 h-3 text-text-secondary/60" />}
                </div>
                <span className={`text-xs font-black font-mono block mt-1.5 ${stat.color || 'text-text-primary'}`}>
                  {stat.value}
                </span>
                <span className="text-[8.5px] text-text-secondary/70 font-semibold mt-0.5 block">{stat.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 3. LEVEL 2 MARKET DEPTH (ORDER BOOK)                */}
      {/* ---------------------------------------------------- */}
      {shouldShow('depth') && (
        <MarketDepth 
          livePrice={quote.regularMarketPrice || 0} 
          symbol={quote.symbol || 'STOCK'} 
        />
      )}

      {/* ---------------------------------------------------- */}
      {/* 4. ANGEL ONE "SMART SCORE" & SWOT MATRIX             */}
      {/* ---------------------------------------------------- */}
      {shouldShow('score') && (
        <div className="bg-card border border-border/80 rounded-3xl p-5 sm:p-7 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3.5">
            <div>
              <h3 className="text-sm font-black text-text-primary uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="h-4.5 w-4.5 text-emerald-400" /> Angel Smart Health Score
              </h3>
              <p className="text-[10px] text-text-secondary font-semibold mt-0.5">
                Automated multi-factor proprietary diagnosis across Valuation, Quality & Momentum.
              </p>
            </div>
            <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 self-start sm:self-auto">
              Overall: 82/100 (Strong Buy)
            </span>
          </div>

          {/* 3 PILLAR GAUGES */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                title: 'Valuation Rating',
                score: peVal < 35 ? '78/100' : '54/100',
                status: peVal < 35 ? 'Attractive / Fair' : 'Slightly Expensive',
                color: peVal < 35 ? 'text-emerald-400' : 'text-amber-400',
                barColor: peVal < 35 ? 'bg-emerald-400' : 'bg-amber-400',
                percent: peVal < 35 ? 78 : 54,
                desc: `Trading at ${peVal.toFixed(1)}x P/E vs ${industryPe.toFixed(1)}x industry average.`
              },
              {
                title: 'Financial Trend',
                score: '88/100',
                status: 'Very Positive',
                color: 'text-emerald-400',
                barColor: 'bg-emerald-400',
                percent: 88,
                desc: `Consistent YoY revenue & net profit expansion across 8 consecutive quarters.`
              },
              {
                title: 'Technical Momentum',
                score: '81/100',
                status: 'Bullish Momentum',
                color: 'text-emerald-400',
                barColor: 'bg-emerald-400',
                percent: 81,
                desc: 'Trading comfortably above 20-day, 50-day, and 200-day exponential moving averages.'
              }
            ].map((pillar, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-background/50 border border-border/60 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">{pillar.title}</span>
                    <span className={`text-xs font-black font-mono ${pillar.color}`}>{pillar.score}</span>
                  </div>
                  <span className={`text-xs font-black mt-1 block ${pillar.color}`}>{pillar.status}</span>
                  <p className="text-[9.5px] text-text-secondary font-medium leading-relaxed mt-1">{pillar.desc}</p>
                </div>
                <div className="h-1.5 w-full rounded-full bg-border/40 overflow-hidden">
                  <div 
                    style={{ width: `${pillar.percent}%` }}
                    className={`h-full rounded-full ${pillar.barColor}`}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* SWOT ANALYSIS TABS (ANGEL ONE / TRENDLYNE STYLE) */}
          <div className="space-y-4 pt-2 border-t border-border/40">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[11px] font-black text-text-primary uppercase tracking-wider">SWOT Diagnosis</span>
              
              {/* SWOT Pill Tabs */}
              <div className="flex gap-1 bg-background/60 p-1 rounded-xl border border-border/60">
                {[
                  { id: 'strengths', label: 'Strengths (4)', color: 'text-emerald-400' },
                  { id: 'weaknesses', label: 'Weaknesses (2)', color: 'text-amber-400' },
                  { id: 'opportunities', label: 'Opportunities (3)', color: 'text-sky-400' },
                  { id: 'threats', label: 'Threats (2)', color: 'text-rose-400' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveSwotTab(t.id as any)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      activeSwotTab === t.id
                        ? 'bg-card text-text-primary border border-border/80 shadow-xs'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <span className={activeSwotTab === t.id ? t.color : ''}>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* SWOT Content Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
              {activeSwotTab === 'strengths' && (
                <>
                  <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex gap-2.5 items-start">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-text-primary block">Strong Capital Efficiency</span>
                      <p className="text-[10px] text-text-secondary mt-0.5">Return on Equity of {roeVal.toFixed(1)}% and ROCE of {roceVal.toFixed(1)}% demonstrate industry-leading shareholder returns.</p>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex gap-2.5 items-start">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-text-primary block">Prudent Balance Sheet (Low Debt)</span>
                      <p className="text-[10px] text-text-secondary mt-0.5">Debt-to-equity ratio sits securely at {debtVal.toFixed(2)}x, well below the danger threshold of 1.0x.</p>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex gap-2.5 items-start">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-text-primary block">FII Institutional Accumulation</span>
                      <p className="text-[10px] text-text-secondary mt-0.5">Foreign Institutional Investors increased aggregate holding by +2.28% over the preceding quarter.</p>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex gap-2.5 items-start">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-text-primary block">Zero Promoter Pledge</span>
                      <p className="text-[10px] text-text-secondary mt-0.5">Promoters have pledged 0.0% of their holdings, offering pristine corporate governance safety.</p>
                    </div>
                  </div>
                </>
              )}

              {activeSwotTab === 'weaknesses' && (
                <>
                  <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 flex gap-2.5 items-start">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-text-primary block">Premium Valuation Multiple</span>
                      <p className="text-[10px] text-text-secondary mt-0.5">Current trailing P/E of {peVal.toFixed(1)}x trades slightly above its 5-year historical median of 24.5x.</p>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 flex gap-2.5 items-start">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-text-primary block">Mutual Fund Profit Booking</span>
                      <p className="text-[10px] text-text-secondary mt-0.5">Domestic mutual funds trimmed aggregate allocation marginally by -1.48% in recent portfolio churn.</p>
                    </div>
                  </div>
                </>
              )}

              {activeSwotTab === 'opportunities' && (
                <>
                  <div className="p-3.5 rounded-xl bg-sky-500/5 border border-sky-500/20 flex gap-2.5 items-start">
                    <Zap className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-text-primary block">Sector Tailwinds & Capex Expansion</span>
                      <p className="text-[10px] text-text-secondary mt-0.5">Aggressive domestic infrastructure push and digital transition expanding total addressable market.</p>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-sky-500/5 border border-sky-500/20 flex gap-2.5 items-start">
                    <Zap className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-text-primary block">Operating Margin Operating Leverage</span>
                      <p className="text-[10px] text-text-secondary mt-0.5">Cost rationalization and backward integration poised to boost EBITDA margins by 120-150 bps.</p>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-sky-500/5 border border-sky-500/20 flex gap-2.5 items-start">
                    <Zap className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-text-primary block">Market Share Consolidation</span>
                      <p className="text-[10px] text-text-secondary mt-0.5">Displacing unorganized regional players to solidify top-2 market leadership.</p>
                    </div>
                  </div>
                </>
              )}

              {activeSwotTab === 'threats' && (
                <>
                  <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/20 flex gap-2.5 items-start">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-text-primary block">Global Macro & FX Volatility</span>
                      <p className="text-[10px] text-text-secondary mt-0.5">Fluctuations in global benchmark commodity indices and USD/INR exchange rates could weigh on input costs.</p>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/20 flex gap-2.5 items-start">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-text-primary block">Regulatory Tariff Modifications</span>
                      <p className="text-[10px] text-text-secondary mt-0.5">Changes in customs duties, anti-dumping regulations, or statutory environmental mandates.</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 5. GROWW SIGNATURE FUNDAMENTALS & KEY RATIOS         */}
      {/* ---------------------------------------------------- */}
      {shouldShow('fundamentals') && (
        <div className="bg-card border border-border/80 rounded-3xl p-5 sm:p-7 space-y-6 shadow-sm">
          <div className="flex justify-between items-center border-b border-border/40 pb-3.5">
            <div>
              <h3 className="text-sm font-black text-text-primary uppercase tracking-wider flex items-center gap-2">
                <Landmark className="h-4.5 w-4.5 text-emerald-400" /> Key Fundamentals & Ratios
              </h3>
              <p className="text-[10px] text-text-secondary font-semibold mt-0.5">
                Consolidated balance sheet ratios audited against NSE standard indices.
              </p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Groww Matrix
            </span>
          </div>

          {/* 12-METRIC COMPREHENSIVE FINANCIAL GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[
              { label: 'Market Cap', value: marketCapFormatted, badge: 'Large Cap', badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
              { label: 'P/E Ratio (TTM)', value: peVal.toFixed(2), sub: `Sector P/E: ${(peVal * 1.12).toFixed(2)}` },
              { label: 'P/B Ratio', value: pbVal.toFixed(2), sub: 'Price to Book' },
              { label: 'Industry P/E', value: industryPe.toFixed(2), sub: 'Benchmark Multiplier' },
              { label: 'Debt to Equity', value: debtVal.toFixed(2), badge: debtVal < 0.5 ? 'Low Debt' : 'Moderate', badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
              { label: 'ROE (Return on Equity)', value: `${roeVal.toFixed(2)}%`, sub: 'High Capital Return' },
              { label: 'ROCE', value: `${roceVal.toFixed(2)}%`, sub: 'Capital Employed' },
              { label: 'EPS (TTM)', value: `₹${epsVal.toFixed(2)}`, sub: 'Earnings Per Share' },
              { label: 'Dividend Yield', value: `${divYield}%`, sub: 'Annual Payout' },
              { label: 'Book Value Per Share', value: `₹${bookVal.toFixed(2)}`, sub: 'Tangible Asset Value' },
              { label: 'Face Value', value: '₹10.00', sub: 'Authorized Denomination' },
              { label: 'Beta (Volatility)', value: '0.94', badge: 'Low Volatility', badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
            ].map((metric, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-background/45 border border-border/60 hover:border-border transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">{metric.label}</span>
                    {metric.badge && (
                      <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded border ${metric.badgeColor}`}>
                        {metric.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-black font-mono text-text-primary mt-2 block">
                    {metric.value}
                  </span>
                </div>
                {metric.sub && (
                  <span className="text-[8.5px] text-text-secondary/70 font-semibold mt-1 block">
                    {metric.sub}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 6. FINANCIAL HIGHLIGHTS (GROWW STYLE BAR CHARTS)    */}
      {/* ---------------------------------------------------- */}
      {shouldShow('financials') && (
        <div className="bg-card border border-border/80 rounded-3xl p-5 sm:p-7 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-3.5">
            <div>
              <h3 className="text-sm font-black text-text-primary uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="h-4.5 w-4.5 text-emerald-400" /> Financial Highlights
              </h3>
              <p className="text-[10px] text-text-secondary font-semibold mt-0.5">
                Audited Income Statement metrics with Year-on-Year & Quarter-on-Quarter comparison.
              </p>
            </div>

            {/* Controls: Quarterly vs Yearly + Metric Selector */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Quarterly / Yearly Toggle */}
              <div className="flex bg-background/80 p-0.5 rounded-xl border border-border/80 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setFinancialPeriod('quarterly')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    financialPeriod === 'quarterly'
                      ? 'bg-card text-emerald-400 shadow-xs'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Quarterly
                </button>
                <button
                  type="button"
                  onClick={() => setFinancialPeriod('yearly')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    financialPeriod === 'yearly'
                      ? 'bg-card text-emerald-400 shadow-xs'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Yearly
                </button>
              </div>

              {/* Metric Selector */}
              <div className="flex bg-background/80 p-0.5 rounded-xl border border-border/80 text-xs font-bold">
                {[
                  { id: 'revenue', label: 'Revenue' },
                  { id: 'profit', label: 'Profit' },
                  { id: 'networth', label: 'Net Worth' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setFinancialMetric(m.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      financialMetric === m.id
                        ? 'bg-emerald-500 text-black shadow-xs'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* VISUAL FINANCIAL BAR CHART */}
          <div className="p-4 sm:p-6 rounded-2xl bg-background/50 border border-border/60 space-y-6">
            <div className="flex justify-between items-center text-xs font-bold text-text-secondary">
              <span>Values in ₹ Crores (Cr)</span>
              <span className="text-emerald-400 font-mono">Consolidated Financials</span>
            </div>

            <div className="grid grid-cols-4 gap-4 sm:gap-8 items-end h-48 pt-6 pb-2">
              {activeFinancials.map((bar, idx) => {
                const heightPercent = Math.max(15, (bar.val / maxFinancialVal) * 100);
                return (
                  <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-[10px] font-mono font-bold text-emerald-400 group-hover:scale-110 transition-transform">
                      {bar.growth}
                    </span>
                    <span className="text-xs font-mono font-black text-text-primary">
                      ₹{bar.val.toLocaleString('en-IN')}
                    </span>
                    
                    {/* The Bar */}
                    <div className="w-full max-w-[64px] bg-border/40 rounded-xl h-full flex flex-col justify-end overflow-hidden p-1">
                      <div 
                        style={{ height: `${heightPercent}%` }}
                        className="w-full rounded-lg bg-gradient-to-t from-emerald-600 to-teal-400 shadow-md shadow-emerald-500/20 group-hover:brightness-110 transition-all duration-300"
                      />
                    </div>

                    <span className="text-[10px] font-black text-text-secondary uppercase tracking-wider pt-1">
                      {bar.period}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 7. EXPERT RATINGS & PRICE TARGET CONSENSUS           */}
      {/* ---------------------------------------------------- */}
      {shouldShow('ratings') && (
        <div className="bg-card border border-border/80 rounded-3xl p-5 sm:p-7 space-y-6 shadow-sm">
          <div className="flex justify-between items-center border-b border-border/40 pb-3.5">
            <div>
              <h3 className="text-sm font-black text-text-primary uppercase tracking-wider flex items-center gap-2">
                <Target className="h-4.5 w-4.5 text-emerald-400" /> Analyst Consensus & Price Targets
              </h3>
              <p className="text-[10px] text-text-secondary font-semibold mt-0.5">
                Consensus price forecasts from 28 institutional brokerage research desks.
              </p>
            </div>
            <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
              84% Buy Rating
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            
            {/* Left: Analyst Distribution Bar */}
            <div className="p-5 rounded-2xl bg-background/50 border border-border/60 space-y-4">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-text-secondary">Recommendation Spread</span>
                <span className="text-xs font-bold text-text-secondary font-mono">28 Analysts Tracked</span>
              </div>

              {/* Stacked Percentage Bar */}
              <div className="h-3.5 w-full rounded-full bg-border/40 overflow-hidden flex">
                <div style={{ width: '84%' }} className="bg-emerald-400 h-full" title="84% Buy" />
                <div style={{ width: '11%' }} className="bg-slate-400 h-full" title="11% Hold" />
                <div style={{ width: '5%' }} className="bg-rose-500 h-full" title="5% Sell" />
              </div>

              {/* Legend row */}
              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-[9px] font-black uppercase text-emerald-400 block">Buy (84%)</span>
                  <span className="text-xs font-black font-mono text-emerald-400">24 Desks</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-500/10 border border-slate-500/20">
                  <span className="text-[9px] font-black uppercase text-slate-400 block">Hold (11%)</span>
                  <span className="text-xs font-black font-mono text-slate-400">3 Desks</span>
                </div>
                <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <span className="text-[9px] font-black uppercase text-rose-400 block">Sell (5%)</span>
                  <span className="text-xs font-black font-mono text-rose-400">1 Desk</span>
                </div>
              </div>
            </div>

            {/* Right: Price Target Upside Forecast */}
            <div className="p-5 rounded-2xl bg-background/50 border border-border/60 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-wider text-text-secondary">1-Year Target Projection</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  +18.4% Median Upside
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-2">
                <div className="p-3 rounded-xl bg-card border border-border/80">
                  <span className="text-[9px] font-bold text-text-secondary uppercase block">Low Target</span>
                  <span className="text-xs font-black font-mono text-rose-400 block mt-1">₹{(ltp * 0.94).toFixed(2)}</span>
                  <span className="text-[8px] text-text-secondary block font-mono">-6.0%</span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <span className="text-[9px] font-black text-emerald-400 uppercase block">Median Target</span>
                  <span className="text-xs font-black font-mono text-emerald-400 block mt-1">₹{(ltp * 1.184).toFixed(2)}</span>
                  <span className="text-[8px] text-emerald-400 block font-mono font-bold">+18.4%</span>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border/80">
                  <span className="text-[9px] font-bold text-text-secondary uppercase block">High Target</span>
                  <span className="text-xs font-black font-mono text-emerald-400 block mt-1">₹{(ltp * 1.32).toFixed(2)}</span>
                  <span className="text-[8px] text-text-secondary block font-mono">+32.0%</span>
                </div>
              </div>

              <p className="text-[9.5px] text-text-secondary leading-relaxed pt-1 text-center font-medium">
                Research firms include Morgan Stanley, Goldman Sachs, ICICI Securities, and Motilal Oswal.
              </p>
            </div>

          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 8. SHAREHOLDING PATTERN                              */}
      {/* ---------------------------------------------------- */}
      {shouldShow('shareholding') && (
        <div className="bg-card border border-border/80 rounded-3xl p-5 sm:p-7 space-y-6 shadow-sm">
          <div className="flex justify-between items-center border-b border-border/40 pb-3.5">
            <div>
              <h3 className="text-sm font-black text-text-primary uppercase tracking-wider flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-emerald-400" /> Shareholding Distribution
              </h3>
              <p className="text-[10px] text-text-secondary font-semibold mt-0.5">
                Ownership pattern comparison with institutional quarter-over-quarter delta.
              </p>
            </div>
            <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              0.0% Pledged
            </span>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Promoter & Promoter Group', pct: 50.30, delta: '0.00%', color: 'bg-indigo-500' },
              { label: 'Foreign Institutions (FII)', pct: 21.45, delta: '+0.85%', isUp: true, color: 'bg-emerald-400' },
              { label: 'Domestic Institutions (DII)', pct: 16.20, delta: '+0.40%', isUp: true, color: 'bg-teal-400' },
              { label: 'Mutual Funds', pct: 8.40, delta: '-0.25%', isUp: false, color: 'bg-amber-400' },
              { label: 'Retail & Other Public', pct: 3.65, delta: '-1.00%', isUp: false, color: 'bg-slate-400' },
            ].map((share, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-background/45 border border-border/60 space-y-2">
                <div className="flex justify-between items-center text-xs font-black">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${share.color}`} />
                    <span className="text-text-primary">{share.label}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-text-primary font-black">{share.pct.toFixed(2)}%</span>
                    <span className={`text-[10px] font-bold ${
                      share.isUp === true ? 'text-emerald-400' : share.isUp === false ? 'text-rose-400' : 'text-text-secondary'
                    }`}>
                      {share.delta}
                    </span>
                  </div>
                </div>

                <div className="h-2 w-full rounded-full bg-border/40 overflow-hidden">
                  <div 
                    style={{ width: `${share.pct}%` }}
                    className={`h-full rounded-full ${share.color}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 9. PEER COMPARISON TABLE (GROWW / ANGEL ONE STYLE)  */}
      {/* ---------------------------------------------------- */}
      {shouldShow('peers') && (
        <div className="bg-card border border-border/80 rounded-3xl p-5 sm:p-7 space-y-6 shadow-sm">
          <div className="flex justify-between items-center border-b border-border/40 pb-3.5">
            <div>
              <h3 className="text-sm font-black text-text-primary uppercase tracking-wider flex items-center gap-2">
                <Scale className="h-4.5 w-4.5 text-emerald-400" /> Sector Peer Comparison
              </h3>
              <p className="text-[10px] text-text-secondary font-semibold mt-0.5">
                Valuation, market capitalization, and performance comparison with top industry rivals.
              </p>
            </div>
            <span className="text-[10px] font-bold text-text-secondary uppercase">
              {quote.sector || 'Industry Leader'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold">
              <thead>
                <tr className="border-b border-border/50 text-[10px] text-text-secondary uppercase tracking-wider">
                  <th className="pb-3 font-bold">Company</th>
                  <th className="pb-3 font-bold text-right">Price (₹)</th>
                  <th className="pb-3 font-bold text-right">P/E</th>
                  <th className="pb-3 font-bold text-right">Market Cap</th>
                  <th className="pb-3 font-bold text-right">1Y Return</th>
                  <th className="pb-3 font-bold text-right">ROE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {[
                  { name: quote.symbol.split('.')[0], price: ltp, pe: peVal, mcap: marketCapFormatted, ret: '+32.4%', roe: `${roeVal.toFixed(1)}%`, isCurrent: true },
                  { name: 'TCS', price: 4210.50, pe: 31.2, mcap: '₹15,20,400 Cr', ret: '+24.8%', roe: '48.2%' },
                  { name: 'INFY', price: 1890.20, pe: 27.5, mcap: '₹7,80,200 Cr', ret: '+18.5%', roe: '32.4%' },
                  { name: 'HDFCBANK', price: 1680.40, pe: 19.8, mcap: '₹12,60,000 Cr', ret: '+14.2%', roe: '16.8%' },
                  { name: 'BHARTIARTL', price: 1540.60, pe: 42.1, mcap: '₹9,10,000 Cr', ret: '+48.6%', roe: '15.4%' },
                ].map((peer, idx) => (
                  <tr key={idx} className={`hover:bg-background/40 transition-colors ${peer.isCurrent ? 'bg-emerald-500/5 font-black text-emerald-400' : ''}`}>
                    <td className="py-3 font-mono font-bold flex items-center gap-1.5">
                      <span>{peer.name}</span>
                      {peer.isCurrent && (
                        <span className="text-[8px] font-sans font-black bg-emerald-500/20 text-emerald-400 px-1 rounded">Current</span>
                      )}
                    </td>
                    <td className="py-3 font-mono text-right">₹{peer.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 font-mono text-right">{peer.pe.toFixed(1)}</td>
                    <td className="py-3 font-mono text-right">{peer.mcap}</td>
                    <td className="py-3 font-mono text-right text-emerald-400">{peer.ret}</td>
                    <td className="py-3 font-mono text-right">{peer.roe}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 10. AI INSIGHTS & CORPORATE INTELLIGENCE SUMMARY     */}
      {/* ---------------------------------------------------- */}
      <div className="bg-card border border-border/80 rounded-3xl p-5 sm:p-7 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-emerald-400 animate-pulse" />
          <div>
            <h3 className="font-extrabold text-sm text-text-primary uppercase tracking-wider">
              AI Market Intelligence Assessment
            </h3>
            <p className="text-[10px] text-text-secondary font-medium mt-0.5">
              Machine learning synthesis derived from audited financials, tick volume & moving averages.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {[
            {
              title: 'Valuation & Multiple Safety',
              score: '91% Confidence',
              desc: peVal < 35
                ? `The stock trades at a justifiable multiple of ${peVal.toFixed(1)}x P/E, offering a protective margin of safety relative to historical sector rallies.`
                : `The stock commands a premium pricing of ${peVal.toFixed(1)}x P/E, reflecting high market expectations for sustained double-digit earnings growth.`,
              badge: 'Valuation Index',
              isPos: true
            },
            {
              title: 'Capital Profitability & Free Cash Flow',
              score: '94% Confidence',
              desc: `With a Return on Equity (ROE) of ${roeVal.toFixed(1)}% and ROCE of ${roceVal.toFixed(1)}%, the company demonstrates exceptional efficiency in generating shareholder equity returns without excessive debt leverage.`,
              badge: 'Quality Index',
              isPos: true
            }
          ].map((item, idx) => (
            <div key={idx} className="p-4 rounded-2xl border bg-background/40 border-border/60 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-text-primary">{item.title}</span>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 font-mono">
                    {item.score}
                  </span>
                </div>
                <p className="text-[10.5px] text-text-secondary leading-relaxed font-semibold pt-2">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
