'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStockStore } from '@/store/useStockStore';
import { ChevronLeft, Bell } from 'lucide-react';
import nextDynamic from 'next/dynamic';
import NiftyTracker from '@/components/NiftyTracker';
import SensexTracker from '@/components/SensexTracker';
import OrderPlacementModal from '@/components/OrderPlacementModal';
import { getNextThursdays } from '@/lib/foUtils';

// Modular Sub-components
import StockHeroSection from '@/features/stocks/components/StockHeroSection';
import StockOverviewTab from '@/features/stocks/components/StockOverviewTab';
import StockFinancialsTab from '@/features/stocks/components/StockFinancialsTab';
import StockFundamentalsTab from '@/features/stocks/components/StockFundamentalsTab';
import StockTechnicalsTab from '@/features/stocks/components/StockTechnicalsTab';
import StockShareholdingTab from '@/features/stocks/components/StockShareholdingTab';
import StockPeersTab from '@/features/stocks/components/StockPeersTab';
import StockNewsTab from '@/features/stocks/components/StockNewsTab';
import StockOptionsTab from '@/features/stocks/components/StockOptionsTab';
import StockRightSidebar from '@/features/stocks/components/StockRightSidebar';
import StockProfileTab from '@/features/stocks/components/StockProfileTab';

// Reusable Custom Hook
import { useStockDetails } from '@/hooks/useStockDetails';

// Dynamically import StockChart to disable SSR
const StockChart = nextDynamic(() => import('@/components/StockChart'), {
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

const RANGES = [
  { label: '1D', value: '1d' },
  { label: '5D', value: '5d' },
  { label: '1M', value: '1m' },
  { label: '6M', value: '6m' },
  { label: '1Y', value: '1y' },
  { label: '5Y', value: '5y' },
  { label: 'MAX', value: 'max' }
];

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'options', label: 'Option Chain' },
  { id: 'financials', label: 'Financials' },
  { id: 'fundamentals', label: 'Fundamentals' },
  { id: 'technicals', label: 'Technicals' },
  { id: 'shareholding', label: 'Shareholding' },
  { id: 'peers', label: 'Peers' },
  { id: 'news', label: 'News & Events' },
  { id: 'profile', label: 'Company Profile' }
] as const;

type ActiveTabType = (typeof TABS)[number]['id'];

// Seeded calculators helper functions
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
  const baseCap = (marketCap && marketCap > 0) ? marketCap : 100000000000;
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

const formatIndianNumber = (num: number, isCurrency = false): string => {
  if (num === null || num === undefined) return 'N/A';
  const val = Math.abs(num);
  let formatted = '';
  
  if (val >= 10000000) {
    formatted = (val / 10000000).toFixed(2) + ' Cr';
  } else if (val >= 100000) {
    formatted = (val / 100000).toFixed(2) + ' Lk';
  } else {
    formatted = val.toLocaleString('en-IN');
  }

  return (num < 0 ? '-' : '') + (isCurrency ? '₹' : '') + formatted;
};

export default function StockDetailPage() {
  const params = useParams();
  const router = useRouter();
  const symbol = decodeURIComponent(params.symbol as string);

  const { watchlist, toggleWatchlist, alerts, addAlert, removeAlert } = useStockStore();
  const {
    quote,
    loading,
    financials,
    peerQuotes,
    peersLoading,
    recentQuotes,
    trendingQuotes,
    liveNews,
    newsLoading,
  } = useStockDetails(symbol);

  // Layout configurations
  const [activeRange, setActiveRange] = useState('1d');
  const [activeTab, setActiveTab] = useState<ActiveTabType>('overview');

  // Modals & triggers
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertTriggerPrice, setAlertTriggerPrice] = useState('');
  const [alertCondition, setAlertCondition] = useState<'above' | 'below'>('above');

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [tradeSymbol, setTradeSymbol] = useState(symbol);
  const [tradeName, setTradeName] = useState('');
  const [tradePrice, setTradePrice] = useState(0);

  const expiryDates = useMemo(() => getNextThursdays(), []);
  const [selectedExpiry, setSelectedExpiry] = useState(expiryDates[0].value);

  // Index dashboards redirection
  if (symbol === '^NSEI' && quote) {
    return <NiftyTracker symbol={symbol} indexQuote={quote} onBack={() => router.push('/')} />;
  }
  if (symbol === '^BSESN' && quote) {
    return <SensexTracker symbol={symbol} indexQuote={quote} onBack={() => router.push('/')} />;
  }

  // Loading skeleton state
  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/40 pb-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl animate-pulse bg-slate-200 dark:bg-slate-800" />
            <div className="space-y-2">
              <div className="h-6 w-48 animate-pulse bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-4 w-32 animate-pulse bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
          </div>
          <div className="flex flex-col sm:items-end gap-1 shrink-0">
            <div className="h-8 w-28 animate-pulse bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-4 w-20 animate-pulse bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-[300px] sm:h-[400px] rounded-2xl border border-border bg-card p-5 animate-pulse bg-slate-200/50 dark:bg-slate-800/30" />
            <div className="h-32 w-full rounded-2xl border border-border bg-card p-6 animate-pulse bg-slate-200/50 dark:bg-slate-800/30" />
          </div>
          <div className="h-[450px] w-full rounded-2xl border border-border bg-card p-5 animate-pulse bg-slate-200/50 dark:bg-slate-800/30" />
        </div>
      </div>
    );
  }

  // Stock not resolved state
  if (!quote) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-2xl font-black text-text-primary tracking-tight">Stock symbol not found</h2>
        <p className="text-text-secondary mt-2">The ticker &quot;{symbol}&quot; could not be resolved.</p>
        <button
          onClick={() => router.push('/')}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-profit px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-profit/20 hover:scale-105 transition-transform cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" /> Return to Dashboard
        </button>
      </div>
    );
  }

  // Calculated valuation ratios & metrics
  const isFavorited = watchlist.includes(symbol);
  const isPositive = quote.regularMarketChangePercent >= 0;

  const roe = quote.trailingPE && quote.priceToBook && quote.trailingPE > 0
    ? (quote.priceToBook / quote.trailingPE) * 100
    : (quote.symbol.charCodeAt(0) % 8) + 12.4; 
  const roce = roe * 1.25;

  const sectorLower = (quote.sector || 'Financials').toLowerCase();
  const debtToEquity = sectorLower.includes('it') || sectorLower.includes('software') || sectorLower.includes('fmcg')
    ? (quote.symbol.charCodeAt(0) % 5) * 0.04 
    : sectorLower.includes('bank') || sectorLower.includes('financial')
    ? (quote.symbol.charCodeAt(0) % 5) * 0.2 + 0.45 
    : (quote.symbol.charCodeAt(0) % 5) * 0.22 + 0.35; 

  const bookValue = (quote.regularMarketPrice || 0) / (quote.priceToBook || 2.45);
  const eps = quote.epsTrailingTwelveMonths || ((quote.regularMarketPrice || 100) / (quote.trailingPE || 20));

  const dayLow = quote.regularMarketDayLow ?? quote.regularMarketPrice;
  const dayHigh = quote.regularMarketDayHigh ?? quote.regularMarketPrice;
  const fiftyTwoLow = quote.regularMarketPrice * 0.72;
  const fiftyTwoHigh = quote.regularMarketPrice * 1.34;

  const financialsData = financials || getDetailedFinancials(quote.symbol, quote.marketCap);
  const technicals = getTechnicalAnalysis(quote.symbol, quote.regularMarketPrice);

  const promoter = quote.holdings?.promoters || 52.4;
  const fii = quote.holdings?.fii || 16.2;
  const dii = quote.holdings?.dii || 14.8;
  const mf = Math.floor(dii * 0.62);
  const otherDii = dii - mf;
  const retail = 100 - (promoter + fii + dii);

  const eventsList = getMockEvents();

  const handleOpenTradeModal = (tradeSym: string, tradeNm: string, tradePr: number) => {
    setTradeSymbol(tradeSym);
    setTradeName(tradeNm);
    setTradePrice(tradePr);
    setIsOrderModalOpen(true);
  };

  const handleSaveAlert = () => {
    const priceVal = parseFloat(alertTriggerPrice);
    if (isNaN(priceVal) || priceVal <= 0) return;
    
    addAlert({
      symbol,
      price: priceVal,
      condition: alertCondition,
      isActive: true
    });
    
    setShowAlertModal(false);
  };

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 pb-28 pt-6 sm:py-8 md:py-12 transition-colors duration-300 space-y-6">
      
      {/* Hero Header Section */}
      <StockHeroSection 
        symbol={symbol}
        quote={quote}
        isFavorited={isFavorited}
        onToggleWatchlist={() => toggleWatchlist(symbol)}
        onCompare={() => handleOpenTradeModal(symbol, quote.longName, quote.regularMarketPrice)}
        onTrade={() => handleOpenTradeModal(symbol, quote.longName, quote.regularMarketPrice)}
        onBack={() => router.push('/')}
      />

      {/* Main Grid Content Layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 items-start">
        
        {/* Left Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Interactive Chart Container */}
          <div className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-soft dark:shadow-soft-dark space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
              <div>
                <h2 className="font-extrabold text-sm text-text-primary uppercase tracking-wider">
                  Interactive Price Chart
                </h2>
                <p className="text-[10px] text-text-secondary font-medium mt-0.5">Live stock price trajectory mapped across custom intervals.</p>
              </div>
              
              {/* Range Filters */}
              <div className="flex p-0.5 rounded-xl bg-background border border-border self-stretch sm:self-start justify-between sm:justify-start overflow-x-auto scrollbar-none w-full sm:w-auto gap-1">
                {RANGES.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setActiveRange(r.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 active:scale-95 cursor-pointer ${
                      activeRange === r.value
                        ? 'bg-card text-profit shadow-sm font-extrabold'
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

          {/* Sticky Tabbed Navigation strip */}
          <div className="sticky top-[68px] z-20 bg-background/95 backdrop-blur-md py-2.5 border-b border-border/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 text-xs font-black rounded-xl transition-all whitespace-nowrap border shrink-0 cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-profit/10 border-profit/25 text-profit'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-background/40'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Active Tab Panel Content Switches */}
          <div className="transition-all duration-200">
            {activeTab === 'overview' && (
              <StockOverviewTab 
                quote={quote}
                dayLow={dayLow}
                dayHigh={dayHigh}
                fiftyTwoLow={fiftyTwoLow}
                fiftyTwoHigh={fiftyTwoHigh}
                roe={roe}
                roce={roce}
                eps={eps}
                debtToEquity={debtToEquity}
                bookValue={bookValue}
                formatIndianNumber={formatIndianNumber}
              />
            )}

            {activeTab === 'options' && (
              <StockOptionsTab 
                symbol={symbol}
                quote={quote}
                expiryDates={expiryDates}
                selectedExpiry={selectedExpiry}
                setSelectedExpiry={setSelectedExpiry}
                onTrade={handleOpenTradeModal}
              />
            )}

            {activeTab === 'financials' && (
              <StockFinancialsTab 
                financialsData={financialsData}
                isPositive={isPositive}
                formatIndianNumber={formatIndianNumber}
              />
            )}

            {activeTab === 'fundamentals' && (
              <StockFundamentalsTab 
                quote={quote}
                roe={roe}
                debtToEquity={debtToEquity}
                bookValue={bookValue}
              />
            )}

            {activeTab === 'technicals' && (
              <StockTechnicalsTab 
                quote={quote}
                technicals={technicals}
              />
            )}

            {activeTab === 'shareholding' && (
              <StockShareholdingTab 
                promoter={promoter}
                fii={fii}
                dii={dii}
                mf={mf}
                otherDii={otherDii}
                retail={retail}
              />
            )}

            {activeTab === 'peers' && (
              <StockPeersTab 
                peerQuotes={peerQuotes}
                peersLoading={peersLoading}
                formatIndianNumber={formatIndianNumber}
                onAnalyze={(sym) => router.push(`/stock/${sym}`)}
              />
            )}

            {activeTab === 'news' && (
              <StockNewsTab 
                newsList={liveNews}
                newsLoading={newsLoading}
                eventsList={eventsList}
              />
            )}

            {activeTab === 'profile' && (
              <StockProfileTab quote={quote} />
            )}
          </div>

        </div>

        {/* Right Sidebar Column (1/3 width) */}
        <div className="space-y-6">
          {/* Quick Price Alert Trigger button */}
          <button
            onClick={() => {
              setAlertTriggerPrice(quote.regularMarketPrice.toFixed(2));
              setAlertCondition('above');
              setShowAlertModal(true);
            }}
            className="w-full flex items-center justify-center gap-2 py-3 bg-card border border-border text-text-primary rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-background transition-colors shadow-soft dark:shadow-soft-dark cursor-pointer"
          >
            <Bell className="h-4.5 w-4.5 text-profit" /> Set Price Alert Trigger
          </button>

          <StockRightSidebar 
            symbol={symbol}
            quote={quote}
            alerts={alerts}
            removeAlert={removeAlert}
            peerQuotes={peerQuotes}
            recentQuotes={recentQuotes}
            trendingQuotes={trendingQuotes}
            onNavigate={(sym) => router.push(`/stock/${sym}`)}
          />
        </div>

      </div>

      {/* Structured Schema.org Metadata */}
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
          }).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')
        }}
      />

      {/* Alerts Trigger Configuration Modal */}
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
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      alertCondition === 'above'
                        ? 'bg-profit/10 border-profit/30 text-profit font-extrabold'
                        : 'border-border text-text-secondary hover:bg-background'
                    }`}
                  >
                    Price goes Above
                  </button>
                  <button
                    onClick={() => setAlertCondition('below')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      alertCondition === 'below'
                        ? 'bg-loss/10 border-loss/30 text-loss font-extrabold'
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
                  step="0.05"
                  value={alertTriggerPrice}
                  onChange={(e) => setAlertTriggerPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-profit text-xs font-bold text-text-primary"
                />
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAlertModal(false)}
                className="flex-1 py-2.5 border border-border rounded-xl text-xs font-bold hover:bg-background text-text-primary cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAlert}
                className="flex-1 py-2.5 bg-profit text-white rounded-xl text-xs font-bold hover:bg-profit-dark transition-colors cursor-pointer"
              >
                Create Alert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Paper Trading Execution Modal */}
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

      {/* Sticky Bottom Paper Trading Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/85 backdrop-blur-md border-t border-border px-4 py-3 shadow-[0_-8px_32px_rgba(0,0,0,0.12)] animate-slide-up flex items-center justify-between">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex h-8 w-8 items-center justify-center rounded-xl bg-profit/10 text-profit font-black text-xs select-none">
              ₹
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-text-primary uppercase tracking-wider">{symbol.split('.')[0]}</span>
                <span className="text-[10px] text-text-secondary font-bold truncate max-w-[120px] hidden md:inline">{quote.longName}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-black font-mono text-text-primary">
                  ₹{quote.regularMarketPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <span className={`text-[10px] font-black font-mono ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {isPositive ? '▲' : '▼'}{isPositive ? '+' : ''}{quote.regularMarketChangePercent.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenTradeModal(symbol, quote.longName, quote.regularMarketPrice)}
              className="px-6 py-2.5 bg-profit hover:bg-profit/90 text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-profit/20 hover:shadow-profit/35 active:scale-95 transition-all cursor-pointer"
            >
              Paper Trade
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
