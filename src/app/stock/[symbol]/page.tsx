'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStockStore } from '@/store/useStockStore';
import { 
  Star, ChevronLeft, Calendar, 
  GitCompare, Building2, Share2, Bell, Clock, 
  Sparkles, Globe, MapPin, Users, 
  Info, CheckCircle, Copy, Send
} from 'lucide-react';
import { apiClient as axios } from '@/lib/apiClient';
import { isIndianMarketOpen } from '@/lib/marketHours';
import dynamic from 'next/dynamic';
import StockLogo from '@/components/StockLogo';
import NiftyTracker from '@/components/NiftyTracker';
import SensexTracker from '@/components/SensexTracker';

// Dynamically import StockChart to disable SSR
const StockChart = dynamic(() => import('@/components/StockChart'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[280px] sm:h-[420px] bg-card rounded-2xl border border-border flex items-center justify-center animate-pulse">
      <div className="flex flex-col items-center gap-2">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-profit border-t-transparent" />
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
  priceToBook: number | null;
  dividendYield: number | null;
  sectorPE: number;
  sectorPB: number;
  analystRating: number;
  holdings: {
    promoter: number;
    fii: number;
    dii: number;
    retail: number;
  };
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  sector: string;
  industry: string;
  ceo: string;
  longBusinessSummary: string;
  website?: string;
  headquarters?: string;
  leadership?: { name: string; title: string }[];
  isRealUpdate?: boolean;
  roe?: number | null;
}

const RANGES = [
  { label: '1D', value: '1d' },
  { label: '1W', value: '1w' },
  { label: '1M', value: '1mo' },
  { label: '6M', value: '6mo' },
  { label: '1Y', value: '1y' },
  { label: '3Y', value: '3y' },
  { label: '5Y', value: '5y' },
  { label: 'Max', value: 'max' }
];

export default function StockDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawSymbol = params?.symbol as string;
  const symbol = rawSymbol ? decodeURIComponent(rawSymbol).toUpperCase() : '';

  const { 
    watchlist, 
    toggleWatchlist, 
    addToRecentSearches, 
    recentSearches,
    alerts,
    addAlert,
    removeAlert
  } = useStockStore();

  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeRange, setActiveRange] = useState('1d');
  
  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null);
  const prevPriceRef = useRef<number>(0);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'financials' | 'fundamentals' | 'technicals' | 'shareholding' | 'peers' | 'news' | 'profile'>('overview');
  
  // Financial Widget states
  const [finPeriod, setFinPeriod] = useState<'annual' | 'quarterly'>('annual');
  const [finMetric, setFinMetric] = useState<'revenue' | 'profit' | 'ebitda' | 'margin' | 'cashflow'>('revenue');
  const [hoveredFinBar, setHoveredFinBar] = useState<number | null>(null);

  const [financials, setFinancials] = useState<{ annual: any[]; quarterly: any[] } | null>(null);

  // Peers and Sidebar states
  const [peerQuotes, setPeerQuotes] = useState<QuoteData[]>([]);
  const [peersLoading, setPeersLoading] = useState(false);
  const [peerSortKey, setPeerSortKey] = useState<'price' | 'pe' | 'mcap'>('mcap');
  const [trendingQuotes, setTrendingQuotes] = useState<any[]>([]);
  const [recentQuotes, setRecentQuotes] = useState<any[]>([]);

  // Toast Alerts state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  // Share and Alert states
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertTriggerPrice, setAlertTriggerPrice] = useState('');
  const [alertCondition, setAlertCondition] = useState<'above' | 'below'>('above');

  const handleSaveAlert = () => {
    if (!quote) return;
    const priceVal = parseFloat(alertTriggerPrice);
    if (isNaN(priceVal) || priceVal <= 0) {
      triggerToast('Please enter a valid price');
      return;
    }
    
    addAlert({
      symbol,
      price: priceVal,
      condition: alertCondition,
      isActive: true
    });
    
    setShowAlertModal(false);
    triggerToast(`Alert saved: price goes ${alertCondition} ₹${priceVal}`);
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
  };

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  useEffect(() => {
    if (!symbol) return;
    addToRecentSearches(symbol);
  }, [symbol, addToRecentSearches]);

  // Fetch stock detail quote
  useEffect(() => {
    if (!symbol) return;

    async function fetchQuoteData(showLoadingState = true) {
      try {
        if (showLoadingState) setLoading(true);
        const res = await axios.get(`/api/stock/quote?symbols=${symbol}`);
        if (res.data && res.data.length > 0) {
          setQuote({
            ...res.data[0],
            isRealUpdate: true
          });
        }
      } catch (err) {
        console.error(`Failed to fetch details for ${symbol}`, err);
      } finally {
        if (showLoadingState) setLoading(false);
      }
    }

    fetchQuoteData(true);

    // Poll for fresh stock details every 3 seconds during market hours
    const pollInterval = setInterval(() => {
      if (isIndianMarketOpen()) {
        fetchQuoteData(false);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [symbol]);

  // Fetch real-world financials from server API
  useEffect(() => {
    if (!symbol) return;
    async function fetchFinancials() {
      try {
        const res = await axios.get(`/api/stock/financials?symbol=${symbol}`);
        if (res.data && res.data.success && res.data.data) {
          setFinancials(res.data.data);
        } else {
          setFinancials(null);
        }
      } catch (err) {
        console.error('Failed to fetch real financials:', err);
        setFinancials(null);
      }
    }
    fetchFinancials();
  }, [symbol]);

  // Real-time stock price micro-fluctuations (every 1.0 second like NSE)
  useEffect(() => {
    if (loading) return;
    
    const interval = setInterval(() => {
      // Do not fluctuate prices client-side when the market is closed
      if (!isIndianMarketOpen()) return;

      setQuote(prev => {
        if (!prev) return null;
        const prevClose = prev.regularMarketPrice - prev.regularMarketChange;
        // Smaller change percentage per second (between -0.015% and +0.015%)
        const pct = (Math.random() - 0.495) * 0.0003; 
        const newPrice = prev.regularMarketPrice * (1 + pct);
        const newChange = newPrice - prevClose;
        const newChangePercent = prevClose > 0 ? (newChange / prevClose) * 100 : 0;
        
        return {
          ...prev,
          regularMarketPrice: parseFloat(newPrice.toFixed(2)),
          regularMarketChange: parseFloat(newChange.toFixed(2)),
          regularMarketChangePercent: parseFloat(newChangePercent.toFixed(2)),
          isRealUpdate: false
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [loading]);

  // Price movement flash listener
  useEffect(() => {
    if (!quote?.regularMarketPrice) return;
    if (prevPriceRef.current && prevPriceRef.current !== quote.regularMarketPrice) {
      if (quote.isRealUpdate) {
        const dir = quote.regularMarketPrice > prevPriceRef.current ? 'up' : 'down';
        setPriceFlash(dir);
        const timer = setTimeout(() => setPriceFlash(null), 1500); // 1.5s lazy transition
        prevPriceRef.current = quote.regularMarketPrice;
        return () => clearTimeout(timer);
      }
    }
    prevPriceRef.current = quote.regularMarketPrice;
  }, [quote?.regularMarketPrice, quote?.isRealUpdate]);

  // Fetch trending stocks
  useEffect(() => {
    async function fetchTrending() {
      try {
        const res = await axios.get('/api/stock/quote?symbols=RELIANCE.NS,TCS.NS,INFY.NS,TMPV.NS,TMCV.NS,HDFCBANK.NS');
        if (res.data) setTrendingQuotes(res.data);
      } catch (err) {
        console.error('Failed to fetch trending quotes', err);
      }
    }
    fetchTrending();
  }, []);

  // Fetch recently viewed quotes
  useEffect(() => {
    if (recentSearches.length === 0) return;
    async function fetchRecents() {
      try {
        const symbolsToFetch = recentSearches.filter(s => s !== symbol && !/^\d+$/.test(s)).slice(0, 3);
        if (symbolsToFetch.length === 0) {
          setRecentQuotes([]);
          return;
        }
        const res = await axios.get(`/api/stock/quote?symbols=${symbolsToFetch.join(',')}`);
        if (res.data) setRecentQuotes(res.data);
      } catch (err) {
        console.error('Failed to fetch recent quotes', err);
      }
    }
    fetchRecents();
  }, [recentSearches, symbol]);

  // Fetch peer quotes
  useEffect(() => {
    if (!quote) return;
    const peers = getPeersList(quote.symbol, quote.sector);
    if (peers.length === 0) {
      setPeerQuotes([]);
      return;
    }

    async function fetchPeers() {
      try {
        setPeersLoading(true);
        const res = await axios.get(`/api/stock/quote?symbols=${peers.join(',')}`);
        if (res.data) {
          setPeerQuotes(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch peers quotes', err);
      } finally {
        setPeersLoading(false);
      }
    }

    fetchPeers();
  }, [quote]);

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

  if (!symbol) return null;

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

  const fallbackCopyText = (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      triggerToast('Share link copied to clipboard!');
    } catch (err) {
      console.error('Fallback copy failed', err);
      triggerToast('Failed to copy link');
    }
    document.body.removeChild(textArea);
  };

  const copyShareLink = () => {
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url)
          .then(() => triggerToast('Share link copied to clipboard!'))
          .catch(() => fallbackCopyText(url));
      } else {
        fallbackCopyText(url);
      }
    }
  };

  const handleShareClick = () => {
    if (!quote) return;
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: `${quote.longName} (${quote.symbol.split('.')[0]}) Share Price, Live Charts & Analysis | OnlyProfit`,
        text: `Check out ${quote.longName} (${quote.symbol.split('.')[0]}) live price at ₹${quote.regularMarketPrice.toLocaleString('en-IN')} on OnlyProfit!`,
        url: window.location.href,
      }).catch((err) => {
        console.log('Native share failed or dismissed, opening custom fallback', err);
        setShowShareMenu(true);
      });
    } else {
      setShowShareMenu(!showShareMenu);
    }
  };

  const getMarketStatus = () => {
    const now = new Date();
    const day = now.getDay();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const timeInMinutes = hours * 60 + minutes;
    
    const isOpenDay = day >= 1 && day <= 5; // Monday to Friday
    const isOpenTime = timeInMinutes >= 9 * 60 + 15 && timeInMinutes <= 15 * 60 + 30; // 9:15 AM to 3:30 PM
    
    if (isOpenDay && isOpenTime) {
      return { status: 'LIVE', desc: 'Market Open', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
    } else {
      return { status: 'CLOSED', desc: 'Market Closed', color: 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20' };
    }
  };

  function getPeersList(symbol: string, sector: string): string[] {
    const clean = symbol.toUpperCase();
    const it = ['TCS.NS', 'INFY.NS', 'WIPRO.NS', 'HCLTECH.NS'];
    const banking = ['HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'AXISBANK.NS', 'KOTAKBANK.NS', 'BAJFINANCE.NS', 'JIOFIN.NS'];
    const auto = ['TMPV.NS', 'TMCV.NS', 'M&M.NS', 'MARUTI.NS', 'HEROMOTOCO.NS'];
    const fmcg = ['ITC.NS', 'HINDUNILVR.NS', 'NESTLEIND.NS', 'TITAN.NS'];
    const metals = ['JSWSTEEL.NS', 'TATASTEEL.NS', 'HINDALCO.NS', 'COALINDIA.NS'];
    const energy = ['BPCL.NS', 'ONGC.NS', 'NTPC.NS', 'POWERGRID.NS'];
    const infra = ['RELIANCE.NS', 'ADANIENT.NS', 'ADANIPORTS.NS', 'LT.NS'];

    let group: string[] = [];
    if (it.includes(clean)) group = it;
    else if (banking.includes(clean)) group = banking;
    else if (auto.includes(clean)) group = auto;
    else if (fmcg.includes(clean)) group = fmcg;
    else if (metals.includes(clean)) group = metals;
    else if (energy.includes(clean)) group = energy;
    else if (infra.includes(clean)) group = infra;
    else {
      const lowerSector = sector.toLowerCase();
      if (lowerSector.includes('it') || lowerSector.includes('software')) group = it;
      else if (lowerSector.includes('bank') || lowerSector.includes('financial') || lowerSector.includes('finance')) group = banking;
      else if (lowerSector.includes('auto') || lowerSector.includes('motor') || lowerSector.includes('car')) group = auto;
      else if (lowerSector.includes('fmcg') || lowerSector.includes('consumer') || lowerSector.includes('food')) group = fmcg;
      else if (lowerSector.includes('metal') || lowerSector.includes('steel') || lowerSector.includes('mining')) group = metals;
      else if (lowerSector.includes('power') || lowerSector.includes('utility') || lowerSector.includes('oil') || lowerSector.includes('gas')) group = energy;
      else group = infra;
    }
    return group.filter(s => s !== clean).slice(0, 4);
  }

  // Skeletons while fetching details
  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-4 w-28 animate-pulse bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-8 w-32 animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
        
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-2xl animate-pulse bg-slate-200 dark:bg-slate-800 shrink-0" />
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="h-7 w-48 animate-pulse bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-5 w-12 animate-pulse bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
              <div className="h-4 w-64 animate-pulse bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
          </div>
          <div className="flex flex-col items-start md:items-end space-y-2 shrink-0">
            <div className="h-8 w-32 animate-pulse bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-4 w-24 animate-pulse bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <div className="h-[380px] w-full rounded-2xl border border-border bg-card p-5 animate-pulse bg-slate-200/50 dark:bg-slate-800/30" />
            <div className="h-48 w-full rounded-2xl border border-border bg-card p-6 space-y-4 animate-pulse bg-slate-200/50 dark:bg-slate-800/30" />
          </div>
          <div className="h-96 w-full rounded-2xl border border-border bg-card p-5 animate-pulse bg-slate-200/50 dark:bg-slate-800/30" />
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-2xl font-black text-text-primary tracking-tight">Stock symbol not found</h2>
        <p className="text-text-secondary mt-2">The ticker &quot;{symbol}&quot; could not be resolved.</p>
        <button
          onClick={() => router.push('/')}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-profit px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-profit/20 hover:scale-105 transition-transform"
        >
          <ChevronLeft className="h-4 w-4" /> Return to Dashboard
        </button>
      </div>
    );
  }

  if (symbol === '^NSEI') {
    return (
      <NiftyTracker 
        symbol={symbol} 
        indexQuote={quote} 
        onBack={() => router.push('/')} 
      />
    );
  }

  if (symbol === '^BSESN') {
    return (
      <SensexTracker 
        symbol={symbol} 
        indexQuote={quote} 
        onBack={() => router.push('/')} 
      />
    );
  }

  const isFavorited = watchlist.includes(symbol);
  const isPositive = quote.regularMarketChangePercent >= 0;
  const marketStatus = getMarketStatus();

  // Seeded metric variables
  // Seeded metric variables with real-world fallback
  const roe = quote.roe !== undefined && quote.roe !== null
    ? quote.roe
    : (quote.priceToBook && quote.trailingPE && quote.trailingPE > 0
      ? (quote.priceToBook / quote.trailingPE) * 100
      : (quote.symbol.charCodeAt(0) % 8) + 12.4); 
  const roce = roe * 1.25;

  const sectorLower = quote.sector.toLowerCase();
  const debtToEquity = sectorLower.includes('it') || sectorLower.includes('software') || sectorLower.includes('fmcg')
    ? (quote.symbol.charCodeAt(0) % 5) * 0.04 
    : sectorLower.includes('bank') || sectorLower.includes('financial')
    ? (quote.symbol.charCodeAt(0) % 5) * 0.2 + 0.45 
    : (quote.symbol.charCodeAt(0) % 5) * 0.22 + 0.35; 

  const bookValue = quote.regularMarketPrice / (quote.priceToBook || 2.45);
  const eps = quote.epsTrailingTwelveMonths || (quote.regularMarketPrice / (quote.trailingPE || 20));

  // Detail Financial data generator (fallbacks to mock data if API call fails or is loading)
  const financialsData = financials || getDetailedFinancials(quote.symbol, quote.marketCap);

  // Technical analysis scores generator
  const technicals = getTechnicalAnalysis(quote.symbol, quote.regularMarketPrice);

  // Shareholding data splits
  const promoter = quote.holdings?.promoter || 52.4;
  const fii = quote.holdings?.fii || 16.2;
  const dii = quote.holdings?.dii || 14.8;
  const mf = Math.floor(dii * 0.62);
  const otherDii = dii - mf;
  const retail = 100 - (promoter + fii + dii);

  // Mock News list
  const newsList = getMockNews(quote.symbol, quote.longName);
  const eventsList = getMockEvents();

  // Recommendation Card suggestions

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 transition-colors duration-300 animate-fade-in space-y-6">
      
      {/* Toast popup */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-5 py-3 rounded-2xl shadow-premium z-50 text-xs font-bold flex items-center gap-2 animate-fade-in border border-white/10 dark:border-black/5">
          <CheckCircle className="h-4 w-4 text-emerald-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb back navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Dashboard
        </button>
      </div>

      {/* Premium Glassmorphism Hero Section */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-soft dark:shadow-soft-dark flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-profit/5 rounded-full filter blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-indigo-500/5 rounded-full filter blur-2xl pointer-events-none" />

        <div className="flex items-start sm:items-center gap-4 relative z-10">
          <StockLogo symbol={quote.symbol} website={quote.website} size="lg" />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
                {quote.longName}
              </h1>
              <span className="text-xs font-black px-2 py-0.5 rounded bg-background border border-border text-text-secondary">
                {quote.symbol.split('.')[0]}
              </span>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${marketStatus.color} uppercase tracking-wider select-none`}>
                {marketStatus.desc}
              </span>
            </div>
            
            <p className="text-xs font-bold text-text-secondary flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>Sector: <strong className="text-text-primary">{quote.sector}</strong></span>
              <span className="text-border">•</span>
              <span>Industry: <strong className="text-text-primary">{quote.industry || 'Diversified'}</strong></span>
              <span className="text-border">•</span>
              <span>Exchange: <strong className="text-text-primary">{symbol.startsWith('^') ? 'INDEX' : 'NSE'}</strong></span>
            </p>
          </div>
        </div>

        {/* Price display and CTA actions */}
        <div className="flex flex-col md:items-end justify-between gap-4 relative z-10 shrink-0">
          <div className="flex flex-col md:items-end">
            <div className={`text-3xl font-black tracking-tight transition-colors ease-out rounded-xl px-2 py-0.5 inline-block ${
              priceFlash === 'up' 
                ? 'text-profit duration-0' 
                : priceFlash === 'down' 
                ? 'text-loss duration-0' 
                : 'text-text-primary duration-[1500ms]'
            }`}>
              ₹{quote.regularMarketPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className={`flex items-center gap-1.5 text-xs font-black mt-1 ${isPositive ? 'text-profit' : 'text-loss'}`}>
              <span>{isPositive ? '▲' : '▼'}</span>
              <span>{isPositive ? '+' : ''}{quote.regularMarketChangePercent.toFixed(2)}%</span>
              <span className="opacity-80">({isPositive ? '+' : ''}{quote.regularMarketChange.toFixed(2)})</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => toggleWatchlist(symbol)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all duration-200 ${
                isFavorited
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-sm'
                  : 'border-border text-text-secondary bg-card hover:text-text-primary hover:bg-background'
              }`}
            >
              <Star className={`h-4 w-4 ${isFavorited ? 'fill-current text-amber-500' : ''}`} />
              <span>{isFavorited ? 'Watchlisted' : 'Watchlist'}</span>
            </button>

            <button
              onClick={() => router.push(`/compare?symbol=${quote.symbol}`)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border text-xs font-bold text-text-secondary bg-card hover:text-text-primary hover:bg-background transition-all"
            >
              <GitCompare className="h-4 w-4" />
              <span>Compare</span>
            </button>

            {/* Share Button with Native / Custom Fallback */}
            <div className="relative">
              <button
                onClick={handleShareClick}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border text-xs font-bold text-text-secondary bg-card hover:text-text-primary hover:bg-background transition-all"
                title="Share options"
              >
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </button>
              
              {/* Desktop Dropdown Fallback */}
              {showShareMenu && (
                <div className="hidden md:block">
                  <div 
                    className="fixed inset-0 z-20 cursor-default" 
                    onClick={() => setShowShareMenu(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-premium dark:shadow-premium-dark p-2 z-30 animate-fade-in flex flex-col gap-1">
                    <button
                      onClick={() => {
                        copyShareLink();
                        setShowShareMenu(false);
                      }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-left text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-background rounded-lg transition-colors"
                    >
                      <Copy className="h-3.5 w-3.5 text-text-secondary" />
                      <span>Copy Link</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          const text = `Check out ${quote.longName} (${quote.symbol.split('.')[0]}) live price at ₹${quote.regularMarketPrice.toLocaleString('en-IN')} on OnlyProfit: ${window.location.href}`;
                          window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
                        }
                        setShowShareMenu(false);
                      }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-left text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-background rounded-lg transition-colors"
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current text-profit">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.456L0 24zm6.59-4.846c1.6.95 3.488 1.449 5.412 1.451 5.428 0 9.85-4.417 9.854-9.842.002-2.628-1.02-5.1-2.875-6.958C17.18 1.846 14.71 .825 12.01.825c-5.437 0-9.86 4.418-9.863 9.843-.001 1.926.501 3.805 1.458 5.41l-.955 3.486 3.576-.938zm11.367-6.406c-.31-.156-1.834-.905-2.11-.1-.28.1-.482.4-.592.5-.11.11-.22.12-.53-.04-.31-.156-1.3-.48-2.478-1.53-.918-.82-1.537-1.83-1.72-2.14-.18-.31-.02-.48.136-.635.14-.14.31-.36.467-.54.156-.18.21-.31.31-.52.1-.2.05-.38-.025-.54-.075-.156-.675-1.63-.925-2.235-.244-.587-.49-.508-.675-.518-.174-.01-.373-.01-.572-.01-.2 0-.523.074-.797.373-.273.3-1.045 1.02-1.045 2.487 0 1.468 1.07 2.885 1.22 3.085.15.2 2.103 3.2 5.093 4.49.71.3 1.266.49 1.7.63.715.225 1.366.193 1.88.117.573-.085 1.834-.75 2.09-1.437.258-.687.258-1.278.18-1.4-.078-.125-.285-.203-.593-.36z" />
                      </svg>
                      <span>Share on WhatsApp</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          const text = `Check out ${quote.longName} (${quote.symbol.split('.')[0]}) on OnlyProfit`;
                          window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
                        }
                        setShowShareMenu(false);
                      }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-left text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-background rounded-lg transition-colors"
                    >
                      <Send className="h-3.5 w-3.5 text-sky-500" />
                      <span>Share on Telegram</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Bottom Sheet Drawer Fallback */}
            {showShareMenu && (
              <div className="block md:hidden fixed inset-0 z-50 animate-fade-in">
                <div 
                  className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
                  onClick={() => setShowShareMenu(false)}
                />
                <div className="absolute bottom-0 inset-x-0 bg-card border-t border-border rounded-t-3xl shadow-premium dark:shadow-premium-dark p-6 z-10 animate-slide-up space-y-4">
                  <div className="w-12 h-1 bg-border rounded-full mx-auto mb-2" />
                  
                  <div>
                    <h3 className="font-extrabold text-sm text-text-primary uppercase tracking-wider">Share Stock</h3>
                    <p className="text-[10px] text-text-secondary font-medium mt-0.5">Select a method to share {quote.longName}.</p>
                  </div>
                  
                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      onClick={() => {
                        copyShareLink();
                        setShowShareMenu(false);
                      }}
                      className="flex items-center gap-3.5 w-full px-4 py-3 bg-background border border-border/80 hover:bg-background/80 rounded-xl transition-colors text-left"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-text-secondary/10 text-text-secondary">
                        <Copy className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-text-primary">Copy Link</span>
                        <span className="text-[9px] text-text-secondary font-medium">Copy direct link to clipboard</span>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          const text = `Check out ${quote.longName} (${quote.symbol.split('.')[0]}) live price at ₹${quote.regularMarketPrice.toLocaleString('en-IN')} on OnlyProfit: ${window.location.href}`;
                          window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
                        }
                        setShowShareMenu(false);
                      }}
                      className="flex items-center gap-3.5 w-full px-4 py-3 bg-background border border-border/80 hover:bg-background/80 rounded-xl transition-colors text-left"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-profit/10 text-profit">
                        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.456L0 24zm6.59-4.846c1.6.95 3.488 1.449 5.412 1.451 5.428 0 9.85-4.417 9.854-9.842.002-2.628-1.02-5.1-2.875-6.958C17.18 1.846 14.71 .825 12.01.825c-5.437 0-9.86 4.418-9.863 9.843-.001 1.926.501 3.805 1.458 5.41l-.955 3.486 3.576-.938zm11.367-6.406c-.31-.156-1.834-.905-2.11-.1-.28.1-.482.4-.592.5-.11.11-.22.12-.53-.04-.31-.156-1.3-.48-2.478-1.53-.918-.82-1.537-1.83-1.72-2.14-.18-.31-.02-.48.136-.635.14-.14.31-.36.467-.54.156-.18.21-.31.31-.52.1-.2.05-.38-.025-.54-.075-.156-.675-1.63-.925-2.235-.244-.587-.49-.508-.675-.518-.174-.01-.373-.01-.572-.01-.2 0-.523.074-.797.373-.273.3-1.045 1.02-1.045 2.487 0 1.468 1.07 2.885 1.22 3.085.15.2 2.103 3.2 5.093 4.49.71.3 1.266.49 1.7.63.715.225 1.366.193 1.88.117.573-.085 1.834-.75 2.09-1.437.258-.687.258-1.278.18-1.4-.078-.125-.285-.203-.593-.36z" />
                          </svg>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-text-primary">Share on WhatsApp</span>
                          <span className="text-[9px] text-text-secondary font-medium">Send to a contact or group on WhatsApp</span>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            const text = `Check out ${quote.longName} (${quote.symbol.split('.')[0]}) on OnlyProfit`;
                            window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
                          }
                          setShowShareMenu(false);
                        }}
                        className="flex items-center gap-3.5 w-full px-4 py-3 bg-background border border-border/80 hover:bg-background/80 rounded-xl transition-colors text-left"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-500">
                          <Send className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-text-primary">Share on Telegram</span>
                          <span className="text-[9px] text-text-secondary font-medium">Post to a channel or chat on Telegram</span>
                        </div>
                      </button>
                    </div>
                    
                    <button
                      onClick={() => setShowShareMenu(false)}
                      className="w-full mt-2 py-3 text-center text-xs font-black text-text-secondary hover:text-text-primary bg-background/50 border border-border/60 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

            <button
              onClick={() => {
                setAlertTriggerPrice(quote.regularMarketPrice.toFixed(2));
                setAlertCondition('above');
                setShowAlertModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border text-xs font-bold text-text-secondary bg-card hover:text-text-primary hover:bg-background transition-all"
              title="Set Alert"
            >
              <Bell className="h-4 w-4" />
              <span>Set Alert</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid Content (Max 1280px) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
        
        {/* Left Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Interactive Chart Container */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-soft dark:shadow-soft-dark space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
              <div>
                <h2 className="font-extrabold text-sm text-text-primary uppercase tracking-wider">
                  Interactive Price Chart
                </h2>
                <p className="text-[10px] text-text-secondary font-medium mt-0.5">Live stock price trajectory mapped across custom intervals.</p>
              </div>
              
              {/* Range Filters */}
              <div className="flex p-0.5 rounded-xl bg-background border border-border self-stretch sm:self-start justify-between sm:justify-start overflow-x-auto scrollbar-none w-full sm:w-auto">
                {RANGES.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setActiveRange(r.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
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

          {/* Sticky Tabbed Section strip */}
          <div className="sticky top-[68px] z-20 bg-background/95 backdrop-blur-md py-2.5 border-b border-border/80 flex items-center gap-1 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 text-xs font-black rounded-xl transition-all whitespace-nowrap border shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-profit/10 border-profit/25 text-profit'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Active Tab Panel Content */}
          <div className="transition-all duration-200">
            
            {/* 1. Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Visual Sliders: Day Range & 52-Week Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-card border border-border p-5 rounded-2xl shadow-soft dark:shadow-soft-dark">
                  <div className="space-y-2 p-3.5 rounded-xl bg-background/50 border border-border/50">
                    <div className="flex justify-between items-center text-[10px] font-black text-text-secondary uppercase tracking-wider">
                      <span>Day Range</span>
                      <span className="text-text-primary">Current: ₹{quote.regularMarketPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="relative pt-1">
                      <div className="flex mb-1.5 items-center justify-between text-[10px] font-bold text-text-secondary">
                        <span>L: ₹{quote.regularMarketDayLow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        <span>H: ₹{quote.regularMarketDayHigh.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="overflow-hidden h-1.5 text-xs flex rounded-full bg-border relative items-center">
                        <div 
                          style={{ 
                            width: `${quote.regularMarketDayHigh === quote.regularMarketDayLow ? 50 : Math.min(100, Math.max(0, ((quote.regularMarketPrice - quote.regularMarketDayLow) / (quote.regularMarketDayHigh - quote.regularMarketDayLow)) * 100))}%` 
                          }}
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-profit/40 h-full rounded-full"
                        />
                        <div
                          style={{ 
                            left: `${quote.regularMarketDayHigh === quote.regularMarketDayLow ? 50 : Math.min(100, Math.max(0, ((quote.regularMarketPrice - quote.regularMarketDayLow) / (quote.regularMarketDayHigh - quote.regularMarketDayLow)) * 100))}%` 
                          }}
                          className="absolute w-2.5 h-2.5 rounded-full bg-profit border-2 border-card -ml-1.5 shadow"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 p-3.5 rounded-xl bg-background/50 border border-border/50">
                    <div className="flex justify-between items-center text-[10px] font-black text-text-secondary uppercase tracking-wider">
                      <span>52-Week Range</span>
                      <span className="text-text-primary">Current: ₹{quote.regularMarketPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="relative pt-1">
                      <div className="flex mb-1.5 items-center justify-between text-[10px] font-bold text-text-secondary">
                        <span className="text-loss">L: ₹{quote.fiftyTwoWeekLow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        <span className="text-profit">H: ₹{quote.fiftyTwoWeekHigh.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="overflow-hidden h-1.5 text-xs flex rounded-full bg-border relative items-center">
                        <div 
                          style={{ 
                            width: `${quote.fiftyTwoWeekHigh === quote.fiftyTwoWeekLow ? 50 : Math.min(100, Math.max(0, ((quote.regularMarketPrice - quote.fiftyTwoWeekLow) / (quote.fiftyTwoWeekHigh - quote.fiftyTwoWeekLow)) * 100))}%` 
                          }}
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-profit/40 h-full rounded-full"
                        />
                        <div
                          style={{ 
                            left: `${quote.fiftyTwoWeekHigh === quote.fiftyTwoWeekLow ? 50 : Math.min(100, Math.max(0, ((quote.regularMarketPrice - quote.fiftyTwoWeekLow) / (quote.fiftyTwoWeekHigh - quote.fiftyTwoWeekLow)) * 100))}%` 
                          }}
                          className="absolute w-2.5 h-2.5 rounded-full bg-profit border-2 border-card -ml-1.5 shadow"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-soft dark:shadow-soft-dark space-y-4">
                  <div>
                    <h3 className="font-extrabold text-sm text-text-primary uppercase tracking-wider">
                      Valuation and Performance Metrics
                    </h3>
                    <p className="text-[10px] text-text-secondary font-medium">Core efficiency, capital strength, and valuation ratios with market context.</p>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 pt-2">
                    {[
                      { label: 'Market Cap', value: formatIndianNumber(quote.marketCap, true), desc: 'Total Valuation', status: 'Stable' },
                      { label: 'P/E Ratio', value: quote.trailingPE ? quote.trailingPE.toFixed(2) : 'N/A', desc: `Sector P/E: ${quote.sectorPE.toFixed(2)}`, status: quote.trailingPE && quote.trailingPE < quote.sectorPE ? 'Good' : 'Premium' },
                      { label: 'P/B Ratio', value: quote.priceToBook ? quote.priceToBook.toFixed(2) : 'N/A', desc: `Sector P/B: ${quote.sectorPB.toFixed(2)}`, status: 'Neutral' },
                      { label: 'Dividend Yield', value: quote.dividendYield ? `${quote.dividendYield.toFixed(2)}%` : '0.00%', desc: 'Ind. Avg: 1.18%', status: quote.dividendYield && quote.dividendYield >= 2 ? 'Good' : 'Neutral' },
                      { label: 'ROE (Eq.)', value: `${roe.toFixed(2)}%`, desc: 'Return on Equity', status: roe > 15 ? 'Excellent' : 'Neutral' },
                      { label: 'ROCE', value: `${roce.toFixed(2)}%`, desc: 'Capital Employed', status: roce > 18 ? 'Excellent' : 'Neutral' },
                      { label: 'EPS (TTM)', value: `₹${eps.toFixed(2)}`, desc: 'Earnings Per Share', status: 'Growing' },
                      { label: 'Debt to Equity', value: debtToEquity.toFixed(2), desc: 'Industry Avg: 0.65', status: debtToEquity < 0.5 ? 'Good' : 'High' },
                      { label: 'Book Value', value: `₹${bookValue.toFixed(2)}`, desc: 'Asset Base Value', status: 'Stable' },
                      { label: 'Industry P/E', value: quote.sectorPE.toFixed(2), desc: 'Sector Average PE', status: 'Neutral' }
                    ].map((m, idx) => (
                      <div key={idx} className="space-y-1.5 p-3 rounded-xl bg-background/40 border border-border/40 hover:border-profit/20 hover:bg-background/80 transition-all duration-150">
                        <span className="block text-[10px] font-black text-text-secondary uppercase tracking-wider">{m.label}</span>
                        <span className="text-base font-black text-text-primary block">{m.value}</span>
                        <div className="flex justify-between items-center text-[9px] font-bold text-text-secondary">
                          <span>{m.desc}</span>
                          {m.status && (
                            <span className={`px-1.5 py-0.2 rounded-full uppercase text-[8px] ${
                              m.status === 'Good' || m.status === 'Excellent' || m.status === 'Growing'
                                ? 'text-profit bg-profit/10'
                                : m.status === 'Premium' || m.status === 'High'
                                ? 'text-amber-500 bg-amber-500/10'
                                : 'text-text-secondary bg-slate-500/10'
                            }`}>{m.status}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Insights Section */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-soft dark:shadow-soft-dark space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-profit" />
                    <div>
                      <h3 className="font-extrabold text-sm text-text-primary uppercase tracking-wider">AI-Powered Insights</h3>
                      <p className="text-[10px] text-text-secondary font-medium">Auto-generated business intelligence summaries based on financial parameters.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {
                        title: 'Valuation Assessment',
                        score: '85%',
                        desc: quote.trailingPE && quote.trailingPE < quote.sectorPE
                          ? `The stock trades at P/E ${quote.trailingPE.toFixed(2)}, which is discounted relative to its sector average of ${quote.sectorPE.toFixed(2)}.`
                          : `The stock commands a premium pricing of P/E ${quote.trailingPE ? quote.trailingPE.toFixed(2) : 'N/A'}, reflecting high future growth expectations.`,
                        isPositive: quote.trailingPE ? quote.trailingPE < quote.sectorPE : true
                      },
                      {
                        title: 'Capital Profitability',
                        score: '92%',
                        desc: `With a Return on Equity (ROE) of ${roe.toFixed(1)}% and ROCE of ${roce.toFixed(1)}%, the company displays exceptional efficiency in deploying shareholder equity.`,
                        isPositive: roe > 15
                      },
                      {
                        title: 'Leverage and Solvency',
                        score: '88%',
                        desc: debtToEquity < 0.5
                          ? `Healthy debt-to-equity ratio of ${debtToEquity.toFixed(2)} indicating robust balance sheet stability and very low risk of default.`
                          : `High leverage of ${debtToEquity.toFixed(2)} relative to equity base. Interest coverage indicators warrant additional inspection.`,
                        isPositive: debtToEquity < 0.5
                      },
                      {
                        title: 'Sector Performance',
                        score: '90%',
                        desc: `Exhibiting strong revenue momentum, ${quote.shortName} stands as a market leader in the ${quote.sector} domain.`,
                        isPositive: true
                      }
                    ].map((item, idx) => (
                      <div key={idx} className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
                        item.isPositive 
                          ? 'bg-emerald-500/5 border-emerald-500/20' 
                          : 'bg-amber-500/5 border-amber-500/20'
                      }`}>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-text-primary">{item.title}</span>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${item.isPositive ? 'text-profit bg-profit/10' : 'text-amber-500 bg-amber-500/10'}`}>
                              Confidence: {item.score}
                            </span>
                          </div>
                          <p className="text-[11px] text-text-secondary leading-relaxed font-medium pt-1.5">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>



              </div>
            )}

            {/* 2. Financials Tab */}
            {activeTab === 'financials' && (
              <div className="bg-card border border-border rounded-2xl p-6 shadow-soft dark:shadow-soft-dark space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
                  <div>
                    <h3 className="font-extrabold text-sm text-text-primary uppercase tracking-wider">
                      Financial Performance
                    </h3>
                    <p className="text-[10px] text-text-secondary font-medium mt-0.5">Visualize income statements and cash flow trends.</p>
                  </div>

                  {/* Toggle Annual/Quarterly */}
                  <div className="flex items-center gap-1.5 p-0.5 bg-background border border-border rounded-xl self-start">
                    <button
                      onClick={() => setFinPeriod('annual')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        finPeriod === 'annual'
                          ? 'bg-card text-profit shadow-sm'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      Annual
                    </button>
                    <button
                      onClick={() => setFinPeriod('quarterly')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        finPeriod === 'quarterly'
                          ? 'bg-card text-profit shadow-sm'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      Quarterly
                    </button>
                  </div>
                </div>

                {/* Metric Selection pills */}
                <div className="flex overflow-x-auto gap-2 scrollbar-none pb-1">
                  {[
                    { id: 'revenue', label: 'Revenue' },
                    { id: 'profit', label: 'Net Profit' },
                    { id: 'ebitda', label: 'EBITDA' },
                    { id: 'margin', label: 'Operating Margin (%)' },
                    { id: 'cashflow', label: 'Free Cash Flow' }
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setFinMetric(m.id as any)}
                      className={`px-3.5 py-1.5 text-[11px] font-black rounded-lg border transition-all ${
                        finMetric === m.id
                          ? 'bg-profit/15 border-profit/30 text-profit'
                          : 'border-border text-text-secondary hover:text-text-primary hover:bg-background'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Interactive SVG Bar Chart */}
                <div className="relative py-4">
                  <div className="h-64 w-full flex items-end justify-around border-b border-border/80 pb-2 relative">
                    
                    {/* Background Grid Lines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 z-0">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="border-t border-border w-full h-0" />
                      ))}
                    </div>

                    {(finPeriod === 'annual' ? financialsData.annual : financialsData.quarterly).map((d: any, idx, arr) => {
                      const value = d[finMetric];
                      const maxVal = Math.max(...arr.map((x: any) => x[finMetric]));
                      const heightPct = maxVal > 0 ? (value / maxVal) * 80 : 10;
                      const isHovered = hoveredFinBar === idx;

                      return (
                        <div 
                          key={idx} 
                          className="flex flex-col items-center group relative z-10 w-16"
                          onMouseEnter={() => setHoveredFinBar(idx)}
                          onMouseLeave={() => setHoveredFinBar(null)}
                        >
                          {/* Value Tooltip */}
                          <div className={`absolute -top-12 bg-slate-900 text-white dark:bg-white dark:text-slate-950 px-2.5 py-1.5 rounded-lg text-[10px] font-black shadow-lg transition-all duration-200 pointer-events-none whitespace-nowrap ${
                            isHovered ? 'opacity-100 transform -translate-y-1' : 'opacity-0'
                          }`}>
                            {finMetric === 'margin' ? `${value.toFixed(1)}%` : formatIndianNumber(value, true)}
                          </div>

                          {/* SVG Bar */}
                          <div 
                            className={`w-10 sm:w-12 rounded-t-lg transition-all duration-300 ${
                              isHovered 
                                ? 'bg-profit' 
                                : isPositive 
                                ? 'bg-profit/60' 
                                : 'bg-loss/60'
                            }`}
                            style={{ height: `${heightPct}%`, minHeight: '8px' }}
                          />

                          {/* Label */}
                          <span className="text-[10px] font-black text-text-secondary mt-2 select-none">
                            {d.year}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Data Table details */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border/80 text-[10px] font-bold text-text-secondary uppercase">
                        <th className="py-2.5">Timeline</th>
                        <th className="py-2.5 text-right">Revenue</th>
                        <th className="py-2.5 text-right">EBITDA</th>
                        <th className="py-2.5 text-right">Net Income</th>
                        <th className="py-2.5 text-right">Net Margin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-bold">
                      {(finPeriod === 'annual' ? financialsData.annual : financialsData.quarterly).map((d: any, idx) => (
                        <tr key={idx} className="hover:bg-background/40 transition-colors">
                          <td className="py-3 text-text-primary font-black">{d.year}</td>
                          <td className="py-3 text-right">{formatIndianNumber(d.revenue, true)}</td>
                          <td className="py-3 text-right">{formatIndianNumber(d.ebitda, true)}</td>
                          <td className="py-3 text-right">{formatIndianNumber(d.profit, true)}</td>
                          <td className="py-3 text-right text-profit">{d.margin.toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

            {/* 3. Fundamentals Tab */}
            {activeTab === 'fundamentals' && (
              <div className="bg-card border border-border rounded-2xl p-6 shadow-soft dark:shadow-soft-dark space-y-6 animate-fade-in">
                <div>
                  <h3 className="font-extrabold text-sm text-text-primary uppercase tracking-wider">
                    Balance Sheet & Capital Health
                  </h3>
                  <p className="text-[10px] text-text-secondary font-medium mt-0.5">Underlying asset values, solvency, and operational efficiency ratios.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { title: 'Asset Quality & Return on Assets', value: `${(roe * 0.75).toFixed(1)}%`, desc: 'ROA measures how efficiently the firm uses assets to generate earnings. Above 7% is typically considered solid for large-scale operations.', status: 'Strong' },
                    { title: 'Capital Structure (Debt to Equity)', value: debtToEquity.toFixed(2), desc: 'D/E represents leverage. Low D/E protects the firm from debt burden defaults in high-interest rate environments.', status: debtToEquity < 0.5 ? 'Excellent' : 'Moderate' },
                    { title: 'Book Value Per Share', value: `₹${bookValue.toFixed(2)}`, desc: 'Represents the net asset value of the firm divided by total shares. P/B multiplier is ' + (quote.priceToBook || 'N/A') + 'x.', status: 'Stable' },
                    { title: 'Earnings Retention Quality', value: '84%', desc: 'Percentage of profits reinvested into business capital expenditures instead of paying out as dividend distributions.', status: 'High Reinvestment' }
                  ].map((f, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-background/40 border border-border/50 space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="text-xs font-black text-text-primary leading-tight">{f.title}</h4>
                        <span className="text-xs font-black text-profit">{f.value}</span>
                      </div>
                      <p className="text-[10px] text-text-secondary leading-normal font-medium">{f.desc}</p>
                      <span className="inline-block text-[8px] font-black px-2 py-0.2 rounded-full uppercase bg-slate-500/10 text-text-secondary">
                        {f.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Technicals Tab */}
            {activeTab === 'technicals' && (
              <div className="bg-card border border-border rounded-2xl p-6 shadow-soft dark:shadow-soft-dark space-y-6 animate-fade-in animate-fade-in">
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  
                  {/* Gauge indicator */}
                  <div className="border border-border/50 rounded-xl p-4 bg-background/20">
                    <h4 className="text-xs font-black text-text-primary uppercase tracking-wider text-center mb-2">Technical Summary</h4>
                    <TechnicalGauge score={technicals.score} />
                  </div>

                  {/* Indicators Table */}
                  <div className="md:col-span-2 space-y-3">
                    <h4 className="text-xs font-black text-text-primary uppercase tracking-wider">Momentum Oscillators</h4>
                    <div className="divide-y divide-border/40">
                      {[
                        { label: 'RSI (14)', value: technicals.rsi, status: technicals.rsi > 70 ? 'Overbought (Sell)' : technicals.rsi < 30 ? 'Oversold (Buy)' : 'Neutral', color: technicals.rsi > 70 ? 'text-loss' : technicals.rsi < 30 ? 'text-profit' : 'text-text-secondary' },
                        { label: 'MACD (12, 26)', value: `Signal: ${technicals.macd.signal}`, status: technicals.macd.hist > 0 ? 'Bullish Crossover' : 'Bearish Crossover', color: technicals.macd.hist > 0 ? 'text-profit' : 'text-loss' },
                        { label: 'SMA (20) Relation', value: `₹${technicals.movingAverages.ema20.toFixed(2)}`, status: quote.regularMarketPrice >= technicals.movingAverages.ema20 ? 'Above Average (Bullish)' : 'Below Average (Bearish)', color: quote.regularMarketPrice >= technicals.movingAverages.ema20 ? 'text-profit' : 'text-loss' }
                      ].map((ind, idx) => (
                        <div key={idx} className="flex justify-between items-center py-2 text-xs font-bold">
                          <span className="text-text-secondary">{ind.label}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-text-primary">{ind.value}</span>
                            <span className={`text-[10px] font-black ${ind.color}`}>{ind.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Support and Resistance values */}
                <div className="p-4 bg-background/40 border border-border/50 rounded-xl space-y-3">
                  <h4 className="text-xs font-black text-text-primary uppercase tracking-wider">Pivot Support & Resistance Points</h4>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div className="space-y-1">
                      <span className="block text-[8px] font-black text-text-secondary uppercase">Support 2 (S2)</span>
                      <span className="text-xs font-black text-loss">₹{technicals.support2}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-[8px] font-black text-text-secondary uppercase">Support 1 (S1)</span>
                      <span className="text-xs font-black text-loss/80">₹{technicals.support1}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-[8px] font-black text-text-secondary uppercase">Resistance 1 (R1)</span>
                      <span className="text-xs font-black text-profit/80">₹{technicals.resistance1}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-[8px] font-black text-text-secondary uppercase">Resistance 2 (R2)</span>
                      <span className="text-xs font-black text-profit">₹{technicals.resistance2}</span>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* 5. Shareholding Tab */}
            {activeTab === 'shareholding' && (
              <div className="bg-card border border-border rounded-2xl p-6 shadow-soft dark:shadow-soft-dark space-y-6 animate-fade-in animate-fade-in">
                <div>
                  <h3 className="font-extrabold text-sm text-text-primary uppercase tracking-wider">
                    Shareholding Pattern
                  </h3>
                  <p className="text-[10px] text-text-secondary font-medium mt-0.5">Equity distribution across promoter, public, and institutional bodies.</p>
                </div>

                {/* Circular SVG Donut Chart */}
                <DonutChart 
                  segments={[
                    { label: 'Promoter Holdings', val: promoter, color: '#6366f1' },
                    { label: 'Foreign Institutional Investors (FII)', val: fii, color: '#a855f7' },
                    { label: 'Mutual Funds', val: mf, color: '#f59e0b' },
                    { label: 'Other Domestic Institutions (DII)', val: otherDii, color: '#3b82f6' },
                    { label: 'Retail & Public float', val: retail, color: '#10b981' }
                  ]} 
                />

                {/* Trend Summary */}
                <div className="p-4 bg-background/40 border border-border/50 rounded-xl">
                  <h4 className="text-xs font-black text-text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Info className="h-4 w-4 text-profit" /> Shareholding Analysis
                  </h4>
                  <p className="text-[11px] text-text-secondary font-medium leading-relaxed">
                    {promoter > 50 
                      ? 'Promoters hold a majority control over ' + promoter.toFixed(1) + '%, signaling solid corporate backing and alignment of board direction with long-term plans.' 
                      : 'Un-pledged float is distributed widely, ensuring rich market liquidity. Promoter holdings stand at ' + promoter.toFixed(1) + '%.'}
                    {' Institutional investors (FII & DII) hold an aggregated ' + (fii + dii).toFixed(1) + '% of the equity, indicating high market capital confidence.'}
                  </p>
                </div>

              </div>
            )}

            {/* 6. Peers Tab */}
            {activeTab === 'peers' && (
              <div className="bg-card border border-border rounded-2xl p-6 shadow-soft dark:shadow-soft-dark space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
                  <div>
                    <h3 className="font-extrabold text-sm text-text-primary uppercase tracking-wider">
                      Sector Peers
                    </h3>
                    <p className="text-[10px] text-text-secondary font-medium mt-0.5">Benchmark performance indicators with sector competitors.</p>
                  </div>
                  
                  {/* Sorting columns */}
                  <div className="flex items-center gap-2 text-xs font-bold text-text-secondary">
                    <span>Sort by:</span>
                    <select
                      value={peerSortKey}
                      onChange={(e) => setPeerSortKey(e.target.value as any)}
                      className="bg-background border border-border/80 rounded-xl px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-profit text-text-primary font-black"
                    >
                      <option value="mcap">Market Cap</option>
                      <option value="price">Market Price</option>
                      <option value="pe">P/E Ratio</option>
                    </select>
                  </div>
                </div>

                {peersLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-profit border-t-transparent" />
                    <span className="text-[10px] text-text-secondary font-black">Fetching sector competitors...</span>
                  </div>
                ) : peerQuotes.length === 0 ? (
                  <p className="text-xs text-text-secondary font-medium text-center py-12">No sector peers found for this symbol.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-bold">
                      <thead>
                        <tr className="border-b border-border/80 text-[10px] font-bold text-text-secondary uppercase">
                          <th className="py-2.5">Company</th>
                          <th className="py-2.5 text-right">Price</th>
                          <th className="py-2.5 text-right">1D Change</th>
                          <th className="py-2.5 text-right">P/E Ratio</th>
                          <th className="py-2.5 text-right">Market Cap</th>
                          <th className="py-2.5 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {peerQuotes
                          .sort((a, b) => {
                            if (peerSortKey === 'price') return b.regularMarketPrice - a.regularMarketPrice;
                            if (peerSortKey === 'pe') return (b.trailingPE || 999) - (a.trailingPE || 999);
                            return b.marketCap - a.marketCap;
                          })
                          .map((peer) => {
                            const isPeerPos = peer.regularMarketChangePercent >= 0;
                            return (
                              <tr key={peer.symbol} className="hover:bg-background/40 transition-colors">
                                <td className="py-3 text-text-primary font-black flex items-center gap-2">
                                  <StockLogo symbol={peer.symbol} size="sm" />
                                  <div className="min-w-0">
                                    <span className="block truncate max-w-[120px] sm:max-w-none">{peer.longName}</span>
                                    <span className="text-[9px] text-text-secondary font-bold uppercase">{peer.symbol.split('.')[0]}</span>
                                  </div>
                                </td>
                                <td className="py-3 text-right">₹{peer.regularMarketPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                <td className={`py-3 text-right ${isPeerPos ? 'text-profit' : 'text-loss'}`}>
                                  {isPeerPos ? '+' : ''}{peer.regularMarketChangePercent.toFixed(2)}%
                                </td>
                                <td className="py-3 text-right">{peer.trailingPE ? peer.trailingPE.toFixed(1) : 'N/A'}</td>
                                <td className="py-3 text-right">{formatIndianNumber(peer.marketCap, true)}</td>
                                <td className="py-3 text-center">
                                  <button
                                    onClick={() => router.push(`/stock/${peer.symbol}`)}
                                    className="px-2.5 py-1 text-[9px] rounded-lg border border-border bg-card hover:bg-background hover:text-profit font-black transition-colors"
                                  >
                                    Analyze
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 7. News & Events Tab */}
            {activeTab === 'news' && (
              <div className="bg-card border border-border rounded-2xl p-6 shadow-soft dark:shadow-soft-dark space-y-6 animate-fade-in">
                
                {/* News timeline */}
                <div className="space-y-4">
                  <h3 className="font-extrabold text-sm text-text-primary uppercase tracking-wider flex items-center gap-2">
                    <Clock className="h-4.5 w-4.5 text-profit" /> Latest News & Market Buzz
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {newsList.map((item, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-background/40 border border-border/50 space-y-2 flex flex-col justify-between hover:border-profit/15 transition-all">
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[9px] font-black text-text-secondary uppercase">
                            <span>{item.source} • {item.time}</span>
                            <span className={`px-1.5 py-0.2 rounded-full ${item.sentiment === 'bullish' ? 'text-profit bg-profit/10' : 'text-text-secondary bg-slate-500/10'}`}>
                              {item.sentiment}
                            </span>
                          </div>
                          <h4 className="text-xs font-black text-text-primary leading-snug hover:text-profit transition-colors">{item.title}</h4>
                          <p className="text-[10px] text-text-secondary leading-normal font-medium">{item.summary}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upcoming Events list */}
                <div className="space-y-4 pt-4 border-t border-border/40">
                  <h3 className="font-extrabold text-sm text-text-primary uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="h-4.5 w-4.5 text-profit" /> Corporate Action & Calendar
                  </h3>
                  
                  <div className="divide-y divide-border/40">
                    {eventsList.map((item, idx) => (
                      <div key={idx} className="py-3 flex justify-between items-start gap-4 text-xs font-bold">
                        <div className="space-y-1">
                          <h4 className="text-text-primary font-black">{item.title}</h4>
                          <p className="text-[10px] text-text-secondary leading-normal font-medium">{item.desc}</p>
                        </div>
                        <span className="text-[10px] font-black bg-background border border-border rounded-xl px-3 py-1 text-text-primary shrink-0 select-none">
                          {item.date}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* 8. Company Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-card border border-border rounded-2xl p-6 shadow-soft dark:shadow-soft-dark space-y-6 animate-fade-in">
                
                <div className="space-y-3">
                  <h3 className="font-extrabold text-sm text-text-primary uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="h-4.5 w-4.5 text-profit" /> Business Description
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed font-medium">
                    {quote.longBusinessSummary}
                  </p>
                </div>

                {/* Leadership directory */}
                <div className="space-y-3 pt-4 border-t border-border/40">
                  <h4 className="font-extrabold text-xs text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-profit" /> Leadership Members
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {(quote.leadership || getStableLeadership(quote.symbol)).map((l, idx) => (
                      <div key={idx} className="p-3 bg-background/40 border border-border/50 rounded-xl space-y-1 flex flex-col justify-center">
                        <span className="text-xs font-black text-text-primary block">{l.name}</span>
                        <span className="text-[9px] text-text-secondary font-black uppercase block">{l.title}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Headquarters and Website links */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border/40 text-xs font-bold">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-text-secondary shrink-0" />
                    <div>
                      <span className="block text-[8px] font-black text-text-secondary uppercase">Headquarters</span>
                      <span className="text-text-primary font-black mt-0.5 block">{quote.headquarters || 'Mumbai, Maharashtra, India'}</span>
                    </div>
                  </div>

                  {quote.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-text-secondary shrink-0" />
                      <div>
                        <span className="block text-[8px] font-black text-text-secondary uppercase">Website</span>
                        <a 
                          href={quote.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-profit hover:underline font-black mt-0.5 block"
                        >
                          {quote.website.replace('https://', '').replace('http://', '')}
                        </a>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>

        </div>

        {/* Right Sidebar Column (1/3 width) */}
        <div className="space-y-6">

          {/* Price Alerts Card */}
          {alerts.filter(a => a.symbol === symbol).length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-5 shadow-soft dark:shadow-soft-dark space-y-4">
              <h4 className="text-xs font-black text-text-primary uppercase tracking-wider pb-2 border-b border-border/40 flex items-center justify-between">
                <span>Active Price Alerts</span>
                <span className="text-[10px] bg-profit/10 text-profit px-2 py-0.5 rounded-full font-black">
                  {alerts.filter(a => a.symbol === symbol).length}
                </span>
              </h4>
              <div className="space-y-2.5">
                {alerts.filter(a => a.symbol === symbol).map((alert, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs font-bold p-3 bg-background/50 rounded-xl border border-border/40 hover:border-profit/10 transition-all">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-text-primary">
                        Price goes {alert.condition === 'above' ? 'above' : 'below'}
                      </span>
                      <span className="text-[10px] text-text-secondary font-black">₹{alert.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <button
                      onClick={() => removeAlert(symbol, alert.price, alert.condition)}
                      className="text-[10px] font-black text-loss hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}



          {/* Recommendation card */}
          {peerQuotes.length > 0 && (
            <div className="bg-gradient-to-br from-profit/10 via-card to-card border border-border/80 rounded-2xl p-5 shadow-soft dark:shadow-soft-dark space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-profit/5 rounded-full filter blur-xl pointer-events-none" />
              
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-profit/10 text-profit border border-profit/25 select-none">
                  Sector Recommendations
                </span>
                <span className="text-[9px] text-text-secondary font-bold uppercase">{quote.sector}</span>
              </div>
              
              <div className="space-y-3">
                {peerQuotes.slice(0, 3).map((peer) => {
                  const isPosVal = peer.regularMarketChangePercent >= 0;
                  return (
                    <div 
                      key={peer.symbol} 
                      onClick={() => router.push(`/stock/${peer.symbol}`)}
                      className="flex items-center justify-between cursor-pointer group p-1.5 rounded-xl hover:bg-background/80 transition-all border border-transparent hover:border-border/30"
                    >
                      <div className="flex items-center gap-2.5">
                        <StockLogo symbol={peer.symbol} size="sm" />
                        <div className="min-w-0">
                          <span className="text-xs font-black text-text-primary group-hover:text-profit transition-colors truncate block max-w-[120px]">
                            {peer.shortName || peer.longName}
                          </span>
                          <span className="text-[9px] text-text-secondary font-black uppercase">
                            {peer.symbol.split('.')[0]}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-text-primary block">
                          ₹{peer.regularMarketPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                        <span className={`text-[9px] font-black inline-flex items-center gap-0.5 ${isPosVal ? 'text-profit' : 'text-loss'}`}>
                          {isPosVal ? '+' : ''}{peer.regularMarketChangePercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recently Viewed Stocks */}
          {recentQuotes.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-5 shadow-soft dark:shadow-soft-dark space-y-4">
              <h4 className="text-xs font-black text-text-primary uppercase tracking-wider pb-2 border-b border-border/40">Recently Viewed</h4>
              <div className="space-y-3">
                {recentQuotes.map((item) => {
                  const isPosVal = item.regularMarketChangePercent >= 0;
                  return (
                    <div 
                      key={item.symbol} 
                      onClick={() => router.push(`/stock/${item.symbol}`)}
                      className="flex items-center justify-between cursor-pointer group p-1.5 rounded-xl hover:bg-background/80 transition-all border border-transparent hover:border-border/30"
                    >
                      <div className="flex items-center gap-2.5">
                        <StockLogo symbol={item.symbol} website={item.website} size="sm" />
                        <div className="min-w-0">
                          <span className="text-xs font-black text-text-primary group-hover:text-profit transition-colors truncate block max-w-[100px]">{item.longName}</span>
                          <span className="text-[9px] text-text-secondary font-black uppercase">{item.symbol.split('.')[0]}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-text-primary block">₹{item.regularMarketPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        <span className={`text-[9px] font-black inline-flex items-center gap-0.5 ${isPosVal ? 'text-profit' : 'text-loss'}`}>
                          {isPosVal ? '+' : ''}{item.regularMarketChangePercent.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Trending Stocks List */}
          {trendingQuotes.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-5 shadow-soft dark:shadow-soft-dark space-y-4">
              <h4 className="text-xs font-black text-text-primary uppercase tracking-wider pb-2 border-b border-border/40">Trending on OnlyProfit</h4>
              <div className="space-y-3">
                {trendingQuotes
                  .filter(t => t.symbol !== symbol)
                  .slice(0, 4)
                  .map((item) => {
                    const isPosVal = item.regularMarketChangePercent >= 0;
                    return (
                      <div 
                        key={item.symbol} 
                        onClick={() => router.push(`/stock/${item.symbol}`)}
                        className="flex items-center justify-between cursor-pointer group p-1.5 rounded-xl hover:bg-background/80 transition-all border border-transparent hover:border-border/30"
                      >
                        <div className="flex items-center gap-2.5">
                          <StockLogo symbol={item.symbol} website={item.website} size="sm" />
                          <div className="min-w-0">
                            <span className="text-xs font-black text-text-primary group-hover:text-profit transition-colors truncate block max-w-[100px]">{item.longName}</span>
                            <span className="text-[9px] text-text-secondary font-black uppercase">{item.symbol.split('.')[0]}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-black text-text-primary block">₹{item.regularMarketPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          <span className={`text-[9px] font-black inline-flex items-center gap-0.5 ${isPosVal ? 'text-profit' : 'text-loss'}`}>
                            {isPosVal ? '+' : ''}{item.regularMarketChangePercent.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

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

      {/* Set Alert Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 shadow-premium dark:shadow-premium-dark relative space-y-4">
            <h3 className="text-sm font-black text-text-primary uppercase tracking-wider">Set Price Alert</h3>
            <p className="text-[10px] text-text-secondary font-medium">Create a persistent trigger alert for {quote.longName} ({quote.symbol.split('.')[0]}).</p>
            
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center text-xs font-bold bg-background p-3 rounded-xl border border-border/40">
                <span className="text-text-secondary">Current Price</span>
                <span className="text-text-primary font-black">₹{quote.regularMarketPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-text-secondary uppercase">Trigger Condition</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setAlertCondition('above')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      alertCondition === 'above'
                        ? 'bg-profit/10 border-profit/30 text-profit'
                        : 'border-border text-text-secondary hover:bg-background'
                    }`}
                  >
                    Price goes Above
                  </button>
                  <button
                    onClick={() => setAlertCondition('below')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      alertCondition === 'below'
                        ? 'bg-loss/10 border-loss/30 text-loss'
                        : 'border-border text-text-secondary hover:bg-background'
                    }`}
                  >
                    Price goes Below
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-text-secondary uppercase">Trigger Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={alertTriggerPrice}
                  onChange={(e) => setAlertTriggerPrice(e.target.value)}
                  className="w-full bg-background border border-border/80 rounded-xl px-3.5 py-2 text-xs font-black focus:outline-none focus:ring-1 focus:ring-profit text-text-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4">
              <button
                onClick={() => setShowAlertModal(false)}
                className="py-2.5 rounded-xl border border-border text-xs font-bold text-text-secondary hover:bg-background transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAlert}
                className="py-2.5 rounded-xl bg-profit text-white text-xs font-bold hover:bg-profit/90 transition-all shadow-md shadow-profit/20"
              >
                Save Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Extra dynamic visual components

const DonutChart = ({ segments }: { segments: { label: string; val: number; color: string }[] }) => {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-8 justify-center p-4">
      <div className="relative w-40 h-40">
        <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
          <circle cx="60" cy="60" r={radius} fill="transparent" stroke="var(--border)" strokeWidth="12" className="opacity-20" />
          {segments.map((seg, idx) => {
            const strokeDash = circumference;
            const strokeOffset = circumference - (seg.val / 100) * circumference;
            const rotation = (accumulatedPercent / 100) * 360;
            accumulatedPercent += seg.val;
            
            return (
              <circle
                key={idx}
                cx="60"
                cy="60"
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth="12"
                strokeDasharray={strokeDash}
                strokeDashoffset={strokeOffset}
                transform={`rotate(${rotation} 60 60)`}
                className="transition-all duration-500 ease-out hover:stroke-[14px] cursor-pointer"
              >
                <title>{`${seg.label}: ${seg.val}%`}</title>
              </circle>
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] text-text-secondary uppercase tracking-widest font-black">Holdings</span>
          <span className="text-xl font-black text-text-primary">100%</span>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex-1 space-y-2.5 w-full">
        {segments.map((seg, idx) => (
          <div key={idx} className="flex items-center justify-between text-xs font-bold p-2 hover:bg-background/40 rounded-lg transition-colors border border-transparent hover:border-border/30">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md shrink-0" style={{ backgroundColor: seg.color }} />
              <span className="text-text-secondary">{seg.label}</span>
            </div>
            <span className="text-text-primary font-black">{seg.val.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const TechnicalGauge = ({ score }: { score: number }) => {
  const angle = ((score + 100) / 200) * 180; // maps to 0 to 180 degrees
  
  let label = 'Neutral';
  let color = 'text-slate-500 bg-slate-500/10 border-slate-500/20';
  let strokeColor = '#64748b';
  
  if (score > 50) {
    label = 'Strong Buy';
    color = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    strokeColor = '#10b981';
  } else if (score > 15) {
    label = 'Buy';
    color = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    strokeColor = '#34d399';
  } else if (score < -50) {
    label = 'Strong Sell';
    color = 'text-rose-500 bg-rose-500/10 border-rose-500/20';
    strokeColor = '#ef4444';
  } else if (score < -15) {
    label = 'Sell';
    color = 'text-rose-500 bg-rose-500/10 border-rose-500/20';
    strokeColor = '#f87171';
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 gap-4">
      <div className="relative w-48 h-24 overflow-hidden">
        <svg viewBox="0 0 100 50" className="w-full h-full">
          {/* Base gauge track */}
          <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="var(--border)" strokeWidth="8" strokeLinecap="round" className="opacity-30" />
          {/* Active gauge track */}
          <path 
            d="M 10 50 A 40 40 0 0 1 90 50" 
            fill="none" 
            stroke="url(#gauge-gradient)" 
            strokeWidth="8" 
            strokeLinecap="round" 
          />
          <defs>
            <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
          {/* Needle */}
          <g transform={`rotate(${angle} 50 50)`}>
            <line x1="50" y1="50" x2="15" y2="50" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="50" cy="50" r="4" fill={strokeColor} />
          </g>
        </svg>
        <div className="absolute bottom-0 inset-x-0 text-center flex flex-col items-center">
          <span className="text-[10px] text-text-secondary uppercase font-bold tracking-widest">Sentiment</span>
          <span className={`text-sm font-black px-2.5 py-0.5 rounded-full mt-0.5 border ${color}`}>{label}</span>
        </div>
      </div>
      <div className="flex justify-between w-full text-[9px] font-bold text-text-secondary uppercase px-4 -mt-2">
        <span className="text-loss">Sell</span>
        <span>Neutral</span>
        <span className="text-profit">Buy</span>
      </div>
    </div>
  );
};

// Seeded generators for data

function getStableCEOName(symbol: string): string {
  const clean = symbol.toUpperCase().split('.')[0];
  const firstNames = ['Rajesh', 'Sanjay', 'Arvind', 'Amit', 'Vikram', 'Rohan', 'Pradeep', 'Anil', 'Vijay', 'Sunil', 'Karan', 'Ashish', 'Manish', 'Devendra'];
  const lastNames = ['Sharma', 'Mehta', 'Joshi', 'Gupta', 'Patel', 'Kumar', 'Singh', 'Verma', 'Iyer', 'Reddy', 'Nair', 'Shah', 'Sen', 'Das', 'Chatterjee'];
  
  const rand1 = getSeededRandom(clean + '_ceo_first');
  const rand2 = getSeededRandom(clean + '_ceo_last');
  
  const first = firstNames[Math.floor(rand1() * firstNames.length)];
  const last = lastNames[Math.floor(rand2() * lastNames.length)];
  return `${first} ${last}`;
}

function getStableLeadership(symbol: string): { name: string; title: string }[] {
  const clean = symbol.toUpperCase().split('.')[0];
  const ceo = getStableCEOName(symbol);
  
  const rand1 = getSeededRandom(clean + '_cfo');
  const rand2 = getSeededRandom(clean + '_coo');
  
  const firstNames = ['Rajesh', 'Sanjay', 'Arvind', 'Amit', 'Vikram', 'Rohan', 'Pradeep', 'Anil', 'Vijay', 'Sunil', 'Karan', 'Ashish', 'Manish', 'Devendra'];
  const lastNames = ['Sharma', 'Mehta', 'Joshi', 'Gupta', 'Patel', 'Kumar', 'Singh', 'Verma', 'Iyer', 'Reddy', 'Nair', 'Shah', 'Sen', 'Das', 'Chatterjee'];
  
  const cfo = `${firstNames[Math.floor(rand1() * firstNames.length)]} ${lastNames[Math.floor(rand2() * lastNames.length)]}`;
  const coo = `${firstNames[Math.floor(rand2() * firstNames.length)]} ${lastNames[Math.floor(rand1() * lastNames.length)]}`;
  
  return [
    { name: ceo, title: 'Chief Executive Officer (CEO) & MD' },
    { name: cfo, title: 'Chief Financial Officer (CFO)' },
    { name: coo, title: 'Chief Operating Officer (COO)' }
  ];
}

function getSeededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = seed.charCodeAt(i) + ((h << 5) - h);
  }
  return function() {
    h = (h * 1664525 + 1013904223) % 4294967296;
    return Math.abs(h / 4294967296);
  };
}

function getDetailedFinancials(symbol: string, marketCap: number) {
  const hash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const rand = (hash % 100) / 100;
  const baseCap = (marketCap && marketCap > 0) ? marketCap : 100000000000; // 10,000 Cr fallback
  const scale = baseCap * 0.08; 

  const annual = [
    {
      year: '2023',
      revenue: scale * 0.82,
      profit: scale * 0.82 * (0.08 + rand * 0.08),
      ebitda: scale * 0.82 * (0.15 + rand * 0.1),
      margin: (0.08 + rand * 0.08) * 100,
      cashflow: scale * 0.82 * (0.05 + rand * 0.05)
    },
    {
      year: '2024',
      revenue: scale * 0.92,
      profit: scale * 0.92 * (0.09 + rand * 0.08),
      ebitda: scale * 0.92 * (0.16 + rand * 0.1),
      margin: (0.09 + rand * 0.08) * 100,
      cashflow: scale * 0.92 * (0.06 + rand * 0.05)
    },
    {
      year: '2025',
      revenue: scale * 1.0,
      profit: scale * 1.0 * (0.10 + rand * 0.08),
      ebitda: scale * 1.0 * (0.18 + rand * 0.1),
      margin: (0.10 + rand * 0.08) * 100,
      cashflow: scale * 1.0 * (0.07 + rand * 0.05)
    }
  ];

  const quarterly = [
    {
      year: 'Q1 FY25',
      revenue: scale * 0.23,
      profit: scale * 0.23 * (0.09 + rand * 0.08),
      ebitda: scale * 0.23 * (0.17 + rand * 0.1),
      margin: (0.09 + rand * 0.08) * 100,
      cashflow: scale * 0.23 * (0.06 + rand * 0.05)
    },
    {
      year: 'Q2 FY25',
      revenue: scale * 0.25,
      profit: scale * 0.25 * (0.10 + rand * 0.08),
      ebitda: scale * 0.25 * (0.18 + rand * 0.1),
      margin: (0.10 + rand * 0.08) * 100,
      cashflow: scale * 0.25 * (0.07 + rand * 0.05)
    },
    {
      year: 'Q3 FY25',
      revenue: scale * 0.24,
      profit: scale * 0.24 * (0.085 + rand * 0.08),
      ebitda: scale * 0.24 * (0.16 + rand * 0.1),
      margin: (0.085 + rand * 0.08) * 100,
      cashflow: scale * 0.24 * (0.05 + rand * 0.05)
    },
    {
      year: 'Q4 FY25',
      revenue: scale * 0.28,
      profit: scale * 0.28 * (0.11 + rand * 0.08),
      ebitda: scale * 0.28 * (0.20 + rand * 0.1),
      margin: (0.11 + rand * 0.08) * 100,
      cashflow: scale * 0.28 * (0.08 + rand * 0.05)
    }
  ];

  return { annual, quarterly };
}

function getTechnicalAnalysis(symbol: string, price: number) {
  const hash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const rand = (hash % 100) / 100;
  
  const rsi = parseFloat((32 + rand * 44).toFixed(1));
  const macdVal = parseFloat((price * 0.005 * (rand - 0.5)).toFixed(2));
  const signalVal = parseFloat((macdVal * 0.85).toFixed(2));
  const histogram = parseFloat((macdVal - signalVal).toFixed(2));
  
  let score = 0; 
  if (rsi > 70) score -= 45;
  else if (rsi < 30) score += 45;
  else score += (55 - rsi) * 1.5; 
  
  score += histogram > 0 ? 30 : -30;
  score += (rand - 0.45) * 25;
  score = Math.min(100, Math.max(-100, score));
  
  const s1 = parseFloat((price * (0.96 - rand * 0.02)).toFixed(2));
  const s2 = parseFloat((s1 * 0.97).toFixed(2));
  const r1 = parseFloat((price * (1.03 + rand * 0.02)).toFixed(2));
  const r2 = parseFloat((r1 * 1.03).toFixed(2));
  
  return {
    rsi,
    macd: { val: macdVal, signal: signalVal, hist: histogram },
    score,
    support1: s1,
    support2: s2,
    resistance1: r1,
    resistance2: r2,
    movingAverages: {
      ema20: price * (0.995 - rand * 0.008),
    }
  };
}

function getMockNews(symbol: string, name: string) {
  const clean = symbol.split('.')[0];
  return [
    {
      title: `${name} shares rally as quarterly profit beats street projections`,
      source: 'Moneycontrol',
      time: '2 hours ago',
      sentiment: 'bullish',
      summary: `Shares of ${name} rose over 3% after the company reported a stronger-than-expected increase in consolidated net profit, driven by robust operational gains and margin expansion.`
    },
    {
      title: `Analysts raise price target on ${name} following new expansion announcements`,
      source: 'Economic Times',
      time: '1 day ago',
      sentiment: 'bullish',
      summary: `Leading brokerage firms have raised their price targets on ${name} (${clean}) citing strong revenue visibility from the newly announced capital expenditure plans.`
    },
    {
      title: `How ${name} is leveraging technology to drive productivity growth`,
      source: 'Livemint',
      time: '3 days ago',
      sentiment: 'neutral',
      summary: `An in-depth analysis of ${name}'s digital transformation strategy highlights key investments in automated supply chain systems and cloud infrastructure.`
    },
    {
      title: `Global brokerage houses maintain 'Buy' rating on ${name}`,
      source: 'Bloomberg Quint',
      time: '5 days ago',
      sentiment: 'bullish',
      summary: `Jefferies, Morgan Stanley, and Goldman Sachs have reiterated their bullish views on ${name}, noting steady cash flow generation and solid balance sheet strength.`
    }
  ];
}

function getMockEvents() {
  return [
    {
      title: 'Board Meeting (Financial Results)',
      date: 'June 28, 2026',
      type: 'results',
      desc: 'Board of directors meeting to approve consolidated audited financial results for the quarter ending June 30, 2026.'
    },
    {
      title: 'Dividend (₹12.50 per share)',
      date: 'May 15, 2026',
      type: 'dividend',
      desc: 'Final dividend payout of ₹12.50 per equity share approved in the Annual General Meeting (AGM).'
    },
    {
      title: 'Annual General Meeting',
      date: 'August 14, 2026',
      type: 'corporate',
      desc: '38th Annual General Meeting of shareholders to approve directors, auditors, and financial statements.'
    }
  ];
}

// Recommendation helpers removed in favor of dynamic peerQuotes recommendation list.

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'financials', label: 'Financials' },
  { id: 'fundamentals', label: 'Fundamentals' },
  { id: 'technicals', label: 'Technicals' },
  { id: 'shareholding', label: 'Shareholding' },
  { id: 'peers', label: 'Peers' },
  { id: 'news', label: 'News & Events' },
  { id: 'profile', label: 'Company Profile' }
];
