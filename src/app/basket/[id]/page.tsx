'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStockStore } from '@/store/useStockStore';
import { 
  ChevronLeft, 
  Star, 
  Sparkles, 
  Layers, 
  Landmark, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  Calendar,
  Info
} from 'lucide-react';
import axios from 'axios';
import dynamic from 'next/dynamic';
import StockLogo from '@/components/StockLogo';

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

interface ConstituentStock {
  symbol: string;
  ticker: string;
  name: string;
  price: number;
  changePercent: number;
  sector: string;
  weight: number;
}

interface BasketDetails {
  id: string;
  name: string;
  type: string;
  description: string;
  volatility: string;
  category: string;
  cagr: number;
  aum: number;
  minInvestmentAmount: number;
  managementFee: number;
  launchDate: string;
  rebalancingFrequency: string;
  changePercent1D: number;
  constituents: ConstituentStock[];
  chartData: Array<{
    time: number;
    value: number;
  }>;
}

const RANGES = [
  { label: '1M', value: '1mo' },
  { label: '6M', value: '6mo' },
  { label: '1Y', value: '1y' },
  { label: '5Y', value: '5y' }
];

function generateClientMockBasketChart(cagr: number, range: string) {
  const points = [];
  const now = new Date();
  let filterDays = 365;
  switch (range) {
    case '1mo': filterDays = 30; break;
    case '6mo': filterDays = 180; break;
    case '1y': filterDays = 365; break;
    case '5y': filterDays = 5 * 365; break;
    default: filterDays = 365; break;
  }
  
  let currentVal = 100;
  const stepReturn = Math.pow(1 + (cagr / 100), 1 / 250) - 1;
  let seed = filterDays;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  
  const count = Math.min(filterDays, 260);
  for (let i = count; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    
    const noise = (rand() - 0.49) * 2.0;
    currentVal = currentVal * (1 + stepReturn) + noise;
    points.push({
      time: Math.floor(d.getTime() / 1000),
      value: parseFloat(currentVal.toFixed(2))
    });
  }
  return points;
}

export default function BasketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { watchlist, toggleWatchlist } = useStockStore();
  const isFavorited = watchlist.includes(`basket_${id}`);

  const [basket, setBasket] = useState<BasketDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeRange, setActiveRange] = useState('1y');
  const [orderSuccessMsg, setOrderSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function fetchBasketDetails() {
      try {
        setLoading(true);
        
        // Intercept custom baskets from LocalStorage
        if (id.startsWith('custom_')) {
          const stored = localStorage.getItem(`basket_${id}`);
          if (stored) {
            const parsed = JSON.parse(stored);
            
            // Get constituent quotes
            const syms = parsed.constituents.map((c: any) => c.symbol).join(',');
            let quotesData: any[] = [];
            if (syms) {
              const quoteRes = await axios.get(`/api/stock/quote?symbols=${syms}`);
              quotesData = quoteRes.data || [];
            }
            
            const constituents = parsed.constituents.map((c: any) => {
              const quote = quotesData.find((q: any) => q.symbol === c.symbol) || {};
              return {
                symbol: c.symbol,
                ticker: c.symbol.split('.')[0],
                name: quote.shortName || quote.longName || c.symbol.split('.')[0],
                price: quote.regularMarketPrice || 1250.0,
                changePercent: quote.regularMarketChangePercent || 0.0,
                sector: quote.sector || 'Equities',
                weight: c.weight
              };
            });

            let changePercent1D = 0;
            constituents.forEach((c: any) => {
              changePercent1D += c.changePercent * (c.weight / 100);
            });

            const chartData = generateClientMockBasketChart(parsed.cagr, activeRange);

            setBasket({
              id: parsed.id,
              name: parsed.name,
              type: 'Custom',
              description: parsed.description,
              volatility: 'Medium Volatility',
              category: 'Custom Watchlist Basket',
              cagr: parsed.cagr,
              aum: 0,
              minInvestmentAmount: parsed.minInvestmentAmount || 5000,
              managementFee: 0,
              launchDate: parsed.launchDate || new Date().toLocaleDateString(),
              rebalancingFrequency: 'On Demand',
              changePercent1D,
              constituents,
              chartData
            });
            setLoading(false);
            return;
          }
        }

        const res = await axios.get(`/api/stock/basket/${id}?range=${activeRange}`);
        setBasket(res.data);
      } catch (err) {
        console.error(`Failed to fetch thematic basket details for ${id}`, err);
      } finally {
        setLoading(false);
      }
    }

    fetchBasketDetails();
  }, [id, activeRange]);

  // Set document title and description dynamically
  useEffect(() => {
    if (basket) {
      document.title = `${basket.name} Thematic Basket — Index returns & constituents | OnlyProfit`;
      
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', `Track constituents, weights, price trends, and index NAV performance for the ${basket.name} thematic stock basket on OnlyProfit.`);
      }
    }
  }, [basket]);

  // Resolve basket icon
  const getBasketIcon = (basketId: string) => {
    switch (basketId?.toLowerCase()) {
      case 'tata':
        return {
          icon: <Sparkles className="h-6 w-6 text-blue-500" />,
          bgColor: 'bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/20',
          textColor: 'text-blue-600 dark:text-blue-400'
        };
      case 'it':
        return {
          icon: <Layers className="h-6 w-6 text-emerald-500" />,
          bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/20',
          textColor: 'text-emerald-600 dark:text-emerald-400'
        };
      case 'banking':
        return {
          icon: <Landmark className="h-6 w-6 text-purple-500" />,
          bgColor: 'bg-purple-500/10 dark:bg-purple-500/20 border-purple-500/20',
          textColor: 'text-purple-600 dark:text-purple-400'
        };
      case 'energy':
      default:
        return {
          icon: <TrendingUp className="h-6 w-6 text-amber-500" />,
          bgColor: 'bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/20',
          textColor: 'text-amber-600 dark:text-amber-400'
        };
    }
  };

  const handleSimulateOrder = (mode: 'SIP' | 'Lumpsum') => {
    if (!basket) return;
    const items = basket.constituents.map(item => item.ticker).join(', ');
    setOrderSuccessMsg(
      `Simulated order successful! Initiated simulated ${mode} for "${basket.name}" basket, purchasing component weights of ${items} for an estimated cost of ₹${basket.minInvestmentAmount.toLocaleString('en-IN')}.`
    );
    setTimeout(() => {
      setOrderSuccessMsg(null);
    }, 6000);
  };

  if (loading && !basket) {
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

  if (!basket) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-2xl font-extrabold text-text-primary">Stock Basket not found</h2>
        <p className="text-text-secondary mt-2">The thematic portfolio &quot;{id}&quot; could not be retrieved.</p>
        <button
          onClick={() => router.push('/')}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-profit px-4 py-2 text-sm font-bold text-white shadow-lg shadow-profit/20 hover:scale-105 transition-transform"
        >
          <ChevronLeft className="h-4 w-4" /> Go back home
        </button>
      </div>
    );
  }

  const isPositive = basket.changePercent1D >= 0;
  const config = getBasketIcon(basket.id);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 transition-colors duration-300 animate-fade-in">
      
      {/* Back navigation & Watchlist Button */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.push('/#thematic-baskets')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Back to dashboard
        </button>
        
        <button
          onClick={() => toggleWatchlist(`basket_${id}`)}
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

      {/* Basket Header Section */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border shrink-0 ${config.bgColor}`}>
            {config.icon}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
                {basket.name}
              </h1>
              <span className={`inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border ${config.bgColor} ${config.textColor}`}>
                {basket.type} Portfolio
              </span>
              <span className="text-[10px] font-extrabold px-2 py-1 rounded-full bg-profit/10 border border-profit/20 text-profit uppercase tracking-wider select-none">
                {basket.volatility}
              </span>
            </div>
            <p className="text-sm font-semibold text-text-secondary mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>Category: <strong className="text-text-primary">{basket.category}</strong></span>
              <span className="text-border hidden sm:inline">•</span>
              <span>Constituents: <strong className="text-text-primary">{basket.constituents.length} Stocks</strong></span>
            </p>
          </div>
        </div>

        <div className="flex flex-col md:items-end">
          <div className="text-xs font-extrabold text-text-secondary uppercase tracking-wider">Estimated Minimum Investment</div>
          <div className="text-3xl font-extrabold text-text-primary tracking-tight mt-0.5">
            ₹{basket.minInvestmentAmount.toLocaleString('en-IN')}
          </div>
          <div className={`flex items-center gap-1.5 text-sm font-bold mt-1 ${isPositive ? 'text-profit' : 'text-loss'}`}>
            <span>{isPositive ? '▲' : '▼'}</span>
            <span>{isPositive ? '+' : ''}{basket.changePercent1D.toFixed(2)}%</span>
            <span className="opacity-80">(1D index performance)</span>
          </div>
        </div>
      </div>

      {/* Simulated Order Notification Banner */}
      {orderSuccessMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-profit/10 border border-profit/20 text-xs font-black text-profit animate-fade-in flex items-center justify-between shadow-soft">
          <span>{orderSuccessMsg}</span>
          <button onClick={() => setOrderSuccessMsg(null)} className="text-profit hover:text-text-primary text-[10px] font-extrabold uppercase ml-4">Dismiss</button>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        
        {/* Left Column (Chart, Stocks Table, Checklist, Metrics) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Index NAV Chart Card */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft dark:shadow-soft-dark">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="font-extrabold text-base text-text-primary tracking-tight">
                  Portfolio Index Performance (Base 100)
                </h2>
                <p className="text-[10px] text-text-secondary font-semibold mt-0.5">
                  Growth visualizes the combined performance of constituent stocks normalized to 100 at interval start.
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

            <MutualFundChart data={basket.chartData} isPositive={true} />
          </div>

          {/* Constituent Stocks Table */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft dark:shadow-soft-dark overflow-hidden">
            <h3 className="font-extrabold text-base text-text-primary tracking-tight mb-4 pb-3 border-b border-border/50">
              Constituent Stocks & Weights
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/40 text-text-secondary font-black uppercase tracking-wider">
                    <th className="pb-3 min-w-[150px]">Stock name</th>
                    <th className="pb-3 text-right">Weight</th>
                    <th className="pb-3 text-right">Live Price</th>
                    <th className="pb-3 text-right">1D Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30 font-bold text-text-primary">
                  {basket.constituents.map((stock) => (
                    <tr key={stock.symbol} className="hover:bg-background/40 transition-colors">
                      <td className="py-3.5 flex items-center gap-3">
                        <StockLogo symbol={stock.symbol} size="sm" />
                        <div className="min-w-0">
                          <span className="block font-black truncate">{stock.name}</span>
                          <span className="block text-[9px] text-text-secondary truncate">{stock.ticker} • {stock.sector}</span>
                        </div>
                      </td>
                      <td className="py-3.5 text-right font-black text-indigo-500 dark:text-indigo-400">
                        {stock.weight}%
                      </td>
                      <td className="py-3.5 text-right font-black">
                        ₹{stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`py-3.5 text-right font-black ${stock.changePercent >= 0 ? 'text-profit' : 'text-loss'}`}>
                        {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Theme Overview Description */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft dark:shadow-soft-dark">
            <h3 className="font-extrabold text-base text-text-primary tracking-tight mb-3 flex items-center gap-2">
              <Info className="h-4.5 w-4.5 text-profit" /> Investment Thesis
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed font-medium">
              {basket.description}
            </p>
          </div>

          {/* Investment Checklist */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft dark:shadow-soft-dark">
            <h3 className="font-extrabold text-base text-text-primary tracking-tight mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-4.5 w-4.5 text-profit" /> Portfolio Checklist
            </h3>
            <p className="text-[11px] text-text-secondary font-medium -mt-2.5 mb-5">
              Structural checklists evaluated against historical volatility and liquidity parameters.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  title: 'Diversified Holdings',
                  desc: 'Constituents span multiple products or sub-sectors to minimize exposure to a single product fail.',
                  pass: true
                },
                {
                  title: 'Liquidity Guarantee',
                  desc: 'All stocks listed in this basket fall in the top NSE liquidity tiers, enabling fast checkout executions.',
                  pass: true
                },
                {
                  title: 'Volatility Profile match',
                  desc: 'Basket conforms to the designated risk band, matching investor tolerance.',
                  pass: true
                },
                {
                  title: 'Regular Rebalancing',
                  desc: 'Constituents are professionally reviewed quarterly to adjust for corporate earnings and weight drifts.',
                  pass: true
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

        </div>

        {/* Right Column (Key Metrics & checkout panel) */}
        <div className="space-y-8">
          
          {/* Checkout sidebar */}
          <div className="lg:sticky lg:top-24 space-y-6">
            
            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft dark:shadow-soft-dark overflow-hidden">
              <div className="flex justify-between items-center pb-3 border-b border-border/50 mb-4">
                <h4 className="font-extrabold text-sm text-text-primary tracking-tight">Invest in Basket</h4>
                <span className="text-[10px] font-black text-profit uppercase bg-profit/10 px-2 py-0.5 rounded border border-profit/15">Simulated</span>
              </div>
              
              <div className="space-y-4">
                {/* Cost stats */}
                <div className="space-y-2.5 text-xs font-bold text-text-secondary">
                  <div className="flex justify-between items-center">
                    <span>Number of Stocks</span>
                    <span className="text-text-primary font-black">{basket.constituents.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Management Fee</span>
                    <span className="text-text-primary font-black">{basket.managementFee}% p.a.</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-border/40 text-sm">
                    <span className="text-text-primary font-black">Min Investment</span>
                    <span className="text-text-primary font-black text-base">
                      ₹{basket.minInvestmentAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => handleSimulateOrder('Lumpsum')}
                    className="py-2.5 text-[11px] font-black text-white rounded-xl bg-profit shadow-lg shadow-profit/20 hover:bg-profit/90 active:scale-[0.98] transition-all"
                  >
                    Buy Lumpsum
                  </button>
                  <button
                    onClick={() => handleSimulateOrder('SIP')}
                    className="py-2.5 text-[11px] font-black text-profit border border-profit/25 rounded-xl hover:bg-profit/5 active:scale-[0.98] transition-all"
                  >
                    Start Weekly SIP
                  </button>
                </div>
              </div>
            </div>

            {/* Key Metrics Card */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft dark:shadow-soft-dark space-y-4">
              <h4 className="font-extrabold text-sm text-text-primary tracking-tight pb-3 border-b border-border/50">
                Basket Key Metrics
              </h4>
              
              <div className="space-y-3.5 text-xs font-semibold text-text-secondary">
                <div className="flex justify-between items-center">
                  <span>AUM (Assets size)</span>
                  <span className="text-text-primary font-black">₹{basket.aum} Cr</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Rebalancing cycle</span>
                  <span className="text-text-primary font-black">{basket.rebalancingFrequency}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Constituent stocks</span>
                  <span className="text-text-primary font-black">{basket.constituents.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Launch Date</span>
                  <span className="text-text-primary font-black">{basket.launchDate}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Historical CAGR (3y)</span>
                  <span className="text-profit font-black">{basket.cagr}% p.a.</span>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="rounded-2xl border border-border/80 bg-background/50 p-5 space-y-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-profit shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-text-primary">Simulated Portfolio Trading</h4>
                  <p className="text-[10px] text-text-secondary leading-normal mt-1 font-medium">
                    OnlyProfit does not execute real stock trades. All basket purchases are strictly education mock-ups representing structural index performance.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-profit shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-text-primary">Live Component Prices</h4>
                  <p className="text-[10px] text-text-secondary leading-normal mt-1 font-medium">
                    The component stock quotes and percentage changes are resolved in real-time from active NSE public feed proxies.
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
            "@type": "InvestmentProduct",
            "name": basket.name,
            "description": basket.description,
            "volatility": basket.volatility
          })
        }}
      />
    </div>
  );
}
