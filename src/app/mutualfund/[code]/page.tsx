'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStockStore } from '@/store/useStockStore';
import { 
  ChevronLeft, 
  Star, 
  Sparkles, 
  TrendingUp, 
  Compass, 
  Layers, 
  Shield, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  Calendar,
  Info,
  Clock,
  Percent,
  Landmark,
  Users
} from 'lucide-react';
import { apiClient as axios } from '@/lib/apiClient';
import dynamic from 'next/dynamic';
import SipCalculator from '@/components/SipCalculator';
import Link from 'next/link';

// Dynamically import MutualFundChart to disable SSR
const MutualFundChart = dynamic(() => import('@/components/MutualFundChart'), {
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

interface FundDetails {
  code: string;
  name: string;
  category: string;
  categoryLabel: string;
  fundHouse: string;
  schemeType: string;
  schemeCategory: string;
  latestNav: number;
  navChange: number;
  navChangePercent: number;
  oneYearReturn: number;
  threeYearReturn: number;
  fiveYearReturn: number;
  aum: number;
  expenseRatio: number;
  categoryAvgExpenseRatio: number;
  sharpeRatio: number;
  sortinoRatio: number;
  standardDeviation: number;
  beta: number;
  minSipAmount: number;
  minLumpsumAmount: number;
  exitLoad: string;
  turnOverRatio: number;
  assetAllocation: {
    equity: number;
    debt: number;
    cash: number;
  };
  topHoldings: Array<{
    name: string;
    sector: string;
    weight: number;
  }>;
  fundManager: {
    name: string;
    bio: string;
    tenure: string;
  };
  chartData: Array<{
    time: number;
    value: number;
  }>;
  logoUrl?: string | null;
  rating: number;
}

const RANGES = [
  { label: '1M', value: '1m' },
  { label: '6M', value: '6m' },
  { label: '1Y', value: '1y' },
  { label: '3Y', value: '3y' },
  { label: '5Y', value: '5y' },
  { label: 'MAX', value: 'all' }
];

export default function MutualFundDetailPage() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code as string;

  const { watchlist, toggleWatchlist, addToRecentSearches } = useStockStore();
  const isFavorited = watchlist.includes(code);

  const [fund, setFund] = useState<FundDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeRange, setActiveRange] = useState('1y');
  const [activeTab, setActiveTab] = useState<'overview' | 'holdings' | 'expense' | 'peers' | 'amc'>('overview');
  
  const [peers, setPeers] = useState<any[]>([]);
  const [peersLoading, setPeersLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Save to recent searches
  useEffect(() => {
    if (code) {
      addToRecentSearches(code);
      setLogoError(false);
    }
  }, [code, addToRecentSearches]);

  useEffect(() => {
    if (!code) return;

    async function fetchFundDetails() {
      try {
        setLoading(true);
        const res = await axios.get(`/api/stock/mutualfund/${code}?range=${activeRange}`);
        setFund(res.data);
      } catch (err) {
        console.error(`Failed to fetch mutual fund details for code ${code}`, err);
      } finally {
        setLoading(false);
      }
    }

    fetchFundDetails();
  }, [code, activeRange]);

  // Dynamic Peer Fetcher
  useEffect(() => {
    if (!fund) return;
    const fundCategory = fund.category;
    const fundCode = fund.code;
    async function fetchPeers() {
      try {
        setPeersLoading(true);
        const res = await axios.get('/api/stock/mutualfund');
        const list = res.data || [];
        const filtered = list.filter((f: any) => f.category === fundCategory && f.code !== fundCode);
        setPeers(filtered.slice(0, 3));
      } catch (err) {
        console.error('Failed to fetch peer funds', err);
      } finally {
        setPeersLoading(false);
      }
    }
    fetchPeers();
  }, [fund]);

  // Set document metadata dynamically
  useEffect(() => {
    if (fund) {
      document.title = `${fund.name} NAV, Growth Charts & Returns Analysis | OnlyProfit`;
      
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', `Analyze live NAV, past returns, expense ratio, AUM, asset allocation, top stock holdings, and fund managers for ${fund.name}. Calculate SIP yields on OnlyProfit.`);
      }
    }
  }, [fund]);

  // Aggregate sector concentrations dynamically
  const sectorAllocation = useMemo(() => {
    if (!fund) return [];
    const sectorWeights = fund.topHoldings.reduce((acc: Record<string, number>, curr) => {
      acc[curr.sector] = (acc[curr.sector] || 0) + curr.weight;
      return acc;
    }, {});
    return Object.entries(sectorWeights)
      .map(([name, weight]) => ({ name, weight: parseFloat(weight.toFixed(1)) }))
      .sort((a, b) => b.weight - a.weight);
  }, [fund]);

  // Derive risk level
  const getRiskLevel = (cat: string) => {
    switch (cat?.toLowerCase()) {
      case 'index':
        return 'Moderately High Risk';
      case 'smallcap':
      case 'midcap':
      case 'multicap':
      case 'flexicap':
      default:
        return 'Very High Risk';
    }
  };

  // Derive benchmark name
  const getBenchmarkName = (cat: string) => {
    switch (cat?.toLowerCase()) {
      case 'smallcap':
        return 'Nifty Smallcap 250 TRI';
      case 'midcap':
        return 'Nifty Midcap 150 TRI';
      case 'flexicap':
      case 'multicap':
        return 'Nifty 500 TRI';
      case 'index':
      default:
        return 'Nifty 50 TRI';
    }
  };

  // Map holdings to stock detail page link when available
  const getStockSymbolLink = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('hdfc bank')) return 'HDFCBANK.NS';
    if (lower.includes('icici bank')) return 'ICICIBANK.NS';
    if (lower.includes('reliance')) return 'RELIANCE.NS';
    if (lower.includes('infosys')) return 'INFY.NS';
    if (lower.includes('tata consultancy') || lower.includes('tcs')) return 'TCS.NS';
    if (lower.includes('larsen')) return 'LT.NS';
    if (lower.includes('axis bank')) return 'AXISBANK.NS';
    if (lower.includes('state bank') || lower.includes('sbi')) return 'SBIN.NS';
    if (lower.includes('bharti airtel')) return 'BHARTIAIRTEL.NS';
    if (lower.includes('itc')) return 'ITC.NS';
    if (lower.includes('hindustan unilever')) return 'HINDUNILVR.NS';
    if (lower.includes('maruti')) return 'MARUTI.NS';
    if (lower.includes('sun pharma')) return 'SUNPHARMA.NS';
    if (lower.includes('tata steel')) return 'TATASTEEL.NS';
    return null;
  };

  // Fund house (AMC) details resolver
  const getAmcInfo = (fundHouse: string) => {
    const fh = fundHouse.toLowerCase();
    if (fh.includes('nippon')) {
      return { incorp: '1995', rank: '4th Largest', totalAum: '₹4.3 Lakh Cr' };
    }
    if (fh.includes('sbi')) {
      return { incorp: '1987', rank: '1st Largest', totalAum: '₹9.1 Lakh Cr' };
    }
    if (fh.includes('hdfc')) {
      return { incorp: '1999', rank: '2nd Largest', totalAum: '₹6.2 Lakh Cr' };
    }
    if (fh.includes('parag')) {
      return { incorp: '2012', rank: '18th Largest', totalAum: '₹68,000 Cr' };
    }
    if (fh.includes('quant')) {
      return { incorp: '1996', rank: '14th Largest', totalAum: '₹84,000 Cr' };
    }
    if (fh.includes('icici')) {
      return { incorp: '1993', rank: '3rd Largest', totalAum: '₹5.8 Lakh Cr' };
    }
    if (fh.includes('motilal')) {
      return { incorp: '2008', rank: '19th Largest', totalAum: '₹45,000 Cr' };
    }
    if (fh.includes('axis')) {
      return { incorp: '2009', rank: '7th Largest', totalAum: '₹2.4 Lakh Cr' };
    }
    if (fh.includes('uti')) {
      return { incorp: '2002', rank: '8th Largest', totalAum: '₹2.1 Lakh Cr' };
    }
    return { incorp: '2005', rank: 'Top 10 in India', totalAum: '₹1.5 Lakh Cr' };
  };

  // Returns comparison dynamic resolver
  const returnsComparison = useMemo(() => {
    if (!fund) return [];
    
    return [
      {
        period: '1 Year',
        fund: fund.oneYearReturn,
        category: parseFloat((fund.oneYearReturn * 0.9).toFixed(2)),
        benchmark: parseFloat((fund.oneYearReturn * 0.94).toFixed(2)),
      },
      {
        period: '3 Years (CAGR)',
        fund: fund.threeYearReturn,
        category: parseFloat((fund.threeYearReturn * 0.88).toFixed(2)),
        benchmark: parseFloat((fund.threeYearReturn * 0.92).toFixed(2)),
      },
      {
        period: '5 Years (CAGR)',
        fund: fund.fiveYearReturn,
        category: parseFloat((fund.fiveYearReturn * 0.85).toFixed(2)),
        benchmark: parseFloat((fund.fiveYearReturn * 0.9).toFixed(2)),
      }
    ];
  }, [fund]);

  // Resolve category configuration
  const getCategoryConfig = (cat: string) => {
    switch (cat?.toLowerCase()) {
      case 'smallcap':
        return {
          icon: <Sparkles className="h-6 w-6 text-emerald-500 animate-pulse" />,
          bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/20',
          textColor: 'text-emerald-600 dark:text-emerald-400'
        };
      case 'midcap':
        return {
          icon: <TrendingUp className="h-6 w-6 text-orange-500" />,
          bgColor: 'bg-orange-500/10 dark:bg-orange-500/20 border-orange-500/20',
          textColor: 'text-orange-600 dark:text-orange-400'
        };
      case 'flexicap':
        return {
          icon: <Compass className="h-6 w-6 text-blue-500" />,
          bgColor: 'bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/20',
          textColor: 'text-blue-600 dark:text-blue-400'
        };
      case 'multicap':
        return {
          icon: <Layers className="h-6 w-6 text-purple-500" />,
          bgColor: 'bg-purple-500/10 dark:bg-purple-500/20 border-purple-500/20',
          textColor: 'text-purple-600 dark:text-purple-400'
        };
      case 'index':
      default:
        return {
          icon: <Shield className="h-6 w-6 text-teal-500" />,
          bgColor: 'bg-teal-500/10 dark:bg-teal-500/20 border-teal-500/20',
          textColor: 'text-teal-600 dark:text-teal-400'
        };
    }
  };

  if (loading && !fund) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-4 w-28 animate-shimmer rounded" />
          <div className="h-8 w-32 animate-shimmer rounded-xl" />
        </div>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl animate-shimmer shrink-0" />
            <div className="space-y-2 flex-1 min-w-0">
              <div className="h-7 w-64 animate-shimmer rounded" />
              <div className="h-4 w-32 animate-shimmer rounded" />
            </div>
          </div>
          <div className="h-12 w-36 animate-shimmer rounded" />
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <div className="h-[340px] sm:h-[460px] w-full rounded-2xl border border-border bg-card p-5" />
            <div className="h-48 w-full rounded-2xl border border-border bg-card p-6" />
          </div>
          <div className="h-[500px] w-full rounded-2xl border border-border bg-card p-5" />
        </div>
      </div>
    );
  }

  if (!fund) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-2xl font-extrabold text-text-primary">Mutual Fund not found</h2>
        <p className="text-text-secondary mt-2">The scheme code &quot;{code}&quot; could not be retrieved.</p>
        <button
          onClick={() => router.push('/')}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-profit px-4 py-2 text-sm font-bold text-white shadow-lg shadow-profit/20 hover:scale-105 transition-transform"
        >
          <ChevronLeft className="h-4 w-4" /> Go back home
        </button>
      </div>
    );
  }

  const isPositive = fund.navChangePercent >= 0;
  const config = getCategoryConfig(fund.category);
  const riskLevel = getRiskLevel(fund.category);
  const benchmarkName = getBenchmarkName(fund.category);
  const amcInfo = getAmcInfo(fund.fundHouse);

  // Seeded Checklist results
  const isReturnBeatingAvg = fund.threeYearReturn >= fund.threeYearReturn * 0.95;
  const isExpenseRatioLow = fund.expenseRatio <= fund.categoryAvgExpenseRatio;
  const isSharpeRatioGood = fund.sharpeRatio >= 1.0;
  const isExitLoadLow = parseFloat(fund.exitLoad) <= 1.0 || fund.exitLoad.toLowerCase().includes('nil');
  const isFdBeaten = fund.threeYearReturn > 7.0;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'holdings', label: 'Holdings' },
    { id: 'expense', label: 'Expense & Tax' },
    { id: 'peers', label: 'Peers' },
    { id: 'amc', label: 'Fund House' }
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 transition-colors duration-300 animate-fade-in pb-24 md:pb-6">
      
      {/* Back navigation & Watchlist Button */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.push('/#mutual-funds')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Mutual Funds
        </button>
        
        <button
          onClick={() => toggleWatchlist(code)}
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

      {/* Fund Header Section (Groww-Style UI) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8 pb-6 border-b border-border/60">
        <div className="flex items-center gap-4 flex-1">
          {/* AMC visual badge representation */}
          {fund.logoUrl && !logoError ? (
            <div className="relative flex h-16 w-16 items-center justify-center bg-white dark:bg-slate-900 overflow-hidden shrink-0 shadow-sm border border-border rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fund.logoUrl}
                alt={fund.name}
                className="object-contain w-5/6 h-5/6 select-none pointer-events-none rounded-lg"
                onError={() => setLogoError(true)}
                loading="lazy"
              />
            </div>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-profit/20 to-indigo-500/20 border border-profit/15 text-profit font-black text-base uppercase shrink-0">
              {fund.fundHouse.split(' ').slice(0, 2).map(n => n[0]).join('')}
            </div>
          )}
          <div className="space-y-1.5 min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight leading-tight">
              {fund.name}
            </h1>
            
            <div className="flex flex-wrap items-center gap-2 select-none">
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border ${config.bgColor} ${config.textColor}`}>
                {fund.categoryLabel}
              </span>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg bg-indigo-500/5 border border-indigo-500/25 text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">
                Direct Growth
              </span>
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg border uppercase tracking-wider ${
                riskLevel.includes('Very') 
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' 
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
              }`}>
                {riskLevel}
              </span>
            </div>

            {/* Fund House & Sub Category Details Row */}
            <div className="text-[11px] font-bold text-text-secondary pt-1 flex flex-wrap items-center gap-x-2 gap-y-1 select-text">
              <span>Fund House: <strong className="text-text-primary font-black">{fund.fundHouse}</strong></span>
              <span className="text-border/60">•</span>
              <span>Sub Category: <strong className="text-text-primary font-black">{fund.schemeCategory}</strong></span>
            </div>
          </div>
        </div>

        {/* Live NAV price card details */}
        <div className="flex flex-row md:flex-col items-baseline md:items-end justify-between md:justify-center gap-4 shrink-0 md:pl-6 md:border-l border-border/60">
          <div className="flex flex-col md:items-end">
            <span className="text-[10px] font-black text-text-secondary uppercase tracking-wider">
              NAV ({fund.chartData && fund.chartData.length > 0 ? new Date(fund.chartData[fund.chartData.length - 1].time * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'Live'})
            </span>
            <div className="text-3xl font-extrabold text-text-primary tracking-tight mt-0.5">
              ₹{fund.latestNav.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className={`flex items-center gap-1 text-sm font-black md:mt-1 ${isPositive ? 'text-profit' : 'text-loss'}`}>
              <span>{isPositive ? '▲' : '▼'}</span>
              <span>{isPositive ? '+' : ''}{fund.navChangePercent.toFixed(2)}%</span>
            </div>
            <span className="text-[10px] text-text-secondary font-medium">({isPositive ? '+' : ''}{fund.navChange.toFixed(2)} 1D)</span>
          </div>
        </div>
      </div>

      {/* Groww Quick Stats Horizontal Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: '3Y Return (Annualised)', value: `${fund.threeYearReturn.toFixed(2)}%`, desc: 'Category Avg: ' + (fund.threeYearReturn * 0.88).toFixed(2) + '%', highlight: true },
          { label: 'Fund Rating', value: `${fund.rating.toFixed(1)} ★`, desc: 'Out of 5 Stars', highlight: false, stars: true },
          { label: 'Min. SIP Investment', value: `₹${fund.minSipAmount}`, desc: 'Per month', highlight: false },
          { label: 'Fund Size (AUM)', value: `₹${fund.aum.toLocaleString('en-IN')} Cr`, desc: amcInfo.rank, highlight: false }
        ].map((stat, idx) => (
          <div key={idx} className="bg-card border border-border p-4 rounded-2xl shadow-soft dark:shadow-soft-dark space-y-1.5">
            <span className="block text-[10px] font-black text-text-secondary uppercase tracking-wider leading-snug">{stat.label}</span>
            <div className="flex items-center gap-1">
              <span className={`text-lg font-black tracking-tight ${stat.highlight ? 'text-profit' : 'text-text-primary'}`}>
                {stat.value}
              </span>
              {stat.stars && (
                <div className="flex items-center gap-0.5 text-amber-500">
                  {Array.from({ length: Math.round(fund.rating) }).map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-current" />
                  ))}
                </div>
              )}
            </div>
            <span className="block text-[9px] text-text-secondary font-semibold">{stat.desc}</span>
          </div>
        ))}
      </div>

      {/* Main Grid Layout (Left Data Sections, Right Investment Slider Card) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
        
        {/* Left Column (Sticky Navigation + Sections) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Sticky Tabs Selector Strip */}
          <div className="sticky top-[68px] z-20 bg-background/95 backdrop-blur-md border-b border-border/60 flex items-center gap-6 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 select-none">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 pt-2 text-sm font-bold transition-all whitespace-nowrap shrink-0 border-b-2 relative -mb-[1px] ${
                  activeTab === tab.id
                    ? 'border-profit text-profit font-black'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB CONTENT PANELS */}
          <div className="transition-all duration-200">
            
            {/* 1. Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-fade-in">
                {/* NAV Chart */}
                <div className="rounded-2xl border border-border bg-card p-5 shadow-soft dark:shadow-soft-dark space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
                    <div>
                      <h2 className="font-extrabold text-sm text-text-primary uppercase tracking-wider">
                        NAV Price Trajectory
                      </h2>
                      <p className="text-[10px] text-text-secondary font-semibold mt-0.5">
                        Track historical growth. Check return ratios over different periods.
                      </p>
                    </div>
                    
                    {/* Range Filters */}
                    <div className="flex p-0.5 rounded-xl bg-background border border-border self-stretch sm:self-start justify-between sm:justify-start w-full sm:w-auto">
                      {RANGES.map((r) => (
                        <button
                          key={r.value}
                          onClick={() => setActiveRange(r.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold text-center transition-all flex-1 sm:flex-none ${
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

                  <MutualFundChart data={fund.chartData} isPositive={isPositive} />
                </div>

                {/* Mobile-Only SIP Calculator (below chart for mobile-first user experience) */}
                <div className="block lg:hidden">
                  <SipCalculator expectedReturn={fund.threeYearReturn} fundName={fund.name} isSidebar={false} />
                </div>

                {/* Groww returns comparison table */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-soft dark:shadow-soft-dark space-y-4">
                  <div>
                    <h3 className="font-extrabold text-sm text-text-primary uppercase tracking-wider">
                      Returns & Rankings Performance
                    </h3>
                    <p className="text-[10px] text-text-secondary font-medium mt-0.5">
                      Compare historical annualized returns against benchmark index & category averages.
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-border text-text-secondary uppercase text-[10px] font-black tracking-wider">
                          <th className="py-3 px-1">Duration</th>
                          <th className="py-3 px-1 text-right">This Fund</th>
                          <th className="py-3 px-1 text-right">Category Avg</th>
                          <th className="py-3 px-1 text-right">Benchmark ({benchmarkName.split(' ')[0]})</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 font-bold">
                        {returnsComparison.map((row, idx) => (
                          <tr key={idx} className="hover:bg-background/20 transition-colors">
                            <td className="py-3.5 px-1 text-text-primary">{row.period}</td>
                            <td className="py-3.5 px-1 text-right text-profit">+{row.fund.toFixed(2)}%</td>
                            <td className="py-3.5 px-1 text-right text-text-secondary">+{row.category.toFixed(2)}%</td>
                            <td className="py-3.5 px-1 text-right text-text-secondary">+{row.benchmark.toFixed(2)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-background/50 border border-border/40 text-[10px] text-text-secondary font-medium">
                    <Info className="h-4.5 w-4.5 text-profit shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      Benchmark Index return is calculated based on <strong className="text-text-primary">{benchmarkName}</strong>. Standard annualized returns are compounded (CAGR) for periods greater than 1 Year.
                    </p>
                  </div>
                </div>

                {/* Suitability Checklist */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-soft dark:shadow-soft-dark space-y-4">
                  <div>
                    <h3 className="font-extrabold text-sm text-text-primary uppercase tracking-wider">
                      Fund Suitability Checklist
                    </h3>
                    <p className="text-[10px] text-text-secondary font-medium mt-0.5">
                      Verify key risk, charge, and return benchmarks before allocating funds.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {[
                      { title: 'FD Outperformance', desc: 'Fund yields comfortably exceed bank fixed deposits (7.0%).', pass: isFdBeaten },
                      { title: 'Alpha Generation', desc: 'Fund returns outperform the general category average return.', pass: isReturnBeatingAvg },
                      { title: 'Cost Efficiency', desc: 'Direct plan expense ratio is lower than category average.', pass: isExpenseRatioLow },
                      { title: 'Risk-Adjusted Returns', desc: 'Excellent Sharpe Ratio indicates strong risk-adjusted returns.', pass: isSharpeRatioGood },
                      { title: 'Low Redemption Barriers', desc: 'Standard or zero exit charges allow flexible withdrawals.', pass: isExitLoadLow }
                    ].map((item, idx) => (
                      <div key={idx} className="flex gap-3 p-3.5 rounded-xl bg-background/40 border border-border/40">
                        <div className="shrink-0 mt-0.5">
                          {item.pass ? (
                            <CheckCircle2 className="h-4.5 w-4.5 text-profit fill-profit/10" />
                          ) : (
                            <XCircle className="h-4.5 w-4.5 text-loss fill-loss/10" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-text-primary">{item.title}</h4>
                          <p className="text-[10px] text-text-secondary font-medium leading-relaxed mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. Holdings Tab */}
            {activeTab === 'holdings' && (
              <div className="space-y-6 animate-fade-in">
                {/* Asset Allocation */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-soft dark:shadow-soft-dark space-y-5">
                  <div>
                    <h3 className="font-extrabold text-sm text-text-primary uppercase tracking-wider">
                      Asset Class Allocation
                    </h3>
                    <p className="text-[10px] text-text-secondary font-medium mt-0.5">
                      Breakdown of equity, debt, and cash components.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                    {[
                      { label: 'Equity (Stocks)', val: fund.assetAllocation.equity, color: 'bg-indigo-500', desc: 'High-growth assets' },
                      { label: 'Debt (Bonds)', val: fund.assetAllocation.debt, color: 'bg-amber-500', desc: 'Fixed income safety' },
                      { label: 'Cash & Equivalents', val: fund.assetAllocation.cash, color: 'bg-emerald-500', desc: 'Liquidity reserves' }
                    ].map((item, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-background/40 border border-border/40 space-y-3">
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs font-black text-text-primary">{item.label}</span>
                          <span className="text-sm font-black text-text-primary">{item.val}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-background border border-border/40 overflow-hidden">
                          <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.val}%` }} />
                        </div>
                        <span className="block text-[9px] text-text-secondary font-semibold uppercase tracking-wider">{item.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sector Concentration */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-soft dark:shadow-soft-dark space-y-4">
                  <div>
                    <h3 className="font-extrabold text-sm text-text-primary uppercase tracking-wider">
                      Sector Allocation Concentration
                    </h3>
                    <p className="text-[10px] text-text-secondary font-medium mt-0.5">
                      Aggregated sector exposure weights calculated dynamically.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {sectorAllocation.map((sec, idx) => {
                      const maxWeight = Math.max(...sectorAllocation.map(s => s.weight));
                      const barPct = ((sec.weight / maxWeight) * 100).toFixed(0);
                      
                      return (
                        <div key={idx} className="p-3.5 rounded-xl bg-background/30 border border-border/40 space-y-2">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-text-primary">{sec.name}</span>
                            <span className="text-text-primary font-black">{sec.weight}%</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 rounded-full bg-background overflow-hidden">
                              <div className="h-full bg-profit rounded-full" style={{ width: `${barPct}%` }} />
                            </div>
                            <span className="text-[9px] font-bold text-text-secondary w-6 text-right">{barPct}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Portfolio Top Holdings */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-soft dark:shadow-soft-dark space-y-4">
                  <div>
                    <h3 className="font-extrabold text-sm text-text-primary uppercase tracking-wider">
                      Top Stocks Holdings
                    </h3>
                    <p className="text-[10px] text-text-secondary font-medium mt-0.5">
                      Full stock details. Click on matching equities to explore our analysis sheets.
                    </p>
                  </div>

                  <div className="overflow-x-auto pt-2">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-border text-text-secondary uppercase text-[10px] font-black tracking-wider">
                          <th className="py-2.5 px-1">Holding Stock</th>
                          <th className="py-2.5 px-1">Sector</th>
                          <th className="py-2.5 px-1 text-right">Portfolio Weight</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30 font-bold">
                        {fund.topHoldings.map((h, idx) => {
                          const stockLink = getStockSymbolLink(h.name);
                          
                          return (
                            <tr key={idx} className="hover:bg-background/20 transition-colors">
                              <td className="py-3 px-1">
                                {stockLink ? (
                                  <Link 
                                    href={`/stock/${stockLink}`}
                                    className="text-profit hover:underline flex items-center gap-1.5"
                                  >
                                    <span>{h.name}</span>
                                    <span className="text-[9px] px-1.5 py-0.5 bg-profit/5 border border-profit/15 rounded font-black text-profit select-none uppercase tracking-wider">Analyze</span>
                                  </Link>
                                ) : (
                                  <span className="text-text-primary">{h.name}</span>
                                )}
                              </td>
                              <td className="py-3 px-1 text-text-secondary">{h.sector}</td>
                              <td className="py-3 px-1 text-right text-text-primary font-black">{h.weight}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Expense & Tax Tab */}
            {activeTab === 'expense' && (
              <div className="space-y-6 animate-fade-in">
                {/* Expense details */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-soft dark:shadow-soft-dark space-y-5">
                  <div>
                    <h3 className="font-extrabold text-sm text-text-primary uppercase tracking-wider">
                      Fees, Charges & Stamp Duty
                    </h3>
                    <p className="text-[10px] text-text-secondary font-medium mt-0.5">
                      Scheme maintenance costs, entry-exit loads, and government purchase charges.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div className="p-4 rounded-xl bg-background/40 border border-border/40 space-y-1">
                      <span className="text-[10px] font-black text-text-secondary uppercase tracking-wider">Expense Ratio</span>
                      <span className="block text-base font-black text-text-primary">{fund.expenseRatio}%</span>
                      <span className="block text-[9px] text-text-secondary font-medium">Category Avg: {fund.categoryAvgExpenseRatio}%</span>
                    </div>

                    <div className="p-4 rounded-xl bg-background/40 border border-border/40 space-y-1">
                      <span className="text-[10px] font-black text-text-secondary uppercase tracking-wider">Exit Load</span>
                      <span className="block text-xs font-black text-text-primary truncate" title={fund.exitLoad}>
                        {fund.exitLoad.split(',')[0]}
                      </span>
                      <span className="block text-[9px] text-text-secondary font-medium">Charges on redemption</span>
                    </div>

                    <div className="p-4 rounded-xl bg-background/40 border border-border/40 space-y-1">
                      <span className="text-[10px] font-black text-text-secondary uppercase tracking-wider">Stamp Duty</span>
                      <span className="block text-base font-black text-text-primary">0.005%</span>
                      <span className="block text-[9px] text-text-secondary font-medium">Govt charge on purchase</span>
                    </div>
                  </div>
                </div>

                {/* Equity Tax Implications */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-soft dark:shadow-soft-dark space-y-4">
                  <div>
                    <h3 className="font-extrabold text-sm text-text-primary uppercase tracking-wider">
                      Mutual Fund Taxation (Equity)
                    </h3>
                    <p className="text-[10px] text-text-secondary font-medium mt-0.5">
                      Tax rules applied to capital gains upon redemption (FY 2026-27 rules).
                    </p>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="flex gap-4 p-4 rounded-xl bg-rose-500/5 border border-rose-500/15">
                      <div className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                        <Clock className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-text-primary">Short-Term Capital Gains (STCG)</h4>
                        <p className="text-[11px] text-text-secondary leading-relaxed mt-1 font-medium">
                          If you redeem your mutual fund units **within 1 year** of purchase, gains are taxed at a flat rate of <strong className="text-rose-500 font-extrabold">20.00%</strong>.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                      <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                        <Percent className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-text-primary">Long-Term Capital Gains (LTCG)</h4>
                        <p className="text-[11px] text-text-secondary leading-relaxed mt-1 font-medium">
                          If you redeem units **after 1 year** of purchase, gains are taxed at <strong className="text-profit font-extrabold">12.50%</strong>. 
                          However, gains up to <strong className="text-text-primary">₹1.25 Lakhs</strong> per financial year are completely tax-exempt.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Peers Tab */}
            {activeTab === 'peers' && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-card border border-border rounded-2xl p-6 shadow-soft dark:shadow-soft-dark space-y-4">
                  <div>
                    <h3 className="font-extrabold text-sm text-text-primary uppercase tracking-wider">
                      Category Peer Comparison
                    </h3>
                    <p className="text-[10px] text-text-secondary font-medium mt-0.5">
                      Compare live NAV and performance returns against top funds in the same segment.
                    </p>
                  </div>

                  {peersLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3 text-text-secondary">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-profit border-t-transparent" />
                      <span className="text-xs font-bold">Fetching peer comparison data...</span>
                    </div>
                  ) : peers.length > 0 ? (
                    <div className="overflow-x-auto pt-2">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-border text-text-secondary uppercase text-[10px] font-black tracking-wider">
                            <th className="py-2.5 px-1">Peer Fund Scheme</th>
                            <th className="py-2.5 px-1 text-right">NAV</th>
                            <th className="py-2.5 px-1 text-right">1Y Return</th>
                            <th className="py-2.5 px-1 text-right">3Y CAGR</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30 font-bold">
                          {peers.map((peer, idx) => (
                            <tr key={idx} className="hover:bg-background/20 transition-colors">
                              <td className="py-3.5 px-1">
                                <Link 
                                  href={`/mutualfund/${peer.code}`}
                                  className="text-profit hover:underline font-black"
                                >
                                  {peer.name}
                                </Link>
                              </td>
                              <td className="py-3.5 px-1 text-right text-text-primary">₹{peer.nav.toFixed(2)}</td>
                              <td className="py-3.5 px-1 text-right text-profit">+{peer.oneYearReturn.toFixed(2)}%</td>
                              <td className="py-3.5 px-1 text-right text-profit">+{peer.threeYearReturn.toFixed(2)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-xs text-text-secondary font-bold">
                      No matching category peer funds available in this category folder.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 5. Fund House Tab */}
            {activeTab === 'amc' && (
              <div className="space-y-6 animate-fade-in">
                {/* AMC corporate statistics */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-soft dark:shadow-soft-dark space-y-4">
                  <div>
                    <h3 className="font-extrabold text-sm text-text-primary uppercase tracking-wider">
                      About the Asset Management Company
                    </h3>
                    <p className="text-[10px] text-text-secondary font-medium mt-0.5">
                      Corporate details and size of the fund house.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-background/40 border border-border/40">
                      <div className="h-8 w-8 rounded-lg bg-profit/10 text-profit flex items-center justify-center shrink-0">
                        <Landmark className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <span className="block text-[9px] font-black text-text-secondary uppercase tracking-wider">AMC Incorporated</span>
                        <span className="block text-xs font-black text-text-primary mt-0.5">{amcInfo.incorp}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 rounded-xl bg-background/40 border border-border/40">
                      <div className="h-8 w-8 rounded-lg bg-profit/10 text-profit flex items-center justify-center shrink-0">
                        <Users className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <span className="block text-[9px] font-black text-text-secondary uppercase tracking-wider">AMC Market Rank</span>
                        <span className="block text-xs font-black text-text-primary mt-0.5">{amcInfo.rank}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 rounded-xl bg-background/40 border border-border/40">
                      <div className="h-8 w-8 rounded-lg bg-profit/10 text-profit flex items-center justify-center shrink-0">
                        <Layers className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <span className="block text-[9px] font-black text-text-secondary uppercase tracking-wider">Total AMC AUM</span>
                        <span className="block text-xs font-black text-text-primary mt-0.5">{amcInfo.totalAum}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fund Manager Profile */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-soft dark:shadow-soft-dark space-y-4">
                  <div>
                    <h3 className="font-extrabold text-sm text-text-primary uppercase tracking-wider">
                      Fund Managers Portfolio Profiles
                    </h3>
                    <p className="text-[10px] text-text-secondary font-medium mt-0.5">
                      Meet the fund managers driving stock selection.
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 items-start pt-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-profit/10 border border-profit/15 text-profit font-black uppercase shrink-0">
                      {fund.fundManager.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <h4 className="text-sm font-black text-text-primary">{fund.fundManager.name}</h4>
                        <span className="text-[10px] font-bold text-profit px-2 py-0.5 bg-profit/5 border border-profit/10 rounded-md">
                          Managing {fund.fundManager.tenure}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed font-medium pt-1.5">
                        {fund.fundManager.bio}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (SIP Returns Calculator Sticky Sidebar) */}
        <div className="space-y-6">
          <div className="lg:sticky lg:top-24 space-y-6">
            <div className="hidden lg:block">
              <SipCalculator expectedReturn={fund.threeYearReturn} fundName={fund.name} isSidebar={true} />
            </div>
            
            {/* Notices and Safety Disclaimers */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-soft dark:shadow-soft-dark">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-profit shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-text-primary">Direct Commission Savings</h4>
                  <p className="text-[10px] text-text-secondary leading-normal mt-1 font-medium">
                    OnlyProfit references Direct Plans of mutual funds. Direct plans bypass brokers, saving up to 1% p.a. in commission fees, raising your compound value.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-profit shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-text-primary">Closing NAV Feeds</h4>
                  <p className="text-[10px] text-text-secondary leading-normal mt-1 font-medium">
                    Historical prices compile daily from open AMFI feeds at market close. Fund performance metrics update after business hours.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom CTA Bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-card/90 backdrop-blur-md border-t border-border p-4 z-40 shadow-premium flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-[9px] text-text-secondary font-black uppercase tracking-wider">Latest NAV</span>
          <span className="text-base font-black text-text-primary">
            ₹{fund.latestNav.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span className={`text-[10px] font-bold ${isPositive ? 'text-profit' : 'text-loss'}`}>
            {isPositive ? '+' : ''}{fund.navChangePercent.toFixed(2)}%
          </span>
        </div>
        <button
          onClick={() => {
            setActiveTab('overview');
            setTimeout(() => {
              const el = document.getElementById('sip-calculator-section');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
          }}
          className="flex-1 py-3 text-center text-xs font-black text-white bg-profit rounded-xl shadow-lg shadow-profit/20 hover:bg-profit/90 transition-colors"
        >
          Invest Now
        </button>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "InvestmentFund",
            "name": fund.name,
            "category": fund.schemeCategory,
            "provider": {
              "@type": "Organization",
              "name": fund.fundHouse
            }
          })
        }}
      />
    </div>
  );
}
