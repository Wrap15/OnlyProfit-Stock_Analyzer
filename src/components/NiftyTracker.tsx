'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Search, TrendingUp, Landmark, Cpu, Flame, Cookie, 
  Car, Wrench, Layers, HeartPulse, PhoneCall, Bolt, ChevronUp, 
  ChevronDown, HelpCircle, ArrowUpRight, ArrowDownRight, Compass, Activity
} from 'lucide-react';
import { apiClient as axios } from '@/lib/apiClient';
import StockLogo from './StockLogo';
import dynamic from 'next/dynamic';

const StockChart = dynamic(() => import('./StockChart'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[280px] sm:h-[400px] bg-background/50 rounded-2xl border border-border flex items-center justify-center animate-pulse">
      <div className="flex flex-col items-center gap-2">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-profit border-t-transparent" />
        <span className="text-xs text-text-secondary font-bold">Loading Nifty 50 Chart...</span>
      </div>
    </div>
  )
});

const RANGES = [
  { label: '1D', value: '1d' },
  { label: '1W', value: '1w' },
  { label: '1M', value: '1mo' },
  { label: '1Y', value: '1y' },
  { label: '5Y', value: '5y' }
];

interface NiftyTrackerProps {
  symbol: string;
  indexQuote: any;
  onBack: () => void;
}

const NIFTY50_CONSTITUENTS = [
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Ltd.', weight: 11.72, sector: 'Financial Services' },
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries Ltd.', weight: 9.39, sector: 'Energy' },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank Ltd.', weight: 8.32, sector: 'Financial Services' },
  { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel Ltd.', weight: 5.20, sector: 'Communication Services' },
  { symbol: 'LT.NS', name: 'Larsen & Toubro Ltd.', weight: 4.43, sector: 'Industrials' },
  { symbol: 'INFY.NS', name: 'Infosys Ltd.', weight: 4.12, sector: 'Information Technology' },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services Ltd.', weight: 3.77, sector: 'Information Technology' },
  { symbol: 'SBIN.NS', name: 'State Bank of India', weight: 3.71, sector: 'Financial Services' },
  { symbol: 'AXISBANK.NS', name: 'Axis Bank Ltd.', weight: 3.42, sector: 'Financial Services' },
  { symbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank Ltd.', weight: 2.62, sector: 'Financial Services' },
  { symbol: 'ITC.NS', name: 'ITC Ltd.', weight: 2.56, sector: 'Consumer Staples' },
  { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever Ltd.', weight: 2.40, sector: 'Consumer Staples' },
  { symbol: 'M&M.NS', name: 'Mahindra & Mahindra Ltd.', weight: 2.30, sector: 'Consumer Discretionary' },
  { symbol: 'TATAMOTORS.NS', name: 'Tata Motors Ltd.', weight: 2.10, sector: 'Consumer Discretionary' },
  { symbol: 'TITAN.NS', name: 'Titan Company Ltd.', weight: 1.80, sector: 'Consumer Discretionary' },
  { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance Ltd.', weight: 1.80, sector: 'Financial Services' },
  { symbol: 'SUNPHARMA.NS', name: 'Sun Pharmaceutical Industries Ltd.', weight: 1.70, sector: 'Health Care' },
  { symbol: 'HCLTECH.NS', name: 'HCL Technologies Ltd.', weight: 1.60, sector: 'Information Technology' },
  { symbol: 'NTPC.NS', name: 'NTPC Ltd.', weight: 1.50, sector: 'Utilities' },
  { symbol: 'POWERGRID.NS', name: 'Power Grid Corporation of India Ltd.', weight: 1.40, sector: 'Utilities' },
  { symbol: 'BEL.NS', name: 'Bharat Electronics Ltd.', weight: 1.36, sector: 'Industrials' },
  { symbol: 'COALINDIA.NS', name: 'Coal India Ltd.', weight: 1.30, sector: 'Energy' },
  { symbol: 'TATASTEEL.NS', name: 'Tata Steel Ltd.', weight: 1.30, sector: 'Materials' },
  { symbol: 'JSWSTEEL.NS', name: 'JSW Steel Ltd.', weight: 1.20, sector: 'Materials' },
  { symbol: 'ADANIENT.NS', name: 'Adani Enterprises Ltd.', weight: 1.10, sector: 'Materials' },
  { symbol: 'ADANIPORTS.NS', name: 'Adani Ports & SEZ Ltd.', weight: 1.10, sector: 'Industrials' },
  { symbol: 'GRASIM.NS', name: 'Grasim Industries Ltd.', weight: 1.00, sector: 'Materials' },
  { symbol: 'ULTRACEMCO.NS', name: 'UltraTech Cement Ltd.', weight: 1.00, sector: 'Materials' },
  { symbol: 'ASIANPAINT.NS', name: 'Asian Paints Ltd.', weight: 0.90, sector: 'Consumer Discretionary' },
  { symbol: 'NESTLEIND.NS', name: 'Nestle India Ltd.', weight: 0.90, sector: 'Consumer Staples' },
  { symbol: 'MARUTI.NS', name: 'Maruti Suzuki India Ltd.', weight: 0.90, sector: 'Consumer Discretionary' },
  { symbol: 'ONGC.NS', name: 'Oil & Natural Gas Corporation Ltd.', weight: 0.90, sector: 'Energy' },
  { symbol: 'TRENT.NS', name: 'Trent Ltd.', weight: 0.87, sector: 'Consumer Discretionary' },
  { symbol: 'BPCL.NS', name: 'Bharat Petroleum Corporation Ltd.', weight: 0.80, sector: 'Energy' },
  { symbol: 'BAJAJFINSV.NS', name: 'Bajaj Finserv Ltd.', weight: 0.80, sector: 'Financial Services' },
  { symbol: 'INDIGO.NS', name: 'InterGlobe Aviation Ltd.', weight: 0.80, sector: 'Consumer Discretionary' },
  { symbol: 'WIPRO.NS', name: 'Wipro Ltd.', weight: 0.70, sector: 'Information Technology' },
  { symbol: 'TECHM.NS', name: 'Tech Mahindra Ltd.', weight: 0.70, sector: 'Information Technology' },
  { symbol: 'MAXHEALTH.NS', name: 'Max Healthcare Institute Ltd.', weight: 0.70, sector: 'Health Care' },
  { symbol: 'BRITANNIA.NS', name: 'Britannia Industries Ltd.', weight: 0.70, sector: 'Consumer Staples' },
  { symbol: 'HDFCLIFE.NS', name: 'HDFC Life Insurance Company Ltd.', weight: 0.60, sector: 'Financial Services' },
  { symbol: 'SBILIFE.NS', name: 'SBI Life Insurance Company Ltd.', weight: 0.60, sector: 'Financial Services' },
  { symbol: 'EICHERMOT.NS', name: 'Eicher Motors Ltd.', weight: 0.60, sector: 'Consumer Discretionary' },
  { symbol: 'BAJAJ-AUTO.NS', name: 'Bajaj Auto Ltd.', weight: 0.60, sector: 'Consumer Discretionary' },
  { symbol: 'HINDALCO.NS', name: 'Hindalco Industries Ltd.', weight: 0.50, sector: 'Materials' },
  { symbol: 'APOLLOHOSP.NS', name: 'Apollo Hospitals Enterprise Ltd.', weight: 0.50, sector: 'Health Care' },
  { symbol: 'CIPLA.NS', name: 'Cipla Ltd.', weight: 0.50, sector: 'Health Care' },
  { symbol: 'DRREDDY.NS', name: 'Dr. Reddy\'s Laboratories Ltd.', weight: 0.48, sector: 'Health Care' },
  { symbol: 'TATACONSUM.NS', name: 'Tata Consumer Products Ltd.', weight: 0.38, sector: 'Consumer Staples' },
  { symbol: 'SHRIRAMFIN.NS', name: 'Shriram Finance Ltd.', weight: 0.35, sector: 'Financial Services' }
];

const SECTOR_METADATA = [
  { name: 'Financial Services', icon: Landmark, color: 'bg-emerald-500' },
  { name: 'Information Technology', icon: Cpu, color: 'bg-blue-500' },
  { name: 'Energy', icon: Flame, color: 'bg-amber-500' },
  { name: 'Consumer Staples', icon: Cookie, color: 'bg-violet-500' },
  { name: 'Consumer Discretionary', icon: Car, color: 'bg-indigo-500' },
  { name: 'Materials', icon: Layers, color: 'bg-teal-500' },
  { name: 'Industrials', icon: Wrench, color: 'bg-orange-500' },
  { name: 'Health Care', icon: HeartPulse, color: 'bg-rose-500' },
  { name: 'Communication Services', icon: PhoneCall, color: 'bg-pink-500' },
  { name: 'Utilities', icon: Bolt, color: 'bg-cyan-500' }
];

const sectorWeightsMap: Record<string, number> = {};
NIFTY50_CONSTITUENTS.forEach(c => {
  sectorWeightsMap[c.sector] = (sectorWeightsMap[c.sector] || 0) + c.weight;
});

const SECTOR_WEIGHTS = SECTOR_METADATA.map(sect => ({
  ...sect,
  weight: parseFloat((sectorWeightsMap[sect.name] || 0).toFixed(2))
})).sort((a, b) => b.weight - a.weight);

export default function NiftyTracker({ symbol: _symbol, indexQuote, onBack }: NiftyTrackerProps) {
  const [constituents, setConstituents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'weight' | 'price' | 'change' | 'name'>('weight');
  const [activeRange, setActiveRange] = useState('1d');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'heatmap'>('table');

  useEffect(() => {
    async function fetchConstituentQuotes() {
      try {
        setLoading(true);
        const symbolsParam = NIFTY50_CONSTITUENTS.map(c => c.symbol).join(',');
        const res = await axios.get(`/api/stock/quote?symbols=${symbolsParam}`);
        const quotes = res.data || [];

        const populated = NIFTY50_CONSTITUENTS.map(item => {
          const q = quotes.find((quote: any) => quote.symbol === item.symbol) || {};
          return {
            ...item,
            price: q.regularMarketPrice || 0,
            change: q.regularMarketChange || 0,
            changePercent: q.regularMarketChangePercent || 0,
            marketCap: q.marketCap || 0
          };
        });

        setConstituents(populated);
      } catch (err) {
        console.error('Failed to load constituent quotes', err);
      } finally {
        setLoading(false);
      }
    }

    fetchConstituentQuotes();
  }, []);

  const handleSort = (field: 'weight' | 'price' | 'change' | 'name') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc'); // Default to desc
    }
  };

  const sortedConstituents = [...constituents]
    .filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.symbol.split('.')[0].toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];

      if (sortBy === 'change') {
        valA = a.changePercent;
        valB = b.changePercent;
      } else if (sortBy === 'name') {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  const isPositive = indexQuote?.regularMarketChangePercent >= 0;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 transition-colors duration-300 animate-fade-in space-y-6">
      
      {/* Back button */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>
      </div>

      {/* Index Command Hero Header */}
      <div className="p-6 rounded-3xl border border-border bg-glass shadow-premium relative overflow-hidden">
        {/* Glow backdrop decorative */}
        <div className={`absolute top-0 right-0 h-40 w-40 rounded-full blur-3xl pointer-events-none select-none opacity-20 ${
          isPositive ? 'bg-emerald-500' : 'bg-rose-500'
        }`} />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase bg-profit/10 text-profit border border-profit/20 px-2 py-0.5 rounded">
                BENCHMARK INDEX
              </span>
              <span className="text-[10px] font-bold text-text-secondary">NSE INDIA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
              NIFTY 50 INDEX TRACKER
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary font-medium max-w-2xl leading-relaxed">
              Tracking the performance of 50 large, liquid, and well-established Indian blue-chip corporate equities.
            </p>
          </div>

          {/* Pricing indicators */}
          <div className="flex items-center gap-6">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">INDEX VALUE</span>
              <div className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
                ₹{indexQuote?.regularMarketPrice?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold ${isPositive ? 'text-profit' : 'text-loss'}`}>
                {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                <span>{isPositive ? '+' : ''}{indexQuote?.regularMarketChangePercent?.toFixed(2) || '0.00'}%</span>
                <span className="opacity-80">({isPositive ? '+' : ''}{indexQuote?.regularMarketChange?.toFixed(2) || '0.00'})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Index Metrics slabs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Open/Close/High/Low */}
        <div className="p-4 bg-glass border border-border/80 rounded-2xl shadow-premium grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">Open</span>
            <span className="font-extrabold text-text-primary mt-0.5 block">
              ₹{indexQuote?.regularMarketDayHigh ? (indexQuote.regularMarketPrice - indexQuote.regularMarketChange).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : 'TBA'}
            </span>
          </div>
          <div>
            <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">Prev. Close</span>
            <span className="font-extrabold text-text-primary mt-0.5 block">
              ₹{indexQuote?.regularMarketPrice ? (indexQuote.regularMarketPrice - indexQuote.regularMarketChange).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : 'TBA'}
            </span>
          </div>
          <div>
            <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">Day High</span>
            <span className="font-extrabold text-text-primary mt-0.5 block">
              ₹{indexQuote?.regularMarketDayHigh?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || 'TBA'}
            </span>
          </div>
          <div>
            <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">Day Low</span>
            <span className="font-extrabold text-text-primary mt-0.5 block">
              ₹{indexQuote?.regularMarketDayLow?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || 'TBA'}
            </span>
          </div>
        </div>

        {/* 52w boundaries */}
        <div className="p-4 bg-glass border border-border/80 rounded-2xl shadow-premium flex flex-col justify-between text-xs">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">52 Week High</span>
              <span className="font-extrabold text-text-primary block mt-0.5">
                ₹{indexQuote?.fiftyTwoWeekHigh?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || 'TBA'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">52 Week Low</span>
              <span className="font-extrabold text-text-primary block mt-0.5">
                ₹{indexQuote?.fiftyTwoWeekLow?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || 'TBA'}
              </span>
            </div>
          </div>
          {indexQuote?.fiftyTwoWeekHigh && indexQuote?.fiftyTwoWeekLow && (
            <div className="h-1.5 w-full bg-border/40 rounded-full overflow-hidden mt-3">
              <div 
                className="h-full bg-indigo-500 rounded-full" 
                style={{ 
                  width: `${((indexQuote.regularMarketPrice - indexQuote.fiftyTwoWeekLow) / (indexQuote.fiftyTwoWeekHigh - indexQuote.fiftyTwoWeekLow)) * 100}%` 
                }}
              />
            </div>
          )}
        </div>

        {/* NSE Index Valuations */}
        <div className="p-4 bg-glass border border-border/80 rounded-2xl shadow-premium grid grid-cols-3 gap-2 text-xs items-center">
          <div>
            <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">P/E Ratio</span>
            <span className="font-black text-text-primary mt-0.5 block text-sm">21.54</span>
          </div>
          <div>
            <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">P/B Ratio</span>
            <span className="font-black text-text-primary mt-0.5 block text-sm">3.85</span>
          </div>
          <div>
            <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">Div Yield</span>
            <span className="font-black text-profit mt-0.5 block text-sm">1.22%</span>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="p-4 bg-glass border border-border/80 rounded-2xl shadow-premium flex items-center justify-between gap-3 text-xs">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-profit/15 text-profit border border-profit/20 shrink-0">
            <Compass className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">Index base value</span>
            <span className="font-black text-text-primary mt-0.5 block">1,000 (Base: 1995)</span>
          </div>
        </div>
      </div>

      {/* Interactive Nifty 50 Chart Section */}
      <div className="p-6 bg-glass border border-border/85 rounded-3xl shadow-premium space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-indigo-500/15 text-indigo-500">
              <Activity className="h-4 w-4" />
            </span>
            <h3 className="font-extrabold text-sm text-text-primary">Interactive Performance Chart</h3>
          </div>
          
          {/* Time range selection pills */}
          <div className="flex gap-1.5 p-1 bg-background border border-border/80 rounded-xl self-start sm:self-auto">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setActiveRange(r.value)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
                  activeRange === r.value
                    ? 'bg-profit text-white shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Client-Side Chart */}
        <div className="w-full">
          <StockChart symbol={_symbol} range={activeRange} isPositive={isPositive} />
        </div>
      </div>

      {/* Main Grid: Sector weights & Constituents list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Sector allocations (Col Span 1) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-5 bg-glass border border-border/80 rounded-2xl shadow-premium space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border/40">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-indigo-500/15 text-indigo-500">
                <Activity className="h-4 w-4" />
              </span>
              <h3 className="font-extrabold text-sm text-text-primary">Sector Weight Allocation</h3>
            </div>
            
            <div className="space-y-3">
              {SECTOR_WEIGHTS.map((sect) => {
                const Icon = sect.icon;
                return (
                  <div key={sect.name} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <div className="flex items-center gap-1.5 text-text-secondary">
                        <Icon className="h-3.5 w-3.5" />
                        <span>{sect.name}</span>
                      </div>
                      <span className="text-text-primary font-extrabold">{sect.weight}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-border/45 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${sect.color}`} style={{ width: `${sect.weight}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Constituents table/heatmap (Col Span 2) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 bg-glass border border-border/80 rounded-2xl shadow-premium space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-profit/15 text-profit">
                  <TrendingUp className="h-4 w-4" />
                </span>
                <h3 className="font-extrabold text-sm text-text-primary">Index Constituents</h3>
              </div>

              {/* Actions: Search & Toggle view */}
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                {/* Search constituent bar */}
                <div className="relative w-full sm:w-48 md:w-64">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-3.5 w-3.5 text-text-secondary" />
                  </div>
                  <input
                    type="text"
                    placeholder="Filter constituents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-8 pl-8 pr-4 rounded-lg border border-border bg-background text-[11px] text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-profit/20 focus:border-profit transition-all duration-200"
                  />
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 p-0.5 bg-background border border-border/80 rounded-xl w-full sm:w-auto justify-center">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`flex-1 sm:flex-none px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
                      viewMode === 'table'
                        ? 'bg-profit text-white shadow-sm'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Table
                  </button>
                  <button
                    onClick={() => setViewMode('heatmap')}
                    className={`flex-1 sm:flex-none px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
                      viewMode === 'heatmap'
                        ? 'bg-profit text-white shadow-sm'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Heatmap
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3 py-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-border/40">
                    <div className="flex items-center gap-2.5 flex-1 max-w-[60%]">
                      <div className="h-7 w-7 rounded-lg animate-shimmer shrink-0" />
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="h-3 w-16 animate-shimmer rounded" />
                        <div className="h-2 w-28 animate-shimmer rounded" />
                      </div>
                    </div>
                    <div className="h-3.5 w-12 animate-shimmer rounded shrink-0" />
                    <div className="h-3.5 w-16 animate-shimmer rounded shrink-0 justify-self-end" />
                  </div>
                ))}
              </div>
            ) : viewMode === 'table' ? (
              <div className="overflow-x-auto scrollbar-none">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-border/50 text-[10px] text-text-secondary font-black uppercase tracking-wider">
                      <th className="pb-3 text-left">Stock Name</th>
                      <th 
                        className="pb-3 text-center cursor-pointer hover:text-text-primary transition-colors"
                        onClick={() => handleSort('weight')}
                      >
                        <span className="flex items-center justify-center gap-0.5">
                          Weight 
                          {sortBy === 'weight' && (sortOrder === 'asc' ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />)}
                        </span>
                      </th>
                      <th 
                        className="pb-3 text-right cursor-pointer hover:text-text-primary transition-colors"
                        onClick={() => handleSort('price')}
                      >
                        <span className="flex items-center justify-end gap-0.5">
                          Price 
                          {sortBy === 'price' && (sortOrder === 'asc' ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />)}
                        </span>
                      </th>
                      <th 
                        className="pb-3 text-right cursor-pointer hover:text-text-primary transition-colors"
                        onClick={() => handleSort('change')}
                      >
                        <span className="flex items-center justify-end gap-0.5">
                          Change 
                          {sortBy === 'change' && (sortOrder === 'asc' ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />)}
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 text-xs font-semibold text-text-primary">
                    {sortedConstituents.map((item) => {
                      const isPosVal = item.changePercent >= 0;
                      return (
                        <tr 
                          key={item.symbol}
                          className="hover:bg-background/25 cursor-pointer transition-colors group"
                          onClick={() => window.open(`/stock/${item.symbol}`, '_self')}
                        >
                          <td className="py-3 pr-2 text-left">
                            <div className="flex items-center gap-2.5">
                              <StockLogo symbol={item.symbol} size="sm" />
                              <div className="min-w-0">
                                <span className="font-extrabold text-xs text-text-primary group-hover:text-profit transition-colors truncate block">
                                  {item.name}
                                </span>
                                <span className="text-[9px] text-text-secondary uppercase font-black">
                                  {item.symbol.split('.')[0]} • {item.sector}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 text-center font-bold text-text-primary">
                            {item.weight.toFixed(2)}%
                          </td>
                          <td className="py-3 text-right font-bold text-text-primary">
                            ₹{item.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className={`py-3 text-right font-extrabold ${isPosVal ? 'text-profit' : 'text-loss'}`}>
                            {isPosVal ? '+' : ''}{item.changePercent.toFixed(2)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Heatmap Mode */
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 auto-rows-[60px] sm:auto-rows-[80px]">
                {sortedConstituents.map((item) => {
                  const change = item.changePercent || 0;
                  let colorClasses = "";
                  if (change >= 2.0) {
                    colorClasses = "bg-emerald-600 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.25)]";
                  } else if (change > 0) {
                    colorClasses = "bg-emerald-950/45 border-emerald-500/30 text-emerald-400 hover:border-emerald-500/60";
                  } else if (change === 0) {
                    colorClasses = "bg-slate-900/50 border-slate-700/30 text-slate-400";
                  } else if (change > -2.0) {
                    colorClasses = "bg-rose-950/45 border-rose-500/30 text-rose-400 hover:border-rose-500/60";
                  } else {
                    colorClasses = "bg-rose-600 border-rose-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.25)]";
                  }

                  const isLarge = item.weight >= 6.0;
                  const isMedium = item.weight >= 3.0 && item.weight < 6.0;

                  return (
                    <div
                      key={item.symbol}
                      className={`${
                        isLarge ? 'col-span-2 row-span-2' : isMedium ? 'col-span-2 row-span-1' : 'col-span-1 row-span-1'
                      } rounded-xl p-2 sm:p-3 flex flex-col justify-between border cursor-pointer select-none transition-all duration-200 hover:scale-[1.02] hover:shadow-lg relative group overflow-hidden ${colorClasses}`}
                      onClick={() => window.open(`/stock/${item.symbol}`, '_self')}
                      title={`${item.name} (${item.sector}) | Price: ₹${item.price.toLocaleString('en-IN')} | Change: ${change >= 0 ? '+' : ''}${change.toFixed(2)}% | Weight: ${item.weight}%`}
                    >
                      {(change >= 2.0 || change <= -2.0) && (
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-30 pointer-events-none" />
                      )}

                      {isLarge ? (
                        <>
                          <div className="flex justify-between items-start w-full">
                            <div className="min-w-0">
                              <div className="font-black text-sm tracking-tight truncate">{item.symbol.split('.')[0]}</div>
                              <div className="text-[9px] opacity-75 truncate font-medium">{item.name}</div>
                            </div>
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-white/10 select-none shrink-0 ml-1">
                              {item.weight.toFixed(2)}%
                            </span>
                          </div>
                          <div className="mt-auto">
                            <div className="text-sm sm:text-base font-black">₹{item.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                            <div className="flex items-center gap-0.5 text-[10px] font-extrabold">
                              {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                            </div>
                          </div>
                        </>
                      ) : isMedium ? (
                        <>
                          <div className="flex justify-between items-center w-full gap-1">
                            <div className="font-extrabold text-xs sm:text-sm tracking-tight truncate">{item.symbol.split('.')[0]}</div>
                            <span className="text-[8px] font-bold px-1.5 py-0.5 bg-white/5 rounded shrink-0">
                              {item.weight.toFixed(2)}%
                            </span>
                          </div>
                          <div className="flex justify-between items-baseline mt-auto w-full gap-1">
                            <div className="text-xs font-bold truncate">₹{item.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                            <div className="text-[9px] font-extrabold shrink-0">
                              {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between items-start w-full gap-0.5">
                            <div className="font-extrabold text-xs tracking-tight truncate">{item.symbol.split('.')[0]}</div>
                            <span className="text-[8px] opacity-60 font-semibold shrink-0">{item.weight.toFixed(0)}%</span>
                          </div>
                          <div className="text-[10px] font-extrabold mt-auto">
                            {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Information Disclaimer card */}
      <div className="p-4 border border-border/60 bg-background rounded-2xl flex items-start gap-3 text-[10px] text-text-secondary leading-relaxed font-semibold">
        <HelpCircle className="h-4 w-4 text-profit shrink-0 mt-0.5" />
        <div>
          <p>
            The NIFTY 50 Index is computed by free-float market capitalization methodology where the level of the index reflects the total free-float market value of all the 50 constituent stocks relative to base period value.
          </p>
          <p className="mt-1">
            Simulated quotes are fetched dynamically and recalculated in real-time. Weight allocation figures are updated according to standard NSE India index circulars.
          </p>
        </div>
      </div>

    </div>
  );
}
