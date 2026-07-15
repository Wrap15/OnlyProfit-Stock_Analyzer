'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Star, ChevronDown, Sparkles } from 'lucide-react';
import { useStockStore } from '@/store/useStockStore';
import StockCard from '@/components/StockCard';
import StockLogo from '@/components/StockLogo';
import { apiClient } from '@/lib/apiClient';
import { getNextThursdays } from '@/lib/foUtils';
import { MUTUAL_FUNDS } from '@/lib/mutualfunds';
import { useDashboardQuotes } from '@/hooks/useDashboardQuotes';
import { TRENDING_SYMBOLS, MOST_SEARCHED_SYMBOLS } from '@/constants/marketSymbols';

// Modular Sections
import DashboardHeroHeader from '@/features/dashboard/components/DashboardHeroHeader';
import RecentlyViewedSection from '@/features/watchlist/components/RecentlyViewedSection';
import ExploreStocksSection from '@/features/dashboard/components/ExploreStocksSection';
import MutualFundsSection from '@/features/dashboard/components/MutualFundsSection';
import OptionChainSection from '@/features/stocks/components/OptionChainSection';
import TodaysStocksSection from '@/features/dashboard/components/TodaysStocksSection';

// Dynamically import heavy widgets to reduce initial bundle size below 200KB
const AISignalsWidget = dynamic(() => import('@/components/AISignalsWidget'), {
  ssr: false,
  loading: () => <div className="h-48 w-full bg-card rounded-2xl border border-border animate-pulse" />
});

const GrowwBlogSection = dynamic(() => import('@/components/GrowwBlogSection'), {
  ssr: false,
  loading: () => <div className="h-48 w-full bg-card rounded-2xl border border-border animate-pulse" />
});

const ThematicBaskets = dynamic(() => import('@/components/ThematicBaskets'), {
  ssr: false,
  loading: () => <div className="h-48 w-full bg-card rounded-2xl border border-border animate-pulse" />
});

const IpoDetailsModal = dynamic(() => import('@/components/IpoDetailsModal'), {
  ssr: false
});

const OrderPlacementModal = dynamic(() => import('@/components/OrderPlacementModal'), {
  ssr: false
});

const IpoSection = dynamic(() => import('@/features/ipo/components/IpoSection'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-text-secondary">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-profit border-t-transparent" />
      <span className="text-xs font-bold">Preparing IPO Feed...</span>
    </div>
  )
});

type TabType = 'watchlist' | 'trending' | 'mostsearched' | 'explore' | 'ipo' | 'fo';

export default function Home() {
  const { watchlist, recentSearches, clearRecentSearches } = useStockStore();
  const [activeTab, setActiveTab] = useState<TabType>('trending');
  const [mounted, setMounted] = useState(false);

  // F&O options tab states
  const expiryDates = useMemo(() => getNextThursdays(), []);
  const [selectedExpiry, setSelectedExpiry] = useState(expiryDates[0].value);
  const [foUnderlying, setFoUnderlying] = useState('^NSEI');

  // Load Quotes utilizing the custom staggered polling hook
  const { marketQuotes, loading } = useDashboardQuotes(activeTab, foUnderlying);

  // IPO States
  const [ipoData, setIpoData] = useState<{ open: any[]; closed: any[]; upcoming: any[] } | null>(null);
  const [ipoLoading, setIpoLoading] = useState(false);
  const [ipoCategory, setIpoCategory] = useState<'mainboard' | 'sme'>('mainboard');
  const [selectedIpoSearchId, setSelectedIpoSearchId] = useState<string | null>(null);

  // Mutual Funds States
  const [activeMFCategory, setActiveMFCategory] = useState<string>('largecap');
  const [mutualFunds, setMutualFunds] = useState<any[]>([]);
  const [mfLoading, setMFLoading] = useState<boolean>(true);
  const [mfReturnDuration, setMfReturnDuration] = useState<'1y' | '3y'>('1y');

  // Order Placement Modal states
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [tradeSymbol, setTradeSymbol] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [tradePrice, setTradePrice] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Initial URL tab sync on mount (runs once)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['watchlist', 'trending', 'mostsearched', 'explore', 'ipo', 'fo'].includes(tabParam)) {
      setActiveTab(tabParam as TabType);
    }
  }, []);

  // 2. React to browser back/forward history navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') || 'trending';
      if (['watchlist', 'trending', 'mostsearched', 'explore', 'ipo', 'fo'].includes(tabParam)) {
        setActiveTab(tabParam as TabType);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 3. Tab switching action that updates URL query params natively
  const handleTabSwitch = (tab: TabType) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.pushState(null, '', url.pathname + url.search);
    }
  };

  // Fetch Mutual Funds
  useEffect(() => {
    async function fetchMutualFunds() {
      try {
        setMFLoading(true);
        const url = activeMFCategory === 'all'
          ? '/api/stock/mutualfund'
          : `/api/stock/mutualfund?category=${activeMFCategory}`;
        const res = await apiClient.get(url);
        setMutualFunds(res.data || []);
      } catch (err) {
        console.error('Failed to fetch mutual funds', err);
      } finally {
        setMFLoading(false);
      }
    }
    fetchMutualFunds();
  }, [activeMFCategory]);

  // Fetch IPOs when active tab is ipo
  useEffect(() => {
    if (activeTab !== 'ipo') return;
    
    async function fetchIPOs() {
      setIpoLoading(true);
      try {
        const res = await apiClient.get('/api/stock/ipo');
        setIpoData(res.data);
      } catch (err) {
        console.error('Failed to fetch IPOs', err);
      } finally {
        setIpoLoading(false);
      }
    }
    
    fetchIPOs();
  }, [activeTab]);

  const handleOpenTradeModal = (symbol: string, name: string, price: number) => {
    setTradeSymbol(symbol);
    setTradeName(name);
    setTradePrice(price);
    setIsOrderModalOpen(true);
  };

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 pb-28 pt-6 sm:py-8 md:py-12 transition-colors duration-300">
      
      {/* Hero Header with clocks & market hours */}
      <DashboardHeroHeader />

      <div className="grid grid-cols-1 gap-8 md:gap-10 lg:grid-cols-3">
        
        {/* Left Column: Explorer Board (Grid Column Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Recently Viewed Panel */}
          <RecentlyViewedSection />

          {/* Custom Premium Capsule Tabs */}
          <div className="flex overflow-x-auto scrollbar-none max-w-full gap-2 p-1 bg-card border border-border/70 rounded-xl self-start">
            {(
              [
                { id: 'trending', label: 'Trending' },
                { id: 'mostsearched', label: 'Most Searched' },
                { id: 'watchlist', label: 'Watchlist' },
                { id: 'explore', label: 'Explore All' },
                { id: 'ipo', label: 'IPO Feed' },
                { id: 'fo', label: 'Options Chain' }
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabSwitch(tab.id)}
                className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all duration-200 active:scale-[0.96] shrink-0 border cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-profit/10 text-profit border-profit/20 shadow-sm'
                    : 'text-text-secondary hover:text-text-primary hover:bg-background border-transparent'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: TRENDING */}
          {activeTab === 'trending' && (
            <div className="animate-fade-in gpu-layer">
              <div className="grid grid-cols-1 gap-2.5 sm:gap-4 sm:grid-cols-2">
                {TRENDING_SYMBOLS.map((symbol) => {
                  const quote = marketQuotes.find((q) => q.symbol === symbol);
                  return <StockCard key={symbol} symbol={symbol} initialQuote={quote} />;
                })}
              </div>
            </div>
          )}

          {/* TAB 2: MOST SEARCHED */}
          {activeTab === 'mostsearched' && (
            <div className="animate-fade-in gpu-layer">
              <div className="grid grid-cols-1 gap-2.5 sm:gap-4 sm:grid-cols-2">
                {MOST_SEARCHED_SYMBOLS.map((symbol) => {
                  const quote = marketQuotes.find((q) => q.symbol === symbol);
                  return <StockCard key={symbol} symbol={symbol} initialQuote={quote} />;
                })}
              </div>
            </div>
          )}

          {/* TAB 3: WATCHLIST */}
          {activeTab === 'watchlist' && (
            <div className="animate-fade-in gpu-layer">
              {watchlist.length > 0 ? (
                <div className="grid grid-cols-1 gap-2.5 sm:gap-4 sm:grid-cols-2">
                  {watchlist.map((symbol) => {
                    const quote = marketQuotes.find((q) => q.symbol === symbol);
                    return <StockCard key={symbol} symbol={symbol} initialQuote={quote} />;
                  })}
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
                  <button 
                    onClick={() => handleTabSwitch('explore')}
                    className="mt-5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 shadow-md shadow-emerald-500/10 active:scale-[0.98] cursor-pointer"
                  >
                    Explore All Stocks
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: EXPLORE ALL STOCKS */}
          {activeTab === 'explore' && (
            <ExploreStocksSection marketQuotes={marketQuotes} />
          )}

          {/* TAB 5: IPO DETAILS TRACKER */}
          {activeTab === 'ipo' && (
            <IpoSection 
              ipoData={ipoData} 
              ipoLoading={ipoLoading} 
              ipoCategory={ipoCategory} 
              setIpoCategory={setIpoCategory} 
              setSelectedIpoSearchId={setSelectedIpoSearchId} 
            />
          )}

          {/* TAB 6: F&O OPTIONS CHAIN DASHBOARD */}
          {activeTab === 'fo' && (
            <OptionChainSection 
              marketQuotes={marketQuotes} 
              expiryDates={expiryDates} 
              selectedExpiry={selectedExpiry} 
              setSelectedExpiry={setSelectedExpiry} 
              foUnderlying={foUnderlying} 
              setFoUnderlying={setFoUnderlying} 
              onTrade={handleOpenTradeModal} 
            />
          )}

        </div>

        {/* Right Column: Gainers, Losers & Most Active */}
        <div className="space-y-6">
          <TodaysStocksSection marketQuotes={marketQuotes} onTrade={handleOpenTradeModal} />
        </div>

      </div>

      {/* Mutual Funds Explorer Section */}
      <div className="mt-12 pt-10 border-t border-border/60">
        <MutualFundsSection 
          mutualFunds={mutualFunds} 
          mfLoading={mfLoading} 
          activeMFCategory={activeMFCategory} 
          setActiveMFCategory={setActiveMFCategory} 
          mfReturnDuration={mfReturnDuration} 
          setMfReturnDuration={setMfReturnDuration} 
        />
      </div>

      {/* AI Market Alerts / SaaS Pro signals */}
      <div id="ai-signals" className="mt-12 pt-10 border-t border-border/60">
        <AISignalsWidget />
      </div>

      {/* Groww Blog Section */}
      <div id="groww-blogs" className="mt-12 pt-10 border-t border-border/60">
        <GrowwBlogSection />
      </div>

      {/* Thematic Stock Baskets Section (Smallcases mock) */}
      <div id="thematic-baskets" className="mt-12 pt-10 border-t border-border/60">
        <ThematicBaskets />
      </div>

      {/* Structured Schema.org Metadata */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "OnlyProfit",
            "url": "https://onlyprofit.com",
            "description": "Analyze Indian Equities in real-time with interactive charts, technical indicators, and live market data. Estimate mutual fund yields with the built-in SIP/Lumpsum calculator."
          }).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')
        }}
      />

      {/* Modals */}
      <IpoDetailsModal
        searchId={selectedIpoSearchId}
        onClose={() => setSelectedIpoSearchId(null)}
      />

      {isOrderModalOpen && (
        <OrderPlacementModal
          isOpen={isOrderModalOpen}
          onClose={() => setIsOrderModalOpen(false)}
          symbol={tradeSymbol}
          stockName={tradeName}
          livePrice={tradePrice}
          onOrderExecuted={() => {}}
        />
      )}
    </div>
  );
}
