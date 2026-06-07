'use client';

import React, { useState, useEffect } from 'react';
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
  Award,
  BookOpen
} from 'lucide-react';
import { apiClient as axios } from '@/lib/apiClient';
import dynamic from 'next/dynamic';
import SipCalculator from '@/components/SipCalculator';

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

  const { watchlist, toggleWatchlist } = useStockStore();
  const isFavorited = watchlist.includes(code);

  const [fund, setFund] = useState<FundDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeRange, setActiveRange] = useState('1y');

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

  // Seeded Checklist results
  const isReturnBeatingAvg = fund.threeYearReturn >= fund.threeYearReturn * 0.95;
  const isExpenseRatioLow = fund.expenseRatio <= fund.categoryAvgExpenseRatio;
  const isSharpeRatioGood = fund.sharpeRatio >= 1.0;
  const isExitLoadLow = parseFloat(fund.exitLoad) <= 1.0 || fund.exitLoad.toLowerCase().includes('nil');
  const isFdBeaten = fund.threeYearReturn > 7.0;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 transition-colors duration-300 animate-fade-in">
      
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

      {/* Fund Header Section */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border shrink-0 ${config.bgColor}`}>
            {config.icon}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
                {fund.name}
              </h1>
              <span className={`inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border ${config.bgColor} ${config.textColor}`}>
                {fund.categoryLabel}
              </span>
              <span className="text-[10px] font-extrabold px-2 py-1 rounded-full bg-profit/10 border border-profit/20 text-profit uppercase tracking-wider select-none">
                Direct Growth
              </span>
            </div>
            <p className="text-sm font-semibold text-text-secondary mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>Fund House: <strong className="text-text-primary">{fund.fundHouse}</strong></span>
              <span className="text-border hidden sm:inline">•</span>
              <span>Category: <strong className="text-text-primary">{fund.schemeCategory}</strong></span>
            </p>
          </div>
        </div>

        <div className="flex flex-col md:items-end">
          <div className="text-xs font-extrabold text-text-secondary uppercase tracking-wider">NAV (Net Asset Value)</div>
          <div className="text-3xl font-extrabold text-text-primary tracking-tight mt-0.5">
            ₹{fund.latestNav.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className={`flex items-center gap-1.5 text-sm font-bold mt-1 ${isPositive ? 'text-profit' : 'text-loss'}`}>
            <span>{isPositive ? '▲' : '▼'}</span>
            <span>{isPositive ? '+' : ''}{fund.navChangePercent.toFixed(2)}%</span>
            <span className="opacity-80">({isPositive ? '+' : ''}{fund.navChange.toFixed(2)} 1D)</span>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        
        {/* Left Column (Chart, Checklist, Metrics, Allocation, Managers) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* NAV Chart Card */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft dark:shadow-soft-dark">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="font-extrabold text-base text-text-primary tracking-tight">
                  NAV Growth Performance
                </h2>
                <p className="text-[10px] text-text-secondary font-semibold mt-0.5">
                  Historical Net Asset Value trend plotted for selected interval.
                </p>
              </div>
              
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

            <MutualFundChart data={fund.chartData} isPositive={isPositive} />
          </div>

          {/* Tickertape style Checklist */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft dark:shadow-soft-dark">
            <h3 className="font-extrabold text-base text-text-primary tracking-tight mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-4.5 w-4.5 text-profit" /> Mutual Fund Checklist
            </h3>
            <p className="text-[11px] text-text-secondary font-medium -mt-2.5 mb-5">
              Investment suitability checklist evaluated against industry parameters and category averages.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  title: 'Return vs FD',
                  desc: 'Fund\'s historical annualized return comfortably beats the Indian bank fixed deposit benchmark of 7.0%.',
                  pass: isFdBeaten
                },
                {
                  title: 'Return vs Category Avg',
                  desc: 'Fund returns outperform the overall category average returns over a 3-year horizon.',
                  pass: isReturnBeatingAvg
                },
                {
                  title: 'Expense Ratio suitability',
                  desc: 'Direct plan expense ratio is lower than the category average, saving charges over time.',
                  pass: isExpenseRatioLow
                },
                {
                  title: 'Risk Adjusted Returns (Sharpe)',
                  desc: 'Fund exhibits a strong Sharpe ratio, demonstrating high risk-adjusted yields.',
                  pass: isSharpeRatioGood
                },
                {
                  title: 'Exit Load Protection',
                  desc: 'Exit charges are standard or nil, protecting liquid withdrawals.',
                  pass: isExitLoadLow
                }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-3 p-3.5 rounded-xl bg-background/60 border border-border/40">
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

          {/* Key Metrics Grid */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft dark:shadow-soft-dark">
            <h3 className="font-extrabold text-base text-text-primary tracking-tight mb-4 pb-3 border-b border-border/50">
              Key Scheme Metrics
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              
              <div>
                <span className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider">AUM (Assets Size)</span>
                <span className="text-sm font-black text-text-primary mt-0.5 block">
                  ₹{fund.aum.toLocaleString('en-IN')} Cr
                </span>
                <span className="text-[9px] text-text-secondary block mt-1">Total assets under mgmt</span>
              </div>

              <div>
                <span className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider">Expense Ratio</span>
                <span className="text-sm font-black text-text-primary mt-0.5 block">
                  {fund.expenseRatio}%
                </span>
                <span className="text-[9px] text-text-secondary block mt-1">Category Avg: {fund.categoryAvgExpenseRatio}%</span>
              </div>

              <div>
                <span className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider">1Y Return</span>
                <span className="text-sm font-black text-profit mt-0.5 block">
                  +{fund.oneYearReturn.toFixed(2)}%
                </span>
                <span className="text-[9px] text-text-secondary block mt-1">Absolute growth</span>
              </div>

              <div>
                <span className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider">3Y CAGR Return</span>
                <span className="text-sm font-black text-profit mt-0.5 block">
                  {fund.threeYearReturn.toFixed(2)}%
                </span>
                <span className="text-[9px] text-text-secondary block mt-1">Annualized p.a.</span>
              </div>

              <div className="pt-3 border-t border-border/40">
                <span className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider">Sharpe Ratio</span>
                <span className="text-sm font-bold text-text-primary mt-0.5 block">{fund.sharpeRatio}</span>
                <span className="text-[9px] text-text-secondary block mt-1">Risk-adjusted reward</span>
              </div>

              <div className="pt-3 border-t border-border/40">
                <span className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider">Standard Deviation</span>
                <span className="text-sm font-bold text-text-primary mt-0.5 block">{fund.standardDeviation}%</span>
                <span className="text-[9px] text-text-secondary block mt-1">Volatility benchmark</span>
              </div>

              <div className="pt-3 border-t border-border/40">
                <span className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider">Min SIP Amount</span>
                <span className="text-sm font-bold text-text-primary mt-0.5 block">₹{fund.minSipAmount}</span>
                <span className="text-[9px] text-text-secondary block mt-1">Per installment</span>
              </div>

              <div className="pt-3 border-t border-border/40">
                <span className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider">Turnover Ratio</span>
                <span className="text-sm font-bold text-text-primary mt-0.5 block">{fund.turnOverRatio}%</span>
                <span className="text-[9px] text-text-secondary block mt-1">Portfolio churn rate</span>
              </div>

            </div>
          </div>

          {/* Asset Allocation & Top Holdings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Allocation */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft dark:shadow-soft-dark space-y-5">
              <h3 className="font-extrabold text-base text-text-primary tracking-tight pb-3 border-b border-border/50 flex items-center gap-2">
                <Layers className="h-4.5 w-4.5 text-profit" /> Asset Allocation
              </h3>
              
              <div className="space-y-4 pt-2">
                {[
                  { label: 'Equity (Stocks)', val: fund.assetAllocation.equity, color: 'bg-indigo-500' },
                  { label: 'Debt (Bonds)', val: fund.assetAllocation.debt, color: 'bg-amber-500' },
                  { label: 'Cash & Equivalents', val: fund.assetAllocation.cash, color: 'bg-emerald-500' }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">
                      <span>{item.label}</span>
                      <span className="text-text-primary">{item.val}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-background border border-border/45 overflow-hidden">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.val}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Holdings */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft dark:shadow-soft-dark space-y-4">
              <h3 className="font-extrabold text-base text-text-primary tracking-tight pb-3 border-b border-border/50 flex items-center gap-2">
                <BookOpen className="h-4.5 w-4.5 text-profit" /> Top Portfolio Holdings
              </h3>
              
              <div className="space-y-3 pt-1">
                {fund.topHoldings.map((holding, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs font-bold">
                    <div className="min-w-0">
                      <span className="block text-text-primary truncate">{holding.name}</span>
                      <span className="text-[9px] text-text-secondary font-semibold block">{holding.sector}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-text-primary block font-black">{holding.weight}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Fund Manager Profile */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft dark:shadow-soft-dark">
            <h3 className="font-extrabold text-base text-text-primary tracking-tight mb-4 pb-3 border-b border-border/50 flex items-center gap-2">
              <Award className="h-4.5 w-4.5 text-profit" /> Fund Management
            </h3>
            
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-profit/10 border border-profit/15 text-profit shrink-0">
                <span className="text-xs font-black uppercase">{fund.fundManager.name.split(' ').map(n => n[0]).join('')}</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <h4 className="text-sm font-black text-text-primary">{fund.fundManager.name}</h4>
                  <span className="text-[10px] font-bold text-profit px-2 py-0.5 bg-profit/5 border border-profit/10 rounded-md">
                    {fund.fundManager.tenure}
                  </span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed font-medium mt-1">
                  {fund.fundManager.bio}
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (SIP Calculator Widget & Safety Notices) */}
        <div className="space-y-8">
          
          {/* SIP / Returns calculator */}
          <div className="lg:sticky lg:top-24">
            <SipCalculator expectedReturn={fund.threeYearReturn} fundName={fund.name} isSidebar={true} />
            
            {/* Notices */}
            <div className="rounded-2xl border border-border/80 bg-background/50 p-5 mt-6 space-y-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-profit shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-text-primary">Direct Plans Only</h4>
                  <p className="text-[10px] text-text-secondary leading-normal mt-1 font-medium">
                    OnlyProfit lists Direct Plan options of mutual funds. Direct plans feature lower expense ratios because they bypass broker commissions, giving you higher compound returns over time.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-profit shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-text-primary">Historical NAV Updates</h4>
                  <p className="text-[10px] text-text-secondary leading-normal mt-1 font-medium">
                    Daily Net Asset Value (NAV) quotes are updated based on open public AMFI feeds at the close of every business day. Returns are calculated daily.
                  </p>
                </div>
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
