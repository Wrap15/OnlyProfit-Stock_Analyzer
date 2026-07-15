'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStockStore } from '@/store/useStockStore';
import { ChevronLeft, ShieldCheck, Calendar } from 'lucide-react';
import nextDynamic from 'next/dynamic';
import SipCalculator from '@/components/SipCalculator';

// Modular Sub-components
import MutualFundHero from '@/features/mutualfunds/components/MutualFundHero';
import MutualFundOverviewTab from '@/features/mutualfunds/components/MutualFundOverviewTab';
import MutualFundHoldingsTab from '@/features/mutualfunds/components/MutualFundHoldingsTab';
import MutualFundExpenseTab from '@/features/mutualfunds/components/MutualFundExpenseTab';
import MutualFundPeersTab from '@/features/mutualfunds/components/MutualFundPeersTab';
import MutualFundAmcTab from '@/features/mutualfunds/components/MutualFundAmcTab';

// Reusable Custom Hook
import { useMutualFundDetails } from '@/hooks/useMutualFundDetails';

// Dynamically import MutualFundChart to disable SSR
const MutualFundChart = nextDynamic(() => import('@/components/MutualFundChart'), {
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

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'holdings', label: 'Holdings' },
  { id: 'expense', label: 'Expense & Tax' },
  { id: 'peers', label: 'Peers' },
  { id: 'amc', label: 'Fund House' }
] as const;

type ActiveTabType = (typeof TABS)[number]['id'];

export default function MutualFundDetailPage() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code as string;

  const { watchlist, toggleWatchlist } = useStockStore();
  const isFavorited = watchlist.includes(code);

  const [activeRange, setActiveRange] = useState('1y');
  const [activeTab, setActiveTab] = useState<ActiveTabType>('overview');
  const [logoError, setLogoError] = useState(false);

  const {
    fund,
    loading,
    peers,
    peersLoading,
    sectorAllocation,
    riskLevel,
  } = useMutualFundDetails(code, activeRange);

  // Derive AMC info resolver
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

  // Loading skeleton state
  if (loading && !fund) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-4 w-28 animate-pulse bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-8 w-32 animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl animate-pulse bg-slate-200 dark:bg-slate-800 shrink-0" />
            <div className="space-y-2 flex-1 min-w-0">
              <div className="h-7 w-64 animate-pulse bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-4 w-32 animate-pulse bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
          </div>
          <div className="h-12 w-36 animate-pulse bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <div className="h-[340px] sm:h-[460px] w-full rounded-2xl border border-border bg-card p-5 animate-pulse bg-slate-200/50 dark:bg-slate-800/30" />
            <div className="h-48 w-full rounded-2xl border border-border bg-card p-6 animate-pulse bg-slate-200/50 dark:bg-slate-800/30" />
          </div>
          <div className="h-[500px] w-full rounded-2xl border border-border bg-card p-5 animate-pulse bg-slate-200/50 dark:bg-slate-800/30" />
        </div>
      </div>
    );
  }

  // Scheme not found state
  if (!fund) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-2xl font-extrabold text-text-primary">Mutual Fund not found</h2>
        <p className="text-text-secondary mt-2">The scheme code &quot;{code}&quot; could not be retrieved.</p>
        <button
          onClick={() => router.push('/')}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-profit px-4 py-2 text-sm font-bold text-white shadow-lg shadow-profit/20 hover:scale-105 transition-transform cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" /> Go back home
        </button>
      </div>
    );
  }

  const isPositive = fund.navChangePercent >= 0;
  const benchmarkName = getBenchmarkName(fund.category);
  const amcInfo = getAmcInfo(fund.fundHouse);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 transition-colors duration-300 animate-fade-in pb-24 md:pb-6 space-y-6">
      
      {/* Hero Header component */}
      <MutualFundHero 
        fund={fund}
        isFavorited={isFavorited}
        onToggleWatchlist={() => toggleWatchlist(code)}
        logoError={logoError}
        setLogoError={setLogoError}
        onBack={() => router.push('/#mutual-funds')}
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        
        {/* Left Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Sub-tabs strip */}
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

          <div className="transition-all duration-200">
            {activeTab === 'overview' && (
              <MutualFundOverviewTab 
                fund={fund}
                isPositive={isPositive}
                benchmarkName={benchmarkName}
                activeRange={activeRange}
                setActiveRange={setActiveRange}
                MutualFundChart={MutualFundChart}
              />
            )}

            {activeTab === 'holdings' && (
              <MutualFundHoldingsTab 
                fund={fund}
                sectorAllocation={sectorAllocation}
              />
            )}

            {activeTab === 'expense' && (
              <MutualFundExpenseTab fund={fund} />
            )}

            {activeTab === 'peers' && (
              <MutualFundPeersTab 
                peers={peers}
                peersLoading={peersLoading}
              />
            )}

            {activeTab === 'amc' && (
              <MutualFundAmcTab 
                fund={fund}
                amcInfo={amcInfo}
              />
            )}
          </div>

        </div>

        {/* Right Column (SIP Returns Calculator Sticky Sidebar) */}
        <div className="space-y-6">
          <div className="lg:sticky lg:top-24 space-y-6">
            <div className="hidden lg:block" id="sip-calculator-section">
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
          className="flex-1 py-3 text-center text-xs font-black text-white bg-profit rounded-xl shadow-lg shadow-profit/20 hover:bg-profit/90 transition-colors cursor-pointer"
        >
          Invest Now
        </button>
      </div>

      {/* Structured Schema.org Metadata */}
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
          }).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')
        }}
      />

    </div>
  );
}
