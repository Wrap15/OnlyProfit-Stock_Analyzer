'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, Wallet, ArrowLeft, RefreshCw, 
  ChevronRight, Sparkles, ShieldAlert, 
  History, PlayCircle, BarChart3,
  Eye, EyeOff, Plus
} from 'lucide-react';
import { useStockStore } from '@/store/useStockStore';
import { 
  getSimulatorState, 
  pollLimitOrders, 
  checkAutoSquareOff,
  syncLocalDataToFirestore,
  saveCashBalance,
  resetSimulatorState,
  SimulatorState 
} from '@/lib/simulatorService';
import { apiClient as axios } from '@/lib/apiClient';
import MiniSparkline, { generateMockSparkline } from '@/components/MiniSparkline';
import { parseOptionSymbol, calculateOptionPrice } from '@/lib/foUtils';

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
  const [activeTab, setActiveTab] = useState<'holdings' | 'history'>('holdings');
  const [isMasked, setIsMasked] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [triggerRefresh, setTriggerRefresh] = useState(0);

  // 1. Fetch simulator database state
  useEffect(() => {
    let active = true;
    async function loadSimulatorData() {
      try {
        if (active) setLoading(true);
        if (userId) {
          // Sync guest offline session holdings to account before retrieving simulator state
          await syncLocalDataToFirestore(userId);
        }
        const simState = await getSimulatorState(userId);
        if (active) {
          setState(simState);
        }
      } catch (err) {
        console.error('Failed to load simulator data', err);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadSimulatorData();
    return () => {
      active = false;
    };
  }, [userId, triggerRefresh]);

  // 2. Compute stable dependency keys for quote polling to avoid shallow array reference triggers
  const holdingsSymbolsKey = state.holdings.map(h => h.symbol).sort().join(',');
  const activePositionsSymbolsKey = state.positions.filter(p => p.quantity !== 0).map(p => p.symbol).sort().join(',');
  const pendingOrdersSymbolsKey = state.orders.filter(o => o.status === 'PENDING').map(o => o.symbol).sort().join(',');

  // Fetch live prices for all active symbols in holdings, positions, and orders
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
        const underlyingsToFetch = new Set<string>();
        const optionSymbolsInUse: string[] = [];

        allSymbols.forEach(sym => {
          const parsed = parseOptionSymbol(sym);
          if (parsed) {
            underlyingsToFetch.add(parsed.underlying);
            optionSymbolsInUse.push(sym);
          } else {
            underlyingsToFetch.add(sym);
          }
        });

        if (underlyingsToFetch.size === 0) {
          setLivePrices({});
          return;
        }

        const symbolsParam = Array.from(underlyingsToFetch).join(',');
        const res = await axios.get(`/api/stock/quote?symbols=${encodeURIComponent(symbolsParam)}`);
        
        if (res.data && Array.isArray(res.data)) {
          const priceMap: Record<string, { price: number; change: number; pct: number }> = {};
          
          // Map underlyings and normal stock tickers first
          res.data.forEach((q: any) => {
            priceMap[q.symbol] = {
              price: q.regularMarketPrice,
              change: q.regularMarketChange,
              pct: q.regularMarketChangePercent
            };
            const baseSym = q.symbol.split('.')[0];
            priceMap[baseSym] = {
              price: q.regularMarketPrice,
              change: q.regularMarketChange,
              pct: q.regularMarketChangePercent
            };
          });

          // Calculate options premium prices from underlyings
          optionSymbolsInUse.forEach(optSym => {
            const parsed = parseOptionSymbol(optSym);
            if (parsed) {
              const underlyingQuote = priceMap[parsed.underlying] || priceMap[parsed.underlying + '.NS'];
              if (underlyingQuote) {
                const optDetails = calculateOptionPrice(
                  underlyingQuote.price,
                  parsed.strike,
                  parsed.expiry,
                  parsed.type
                );
                priceMap[optSym] = {
                  price: optDetails.price,
                  change: optDetails.change,
                  pct: optDetails.pct
                };
              }
            }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holdingsSymbolsKey, activePositionsSymbolsKey, pendingOrdersSymbolsKey, userId]);



  const handleAddMoney = async () => {
    const addedAmount = 100000; // Add ₹1,00,000 virtual cash
    await saveCashBalance(userId, state.cash + addedAmount);
    setTriggerRefresh(prev => prev + 1);
  };

  const handleResetSimulator = async () => {
    const ok = window.confirm('Are you sure you want to reset your paper trading simulator account? This will clear all holdings, order book history, and reset your cash balance back to ₹10,00,000.');
    if (!ok) return;
    
    setLoading(true);
    await resetSimulatorState(userId);
    setTriggerRefresh(prev => prev + 1);
    setLoading(false);
  };

  // 3. Compute Portfolio Math
  let holdingsInvested = 0;
  let holdingsCurrentValue = 0;
  let holdingsDayPnL = 0;

  state.holdings.forEach(h => {
    const quote = livePrices[h.symbol];
    const currentPrice = quote ? quote.price : h.avgBuyPrice;
    const change = quote ? quote.change : 0;
    
    // Check if the last purchase was made today
    const lastBuyOrder = state.history.find(hist => hist.symbol === h.symbol && hist.side === 'BUY' && hist.status === 'EXECUTED');
    const isBoughtToday = lastBuyOrder && new Date(lastBuyOrder.timestamp).toDateString() === new Date().toDateString();
    
    const holdingDayPnL = isBoughtToday 
      ? (currentPrice - h.avgBuyPrice) * h.quantity 
      : change * h.quantity;

    holdingsInvested += h.totalInvested;
    holdingsCurrentValue += currentPrice * h.quantity;
    holdingsDayPnL += holdingDayPnL;
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
  
  // Compute Day's P&L percentage based on previous close value of active investments
  const activeInvestmentsVal = holdingsCurrentValue + positionsUnrealizedPnL;
  const prevInvestmentsVal = activeInvestmentsVal - dayPnL;
  const dayPnLPct = prevInvestmentsVal > 0 ? (dayPnL / prevInvestmentsVal) * 100 : 0;

  const renderSymbolName = (sym: string) => {
    const parsed = parseOptionSymbol(sym);
    if (parsed) {
      return (
        <Link href={`/stock/${parsed.underlying}`} className="hover:underline transition-colors block truncate">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-extrabold text-text-primary">{parsed.underlying.replace('.NS', '')}</span>
            <span className="text-[9px] font-black text-text-secondary tracking-tight">{parsed.expiry}</span>
            <span className="text-[10px] font-mono font-black text-text-primary bg-background border border-border/80 rounded px-1.5 py-0.5">₹{parsed.strike}</span>
            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black tracking-wider ${
              parsed.type === 'CE'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
            }`}>
              {parsed.type}
            </span>
          </div>
        </Link>
      );
    }
    return (
      <Link href={`/stock/${sym}`} className="font-extrabold text-sm text-emerald-400 hover:underline transition-colors block truncate">
        {sym.replace('.NS', '')}
      </Link>
    );
  };

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
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pb-28 pt-10 sm:py-10 space-y-8">
        
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
        </div>        {/* Portfolio Stats Grid & Columns */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-6 animate-pulse">
              <div className="h-44 bg-card border border-border rounded-3xl" />
              <div className="h-10 w-64 bg-card border border-border rounded-2xl" />
              <div className="h-96 bg-card border border-border rounded-3xl" />
            </div>
            <div className="lg:col-span-1 space-y-6 animate-pulse">
              <div className="h-32 bg-card border border-border rounded-3xl" />
              <div className="h-64 bg-card border border-border rounded-3xl" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Left Column (Holdings summary & Tab tables) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Holdings Summary Card */}
              <div className="bg-card border border-border rounded-3xl p-6 space-y-6 shadow-sm">
                <div className="flex justify-between items-center">
                  <h2 className="text-sm font-black text-text-secondary uppercase tracking-widest">
                    Holdings ({state.holdings.length})
                  </h2>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setIsMasked(prev => !prev)}
                      className="p-2 rounded-xl border border-border bg-background hover:bg-card-hover text-text-secondary hover:text-text-primary transition-colors cursor-pointer text-text-secondary"
                      title={isMasked ? "Show values" : "Hide values"}
                    >
                      {isMasked ? <EyeOff className="w-4 h-4 text-emerald-400" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={() => setShowAnalysis(prev => !prev)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 border rounded-xl text-xs font-black transition-all cursor-pointer ${
                        showAnalysis 
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                          : 'border-border bg-background hover:bg-card-hover text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      Analyse
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-3xl font-black text-text-primary tracking-tight font-mono">
                    {isMasked ? '•••••' : `₹${holdingsCurrentValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                  </h3>
                  <span className="text-[10px] text-text-secondary font-medium uppercase tracking-wider">
                    Current Portfolio Value
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/60">
                  <div>
                    <div className="text-[10px] text-text-secondary font-black uppercase tracking-wider">
                      Invested Value
                    </div>
                    <div className="text-sm sm:text-base font-black text-text-primary mt-1 font-mono">
                      {isMasked ? '•••••' : `₹${totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-text-secondary font-black uppercase tracking-wider">
                      1D Returns
                    </div>
                    <div className={`text-sm sm:text-base font-black mt-1 font-mono flex flex-wrap items-center gap-1 ${dayPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
                      <span>{isMasked ? '•••••' : `${dayPnL >= 0 ? '+' : ''}₹${dayPnL.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}</span>
                      <span className="text-xs font-bold">({dayPnL >= 0 ? '+' : ''}{dayPnLPct.toFixed(2)}%)</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-text-secondary font-black uppercase tracking-wider">
                      Total Returns
                    </div>
                    <div className={`text-sm sm:text-base font-black mt-1 font-mono flex flex-wrap items-center gap-1 ${overallPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
                      <span>{isMasked ? '•••••' : `${overallPnL >= 0 ? '+' : ''}₹${overallPnL.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}</span>
                      <span className="text-xs font-bold">({overallPnL >= 0 ? '+' : ''}{overallPnLPct.toFixed(2)}%)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analysis Charts (Collapsible) */}
              {showAnalysis && state.holdings.length > 0 && (
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

                  {/* Net Worth Growth Graph */}
                  <div className="md:col-span-2 bg-card border border-border rounded-3xl p-6 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-black text-text-primary uppercase tracking-wider mb-1">
                        Net Worth Growth
                      </h3>
                      <p className="text-[10px] text-text-secondary font-bold">Simulated daily performance trajectory</p>
                    </div>

                    <div className="h-40 w-full flex items-end justify-between gap-1 pt-6 px-2">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 500 120">
                        <defs>
                          <linearGradient id="gradient-line" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        
                        <line x1="0" y1="30" x2="500" y2="30" stroke="var(--border)" strokeOpacity="0.3" strokeDasharray="3" />
                        <line x1="0" y1="60" x2="500" y2="60" stroke="var(--border)" strokeOpacity="0.3" strokeDasharray="3" />
                        <line x1="0" y1="90" x2="500" y2="90" stroke="var(--border)" strokeOpacity="0.3" strokeDasharray="3" />

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
                  className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    activeTab === 'holdings'
                      ? 'bg-background text-emerald-400 border border-border shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Holdings (CNC)
                </button>

                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    activeTab === 'history'
                      ? 'bg-background text-emerald-400 border border-border shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Trade History
                </button>
              </div>

              <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
                
                {/* 1. HOLDINGS TAB */}
                {activeTab === 'holdings' && (
                  <>
                    {/* Desktop table */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-border/80 text-[10px] font-black text-text-secondary uppercase tracking-widest bg-card-hover/20">
                            <th className="p-4 sm:p-5">Company</th>
                            <th className="p-4 sm:p-5">Purchase Date</th>
                            <th className="p-4 sm:p-5">Market price (1D%)</th>
                            <th className="p-4 sm:p-5">Returns (Total / 1D)</th>
                            <th className="p-4 sm:p-5">Current (Invested)</th>
                            <th className="p-4 sm:p-5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {state.holdings.length > 0 ? (
                            state.holdings.map((h) => {
                              const quote = livePrices[h.symbol];
                              const ltp = quote ? quote.price : h.avgBuyPrice;
                              const pct = quote ? quote.pct : 0;
                              const isStockPositive = pct >= 0;
                              const currentValue = ltp * h.quantity;
                              const pnl = currentValue - h.totalInvested;
                              const pnlPct = h.totalInvested > 0 ? (pnl / h.totalInvested) * 100 : 0;
                              const isPnLPositive = pnl >= 0;
                              const sparkPoints = generateMockSparkline(h.symbol, isStockPositive);

                              // Calculate Purchase Date
                              const lastBuyOrder = state.history.find(hist => hist.symbol === h.symbol && hist.side === 'BUY' && hist.status === 'EXECUTED');
                              const purchaseDate = lastBuyOrder 
                                ? new Date(lastBuyOrder.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                : 'N/A';
                              const isBoughtToday = lastBuyOrder && new Date(lastBuyOrder.timestamp).toDateString() === new Date().toDateString();

                              // Calculate 1D Returns
                              const holdingDayPnL = isBoughtToday 
                                ? (ltp - h.avgBuyPrice) * h.quantity 
                                : (quote ? quote.change : 0) * h.quantity;
                              const holdingDayPnLPct = isBoughtToday
                                ? (h.avgBuyPrice > 0 ? ((ltp - h.avgBuyPrice) / h.avgBuyPrice) * 100 : 0)
                                : pct;
                              const isHoldingDayPnLPositive = holdingDayPnL >= 0;

                              return (
                                <tr key={h.symbol} className="border-b border-border/40 hover:bg-card-hover/10 text-xs font-bold transition-all">
                                  {/* Company Column */}
                                  <td className="p-4 sm:p-5">
                                    <div className="flex items-center gap-3">
                                      <div className="min-w-0">
                                        {renderSymbolName(h.symbol)}
                                        <div className="text-[10px] text-text-secondary font-medium mt-0.5 truncate">
                                          {h.quantity} shares • Avg. ₹{h.avgBuyPrice.toFixed(2)}
                                        </div>
                                      </div>
                                      <div className="ml-auto pr-2 shrink-0">
                                        <MiniSparkline data={sparkPoints} isPositive={isStockPositive} width={60} height={20} />
                                      </div>
                                    </div>
                                  </td>

                                  {/* Purchase Date Column */}
                                  <td className="p-4 sm:p-5">
                                    <div className="font-extrabold text-text-secondary tabular-nums">
                                      {purchaseDate}
                                    </div>
                                  </td>

                                  {/* Market Price Column */}
                                  <td className="p-4 sm:p-5">
                                    <div className="font-extrabold text-text-primary tabular-nums font-mono">
                                      ₹{ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </div>
                                    <div className={`text-[10px] font-black tabular-nums flex items-center gap-0.5 mt-0.5 ${isStockPositive ? 'text-profit' : 'text-loss'}`}>
                                      <span>{isStockPositive ? '▲ +' : '▼ '}{pct.toFixed(2)}%</span>
                                    </div>
                                  </td>

                                  {/* Returns Column */}
                                  <td className="p-4 sm:p-5">
                                    {/* Total Returns */}
                                    <div className={`font-black tabular-nums font-mono ${isPnLPositive ? 'text-profit' : 'text-loss'}`}>
                                      {isMasked ? '•••••' : `${isPnLPositive ? '+' : ''}₹${pnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                                    </div>
                                    <div className={`text-[10px] font-black tabular-nums flex items-center gap-0.5 mt-0.5 ${isPnLPositive ? 'text-profit' : 'text-loss'}`}>
                                      <span>Total: {isPnLPositive ? '+' : ''}{pnlPct.toFixed(2)}%</span>
                                    </div>
                                    {/* 1D Returns */}
                                    <div className={`text-[10px] font-black tabular-nums flex items-center gap-0.5 mt-1.5 ${isHoldingDayPnLPositive ? 'text-profit' : 'text-loss'}`}>
                                      <span>1D: {isMasked ? '•••••' : `${isHoldingDayPnLPositive ? '+' : ''}₹${holdingDayPnL.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} ({isHoldingDayPnLPositive ? '+' : ''}{holdingDayPnLPct.toFixed(2)}%)</span>
                                    </div>
                                  </td>

                                  {/* Current (Invested) Column */}
                                  <td className="p-4 sm:p-5">
                                    <div className="font-extrabold text-text-primary tabular-nums font-mono">
                                      {isMasked ? '•••••' : `₹${currentValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                                    </div>
                                    <div className="text-[10px] text-text-secondary font-medium tabular-nums mt-0.5">
                                      ₹{h.totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </div>
                                  </td>

                                  {/* Action Row */}
                                  <td className="p-4 sm:p-5 text-right">
                                    <Link 
                                      href={`/stock/${h.symbol}`}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 border border-border hover:border-emerald-500/20 bg-background hover:bg-emerald-500/5 text-text-secondary hover:text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                                    >
                                      Trade
                                      <ChevronRight className="w-3.5 h-3.5" />
                                    </Link>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={6} className="p-12 text-center text-xs text-text-secondary font-bold">
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

                    {/* Mobile cards list */}
                    <div className="block sm:hidden space-y-3 p-4 bg-background/20">
                      {state.holdings.length > 0 ? (
                        state.holdings.map((h) => {
                          const quote = livePrices[h.symbol];
                          const ltp = quote ? quote.price : h.avgBuyPrice;
                          const pct = quote ? quote.pct : 0;
                          const isStockPositive = pct >= 0;
                          const currentValue = ltp * h.quantity;
                          const pnl = currentValue - h.totalInvested;
                          const pnlPct = h.totalInvested > 0 ? (pnl / h.totalInvested) * 105 : 0;
                          const isPnLPositive = pnl >= 0;

                          const lastBuyOrder = state.history.find(hist => hist.symbol === h.symbol && hist.side === 'BUY' && hist.status === 'EXECUTED');
                          const purchaseDate = lastBuyOrder 
                            ? new Date(lastBuyOrder.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                            : 'N/A';
                          const isBoughtToday = lastBuyOrder && new Date(lastBuyOrder.timestamp).toDateString() === new Date().toDateString();

                          const holdingDayPnL = isBoughtToday 
                            ? (ltp - h.avgBuyPrice) * h.quantity 
                            : (quote ? quote.change : 0) * h.quantity;
                          const holdingDayPnLPct = isBoughtToday
                            ? (h.avgBuyPrice > 0 ? ((ltp - h.avgBuyPrice) / h.avgBuyPrice) * 100 : 0)
                            : pct;
                          const isHoldingDayPnLPositive = holdingDayPnL >= 0;

                          return (
                            <div key={h.symbol} className="p-4 rounded-2xl border border-border bg-card flex flex-col gap-3.5 shadow-sm relative overflow-hidden">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    {renderSymbolName(h.symbol)}
                                    <span className="text-[8px] font-black text-text-secondary/75 uppercase bg-background border border-border px-1 py-0.5 rounded">CNC</span>
                                  </div>
                                  <div className="text-[10px] text-text-secondary font-semibold mt-1">
                                    {h.quantity} shares • Avg: ₹{h.avgBuyPrice.toFixed(2)}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end">
                                  <span className="text-xs font-mono font-black text-text-primary">₹{ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                  <span className={`text-[9px] font-black mt-0.5 ${isStockPositive ? 'text-profit' : 'text-loss'}`}>
                                    {isStockPositive ? '▲ +' : '▼ '}{pct.toFixed(2)}%
                                  </span>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40 text-[10px]">
                                <div>
                                  <span className="text-text-secondary font-semibold">Total Invested:</span>
                                  <div className="font-mono font-extrabold text-text-primary mt-0.5">₹{h.totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                </div>
                                <div>
                                  <span className="text-text-secondary font-semibold">Current Value:</span>
                                  <div className="font-mono font-extrabold text-text-primary mt-0.5">{isMasked ? '•••••' : `₹${currentValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}</div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40 text-[10px]">
                                <div>
                                  <span className="text-text-secondary font-semibold">Total PnL Returns:</span>
                                  <div className={`font-mono font-black mt-0.5 ${isPnLPositive ? 'text-profit' : 'text-loss'}`}>
                                    {isMasked ? '•••••' : `${isPnLPositive ? '+' : ''}₹${pnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} ({isPnLPositive ? '+' : ''}{pnlPct.toFixed(2)}%)
                                  </div>
                                </div>
                                <div>
                                  <span className="text-text-secondary font-semibold">1D Return:</span>
                                  <div className={`font-mono font-black mt-0.5 ${isHoldingDayPnLPositive ? 'text-profit' : 'text-loss'}`}>
                                    {isMasked ? '•••••' : `${isHoldingDayPnLPositive ? '+' : ''}₹${holdingDayPnL.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} ({isHoldingDayPnLPositive ? '+' : ''}{holdingDayPnLPct.toFixed(2)}%)
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-2.5 border-t border-border/40 text-[9px] text-text-secondary font-semibold">
                                <span>Bought: {purchaseDate}</span>
                                <Link 
                                  href={`/stock/${h.symbol}`}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-profit text-black rounded-xl font-black uppercase tracking-wider transition-all duration-150 active:scale-95 shadow-sm shadow-profit/10"
                                >
                                  Trade
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-10 bg-card rounded-2xl border border-border p-4">
                          <TrendingUp className="h-8 w-8 text-text-secondary/30 mx-auto mb-2 animate-pulse" />
                          <span className="text-[10px] text-text-secondary font-semibold block">No delivery holdings found.</span>
                          <Link 
                            href="/?tab=explore"
                            className="mt-3 inline-block px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black rounded-xl text-[9px] font-black uppercase tracking-wider shadow-md shadow-emerald-500/10 active:scale-[0.98]"
                          >
                            Explore Stocks to Buy
                          </Link>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {activeTab === 'history' && (
                  <>
                    {/* Desktop table */}
                    <div className="hidden sm:block overflow-x-auto">
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
                                  {renderSymbolName(h.symbol)}
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

                    {/* Mobile cards list */}
                    <div className="block sm:hidden space-y-3 p-4 bg-background/20">
                      {state.history.length > 0 ? (
                        state.history.map((h) => (
                          <div key={h.id} className="p-4 rounded-2xl border border-border bg-card flex flex-col gap-2 shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  {renderSymbolName(h.symbol)}
                                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                                    h.side === 'BUY' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-500'
                                  }`}>
                                    {h.side}
                                  </span>
                                  <span className="text-[8px] font-black text-text-secondary/85 uppercase bg-background border border-border px-1 py-0.5 rounded">{h.productType}</span>
                                </div>
                                <span className="text-[8px] text-text-secondary font-semibold block mt-1">
                                  {new Date(h.timestamp).toLocaleString('en-IN', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              
                              <span className={`px-2 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-wider shrink-0 ${
                                h.status === 'EXECUTED'
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                  : h.status === 'CANCELLED'
                                  ? 'bg-slate-500/10 border-slate-500/20 text-text-secondary'
                                  : 'bg-red-500/10 border-red-500/20 text-red-500'
                              }`}>
                                {h.status}
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/40 text-[10px] font-semibold text-text-secondary">
                              <div>
                                <span>Quantity:</span>
                                <div className="font-extrabold text-text-primary mt-0.5">{h.quantity}</div>
                              </div>
                              <div>
                                <span>Price:</span>
                                <div className="font-mono font-extrabold text-text-primary mt-0.5">₹{h.executionPrice?.toFixed(2)}</div>
                              </div>
                              <div>
                                <span>Fees Paid:</span>
                                <div className="font-mono font-extrabold text-text-primary mt-0.5">₹{(h.brokerage + h.taxes).toFixed(2)}</div>
                              </div>
                            </div>

                            {h.rejectionReason && (
                              <div className="mt-1.5 p-2 bg-red-500/5 border border-red-500/10 text-red-400 rounded-lg text-[9px] font-bold">
                                Reason: {h.rejectionReason}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-10 bg-card rounded-2xl border border-border p-4">
                          <History className="h-8 w-8 text-text-secondary/30 mx-auto mb-2" />
                          <span className="text-[10px] text-text-secondary font-semibold block">No completed trades found.</span>
                        </div>
                      )}
                    </div>
                  </>
                )}

              </div>
            </div>

            {/* Right Column (Info widget, cash balance, search help) */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Premium Virtual Cash & Margin Dashboard */}
              <div className="bg-card border border-border rounded-3xl p-6 space-y-5 shadow-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-black text-text-secondary uppercase tracking-widest">
                      Virtual Margin Account
                    </h3>
                    <p className="text-[9px] text-text-secondary font-semibold mt-0.5">Practice trading with risk-free capital</p>
                  </div>
                  <div className="h-9 w-9 bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 rounded-xl flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/5">
                    <Wallet className="w-4.5 h-4.5" />
                  </div>
                </div>

                <div className="space-y-1 py-1">
                  <span className="text-[9px] font-black text-text-secondary uppercase tracking-wider block">Available Margin Cash</span>
                  <div className="text-3xl font-mono font-black text-text-primary tracking-tight">
                    ₹{state.cash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                {/* Dashboard Action Tiles Grid */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/60">
                  <button
                    onClick={handleAddMoney}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 hover:text-emerald-350 transition-all duration-200 cursor-pointer active:scale-95 text-center gap-1.5"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Add ₹1 Lakh</span>
                  </button>

                  <button
                    onClick={handleResetSimulator}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/15 text-rose-400 hover:text-rose-350 transition-all duration-200 cursor-pointer active:scale-95 text-center gap-1.5"
                  >
                    <RefreshCw className="w-4 h-4 stroke-[3]" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Reset Account</span>
                  </button>
                </div>
              </div>

              {/* Select a stock Widget */}
              <div className="bg-card border border-border rounded-3xl p-6 space-y-6 shadow-sm">
                <div className="text-center py-6 space-y-4">
                  <div className="relative h-20 w-20 mx-auto bg-emerald-500/5 rounded-2xl border border-emerald-500/10 flex items-center justify-center">
                    <div className="absolute h-10 w-10 border border-emerald-400/20 rounded-full animate-ping" />
                    <PlayCircle className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-text-primary">Select a stock to get started</h4>
                    <p className="text-[10px] text-text-secondary font-medium leading-normal max-w-xs mx-auto">
                      Type any Indian stock name in the global search bar above or click one of the suggestions below to trade.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-border/60">
                  <h5 className="text-[10px] font-black text-text-secondary uppercase tracking-widest">
                    Popular suggestions
                  </h5>
                  <div className="grid grid-cols-2 gap-2">
                    {['TRENT', 'HDFCBANK', 'ICICIBANK', 'INFY', 'RELIANCE', 'TCS'].map((sym) => (
                      <Link
                        key={sym}
                        href={`/stock/${sym}`}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-background hover:bg-card-hover text-[10px] font-black text-text-primary hover:text-emerald-400 transition-colors uppercase tracking-wider"
                      >
                        {sym}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </main>
  );
}
