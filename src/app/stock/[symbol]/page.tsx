'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStockStore } from '@/store/useStockStore';
import { Star, ChevronLeft, Calendar, ShieldCheck, Layers } from 'lucide-react';
import axios from 'axios';
import dynamic from 'next/dynamic';
import StockLogo from '@/components/StockLogo';

// Dynamically import StockChart to disable SSR
const StockChart = dynamic(() => import('@/components/StockChart'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[260px] sm:h-[380px] bg-card rounded-2xl border border-border flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-profit border-t-transparent" />
        <span className="text-xs text-text-secondary font-bold">Preparing chart...</span>
      </div>
    </div>
  )
});

interface QuoteData {
  symbol: string;
  shortName: string;
  longName: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketVolume: number;
  marketCap: number;
  trailingPE: number | null;
  epsTrailingTwelveMonths: number | null;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  sector: string;
  longBusinessSummary: string;
}

const RANGES = [
  { label: '1D', value: '1d' },
  { label: '1M', value: '1mo' },
  { label: '6M', value: '6mo' },
  { label: '1Y', value: '1y' },
  { label: '5Y', value: '5y' }
];

export default function StockDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawSymbol = params?.symbol as string;
  const symbol = rawSymbol ? decodeURIComponent(rawSymbol).toUpperCase() : '';

  const { watchlist, toggleWatchlist } = useStockStore();

  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeRange, setActiveRange] = useState('1d');

  const isFavorited = watchlist.includes(symbol);

  useEffect(() => {
    if (!symbol) return;

    async function fetchQuoteData() {
      try {
        setLoading(true);
        const res = await axios.get(`/api/stock/quote?symbols=${symbol}`);
        if (res.data && res.data.length > 0) {
          setQuote(res.data[0]);
        }
      } catch (err) {
        console.error(`Failed to fetch details for ${symbol}`, err);
      } finally {
        setLoading(false);
      }
    }

    fetchQuoteData();
  }, [symbol]);

  // Dynamically set document title and meta description for SEO
  useEffect(() => {
    if (quote) {
      document.title = `${quote.longName} (${quote.symbol.split('.')[0]}) Share Price, Live Charts & Analysis | OnlyProfit`;
      
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', `Get live price, charts, P/E ratio, EPS, and detailed analysis of ${quote.longName} (${quote.symbol.split('.')[0]}) on OnlyProfit.`);
      }
    }
  }, [quote]);

  // Format volume and market cap in Indian numbering system
  const formatIndianNumber = (num: number, isCurrency: boolean = false) => {
    if (!num) return 'N/A';
    const prefix = isCurrency ? '₹' : '';
    if (num >= 10000000) { // 1 Crore = 10,000,000
      const value = (num / 10000000).toFixed(2);
      if (parseFloat(value) >= 100000) {
        return `${prefix}${(parseFloat(value) / 100000).toFixed(2)} L Cr`;
      }
      return `${prefix}${value} Cr`;
    } else if (num >= 100000) { // 1 Lakh = 100,000
      return `${prefix}${(num / 100000).toFixed(2)} L`;
    }
    return `${prefix}${num.toLocaleString('en-IN')}`;
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Back navigation & Watchlist Button */}
        <div className="flex justify-between items-center">
          <div className="h-4 w-28 animate-shimmer rounded" />
          <div className="h-8 w-32 animate-shimmer rounded-xl" />
        </div>
        
        {/* Stock Header Section */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl animate-shimmer shrink-0" />
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="h-7 w-48 animate-shimmer rounded" />
                <div className="h-5 w-12 animate-shimmer rounded" />
              </div>
              <div className="h-4 w-64 animate-shimmer rounded" />
            </div>
          </div>
          <div className="flex flex-col items-start md:items-end space-y-2 shrink-0">
            <div className="h-8 w-32 animate-shimmer rounded" />
            <div className="h-4 w-24 animate-shimmer rounded" />
          </div>
        </div>

        {/* Main Grid Content */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            {/* Chart Loader */}
            <div className="h-[340px] sm:h-[460px] w-full rounded-2xl border border-border bg-card p-5 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="h-5 w-32 animate-shimmer rounded" />
                <div className="h-8 w-40 animate-shimmer rounded-xl" />
              </div>
              <div className="flex-1 w-full animate-shimmer rounded-xl" />
            </div>
            {/* Company Overview Loader */}
            <div className="h-48 w-full rounded-2xl border border-border bg-card p-6 space-y-4">
              <div className="h-5 w-40 animate-shimmer rounded" />
              <div className="space-y-2">
                <div className="h-3.5 w-full animate-shimmer rounded" />
                <div className="h-3.5 w-full animate-shimmer rounded" />
                <div className="h-3.5 w-3/4 animate-shimmer rounded" />
              </div>
            </div>
          </div>
          <div className="space-y-8">
            {/* Key Metrics Loader */}
            <div className="h-[320px] w-full rounded-2xl border border-border bg-card p-5 space-y-4">
              <div className="h-4 w-36 animate-shimmer rounded" />
              <div className="space-y-3 pt-2">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="flex justify-between items-center py-1">
                    <div className="h-3 w-24 animate-shimmer rounded" />
                    <div className="h-3 w-16 animate-shimmer rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-2xl font-extrabold text-text-primary">Stock not found</h2>
        <p className="text-text-secondary mt-2">The symbol &quot;{symbol}&quot; could not be retrieved.</p>
        <button
          onClick={() => router.push('/')}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-profit px-4 py-2 text-sm font-bold text-white shadow-lg shadow-profit/20 hover:scale-105 transition-transform"
        >
          <ChevronLeft className="h-4 w-4" /> Go back home
        </button>
      </div>
    );
  }

  const isPositive = quote.regularMarketChangePercent >= 0;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 transition-colors duration-300 animate-fade-in">
      
      {/* Back navigation & Watchlist Button */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.push('/')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Dashboard
        </button>
        
        <button
          onClick={() => toggleWatchlist(symbol)}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all duration-200 ${
            isFavorited
              ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 text-amber-500 shadow-sm'
              : 'border-border text-text-secondary bg-card hover:text-text-primary hover:bg-background'
          }`}
        >
          <Star className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
          {isFavorited ? 'Watchlisted' : 'Add to Watchlist'}
        </button>
      </div>

      {/* Stock Header Section */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div className="flex items-start gap-3 sm:gap-4">
          <StockLogo symbol={symbol} size="lg" />
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
                {quote.longName}
              </h1>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-background border border-border text-text-secondary">
                {quote.symbol.split('.')[0]}
              </span>
              <span className="text-[10px] font-extrabold px-2 py-1 rounded-full bg-profit/10 border border-profit/20 text-profit uppercase tracking-wider select-none">
                {symbol.startsWith('^') ? 'Index' : 'NSE Listed'}
              </span>

              <span className="text-[10px] font-extrabold px-2 py-1 rounded-full bg-background border border-border text-text-secondary uppercase tracking-wider select-none">
                EQUITY
              </span>
            </div>
            <p className="text-sm font-semibold text-text-secondary mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>Sector: <strong className="text-text-primary">{quote.sector}</strong></span>
              <span className="text-border hidden sm:inline">•</span>
              <span>Exchange: <strong className="text-text-primary">{symbol.startsWith('^') ? 'INDEX' : 'National Stock Exchange (NSE)'}</strong></span>
            </p>
          </div>
        </div>

        <div className="flex flex-col md:items-end">
          <div className="text-3xl font-extrabold text-text-primary tracking-tight">
            ₹{quote.regularMarketPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className={`flex items-center gap-1.5 text-sm font-bold mt-1 ${isPositive ? 'text-profit' : 'text-loss'}`}>
            <span>{isPositive ? '▲' : '▼'}</span>
            <span>{isPositive ? '+' : ''}{quote.regularMarketChangePercent.toFixed(2)}%</span>
            <span className="opacity-80">({isPositive ? '+' : ''}{quote.regularMarketChange.toFixed(2)})</span>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        
        {/* Left Column (Chart & Overview) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Chart Card */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft dark:shadow-soft-dark">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="font-extrabold text-base text-text-primary tracking-tight">
                Historical Price Trend
              </h2>
              
              {/* Range Filters */}
              <div className="flex p-1 rounded-xl bg-background border border-border/80 self-stretch sm:self-start justify-between sm:justify-start w-full sm:w-auto">
                {RANGES.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setActiveRange(r.value)}
                    className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold text-center transition-all flex-1 sm:flex-none ${
                      activeRange === r.value
                        ? 'bg-card text-profit shadow-sm'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <StockChart symbol={symbol} range={activeRange} isPositive={isPositive} />
          </div>

          {/* Company Overview Section */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft dark:shadow-soft-dark">
            <h2 className="font-extrabold text-base text-text-primary tracking-tight mb-4 flex items-center gap-2">
              <Layers className="h-4 w-4 text-profit" /> Company Overview
            </h2>
            <div className="space-y-4">
              <p className="text-sm text-text-secondary leading-relaxed font-medium">
                {quote.longBusinessSummary}
              </p>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/40">
                <div>
                  <span className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider">Sector</span>
                  <span className="text-sm font-bold text-text-primary mt-0.5 block">{quote.sector}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider">Exchange</span>
                  <span className="text-sm font-bold text-text-primary mt-0.5 block">{symbol.startsWith('^') ? 'INDEX' : 'NSE (National Stock Exchange)'}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (Metrics & Safety Ticker) */}
        <div className="space-y-8">
          
          {/* Key Metrics Grid */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft dark:shadow-soft-dark">
            <h3 className="font-extrabold text-sm text-text-primary tracking-tight mb-4 pb-3 border-b border-border/50">
              Fundamental Key Metrics
            </h3>
            
            <div className="space-y-4">
              
              <div className="flex justify-between items-center py-0.5">
                <span className="text-xs text-text-secondary font-medium">Market Capitalization</span>
                <span className="text-xs font-bold text-text-primary">{formatIndianNumber(quote.marketCap, true)}</span>
              </div>

              <div className="flex justify-between items-center py-0.5">
                <span className="text-xs text-text-secondary font-medium">P/E Ratio</span>
                <span className="text-xs font-bold text-text-primary">
                  {quote.trailingPE ? quote.trailingPE.toFixed(2) : 'N/A'}
                </span>
              </div>

              <div className="flex justify-between items-center py-0.5">
                <span className="text-xs text-text-secondary font-medium">EPS (TTM)</span>
                <span className="text-xs font-bold text-text-primary">
                  {quote.epsTrailingTwelveMonths ? `₹${quote.epsTrailingTwelveMonths.toFixed(2)}` : 'N/A'}
                </span>
              </div>

              <div className="flex justify-between items-center py-0.5">
                <span className="text-xs text-text-secondary font-medium">Volume (Daily)</span>
                <span className="text-xs font-bold text-text-primary">{formatIndianNumber(quote.regularMarketVolume)}</span>
              </div>

              <div className="flex justify-between items-center py-0.5">
                <span className="text-xs text-text-secondary font-medium">52 Week High</span>
                <span className="text-xs font-bold text-profit">₹{quote.fiftyTwoWeekHigh.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between items-center py-0.5">
                <span className="text-xs text-text-secondary font-medium">52 Week Low</span>
                <span className="text-xs font-bold text-loss">₹{quote.fiftyTwoWeekLow.toLocaleString('en-IN')}</span>
              </div>

            </div>
          </div>

          {/* Investment Protection Notice */}
          <div className="rounded-2xl border border-border/80 bg-background/50 p-5 space-y-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-profit shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-text-primary">Analysis & Education Only</h4>
                <p className="text-[10px] text-text-secondary leading-normal mt-1 font-medium">
                  OnlyProfit is a pure market intelligence platform. We do not support buying, selling, or placing orders. Any details provided are strictly for information and educational analysis.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-profit shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-text-primary">Real-time Yahoo Feeds</h4>
                <p className="text-[10px] text-text-secondary leading-normal mt-1 font-medium">
                  Quotes and chart data are updated directly from public market feeds and correspond to standard market sessions. Feeds may be delayed by up to 15 minutes.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FinancialProduct",
            "name": quote.longName,
            "tickerSymbol": quote.symbol.split('.')[0],
            "description": quote.longBusinessSummary,
            "provider": {
              "@type": "Organization",
              "name": "National Stock Exchange of India",
              "url": "https://www.nseindia.com"
            }
          })
        }}
      />
    </div>
  );
}
