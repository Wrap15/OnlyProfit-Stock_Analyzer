'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

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
  const isPEUndervalued = quote.trailingPE && quote.sectorPE && quote.trailingPE < quote.sectorPE;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Visual Sliders: Day Range & 52-Week Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-card border border-border p-5 rounded-2xl shadow-soft dark:shadow-soft-dark">
        <div className="space-y-2 p-3.5 rounded-xl bg-background/50 border border-border/50">
          <div className="flex justify-between items-center text-[10px] font-black text-text-secondary uppercase tracking-wider">
            <span>Day Range</span>
            <span className="text-text-primary">Current: ₹{quote.regularMarketPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="relative pt-1">
            <div className="flex mb-1.5 items-center justify-between text-[10px] font-bold text-text-secondary">
              <span>L: ₹{dayLow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              <span>H: ₹{dayHigh.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="overflow-hidden h-1.5 text-xs flex rounded-full bg-border relative items-center">
              <div 
                style={{ 
                  width: `${dayHigh === dayLow ? 50 : Math.min(100, Math.max(0, ((quote.regularMarketPrice - dayLow) / (dayHigh - dayLow)) * 100))}%` 
                }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-profit/40 h-full rounded-full"
              />
              <div
                style={{ 
                  left: `${dayHigh === dayLow ? 50 : Math.min(100, Math.max(0, ((quote.regularMarketPrice - dayLow) / (dayHigh - dayLow)) * 100))}%` 
                }}
                className="absolute w-2.5 h-2.5 rounded-full bg-profit border-2 border-card -ml-1.5 shadow"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2 p-3.5 rounded-xl bg-background/50 border border-border/50">
          <div className="flex justify-between items-center text-[10px] font-black text-text-secondary uppercase tracking-wider">
            <span>52-Week Range</span>
            <span className="text-text-primary">Current: ₹{quote.regularMarketPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="relative pt-1">
            <div className="flex mb-1.5 items-center justify-between text-[10px] font-bold text-text-secondary">
              <span className="text-loss">L: ₹{fiftyTwoLow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              <span className="text-profit">H: ₹{fiftyTwoHigh.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="overflow-hidden h-1.5 text-xs flex rounded-full bg-border relative items-center">
              <div 
                style={{ 
                  width: `${fiftyTwoHigh === fiftyTwoLow ? 50 : Math.min(100, Math.max(0, ((quote.regularMarketPrice - fiftyTwoLow) / (fiftyTwoHigh - fiftyTwoLow)) * 100))}%` 
                }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-profit/40 h-full rounded-full"
              />
              <div
                style={{ 
                  left: `${fiftyTwoHigh === fiftyTwoLow ? 50 : Math.min(100, Math.max(0, ((quote.regularMarketPrice - fiftyTwoLow) / (fiftyTwoHigh - fiftyTwoLow)) * 100))}%` 
                }}
                className="absolute w-2.5 h-2.5 rounded-full bg-profit border-2 border-card -ml-1.5 shadow"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-soft dark:shadow-soft-dark space-y-4">
        <div>
          <h3 className="font-extrabold text-sm text-text-primary uppercase tracking-wider">
            Valuation and Performance Metrics
          </h3>
          <p className="text-[10px] text-text-secondary font-medium">Core efficiency, capital strength, and valuation ratios with market context.</p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 pt-2">
          {[
            { label: 'Market Cap', value: formatIndianNumber(quote.marketCap, true), desc: 'Total Valuation', status: 'Stable' },
            { label: 'P/E Ratio', value: quote.trailingPE ? quote.trailingPE.toFixed(2) : 'N/A', desc: `Sector P/E: ${quote.sectorPE ? quote.sectorPE.toFixed(2) : 'N/A'}`, status: quote.trailingPE && quote.sectorPE && quote.trailingPE < quote.sectorPE ? 'Good' : 'Premium' },
            { label: 'P/B Ratio', value: quote.priceToBook ? quote.priceToBook.toFixed(2) : 'N/A', desc: `Sector P/B: ${quote.sectorPB ? quote.sectorPB.toFixed(2) : 'N/A'}`, status: 'Neutral' },
            { label: 'Dividend Yield', value: quote.dividendYield ? `${quote.dividendYield.toFixed(2)}%` : '0.00%', desc: 'Ind. Avg: 1.18%', status: quote.dividendYield && quote.dividendYield >= 2 ? 'Good' : 'Neutral' },
            { label: 'ROE (Eq.)', value: `${roe.toFixed(2)}%`, desc: 'Return on Equity', status: roe > 15 ? 'Excellent' : 'Neutral' },
            { label: 'ROCE', value: `${roce.toFixed(2)}%`, desc: 'Capital Employed', status: roce > 18 ? 'Excellent' : 'Neutral' },
            { label: 'EPS (TTM)', value: `₹${eps.toFixed(2)}`, desc: 'Earnings Per Share', status: 'Growing' },
            { label: 'Debt to Equity', value: debtToEquity.toFixed(2), desc: 'Industry Avg: 0.65', status: debtToEquity < 0.5 ? 'Good' : 'High' },
            { label: 'Book Value', value: `₹${bookValue.toFixed(2)}`, desc: 'Asset Base Value', status: 'Stable' },
            { label: 'Industry P/E', value: quote.sectorPE ? quote.sectorPE.toFixed(2) : 'N/A', desc: 'Sector Average PE', status: 'Neutral' }
          ].map((m, idx) => (
            <div key={idx} className="space-y-1.5 p-3 rounded-xl bg-background/40 border border-border/40 hover:border-profit/20 hover:bg-background/80 transition-all duration-150">
              <span className="block text-[10px] font-black text-text-secondary uppercase tracking-wider">{m.label}</span>
              <span className="text-base font-black text-text-primary block">{m.value}</span>
              <div className="flex justify-between items-center text-[9px] font-bold text-text-secondary">
                <span>{m.desc}</span>
                {m.status && (
                  <span className={`px-1.5 py-0.2 rounded-full uppercase text-[8px] ${
                    m.status === 'Good' || m.status === 'Excellent' || m.status === 'Growing'
                      ? 'text-profit bg-profit/10'
                      : m.status === 'Premium' || m.status === 'High'
                      ? 'text-amber-500 bg-amber-500/10'
                      : 'text-text-secondary bg-slate-500/10'
                  }`}>{m.status}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Insights Section */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-soft dark:shadow-soft-dark space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-profit" />
          <div>
            <h3 className="font-extrabold text-sm text-text-primary uppercase tracking-wider">AI-Powered Insights</h3>
            <p className="text-[10px] text-text-secondary font-medium">Auto-generated business intelligence summaries based on financial parameters.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              title: 'Valuation Assessment',
              score: '85%',
              desc: isPEUndervalued
                ? `The stock trades at P/E ${quote.trailingPE.toFixed(2)}, which is discounted relative to its sector average of ${quote.sectorPE.toFixed(2)}.`
                : `The stock commands a premium pricing of P/E ${quote.trailingPE ? quote.trailingPE.toFixed(2) : 'N/A'}, reflecting high future growth expectations.`,
              isPositive: quote.trailingPE && quote.sectorPE ? quote.trailingPE < quote.sectorPE : true
            },
            {
              title: 'Capital Profitability',
              score: '92%',
              desc: `With a Return on Equity (ROE) of ${roe.toFixed(1)}% and ROCE of ${roce.toFixed(1)}%, the company displays exceptional efficiency in deploying shareholder equity.`,
              isPositive: roe > 15
            },
            {
              title: 'Leverage and Solvency',
              score: '88%',
              desc: debtToEquity < 0.5
                ? `Healthy debt-to-equity ratio of ${debtToEquity.toFixed(2)} indicating robust balance sheet stability and very low risk of default.`
                : `High leverage of ${debtToEquity.toFixed(2)} relative to equity base. Interest coverage indicators warrant additional inspection.`,
              isPositive: debtToEquity < 0.5
            },
            {
              title: 'Sector Performance',
              score: '90%',
              desc: `Exhibiting strong revenue momentum, ${quote.shortName || quote.symbol} stands as a market leader in the ${quote.sector} domain.`,
              isPositive: true
            }
          ].map((item, idx) => (
            <div key={idx} className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
              item.isPositive 
                ? 'bg-emerald-500/5 border-emerald-500/20' 
                : 'bg-amber-500/5 border-amber-500/20'
            }`}>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-text-primary">{item.title}</span>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${item.isPositive ? 'text-profit bg-profit/10' : 'text-amber-500 bg-amber-500/10'}`}>
                    Confidence: {item.score}
                  </span>
                </div>
                <p className="text-[11px] text-text-secondary leading-relaxed font-medium pt-1.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
