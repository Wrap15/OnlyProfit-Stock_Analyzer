'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Cpu, Sparkles, Clock, Zap, ChevronRight, Activity, Shield } from 'lucide-react';
import { useStockStore } from '@/store/useStockStore';
import StockLogo from './StockLogo';
import MiniSparkline from './MiniSparkline';
import FirebaseAuthModal from './FirebaseAuthModal';
import { MUTUAL_FUNDS } from '@/lib/mutualfunds';
import { isIndianMarketOpen } from '@/lib/marketHours';

interface SignalItem {
  symbol: string;
  name: string;
  indicator: string;
  signal: 'BUY' | 'STRONG_BUY' | 'SELL' | 'STRONG_SELL';
  confidence: number;
  defaultPrice: number;
  targetPrice: number;
  stopLoss: number;
  riskReward: string;
  time: string;
}

// Entire pool of 24 assets (16 Stocks, 8 Mutual Funds) divided across 3 market time blocks
const ALL_SIGNALS_POOL: SignalItem[] = [
  // Block 0: 9:15 AM to 11:15 AM (5 Stocks, 3 Mutual Funds)
  {
    symbol: 'RELIANCE.NS',
    name: 'Reliance Industries',
    indicator: 'MACD Bullish Crossover',
    signal: 'STRONG_BUY',
    confidence: 94,
    defaultPrice: 2950.45,
    targetPrice: 3180.00,
    stopLoss: 2840.00,
    riskReward: '1:2.1',
    time: '9:15 AM'
  },
  {
    symbol: '122639', // PPFAS
    name: 'Parag Parikh Flexi Cap Fund',
    indicator: 'NAV Breakout (50 EMA)',
    signal: 'STRONG_BUY',
    confidence: 92,
    defaultPrice: 88.54,
    targetPrice: 94.20,
    stopLoss: 86.10,
    riskReward: '1:2.3',
    time: '9:18 AM'
  },
  {
    symbol: 'TCS.NS',
    name: 'Tata Consultancy Services',
    indicator: 'RSI Oversold Breakout',
    signal: 'BUY',
    confidence: 87,
    defaultPrice: 4120.20,
    targetPrice: 4420.00,
    stopLoss: 3980.00,
    riskReward: '1:2.3',
    time: '9:25 AM'
  },
  {
    symbol: '118778', // Nippon India
    name: 'Nippon India Small Cap Fund',
    indicator: 'Volume Breakout Trigger',
    signal: 'BUY',
    confidence: 85,
    defaultPrice: 192.24,
    targetPrice: 215.00,
    stopLoss: 184.00,
    riskReward: '1:2.5',
    time: '9:30 AM'
  },
  {
    symbol: 'HDFCBANK.NS',
    name: 'HDFC Bank Limited',
    indicator: 'Golden Cross (50/200 SMA)',
    signal: 'STRONG_BUY',
    confidence: 91,
    defaultPrice: 1620.10,
    targetPrice: 1790.00,
    stopLoss: 1540.00,
    riskReward: '1:2.4',
    time: '9:45 AM'
  },
  {
    symbol: '120334', // ICICI Pru
    name: 'ICICI Pru Multi Asset Fund',
    indicator: 'Asset Allocation Rebalance',
    signal: 'SELL',
    confidence: 81,
    defaultPrice: 869.37,
    targetPrice: 820.00,
    stopLoss: 890.00,
    riskReward: '1:1.8',
    time: '9:50 AM'
  },
  {
    symbol: 'INFY.NS',
    name: 'Infosys Limited',
    indicator: 'EMA Bearish Breakdown',
    signal: 'STRONG_SELL',
    confidence: 89,
    defaultPrice: 1440.50,
    targetPrice: 1310.00,
    stopLoss: 1510.00,
    riskReward: '1:2.2',
    time: '10:05 AM'
  },
  {
    symbol: 'SBIN.NS',
    name: 'State Bank of India',
    indicator: 'RSI Overbought Fatigue',
    signal: 'SELL',
    confidence: 82,
    defaultPrice: 840.15,
    targetPrice: 785.00,
    stopLoss: 870.00,
    riskReward: '1:1.9',
    time: '10:12 AM'
  },

  // Block 1: 11:15 AM to 1:15 PM (5 Stocks, 3 Mutual Funds)
  {
    symbol: 'BHARTIARTL.NS',
    name: 'Bharti Airtel Limited',
    indicator: 'Trendline Breakout Support',
    signal: 'STRONG_BUY',
    confidence: 93,
    defaultPrice: 1420.40,
    targetPrice: 1550.00,
    stopLoss: 1360.00,
    riskReward: '1:2.2',
    time: '11:15 AM'
  },
  {
    symbol: '125497', // SBI Small Cap Fund
    name: 'SBI Small Cap Fund',
    indicator: 'Weekly NAV Breakout',
    signal: 'BUY',
    confidence: 88,
    defaultPrice: 193.44,
    targetPrice: 212.00,
    stopLoss: 186.00,
    riskReward: '1:2.4',
    time: '11:20 AM'
  },
  {
    symbol: 'ICICIBANK.NS',
    name: 'ICICI Bank Limited',
    indicator: 'Fibonacci Retracement 61.8%',
    signal: 'BUY',
    confidence: 86,
    defaultPrice: 1110.15,
    targetPrice: 1220.00,
    stopLoss: 1060.00,
    riskReward: '1:2.2',
    time: '11:30 AM'
  },
  {
    symbol: '120843', // Quant Flexi Cap Fund
    name: 'Quant Flexi Cap Fund',
    indicator: 'Momentum Scan Trigger',
    signal: 'STRONG_BUY',
    confidence: 95,
    defaultPrice: 117.88,
    targetPrice: 130.00,
    stopLoss: 112.50,
    riskReward: '1:2.3',
    time: '11:45 AM'
  },
  {
    symbol: 'LT.NS',
    name: 'Larsen & Toubro Limited',
    indicator: 'Volume Trend Reversal',
    signal: 'STRONG_BUY',
    confidence: 90,
    defaultPrice: 3540.20,
    targetPrice: 3820.00,
    stopLoss: 3410.00,
    riskReward: '1:2.1',
    time: '12:05 PM'
  },
  {
    symbol: '118955', // HDFC Flexi Cap
    name: 'HDFC Flexi Cap Fund',
    indicator: 'Asset Allocation Shift',
    signal: 'SELL',
    confidence: 83,
    defaultPrice: 2118.33,
    targetPrice: 2020.00,
    stopLoss: 2170.00,
    riskReward: '1:1.9',
    time: '12:20 PM'
  },
  {
    symbol: 'WIPRO.NS',
    name: 'Wipro Limited',
    indicator: 'Bollinger Band Contraction',
    signal: 'SELL',
    confidence: 84,
    defaultPrice: 480.10,
    targetPrice: 440.00,
    stopLoss: 505.00,
    riskReward: '1:1.6',
    time: '12:35 PM'
  },
  {
    symbol: 'KOTAKBANK.NS',
    name: 'Kotak Mahindra Bank',
    indicator: 'EMA Bearish Crossover',
    signal: 'STRONG_SELL',
    confidence: 87,
    defaultPrice: 1720.50,
    targetPrice: 1580.00,
    stopLoss: 1795.00,
    riskReward: '1:2.1',
    time: '1:05 PM'
  },

  // Block 2: 1:15 PM to 3:30 PM (5 Stocks, 3 Mutual Funds)
  {
    symbol: 'MARUTI.NS',
    name: 'Maruti Suzuki India',
    indicator: 'Symmetrical Triangle Breakout',
    signal: 'STRONG_BUY',
    confidence: 92,
    defaultPrice: 12100.40,
    targetPrice: 13200.00,
    stopLoss: 11600.00,
    riskReward: '1:2.2',
    time: '1:15 PM'
  },
  {
    symbol: '130503', // HDFC Small Cap
    name: 'HDFC Small Cap Fund',
    indicator: 'High Growth Momentum',
    signal: 'BUY',
    confidence: 89,
    defaultPrice: 151.48,
    targetPrice: 168.00,
    stopLoss: 145.00,
    riskReward: '1:2.5',
    time: '1:25 PM'
  },
  {
    symbol: 'ITC.NS',
    name: 'ITC Limited',
    indicator: 'Double Bottom Support',
    signal: 'BUY',
    confidence: 85,
    defaultPrice: 430.25,
    targetPrice: 475.00,
    stopLoss: 412.00,
    riskReward: '1:2.5',
    time: '1:45 PM'
  },
  {
    symbol: '120823', // Quant Active Fund
    name: 'Quant Active Fund',
    indicator: 'Alpha Outperformance Breakout',
    signal: 'STRONG_BUY',
    confidence: 94,
    defaultPrice: 693.82,
    targetPrice: 755.00,
    stopLoss: 668.00,
    riskReward: '1:2.3',
    time: '2:05 PM'
  },
  {
    symbol: 'AXISBANK.NS',
    name: 'Axis Bank Limited',
    indicator: 'MACD Bullish Crossover',
    signal: 'STRONG_BUY',
    confidence: 90,
    defaultPrice: 1120.30,
    targetPrice: 1240.00,
    stopLoss: 1070.00,
    riskReward: '1:2.4',
    time: '2:20 PM'
  },
  {
    symbol: '120716', // UTI Nifty Index Fund
    name: 'UTI Nifty 50 Index Fund',
    indicator: 'Tracking Error Minimized',
    signal: 'BUY',
    confidence: 82,
    defaultPrice: 162.61,
    targetPrice: 174.00,
    stopLoss: 158.00,
    riskReward: '1:1.9',
    time: '2:35 PM'
  },
  {
    symbol: 'HCLTECH.NS',
    name: 'HCL Technologies Limited',
    indicator: 'RSI Bearish Breakdown',
    signal: 'SELL',
    confidence: 86,
    defaultPrice: 1350.20,
    targetPrice: 1240.00,
    stopLoss: 1410.00,
    riskReward: '1:1.8',
    time: '2:50 PM'
  },
  {
    symbol: 'TATASTEEL.NS',
    name: 'Tata Steel Limited',
    indicator: 'MACD Bearish Crossover',
    signal: 'STRONG_SELL',
    confidence: 88,
    defaultPrice: 165.10,
    targetPrice: 148.00,
    stopLoss: 174.00,
    riskReward: '1:1.9',
    time: '3:05 PM'
  }
];

export default function AISignalsWidget() {
  const router = useRouter();
  const { userId } = useStockStore();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [signals, setSignals] = useState<SignalItem[]>([]);
  const [quotes, setQuotes] = useState<Record<string, { price: number; changePercent: number }>>({});

  // Helper: Get active block index based on IST time
  const getActiveBlockIndex = useCallback((): number => {
    const now = new Date();
    // Convert to Indian Time (IST)
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const parts = formatter.formatToParts(now);
    const hourStr = parts.find(p => p.type === 'hour')?.value || '12';
    const minuteStr = parts.find(p => p.type === 'minute')?.value || '00';
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    const timeInMinutes = hour * 60 + minute;

    const marketOpenMinutes = 9 * 60 + 15;   // 9:15 AM IST (555)
    const marketCloseMinutes = 15 * 60 + 30; // 3:30 PM IST (930)

    // Before or after market hours: freeze on the final block (Block 2)
    if (timeInMinutes < marketOpenMinutes || timeInMinutes > marketCloseMinutes) {
      return 2;
    }

    const elapsed = timeInMinutes - marketOpenMinutes;
    // Split 6 hours 15 mins of market hours into three 2-hour blocks (0, 1, or 2)
    return Math.min(2, Math.floor(elapsed / 120));
  }, []);

  // Sync signals list block index based on time
  useEffect(() => {
    const updateActiveSignals = () => {
      const idx = getActiveBlockIndex();
      const subset = ALL_SIGNALS_POOL.slice(idx * 8, (idx * 8) + 8);
      setSignals(subset);
    };

    updateActiveSignals();
    const interval = setInterval(updateActiveSignals, 10000); // verify block bounds every 10s
    return () => clearInterval(interval);
  }, [getActiveBlockIndex]);

  // Fetch Live Quotes for component stocks (only when market is open)
  useEffect(() => {
    if (signals.length === 0) return;
    const stockSymbols = signals.filter(s => s.symbol.includes('.NS')).map(s => s.symbol);
    
    const fetchQuotes = async () => {
      // Do not run background fetches when market is closed
      if (!isIndianMarketOpen()) return;

      try {
        const res = await fetch(`/api/stock/quote?symbols=${stockSymbols.join(',')}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          const mapped: Record<string, { price: number; changePercent: number }> = {};
          data.forEach((item: any) => {
            mapped[item.symbol] = {
              price: item.regularMarketPrice || 0,
              changePercent: item.regularMarketChangePercent || 0
            };
          });
          setQuotes(mapped);
        }
      } catch (err) {
        console.error('Failed to fetch AI widget stock quotes', err);
      }
    };

    fetchQuotes();
    const interval = setInterval(fetchQuotes, 12000); // refresh every 12 seconds
    return () => clearInterval(interval);
  }, [signals]);

  const getStockQuote = useCallback((symbol: string, defaultPrice: number) => {
    if (quotes[symbol]) return quotes[symbol];
    return { price: defaultPrice, changePercent: 0.0 };
  }, [quotes]);

  // Simulate Mutual Fund NAV Live price ticks (only when market is open)
  const getMutualFundNAV = useCallback((code: string) => {
    const fund = MUTUAL_FUNDS.find(f => f.code === code);
    if (!fund) return { price: 100, changePercent: 0 };
    const seed = parseInt(code) || 100;
    const isMarketActive = isIndianMarketOpen();
    const variation = isMarketActive 
      ? Math.sin(Date.now() / 20000 + seed) * 0.3 // fluctuating value
      : Math.sin(seed) * 0.3; // static value if closed
    const price = fund.baseNav * (1 + variation / 100);
    return { price, changePercent: variation };
  }, []);

  // Generate deterministic mini sparkline for signals
  const getSignalSparkline = useCallback((symbol: string): number[] => {
    const seed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const points = [];
    let base = 100;
    for (let i = 0; i < 7; i++) {
      base += Math.sin(seed + i) * 3;
      points.push(parseFloat(base.toFixed(2)));
    }
    return points;
  }, []);

  const getSignalBadge = (signal: SignalItem['signal']) => {
    switch (signal) {
      case 'STRONG_BUY':
        return 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400';
      case 'BUY':
        return 'bg-teal-500/10 border-teal-500/25 text-teal-600 dark:text-teal-400';
      case 'STRONG_SELL':
        return 'bg-rose-500/10 border-rose-500/25 text-rose-600 dark:text-rose-400';
      case 'SELL':
        return 'bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400';
    }
  };

  const getSignalColorClass = (signal: SignalItem['signal']) => {
    if (signal.includes('BUY')) return 'bg-emerald-500';
    if (signal === 'SELL') return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getSignalLabel = (signal: SignalItem['signal']) => {
    return signal.replace('_', ' ');
  };

  const isMarketActive = isIndianMarketOpen();

  return (
    <div className="space-y-4">
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
            <Cpu className="h-4.5 w-4.5" />
          </span>
          <h2 className="text-xl font-black text-text-primary tracking-tight flex items-center gap-2">
            AI Intelligence & Technical Signals
            <span className="inline-flex items-center gap-0.5 text-[9px] font-black bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 px-2 py-0.5 rounded-md border border-amber-400/20 shadow-sm shadow-amber-500/10 uppercase select-none">
              <Zap className="h-2.5 w-2.5 fill-current" />
              Pro
            </span>
          </h2>
        </div>
        
        {/* Radar live scanner animation & Market Status */}
        <div className="flex items-center gap-4 text-[10px] font-bold text-text-secondary">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/40 border border-border/40 rounded-full px-2.5 py-1">
            <span className="relative flex h-2 w-2">
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isMarketActive ? 'animate-ping bg-emerald-400' : 'animate-pulse bg-amber-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                isMarketActive ? 'bg-emerald-500' : 'bg-amber-500'
              }`}></span>
            </span>
            <span className="text-[9px] uppercase tracking-wider text-text-primary">
              {isMarketActive ? 'AI Agent Scanning Active' : 'Market Closed - Scans Paused'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{isMarketActive ? 'Updates Live' : 'Next Scan 09:15 AM'}</span>
          </div>
        </div>
      </div>

      {/* Signals Body Workspace */}
      <div className="relative rounded-3xl border border-border bg-card overflow-hidden shadow-soft dark:shadow-soft-dark min-h-[320px] flex flex-col">
        
        {/* Desktop Grid Columns Header (Hidden on Mobile) */}
        <div className={`hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-border/40 bg-slate-50/40 dark:bg-slate-800/15 text-[10px] font-bold uppercase tracking-wider text-text-secondary select-none ${
          !userId ? 'blur-[1.5px] pointer-events-none' : ''
        }`}>
          <div className="col-span-3">Asset</div>
          <div className="col-span-3">Technical Breakout Indicator</div>
          <div className="col-span-2">Simulated Live Price</div>
          <div className="col-span-2 text-center">AI Signal & Confidence</div>
          <div className="col-span-1.5 text-right pl-2">R:R Ratio</div>
          <div className="col-span-0.5"></div>
        </div>

        {/* Signals List Layout */}
        <div className={`flex-1 divide-y divide-border/30 transition-all duration-300 ${
          !userId ? 'blur-sm select-none pointer-events-none' : ''
        }`}>
          {signals.map((item) => {
            const isMf = /^\d+$/.test(item.symbol);
            const quote = isMf 
              ? getMutualFundNAV(item.symbol)
              : getStockQuote(item.symbol, item.defaultPrice);
            const sparkPoints = getSignalSparkline(item.symbol);
            const isPositive = quote.changePercent >= 0 || item.signal.includes('BUY');
            
            return (
              <div 
                key={item.symbol} 
                onClick={() => {
                  if (!userId) return;
                  if (isMf) {
                    router.push(`/mutualfund/${item.symbol}`);
                  } else {
                    router.push(`/stock/${item.symbol}`);
                  }
                }}
                className="w-full"
              >
                {/* 1. DESKTOP ROW LAYOUT (Hidden on mobile, md:grid) */}
                <div className="hidden md:grid grid-cols-12 gap-4 items-center px-6 py-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 active:scale-[0.995] transition-all duration-200 cursor-pointer group">
                  {/* Asset Info */}
                  <div className="col-span-3 flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-background border border-border shrink-0 select-none">
                      {isMf ? (
                        <Shield className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <StockLogo symbol={item.symbol} size="sm" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-sm text-text-primary group-hover:text-profit transition-colors truncate">
                        {item.symbol.split('.')[0]}
                      </div>
                      <div className="text-[10px] text-text-secondary font-semibold truncate">
                        {item.name}
                      </div>
                    </div>
                  </div>

                  {/* Technical Trigger Info */}
                  <div className="col-span-3 flex items-center justify-start gap-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary/95 select-none">
                      <Activity className="h-3.5 w-3.5 text-profit" />
                      {item.indicator}
                    </div>
                  </div>

                  {/* Live Price */}
                  <div className="col-span-2 flex items-center justify-start gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-text-primary tabular-nums">
                        ₹{quote.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                      <span className={`text-[9px] font-black tabular-nums ${isPositive ? 'text-profit' : 'text-loss'}`}>
                        {isPositive ? '▲' : '▼'}{quote.changePercent !== 0 ? `${isPositive ? '+' : ''}${quote.changePercent.toFixed(2)}%` : '0.00%'}
                      </span>
                    </div>
                  </div>

                  {/* AI Signal & Confidence */}
                  <div className="col-span-2 flex items-center justify-center">
                    <div className="flex flex-col items-center">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border tracking-wider uppercase select-none ${getSignalBadge(item.signal)}`}>
                        {getSignalLabel(item.signal)}
                      </span>
                      
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-[9px] text-text-secondary font-bold font-mono select-none">{item.confidence}% Conf</span>
                        <div className="w-16 bg-slate-100 dark:bg-slate-800/80 h-1 rounded-full overflow-hidden hidden md:block">
                          <div 
                            className={`h-full rounded-full ${getSignalColorClass(item.signal)}`} 
                            style={{ width: `${item.confidence}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Risk-Reward */}
                  <div className="col-span-1.5 flex items-center justify-end">
                    <div className="text-right">
                      <span className="block text-xs font-bold text-text-primary select-none font-mono">{item.riskReward}</span>
                      <span className="block text-[8px] font-bold text-text-secondary uppercase tracking-widest mt-0.5">T: ₹{item.targetPrice}</span>
                    </div>
                  </div>

                  {/* Sparkline & Arrow */}
                  <div className="col-span-0.5 flex justify-end">
                    <div className="h-5 w-10 opacity-70 hidden lg:block shrink-0 select-none">
                      <MiniSparkline data={sparkPoints} isPositive={isPositive} width={40} height={16} />
                    </div>
                    <ChevronRight className="h-4 w-4 text-text-secondary group-hover:text-profit group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                  </div>
                </div>

                {/* 2. MOBILE CARD LAYOUT (Hidden on desktop, md:hidden) */}
                <div className="md:hidden flex flex-col p-4.5 gap-3 bg-card border-b border-border/20 hover:bg-slate-500/5 active:scale-[0.99] transition-all duration-200 cursor-pointer">
                  {/* Top card row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-background border border-border shrink-0 select-none">
                        {isMf ? (
                          <Shield className="h-4.5 w-4.5 text-emerald-500" />
                        ) : (
                          <StockLogo symbol={item.symbol} size="xs" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="font-extrabold text-xs text-text-primary block truncate">
                          {item.symbol.split('.')[0]}
                        </span>
                        <span className="text-[10px] text-text-secondary font-semibold block truncate">
                          {item.name}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-text-primary block tabular-nums">
                        ₹{quote.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                      <span className={`text-[9px] font-black block tabular-nums ${isPositive ? 'text-profit' : 'text-loss'}`}>
                        {isPositive ? '▲' : '▼'}{quote.changePercent !== 0 ? `${isPositive ? '+' : ''}${quote.changePercent.toFixed(2)}%` : '0.00%'}
                      </span>
                    </div>
                  </div>

                  {/* Bottom details card row */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/30">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-primary/90 min-w-0">
                      <Activity className="h-3.5 w-3.5 text-profit shrink-0" />
                      <span className="truncate">{item.indicator}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border tracking-wider uppercase ${getSignalBadge(item.signal)}`}>
                        {getSignalLabel(item.signal)}
                      </span>
                      <span className="text-[9px] text-text-secondary font-bold font-mono">{item.confidence}% Conf</span>
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* Lock Overlay for non-Pro users */}
        {!userId && (
          <div className="absolute inset-0 bg-slate-900/10 dark:bg-slate-950/20 backdrop-blur-[2.5px] flex flex-col items-center justify-center text-center p-6 select-none animate-in fade-in duration-200 z-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/80 border border-border shadow-md mb-3 text-amber-500 animate-bounce">
              <Lock className="h-5 w-5" />
            </div>
            
            <h3 className="font-black text-sm text-text-primary tracking-tight flex items-center gap-1.5">
              <Sparkles className="h-4.5 w-4.5 text-profit" />
              Unlock Professional AI Breakout Signals
            </h3>
            
            <p className="text-[10px] text-text-secondary leading-relaxed font-semibold mt-1.5 max-w-sm px-4">
              Connect your account to access live technical breakout triggers, indicator scanners, target prices, risk-reward ratios, and automated buy/sell signals.
            </p>

            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="mt-4 h-9 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-105 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/10 cursor-pointer border border-emerald-500/20"
            >
              <Lock className="h-3.5 w-3.5" />
              Sign In to Unlock Signals
            </button>
          </div>
        )}
      </div>

      {/* Auth Modal */}
      <FirebaseAuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
}
