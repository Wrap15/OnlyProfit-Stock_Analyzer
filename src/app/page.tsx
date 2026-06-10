'use client';

import React, { useState, useEffect } from 'react';
import { useStockStore } from '@/store/useStockStore';
import StockCard from '@/components/StockCard';
import StockLogo from '@/components/StockLogo';
import { apiClient as axios } from '@/lib/apiClient';
import MutualFundCard from '@/components/MutualFundCard';
import ThematicBaskets from '@/components/ThematicBaskets';
import { 
  ArrowUpRight, ArrowDownRight, Star, Sparkles, LayoutGrid, Search, BookOpen, Activity,
  Landmark, Cpu, Cookie, Car, Flame, Wrench, Layers, HeartPulse, PhoneCall, Bolt
} from 'lucide-react';
import Link from 'next/link';
import { MUTUAL_FUNDS } from '@/lib/mutualfunds';
import { mapToStandardSector, MOCK_STOCK_INFO } from '@/lib/yahooFinance';
import { isIndianMarketOpen } from '@/lib/marketHours';

interface MarketGainerLoser {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
}

const MONITOR_SYMBOLS = [
  // Financials (20)
  'HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'KOTAKBANK.NS', 'AXISBANK.NS',
  'BAJFINANCE.NS', 'BAJAJFINSV.NS', 'HDFCLIFE.NS', 'SBILIFE.NS', 'LICHSGFIN.NS',
  'PFC.NS', 'RECLTD.NS', 'MUTHOOTFIN.NS', 'CHOLAFIN.NS', 'SHRIRAMFIN.NS',
  'BANDHANBNK.NS', 'IDFCFIRSTB.NS', 'INDUSINDBK.NS', 'PNB.NS', 'BOB.NS',

  // IT (20)
  'TCS.NS', 'INFY.NS', 'WIPRO.NS', 'HCLTECH.NS', 'TECHM.NS',
  'HAPPSTMNDS.NS', 'LTTS.NS', 'PERSISTENT.NS', 'COFORGE.NS', 'MPHASIS.NS',
  'KPITTECH.NS', 'TATAELXSI.NS', 'CYIENT.NS', 'SONATSOFTW.NS', 'ZENSARTECH.NS',
  'OFSS.NS', 'BSOFT.NS', 'NAUKRI.NS', 'AFFLE.NS', 'FSL.NS',

  // Staples (20)
  'HINDUNILVR.NS', 'ITC.NS', 'NESTLEIND.NS', 'BRITANNIA.NS', 'DABUR.NS',
  'GODREJCP.NS', 'COLPAL.NS', 'MARICO.NS', 'TATACONSUM.NS', 'VBL.NS',
  'UBL.NS', 'UNITDSPR.NS', 'BALRAMCHIN.NS', 'KRBL.NS', 'LTFOODS.NS',
  'HERITGFOOD.NS', 'AVANTIFEED.NS', 'EMAMILTD.NS', 'JYOTHYLAB.NS', 'HATSUN.NS',

  // Discretionary (20)
  'MARUTI.NS', 'TMPV.NS', 'TMCV.NS', 'M&M.NS', 'EICHERMOT.NS',
  'HEROMOTOCO.NS', 'BAJAJ-AUTO.NS', 'TITAN.NS', 'TRENT.NS', 'DMART.NS',
  'PAGEIND.NS', 'BATAINDIA.NS', 'RELAXO.NS', 'KALYANKJIL.NS', 'ABFRL.NS',
  'DEVYANI.NS', 'JUBLFOOD.NS', 'WESTLIFE.NS', 'VIPIND.NS', 'RAYMOND.NS',

  // Energy (20)
  'RELIANCE.NS', 'ONGC.NS', 'IOC.NS', 'BPCL.NS', 'HPCL.NS',
  'OIL.NS', 'COALINDIA.NS', 'ADANIGREEN.NS', 'ADANIENSOL.NS', 'MRPL.NS',
  'CHENNPETRO.NS', 'PETRONET.NS', 'GSPL.NS', 'GAIL.NS', 'MGL.NS',
  'IGL.NS', 'PANAMAPET.NS', 'ATGL.NS', 'CASTROLIND.NS', 'AEGISLOG.NS',

  // Industrials (20)
  'LT.NS', 'RVNL.NS', 'BHEL.NS', 'IRCTC.NS', 'IRFC.NS',
  'CONCOR.NS', 'BEL.NS', 'HAL.NS', 'GMRAIRPORT.NS', 'IRCON.NS',
  'HEG.NS', 'GRAPHITE.NS', 'CUMMINSIND.NS', 'ABB.NS', 'SIEMENS.NS',
  'THERMAX.NS', 'VOLTAS.NS', 'BLUESTARCO.NS', 'KEC.NS', 'ENGINERSIN.NS',

  // Materials (20)
  'TATASTEEL.NS', 'JSWSTEEL.NS', 'HINDALCO.NS', 'GRASIM.NS', 'AMBUJACEM.NS',
  'ULTRACEMCO.NS', 'ACC.NS', 'SHREECEM.NS', 'JKCEMENT.NS', 'RAMCOCEM.NS',
  'SAIL.NS', 'JINDALSTEL.NS', 'NMDC.NS', 'NATIONALUM.NS', 'ASIANPAINT.NS',
  'BERGEPAINT.NS', 'KANSAINER.NS', 'PIDILITIND.NS', 'SRF.NS', 'DEEPAKNTR.NS',

  // Health Care (20)
  'SUNPHARMA.NS', 'CIPLA.NS', 'DIVISLAB.NS', 'APOLLOHOSP.NS', 'DRREDDY.NS',
  'LUPIN.NS', 'AUROPHARMA.NS', 'BIOCON.NS', 'GLAND.NS', 'IPCALAB.NS',
  'LAURUSLABS.NS', 'MAXHEALTH.NS', 'FORTIS.NS', 'SYNGENE.NS', 'METROPOLIS.NS',
  'LALPATHLAB.NS', 'TORNTPHARM.NS', 'ALKEM.NS', 'ZYDUSLIFE.NS', 'GLAXO.NS',

  // Communication (20)
  'BHARTIARTL.NS', 'IDEA.NS', 'TATACOMM.NS', 'ZEEL.NS', 'SUNTV.NS',
  'PVRINOX.NS', 'NETWORK18.NS', 'HATHWAY.NS', 'DEN.NS', 'SAREGAMA.NS',
  'TIPSMUSIC.NS', 'DISHTV.NS', 'MTNL.NS', 'ROUTE.NS', 'TANLA.NS',
  'ZEEMEDIA.NS', 'DBCORP.NS', 'JAGRAN.NS', 'ENIL.NS', 'TVTODAY.NS',

  // Utilities (20)
  'NTPC.NS', 'TATAPOWER.NS', 'POWERGRID.NS', 'ADANIPOWER.NS', 'TORNTPOWER.NS',
  'CESC.NS', 'NLCINDIA.NS', 'JPPOWER.NS', 'RTNPOWER.NS', 'GIPCL.NS',
  'SJVN.NS', 'NHPC.NS', 'WABAG.NS', 'JSWENERGY.NS', 'KPIGREEN.NS',
  'PTC.NS', 'GUJGASLTD.NS', 'GENUSPOWER.NS', 'SWSOLAR.NS', 'BFUTILITIE.NS'
];

// Market Cap Classifications
const LARGE_CAP_SYMBOLS = [
  'HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'KOTAKBANK.NS', 'AXISBANK.NS',
  'BAJFINANCE.NS', 'BAJAJFINSV.NS', 'HDFCLIFE.NS', 'SBILIFE.NS', 'SHRIRAMFIN.NS',
  'TCS.NS', 'INFY.NS', 'WIPRO.NS', 'HCLTECH.NS', 'TECHM.NS', 'OFSS.NS',
  'HINDUNILVR.NS', 'ITC.NS', 'NESTLEIND.NS', 'BRITANNIA.NS', 'VBL.NS',
  'TATACONSUM.NS', 'GODREJCP.NS', 'MARUTI.NS', 'M&M.NS', 'TITAN.NS',
  'TRENT.NS', 'DMART.NS', 'EICHERMOT.NS', 'HEROMOTOCO.NS', 'BAJAJ-AUTO.NS',
  'RELIANCE.NS', 'ONGC.NS', 'IOC.NS', 'BPCL.NS', 'HPCL.NS', 'COALINDIA.NS',
  'ADANIGREEN.NS', 'ADANIENSOL.NS', 'ATGL.NS', 'LT.NS', 'BEL.NS', 'HAL.NS',
  'CONCOR.NS', 'ABB.NS', 'SIEMENS.NS', 'TATASTEEL.NS', 'JSWSTEEL.NS',
  'HINDALCO.NS', 'GRASIM.NS', 'ULTRACEMCO.NS', 'ASIANPAINT.NS', 'PIDILITIND.NS',
  'SHREECEM.NS', 'SUNPHARMA.NS', 'DRREDDY.NS', 'CIPLA.NS', 'DIVISLAB.NS',
  'APOLLOHOSP.NS', 'MAXHEALTH.NS', 'TORNTPHARM.NS', 'BHARTIARTL.NS', 'TATACOMM.NS',
  'NTPC.NS', 'POWERGRID.NS', 'TATAPOWER.NS', 'ADANIPOWER.NS', 'TORNTPOWER.NS',
  'JSWENERGY.NS', 'SWSOLAR.NS'
];

const MID_CAP_SYMBOLS = [
  'PFC.NS', 'RECLTD.NS', 'MUTHOOTFIN.NS', 'CHOLAFIN.NS', 'BANDHANBNK.NS',
  'INDUSINDBK.NS', 'PNB.NS', 'BOB.NS', 'LTTS.NS', 'PERSISTENT.NS',
  'COFORGE.NS', 'MPHASIS.NS', 'KPITTECH.NS', 'TATAELXSI.NS', 'BSOFT.NS',
  'NAUKRI.NS', 'DABUR.NS', 'MARICO.NS', 'COLPAL.NS', 'UBL.NS', 'UNITDSPR.NS',
  'EMAMILTD.NS', 'TMPV.NS', 'TMCV.NS', 'PAGEIND.NS', 'BATAINDIA.NS',
  'KALYANKJIL.NS', 'ABFRL.NS', 'JUBLFOOD.NS', 'OIL.NS', 'MRPL.NS',
  'PETRONET.NS', 'GSPL.NS', 'GAIL.NS', 'MGL.NS', 'IGL.NS', 'RVNL.NS',
  'BHEL.NS', 'IRCTC.NS', 'IRFC.NS', 'CUMMINSIND.NS', 'VOLTAS.NS',
  'GMRAIRPORT.NS', 'AMBUJACEM.NS', 'ACC.NS', 'JKCEMENT.NS', 'RAMCOCEM.NS',
  'SAIL.NS', 'JINDALSTEL.NS', 'NMDC.NS', 'SRF.NS', 'DEEPAKNTR.NS',
  'LUPIN.NS', 'AUROPHARMA.NS', 'BIOCON.NS', 'IPCALAB.NS', 'FORTIS.NS',
  'SYNGENE.NS', 'ZYDUSLIFE.NS', 'ALKEM.NS', 'IDEA.NS', 'ZEEL.NS',
  'SUNTV.NS', 'PVRINOX.NS', 'NETWORK18.NS', 'ROUTE.NS', 'TANLA.NS',
  'CESC.NS', 'NLCINDIA.NS', 'KPIGREEN.NS'
];

const SMALL_CAP_SYMBOLS = [
  'LICHSGFIN.NS', 'IDFCFIRSTB.NS', 'CYIENT.NS', 'SONATSOFTW.NS', 'ZENSARTECH.NS',
  'AFFLE.NS', 'FSL.NS', 'HAPPSTMNDS.NS', 'BALRAMCHIN.NS', 'KRBL.NS',
  'LTFOODS.NS', 'HERITGFOOD.NS', 'AVANTIFEED.NS', 'JYOTHYLAB.NS', 'HATSUN.NS',
  'RELAXO.NS', 'DEVYANI.NS', 'WESTLIFE.NS', 'VIPIND.NS', 'RAYMOND.NS',
  'CHENNPETRO.NS', 'CASTROLIND.NS', 'AEGISLOG.NS', 'PANAMAPET.NS', 'IRCON.NS',
  'HEG.NS', 'GRAPHITE.NS', 'THERMAX.NS', 'BLUESTARCO.NS', 'KEC.NS',
  'ENGINERSIN.NS', 'NATIONALUM.NS', 'BERGEPAINT.NS', 'KANSAINER.NS', 'GLAND.NS',
  'LAURUSLABS.NS', 'METROPOLIS.NS', 'LALPATHLAB.NS', 'GLAXO.NS', 'HATHWAY.NS',
  'DEN.NS', 'SAREGAMA.NS', 'TIPSMUSIC.NS', 'DISHTV.NS', 'MTNL.NS',
  'ZEEMEDIA.NS', 'DBCORP.NS', 'JAGRAN.NS', 'ENIL.NS', 'TVTODAY.NS',
  'JPPOWER.NS', 'RTNPOWER.NS', 'GIPCL.NS', 'SJVN.NS', 'NHPC.NS',
  'WABAG.NS', 'PTC.NS', 'GUJGASLTD.NS', 'GENUSPOWER.NS', 'BFUTILITIE.NS'
];

const SECTOR_ICONS: Record<string, React.ComponentType<any>> = {
  'Financials': Landmark,
  'Information Technology': Cpu,
  'Consumer Staples': Cookie,
  'Consumer Discretionary': Car,
  'Energy': Flame,
  'Industrials': Wrench,
  'Materials': Layers,
  'Health Care': HeartPulse,
  'Communication Services': PhoneCall,
  'Utilities': Bolt
};


const TRENDING_SYMBOLS = ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'TRENT.NS', 'HDFCBANK.NS', 'SBIN.NS', 'TMPV.NS', 'TMCV.NS', 'HAL.NS'];
const MOST_SEARCHED_SYMBOLS = ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'TRENT.NS', 'IRCTC.NS', 'RVNL.NS', 'SUNPHARMA.NS'];

// Tickertape-style Curated Collections
const BLUE_CHIP_SYMBOLS = ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'LT.NS', 'ITC.NS', 'HINDUNILVR.NS', 'KOTAKBANK.NS'];
const HIGH_GROWTH_SYMBOLS = ['TRENT.NS', 'HAL.NS', 'RVNL.NS', 'MARUTI.NS', 'M&M.NS', 'KPIGREEN.NS'];
const DIVIDEND_SYMBOLS = ['IOC.NS', 'BPCL.NS', 'ONGC.NS', 'POWERGRID.NS', 'ITC.NS', 'TATASTEEL.NS'];
const DEBT_FREE_SYMBOLS = ['TCS.NS', 'INFY.NS', 'WIPRO.NS', 'HCLTECH.NS', 'ITC.NS', 'NESTLEIND.NS', 'DIVISLAB.NS'];

type TabType = 'watchlist' | 'trending' | 'mostsearched' | 'explore';

export default function Home() {
  const { watchlist, recentSearches, clearRecentSearches } = useStockStore();
  const [marketQuotes, setMarketQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('trending');
  const [searchFilter, setSearchFilter] = useState('');
  const [activeCollection, setActiveCollection] = useState<'all' | 'bluechip' | 'growth' | 'dividend' | 'debtfree'>('all');
  const [exploreSymbols, setExploreSymbols] = useState<string[]>(MONITOR_SYMBOLS);
  const [exploreLoading, setExploreLoading] = useState(false);

  // Market cap states for movers lists
  const [gainersCap, setGainersCap] = useState<'all' | 'large' | 'mid' | 'small'>('all');
  const [losersCap, setLosersCap] = useState<'all' | 'large' | 'mid' | 'small'>('all');
  const [activeCap, setActiveCap] = useState<'all' | 'large' | 'mid' | 'small'>('all');

  // Mutual Funds States
  const [activeMFCategory, setActiveMFCategory] = useState<string>('all');
  const [mutualFunds, setMutualFunds] = useState<any[]>([]);
  const [mfLoading, setMFLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchMutualFunds() {
      try {
        setMFLoading(true);
        const url = activeMFCategory === 'all'
          ? '/api/stock/mutualfund'
          : `/api/stock/mutualfund?category=${activeMFCategory}`;
        const res = await axios.get(url);
        setMutualFunds(res.data || []);
      } catch (err) {
        console.error('Failed to fetch mutual funds', err);
      } finally {
        setMFLoading(false);
      }
    }
    fetchMutualFunds();
  }, [activeMFCategory]);

  useEffect(() => {
    async function fetchMarketData() {
      try {
        const symbolsParam = MONITOR_SYMBOLS.join(',');
        const res = await axios.get(`/api/stock/quote?symbols=${symbolsParam}`);
        setMarketQuotes(res.data || []);
      } catch (err) {
        console.error('Failed to fetch market metrics', err);
      } finally {
        setLoading(false);
      }
    }

    fetchMarketData();

    // Poll for fresh market quotes every 15 seconds during market hours
    const pollInterval = setInterval(() => {
      if (isIndianMarketOpen()) {
        fetchMarketData();
      }
    }, 15000);

    return () => clearInterval(pollInterval);
  }, []);

  const hasQuotes = marketQuotes.length > 0;

  // Real-time stock price micro-fluctuations (every 2.5 seconds)
  useEffect(() => {
    if (loading || !hasQuotes) return;

    const interval = setInterval(() => {
      // Do not fluctuate prices client-side when the market is closed
      if (!isIndianMarketOpen()) return;

      setMarketQuotes(prev => {
        if (prev.length === 0) return prev;
        return prev.map(q => {
          if (q.symbol.startsWith('^')) return q; // Skip index tickers
          
          const prevClose = q.regularMarketPrice - q.regularMarketChange;
          // Small change percentage (between -0.04% and +0.04%)
          const pct = (Math.random() - 0.495) * 0.0008; 
          const newPrice = q.regularMarketPrice * (1 + pct);
          const newChange = newPrice - prevClose;
          const newChangePercent = prevClose > 0 ? (newChange / prevClose) * 100 : 0;

          return {
            ...q,
            regularMarketPrice: parseFloat(newPrice.toFixed(2)),
            regularMarketChange: parseFloat(newChange.toFixed(2)),
            regularMarketChangePercent: parseFloat(newChangePercent.toFixed(2))
          };
        });
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [loading, hasQuotes]);

  // Compute gainers & losers with cap filtering
  const sortedQuotes = [...marketQuotes].sort((a, b) => b.regularMarketChangePercent - a.regularMarketChangePercent);
  
  const filteredGainersQuotes = sortedQuotes.filter(q => {
    if (q.symbol.startsWith('^')) return false;
    if (gainersCap === 'large') return LARGE_CAP_SYMBOLS.includes(q.symbol);
    if (gainersCap === 'mid') return MID_CAP_SYMBOLS.includes(q.symbol);
    if (gainersCap === 'small') return SMALL_CAP_SYMBOLS.includes(q.symbol);
    return true;
  });
  const gainers: MarketGainerLoser[] = filteredGainersQuotes.slice(0, 5).map(q => ({
    symbol: q.symbol,
    name: q.shortName,
    price: q.regularMarketPrice,
    changePercent: q.regularMarketChangePercent
  }));
  
  const filteredLosersQuotes = sortedQuotes
    .filter(q => !q.symbol.startsWith('^'))
    .filter(q => {
      if (losersCap === 'large') return LARGE_CAP_SYMBOLS.includes(q.symbol);
      if (losersCap === 'mid') return MID_CAP_SYMBOLS.includes(q.symbol);
      if (losersCap === 'small') return SMALL_CAP_SYMBOLS.includes(q.symbol);
      return true;
    });
  const losers: MarketGainerLoser[] = filteredLosersQuotes
    .slice(-5)
    .reverse()
    .map(q => ({
      symbol: q.symbol,
      name: q.shortName,
      price: q.regularMarketPrice,
      changePercent: q.regularMarketChangePercent
    }));

  // Compute most active stocks by trading volume
  const filteredActiveQuotes = [...marketQuotes]
    .filter(q => !q.symbol.startsWith('^'))
    .filter(q => {
      if (activeCap === 'large') return LARGE_CAP_SYMBOLS.includes(q.symbol);
      if (activeCap === 'mid') return MID_CAP_SYMBOLS.includes(q.symbol);
      if (activeCap === 'small') return SMALL_CAP_SYMBOLS.includes(q.symbol);
      return true;
    })
    .sort((a, b) => b.regularMarketVolume - a.regularMarketVolume);
  const mostActive = filteredActiveQuotes.slice(0, 5).map(q => ({
    symbol: q.symbol,
    name: q.shortName,
    price: q.regularMarketPrice,
    changePercent: q.regularMarketChangePercent,
    volume: q.regularMarketVolume
  }));



  const formatVolume = (num: number) => {
    if (!num) return '0';
    if (num >= 10000000) { // 1 Crore
      return `${(num / 10000000).toFixed(2)} Cr`;
    } else if (num >= 100000) { // 1 Lakh
      return `${(num / 100000).toFixed(2)} L`;
    }
    return num.toLocaleString('en-IN');
  };

  // Handle explore list updates based on filter or dynamic global Search
  useEffect(() => {
    if (activeTab !== 'explore') return;

    if (!searchFilter.trim()) {
      const filtered = MONITOR_SYMBOLS.filter(sym => {
        if (activeCollection === 'bluechip' && !BLUE_CHIP_SYMBOLS.includes(sym)) return false;
        if (activeCollection === 'growth' && !HIGH_GROWTH_SYMBOLS.includes(sym)) return false;
        if (activeCollection === 'dividend' && !DIVIDEND_SYMBOLS.includes(sym)) return false;
        if (activeCollection === 'debtfree' && !DEBT_FREE_SYMBOLS.includes(sym)) return false;
        return true;
      });
      setExploreSymbols(filtered);
      return;
    }

    // Check if the search filter is exactly one of the standard sectors
    const isSectorFilter = Object.keys(SECTOR_ICONS).some(
      s => s.toLowerCase() === searchFilter.toLowerCase()
    );

    if (isSectorFilter) {
      const filtered = MONITOR_SYMBOLS.filter(sym => {
        const customMeta = MOCK_STOCK_INFO[sym] || {};
        const sector = customMeta.sector || 'Financial Services';
        return mapToStandardSector(sector).toLowerCase() === searchFilter.toLowerCase();
      });
      setExploreSymbols(filtered);
      return;
    }

    setExploreLoading(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await axios.get(`/api/stock/search?q=${encodeURIComponent(searchFilter)}`);
        const searchResults: any[] = res.data || [];
        const symbols = searchResults.map(r => r.symbol);
        setExploreSymbols(symbols);
      } catch (err) {
        console.error('Explore dynamic search failed', err);
      } finally {
        setExploreLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchFilter, activeCollection, activeTab, marketQuotes]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-300">
      
      {/* Hero Header Section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary sm:text-4xl">
            OnlyProfit — <span className="text-profit">Smart Investing</span>
          </h1>
          <p className="mt-2 text-base text-text-secondary max-w-2xl font-medium">
            Real-time analytics, charts, and key performance metrics for NSE-listed Indian equities. 
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-text-secondary bg-card border border-border px-3 py-1.5 rounded-xl">
          <BookOpen className="h-4 w-4 text-profit" />
          <span>NSE Exchange Feed Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        
        {/* Left Column: Explorer Board (Grid Column Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Recently Viewed Panel */}
          {recentSearches && recentSearches.length > 0 && (
            <div className="bg-card border border-border p-4 rounded-2xl animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                  <Search className="h-3.5 w-3.5 text-profit animate-pulse" /> Recently Viewed
                </h3>
                <button 
                  onClick={clearRecentSearches}
                  className="text-[10px] font-bold text-text-secondary hover:text-loss transition-colors"
                >
                  Clear History
                </button>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {recentSearches.map((sym) => {
                  const isMf = /^\d+$/.test(sym);
                  const mf = isMf ? MUTUAL_FUNDS.find(f => f.code === sym) : null;
                  const displayName = mf ? mf.name.replace(' - Growth', '').replace(' Fund', '') : sym.split('.')[0];
                  const href = isMf ? `/mutualfund/${sym}` : `/stock/${sym}`;
                  return (
                    <Link 
                      key={sym} 
                      href={href}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-background border border-border hover:border-profit/30 hover:bg-card hover-lift transition-all"
                    >
                      <StockLogo symbol={sym} size="sm" name={displayName} />
                      <span className="text-xs font-bold text-text-primary">{displayName}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Custom Premium Capsule Tabs */}
          <div className="flex overflow-x-auto scrollbar-none max-w-full gap-2 p-1 bg-card border border-border/70 rounded-xl self-start">
            <button
              onClick={() => setActiveTab('trending')}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all duration-200 flex items-center gap-1.5 shrink-0 ${
                activeTab === 'trending'
                  ? 'bg-profit/10 text-profit border border-profit/20 shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-background border border-transparent'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" /> Trending
            </button>

            <button
              onClick={() => setActiveTab('mostsearched')}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all duration-200 flex items-center gap-1.5 shrink-0 ${
                activeTab === 'mostsearched'
                  ? 'bg-profit/10 text-profit border border-profit/20 shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-background border border-transparent'
              }`}
            >
              <Activity className="h-3.5 w-3.5" /> Most Searched
            </button>
            
            <button
              onClick={() => setActiveTab('watchlist')}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all duration-200 flex items-center gap-1.5 shrink-0 ${
                activeTab === 'watchlist'
                  ? 'bg-profit/10 text-profit border border-profit/20 shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-background border border-transparent'
              }`}
            >
              <Star className="h-3.5 w-3.5" /> My Watchlist
              <span className="ml-1 px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-background border border-border/80 text-text-secondary">
                {watchlist.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('explore')}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all duration-200 flex items-center gap-1.5 shrink-0 ${
                activeTab === 'explore'
                  ? 'bg-profit/10 text-profit border border-profit/20 shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-background border border-transparent'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> All NSE Stocks
              <span className="ml-1 px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-background border border-border/80 text-text-secondary">
                {MONITOR_SYMBOLS.length}
              </span>
            </button>
          </div>

          {/* TAB 1: TRENDING */}
          {activeTab === 'trending' && (
            <div className="grid grid-cols-1 gap-2.5 sm:gap-4 sm:grid-cols-2 animate-fade-in gpu-layer">
              {TRENDING_SYMBOLS.map((symbol) => {
                const quote = marketQuotes.find(q => q.symbol === symbol);
                return <StockCard key={symbol} symbol={symbol} initialQuote={quote} />;
              })}
            </div>
          )}

          {/* TAB 2: MOST SEARCHED */}
          {activeTab === 'mostsearched' && (
            <div className="grid grid-cols-1 gap-2.5 sm:gap-4 sm:grid-cols-2 animate-fade-in gpu-layer">
              {MOST_SEARCHED_SYMBOLS.map((symbol) => {
                const quote = marketQuotes.find(q => q.symbol === symbol);
                return <StockCard key={symbol} symbol={symbol} initialQuote={quote} />;
              })}
            </div>
          )}

          {/* TAB 3: WATCHLIST */}
          {activeTab === 'watchlist' && (
            <div className="animate-fade-in gpu-layer">
              {watchlist.length > 0 ? (
                <div className="grid grid-cols-1 gap-2.5 sm:gap-4 sm:grid-cols-2">
                  {watchlist.map((symbol) => {
                    const quote = marketQuotes.find(q => q.symbol === symbol);
                    return <StockCard key={symbol} symbol={symbol} initialQuote={quote} />;
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border p-12 bg-card/40 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-background border border-border text-text-secondary mb-4">
                    <Star className="h-5 w-5" />
                  </div>
                  <h3 className="font-extrabold text-sm text-text-primary">Watchlist is empty</h3>
                  <p className="mt-1 text-xs text-text-secondary max-w-xs font-medium">
                    Search for equities and click the star icon to populate your watchlist tracker.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EXPLORE ALL STOCKS */}
          {activeTab === 'explore' && (
            <div className="space-y-4 animate-fade-in gpu-layer">
              {/* Search and Curated Collections Pills */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative max-w-xs w-full">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-4 w-4 text-text-secondary" />
                  </div>
                  <input
                    id="explore-search-input"
                    type="text"
                    placeholder="Search explore list..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full h-9 pl-9 pr-4 rounded-xl border border-border bg-card text-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-profit/20 focus:border-profit transition-all duration-200"
                  />
                </div>

                <div className="flex overflow-x-auto scrollbar-none max-w-full gap-1.5 p-1 bg-card border border-border/70 rounded-xl">
                  {[
                    { id: 'all', label: 'All Stocks' },
                    { id: 'bluechip', label: 'Blue Chips' },
                    { id: 'growth', label: 'High Growth' },
                    { id: 'dividend', label: 'High Dividend' },
                    { id: 'debtfree', label: 'Debt Free' }
                  ].map((col) => (
                    <button
                      key={col.id}
                      onClick={() => setActiveCollection(col.id as any)}
                      className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black shrink-0 transition-all duration-200 ${
                        activeCollection === col.id
                          ? 'bg-profit/10 text-profit border border-profit/15 shadow-sm'
                          : 'text-text-secondary hover:text-text-primary hover:bg-background border border-transparent'
                      }`}
                    >
                      {col.label}
                    </button>
                  ))}
                </div>
              </div>

              {exploreLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-text-secondary">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-profit border-t-transparent" />
                  <span className="text-xs font-bold">Querying NSE/BSE exchange directory...</span>
                </div>
              ) : exploreSymbols.length > 0 ? (
                <div className="grid grid-cols-1 gap-2.5 sm:gap-4 sm:grid-cols-2">
                  {exploreSymbols.map((symbol) => {
                    const quote = marketQuotes.find(q => q.symbol === symbol);
                    return <StockCard key={symbol} symbol={symbol} initialQuote={quote} />;
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-sm text-text-secondary font-bold">
                  No stocks match &quot;{searchFilter}&quot;
                </div>
              )}
            </div>
          )}



        </div>

        {/* Right Column: Gainers, Losers & Most Active (Grid Column Span 1) */}
        <div className="space-y-6">
          
          {/* Top Gainers Card */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft dark:shadow-soft-dark">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-border/55">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-profit/10 text-profit">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
                <h3 className="font-extrabold text-sm text-text-primary tracking-tight">
                  Top Gainers
                </h3>
              </div>
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                NSE
              </span>
            </div>

            {/* Market Cap Filter Pills */}
            <div className="flex gap-1 mb-4 p-0.5 bg-background border border-border/60 rounded-xl overflow-x-auto scrollbar-none">
              {[
                { id: 'all', label: 'All' },
                { id: 'large', label: 'Large Cap' },
                { id: 'mid', label: 'Mid Cap' },
                { id: 'small', label: 'Small Cap' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setGainersCap(tab.id as any)}
                  className={`flex-1 py-1 rounded-lg text-[9px] font-extrabold tracking-tight shrink-0 transition-all duration-200 ${
                    gainersCap === tab.id
                      ? 'bg-card text-text-primary shadow-sm border border-border/60'
                      : 'text-text-secondary hover:text-text-primary border border-transparent'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="space-y-3 py-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex justify-between items-center p-1">
                    <div className="space-y-1.5 flex-1 max-w-[60%]">
                      <div className="h-3.5 w-16 animate-shimmer rounded" />
                      <div className="h-2.5 w-28 animate-shimmer rounded" />
                    </div>
                    <div className="flex flex-col items-end space-y-1.5 shrink-0">
                      <div className="h-3.5 w-16 animate-shimmer rounded" />
                      <div className="h-2.5 w-10 animate-shimmer rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : gainers.length > 0 ? (
              <div className="space-y-1 animate-fade-in">
                {gainers.map((stock) => (
                  <Link
                    key={stock.symbol}
                    href={`/stock/${stock.symbol}`}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-background transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <StockLogo symbol={stock.symbol} size="sm" />
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-text-primary group-hover:text-profit transition-colors truncate">
                          {stock.symbol.split('.')[0]}
                        </div>
                        <div className="text-[10px] text-text-secondary truncate max-w-[100px] font-medium">
                          {stock.name}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs font-bold text-text-primary">
                        ₹{stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] font-extrabold text-profit flex items-center gap-0.5 mt-0.5">
                        +{stock.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-text-secondary font-bold">
                No gainers found in this category
              </div>
            )}
          </div>

          {/* Top Losers Card */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft dark:shadow-soft-dark">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-border/55">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-loss/10 text-loss">
                  <ArrowDownRight className="h-4 w-4" />
                </div>
                <h3 className="font-extrabold text-sm text-text-primary tracking-tight">
                  Top Losers
                </h3>
              </div>
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                NSE
              </span>
            </div>

            {/* Market Cap Filter Pills */}
            <div className="flex gap-1 mb-4 p-0.5 bg-background border border-border/60 rounded-xl overflow-x-auto scrollbar-none">
              {[
                { id: 'all', label: 'All' },
                { id: 'large', label: 'Large Cap' },
                { id: 'mid', label: 'Mid Cap' },
                { id: 'small', label: 'Small Cap' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setLosersCap(tab.id as any)}
                  className={`flex-1 py-1 rounded-lg text-[9px] font-extrabold tracking-tight shrink-0 transition-all duration-200 ${
                    losersCap === tab.id
                      ? 'bg-card text-text-primary shadow-sm border border-border/60'
                      : 'text-text-secondary hover:text-text-primary border border-transparent'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="space-y-3 py-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex justify-between items-center p-1">
                    <div className="space-y-1.5 flex-1 max-w-[60%]">
                      <div className="h-3.5 w-16 animate-shimmer rounded" />
                      <div className="h-2.5 w-28 animate-shimmer rounded" />
                    </div>
                    <div className="flex flex-col items-end space-y-1.5 shrink-0">
                      <div className="h-3.5 w-16 animate-shimmer rounded" />
                      <div className="h-2.5 w-10 animate-shimmer rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : losers.length > 0 ? (
              <div className="space-y-1 animate-fade-in">
                {losers.map((stock) => (
                  <Link
                    key={stock.symbol}
                    href={`/stock/${stock.symbol}`}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-background transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <StockLogo symbol={stock.symbol} size="sm" />
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-text-primary group-hover:text-loss transition-colors truncate">
                          {stock.symbol.split('.')[0]}
                        </div>
                        <div className="text-[10px] text-text-secondary truncate max-w-[100px] font-medium">
                          {stock.name}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs font-bold text-text-primary">
                        ₹{stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] font-extrabold text-loss flex items-center gap-0.5 mt-0.5">
                        {stock.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-text-secondary font-bold">
                No losers found in this category
              </div>
            )}
          </div>

          {/* Most Active Stocks Card */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft dark:shadow-soft-dark">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-border/55">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
                  <Activity className="h-4 w-4" />
                </div>
                <h3 className="font-extrabold text-sm text-text-primary tracking-tight">
                  Most Active Stocks
                </h3>
              </div>
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                Volume
              </span>
            </div>

            {/* Market Cap Filter Pills */}
            <div className="flex gap-1 mb-4 p-0.5 bg-background border border-border/60 rounded-xl overflow-x-auto scrollbar-none">
              {[
                { id: 'all', label: 'All' },
                { id: 'large', label: 'Large Cap' },
                { id: 'mid', label: 'Mid Cap' },
                { id: 'small', label: 'Small Cap' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCap(tab.id as any)}
                  className={`flex-1 py-1 rounded-lg text-[9px] font-extrabold tracking-tight shrink-0 transition-all duration-200 ${
                    activeCap === tab.id
                      ? 'bg-card text-text-primary shadow-sm border border-border/60'
                      : 'text-text-secondary hover:text-text-primary border border-transparent'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="space-y-3 py-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex justify-between items-center p-1">
                    <div className="space-y-1.5 flex-1 max-w-[60%]">
                      <div className="h-3.5 w-16 animate-shimmer rounded" />
                      <div className="h-2.5 w-28 animate-shimmer rounded" />
                    </div>
                    <div className="flex flex-col items-end space-y-1.5 shrink-0">
                      <div className="h-3.5 w-16 animate-shimmer rounded" />
                      <div className="h-2.5 w-10 animate-shimmer rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : mostActive.length > 0 ? (
              <div className="space-y-1 animate-fade-in">
                {mostActive.map((stock) => {
                  const isStockPositive = stock.changePercent >= 0;
                  return (
                    <Link
                      key={stock.symbol}
                      href={`/stock/${stock.symbol}`}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-background transition-colors group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <StockLogo symbol={stock.symbol} size="sm" />
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-text-primary group-hover:text-profit transition-colors truncate">
                            {stock.symbol.split('.')[0]}
                          </div>
                          <div className="text-[10px] text-text-secondary truncate max-w-[100px] font-medium">
                            Vol: {formatVolume(stock.volume)}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-xs font-bold text-text-primary">
                          ₹{stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                        <span className={`text-[10px] font-extrabold flex items-center gap-0.5 mt-0.5 ${isStockPositive ? 'text-profit' : 'text-loss'}`}>
                          {isStockPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-text-secondary font-bold">
                No active stocks found in this category
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Mutual Funds Explorer Section */}
      <div id="mutual-funds" className="mt-12 pt-10 border-t border-border/60 space-y-6 animate-fade-in gpu-layer">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-text-primary tracking-tight">
              Simulated Mutual Funds
            </h2>
            <p className="text-xs text-text-secondary font-medium mt-1">
              Explore top direct-growth mutual funds in India categorized by asset class, with live NAV rates.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex overflow-x-auto scrollbar-none max-w-full gap-2 p-1 bg-card border border-border/70 rounded-xl self-start">
            {[
              { id: 'all', label: 'All Funds' },
              { id: 'smallcap', label: 'Small Cap' },
              { id: 'midcap', label: 'Mid Cap' },
              { id: 'flexicap', label: 'Flexi Cap' },
              { id: 'multicap', label: 'Multi Cap' },
              { id: 'index', label: 'Index Funds' }
            ].map((cat) => (
               <button
                 key={cat.id}
                 onClick={() => setActiveMFCategory(cat.id)}
                 className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all duration-200 shrink-0 ${
                   activeMFCategory === cat.id
                     ? 'bg-profit/10 text-profit border border-profit/20 shadow-sm'
                     : 'text-text-secondary hover:text-text-primary hover:bg-background border border-transparent'
                 }`}
               >
                 {cat.label}
               </button>
            ))}
          </div>
        </div>

        {/* Mutual Funds Grid */}
        {mfLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col w-full rounded-2xl border border-border bg-card p-5 gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 animate-shimmer rounded-xl shrink-0" />
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="h-4 w-3/4 animate-shimmer rounded" />
                    <div className="h-3 w-1/4 animate-shimmer rounded" />
                  </div>
                </div>
                <div className="flex justify-between items-baseline mt-4">
                  <div className="space-y-1.5">
                    <div className="h-2.5 w-16 animate-shimmer rounded" />
                    <div className="h-5 w-24 animate-shimmer rounded" />
                  </div>
                  <div className="space-y-1.5 flex flex-col items-end">
                    <div className="h-2.5 w-16 animate-shimmer rounded" />
                    <div className="h-5 w-16 animate-shimmer rounded" />
                  </div>
                </div>
                <div className="flex justify-between items-end mt-4 pt-3 border-t border-border/30">
                  <div className="h-3 w-12 animate-shimmer rounded" />
                  <div className="h-6 w-24 animate-shimmer rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : mutualFunds.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mutualFunds.map((fund) => (
              <MutualFundCard key={fund.code} fund={fund} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-sm text-text-secondary font-black bg-card border border-border rounded-2xl">
            No mutual funds found in this category.
          </div>
        )}
      </div>

      {/* Thematic Stock Baskets Section (Smallcases mock) */}
      <div id="thematic-baskets" className="mt-12 pt-10 border-t border-border/60">
        <ThematicBaskets />
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "OnlyProfit",
            "url": "https://onlyprofit.com",
            "description": "Analyze Indian Equities in real-time with interactive charts, technical indicators, and live market data. Estimate mutual fund yields with the built-in SIP/Lumpsum calculator."
          })
        }}
      />
    </div>
  );
}
