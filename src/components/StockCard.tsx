'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, ChevronRight } from 'lucide-react';
import { useStockStore } from '@/store/useStockStore';
import MiniSparkline from './MiniSparkline';
import { apiClient as axios } from '@/lib/apiClient';
import StockLogo from './StockLogo';

function getVolatility(symbol: string): { label: string; className: string } {
  const clean = symbol.split('.')[0].toUpperCase();
  const lowVol = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ITC', 'HINDUNILVR', 'KOTAKBANK', 'SUNPHARMA', 'LT', 'ASIANPAINT'];
  const medVol = ['TATAMOTORS', 'TMPV', 'TMCV', 'SBIN', 'ICICIBANK', 'AXISBANK', 'BHARTIAIRTEL', 'M&M', 'MARUTI', 'JSWSTEEL', 'TATASTEEL', 'TITAN'];
  const highVol = ['ADANIENT', 'ADANIPORTS', 'JIOFIN', 'BPCL', 'COALINDIA', 'ONGC', 'POWERGRID', 'ULTRACEMCO', 'GRASIM'];

  if (lowVol.includes(clean)) {
    return { label: 'Low Volatility', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
  } else if (medVol.includes(clean)) {
    return { label: 'Medium Volatility', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
  } else if (highVol.includes(clean)) {
    return { label: 'High Volatility', className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' };
  } else {
    const hash = clean.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    if (hash % 3 === 0) {
      return { label: 'Low Volatility', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
    } else if (hash % 3 === 1) {
      return { label: 'Medium Volatility', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
    } else {
      return { label: 'High Volatility', className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' };
    }
  }
}

function generateMockSparklineData(price: number, changePercent: number, symbol: string): number[] {
  const seed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const points: number[] = [];
  const steps = 6;
  const startPrice = price / (1 + changePercent / 100);
  
  for (let i = 0; i <= steps; i++) {
    const fraction = i / steps;
    let val = startPrice + (price - startPrice) * fraction;
    if (i > 0 && i < steps) {
      const noise = (Math.sin(seed + i) * 0.15 * Math.abs(price - startPrice)) / steps;
      val += noise;
    }
    points.push(parseFloat(val.toFixed(2)));
  }
  return points;
}

interface StockCardProps {
  symbol: string;
  initialQuote?: {
    shortName?: string;
    longName?: string;
    regularMarketPrice?: number;
    regularMarketChange?: number;
    regularMarketChangePercent?: number;
    trailingPE?: number | null;
    epsTrailingTwelveMonths?: number | null;
    sector?: string;
    isRealUpdate?: boolean;
  };
}

export default function StockCard({ symbol, initialQuote }: StockCardProps) {
  const { watchlist, toggleWatchlist } = useStockStore();
  
  const [data, setData] = useState<{
    name: string;
    price: number;
    change: number;
    changePercent: number;
    chart: number[];
    pe: number | null;
    eps: number | null;
    sector: string;
  } | null>(initialQuote ? {
    name: initialQuote.shortName || initialQuote.longName || symbol,
    price: initialQuote.regularMarketPrice || 0,
    change: initialQuote.regularMarketChange || 0,
    changePercent: initialQuote.regularMarketChangePercent || 0,
    chart: [],
    pe: initialQuote.trailingPE !== undefined ? initialQuote.trailingPE : null,
    eps: initialQuote.epsTrailingTwelveMonths !== undefined ? initialQuote.epsTrailingTwelveMonths : null,
    sector: initialQuote.sector || 'Financial Services'
  } : null);

  const [loading, setLoading] = useState(!initialQuote);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const isFavorited = watchlist.includes(symbol);



  // Set up intersection observer to only load chart for visible cards
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '200px' });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  // Update quote data if the initialQuote changes from parent
  useEffect(() => {
    if (initialQuote) {
      setData(prev => ({
        name: initialQuote.shortName || initialQuote.longName || symbol,
        price: initialQuote.regularMarketPrice || 0,
        change: initialQuote.regularMarketChange || 0,
        changePercent: initialQuote.regularMarketChangePercent || 0,
        pe: initialQuote.trailingPE !== undefined ? initialQuote.trailingPE : null,
        eps: initialQuote.epsTrailingTwelveMonths !== undefined ? initialQuote.epsTrailingTwelveMonths : null,
        sector: initialQuote.sector || 'Financial Services',
        chart: prev?.chart || []
      }));
      setLoading(false);
    }
  }, [initialQuote, symbol]);

  const priceVal = data?.price;
  const changePercentVal = data?.changePercent;
  const chartLength = data?.chart?.length || 0;

  // Generate local mock sparkline chart points without blocking network requests
  useEffect(() => {
    if (!isVisible) return;
    if (chartLength > 0 || priceVal === undefined || changePercentVal === undefined) return;
    
    const points = generateMockSparklineData(priceVal, changePercentVal, symbol);
    setData(prev => prev ? { ...prev, chart: points } : null);
  }, [symbol, priceVal, changePercentVal, chartLength, isVisible]);

  // Fallback data fetch if initialQuote was not provided by parent
  useEffect(() => {
    if (initialQuote) return;
    if (!isVisible) return;

    let active = true;
    async function fetchData() {
      try {
        setLoading(true);
        const quoteRes = await axios.get(`/api/stock/quote?symbols=${symbol}`);
        const quote = quoteRes.data?.[0];

        if (!quote) throw new Error('No quote returned');

        const price = quote.regularMarketPrice || 0;
        const pct = quote.regularMarketChangePercent || 0;
        const chartPoints = generateMockSparklineData(price, pct, symbol);

        if (active) {
          setData({
            name: quote.shortName || quote.longName || symbol,
            price,
            change: quote.regularMarketChange || 0,
            changePercent: pct,
            chart: chartPoints,
            pe: quote.trailingPE,
            eps: quote.epsTrailingTwelveMonths,
            sector: quote.sector || 'Financial Services'
          });
          setLoading(false);
        }
      } catch (err) {
        console.error(`Failed to fetch card data for ${symbol}`, err);
        if (active) setLoading(false);
      }
    }

    fetchData();
    return () => {
      active = false;
    };
  }, [symbol, initialQuote, isVisible]);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWatchlist(symbol);
  };

  if (loading) {
    return (
      <div ref={containerRef} className="w-full">
        {/* Mobile Skeleton */}
        <div className="flex sm:hidden items-center justify-between w-full p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-3 min-w-0 max-w-[55%]">
            <div className="h-7 w-7 rounded-lg animate-shimmer shrink-0" />
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="h-3.5 w-16 animate-shimmer rounded" />
              <div className="h-2.5 w-24 animate-shimmer rounded" />
            </div>
          </div>
          <div className="h-6 w-16 animate-shimmer rounded-lg shrink-0" />
          <div className="flex flex-col items-end space-y-1.5 shrink-0">
            <div className="h-3.5 w-16 animate-shimmer rounded" />
            <div className="h-2.5 w-12 animate-shimmer rounded" />
          </div>
        </div>

        {/* Desktop Skeleton */}
        <div className="hidden sm:flex flex-col w-full rounded-2xl border border-border bg-card p-5 shadow-soft dark:shadow-soft-dark gap-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-xl animate-shimmer shrink-0" />
              <div className="space-y-1.5 min-w-0">
                <div className="h-3.5 w-16 animate-shimmer rounded" />
                <div className="h-3 w-28 animate-shimmer rounded" />
              </div>
            </div>
            <div className="h-7 w-7 animate-shimmer rounded-lg" />
          </div>
          <div className="mt-4 space-y-1.5">
            <div className="h-6 w-28 animate-shimmer rounded" />
            <div className="h-3.5 w-20 animate-shimmer rounded" />
          </div>
          <div className="flex justify-between items-end mt-6 pt-2 border-t border-border/30">
            <div className="h-3 w-10 animate-shimmer rounded" />
            <div className="h-8 w-24 animate-shimmer rounded" />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-border/30">
            <div className="h-3 w-12 animate-shimmer rounded" />
            <div className="h-3 w-12 animate-shimmer rounded justify-self-end" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const isPositive = data.changePercent >= 0;

  const volatility = getVolatility(symbol);

  const cleanSymbol = symbol.toUpperCase().replace('.NS', '').replace('.BO', '');

  return (
    <div ref={containerRef} className="relative w-full group">
      <Link 
        href={`/stock/${encodeURIComponent(cleanSymbol)}`}
        className="block w-full animate-fade-in"
      >
      
      {/* MOBILE LAYOUT: Compact List Row */}
      <div className={`flex sm:hidden items-center justify-between w-full p-2.5 rounded-xl border bg-glass transition-all duration-150 active:scale-[0.98] ${
        isPositive 
          ? 'border-emerald-500/10 dark:border-emerald-500/5 shadow-glow-profit hover:bg-emerald-500/5' 
          : 'border-rose-500/10 dark:border-rose-500/5 shadow-glow-loss hover:bg-rose-500/5'
      }`}>
        {/* Left Ticker & Name & PE Badge */}
        <div className="flex items-center gap-2 min-w-0 max-w-[45%]">
          <StockLogo symbol={symbol} size="sm" />
          <div className="flex flex-col min-w-0">
            <div className="flex flex-wrap items-center gap-1">
              <span className="font-extrabold text-[11px] text-text-primary truncate">{symbol.split('.')[0]}</span>
              {!symbol.startsWith('^') && (
                <span className="text-[6.5px] font-bold px-0.5 rounded bg-background border border-border text-text-secondary uppercase select-none">
                  EQ
                </span>
              )}
              {!symbol.startsWith('^') && (
                <span className={`text-[6.5px] font-bold px-0.5 rounded border ${volatility.className} uppercase select-none`}>
                  {volatility.label.split(' ')[0]}
                </span>
              )}
            </div>
            <span className="text-[9px] text-text-secondary truncate mt-0.5">{data.name}</span>
            <div className="flex gap-1 mt-1 flex-wrap">
              <span className="text-[7.5px] font-medium px-1 py-0.5 rounded bg-background border border-border text-text-secondary max-w-[70px] truncate">
                {data.sector}
              </span>
              {data.pe && (
                <span className="text-[7.5px] font-extrabold text-text-secondary/90 bg-background px-1 py-0.5 rounded border border-border/60">
                  P/E: {data.pe.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center Sparkline */}
        {data.chart.length > 0 && (
          <div className="h-5 w-14 opacity-80 shrink-0">
            <MiniSparkline data={data.chart} isPositive={isPositive} width={56} height={20} />
          </div>
        )}

        {/* Right Price & Percent & Star Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex flex-col items-end">
            <span className="text-[11px] font-extrabold rounded px-1 tabular-nums text-text-primary font-mono">
              ₹{data.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className={`text-[9px] font-extrabold flex items-center gap-0.5 mt-0.5 ${isPositive ? 'text-profit' : 'text-loss'}`}>
              <span>{isPositive ? '▲' : '▼'}</span>
              <span>{isPositive ? '+' : ''}{data.changePercent.toFixed(2)}%</span>
            </span>
          </div>

          <button
            onClick={handleFavoriteClick}
            className={`p-1 rounded-lg border transition-all duration-150 active:scale-90 z-20 shrink-0 ${
              isFavorited
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 shadow-sm'
                : 'border-border text-text-secondary hover:text-text-primary hover:bg-background'
            }`}
            title={isFavorited ? "Remove from Watchlist" : "Add to Watchlist"}
          >
            <Star className={`h-3 w-3 ${isFavorited ? 'fill-current' : ''}`} />
          </button>
          
          <ChevronRight className="h-3.5 w-3.5 text-text-secondary/40 shrink-0" />
        </div>
      </div>

      {/* DESKTOP LAYOUT: Premium Grid Card */}
      <div className={`hidden sm:flex flex-col w-full rounded-2xl border bg-glass p-5 overflow-hidden cursor-pointer ${
        isPositive 
          ? 'border-emerald-500/10 dark:border-emerald-500/5 shadow-glow-profit hover-glow-profit' 
          : 'border-rose-500/10 dark:border-rose-500/5 shadow-glow-loss hover-glow-loss'
      }`}>
        {/* Header Row */}
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <StockLogo symbol={symbol} size="md" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm text-text-primary tracking-tight truncate">
                  {symbol.split('.')[0]}
                </h3>
                {!symbol.startsWith('^') && (
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-background border border-border/80 text-text-secondary select-none uppercase tracking-wider">
                    EQ
                  </span>
                )}
                {!symbol.startsWith('^') && (
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${volatility.className} select-none uppercase tracking-wider`}>
                    {volatility.label}
                  </span>
                )}
              </div>
              <p className="text-xs text-text-secondary truncate max-w-[120px] sm:max-w-[140px] font-medium mt-1">
                {data.name}
              </p>
              <div className="mt-1">
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-background border border-border/60 text-text-secondary">
                  {data.sector}
                </span>
              </div>
            </div>
          </div>
          {/* Star Spacer */}
          <div className="h-7 w-7 shrink-0" />
        </div>

        {/* Price section */}
        <div className="mt-4">
          <div className="text-xl font-extrabold tracking-tight rounded-lg px-2 py-0.5 inline-block tabular-nums text-text-primary font-mono">
            ₹{data.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className={`flex items-center gap-1.5 text-xs font-bold mt-1 ${isPositive ? 'text-profit' : 'text-loss'}`}>
            <span>{isPositive ? '▲' : '▼'}</span>
            <span>{isPositive ? '+' : ''}{data.changePercent.toFixed(2)}%</span>
            <span className="opacity-80">({isPositive ? '+' : ''}{data.change.toFixed(2)})</span>
          </div>
        </div>

        {/* Sparkline Graph */}
        <div className="flex items-end justify-between mt-6 pt-2 border-t border-border/30">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
            Today
          </span>
          {data.chart.length > 0 && (
            <div className="h-8 w-24 opacity-80 hover:opacity-100 transition-opacity">
              <MiniSparkline data={data.chart} isPositive={isPositive} width={96} height={32} />
            </div>
          )}
        </div>

        {/* P/E & EPS Row */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-border/30 text-[10px] text-text-secondary font-semibold">
          <div>
            P/E: <span className="font-extrabold text-text-primary">{data.pe ? data.pe.toFixed(2) : 'N/A'}</span>
          </div>
          <div className="text-right">
            EPS: <span className="font-extrabold text-text-primary">{data.eps ? `₹${data.eps.toFixed(2)}` : 'N/A'}</span>
          </div>
        </div>
      </div>
      </Link>

      {/* Watchlist Toggle - Rendered outside Link to prevent W3C nested anchor warnings */}
      <button
        onClick={handleFavoriteClick}
        className={`hidden sm:block absolute top-[22px] right-5 p-1.5 rounded-lg border transition-all duration-200 z-10 ${
          isFavorited
            ? 'bg-amber-550 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 text-amber-500'
            : 'border-border text-text-secondary hover:text-text-primary hover:bg-background'
        }`}
        title={isFavorited ? "Remove from Watchlist" : "Add to Watchlist"}
      >
        <Star className={`h-3.5 w-3.5 ${isFavorited ? 'fill-current' : ''}`} />
      </button>
    </div>
  );
}
