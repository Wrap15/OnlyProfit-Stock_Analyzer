'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, SlidersHorizontal, RefreshCw } from 'lucide-react';
import StockCard from '@/components/StockCard';
import { 
  MONITOR_SYMBOLS, 
  BLUE_CHIP_SYMBOLS, 
  HIGH_GROWTH_SYMBOLS, 
  DIVIDEND_SYMBOLS, 
  DEBT_FREE_SYMBOLS 
} from '@/constants/marketSymbols';
import { apiClient } from '@/lib/apiClient';
import { MOCK_STOCK_INFO, mapToStandardSector } from '@/lib/yahooFinance';

interface ExploreStocksSectionProps {
  marketQuotes: any[];
}

export default function ExploreStocksSection({ marketQuotes }: ExploreStocksSectionProps) {
  const [searchFilter, setSearchFilter] = useState('');
  const [activeCollection, setActiveCollection] = useState<'all' | 'bluechip' | 'growth' | 'dividend' | 'debtfree'>('all');
  const [exploreSymbols, setExploreSymbols] = useState<string[]>(MONITOR_SYMBOLS);
  const [exploreLoading, setExploreLoading] = useState(false);
  const [visibleExploreCount, setVisibleExploreCount] = useState(12);

  // Screener Filters State
  const [showScreener, setShowScreener] = useState(false);
  const [peFilter, setPeFilter] = useState<number>(100); // 100 representing "All"
  const [capFilter, setCapFilter] = useState<'all' | 'large' | 'mid' | 'small'>('all');
  const [sectorFilter, setSectorFilter] = useState<string>('all');

  // Unique sectors from MOCK_STOCK_INFO
  const availableSectors = useMemo(() => {
    const sectors = new Set<string>();
    Object.values(MOCK_STOCK_INFO).forEach((info: any) => {
      if (info.sector) {
        sectors.add(mapToStandardSector(info.sector));
      }
    });
    return Array.from(sectors).sort();
  }, []);

  useEffect(() => {
    if (!searchFilter.trim()) {
      const filtered = MONITOR_SYMBOLS.filter((sym) => {
        // Collection filters
        if (activeCollection === 'bluechip' && !BLUE_CHIP_SYMBOLS.includes(sym)) return false;
        if (activeCollection === 'growth' && !HIGH_GROWTH_SYMBOLS.includes(sym)) return false;
        if (activeCollection === 'dividend' && !DIVIDEND_SYMBOLS.includes(sym)) return false;
        if (activeCollection === 'debtfree' && !DEBT_FREE_SYMBOLS.includes(sym)) return false;

        // Custom Screener Filters
        const customMeta: any = MOCK_STOCK_INFO[sym] || {};
        const quote = marketQuotes.find((q) => q.symbol === sym) || {};
        
        // P/E filter (PE from quote trailingPE or mock metadata)
        const peVal = quote.trailingPE ?? customMeta.pe ?? 25;
        if (peFilter < 100 && peVal > peFilter) return false;

        // Cap size filter (derived from symbols or market cap)
        const marketCap = quote.marketCap ?? (customMeta.marketCap ? customMeta.marketCap * 10000000 : 250000000000);
        const inCr = marketCap / 10000000;
        if (capFilter === 'large' && inCr < 50000) return false;
        if (capFilter === 'mid' && (inCr < 10000 || inCr >= 50000)) return false;
        if (capFilter === 'small' && inCr >= 10000) return false;

        // Sector filter
        const rawSector = quote.sector ?? customMeta.sector ?? 'Financial Services';
        const stdSector = mapToStandardSector(rawSector);
        if (sectorFilter !== 'all' && stdSector !== sectorFilter) return false;

        return true;
      });
      setExploreSymbols(filtered);
      return;
    }

    setExploreLoading(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await apiClient.get<any[]>(`/api/stock/search?q=${encodeURIComponent(searchFilter)}&type=equity`);
        const searchResults = res.data || [];
        let symbols = searchResults
          .filter((r) => r.type !== 'MUTUALFUND' && r.exchange !== 'MF')
          .map((r) => r.symbol);

        // Offline / empty search results fallback
        if (symbols.length === 0) {
          const cleanQuery = searchFilter.toUpperCase().trim();
          symbols = Object.keys(MOCK_STOCK_INFO).filter((sym) => {
            const cleanSym = sym.toUpperCase().replace('.NS', '').replace('.BO', '');
            const companyName = (MOCK_STOCK_INFO[sym]?.name || '').toUpperCase();
            return cleanSym.includes(cleanQuery) || companyName.includes(cleanQuery);
          });
        }

        // Apply filters to dynamic API search results too
        const filtered = symbols.filter((sym) => {
          const customMeta: any = MOCK_STOCK_INFO[sym] || {};
          const quote = marketQuotes.find((q) => q.symbol === sym) || {};
          
          const peVal = quote.trailingPE ?? customMeta.pe ?? 25;
          if (peFilter < 100 && peVal > peFilter) return false;

          const marketCap = quote.marketCap ?? (customMeta.marketCap ? customMeta.marketCap * 10000000 : 250000000000);
          const inCr = marketCap / 10000000;
          if (capFilter === 'large' && inCr < 50000) return false;
          if (capFilter === 'mid' && (inCr < 10000 || inCr >= 50000)) return false;
          if (capFilter === 'small' && inCr >= 10000) return false;

          const rawSector = quote.sector ?? customMeta.sector ?? 'Financial Services';
          const stdSector = mapToStandardSector(rawSector);
          if (sectorFilter !== 'all' && stdSector !== sectorFilter) return false;

          return true;
        });

        setExploreSymbols(filtered);
      } catch (err) {
        console.error('Explore dynamic search failed', err);
      } finally {
        setExploreLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchFilter, activeCollection, peFilter, capFilter, sectorFilter, marketQuotes]);

  // Reset pagination count when filter values change
  useEffect(() => {
    setVisibleExploreCount(12);
  }, [searchFilter, activeCollection, peFilter, capFilter, sectorFilter]);

  const handleResetFilters = () => {
    setPeFilter(100);
    setCapFilter('all');
    setSectorFilter('all');
  };

  return (
    <div className="space-y-4 animate-fade-in gpu-layer">
      {/* Search and Curated Collections Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative max-w-xs w-full flex items-center gap-2">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-text-secondary" />
            </div>
            <input
              id="explore-search-input"
              type="text"
              placeholder="Search explore list..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-xl border border-border bg-card text-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-profit/20 focus:border-profit transition-all duration-200"
            />
          </div>
          
          <button
            onClick={() => setShowScreener(!showScreener)}
            className={`p-2 border rounded-xl flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
              showScreener || peFilter < 100 || capFilter !== 'all' || sectorFilter !== 'all'
                ? 'bg-profit/10 border-profit/25 text-profit'
                : 'bg-card border-border text-text-secondary hover:text-text-primary'
            }`}
            title="Toggle Screener Filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
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
              className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black shrink-0 transition-all duration-200 cursor-pointer ${
                activeCollection === col.id
                  ? 'bg-profit/10 text-profit border border-profit/15 shadow-xs'
                  : 'text-text-secondary hover:text-text-primary hover:bg-background border border-transparent'
              }`}
            >
              {col.label}
            </button>
          ))}
        </div>
      </div>

      {/* Screener Filters collapsible Drawer */}
      {showScreener && (
        <div className="p-5 bg-card border border-border rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-6 shadow-soft dark:shadow-soft-dark animate-fade-in relative z-10">
          
          {/* P/E Ratio Filter Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-text-secondary">P/E Ratio Threshold</span>
              <span className="text-profit font-black">{peFilter >= 100 ? 'All' : `Under ${peFilter}`}</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={peFilter}
              onChange={(e) => setPeFilter(parseInt(e.target.value))}
              className="w-full cursor-pointer accent-profit"
            />
            <span className="block text-[9px] text-text-secondary/75 font-semibold">Lower P/E indicates better value or growth expectations.</span>
          </div>

          {/* Market Cap sizing Filter */}
          <div className="space-y-2">
            <span className="block text-xs font-bold text-text-secondary">Market Capitalization</span>
            <select
              value={capFilter}
              onChange={(e) => setCapFilter(e.target.value as any)}
              className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs text-text-primary outline-none focus:border-profit transition-colors font-bold cursor-pointer"
            >
              <option value="all">All Sizes</option>
              <option value="large">Large Cap (₹50k Cr+)</option>
              <option value="mid">Mid Cap (₹10k Cr - ₹50k Cr)</option>
              <option value="small">Small Cap (Under ₹10k Cr)</option>
            </select>
          </div>

          {/* Sector Category Filter */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="block text-xs font-bold text-text-secondary">Sector Category</span>
              {(peFilter < 100 || capFilter !== 'all' || sectorFilter !== 'all') && (
                <button
                  onClick={handleResetFilters}
                  className="text-[9px] font-black text-rose-400 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                >
                  <RefreshCw className="h-2.5 w-2.5" /> Reset
                </button>
              )}
            </div>
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs text-text-primary outline-none focus:border-profit transition-colors font-bold cursor-pointer"
            >
              <option value="all">All Sectors</option>
              {availableSectors.map((sector) => (
                <option key={sector} value={sector}>
                  {sector}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {exploreLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-text-secondary">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-profit border-t-transparent" />
          <span className="text-xs font-bold">Querying NSE/BSE exchange directory...</span>
        </div>
      ) : exploreSymbols.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-2.5 sm:gap-4 sm:grid-cols-2">
            {exploreSymbols.slice(0, visibleExploreCount).map((symbol) => {
              const quote = marketQuotes.find((q) => q.symbol === symbol);
              return <StockCard key={symbol} symbol={symbol} initialQuote={quote} />;
            })}
          </div>
          {visibleExploreCount < exploreSymbols.length && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => setVisibleExploreCount((prev) => prev + 12)}
                className="px-6 py-2.5 bg-card hover:bg-card-hover border border-border text-text-primary rounded-xl text-xs font-bold transition-all hover:border-profit/30 cursor-pointer shadow-soft active:scale-[0.98] duration-200"
              >
                Load More Stocks
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-sm text-text-secondary font-bold">
          No stocks match the search query or active screener filter set.
        </div>
      )}
    </div>
  );
}
