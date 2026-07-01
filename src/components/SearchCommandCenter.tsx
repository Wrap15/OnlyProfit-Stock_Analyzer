'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Shield, TrendingUp, Layers } from 'lucide-react';
import { MUTUAL_FUNDS } from '@/lib/mutualfunds';
import { MOCK_STOCK_INFO, cleanStockName } from '@/lib/yahooFinance';
import { useStockStore } from '@/store/useStockStore';
import axios from 'axios';

interface SearchCommandCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ResultItem {
  id: string;
  name: string;
  type: 'STOCK' | 'MUTUALFUND' | 'BASKET';
  subtitle: string;
  badge?: string;
  icon?: React.ReactNode;
}

const LOCAL_BASKETS = [
  { id: 'tata', name: 'House of Tata', type: 'BASKET' as const, subtitle: 'Tata conglomerate thematic basket', badge: 'Tata Group' },
  { id: 'it', name: 'IT Leaders', type: 'BASKET' as const, subtitle: 'Top software and consultancy leaders', badge: 'IT Sector' },
  { id: 'banking', name: 'Banking Kings', type: 'BASKET' as const, subtitle: 'High-liquidity banking giants', badge: 'Finance' },
  { id: 'energy', name: 'Energy & Utilities', type: 'BASKET' as const, subtitle: 'Refiners and utilities clean energy', badge: 'Energy' }
];

export default function SearchCommandCenter({ isOpen, onClose }: SearchCommandCenterProps) {
  const router = useRouter();
  const { 
    recentSearches, 
    clearRecentSearches, 
    removeFromRecentSearches, 
    addToRecentSearches 
  } = useStockStore();

  const [query, setQuery] = useState('');
  const [apiResults, setApiResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setApiResults([]);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Click outside to close modal
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Dynamic filter for Local Baskets, Local Stocks, and Local MFs as typing occurs
  const queryClean = query.trim().toLowerCase();

  // Fetch API results with a debounce to capture long-tail entries
  useEffect(() => {
    if (queryClean.length < 2) {
      setApiResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/stock/search?q=${encodeURIComponent(queryClean)}`);
        const data = res.data || [];
        
        const mapped: ResultItem[] = data.map((item: any) => {
          const isMf = item.type === 'MUTUALFUND';
          return {
            id: item.symbol,
            name: isMf ? item.name.replace(' - Growth', '') : cleanStockName(item.name),
            type: isMf ? 'MUTUALFUND' : 'STOCK',
            subtitle: isMf ? `Mutual Fund • Code ${item.symbol}` : `NSE Equities • ${item.symbol.split('.')[0]}`,
            badge: item.exchange || (isMf ? 'MF' : 'NSE'),
            icon: isMf ? (
              <Shield className="h-4 w-4 text-emerald-500" />
            ) : (
              <TrendingUp className="h-4 w-4 text-profit" />
            )
          };
        });
        setApiResults(mapped);
      } catch (err) {
        console.error('API search failure in command center', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [queryClean]);

  // Combine all lists logically: Baskets -> Instant Local Matches -> Broader API Matches
  const combinedResults: ResultItem[] = useMemo(() => {
    if (queryClean.length === 0) {
      // Map recent searches to ResultItem dynamically
      return (recentSearches || []).map(sym => {
        const isMf = /^\d+$/.test(sym);
        const name = isMf 
          ? (MUTUAL_FUNDS.find(f => f.code === sym)?.name || `Mutual Fund ${sym}`)
          : (MOCK_STOCK_INFO[sym]?.name || sym.split('.')[0]);
        return {
          id: sym,
          name: cleanStockName(name),
          type: isMf ? 'MUTUALFUND' as const : 'STOCK' as const,
          subtitle: isMf ? `Mutual Fund • Code ${sym}` : `NSE Equities • ${sym.split('.')[0]}`,
          badge: isMf ? 'MF' : 'NSE',
          icon: isMf ? (
            <Shield className="h-4 w-4 text-emerald-500" />
          ) : (
            <TrendingUp className="h-4 w-4 text-profit" />
          )
        };
      });
    }

    // 1. Filter local baskets
    const filteredBaskets: ResultItem[] = queryClean
      ? LOCAL_BASKETS.filter(b => 
          b.name.toLowerCase().includes(queryClean) || 
          b.subtitle.toLowerCase().includes(queryClean)
        ).map(b => ({
          id: b.id,
          name: b.name,
          type: 'BASKET',
          subtitle: b.subtitle,
          badge: b.badge,
          icon: <Layers className="h-4 w-4 text-indigo-500" />
        }))
      : [];

    // 2. Filter local mutual funds
    const filteredLocalMFs: ResultItem[] = queryClean
      ? MUTUAL_FUNDS.filter(f => 
          f.name.toLowerCase().includes(queryClean) || 
          f.code.toLowerCase().includes(queryClean) ||
          f.categoryLabel.toLowerCase().includes(queryClean)
        ).slice(0, 4).map(f => ({
          id: f.code,
          name: f.name.replace(' - Growth', ''),
          type: 'MUTUALFUND',
          subtitle: `Mutual Fund • ${f.categoryLabel}`,
          badge: 'MF',
          icon: <Shield className="h-4 w-4 text-emerald-500" />
        }))
      : [];

    // 3. Filter local stock info to provide instantaneous search feedback
    const filteredLocalStocks: ResultItem[] = queryClean
      ? Object.keys(MOCK_STOCK_INFO).filter(sym => 
          sym.toLowerCase().includes(queryClean) || 
          MOCK_STOCK_INFO[sym].name.toLowerCase().includes(queryClean)
        ).slice(0, 4).map(sym => ({
          id: sym,
          name: cleanStockName(MOCK_STOCK_INFO[sym].name),
          type: 'STOCK',
          subtitle: `NSE Equities • ${sym.split('.')[0]}`,
          badge: 'NSE',
          icon: <TrendingUp className="h-4 w-4 text-profit" />
        }))
      : [];

    const localIdsSet = new Set([
      ...filteredBaskets.map(b => b.id),
      ...filteredLocalMFs.map(f => f.id),
      ...filteredLocalStocks.map(s => s.id)
    ]);
    const uniqueApiResults = apiResults.filter(item => !localIdsSet.has(item.id));

    return [
      ...filteredBaskets,
      ...filteredLocalMFs,
      ...filteredLocalStocks,
      ...uniqueApiResults
    ];
  }, [queryClean, apiResults, recentSearches]);

  // Adjust selectedIndex boundaries if list size shifts
  useEffect(() => {
    if (combinedResults.length > 0 && selectedIndex >= combinedResults.length) {
      setSelectedIndex(0);
    }
  }, [combinedResults.length, selectedIndex]);

  // Scroll active item into view
  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        block: 'nearest'
      });
    }
  }, [selectedIndex]);

  const handleSelect = useCallback((item: ResultItem) => {
    onClose();
    if (item.type === 'BASKET') {
      router.push(`/basket/${item.id}`);
    } else if (item.type === 'MUTUALFUND') {
      addToRecentSearches(item.id);
      router.push(`/mutualfund/${item.id}`);
    } else {
      addToRecentSearches(item.id);
      router.push(`/stock/${item.id}`);
    }
  }, [onClose, router, addToRecentSearches]);

  // Keyboard navigation controller
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (combinedResults.length > 0 ? (prev + 1) % combinedResults.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (combinedResults.length > 0 ? (prev - 1 + combinedResults.length) % combinedResults.length : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (combinedResults[selectedIndex]) {
          handleSelect(combinedResults[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => {
      window.removeEventListener('keydown', handleKeyboard);
    };
  }, [isOpen, combinedResults, selectedIndex, onClose, handleSelect]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/45 dark:bg-slate-950/70 backdrop-blur-sm flex items-start justify-center pt-[10vh] px-4 animate-in fade-in duration-200">
      <div 
        ref={containerRef}
        className="w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[70vh] animate-in zoom-in-95 duration-200 animate-fade-in"
      >
        {/* Search Input Box */}
        <div className="flex items-center px-4 border-b border-border/60">
          <Search className="h-5 w-5 text-text-secondary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search stock tickers, mutual funds, or thematic baskets..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-0 outline-none text-text-primary placeholder:text-text-secondary py-4 px-3 text-sm focus:ring-0 focus:outline-none"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            {query && (
              <button 
                onClick={() => { setQuery(''); setApiResults([]); }}
                className="p-1 rounded-lg text-text-secondary hover:text-text-primary mr-1"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-background border border-border/80 text-[9px] text-text-secondary font-mono select-none">
              ESC
            </kbd>
          </div>
        </div>

        {/* Results List View */}
        <div className="flex-1 overflow-y-auto p-2 scrollbar-none">
          {queryClean.length === 0 && combinedResults.length > 0 && (
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/40 mb-1.5 text-text-secondary select-none">
              <span className="text-[10px] font-black uppercase tracking-wider">Recent Searches</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearRecentSearches();
                }}
                className="text-[9px] font-black hover:text-loss transition-colors cursor-pointer"
              >
                Clear All
              </button>
            </div>
          )}

          {queryClean.length === 0 && combinedResults.length === 0 ? (
            <div className="py-12 text-center text-text-secondary flex flex-col items-center justify-center gap-2">
              <Search className="h-8 w-8 text-border animate-pulse" />
              <p className="text-xs font-semibold">Start typing to search stocks, funds, or baskets...</p>
              <p className="text-[10px] text-text-secondary opacity-75">Simulated mutual funds & thematic baskets search is fully offline.</p>
            </div>
          ) : combinedResults.length > 0 ? (
            <div className="space-y-0.5">
              {combinedResults.map((item, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <div
                    key={`${item.type}-${item.id}`}
                    className={`flex items-center justify-between rounded-2xl transition-colors ${
                      isSelected 
                        ? 'bg-slate-100 dark:bg-slate-800/80' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    <button
                      ref={isSelected ? activeItemRef : null}
                      onClick={() => handleSelect(item)}
                      className={`flex-1 flex items-center justify-between p-3 text-left transition-colors ${
                        isSelected ? 'text-text-primary font-medium' : 'text-text-secondary'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-xl border ${
                          isSelected 
                            ? 'bg-card border-border/80' 
                            : 'bg-background border-border/40'
                        }`}>
                          {item.icon}
                        </div>
                        <div className="min-w-0">
                          <div className={`font-semibold text-sm ${isSelected ? 'text-text-primary' : 'text-text-primary/90'}`}>
                            {item.name}
                          </div>
                          <div className="text-[11px] text-text-secondary font-medium truncate mt-0.5">
                            {item.subtitle}
                          </div>
                        </div>
                      </div>
                      
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border tracking-wider uppercase select-none ${
                        item.type === 'BASKET'
                          ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                          : item.type === 'MUTUALFUND'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-500/10 border-slate-500/20 text-text-secondary'
                      }`}>
                        {item.badge}
                      </span>
                    </button>

                    {queryClean.length === 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromRecentSearches(item.id);
                        }}
                        className="p-2 mr-2 rounded-lg text-text-secondary hover:text-loss hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                        title="Remove from history"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
              {loading && (
                <div className="flex items-center justify-center py-4 text-xs text-text-secondary">
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border border-profit border-t-transparent mr-2" />
                  Loading additional exchanges...
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-text-secondary font-semibold">
              No results found matching &quot;{query}&quot;
            </div>
          )}
        </div>

        {/* Modal Help Footer */}
        <div className="px-4 py-2.5 border-t border-border/60 bg-background/50 flex justify-between items-center text-[10px] text-text-secondary select-none font-medium">
          <div className="flex gap-3">
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
          </div>
          <span>esc to close</span>
        </div>
      </div>
    </div>
  );
}
