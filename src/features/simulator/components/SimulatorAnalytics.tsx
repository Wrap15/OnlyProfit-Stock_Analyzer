'use client';

import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, ArrowUpDown 
} from 'lucide-react';
import { LARGE_CAP_SYMBOLS, MID_CAP_SYMBOLS } from '@/constants/marketSymbols';

interface HoldingItem {
  symbol: string;
  avgBuyPrice: number;
  quantity: number;
  totalInvested: number;
}

interface HistoryItem {
  symbol: string;
  side: 'BUY' | 'SELL';
  status: string;
  timestamp: string | number;
}

interface SimulatorAnalyticsProps {
  holdings: HoldingItem[];
  livePrices: Record<string, { price: number; change: number; pct: number }>;
  history: HistoryItem[];
}

const symbolToSector: Record<string, string> = {
  // Financial Services
  'HDFCBANK.NS': 'Financial Services',
  'ICICIBANK.NS': 'Financial Services',
  'SBIN.NS': 'Financial Services',
  'KOTAKBANK.NS': 'Financial Services',
  'AXISBANK.NS': 'Financial Services',
  'BAJFINANCE.NS': 'Financial Services',
  'BAJAJFINSV.NS': 'Financial Services',
  'PFC.NS': 'Financial Services',
  'RECLTD.NS': 'Financial Services',
  'MUTHOOTFIN.NS': 'Financial Services',
  'CHOLAFIN.NS': 'Financial Services',
  'SHRIRAMFIN.NS': 'Financial Services',
  'BANDHANBNK.NS': 'Financial Services',
  'IDFCFIRSTB.NS': 'Financial Services',
  'INDUSINDBK.NS': 'Financial Services',
  'PNB.NS': 'Financial Services',
  'BOB.NS': 'Financial Services',
  // IT / Technology
  'TCS.NS': 'Technology',
  'INFY.NS': 'Technology',
  'WIPRO.NS': 'Technology',
  'HCLTECH.NS': 'Technology',
  'TECHM.NS': 'Technology',
  'KPITTECH.NS': 'Technology',
  'TATAELXSI.NS': 'Technology',
  'CYIENT.NS': 'Technology',
  'SONATSOFTW.NS': 'Technology',
  'ZENSARTECH.NS': 'Technology',
  'ASMS.NS': 'Technology',
  // Consumer Staples
  'HINDUNILVR.NS': 'Consumer Staples',
  'ITC.NS': 'Consumer Staples',
  'NESTLEIND.NS': 'Consumer Staples',
  'BRITANNIA.NS': 'Consumer Staples',
  'TATACONSUM.NS': 'Consumer Staples',
  'VBL.NS': 'Consumer Staples',
  'RENUKA.NS': 'Sugar & FMCG',
  // Automobile
  'MARUTI.NS': 'Automobile',
  'M&M.NS': 'Automobile',
  'EICHERMOT.NS': 'Automobile',
  'HEROMOTOCO.NS': 'Automobile',
  'BAJAJ-AUTO.NS': 'Automobile',
  // Consumer Discretionary
  'TITAN.NS': 'Consumer Discretionary',
  'TRENT.NS': 'Consumer Discretionary',
  'DMART.NS': 'Consumer Discretionary',
  'BATAINDIA.NS': 'Consumer Discretionary',
  // Energy & Oil
  'RELIANCE.NS': 'Energy & Utilities',
  'ONGC.NS': 'Energy & Utilities',
  'IOC.NS': 'Energy & Utilities',
  'BPCL.NS': 'Energy & Utilities',
  'COALINDIA.NS': 'Energy & Utilities',
  'TATAPOWER.NS': 'Energy & Utilities',
  'NTPC.NS': 'Energy & Utilities',
  'POWERGRID.NS': 'Energy & Utilities',
  // Infrastructure & Capital Goods
  'LT.NS': 'Capital Goods',
  'RVNL.NS': 'Infrastructure',
  'BHEL.NS': 'Electric Equipment',
  'IRCTC.NS': 'Services',
  'IRFC.NS': 'Financial Services',
  'BEL.NS': 'Defense & Capital Goods',
  'HAL.NS': 'Defense & Capital Goods',
  'SUZLON.NS': 'Renewable Energy',
  // Materials & Mining
  'TATASTEEL.NS': 'Metals & Mining',
  'JSWSTEEL.NS': 'Metals & Mining',
  'HINDALCO.NS': 'Metals & Mining',
  'GRASIM.NS': 'Materials',
  'ULTRACEMCO.NS': 'Materials',
  'ASIANPAINT.NS': 'Materials',
  'PIDILITIND.NS': 'Materials',
  // Healthcare
  'SUNPHARMA.NS': 'Healthcare',
  'CIPLA.NS': 'Healthcare',
  'DIVISLAB.NS': 'Healthcare',
  'APOLLOHOSP.NS': 'Healthcare',
};

export default function SimulatorAnalytics({
  holdings,
  livePrices,
  history,
}: SimulatorAnalyticsProps) {
  const [viewMode, setViewMode] = useState<'sector' | 'marketCap'>('marketCap');
  const [driverMode, setDriverMode] = useState<'gainers' | 'losers'>('gainers');

  // Classification utility helpers
  const getMarketCapCategory = (symbol: string): 'LargeCap' | 'MidCap' | 'SmallCap' => {
    if (LARGE_CAP_SYMBOLS.includes(symbol)) return 'LargeCap';
    if (MID_CAP_SYMBOLS.includes(symbol)) return 'MidCap';
    return 'SmallCap';
  };

  const getSector = (symbol: string): string => {
    return symbolToSector[symbol] || 'Other Sectors';
  };

  // Group portfolio assets dynamically
  const allocationData = useMemo(() => {
    let totalCurrentValue = 0;
    const groups: Record<string, { key: string; invested: number; current: number }> = {};

    holdings.forEach(h => {
      const quote = livePrices[h.symbol];
      const ltp = quote ? quote.price : h.avgBuyPrice;
      const currentVal = ltp * h.quantity;
      totalCurrentValue += currentVal;

      const key = viewMode === 'marketCap' ? getMarketCapCategory(h.symbol) : getSector(h.symbol);

      if (!groups[key]) {
        groups[key] = { key, invested: 0, current: 0 };
      }
      groups[key].invested += h.totalInvested;
      groups[key].current += currentVal;
    });

    const list = Object.values(groups).map(g => {
      const weight = totalCurrentValue > 0 ? (g.current / totalCurrentValue) * 100 : 0;
      const pnl = g.current - g.invested;
      const returnsPct = g.invested > 0 ? (pnl / g.invested) * 100 : 0;

      return {
        key: g.key,
        invested: g.invested,
        current: g.current,
        weight,
        pnl,
        returnsPct
      };
    });

    // Sort by weight descending
    return {
      list: list.sort((a, b) => b.weight - a.weight),
      totalCurrentValue
    };
  }, [holdings, livePrices, viewMode]);

  // Color assignments for categories
  const categoryColors = useMemo(() => {
    if (viewMode === 'marketCap') {
      return {
        'LargeCap': '#ef4444', // Red-orange
        'SmallCap': '#f97316', // Orange
        'MidCap': '#eab308'    // Yellow
      } as Record<string, string>;
    } else {
      return {
        'Financial Services': '#5b21b6', // Indigo
        'Technology': '#8b5cf6',         // Purple
        'Consumer Staples': '#d946ef',    // Magenta
        'Automobile': '#ec4899',          // Rose
        'Energy & Utilities': '#3b82f6',  // Blue
        'Capital Goods': '#06b6d4',       // Cyan
        'Metals & Mining': '#14b8a6',     // Teal
        'Healthcare': '#10b981',         // Green
        'Electric Equipment': '#a855f7',  // Light purple
        'Renewable Energy': '#f43f5e',    // Pinkish-red
        'Infrastructure': '#6366f1',     // Royal Blue
        'Services': '#f59e0b',            // Amber
        'Materials': '#64748b',           // Slate
        'Other Sectors': '#4b5563'        // Gray
      } as Record<string, string>;
    }
  }, [viewMode]);

  // Determine top driving holdings based on return metrics
  const topDrivers = useMemo(() => {
    const drivers = holdings.map(h => {
      const quote = livePrices[h.symbol];
      const ltp = quote ? quote.price : h.avgBuyPrice;
      const changePct = quote ? quote.pct : 0;
      const currentValue = ltp * h.quantity;
      const pnl = currentValue - h.totalInvested;
      const returnsPct = h.totalInvested > 0 ? (pnl / h.totalInvested) * 100 : 0;

      const lastBuyOrder = history.find(hist => hist.symbol === h.symbol && hist.side === 'BUY');
      const isBoughtToday = lastBuyOrder && new Date(lastBuyOrder.timestamp).toDateString() === new Date().toDateString();
      const dayPnL = isBoughtToday ? (ltp - h.avgBuyPrice) * h.quantity : (quote ? quote.change : 0) * h.quantity;
      const dayPnLPct = isBoughtToday ? (h.avgBuyPrice > 0 ? ((ltp - h.avgBuyPrice) / h.avgBuyPrice) * 100 : 0) : changePct;

      const high52w = (quote as any)?.fiftyTwoWeekHigh || (ltp * 1.15);

      return {
        symbol: h.symbol.replace('.NS', '').replace('MF_', ''),
        invested: h.totalInvested,
        current: currentValue,
        overallPnL: pnl,
        overallPnLPct: returnsPct,
        dayPnL,
        dayPnLPct,
        ltp,
        high52w
      };
    });

    // Sort accordingly
    if (driverMode === 'gainers') {
      return drivers.sort((a, b) => b.dayPnLPct - a.dayPnLPct).slice(0, 3);
    } else {
      return drivers.sort((a, b) => a.dayPnLPct - b.dayPnLPct).slice(0, 3);
    }
  }, [holdings, livePrices, history, driverMode]);

  // Find max category value to normalize returns horizontal bars properly
  const maxCategoryValue = useMemo(() => {
    if (allocationData.list.length === 0) return 1;
    return Math.max(...allocationData.list.map(d => Math.max(d.current, d.invested)));
  }, [allocationData]);

  if (holdings.length === 0) return null;

  return (
    <div className="bg-[#12131a]/85 border border-border/80 rounded-2xl p-5 md:p-6 shadow-premium backdrop-blur-md space-y-6 animate-fade-in select-none">
      
      {/* Portfolio Allocation Header & Toggles */}
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <h2 className="text-xs font-black uppercase tracking-wider text-text-primary">
          Portfolio Allocation
        </h2>

        {/* View togglers matching the reference layout */}
        <div className="flex items-center gap-1 bg-background border border-border p-0.5 rounded-xl">
          <button
            onClick={() => setViewMode('sector')}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              viewMode === 'sector'
                ? 'bg-card text-indigo-400 font-extrabold shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            View as Sector
          </button>
          <button
            onClick={() => setViewMode('marketCap')}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              viewMode === 'marketCap'
                ? 'bg-card text-indigo-400 font-extrabold shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            View as Market Cap
          </button>
        </div>
      </div>

      {/* 1. Allocation Segmented Horizontal Bar Chart (replica of the reference screenshot) */}
      <div className="w-full">
        <div className="w-full h-8 bg-card/45 border border-border/60 rounded-xl overflow-hidden flex">
          {allocationData.list.map((segment, idx) => {
            if (segment.weight < 1) return null; // skip negligible values
            const bgColor = categoryColors[segment.key] || '#64748b';
            
            return (
              <div
                key={idx}
                style={{ 
                  width: `${segment.weight}%`, 
                  backgroundColor: bgColor 
                }}
                className="h-full flex items-center px-2 min-w-max transition-all duration-300 relative group"
                title={`${segment.key}: ${segment.weight.toFixed(1)}%`}
              >
                <div className="bg-black/60 text-white text-[8px] font-black px-1.5 py-0.5 rounded border border-white/5 truncate max-w-full select-none">
                  {segment.weight.toFixed(1)}% {segment.key}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Grid breakdown: Returns Double Bars vs Top Drivers list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
        
        {/* Left Column: Returns Double Bar Chart */}
        <div className="space-y-4">
          <div>
            <h3 className="text-[11px] font-black text-text-primary uppercase tracking-wider">
              {viewMode === 'marketCap' ? 'All Market Cap Returns' : 'All Sector Returns'}
            </h3>
            <p className="text-[9px] text-text-secondary font-semibold mt-0.5">
              {viewMode === 'marketCap' ? 'Check out your returns by market cap' : 'Which sectors are giving you the best returns'}
            </p>
          </div>

          {/* Legend indicators */}
          <div className="flex items-center gap-4 text-[9px] font-black uppercase text-text-secondary">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-indigo-500/80 rounded" />
              <span>Current Value</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-indigo-500/25 rounded border border-indigo-500/10" />
              <span>Investment Amount</span>
            </div>
          </div>

          {/* Double Bar charts list */}
          <div className="space-y-4 pt-2">
            {allocationData.list.map((category, idx) => {
              const primaryColor = categoryColors[category.key] || '#64748b';
              const currentPercent = (category.current / maxCategoryValue) * 100;
              const investedPercent = (category.invested / maxCategoryValue) * 100;

              const isProfit = category.pnl >= 0;

              return (
                <div key={idx} className="flex items-center gap-4">
                  {/* Bars group */}
                  <div className="flex-1 flex flex-col gap-1">
                    {/* Current Value bar */}
                    <div className="w-full bg-card/20 h-2 rounded overflow-hidden">
                      <div 
                        style={{ width: `${currentPercent}%`, backgroundColor: primaryColor }} 
                        className="h-full rounded transition-all duration-300"
                      />
                    </div>
                    {/* Invested Value bar */}
                    <div className="w-full bg-card/20 h-2 rounded overflow-hidden">
                      <div 
                        style={{ width: `${investedPercent}%`, backgroundColor: primaryColor, opacity: 0.35 }} 
                        className="h-full rounded transition-all duration-300"
                      />
                    </div>
                  </div>

                  {/* Return label badge on the right */}
                  <div className="w-40 shrink-0 text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-card/45 border border-border/80 rounded-xl text-[9px] font-black uppercase tracking-wider">
                      <span className="text-text-secondary lowercase">{category.key}</span>
                      <span className={isProfit ? 'text-profit' : 'text-loss'}>
                        {isProfit ? '+' : ''}{category.returnsPct.toFixed(2)}%
                      </span>
                      {isProfit ? (
                        <TrendingUp className="h-3 w-3 text-profit" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-loss" />
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Top Drivers List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-[11px] font-black text-text-primary uppercase tracking-wider">
                Top Drivers
              </h3>
              <p className="text-[9px] text-text-secondary font-semibold">
                Which stocks are giving you the best and worst returns
              </p>
            </div>

            {/* Drivers toggle pills */}
            <div className="flex items-center gap-1 bg-background border border-border p-0.5 rounded-lg">
              <button
                onClick={() => setDriverMode('gainers')}
                className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest cursor-pointer ${
                  driverMode === 'gainers'
                    ? 'bg-card text-profit font-extrabold shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Top Gainers
              </button>
              <button
                onClick={() => setDriverMode('losers')}
                className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest cursor-pointer ${
                  driverMode === 'losers'
                    ? 'bg-card text-loss font-extrabold shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Top Losers
              </button>
            </div>
          </div>

          {/* Drivers List table replica */}
          <div className="border border-border/80 rounded-xl overflow-hidden bg-card/10 select-none">
            <table className="w-full text-left border-collapse text-[9px] font-bold uppercase tracking-wider">
              <thead>
                <tr className="border-b border-border/40 text-text-secondary text-[8px] font-black select-none">
                  <th className="p-3">Stock</th>
                  <th className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span>52 W/H</span>
                      <ArrowUpDown className="h-2.5 w-2.5" />
                    </div>
                  </th>
                  <th className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span>LTP</span>
                      <ArrowUpDown className="h-2.5 w-2.5" />
                    </div>
                  </th>
                  <th className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span>Day&apos;s Gain</span>
                      <ArrowUpDown className="h-2.5 w-2.5" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {topDrivers.map((item, idx) => {
                  const isPositive = item.dayPnLPct >= 0;
                  return (
                    <tr key={idx} className="border-b border-border/40 hover:bg-card/25 transition-all text-[9.5px]">
                      <td className="p-3 font-extrabold text-text-primary">{item.symbol}</td>
                      <td className="p-3 text-right text-text-secondary font-mono">{item.high52w.toFixed(2)}</td>
                      <td className="p-3 text-right text-text-primary font-mono">{item.ltp.toFixed(2)}</td>
                      <td className={`p-3 text-right font-mono font-black ${isPositive ? 'text-profit' : 'text-loss'}`}>
                        {isPositive ? '+' : ''}{item.dayPnLPct.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
