'use client';

import React from 'react';
import { TrendingUp, Scale, AlertTriangle, ShieldCheck, TrendingDown } from 'lucide-react';

interface QuoteData {
  symbol: string;
  shortName: string;
  longName: string;
  trailingPE: number | null;
  sectorPE: number;
  holdings?: {
    promoter: number;
    fii: number;
    dii: number;
    retail: number;
  };
  sector: string;
}

interface FinancialYearData {
  year: string;
  revenue: number;
  ebitda: number;
  netIncome: number;
}

interface StockInsightsProps {
  quote: QuoteData;
  financials: FinancialYearData[];
}

function getVolatilityLabel(symbol: string): string {
  const clean = symbol.split('.')[0].toUpperCase();
  const lowVol = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ITC', 'HINDUNILVR', 'KOTAKBANK', 'SUNPHARMA', 'LT', 'ASIANPAINT'];
  const medVol = ['TATAMOTORS', 'SBIN', 'ICICIBANK', 'AXISBANK', 'BHARTIAIRTEL', 'M&M', 'MARUTI', 'JSWSTEEL', 'TATASTEEL', 'TITAN'];
  if (lowVol.includes(clean)) return 'Low Volatility';
  if (medVol.includes(clean)) return 'Medium Volatility';
  return 'High Volatility';
}

export default function StockInsights({ quote, financials }: StockInsightsProps) {
  // 1. Valuation Analysis
  const pe = quote.trailingPE;
  const sectorPe = quote.sectorPE;
  
  let valuationStatus: 'good' | 'warning' | 'neutral' = 'neutral';
  let valuationTitle = 'Valuation Analysis';
  let valuationDesc = '';
  
  if (pe && sectorPe) {
    const isUndervalued = pe < sectorPe;
    valuationStatus = isUndervalued ? 'good' : 'warning';
    valuationTitle = isUndervalued ? 'Attractive Valuation (Undervalued)' : 'Premium Valuation (Overvalued)';
    valuationDesc = isUndervalued 
      ? `The stock trades at a P/E of ${pe.toFixed(2)}, which is lower than the sector average of ${sectorPe.toFixed(2)}. This represents a relative discount of ${((1 - pe/sectorPe)*100).toFixed(1)}%, indicating a potential value entry opportunity.`
      : `The stock trades at a P/E of ${pe.toFixed(2)}, higher than the sector average of ${sectorPe.toFixed(2)}. This premium valuation suggests investors are pricing in higher growth expectations compared to industry peers.`;
  } else {
    valuationDesc = 'P/E ratio details are not available. This is common for indices, early-stage companies, or those experiencing cyclical earnings transitions. Consider checking Book Value comparisons.';
  }

  // 2. Growth Trends
  let growthStatus: 'good' | 'neutral' | 'warning' = 'neutral';
  let growthTitle = 'Growth Trends';
  let growthDesc = '';
  
  if (financials && financials.length >= 2) {
    const revLast = financials[financials.length - 1].revenue;
    const revPrev = financials[financials.length - 2].revenue;
    const yoyGrowth = ((revLast - revPrev) / revPrev) * 100;
    
    if (yoyGrowth > 10) {
      growthStatus = 'good';
      growthTitle = 'Strong Revenue Growth';
      growthDesc = `Year-over-year revenue grew by ${yoyGrowth.toFixed(2)}% in the latest fiscal cycle. This demonstrates robust underlying business expansion, strong customer demand, and effective execution.`;
    } else if (yoyGrowth > 0) {
      growthStatus = 'neutral';
      growthTitle = 'Stable Revenue Growth';
      growthDesc = `Revenue grew at a moderate rate of ${yoyGrowth.toFixed(2)}% YoY. This is typical of established market leaders who maintain stable market share without massive expansion capital.`;
    } else {
      growthStatus = 'warning';
      growthTitle = 'Revenue Contraction';
      growthDesc = `Revenue decreased by ${Math.abs(yoyGrowth).toFixed(2)}% YoY. This indicates potential headwinds, product-market saturation, or broader macroeconomic/sectoral cyclical downturns.`;
    }
  } else {
    growthDesc = 'Sufficient historical financial statements are not available to compute year-over-year revenue and margin growth metrics.';
  }

  // 3. Risk Indicators
  let riskStatus: 'good' | 'neutral' | 'warning' = 'neutral';
  let riskTitle = 'Risk Profile';
  let riskDesc = '';
  const holdings = quote.holdings;
  const volLabel = getVolatilityLabel(quote.symbol);

  if (holdings) {
    const isRetailHigh = holdings.retail > 30;
    const isPromoterStrong = holdings.promoter > 50;

    if (volLabel === 'High Volatility' || isRetailHigh) {
      riskStatus = 'warning';
      riskTitle = 'Moderate-to-High Risk Profile';
      riskDesc = `This stock exhibits ${volLabel.toLowerCase()} characteristics. Retail holdings stand at ${holdings.retail}%, which is relatively high and can trigger sharp short-term volatility due to market sentiment shifts.`;
    } else if (isPromoterStrong) {
      riskStatus = 'good';
      riskTitle = 'Low Risk Profile';
      riskDesc = `Backed by low daily volatility and strong promoter ownership of ${holdings.promoter}%. High promoter stake aligns corporate management interests with long-term shareholders.`;
    } else {
      riskStatus = 'neutral';
      riskTitle = 'Moderate Risk Profile';
      riskDesc = `Holding patterns are balanced: Promoters own ${holdings.promoter}%, Institutions own ${(holdings.fii + holdings.dii).toFixed(0)}%, and Retail float is at ${holdings.retail}%. Price volatility remains standard.`;
    }
  } else {
    riskDesc = 'Detailed shareholding structures and beta metrics are missing for this ticker. Evaluate broader market liquidity.';
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-extrabold text-base text-text-primary tracking-tight">OnlyProfit Smart Insights</h3>
        <p className="text-[11px] text-text-secondary font-medium mt-1">
          Automated analysis converting raw corporate metrics into readable, color-coded summaries.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Valuation Card */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between h-full transition-all duration-300 hover:shadow-md ${
          valuationStatus === 'good' 
            ? 'bg-emerald-500/5 dark:bg-emerald-950/10 border-emerald-500/20 dark:border-emerald-900/40' 
            : valuationStatus === 'warning'
            ? 'bg-amber-500/5 dark:bg-amber-950/10 border-amber-500/20 dark:border-amber-900/40'
            : 'bg-slate-500/5 dark:bg-slate-950/10 border-slate-500/20 dark:border-slate-900/40'
        }`}>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className={`p-2 rounded-xl border ${
                valuationStatus === 'good'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                  : valuationStatus === 'warning'
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                  : 'bg-slate-500/10 border-slate-500/20 text-slate-500'
              }`}>
                <Scale className="h-4 w-4" />
              </div>
              <h4 className="font-extrabold text-xs text-text-primary">{valuationTitle}</h4>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed font-medium">
              {valuationDesc}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[10px] font-bold text-text-secondary">
            <span>PE: {pe ? pe.toFixed(1) : 'N/A'}</span>
            <span>Sector PE: {sectorPe.toFixed(1)}</span>
          </div>
        </div>

        {/* Growth Card */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between h-full transition-all duration-300 hover:shadow-md ${
          growthStatus === 'good' 
            ? 'bg-emerald-500/5 dark:bg-emerald-950/10 border-emerald-500/20 dark:border-emerald-900/40' 
            : growthStatus === 'warning'
            ? 'bg-rose-500/5 dark:bg-rose-950/10 border-rose-500/20 dark:border-rose-900/40'
            : 'bg-slate-500/5 dark:bg-slate-950/10 border-slate-500/20 dark:border-slate-900/40'
        }`}>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className={`p-2 rounded-xl border ${
                growthStatus === 'good'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                  : growthStatus === 'warning'
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                  : 'bg-slate-500/10 border-slate-500/20 text-slate-500'
              }`}>
                {growthStatus === 'warning' ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
              </div>
              <h4 className="font-extrabold text-xs text-text-primary">{growthTitle}</h4>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed font-medium">
              {growthDesc}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[10px] font-bold text-text-secondary">
            <span>YoY Margin Trend</span>
            <span className={growthStatus === 'good' ? 'text-profit' : growthStatus === 'warning' ? 'text-loss' : ''}>
              {growthStatus === 'good' ? 'Positive' : growthStatus === 'warning' ? 'Negative' : 'Stable'}
            </span>
          </div>
        </div>

        {/* Risk Card */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between h-full transition-all duration-300 hover:shadow-md ${
          riskStatus === 'good' 
            ? 'bg-emerald-500/5 dark:bg-emerald-950/10 border-emerald-500/20 dark:border-emerald-900/40' 
            : riskStatus === 'warning'
            ? 'bg-amber-500/5 dark:bg-amber-950/10 border-amber-500/20 dark:border-amber-900/40'
            : 'bg-slate-500/5 dark:bg-slate-950/10 border-slate-500/20 dark:border-slate-900/40'
        }`}>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className={`p-2 rounded-xl border ${
                riskStatus === 'good'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                  : riskStatus === 'warning'
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                  : 'bg-slate-500/10 border-slate-500/20 text-slate-500'
              }`}>
                {riskStatus === 'good' ? <ShieldCheck className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              </div>
              <h4 className="font-extrabold text-xs text-text-primary">{riskTitle}</h4>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed font-medium">
              {riskDesc}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[10px] font-bold text-text-secondary">
            <span>Volatility</span>
            <span className={riskStatus === 'good' ? 'text-profit' : riskStatus === 'warning' ? 'text-amber-500' : ''}>
              {volLabel}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
