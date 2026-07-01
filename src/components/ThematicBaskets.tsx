'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StockLogo from './StockLogo';
import { Layers, Sparkles, TrendingUp, Landmark, Plus, Trash } from 'lucide-react';
import { MOCK_STOCK_INFO, cleanStockName } from '@/lib/yahooFinance';

interface BasketData {
  id: string;
  name: string;
  type: string;
  description: string;
  cagr: number;
  members: string[];
  color: string;
  icon: React.ReactNode;
}

interface QuoteData {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
}

const baskets: BasketData[] = [
  {
    id: 'tata',
    name: 'House of Tata',
    type: 'Thematic',
    description: 'Diversified exposure into India\'s most trusted conglomerate, balancing legacy and innovation.',
    cagr: 19.5,
    members: ['TCS.NS', 'TMPV.NS', 'TMCV.NS', 'TATASTEEL.NS', 'TITAN.NS'],
    color: 'from-blue-600/10 to-indigo-600/10 border-blue-500/20 text-blue-600 dark:text-blue-400',
    icon: <Sparkles className="h-4.5 w-4.5 text-blue-500" />
  },
  {
    id: 'it',
    name: 'IT Leaders',
    type: 'Sectoral',
    description: 'Capitalize on global digitization by investing in India\'s largest software exporters and consultants.',
    cagr: 15.2,
    members: ['TCS.NS', 'INFY.NS', 'WIPRO.NS', 'HCLTECH.NS'],
    color: 'from-emerald-600/10 to-teal-600/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    icon: <Layers className="h-4.5 w-4.5 text-emerald-500" />
  },
  {
    id: 'banking',
    name: 'Banking Kings',
    type: 'Sectoral',
    description: 'High-liquidity banking institutions fueling India\'s retail credit growth and infrastructure capital.',
    cagr: 14.8,
    members: ['HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'AXISBANK.NS'],
    color: 'from-purple-600/10 to-pink-600/10 border-purple-500/20 text-purple-600 dark:text-purple-400',
    icon: <Landmark className="h-4.5 w-4.5 text-purple-500" />
  },
  {
    id: 'energy',
    name: 'Energy & Utilities',
    type: 'Thematic',
    description: 'A blend of refining powerhouses and utility leaders transitioning into clean solar/wind resources.',
    cagr: 16.4,
    members: ['RELIANCE.NS', 'BPCL.NS', 'ONGC.NS', 'POWERGRID.NS'],
    color: 'from-amber-600/10 to-orange-600/10 border-amber-500/20 text-amber-600 dark:text-amber-400',
    icon: <TrendingUp className="h-4.5 w-4.5 text-amber-500" />
  }
];

export default function ThematicBaskets() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Record<string, QuoteData>>({});
  const [customBaskets, setCustomBaskets] = useState<BasketData[]>([]);

  // Load custom baskets from LocalStorage on mount
  useEffect(() => {
    try {
      const listStr = localStorage.getItem('onlyprofit_custom_baskets_list');
      if (listStr) {
        const ids = JSON.parse(listStr);
        const loaded: BasketData[] = [];
        ids.forEach((id: string) => {
          const stored = localStorage.getItem(`basket_${id}`);
          if (stored) {
            const parsed = JSON.parse(stored);
            loaded.push({
              id: parsed.id,
              name: parsed.name,
              type: 'Custom',
              description: parsed.description,
              cagr: parsed.cagr,
              members: parsed.constituents.map((c: any) => c.symbol),
              color: 'from-slate-600/10 to-zinc-600/10 border-slate-500/20 text-slate-600 dark:text-slate-400',
              icon: <Layers className="h-4.5 w-4.5 text-slate-500" />
            });
          }
        });
        setCustomBaskets(loaded);
      }
    } catch (err) {
      console.error('Failed to load custom baskets', err);
    }
  }, []);

  // Compute unique symbols dynamically
  const symbolsString = Array.from(new Set([
    ...baskets.flatMap(b => b.members),
    ...customBaskets.flatMap(b => b.members)
  ])).join(',');

  // Fetch Quotes for all unique members across all baskets
  useEffect(() => {
    if (!symbolsString) return;
    
    const fetchQuotes = async () => {
      try {
        const res = await fetch(`/api/stock/quote?symbols=${symbolsString}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          const mapped: Record<string, QuoteData> = {};
          data.forEach((item: any) => {
            mapped[item.symbol] = {
              symbol: item.symbol,
              name: item.shortName || item.longName || item.symbol.split('.')[0],
              price: item.regularMarketPrice || 0,
              changePercent: item.regularMarketChangePercent || 0
            };
          });
          setQuotes(mapped);
        }
      } catch (err) {
        console.error('Failed to fetch basket stock quotes', err);
      }
    };

    fetchQuotes();
    const interval = setInterval(fetchQuotes, 12000); // refresh every 12 seconds
    return () => clearInterval(interval);
  }, [symbolsString]);

  // Return live quote or static fallback details
  const getStockQuote = useCallback((sym: string): QuoteData => {
    if (quotes[sym]) return quotes[sym];
    
    const mockInfo = MOCK_STOCK_INFO[sym] || { name: sym.split('.')[0] };
    return {
      symbol: sym,
      name: cleanStockName(mockInfo.name),
      price: 1250.0,
      changePercent: 0.0
    };
  }, [quotes]);

  const handlePillClick = (e: React.MouseEvent, sym: string) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/stock/${sym}`);
  };

  const handleDeleteCustomBasket = (e: React.MouseEvent, basketId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirm('Are you sure you want to delete this custom basket?')) {
      // Remove config from LocalStorage
      localStorage.removeItem(`basket_${basketId}`);
      
      // Update custom baskets list in LocalStorage
      const listStr = localStorage.getItem('onlyprofit_custom_baskets_list');
      if (listStr) {
        const ids = JSON.parse(listStr);
        const filtered = ids.filter((id: string) => id !== basketId);
        localStorage.setItem('onlyprofit_custom_baskets_list', JSON.stringify(filtered));
      }
      
      // Remove from state
      setCustomBaskets(prev => prev.filter(b => b.id !== basketId));
    }
  };

  const allBaskets = [...baskets, ...customBaskets];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-profit/10 text-profit">
            <Layers className="h-4 w-4" />
          </span>
          <h2 className="text-2xl font-black text-text-primary tracking-tight">
            Thematic Stock Baskets
          </h2>
        </div>
        <p className="text-xs text-text-secondary font-medium mt-1">
          Diversified baskets (Smallcases) grouped by industrial themes or sectors, with aggregate historical CAGR yields.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {allBaskets.map((basket) => {
          const isCustom = basket.id.startsWith('custom_');
          return (
            <div key={basket.id} className="relative group">
              <Link
                href={`/basket/${basket.id}`}
                className="flex flex-col h-full rounded-2xl border border-border bg-card p-5 shadow-soft dark:shadow-soft-dark hover:shadow-lg hover:border-profit/20 hover:-translate-y-1 active:scale-[0.99] transition-all duration-300 animate-fade-in gpu-layer cursor-pointer"
              >
                {/* Header info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-background border border-border">
                      {basket.icon}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-text-primary tracking-tight group-hover:text-profit transition-colors duration-200">
                        {basket.name}
                      </h3>
                      <span className="inline-block text-[8px] font-black uppercase tracking-wider mt-0.5 px-2 py-0.2 rounded border border-border/80 text-text-secondary">
                        {isCustom ? 'Custom' : basket.type}
                      </span>
                    </div>
                  </div>
                  
                  {isCustom && (
                    <button
                      onClick={(e) => handleDeleteCustomBasket(e, basket.id)}
                      className="p-1.5 rounded-lg text-text-secondary hover:text-loss hover:bg-loss/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Delete Custom Basket"
                    >
                      <Trash className="h-4.5 w-4.5" />
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-text-secondary leading-relaxed font-semibold mt-4 flex-1">
                  {basket.description}
                </p>

                {/* Distinct styled stock pills with hover previews */}
                <div className="flex items-center justify-between mt-6 pt-3 border-t border-border/30">
                  <div className="flex flex-wrap gap-1.5 max-w-[70%] font-medium">
                    {basket.members.map((sym) => {
                      const quote = getStockQuote(sym);
                      const isPositive = quote.changePercent >= 0;
                      return (
                        <span
                          key={sym}
                          onClick={(e) => handlePillClick(e, sym)}
                          className="relative group/pill inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/50 text-[10px] text-text-secondary select-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/80 hover:text-text-primary transition-colors animate-fade-in"
                        >
                          <StockLogo symbol={sym} size="xs" />
                          <span className="font-semibold text-[10px]">{sym.split('.')[0]}</span>

                          {/* Tooltip Hover Preview */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-52 hidden group-hover/pill:block bg-card border border-border p-3 rounded-2xl shadow-xl z-50 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-150">
                            <div className="font-bold text-xs text-text-primary truncate">
                              {quote.name}
                            </div>
                            <div className="text-[10px] text-text-secondary font-semibold mt-0.5">
                              {sym.split('.')[0]} • NSE
                            </div>
                            
                            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border/40">
                              <span className="text-xs font-black text-text-primary tabular-nums">
                                ₹{quote.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md tabular-nums ${
                                isPositive
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                              }`}>
                                {isPositive ? '+' : ''}{quote.changePercent.toFixed(2)}%
                              </span>
                            </div>

                            {/* Tooltip Arrow */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-card" />
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-border -z-10 mt-[1px]" />
                          </div>
                        </span>
                      );
                    })}
                  </div>

                  {/* Basket CAGR yield */}
                  <div className="text-right font-semibold">
                    <span className="block text-[8px] font-black text-text-secondary uppercase tracking-wider">Est. CAGR (3y)</span>
                    <span className="inline-block text-xs font-black text-profit mt-0.5">
                      {basket.cagr.toFixed(1)}% p.a.
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}

        {/* Action card for creating a custom basket */}
        <Link
          href="/basket/create"
          className="flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-border/75 rounded-2xl bg-card/45 hover:bg-card hover:border-profit/45 hover:-translate-y-1 transition-all duration-300 min-h-[180px] group select-none cursor-pointer"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/80 border border-border group-hover:border-profit/35 group-hover:bg-profit/5 transition-colors mb-3">
            <Plus className="h-6 w-6 text-text-secondary group-hover:text-profit transition-colors" />
          </div>
          <h3 className="font-extrabold text-sm text-text-primary tracking-tight group-hover:text-profit transition-colors">
            Create Custom Basket
          </h3>
          <p className="text-[10px] text-text-secondary leading-relaxed font-semibold mt-1 px-4">
            Build your own asset allocation, calculate aggregate CAGR, and track performance.
          </p>
        </Link>
      </div>
    </div>
  );
}
