'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, Wallet, ArrowLeft, RefreshCw, Trash2, 
  ChevronRight, Sparkles, ShieldAlert, 
  History, BookOpen, Clock, PlayCircle, BarChart3
} from 'lucide-react';
import { useStockStore } from '@/store/useStockStore';
import { 
  getSimulatorState, 
  cancelOrder, 
  pollLimitOrders, 
  checkAutoSquareOff,
  squareOffPosition,
  SimulatorState 
} from '@/lib/simulatorService';
import { apiClient as axios } from '@/lib/apiClient';

export default function SimulatorPage() {
  const { userId, toggleAuthModal } = useStockStore();
  const [state, setState] = useState<SimulatorState>({
    cash: 0,
    holdings: [],
    positions: [],
    orders: [],
    history: []
  });
  
  const [livePrices, setLivePrices] = useState<Record<string, { price: number; change: number; pct: number }>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'holdings' | 'positions' | 'orders' | 'history'>('holdings');
  const [triggerRefresh, setTriggerRefresh] = useState(0);

  // 1. Fetch simulator database state
  useEffect(() => {
    async function loadSimulatorData() {
      try {
        const simState = await getSimulatorState(userId);
        setState(simState);
      } catch (err) {
        console.error('Failed to load simulator data', err);
      } finally {
        setLoading(false);
      }
    }
    loadSimulatorData();
  }, [userId, triggerRefresh]);

  // 2. Fetch live prices for all active symbols in holdings, positions, and orders
  useEffect(() => {
    const allSymbols = new Set<string>();
    state.holdings.forEach(h => allSymbols.add(h.symbol));
    state.positions.forEach(p => {
      if (p.quantity !== 0) allSymbols.add(p.symbol);
    });
    state.orders.forEach(o => {
      if (o.status === 'PENDING') allSymbols.add(o.symbol);
    });

    if (allSymbols.size === 0) {
      setLivePrices({});
      return;
    }

    async function fetchLiveQuotes() {
      try {
        const symbolsParam = Array.from(allSymbols).join(',');
        const res = await axios.get(`/api/stock/quote?symbols=${encodeURIComponent(symbolsParam)}`);
        if (res.data && Array.isArray(res.data)) {
          const priceMap: Record<string, { price: number; change: number; pct: number }> = {};
          res.data.forEach((q: any) => {
            priceMap[q.symbol] = {
              price: q.regularMarketPrice,
              change: q.regularMarketChange,
              pct: q.regularMarketChangePercent
            };
          });
          setLivePrices(priceMap);

          // After fetching prices, run limit order polling & MIS auto square-off check
          const plainPrices: Record<string, number> = {};
          Object.keys(priceMap).forEach(sym => {
            plainPrices[sym] = priceMap[sym].price;
          });

          const limitTriggered = await pollLimitOrders(userId, plainPrices);
          const squareOffTriggered = await checkAutoSquareOff(userId, plainPrices);

          if (limitTriggered || squareOffTriggered) {
            setTriggerRefresh(prev => prev + 1);
          }
        }
      } catch (err) {
        console.error('Failed to poll quotes for simulator', err);
      }
    }

    fetchLiveQuotes();
    // Poll quotes every 5 seconds to keep simulator up to date
    const interval = setInterval(fetchLiveQuotes, 5000);
    return () => clearInterval(interval);
  }, [state.holdings, state.positions, state.orders, userId]);

  const handleCancelOrder = async (orderId: string) => {
    const ok = await cancelOrder(userId, orderId);
    if (ok) {
      setTriggerRefresh(prev => prev + 1);
    }
  };

  const handleSquareOff = async (symbol: string) => {
    const quote = livePrices[symbol];
    if (!quote) return;
    const ok = await squareOffPosition(userId, symbol, quote.price);
    if (ok) {
      setTriggerRefresh(prev => prev + 1);
    }
  };

  // 3. Compute Portfolio Math
  let holdingsInvested = 0;
  let holdingsCurrentValue = 0;
  let holdingsDayPnL = 0;

  state.holdings.forEach(h => {
    const quote = livePrices[h.symbol];
    const currentPrice = quote ? quote.price : h.avgBuyPrice;
    const change = quote ? quote.change : 0;
    
    holdingsInvested += h.totalInvested;
    holdingsCurrentValue += currentPrice * h.quantity;
    holdingsDayPnL += change * h.quantity;
  });

  let positionsUnrealizedPnL = 0;
  let positionsRealizedPnL = 0;
  let positionsDayPnL = 0;

  state.positions.forEach(p => {
    positionsRealizedPnL += p.realizedPnL;
    if (p.quantity !== 0) {
      const quote = livePrices[p.symbol];
      const currentPrice = quote ? quote.price : p.avgPrice;
      const change = quote ? quote.change : 0;
      
      const uPnL = p.quantity > 0 
        ? (currentPrice - p.avgPrice) * p.quantity
        : (p.avgPrice - currentPrice) * Math.abs(p.quantity);
      
      positionsUnrealizedPnL += uPnL;
      // MIS Day P&L
      positionsDayPnL += (p.quantity > 0 ? change : -change) * Math.abs(p.quantity);
    }
  });

  const totalHoldingsPnL = holdingsCurrentValue - holdingsInvested;
  const totalPositionsPnL = positionsRealizedPnL + positionsUnrealizedPnL;

  const totalInvested = holdingsInvested;
  const netWorth = state.cash + holdingsCurrentValue + positionsUnrealizedPnL;
  const overallPnL = totalHoldingsPnL + totalPositionsPnL;
  const dayPnL = holdingsDayPnL + positionsDayPnL;

  const overallPnLPct = totalInvested > 0 ? (overallPnL / totalInvested) * 100 : 0;

  // Generate pie chart segments for holdings
  const holdingsSegments = state.holdings.map(h => {
    const quote = livePrices[h.symbol];
    const val = (quote ? quote.price : h.avgBuyPrice) * h.quantity;
    return {
      symbol: h.symbol.replace('.NS', ''),
      value: val
    };
  });
  const totalHoldingVal = holdingsSegments.reduce((acc, s) => acc + s.value, 0);
  
  // Statically mock previous close net worth to compute precise Day's P&L pct
  const prevNetWorth = netWorth - dayPnL;
  const dayPnLPct = prevNetWorth > 0 ? (dayPnL / prevNetWorth) * 100 : 0;

  return (
    <main className="min-h-screen bg-background text-text-primary selection:bg-emerald-500/20">
      
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/60 px-4 sm:px-8 py-4 flex items-center justify-between">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Terminal
        </Link>
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-black tracking-widest text-text-secondary uppercase">
            Simulator Active
          </span>
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-8">
        
        {/* Guest Warning Banner */}
        {!userId && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-3xl text-xs font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm shadow-amber-500/5">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4.5 h-4.5 shrink-0" />
              <span>You are playing in Guest Mode. Log in to sync and back up your simulator balance and trade history!</span>
            </div>
            <button 
              onClick={() => toggleAuthModal(true)}
              className="px-3.5 py-1.5 bg-amber-500 text-black rounded-xl hover:brightness-105 font-black uppercase text-[10px] whitespace-nowrap self-start sm:self-auto cursor-pointer shadow-sm shadow-amber-500/10"
            >
              Sign In Now
            </button>
          </div>
        )}

        {/* Header Hero Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-border/40">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              OnlyProfit Trading Simulator
            </div>
            <h1 className="text-3xl font-black text-text-primary">
              Paper Trading Dashboard
            </h1>
            <p className="text-xs text-text-secondary mt-1">
              Practice stock trading in Indian markets with real-world price feeds and zero capital risk.
            </p>
          </div>
          
          <button 
            onClick={() => setTriggerRefresh(prev => prev + 1)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold border border-border rounded-xl bg-card hover:bg-card-hover text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh State
          </button>
        </div>

        {/* Portfolio Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-card border border-border rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Net Worth */}
            <div className="bg-card border border-border rounded-3xl p-5 flex items-center justify-between relative overflow-hidden group">
              <div className="space-y-1">
                <span className="text-[10px] font-black tracking-widest text-text-secondary uppercase">
                  Total Net Worth
                </span>
                <h3 className="text-2xl font-black text-text-primary">
                  ₹{netWorth.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </h3>
                <span className="text-[10px] text-text-secondary font-bold">
                  Cash + Stocks value
                </span>
              </div>
              <div className="h-10 w-10 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            {/* Day P&L */}
            <div className="bg-card border border-border rounded-3xl p-5 flex items-center justify-between relative overflow-hidden group">
              <div className="space-y-1">
                <span className="text-[10px] font-black tracking-widest text-text-secondary uppercase">
                  {"Day's P&L"}
                </span>
                <h3 className={`text-2xl font-black ${dayPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
                  ₹{dayPnL.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </h3>
                <span className={`text-[10px] font-bold ${dayPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
                  {dayPnL >= 0 ? '+' : ''}{dayPnLPct.toFixed(2)}% today
                </span>
              </div>
              <div className={`h-10 w-10 rounded-2xl border flex items-center justify-center shrink-0 ${
                dayPnL >= 0 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-red-500/10 border-red-500/20 text-red-500'
              }`}>
                <Clock className="w-5 h-5" />
              </div>
            </div>

            {/* Overall P&L */}
            <div className="bg-card border border-border rounded-3xl p-5 flex items-center justify-between relative overflow-hidden group">
              <div className="space-y-1">
                <span className="text-[10px] font-black tracking-widest text-text-secondary uppercase">
                  Overall P&L
                </span>
                <h3 className={`text-2xl font-black ${overallPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
                  ₹{overallPnL.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </h3>
                <span className={`text-[10px] font-bold ${overallPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
                  {overallPnL >= 0 ? '+' : ''}{overallPnLPct.toFixed(2)}% total P&L
                </span>
              </div>
              <div className={`h-10 w-10 rounded-2xl border flex items-center justify-center shrink-0 ${
                overallPnL >= 0 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-red-500/10 border-red-500/20 text-red-500'
              }`}>
                <BarChart3 className="w-5 h-5" />
              </div>
            </div>

            {/* Cash Balance */}
            <div className="bg-card border border-border rounded-3xl p-5 flex items-center justify-between relative overflow-hidden group">
              <div className="space-y-1">
                <span className="text-[10px] font-black tracking-widest text-text-secondary uppercase">
                  Available Cash
                </span>
                <h3 className="text-2xl font-black text-text-primary">
                  ₹{state.cash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </h3>
                <span className="text-[10px] text-text-secondary font-bold">
                  Virtual Margin balance
                </span>
              </div>
              <div className="h-10 w-10 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-2xl flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
            </div>

          </div>
        )}

        {/* Allocation & Visual Insights Section */}
        {!loading && state.holdings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Allocation SVG Donut */}
            <div className="md:col-span-1 bg-card border border-border rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-black text-text-primary uppercase tracking-wider mb-1">
                  Holding Allocation
                </h3>
                <p className="text-[10px] text-text-secondary font-bold">Asset distribution by market value weights</p>
              </div>

              <div className="flex flex-col items-center justify-center py-4">
                {/* SVG Donut Chart */}
                <div className="relative w-36 h-36">
                  <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
                    <circle cx="60" cy="60" r="45" fill="transparent" stroke="var(--border)" strokeWidth="12" className="opacity-20" />
                    {(() => {
                      let accumulatedPercent = 0;
                      const colors = ['#10b981', '#6366f1', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'];
                      return holdingsSegments.map((seg, idx) => {
                        const pct = totalHoldingVal > 0 ? (seg.value / totalHoldingVal) * 100 : 0;
                        const circumference = 2 * Math.PI * 45;
                        const strokeOffset = circumference - (pct / 100) * circumference;
                        const rotation = (accumulatedPercent / 100) * 360;
                        accumulatedPercent += pct;
                        
                        return (
                          <circle
                            key={idx}
                            cx="60"
                            cy="60"
                            r="45"
                            fill="transparent"
                            stroke={colors[idx % colors.length]}
                            strokeWidth="12"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeOffset}
                            transform={`rotate(${rotation} 60 60)`}
                            className="transition-all duration-300"
                          />
                        );
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-black text-text-secondary uppercase">Stocks</span>
                    <span className="text-xs font-black text-text-primary">{state.holdings.length}</span>
                  </div>
                </div>
              </div>

              {/* Legends list */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-bold border-t border-border pt-4">
                {holdingsSegments.slice(0, 4).map((seg, idx) => {
                  const pct = totalHoldingVal > 0 ? (seg.value / totalHoldingVal) * 100 : 0;
                  const colors = ['#10b981', '#6366f1', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'];
                  return (
                    <div key={idx} className="flex items-center gap-1.5 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colors[idx % colors.length] }} />
                      <span className="text-text-primary truncate">{seg.symbol}</span>
                      <span className="text-text-secondary ml-auto">{pct.toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Performance Analysis Graph (Mock History) */}
            <div className="md:col-span-2 bg-card border border-border rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-black text-text-primary uppercase tracking-wider mb-1">
                  Net Worth Growth
                </h3>
                <p className="text-[10px] text-text-secondary font-bold">Simulated daily performance trajectory</p>
              </div>

              <div className="h-40 w-full flex items-end justify-between gap-1 pt-6 px-2">
                {/* SVG Line Graph */}
                <svg className="w-full h-full overflow-visible" viewBox="0 0 500 120">
                  <defs>
                    <linearGradient id="gradient-line" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Grid Lines */}
                  <line x1="0" y1="30" x2="500" y2="30" stroke="var(--border)" strokeOpacity="0.3" strokeDasharray="3" />
                  <line x1="0" y1="60" x2="500" y2="60" stroke="var(--border)" strokeOpacity="0.3" strokeDasharray="3" />
                  <line x1="0" y1="90" x2="500" y2="90" stroke="var(--border)" strokeOpacity="0.3" strokeDasharray="3" />

                  {/* SVG Path */}
                  <path
                    d={`M 0 90 Q 100 ${overallPnL >= 0 ? 80 : 95} 200 85 T 400 ${overallPnL >= 0 ? 70 : 100} T 500 ${overallPnL >= 0 ? 40 : 105}`}
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d={`M 0 90 Q 100 ${overallPnL >= 0 ? 80 : 95} 200 85 T 400 ${overallPnL >= 0 ? 70 : 100} T 500 ${overallPnL >= 0 ? 40 : 105} L 500 120 L 0 120 Z`}
                    fill="url(#gradient-line)"
                  />
                  
                  {/* Tooltip dot */}
                  <circle cx="500" cy={overallPnL >= 0 ? 40 : 105} r="4.5" fill="#10b981" />
                </svg>
              </div>

              <div className="flex justify-between items-center text-[10px] text-text-secondary font-bold border-t border-border pt-4 mt-2">
                <span>Start: ₹10,00,000</span>
                <span>Interval: Past 7 Days</span>
                <span className="text-emerald-400">Current: ₹{netWorth.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>
            </div>

          </div>
        )}

        {/* Dashboard Tabs Bar */}
        <div className="flex items-center gap-1.5 p-1 bg-card border border-border rounded-2xl w-full sm:w-max">
          <button
            onClick={() => setActiveTab('holdings')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === 'holdings'
                ? 'bg-background text-emerald-400 border border-border shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Holdings (CNC)
          </button>
          
          <button
            onClick={() => setActiveTab('positions')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === 'positions'
                ? 'bg-background text-emerald-400 border border-border shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Positions (MIS)
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black transition-all relative ${
              activeTab === 'orders'
                ? 'bg-background text-emerald-400 border border-border shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Order Book
            {state.orders.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-black text-black select-none">
                {state.orders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === 'history'
                ? 'bg-background text-emerald-400 border border-border shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Trade History
          </button>
        </div>

        {/* Tab Views */}
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          
          {/* 1. HOLDINGS TAB */}
          {activeTab === 'holdings' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/80 text-[10px] font-black text-text-secondary uppercase tracking-widest bg-card-hover/20">
                    <th className="p-4 sm:p-5">Symbol</th>
                    <th className="p-4 sm:p-5">Qty</th>
                    <th className="p-4 sm:p-5">Avg Price</th>
                    <th className="p-4 sm:p-5">LTP</th>
                    <th className="p-4 sm:p-5">Invested</th>
                    <th className="p-4 sm:p-5">Cur Value</th>
                    <th className="p-4 sm:p-5">Overall P&L</th>
                    <th className="p-4 sm:p-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {state.holdings.length > 0 ? (
                    state.holdings.map((h) => {
                      const quote = livePrices[h.symbol];
                      const ltp = quote ? quote.price : h.avgBuyPrice;
                      const currentValue = ltp * h.quantity;
                      const pnl = currentValue - h.totalInvested;
                      const pnlPct = h.totalInvested > 0 ? (pnl / h.totalInvested) * 100 : 0;
                      
                      return (
                        <tr key={h.symbol} className="border-b border-border/40 hover:bg-card-hover/10 text-xs font-bold transition-all">
                          <td className="p-4 sm:p-5">
                            <Link href={`/stock/${h.symbol}`} className="font-black text-text-primary hover:text-emerald-400 transition-colors">
                              {h.symbol.replace('.NS', '')}
                            </Link>
                          </td>
                          <td className="p-4 sm:p-5 text-text-primary tabular-nums font-mono">{h.quantity}</td>
                          <td className="p-4 sm:p-5 tabular-nums font-mono">₹{h.avgBuyPrice.toFixed(2)}</td>
                          <td className="p-4 sm:p-5 text-text-primary font-extrabold tabular-nums font-mono">₹{ltp.toFixed(2)}</td>
                          <td className="p-4 sm:p-5 tabular-nums font-mono">₹{h.totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="p-4 sm:p-5 text-text-primary tabular-nums font-mono">₹{currentValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className={`p-4 sm:p-5 font-black tabular-nums font-mono ${pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                            <div>{pnl >= 0 ? '▲ +' : '▼ '}₹{Math.abs(pnl).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                            <div className="text-[10px] mt-0.5">{pnl >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%</div>
                          </td>
                          <td className="p-4 sm:p-5 text-right">
                            <Link 
                              href={`/stock/${h.symbol}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 border border-border hover:border-emerald-500/20 bg-background hover:bg-emerald-500/5 text-text-secondary hover:text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                            >
                              Trade
                              <ChevronRight className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-xs text-text-secondary font-bold">
                        <div className="flex flex-col items-center justify-center gap-4 py-4">
                          <TrendingUp className="h-10 w-10 text-text-secondary/30 animate-pulse" />
                          <div className="space-y-1">
                            <div>No active CNC Holdings found.</div>
                            <div className="text-[10px] font-medium text-text-secondary/80">Place a delivery order from any stock page to build your portfolio.</div>
                          </div>
                          <Link 
                            href="/?tab=explore"
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-500/10 active:scale-[0.98]"
                          >
                            Explore Stocks to Buy
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 2. POSITIONS TAB */}
          {activeTab === 'positions' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/80 text-[10px] font-black text-text-secondary uppercase tracking-widest bg-card-hover/20">
                    <th className="p-4 sm:p-5">Symbol</th>
                    <th className="p-4 sm:p-5">Qty (Active)</th>
                    <th className="p-4 sm:p-5">Type</th>
                    <th className="p-4 sm:p-5">Avg Price</th>
                    <th className="p-4 sm:p-5">LTP</th>
                    <th className="p-4 sm:p-5">Realized P&L</th>
                    <th className="p-4 sm:p-5">Unrealized P&L</th>
                    <th className="p-4 sm:p-5 text-right font-black">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {state.positions.length > 0 ? (
                    state.positions.map((p) => {
                      const quote = livePrices[p.symbol];
                      const ltp = quote ? quote.price : p.avgPrice;
                      const activeQty = p.quantity;
                      const isSquaredOff = activeQty === 0;
                      
                      const unrealizedPnL = isSquaredOff ? 0 : (
                        activeQty > 0 
                          ? (ltp - p.avgPrice) * activeQty
                          : (p.avgPrice - ltp) * Math.abs(activeQty)
                      );
                      
                      return (
                        <tr key={p.symbol} className="border-b border-border/40 hover:bg-card-hover/10 text-xs font-bold transition-all">
                          <td className="p-4 sm:p-5">
                            <Link href={`/stock/${p.symbol}`} className="font-black text-text-primary hover:text-emerald-400 transition-colors">
                              {p.symbol.replace('.NS', '')}
                            </Link>
                          </td>
                          <td className={`p-4 sm:p-5 font-extrabold ${isSquaredOff ? 'text-text-secondary' : activeQty > 0 ? 'text-profit' : 'text-loss'}`}>
                            {isSquaredOff ? '0 (Squared)' : `${activeQty > 0 ? '+' : ''}${activeQty}`}
                          </td>
                          <td className="p-4 sm:p-5 text-text-secondary uppercase tracking-wider text-[10px]">
                            {isSquaredOff ? 'CLOSED' : activeQty > 0 ? 'LONG (MIS)' : 'SHORT (MIS)'}
                          </td>
                          <td className="p-4 sm:p-5 tabular-nums font-mono">₹{p.avgPrice.toFixed(2)}</td>
                          <td className="p-4 sm:p-5 text-text-primary font-black tabular-nums font-mono">₹{ltp.toFixed(2)}</td>
                          <td className={`p-4 sm:p-5 font-black tabular-nums font-mono ${p.realizedPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
                            {p.realizedPnL >= 0 ? '▲ +' : '▼ '}₹{Math.abs(p.realizedPnL).toFixed(2)}
                          </td>
                          <td className={`p-4 sm:p-5 font-black tabular-nums font-mono ${unrealizedPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
                            {unrealizedPnL >= 0 ? '▲ +' : '▼ '}₹{Math.abs(unrealizedPnL).toFixed(2)}
                          </td>
                          <td className="p-4 sm:p-5 text-right">
                            {!isSquaredOff ? (
                              <button
                                onClick={() => handleSquareOff(p.symbol)}
                                className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-black rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                              >
                                Square Off
                              </button>
                            ) : (
                              <span className="text-[10px] text-text-secondary font-bold">Completed</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-xs text-text-secondary font-bold">
                        <div className="flex flex-col items-center justify-center gap-4 py-4">
                          <PlayCircle className="h-10 w-10 text-text-secondary/30 animate-pulse" />
                          <div className="space-y-1">
                            <div>No active MIS Intraday Positions found.</div>
                            <div className="text-[10px] font-medium text-text-secondary/80">Execute MIS orders on any stock page to trace daily margins.</div>
                          </div>
                          <Link 
                            href="/?tab=explore"
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-500/10 active:scale-[0.98]"
                          >
                            Explore Intraday Equities
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 3. ORDER BOOK TAB */}
          {activeTab === 'orders' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/80 text-[10px] font-black text-text-secondary uppercase tracking-widest bg-card-hover/20">
                    <th className="p-4 sm:p-5">Time</th>
                    <th className="p-4 sm:p-5">Symbol</th>
                    <th className="p-4 sm:p-5">Side</th>
                    <th className="p-4 sm:p-5">Product</th>
                    <th className="p-4 sm:p-5">Type</th>
                    <th className="p-4 sm:p-5">Qty</th>
                    <th className="p-4 sm:p-5">Price Input</th>
                    <th className="p-4 sm:p-5">Status</th>
                    <th className="p-4 sm:p-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {state.orders.length > 0 ? (
                    state.orders.map((o) => (
                      <tr key={o.id} className="border-b border-border/40 hover:bg-card-hover/10 text-xs font-bold transition-all">
                        <td className="p-4 sm:p-5 text-text-secondary">
                          {new Date(o.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="p-4 sm:p-5">
                          <span className="font-black text-text-primary">{o.symbol.replace('.NS', '')}</span>
                        </td>
                        <td className={`p-4 sm:p-5 font-black uppercase text-[10px] tracking-wider ${o.side === 'BUY' ? 'text-profit' : 'text-loss'}`}>
                          {o.side}
                        </td>
                        <td className="p-4 sm:p-5 text-text-secondary uppercase tracking-wider text-[10px]">{o.productType}</td>
                        <td className="p-4 sm:p-5 text-text-secondary uppercase text-[10px]">{o.type}</td>
                        <td className="p-4 sm:p-5 text-text-primary">{o.quantity}</td>
                        <td className="p-4 sm:p-5 text-text-primary">
                          {o.type === 'LIMIT' ? `₹${o.limitPrice?.toFixed(2)}` : o.type === 'SL' ? `₹${o.stopPrice?.toFixed(2)}` : 'Market'}
                        </td>
                        <td className="p-4 sm:p-5">
                          <span className="px-2.5 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-wider bg-yellow-500/10 border-yellow-500/20 text-yellow-500">
                            PENDING
                          </span>
                        </td>
                        <td className="p-4 sm:p-5 text-right">
                          <button
                            onClick={() => handleCancelOrder(o.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 border border-border hover:border-red-500/20 bg-background hover:bg-red-500/5 text-text-secondary hover:text-red-500 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="p-12 text-center text-xs text-text-secondary font-bold">
                        <BookOpen className="w-10 h-10 mx-auto text-text-secondary/30 mb-2" />
                        No pending orders in order book. Limit and Stop Loss orders sit here until execution.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 4. TRADE HISTORY TAB */}
          {activeTab === 'history' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/80 text-[10px] font-black text-text-secondary uppercase tracking-widest bg-card-hover/20">
                    <th className="p-4 sm:p-5">Date & Time</th>
                    <th className="p-4 sm:p-5">Symbol</th>
                    <th className="p-4 sm:p-5">Type</th>
                    <th className="p-4 sm:p-5">Product</th>
                    <th className="p-4 sm:p-5">Qty</th>
                    <th className="p-4 sm:p-5">Exec Price</th>
                    <th className="p-4 sm:p-5">Fees Paid</th>
                    <th className="p-4 sm:p-5">Status</th>
                    <th className="p-4 sm:p-5 text-right">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {state.history.length > 0 ? (
                    state.history.map((h) => (
                      <tr key={h.id} className="border-b border-border/40 hover:bg-card-hover/10 text-xs font-bold transition-all">
                        <td className="p-4 sm:p-5 text-text-secondary">
                          {new Date(h.timestamp).toLocaleString('en-IN', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-4 sm:p-5">
                          <span className="font-black text-text-primary">{h.symbol.replace('.NS', '')}</span>
                        </td>
                        <td className={`p-4 sm:p-5 font-black uppercase text-[10px] tracking-wider ${h.side === 'BUY' ? 'text-profit' : 'text-loss'}`}>
                          {h.side} ({h.type})
                        </td>
                        <td className="p-4 sm:p-5 text-text-secondary uppercase tracking-wider text-[10px]">{h.productType}</td>
                        <td className="p-4 sm:p-5 text-text-primary">{h.quantity}</td>
                        <td className="p-4 sm:p-5 text-text-primary">
                          {h.status === 'EXECUTED' ? `₹${h.executionPrice?.toFixed(2)}` : '-'}
                        </td>
                        <td className="p-4 sm:p-5 text-text-secondary">
                          ₹{(h.brokerage + h.taxes).toFixed(2)}
                        </td>
                        <td className="p-4 sm:p-5">
                          <span className={`px-2 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-wider ${
                            h.status === 'EXECUTED'
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              : h.status === 'CANCELLED'
                              ? 'bg-slate-500/10 border-slate-500/20 text-text-secondary'
                              : 'bg-red-500/10 border-red-500/20 text-red-500'
                          }`}>
                            {h.status}
                          </span>
                        </td>
                        <td className="p-4 sm:p-5 text-right text-text-secondary max-w-xs truncate">
                          {h.rejectionReason || '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="p-12 text-center text-xs text-text-secondary font-bold">
                        <History className="w-10 h-10 mx-auto text-text-secondary/30 mb-2" />
                        No transaction history available. Completed buy/sell logs appear here.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

        </div>

      </div>
    </main>
  );
}
