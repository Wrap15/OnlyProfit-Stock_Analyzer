'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Trash2, Plus, ArrowUpRight, ArrowDownRight, ChevronLeft, GitCompare, HelpCircle } from 'lucide-react';
import { apiClient as axios } from '@/lib/apiClient';
import StockLogo from '@/components/StockLogo';
import MiniSparkline from '@/components/MiniSparkline';
import { useStockStore } from '@/store/useStockStore';

interface StockData {
  symbol: string;
  shortName: string;
  longName: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  marketCap: number;
  trailingPE: number | null;
  priceToBook: number | null;
  dividendYield: number | null;
  epsTrailingTwelveMonths: number | null;
  analystRating: number;
  sector: string;
  volatility: string;
  volatilityClass: string;
  chartData: number[];
}

interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}

const PRESET_COMPARISONS = [
  { label: 'TCS vs Infosys', symbols: ['TCS.NS', 'INFY.NS'] },
  { label: 'HDFC Bank vs ICICI Bank', symbols: ['HDFCBANK.NS', 'ICICIBANK.NS'] },
  { label: 'Reliance vs Tata Motors PV', symbols: ['RELIANCE.NS', 'TMPV.NS'] }
];

function getVolatility(symbol: string): { label: string; className: string } {
  const clean = symbol.split('.')[0].toUpperCase();
  const lowVol = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ITC', 'HINDUNILVR', 'KOTAKBANK', 'SUNPHARMA', 'LT', 'ASIANPAINT'];
  const medVol = ['TATAMOTORS', 'TMPV', 'TMCV', 'SBIN', 'ICICIBANK', 'AXISBANK', 'BHARTIAIRTEL', 'M&M', 'MARUTI', 'JSWSTEEL', 'TATASTEEL', 'TITAN'];
  
  if (lowVol.includes(clean)) {
    return { label: 'Low Volatility', className: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };
  } else if (medVol.includes(clean)) {
    return { label: 'Medium Volatility', className: 'text-amber-500 bg-amber-500/10 border-amber-500/20' };
  } else {
    return { label: 'High Volatility', className: 'text-rose-500 bg-rose-500/10 border-rose-500/20' };
  }
}

export default function ComparePage() {
  const router = useRouter();
  const { addToRecentSearches } = useStockStore();
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);

  // Check for search query param on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const symbolQuery = params.get('symbol');
      if (symbolQuery) {
        const upperSymbol = symbolQuery.toUpperCase();
        setSelectedSymbols([upperSymbol]);
        addToRecentSearches(upperSymbol);
      }
    }
  }, [addToRecentSearches]);
  const [stocksData, setStocksData] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch search results
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setSearchLoading(true);
        try {
          const res = await axios.get(`/api/stock/search?q=${encodeURIComponent(searchQuery)}`);
          setSearchResults(res.data || []);
          setShowDropdown(true);
        } catch (err) {
          console.error('Failed to search', err);
        } finally {
          setSearchLoading(false);
        }
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Fetch full details of compared stocks when the list updates
  useEffect(() => {
    if (selectedSymbols.length === 0) {
      setStocksData([]);
      return;
    }

    async function fetchCompareData() {
      setLoading(true);
      try {
        const quotesRes = await axios.get(`/api/stock/quote?symbols=${selectedSymbols.join(',')}`);
        const quotes: any[] = quotesRes.data || [];

        const populatedData = await Promise.all(
          quotes.map(async (quote) => {
            let chartPoints: number[] = [];
            try {
              const chartRes = await axios.get(`/api/stock/chart?symbol=${encodeURIComponent(quote.symbol)}&range=1d`);
              chartPoints = (chartRes.data || []).map((pt: any) => pt.value);
            } catch (err) {
              console.error(`Failed to fetch chart for ${quote.symbol} inside compare`, err);
            }

            const vol = getVolatility(quote.symbol);
            return {
              symbol: quote.symbol,
              shortName: quote.shortName,
              longName: quote.longName,
              regularMarketPrice: quote.regularMarketPrice,
              regularMarketChange: quote.regularMarketChange,
              regularMarketChangePercent: quote.regularMarketChangePercent,
              marketCap: quote.marketCap,
              trailingPE: quote.trailingPE,
              priceToBook: quote.priceToBook,
              dividendYield: quote.dividendYield,
              epsTrailingTwelveMonths: quote.epsTrailingTwelveMonths,
              analystRating: quote.analystRating,
              sector: quote.sector || 'Financial Services',
              volatility: vol.label,
              volatilityClass: vol.className,
              chartData: chartPoints
            };
          })
        );
        setStocksData(populatedData);
      } catch (err) {
        console.error('Failed to fetch comparison details', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCompareData();
  }, [selectedSymbols]);

  const addStock = (symbol: string) => {
    const upper = symbol.toUpperCase();
    if (selectedSymbols.includes(upper)) {
      setSearchQuery('');
      setShowDropdown(false);
      return;
    }
    if (selectedSymbols.length >= 3) {
      alert('You can compare a maximum of 3 stocks side by side.');
      return;
    }
    setSelectedSymbols([...selectedSymbols, upper]);
    addToRecentSearches(upper);
    setSearchQuery('');
    setShowDropdown(false);
  };

  const removeStock = (symbol: string) => {
    setSelectedSymbols(selectedSymbols.filter((s) => s !== symbol));
  };

  const loadPreset = (symbols: string[]) => {
    setSelectedSymbols(symbols);
  };

  // Helper to format market cap
  const formatIndianNumber = (num: number, isCurrency: boolean = false) => {
    if (!num) return 'N/A';
    const prefix = isCurrency ? '₹' : '';
    if (num >= 10000000) { // 1 Crore
      const value = (num / 10000000).toFixed(2);
      if (parseFloat(value) >= 100000) {
        return `${prefix}${(parseFloat(value) / 100000).toFixed(2)} L Cr`;
      }
      return `${prefix}${value} Cr`;
    } else if (num >= 100000) { // 1 Lakh
      return `${prefix}${(num / 100000).toFixed(2)} L`;
    }
    return `${prefix}${num.toLocaleString('en-IN')}`;
  };

  // Compute Return on Equity (ROE) using formula (P/B / P/E) * 100
  const calculateROE = (pb: number | null, pe: number | null): string => {
    if (!pb || !pe || pe <= 0) return 'N/A';
    const roe = (pb / pe) * 100;
    return `${roe.toFixed(2)}%`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      
      {/* Header */}
      <div className="mb-8 p-6 rounded-3xl border border-border bg-glass shadow-premium relative overflow-hidden animate-fade-in">
        <div className="absolute top-0 right-0 h-40 w-40 bg-gradient-to-br from-profit/5 to-indigo-500/5 rounded-full blur-3xl pointer-events-none select-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-1 text-xs font-bold text-text-secondary hover:text-text-primary mb-3 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" /> Back to Dashboard
            </button>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-text-primary flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-profit/15 text-profit border border-profit/20">
                <GitCompare className="h-5 w-5" />
              </span>
              <span>Compare Equities</span>
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-text-secondary font-medium max-w-2xl leading-relaxed">
              Analyze up to three NSE equities side by side with real-time quotes, technical ratios, and performance metrics.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4 items-start">
        
        {/* Search & presets controls (Left column on large screen) */}
        <div className="lg:col-span-1 space-y-6 animate-fade-in">
          <div className="bg-glass border border-border/75 p-5 rounded-2xl shadow-premium space-y-4">
            <h3 className="font-extrabold text-sm text-text-primary">Add Tickers</h3>
            <p className="text-xs text-text-secondary leading-relaxed font-medium">
              Search and add NSE equities to compare valuation, fundamentals, and margins.
            </p>
            
            {/* Search Input Container */}
            <div className="relative" ref={dropdownRef}>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-4 w-4 text-text-secondary" />
                </div>
                <input
                  type="text"
                  placeholder="Search (e.g. INFOSYS, RELIANCE)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.trim().length >= 2 && setShowDropdown(true)}
                  disabled={selectedSymbols.length >= 3}
                  className="w-full h-10 pl-9 pr-4 rounded-xl border border-border bg-background text-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-profit disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                />
              </div>

              {/* Autocomplete Dropdown */}
              {showDropdown && (
                <div className="absolute left-0 right-0 mt-2 z-50 max-h-60 overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-premium dark:shadow-premium-dark">
                  {searchLoading ? (
                    <div className="flex items-center justify-center py-4 text-xs text-text-secondary">
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-profit border-t-transparent mr-2" />
                      Searching...
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-0.5">
                      {searchResults.map((item) => (
                        <button
                          key={item.symbol}
                          onClick={() => addStock(item.symbol)}
                          className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-background text-left transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-text-primary truncate">{item.symbol.split('.')[0]}</div>
                            <div className="text-[10px] text-text-secondary truncate max-w-[150px]">{item.name}</div>
                          </div>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-background border border-border text-text-secondary uppercase select-none">
                            {item.exchange}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="py-4 text-center text-xs text-text-secondary">
                      No results for &quot;{searchQuery}&quot;
                    </div>
                  )}
                </div>
              )}
            </div>

            {selectedSymbols.length >= 3 && (
              <p className="text-[10px] font-bold text-amber-500">
                Maximum limit of 3 stocks reached. Remove a stock to add another.
              </p>
            )}
          </div>

          {/* Presets List */}
          <div className="bg-glass border border-border/75 p-5 rounded-2xl shadow-premium space-y-4">
            <h3 className="font-extrabold text-sm text-text-primary">Popular Comparisons</h3>
            <div className="flex flex-col gap-2">
              {PRESET_COMPARISONS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => loadPreset(preset.symbols)}
                  className="w-full text-left p-3 rounded-xl border border-border/80 bg-background hover:bg-card hover:border-profit/20 text-xs font-bold text-text-secondary hover:text-text-primary flex items-center justify-between group transition-all"
                >
                  <span>{preset.label}</span>
                  <Plus className="h-3.5 w-3.5 text-text-secondary group-hover:text-profit transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Comparison Area (Right 3 columns on large screen) */}
        <div className="lg:col-span-3">
          {selectedSymbols.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center rounded-2xl border border-border/70 py-20 px-6 bg-glass shadow-premium text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-profit/10 text-profit mb-4">
                <GitCompare className="h-8 w-8" />
              </div>
              <h3 className="font-extrabold text-base text-text-primary">Comparison sheet is empty</h3>
              <p className="mt-1 text-xs text-text-secondary max-w-sm font-medium leading-relaxed">
                Add stock tickers from the search bar or load one of our pre-configured sector pairs on the left to initialize side-by-side metric tables.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => loadPreset(['TCS.NS', 'INFY.NS'])}
                  className="px-4 py-2 rounded-xl bg-profit text-white shadow-md shadow-profit/20 text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Load IT Peers preset
                </button>
                <button
                  onClick={() => loadPreset(['HDFCBANK.NS', 'ICICIBANK.NS'])}
                  className="px-4 py-2 rounded-xl bg-background border border-border text-text-primary text-xs font-bold hover:bg-card transition-all"
                >
                  Load Banks preset
                </button>
              </div>
            </div>
          ) : loading ? (
            /* Main Loader Grid */
            <div className="bg-glass border border-border/85 rounded-2xl p-6 shadow-premium space-y-6">
              <div className="grid grid-cols-4 gap-4 items-center border-b border-border/50 pb-4">
                <div className="h-5 w-24 animate-shimmer rounded" />
                {selectedSymbols.map((sym, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="h-4 w-16 animate-shimmer rounded" />
                    <div className="h-3 w-28 animate-shimmer rounded" />
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="grid grid-cols-4 gap-4 items-center py-2 border-b border-border/40">
                    <div className="h-3.5 w-24 animate-shimmer rounded" />
                    <div className="h-3.5 w-16 animate-shimmer rounded" />
                    <div className="h-3.5 w-16 animate-shimmer rounded" />
                    <div className="h-3.5 w-16 animate-shimmer rounded" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Premium Responsive Comparison Grid */
            <div className="bg-glass border border-border/80 rounded-2xl shadow-premium overflow-hidden">
              <div className="overflow-x-auto scrollbar-none">
                <table className="w-full border-collapse text-left">
                  <thead>
                    
                    {/* Header: Names, Prices & Removal */}
                    <tr className="border-b border-border/80 bg-background/30">
                      <th className="p-5 min-w-[160px] font-black text-xs text-text-secondary uppercase tracking-wider">Metrics</th>
                      {stocksData.map((stock) => {
                        const isPos = stock.regularMarketChangePercent >= 0;
                        return (
                          <th key={stock.symbol} className="p-5 min-w-[200px] align-top relative group border-l border-border/50">
                            <button
                              onClick={() => removeStock(stock.symbol)}
                              className="absolute top-4 right-4 p-1.5 rounded-lg border border-border/60 hover:border-loss/30 text-text-secondary hover:text-loss hover:bg-loss/5 transition-all"
                              title={`Remove ${stock.symbol}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                            <div className="flex items-center gap-3">
                              <StockLogo symbol={stock.symbol} size="sm" />
                              <div className="min-w-0">
                                <Link 
                                  href={`/stock/${stock.symbol}`}
                                  className="font-extrabold text-sm text-text-primary hover:text-profit transition-colors block truncate"
                                >
                                  {stock.longName}
                                </Link>
                                <span className="text-[10px] font-extrabold text-text-secondary">{stock.symbol.split('.')[0]}</span>
                              </div>
                            </div>
                            
                            <div className="mt-4">
                              <div className="text-base font-extrabold text-text-primary">
                                ₹{stock.regularMarketPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </div>
                              <span className={`text-[10px] font-extrabold inline-flex items-center gap-0.5 mt-0.5 ${isPos ? 'text-profit' : 'text-loss'}`}>
                                {isPos ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                {isPos ? '+' : ''}{stock.regularMarketChangePercent.toFixed(2)}%
                              </span>
                            </div>

                            {/* Daily Mini Sparkline */}
                            {stock.chartData.length > 0 && (
                              <div className="h-8 w-32 mt-3 opacity-80">
                                <MiniSparkline data={stock.chartData} isPositive={isPos} width={128} height={32} />
                              </div>
                            )}
                          </th>
                        );
                      })}
                      
                      {/* Fill empty comparison columns */}
                      {Array.from({ length: 3 - selectedSymbols.length }).map((_, idx) => (
                        <th key={idx} className="p-5 border-l border-border/40 bg-background/5 text-center align-middle select-none">
                          <div className="flex flex-col items-center gap-2 text-text-secondary opacity-60">
                            <Plus className="h-5 w-5 border border-dashed border-border/80 rounded p-0.5" />
                            <span className="text-[10px] font-extrabold uppercase tracking-wide">Available Slot</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  
                  <tbody className="divide-y divide-border/40 text-xs font-semibold text-text-primary">
                    
                    {/* Sector */}
                    <tr className="hover:bg-background/20 transition-colors">
                      <td className="p-4 font-extrabold text-[10px] text-text-secondary uppercase tracking-wider">Sector</td>
                      {stocksData.map((stock) => (
                        <td key={stock.symbol} className="p-4 border-l border-border/50 text-text-primary font-bold">
                          {stock.sector}
                        </td>
                      ))}
                      {Array.from({ length: 3 - selectedSymbols.length }).map((_, idx) => (
                        <td key={idx} className="p-4 border-l border-border/40 bg-background/5" />
                      ))}
                    </tr>

                    {/* Market Cap */}
                    <tr className="hover:bg-background/20 transition-colors">
                      <td className="p-4 font-extrabold text-[10px] text-text-secondary uppercase tracking-wider">Market Cap</td>
                      {stocksData.map((stock) => (
                        <td key={stock.symbol} className="p-4 border-l border-border/50 text-text-primary font-bold">
                          {formatIndianNumber(stock.marketCap, true)}
                        </td>
                      ))}
                      {Array.from({ length: 3 - selectedSymbols.length }).map((_, idx) => (
                        <td key={idx} className="p-4 border-l border-border/40 bg-background/5" />
                      ))}
                    </tr>

                    {/* PE Ratio */}
                    <tr className="hover:bg-background/20 transition-colors">
                      <td className="p-4 font-extrabold text-[10px] text-text-secondary uppercase tracking-wider flex items-center gap-1">
                        P/E Ratio
                      </td>
                      {stocksData.map((stock) => {
                        const isHighest = stocksData.length > 1 && stock.trailingPE !== null && 
                          stocksData.every(s => s.trailingPE === null || stock.trailingPE! <= s.trailingPE!);
                        return (
                          <td key={stock.symbol} className="p-4 border-l border-border/50 font-bold">
                            <span className={isHighest ? "text-profit bg-profit/10 px-2 py-1 rounded" : "text-text-primary"}>
                              {stock.trailingPE ? stock.trailingPE.toFixed(2) : 'N/A'}
                            </span>
                          </td>
                        );
                      })}
                      {Array.from({ length: 3 - selectedSymbols.length }).map((_, idx) => (
                        <td key={idx} className="p-4 border-l border-border/40 bg-background/5" />
                      ))}
                    </tr>

                    {/* PB Ratio */}
                    <tr className="hover:bg-background/20 transition-colors">
                      <td className="p-4 font-extrabold text-[10px] text-text-secondary uppercase tracking-wider">P/B Ratio</td>
                      {stocksData.map((stock) => (
                        <td key={stock.symbol} className="p-4 border-l border-border/50 text-text-primary font-bold">
                          {stock.priceToBook ? stock.priceToBook.toFixed(2) : 'N/A'}
                        </td>
                      ))}
                      {Array.from({ length: 3 - selectedSymbols.length }).map((_, idx) => (
                        <td key={idx} className="p-4 border-l border-border/40 bg-background/5" />
                      ))}
                    </tr>

                    {/* Dividend Yield */}
                    <tr className="hover:bg-background/20 transition-colors">
                      <td className="p-4 font-extrabold text-[10px] text-text-secondary uppercase tracking-wider">Div Yield</td>
                      {stocksData.map((stock) => (
                        <td key={stock.symbol} className="p-4 border-l border-border/50 text-text-primary font-bold text-profit">
                          {stock.dividendYield ? `${stock.dividendYield.toFixed(2)}%` : '0.00%'}
                        </td>
                      ))}
                      {Array.from({ length: 3 - selectedSymbols.length }).map((_, idx) => (
                        <td key={idx} className="p-4 border-l border-border/40 bg-background/5" />
                      ))}
                    </tr>

                    {/* EPS */}
                    <tr className="hover:bg-background/20 transition-colors">
                      <td className="p-4 font-extrabold text-[10px] text-text-secondary uppercase tracking-wider">EPS (TTM)</td>
                      {stocksData.map((stock) => (
                        <td key={stock.symbol} className="p-4 border-l border-border/50 text-text-primary font-bold">
                          {stock.epsTrailingTwelveMonths ? `₹${stock.epsTrailingTwelveMonths.toFixed(2)}` : 'N/A'}
                        </td>
                      ))}
                      {Array.from({ length: 3 - selectedSymbols.length }).map((_, idx) => (
                        <td key={idx} className="p-4 border-l border-border/40 bg-background/5" />
                      ))}
                    </tr>

                    {/* Return on Equity (ROE) */}
                    <tr className="hover:bg-background/20 transition-colors">
                      <td className="p-4 font-extrabold text-[10px] text-text-secondary uppercase tracking-wider flex items-center gap-1">
                        ROE
                        <div className="group/tooltip relative cursor-help">
                          <HelpCircle className="h-3 w-3 text-text-secondary" />
                          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover/tooltip:block w-48 bg-card border border-border p-2 rounded-lg text-[9px] text-text-secondary shadow-lg font-medium leading-relaxed z-50">
                            Return on Equity (ROE) is calculated consistently as (P/B Ratio / P/E Ratio) * 100 representing profitability.
                          </div>
                        </div>
                      </td>
                      {stocksData.map((stock) => {
                        const roeVal = calculateROE(stock.priceToBook, stock.trailingPE);
                        const isHighest = stocksData.length > 1 && roeVal !== 'N/A' &&
                          stocksData.every(s => {
                            const otherRoe = calculateROE(s.priceToBook, s.trailingPE);
                            return otherRoe === 'N/A' || parseFloat(roeVal) >= parseFloat(otherRoe);
                          });
                        return (
                          <td key={stock.symbol} className="p-4 border-l border-border/50 font-bold">
                            <span className={isHighest ? "text-indigo-500 bg-indigo-500/10 px-2 py-1 rounded" : "text-text-primary"}>
                              {roeVal}
                            </span>
                          </td>
                        );
                      })}
                      {Array.from({ length: 3 - selectedSymbols.length }).map((_, idx) => (
                        <td key={idx} className="p-4 border-l border-border/40 bg-background/5" />
                      ))}
                    </tr>

                    {/* Volatility */}
                    <tr className="hover:bg-background/20 transition-colors">
                      <td className="p-4 font-extrabold text-[10px] text-text-secondary uppercase tracking-wider">Volatility</td>
                      {stocksData.map((stock) => (
                        <td key={stock.symbol} className="p-4 border-l border-border/50 font-bold">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${stock.volatilityClass}`}>
                            {stock.volatility}
                          </span>
                        </td>
                      ))}
                      {Array.from({ length: 3 - selectedSymbols.length }).map((_, idx) => (
                        <td key={idx} className="p-4 border-l border-border/40 bg-background/5" />
                      ))}
                    </tr>

                    {/* Analyst Suggestions */}
                    <tr className="hover:bg-background/20 transition-colors">
                      <td className="p-4 font-extrabold text-[10px] text-text-secondary uppercase tracking-wider">Buy Suggestion</td>
                      {stocksData.map((stock) => (
                        <td key={stock.symbol} className="p-4 border-l border-border/50 font-extrabold text-profit">
                          {stock.analystRating}% buy
                          <div className="w-full h-1 bg-background border border-border/50 rounded-full mt-1.5 overflow-hidden">
                            <div className="h-full bg-profit" style={{ width: `${stock.analystRating}%` }} />
                          </div>
                        </td>
                      ))}
                      {Array.from({ length: 3 - selectedSymbols.length }).map((_, idx) => (
                        <td key={idx} className="p-4 border-l border-border/40 bg-background/5" />
                      ))}
                    </tr>

                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
