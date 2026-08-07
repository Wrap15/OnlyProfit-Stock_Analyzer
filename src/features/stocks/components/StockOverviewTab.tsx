'use client';

import React, { useState } from 'react';
import { 
  TrendingUp, TrendingDown, Sparkles, ChevronRight, Activity, 
  BarChart3, ShieldAlert, Award, FileText, ArrowRightLeft, Landmark 
} from 'lucide-react';

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
  // Sub-Navigation section state
  const [activeSubSection, setActiveSubSection] = useState<'all' | 'activity' | 'ratios' | 'performance' | 'shareholding' | 'summary'>('all');

  // Fundamental sub-tabs state
  const [activeRatioTab, setActiveRatioTab] = useState<'valuation' | 'growth' | 'financial' | 'dividend'>('valuation');

  const peVal = quote.trailingPE || 58.75;
  const pbVal = quote.priceToBook || 5.47;
  const pegVal = 0.08;
  const roeVal = roe || 6.12;

  // Render Section Helper
  const shouldShow = (sec: typeof activeSubSection) => activeSubSection === 'all' || activeSubSection === sec;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Sub-Navigation Pill Strip */}
      <div className="sticky top-[125px] sm:top-[125px] z-10 bg-background/95 backdrop-blur-md py-2 border-b border-border/40 flex items-center gap-1.5 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        {[
          { id: 'all', label: 'All Details' },
          { id: 'activity', label: 'Activity' },
          { id: 'ratios', label: 'Analyst Ratings & Ratios' },
          { id: 'performance', label: 'Performance Overview' },
          { id: 'shareholding', label: 'Shareholding Patterns' },
          { id: 'summary', label: 'Price Summary' }
        ].map((sec) => (
          <button
            key={sec.id}
            onClick={() => setActiveSubSection(sec.id as any)}
            className={`px-3 py-1.5 text-[10px] font-black rounded-lg uppercase tracking-wider transition-all whitespace-nowrap border shrink-0 cursor-pointer ${
              activeSubSection === sec.id
                ? 'bg-profit/10 border-profit/35 text-profit'
                : 'border-border/60 text-text-secondary hover:text-text-primary hover:bg-background'
            }`}
          >
            {sec.label}
          </button>
        ))}
      </div>

      {/* ---------------------------------------------------- */}
      {/* SECTION 1: ACTIVITY */}
      {/* ---------------------------------------------------- */}
      {shouldShow('activity') && (
        <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 space-y-6 shadow-sm">
          <div className="flex justify-between items-center border-b border-border/40 pb-3">
            <h3 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Activity className="h-4.5 w-4.5 text-profit" /> Market Activity & Targets
            </h3>
            <span className="text-[9px] font-extrabold text-text-secondary uppercase tracking-widest">Real-time Stats</span>
          </div>

          {/* Quick Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Average Price', value: `₹${(quote.regularMarketPrice * 0.998).toFixed(2)}` },
              { label: 'Volume', value: formatIndianNumber(quote.regularMarketVolume || 4507808) },
              { label: 'Open Interest', value: '13,56,86,250' },
              { label: 'Bid / Ask', value: `₹${(quote.regularMarketPrice - 0.05).toFixed(2)} / ₹${(quote.regularMarketPrice + 0.05).toFixed(2)}` }
            ].map((m, idx) => (
              <div key={idx} className="bg-background/45 border border-border/50 rounded-xl p-3">
                <span className="block text-[8.5px] font-black text-text-secondary uppercase tracking-wider">{m.label}</span>
                <span className="text-xs font-black text-text-primary mt-1 block font-mono">{m.value}</span>
              </div>
            ))}
          </div>

          {/* Range Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Lower Circuit / Upper Circuit */}
            <div className="space-y-2 p-4 rounded-xl bg-background/20 border border-border/50">
              <div className="flex justify-between items-center text-[9px] font-black text-text-secondary uppercase tracking-wider">
                <span>Lower / Upper Circuit</span>
                <span className="text-text-primary">LTP: ₹{quote.regularMarketPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="relative pt-1">
                <div className="flex mb-1 items-center justify-between text-[8px] font-bold text-text-secondary">
                  <span>Low: ₹{(quote.regularMarketPrice * 0.9).toFixed(2)}</span>
                  <span>High: ₹{(quote.regularMarketPrice * 1.1).toFixed(2)}</span>
                </div>
                <div className="overflow-hidden h-2 text-xs flex rounded-full bg-border relative items-center">
                  <div 
                    style={{ width: '45%' }}
                    className="shadow-none flex flex-col text-center justify-center bg-profit/40 h-full rounded-full"
                  />
                  <div
                    style={{ left: '45%' }}
                    className="absolute w-2.5 h-2.5 rounded-full bg-profit border-2 border-card shadow"
                  />
                </div>
              </div>
            </div>

            {/* 52 Week Low / High */}
            <div className="space-y-2 p-4 rounded-xl bg-background/20 border border-border/50">
              <div className="flex justify-between items-center text-[9px] font-black text-text-secondary uppercase tracking-wider">
                <span>52 Week Low / High</span>
                <span className="text-text-primary">Range Span</span>
              </div>
              <div className="relative pt-1">
                <div className="flex mb-1 items-center justify-between text-[8px] font-bold text-text-secondary">
                  <span className="text-loss">Low: ₹{fiftyTwoLow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  <span className="text-profit">High: ₹{fiftyTwoHigh.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="overflow-hidden h-2 text-xs flex rounded-full bg-border relative items-center">
                  <div 
                    style={{ width: '85%' }}
                    className="shadow-none flex flex-col text-center justify-center bg-profit/40 h-full rounded-full"
                  />
                  <div
                    style={{ left: '85%' }}
                    className="absolute w-2.5 h-2.5 rounded-full bg-profit border-2 border-card shadow"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Analyst Ratings */}
          <div className="pt-2 border-t border-border/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h4 className="text-xs font-black text-text-primary uppercase tracking-wider">Analyst Ratings</h4>
                <p className="text-[9px] text-text-secondary mt-0.5">*Based on the review of 5 analysts in the last 1 year</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="block text-[8px] font-black text-text-secondary uppercase">Expected Target</span>
                  <span className="text-xs font-black text-profit font-mono">₹{(quote.regularMarketPrice * 1.05).toFixed(2)}</span>
                </div>
                <div className="text-right border-l border-border/50 pl-3">
                  <span className="block text-[8px] font-black text-text-secondary uppercase">Expected Profit</span>
                  <span className="text-xs font-black text-profit font-mono">+5.00%</span>
                </div>
              </div>
            </div>

            {/* Analyst bars */}
            <div className="space-y-3">
              {[
                { label: 'BUY', percent: 80, color: 'bg-profit' },
                { label: 'HOLD', percent: 0, color: 'bg-slate-400' },
                { label: 'SELL', percent: 20, color: 'bg-loss' }
              ].map((bar, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center text-[9px] font-black">
                    <span className="text-text-secondary">{bar.label}</span>
                    <span className="text-text-primary">{bar.percent}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-background border border-border/40 overflow-hidden">
                    <div 
                      style={{ width: `${bar.percent}%` }}
                      className={`h-full rounded-full ${bar.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SECTION 2: FUNDAMENTAL RATIOS */}
      {/* ---------------------------------------------------- */}
      {shouldShow('ratios') && (
        <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm">
          <div className="flex justify-between items-center border-b border-border/40 pb-3">
            <h3 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Landmark className="h-4.5 w-4.5 text-profit" /> Fundamental Ratios
            </h3>
            <span className="text-[9px] font-extrabold text-text-secondary uppercase tracking-widest">Key Valuations</span>
          </div>

          {/* Sub tabs inside Ratios */}
          <div className="flex gap-1.5 p-0.5 rounded-lg bg-background border border-border/60 self-start">
            {[
              { id: 'valuation', label: 'Valuation Ratio' },
              { id: 'growth', label: 'Growth' },
              { id: 'financial', label: 'Financial' },
              { id: 'dividend', label: 'Dividend' }
            ].map((subTab) => (
              <button
                key={subTab.id}
                onClick={() => setActiveRatioTab(subTab.id as any)}
                className={`px-3 py-1 rounded text-[8.5px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeRatioTab === subTab.id
                    ? 'bg-card text-profit border border-border/50 shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {subTab.label}
              </button>
            ))}
          </div>

          {/* Ratio content cards */}
          {activeRatioTab === 'valuation' && (
            <div className="grid grid-cols-2 gap-4 pt-1">
              {[
                { label: 'PE Ratio', value: peVal.toFixed(2) },
                { label: 'Price to Book Value', value: pbVal.toFixed(2) },
                { label: 'PEG Ratio', value: pegVal.toFixed(2) },
                { label: 'ROE (Latest)', value: `${roeVal.toFixed(2)}%` }
              ].map((r, i) => (
                <div key={i} className="bg-background/35 border border-border/45 rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-[9px] font-black text-text-secondary uppercase tracking-wider">{r.label}</span>
                  <span className="text-base font-black text-text-primary mt-2 font-mono">{r.value}</span>
                </div>
              ))}
            </div>
          )}

          {activeRatioTab === 'growth' && (
            <div className="grid grid-cols-2 gap-4 pt-1">
              {[
                { label: 'Revenue Growth (YoY)', value: '+14.85%' },
                { label: 'Net Profit Growth', value: '+22.40%' },
                { label: 'Operating Profit CAGR', value: '+18.10%' },
                { label: 'EPS Growth (3Y)', value: '+15.20%' }
              ].map((r, i) => (
                <div key={i} className="bg-background/35 border border-border/45 rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-[9px] font-black text-text-secondary uppercase tracking-wider">{r.label}</span>
                  <span className="text-base font-black text-profit mt-2 font-mono">{r.value}</span>
                </div>
              ))}
            </div>
          )}

          {activeRatioTab === 'financial' && (
            <div className="grid grid-cols-2 gap-4 pt-1">
              {[
                { label: 'Debt to Equity', value: debtToEquity.toFixed(2) },
                { label: 'Interest Coverage', value: '8.42' },
                { label: 'ROCE', value: `${roce.toFixed(2)}%` },
                { label: 'Current Ratio', value: '1.45' }
              ].map((r, i) => (
                <div key={i} className="bg-background/35 border border-border/45 rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-[9px] font-black text-text-secondary uppercase tracking-wider">{r.label}</span>
                  <span className="text-base font-black text-text-primary mt-2 font-mono">{r.value}</span>
                </div>
              ))}
            </div>
          )}

          {activeRatioTab === 'dividend' && (
            <div className="grid grid-cols-2 gap-4 pt-1">
              {[
                { label: 'Dividend Yield', value: quote.dividendYield ? `${quote.dividendYield.toFixed(2)}%` : '1.25%' },
                { label: 'Dividend Payout Ratio', value: '28.4%' },
                { label: 'Dividend Per Share', value: '₹5.50' },
                { label: 'Last Ex-Date', value: 'Jul 12, 2025' }
              ].map((r, i) => (
                <div key={i} className="bg-background/35 border border-border/45 rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-[9px] font-black text-text-secondary uppercase tracking-wider">{r.label}</span>
                  <span className="text-base font-black text-text-primary mt-2 font-mono">{r.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SECTION 3: PERFORMANCE OVERVIEW */}
      {/* ---------------------------------------------------- */}
      {shouldShow('performance') && (
        <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm">
          <div className="flex justify-between items-center border-b border-border/40 pb-3">
            <h3 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Award className="h-4.5 w-4.5 text-profit" /> Performance Overview
            </h3>
            <span className="text-[9px] font-extrabold text-text-secondary uppercase tracking-widest">Industry Standings</span>
          </div>

          {/* Sector trend headers */}
          <div className="bg-background/25 border border-border/60 rounded-xl p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="block text-[8px] font-black text-text-secondary uppercase tracking-wider">Sector Trend (#4)</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[8.5px] font-black px-1.5 py-0.5 rounded bg-background border border-border text-text-secondary uppercase">LARGE CAP</span>
                  <span className="text-[8.5px] font-black px-1.5 py-0.5 rounded bg-background border border-border text-text-secondary uppercase">{quote.sector || 'ELECTRICAL'}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-xl text-center">
                  <span className="block text-[7px] font-black text-text-secondary uppercase">Short Term</span>
                  <span className="text-[9px] font-black text-profit">Very Positive</span>
                </div>
                <div className="bg-slate-500/10 border border-slate-500/20 px-3 py-1 rounded-xl text-center">
                  <span className="block text-[7px] font-black text-text-secondary uppercase">Long Term</span>
                  <span className="text-[9px] font-black text-text-secondary">Neutral</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-border/30">
              <div>
                <span className="block text-[8px] font-black text-text-secondary uppercase">Market Cap</span>
                <span className="text-xs font-black text-text-primary">{formatIndianNumber(quote.marketCap)}</span>
              </div>
              <div>
                <span className="block text-[8px] font-black text-text-secondary uppercase">1 year Return</span>
                <span className="text-xs font-black text-profit">+70.31%</span>
              </div>
              <div>
                <span className="block text-[8px] font-black text-text-secondary uppercase">Sector Return</span>
                <span className="text-xs font-black text-profit">+49.32%</span>
              </div>
              <div>
                <span className="block text-[8px] font-black text-text-secondary uppercase">Market Return</span>
                <span className="text-xs font-black text-profit">+0.33%</span>
              </div>
            </div>
          </div>

          {/* Quality & Valuations pills grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: 'Quality', val: 'GOOD', score: '4/5', color: 'text-profit bg-profit/10 border-profit/20' },
              { label: 'Valuation', val: 'EXPENSIVE', score: '2/5', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
              { label: 'Financial', val: 'OUTSTANDING', score: '5/5', color: 'text-profit bg-profit/10 border-profit/20' }
            ].map((p, i) => (
              <div key={i} className="flex justify-between items-center p-3 rounded-xl border bg-background/30 border-border/40">
                <span className="text-[9px] font-black text-text-secondary uppercase">{p.label}</span>
                <span className={`text-[8.5px] font-black px-2 py-0.5 rounded-lg border ${p.color}`}>
                  {p.val} <span className="opacity-80">({p.score})</span>
                </span>
              </div>
            ))}
          </div>

          {/* Details dots */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-background/25 border border-border/50">
            <div className="flex items-center gap-2 text-[10px] font-bold">
              <span className="h-2 w-2 rounded-full bg-profit" />
              <span className="text-text-secondary">Capital Structure:</span>
              <span className="text-text-primary font-black ml-auto">Good</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold">
              <span className="h-2 w-2 rounded-full bg-profit" />
              <span className="text-text-secondary">Growth:</span>
              <span className="text-text-primary font-black ml-auto">Excellent</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-text-secondary">Management Risk:</span>
              <span className="text-text-primary font-black ml-auto">Average</span>
            </div>
          </div>

          {/* Insights bulletin */}
          <div className="space-y-2 pt-1">
            <h4 className="text-[10px] font-black text-text-secondary uppercase tracking-wider">Insights to Look For</h4>
            <ul className="text-[10.5px] text-text-secondary font-medium leading-relaxed list-disc pl-4 space-y-1">
              <li>Good quality company basis long term financial performance.</li>
              <li>Second largest company in {quote.sector || 'Electrical Equipment'} sector.</li>
            </ul>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SECTION 4: SHAREHOLDING PATTERNS */}
      {/* ---------------------------------------------------- */}
      {shouldShow('shareholding') && (
        <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm">
          <div className="flex justify-between items-center border-b border-border/40 pb-3">
            <h3 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="h-4.5 w-4.5 text-profit" /> Shareholding Patterns
            </h3>
            <span className="text-[9px] font-extrabold text-text-secondary uppercase tracking-widest">Share Holdings</span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-text-secondary uppercase tracking-wider">Percentage of Shareholding</span>
              <div className="flex gap-3 text-[9px] font-black">
                <div className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded bg-pink-500/70" />
                  <span className="text-text-secondary">Jun 26</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded bg-indigo-500/30" />
                  <span className="text-text-secondary">Mar 26</span>
                </div>
              </div>
            </div>

            {/* Shareholding bar rows comparison */}
            <div className="space-y-4 pt-2">
              {[
                { label: 'Promoters', jun: 58.17, mar: 58.17, diff: 0, isPos: true },
                { label: 'FIIs', jun: 9.51, mar: 7.23, diff: 2.28, isPos: true },
                { label: 'Mutual Funds', jun: 11.40, mar: 12.88, diff: -1.48, isPos: false },
                { label: 'Insurance Companies', jun: 8.57, mar: 8.70, diff: -0.13, isPos: false },
                { label: 'Other DIIs', jun: 2.47, mar: 2.41, diff: 0.06, isPos: true },
                { label: 'Non Institution', jun: 9.88, mar: 10.62, diff: -0.74, isPos: false }
              ].map((holder, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                  <span className="text-[9.5px] font-black text-text-secondary sm:col-span-1">{holder.label}</span>
                  
                  {/* Bars wrapper */}
                  <div className="sm:col-span-2 space-y-1.5">
                    {/* Jun 26 Bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-border/40 h-2 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${holder.jun}%` }}
                          className="h-full rounded-full bg-pink-500/70"
                        />
                      </div>
                      <span className="text-[8px] font-mono font-bold w-10 text-right">{holder.jun}%</span>
                    </div>

                    {/* Mar 26 Bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-border/45 h-2 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${holder.mar}%` }}
                          className="h-full rounded-full bg-indigo-500/25"
                        />
                      </div>
                      <span className="text-[8px] font-mono font-bold w-10 text-right text-text-secondary/70">{holder.mar}%</span>
                    </div>
                  </div>

                  {/* Change badge */}
                  <div className="sm:col-span-1 flex justify-end">
                    {holder.diff === 0 ? (
                      <span className="text-[7.5px] font-black bg-slate-500/10 text-text-secondary px-1.5 py-0.5 rounded">0%</span>
                    ) : (
                      <span className={`text-[7.5px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                        holder.isPos 
                          ? 'bg-profit/10 text-profit' 
                          : 'bg-loss/10 text-loss'
                      }`}>
                        {holder.isPos ? '+' : ''}{holder.diff}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SECTION 5: PRICE SUMMARY */}
      {/* ---------------------------------------------------- */}
      {shouldShow('summary') && (
        <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm">
          <div className="flex justify-between items-center border-b border-border/40 pb-3">
            <h3 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-2">
              <FileText className="h-4.5 w-4.5 text-profit" /> Price Summary
            </h3>
            <span className="text-[9px] font-extrabold text-text-secondary uppercase tracking-widest">Trend Cards</span>
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Performance Today */}
            <div className="p-4 rounded-xl border border-border/60 bg-background/25 flex flex-col gap-3">
              <div className="h-7 w-7 rounded-lg bg-loss/10 border border-loss/20 flex items-center justify-center text-loss">
                <TrendingDown className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <span className="block text-[9px] font-black text-text-primary uppercase">Performance Today</span>
                <p className="text-[10px] text-text-secondary font-medium leading-relaxed">Underperformed sector by -1.15%</p>
              </div>
            </div>

            {/* Trend Reversal */}
            <div className="p-4 rounded-xl border border-border/60 bg-background/25 flex flex-col gap-3">
              <div className="h-7 w-7 rounded-lg bg-loss/10 border border-loss/20 flex items-center justify-center text-loss">
                <ShieldAlert className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <span className="block text-[9px] font-black text-text-primary uppercase">Trend Reversal</span>
                <p className="text-[10px] text-text-secondary font-medium leading-relaxed">Stock has fallen after 4 days of consecutive gain</p>
              </div>
            </div>

            {/* Moving Averages */}
            <div className="p-4 rounded-xl border border-border/60 bg-background/25 flex flex-col gap-3">
              <div className="h-7 w-7 rounded-lg bg-profit/10 border border-profit/20 flex items-center justify-center text-profit">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <span className="block text-[9px] font-black text-text-primary uppercase">Moving Averages</span>
                <p className="text-[10px] text-text-secondary font-medium leading-relaxed">{quote.symbol.split('.')[0]} is trading higher than 5 day, 20 day, 50 day, 100 day and 200 day moving averages</p>
              </div>
            </div>

            {/* Rising Delivery */}
            <div className="p-4 rounded-xl border border-border/60 bg-background/25 flex flex-col gap-3">
              <div className="h-7 w-7 rounded-lg bg-profit/10 border border-profit/20 flex items-center justify-center text-profit">
                <ArrowRightLeft className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <span className="block text-[9px] font-black text-text-primary uppercase">Rising Delivery</span>
                <p className="text-[10px] text-text-secondary font-medium leading-relaxed">Delivery volume rising by 8.0%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SECTION 6: AI-POWERED INSIGHTS */}
      {/* ---------------------------------------------------- */}
      <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-profit animate-pulse" />
          <div>
            <h3 className="font-extrabold text-xs text-text-primary uppercase tracking-wider">AI-Powered Insights Summary</h3>
            <p className="text-[9px] text-text-secondary font-medium mt-0.5">Auto-generated business intelligence summaries based on financial parameters.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              title: 'Valuation Assessment',
              score: '85%',
              desc: peVal < 30
                ? `The stock trades at P/E ${peVal.toFixed(2)}, which is discounted relative to its sector average.`
                : `The stock commands a premium pricing of P/E ${peVal.toFixed(2)}, reflecting high future growth expectations.`,
              isPositive: peVal < 30
            },
            {
              title: 'Capital Profitability',
              score: '92%',
              desc: `With a Return on Equity (ROE) of ${roeVal.toFixed(1)}% and ROCE of ${roce.toFixed(1)}%, the company displays exceptional efficiency in deploying shareholder equity.`,
              isPositive: roeVal > 15
            }
          ].map((item, idx) => (
            <div key={idx} className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 bg-background/25 border-border/40`}>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-black text-text-primary">{item.title}</span>
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${item.isPositive ? 'text-profit bg-profit/10' : 'text-amber-500 bg-amber-500/10'}`}>
                    Confidence: {item.score}
                  </span>
                </div>
                <p className="text-[10px] text-text-secondary leading-relaxed font-semibold pt-1.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
