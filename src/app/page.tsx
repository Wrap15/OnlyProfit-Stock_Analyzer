'use client';

import React, { useState, useEffect } from 'react';
import { useStockStore } from '@/store/useStockStore';
import StockCard from '@/components/StockCard';
import StockLogo from '@/components/StockLogo';
import { apiClient as axios } from '@/lib/apiClient';
import MutualFundCard from '@/components/MutualFundCard';
import ThematicBaskets from '@/components/ThematicBaskets';
import { ArrowUpRight, ArrowDownRight, Star, Sparkles, LayoutGrid, Search, BookOpen, Activity } from 'lucide-react';
import Link from 'next/link';

interface MarketGainerLoser {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
}

const MONITOR_SYMBOLS = [
  'RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS',
  'SBIN.NS', 'BHARTIAIRTEL.NS', 'LT.NS', 'ITC.NS', 'TATAMOTORS.NS',
  'WIPRO.NS', 'HCLTECH.NS', 'ASIANPAINT.NS', 'AXISBANK.NS', 'BAJFINANCE.NS',
  'BAJAJFINSV.NS', 'BPCL.NS', 'COALINDIA.NS', 'HINDUNILVR.NS', 'JSWSTEEL.NS',
  'KOTAKBANK.NS', 'M&M.NS', 'MARUTI.NS', 'NESTLEIND.NS', 'NTPC.NS',
  'ONGC.NS', 'POWERGRID.NS', 'SUNPHARMA.NS', 'TATASTEEL.NS', 'TITAN.NS',
  'ULTRACEMCO.NS', 'ADANIENT.NS', 'ADANIPORTS.NS', 'GRASIM.NS', 'HEROMOTOCO.NS',
  'HINDALCO.NS', 'JIOFIN.NS'
];

const TRENDING_SYMBOLS = ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'TATAMOTORS.NS', 'HDFCBANK.NS', 'JIOFIN.NS', 'SBIN.NS', 'BHARTIAIRTEL.NS'];

// Tickertape-style Curated Collections
const BLUE_CHIP_SYMBOLS = ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'LT.NS', 'ITC.NS'];
const HIGH_GROWTH_SYMBOLS = ['TATAMOTORS.NS', 'JIOFIN.NS', 'ADANIENT.NS', 'ADANIPORTS.NS', 'MARUTI.NS', 'M&M.NS'];
const DIVIDEND_SYMBOLS = ['COALINDIA.NS', 'BPCL.NS', 'ONGC.NS', 'POWERGRID.NS', 'ITC.NS'];
const DEBT_FREE_SYMBOLS = ['TCS.NS', 'INFY.NS', 'WIPRO.NS', 'HCLTECH.NS', 'ITC.NS', 'NESTLEIND.NS'];

type TabType = 'watchlist' | 'trending' | 'explore';

export default function Home() {
  const { watchlist } = useStockStore();
  const [marketQuotes, setMarketQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('trending');
  const [searchFilter, setSearchFilter] = useState('');
  const [activeCollection, setActiveCollection] = useState<'all' | 'bluechip' | 'growth' | 'dividend' | 'debtfree'>('all');

  // Mutual Funds States
  const [activeMFCategory, setActiveMFCategory] = useState<string>('all');
  const [mutualFunds, setMutualFunds] = useState<any[]>([]);
  const [mfLoading, setMFLoading] = useState<boolean>(true);



  useEffect(() => {
    async function fetchMutualFunds() {
      try {
        setMFLoading(true);
        const url = activeMFCategory === 'all'
          ? '/api/stock/mutualfund'
          : `/api/stock/mutualfund?category=${activeMFCategory}`;
        const res = await axios.get(url);
        setMutualFunds(res.data || []);
      } catch (err) {
        console.error('Failed to fetch mutual funds', err);
      } finally {
        setMFLoading(false);
      }
    }
    fetchMutualFunds();
  }, [activeMFCategory]);

  useEffect(() => {
    async function fetchMarketData() {
      try {
        const symbolsParam = MONITOR_SYMBOLS.join(',');
        const res = await axios.get(`/api/stock/quote?symbols=${symbolsParam}`);
        setMarketQuotes(res.data || []);
      } catch (err) {
        console.error('Failed to fetch market metrics', err);
      } finally {
        setLoading(false);
      }
    }

    fetchMarketData();
    const interval = setInterval(fetchMarketData, 30000); // 30 seconds polling
    return () => clearInterval(interval);
  }, []);

  // Compute gainers & losers
  const sortedQuotes = [...marketQuotes].sort((a, b) => b.regularMarketChangePercent - a.regularMarketChangePercent);
  const gainers: MarketGainerLoser[] = sortedQuotes.slice(0, 5).map(q => ({
    symbol: q.symbol,
    name: q.shortName,
    price: q.regularMarketPrice,
    changePercent: q.regularMarketChangePercent
  }));
  
  // Clean filter losers and avoid indexes
  const losers: MarketGainerLoser[] = sortedQuotes
    .filter(q => !q.symbol.startsWith('^'))
    .slice(-5)
    .reverse()
    .map(q => ({
      symbol: q.symbol,
      name: q.shortName,
      price: q.regularMarketPrice,
      changePercent: q.regularMarketChangePercent
    }));

  // Compute most active stocks by trading volume
  const mostActive = [...marketQuotes]
    .filter(q => !q.symbol.startsWith('^'))
    .sort((a, b) => b.regularMarketVolume - a.regularMarketVolume)
    .slice(0, 5)
    .map(q => ({
      symbol: q.symbol,
      name: q.shortName,
      price: q.regularMarketPrice,
      changePercent: q.regularMarketChangePercent,
      volume: q.regularMarketVolume
    }));

  const formatVolume = (num: number) => {
    if (!num) return '0';
    if (num >= 10000000) { // 1 Crore
      return `${(num / 10000000).toFixed(2)} Cr`;
    } else if (num >= 100000) { // 1 Lakh
      return `${(num / 100000).toFixed(2)} L`;
    }
    return num.toLocaleString('en-IN');
  };

  // Filtering explore list based on search and collection filters
  const filteredExploreSymbols = MONITOR_SYMBOLS.filter(sym => {
    if (activeCollection === 'bluechip' && !BLUE_CHIP_SYMBOLS.includes(sym)) return false;
    if (activeCollection === 'growth' && !HIGH_GROWTH_SYMBOLS.includes(sym)) return false;
    if (activeCollection === 'dividend' && !DIVIDEND_SYMBOLS.includes(sym)) return false;
    if (activeCollection === 'debtfree' && !DEBT_FREE_SYMBOLS.includes(sym)) return false;

    const quote = marketQuotes.find(q => q.symbol === sym);
    const name = quote?.shortName || sym;
    return sym.toLowerCase().includes(searchFilter.toLowerCase()) || name.toLowerCase().includes(searchFilter.toLowerCase());
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-300">
      
      {/* Hero Header Section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary sm:text-4xl">
            OnlyProfit — <span className="text-profit">Smart Investing</span>
          </h1>
          <p className="mt-2 text-base text-text-secondary max-w-2xl font-medium">
            Real-time analytics, charts, and key performance metrics for NSE-listed Indian equities. 
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-text-secondary bg-card border border-border px-3 py-1.5 rounded-xl">
          <BookOpen className="h-4 w-4 text-profit" />
          <span>NSE Exchange Feed Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        
        {/* Left Column: Explorer Board (Grid Column Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Custom Premium Capsule Tabs */}
          <div className="flex overflow-x-auto scrollbar-none max-w-full gap-2 p-1 bg-card border border-border/70 rounded-xl self-start">
            <button
              onClick={() => setActiveTab('trending')}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all duration-200 flex items-center gap-1.5 shrink-0 ${
                activeTab === 'trending'
                  ? 'bg-profit/10 text-profit border border-profit/20 shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-background border border-transparent'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" /> Trending
            </button>
            
            <button
              onClick={() => setActiveTab('watchlist')}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all duration-200 flex items-center gap-1.5 shrink-0 ${
                activeTab === 'watchlist'
                  ? 'bg-profit/10 text-profit border border-profit/20 shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-background border border-transparent'
              }`}
            >
              <Star className="h-3.5 w-3.5" /> My Watchlist
              <span className="ml-1 px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-background border border-border/80 text-text-secondary">
                {watchlist.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('explore')}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all duration-200 flex items-center gap-1.5 shrink-0 ${
                activeTab === 'explore'
                  ? 'bg-profit/10 text-profit border border-profit/20 shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-background border border-transparent'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> All NSE Stocks
              <span className="ml-1 px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-background border border-border/80 text-text-secondary">
                {MONITOR_SYMBOLS.length}
              </span>
            </button>
          </div>

          {/* TAB 1: TRENDING */}
          {activeTab === 'trending' && (
            <div className="grid grid-cols-1 gap-2.5 sm:gap-4 sm:grid-cols-2 animate-fade-in gpu-layer">
              {TRENDING_SYMBOLS.map((symbol) => (
                <StockCard key={symbol} symbol={symbol} />
              ))}
            </div>
          )}

          {/* TAB 2: WATCHLIST */}
          {activeTab === 'watchlist' && (
            <div className="animate-fade-in gpu-layer">
              {watchlist.length > 0 ? (
                <div className="grid grid-cols-1 gap-2.5 sm:gap-4 sm:grid-cols-2">
                  {watchlist.map((symbol) => (
                    <StockCard key={symbol} symbol={symbol} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border p-12 bg-card/40 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-background border border-border text-text-secondary mb-4">
                    <Star className="h-5 w-5" />
                  </div>
                  <h3 className="font-extrabold text-sm text-text-primary">Watchlist is empty</h3>
                  <p className="mt-1 text-xs text-text-secondary max-w-xs font-medium">
                    Search for equities and click the star icon to populate your watchlist tracker.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EXPLORE ALL STOCKS */}
          {activeTab === 'explore' && (
            <div className="space-y-4 animate-fade-in gpu-layer">
              {/* Search and Curated Collections Pills */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative max-w-xs w-full">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-4 w-4 text-text-secondary" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search explore list..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full h-9 pl-9 pr-4 rounded-xl border border-border bg-card text-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-profit/20 focus:border-profit transition-all duration-200"
                  />
                </div>

                <div className="flex overflow-x-auto scrollbar-none max-w-full gap-1.5 p-1 bg-card border border-border/70 rounded-xl">
                  {[
                    { id: 'all', label: 'All Stocks' },
                    { id: 'bluechip', label: 'Blue Chips' },
                    { id: 'growth', label: 'High Growth' },
                    { id: 'dividend', label: 'High Dividend' },
                    { id: 'debtfree', label: 'Debt Free' }
                  ].map((col) => (
                    <button
                      key={col.id}
                      onClick={() => setActiveCollection(col.id as any)}
                      className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black shrink-0 transition-all duration-200 ${
                        activeCollection === col.id
                          ? 'bg-profit/10 text-profit border border-profit/15 shadow-sm'
                          : 'text-text-secondary hover:text-text-primary hover:bg-background border border-transparent'
                      }`}
                    >
                      {col.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredExploreSymbols.length > 0 ? (
                <div className="grid grid-cols-1 gap-2.5 sm:gap-4 sm:grid-cols-2">
                  {filteredExploreSymbols.map((symbol) => (
                    <StockCard key={symbol} symbol={symbol} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-sm text-text-secondary font-bold">
                  No stocks match &quot;{searchFilter}&quot;
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Column: Gainers, Losers & Most Active (Grid Column Span 1) */}
        <div className="space-y-6">
          
          {/* Top Gainers Card */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft dark:shadow-soft-dark">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-profit/10 text-profit">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
                <h3 className="font-extrabold text-sm text-text-primary tracking-tight">
                  Top Gainers
                </h3>
              </div>
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                NSE
              </span>
            </div>

            {loading ? (
              <div className="space-y-3 py-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex justify-between items-center p-1">
                    <div className="space-y-1.5 flex-1 max-w-[60%]">
                      <div className="h-3.5 w-16 animate-shimmer rounded" />
                      <div className="h-2.5 w-28 animate-shimmer rounded" />
                    </div>
                    <div className="flex flex-col items-end space-y-1.5 shrink-0">
                      <div className="h-3.5 w-16 animate-shimmer rounded" />
                      <div className="h-2.5 w-10 animate-shimmer rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1 animate-fade-in">
                {gainers.map((stock) => (
                  <Link
                    key={stock.symbol}
                    href={`/stock/${stock.symbol}`}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-background transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <StockLogo symbol={stock.symbol} size="sm" />
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-text-primary group-hover:text-profit transition-colors truncate">
                          {stock.symbol.split('.')[0]}
                        </div>
                        <div className="text-[10px] text-text-secondary truncate max-w-[100px] font-medium">
                          {stock.name}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs font-bold text-text-primary">
                        ₹{stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] font-extrabold text-profit flex items-center gap-0.5 mt-0.5">
                        +{stock.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Top Losers Card */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft dark:shadow-soft-dark">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-loss/10 text-loss">
                  <ArrowDownRight className="h-4 w-4" />
                </div>
                <h3 className="font-extrabold text-sm text-text-primary tracking-tight">
                  Top Losers
                </h3>
              </div>
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                NSE
              </span>
            </div>

            {loading ? (
              <div className="space-y-3 py-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex justify-between items-center p-1">
                    <div className="space-y-1.5 flex-1 max-w-[60%]">
                      <div className="h-3.5 w-16 animate-shimmer rounded" />
                      <div className="h-2.5 w-28 animate-shimmer rounded" />
                    </div>
                    <div className="flex flex-col items-end space-y-1.5 shrink-0">
                      <div className="h-3.5 w-16 animate-shimmer rounded" />
                      <div className="h-2.5 w-10 animate-shimmer rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1 animate-fade-in">
                {losers.map((stock) => (
                  <Link
                    key={stock.symbol}
                    href={`/stock/${stock.symbol}`}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-background transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <StockLogo symbol={stock.symbol} size="sm" />
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-text-primary group-hover:text-loss transition-colors truncate">
                          {stock.symbol.split('.')[0]}
                        </div>
                        <div className="text-[10px] text-text-secondary truncate max-w-[100px] font-medium">
                          {stock.name}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs font-bold text-text-primary">
                        ₹{stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] font-extrabold text-loss flex items-center gap-0.5 mt-0.5">
                        {stock.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Most Active Stocks Card */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft dark:shadow-soft-dark">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
                  <Activity className="h-4 w-4" />
                </div>
                <h3 className="font-extrabold text-sm text-text-primary tracking-tight">
                  Most Active Stocks
                </h3>
              </div>
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                Volume
              </span>
            </div>

            {loading ? (
              <div className="space-y-3 py-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex justify-between items-center p-1">
                    <div className="space-y-1.5 flex-1 max-w-[60%]">
                      <div className="h-3.5 w-16 animate-shimmer rounded" />
                      <div className="h-2.5 w-28 animate-shimmer rounded" />
                    </div>
                    <div className="flex flex-col items-end space-y-1.5 shrink-0">
                      <div className="h-3.5 w-16 animate-shimmer rounded" />
                      <div className="h-2.5 w-10 animate-shimmer rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1 animate-fade-in">
                {mostActive.map((stock) => {
                  const isStockPositive = stock.changePercent >= 0;
                  return (
                    <Link
                      key={stock.symbol}
                      href={`/stock/${stock.symbol}`}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-background transition-colors group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <StockLogo symbol={stock.symbol} size="sm" />
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-text-primary group-hover:text-profit transition-colors truncate">
                            {stock.symbol.split('.')[0]}
                          </div>
                          <div className="text-[10px] text-text-secondary truncate max-w-[100px] font-medium">
                            Vol: {formatVolume(stock.volume)}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-xs font-bold text-text-primary">
                          ₹{stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                        <span className={`text-[10px] font-extrabold flex items-center gap-0.5 mt-0.5 ${isStockPositive ? 'text-profit' : 'text-loss'}`}>
                          {isStockPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Mutual Funds Explorer Section */}
      <div id="mutual-funds" className="mt-12 pt-10 border-t border-border/60 space-y-6 animate-fade-in gpu-layer">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-text-primary tracking-tight">
              Simulated Mutual Funds
            </h2>
            <p className="text-xs text-text-secondary font-medium mt-1">
              Explore top direct-growth mutual funds in India categorized by asset class, with live NAV rates.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex overflow-x-auto scrollbar-none max-w-full gap-2 p-1 bg-card border border-border/70 rounded-xl self-start">
            {[
              { id: 'all', label: 'All Funds' },
              { id: 'smallcap', label: 'Small Cap' },
              { id: 'midcap', label: 'Mid Cap' },
              { id: 'flexicap', label: 'Flexi Cap' },
              { id: 'multicap', label: 'Multi Cap' },
              { id: 'index', label: 'Index Funds' }
            ].map((cat) => (
               <button
                 key={cat.id}
                 onClick={() => setActiveMFCategory(cat.id)}
                 className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all duration-200 shrink-0 ${
                   activeMFCategory === cat.id
                     ? 'bg-profit/10 text-profit border border-profit/20 shadow-sm'
                     : 'text-text-secondary hover:text-text-primary hover:bg-background border border-transparent'
                 }`}
               >
                 {cat.label}
               </button>
            ))}
          </div>
        </div>

        {/* Mutual Funds Grid */}
        {mfLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col w-full rounded-2xl border border-border bg-card p-5 gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 animate-shimmer rounded-xl shrink-0" />
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="h-4 w-3/4 animate-shimmer rounded" />
                    <div className="h-3 w-1/4 animate-shimmer rounded" />
                  </div>
                </div>
                <div className="flex justify-between items-baseline mt-4">
                  <div className="space-y-1.5">
                    <div className="h-2.5 w-16 animate-shimmer rounded" />
                    <div className="h-5 w-24 animate-shimmer rounded" />
                  </div>
                  <div className="space-y-1.5 flex flex-col items-end">
                    <div className="h-2.5 w-16 animate-shimmer rounded" />
                    <div className="h-5 w-16 animate-shimmer rounded" />
                  </div>
                </div>
                <div className="flex justify-between items-end mt-4 pt-3 border-t border-border/30">
                  <div className="h-3 w-12 animate-shimmer rounded" />
                  <div className="h-6 w-24 animate-shimmer rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : mutualFunds.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mutualFunds.map((fund) => (
              <MutualFundCard key={fund.code} fund={fund} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-sm text-text-secondary font-black bg-card border border-border rounded-2xl">
            No mutual funds found in this category.
          </div>
        )}
      </div>

      {/* Thematic Stock Baskets Section (Smallcases mock) */}
      <div id="thematic-baskets" className="mt-12 pt-10 border-t border-border/60">
        <ThematicBaskets />
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "OnlyProfit",
            "url": "https://onlyprofit.com",
            "description": "Analyze Indian Equities in real-time with interactive charts, technical indicators, and live market data. Estimate mutual fund yields with the built-in SIP/Lumpsum calculator."
          })
        }}
      />
    </div>
  );
}
