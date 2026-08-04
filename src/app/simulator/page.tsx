'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, Wallet, ArrowLeft, RefreshCw, 
  ChevronRight, PlayCircle, BarChart3, Plus
} from 'lucide-react';
import { useStockStore } from '@/store/useStockStore';

// Modular Sub-components
import SimulatorHero from '@/features/simulator/components/SimulatorHero';
import SimulatorHoldingsTab from '@/features/simulator/components/SimulatorHoldingsTab';
import SimulatorHistoryTab from '@/features/simulator/components/SimulatorHistoryTab';
import SimulatorAnalytics from '@/features/simulator/components/SimulatorAnalytics';
import OrderPlacementModal from '@/components/OrderPlacementModal';

// Reusable Custom Hook
import { useSimulatorDetails } from '@/hooks/useSimulatorDetails';

export default function SimulatorPage() {
  const { userId, toggleAuthModal } = useStockStore();
  const [activeTab, setActiveTab] = useState<'holdings' | 'history'>('holdings');
  const [isMasked, setIsMasked] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  
  // Trade Modal State
  const [selectedTrade, setSelectedTrade] = useState<{ symbol: string; livePrice: number } | null>(null);

  // Load simulator data utilizing custom hook
  const {
    state,
    livePrices,
    loading,
    handleAddMoney,
    handleResetSimulator,
  } = useSimulatorDetails(userId);

  // Compute Portfolio Math
  let holdingsInvested = 0;
  let holdingsCurrentValue = 0;
  let holdingsDayPnL = 0;

  state.holdings.forEach((h) => {
    const quote = livePrices[h.symbol];
    const currentPrice = quote && typeof quote.price === 'number' ? quote.price : h.avgBuyPrice;
    const change = quote && typeof quote.change === 'number' ? quote.change : 0;
    
    const lastBuyOrder = state.history.find(
      (hist) => hist.symbol === h.symbol && hist.side === 'BUY' && hist.status === 'EXECUTED'
    );
    const isBoughtToday = lastBuyOrder && new Date(lastBuyOrder.timestamp).toDateString() === new Date().toDateString();
    
    const holdingDayPnLVal = isBoughtToday 
      ? (currentPrice - h.avgBuyPrice) * h.quantity 
      : change * h.quantity;

    holdingsInvested += h.totalInvested;
    holdingsCurrentValue += currentPrice * h.quantity;
    holdingsDayPnL += holdingDayPnLVal;
  });

  let positionsUnrealizedPnL = 0;

  state.positions.forEach((p) => {
    if (p.quantity !== 0) {
      const quote = livePrices[p.symbol];
      const currentPrice = quote && typeof quote.price === 'number' ? quote.price : p.avgPrice;
      
      const uPnL = p.quantity > 0 
        ? (currentPrice - p.avgPrice) * p.quantity
        : (p.avgPrice - currentPrice) * Math.abs(p.quantity);
      
      positionsUnrealizedPnL += uPnL;
    }
  });

  const totalHoldingsPnL = holdingsCurrentValue - holdingsInvested;

  const totalInvested = holdingsInvested;
  const netWorth = state.cash + holdingsCurrentValue + positionsUnrealizedPnL;
  
  // Enforce mathematically consistent visual metrics for active holdings portfolio
  const overallPnL = totalHoldingsPnL;
  const dayPnL = holdingsDayPnL;

  // Generate pie chart segments for holdings
  const holdingsSegments = state.holdings.map((h) => {
    const quote = livePrices[h.symbol];
    const val = (quote ? quote.price : h.avgBuyPrice) * h.quantity;
    return {
      symbol: h.symbol.replace('.NS', ''),
      value: val
    };
  });
  const totalHoldingVal = holdingsSegments.reduce((acc, s) => acc + s.value, 0);

  // Authenticate user state check
  if (!userId) {
    return (
      <main className="min-h-screen bg-background text-text-primary selection:bg-emerald-500/20 flex flex-col">
        <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/60 px-4 sm:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors group">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Back to Dashboard
          </Link>
          <span className="text-sm font-black tracking-tight select-none bg-gradient-to-r from-profit to-indigo-500 bg-clip-text text-transparent">OnlyProfit</span>
        </nav>
        
        <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto p-6 text-center space-y-6">
          <div className="h-16 w-16 bg-profit/10 text-profit border border-profit/15 rounded-3xl flex items-center justify-center shadow-lg shadow-profit/5">
            <Wallet className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-text-primary tracking-tight">Access Simulated Trading</h2>
            <p className="text-xs text-text-secondary leading-relaxed font-semibold">
              Please sign in or create an account to start practice trading, track virtual holdings, limit orders, and performance analytics.
            </p>
          </div>
          <button
            onClick={() => toggleAuthModal()}
            className="w-full py-3.5 bg-profit text-white rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-profit-dark transition-colors shadow-lg shadow-profit/25 active:scale-[0.98] cursor-pointer"
          >
            Create Free Account / Sign In
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-text-primary selection:bg-emerald-500/20 pb-20">
      
      {/* Navigation header */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/60 px-4 sm:px-8 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors group">
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Back to Dashboard
        </Link>
        <span className="text-sm font-black tracking-tight select-none bg-gradient-to-r from-profit to-indigo-500 bg-clip-text text-transparent">OnlyProfit Simulator</span>
      </nav>

      <div className="mx-auto max-w-7xl px-4 sm:px-8 py-8 space-y-6">
        
        {/* Hero Banner Component */}
        <SimulatorHero
          cash={state.cash}
          holdingsCurrentValue={holdingsCurrentValue}
          totalInvested={totalInvested}
          dayPnL={dayPnL}
          overallPnL={overallPnL}
          isMasked={isMasked}
          setIsMasked={setIsMasked}
          onAddMoney={handleAddMoney}
          onResetSimulator={handleResetSimulator}
          loading={loading}
        />

        {/* Dynamic Analytics & Collapsible trigger */}
        <div className="flex justify-between items-center bg-card border border-border p-4 rounded-2xl shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-text-secondary">
            <BarChart3 className="h-4.5 w-4.5 text-profit" />
            <span>Interactive Portfolio Statistics</span>
          </div>
          
          <button
            onClick={() => setShowAnalysis(!showAnalysis)}
            className="text-[10px] font-black uppercase text-profit hover:underline cursor-pointer"
          >
            {showAnalysis ? 'Hide Analytics' : 'Show Analytics'}
          </button>
        </div>

        {showAnalysis && state.holdings.length > 0 && (
          <SimulatorAnalytics
            holdingsCount={state.holdings.length}
            holdingsSegments={holdingsSegments}
            totalHoldingVal={totalHoldingVal}
            overallPnL={overallPnL}
            netWorth={netWorth}
          />
        )}

        {/* Tab Selection Layout Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 items-start">
          
          {/* Left Column (2/3 width) - holdings and logs */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="flex items-center gap-1.5 p-1 bg-card border border-border/80 rounded-2xl w-full sm:w-max select-none">
              <button
                onClick={() => setActiveTab('holdings')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeTab === 'holdings'
                    ? 'bg-background text-emerald-400 border border-border shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Holdings (CNC)
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-background text-emerald-400 border border-border shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Trade History
              </button>
            </div>

            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-soft dark:shadow-soft-dark">
              {activeTab === 'holdings' && (
                <SimulatorHoldingsTab
                  holdings={state.holdings}
                  livePrices={livePrices}
                  history={state.history}
                  isMasked={isMasked}
                  onOpenTradeModal={(symbol, side, livePrice) => setSelectedTrade({ symbol, livePrice })}
                />
              )}

              {activeTab === 'history' && (
                <SimulatorHistoryTab history={state.history} />
              )}
            </div>

            {/* Order Placement Modal for Buy More or Redeem Holdings */}
            {selectedTrade && (
              <OrderPlacementModal
                isOpen={!!selectedTrade}
                onClose={() => setSelectedTrade(null)}
                symbol={selectedTrade.symbol}
                stockName={selectedTrade.symbol.replace('MF_', '').replace('.NS', '')}
                livePrice={selectedTrade.livePrice}
                onOrderExecuted={() => setSelectedTrade(null)}
              />
            )}

          </div>

          {/* Right Column sidebar suggestions */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* margin dashboard widget */}
            <div className="bg-card border border-border rounded-3xl p-6 space-y-5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-profit/5 rounded-full filter blur-xl pointer-events-none" />
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

            {/* Popular stocks helper navigation list */}
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

      </div>
    </main>
  );
}
