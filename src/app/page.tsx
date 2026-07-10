'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useStockStore } from '@/store/useStockStore';
import StockCard from '@/components/StockCard';
import StockLogo from '@/components/StockLogo';
import { apiClient as axios } from '@/lib/apiClient';
import MutualFundCard from '@/components/MutualFundCard';
import ThematicBaskets from '@/components/ThematicBaskets';
import IpoDetailsModal from '@/components/IpoDetailsModal';
import AISignalsWidget from '@/components/AISignalsWidget';
import GrowwBlogSection from '@/components/GrowwBlogSection';
import { 
  ArrowUpRight, ArrowDownRight, Star, Sparkles, LayoutGrid, Search, Activity, Landmark, Cpu, Cookie, Car, Flame, Wrench, Layers, HeartPulse, PhoneCall, Bolt, Rocket,
  TrendingUp, TrendingDown, ArrowLeftRight, Bookmark, ChevronDown, X, ArrowUpDown,
  Building, Home as HomeIcon, Coins, PiggyBank, Target, Compass
} from 'lucide-react';
import Link from 'next/link';
import { MUTUAL_FUNDS } from '@/lib/mutualfunds';
import { mapToStandardSector, MOCK_STOCK_INFO } from '@/lib/yahooFinance';
import { isIndianMarketOpen } from '@/lib/marketHours';


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
  'JSWENERGY.NS', 'SWSOLAR.NS', 'CGPOWER.NS', 'GET&D.NS', 'POWERINDIA.NS'
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


const TRENDING_SYMBOLS = ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'TRENT.NS', 'HDFCBANK.NS', 'SBIN.NS', 'TMPV.NS', 'TMCV.NS', 'HAL.NS', 'VEDL.NS'];
const MOST_SEARCHED_SYMBOLS = ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'TRENT.NS', 'IRCTC.NS', 'RVNL.NS', 'SUNPHARMA.NS'];

// Tickertape-style Curated Collections
const BLUE_CHIP_SYMBOLS = ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'LT.NS', 'ITC.NS', 'HINDUNILVR.NS', 'KOTAKBANK.NS'];
const HIGH_GROWTH_SYMBOLS = ['TRENT.NS', 'HAL.NS', 'RVNL.NS', 'MARUTI.NS', 'M&M.NS', 'KPIGREEN.NS'];
const DIVIDEND_SYMBOLS = ['IOC.NS', 'BPCL.NS', 'ONGC.NS', 'POWERGRID.NS', 'ITC.NS', 'TATASTEEL.NS'];
const DEBT_FREE_SYMBOLS = ['TCS.NS', 'INFY.NS', 'WIPRO.NS', 'HCLTECH.NS', 'ITC.NS', 'NESTLEIND.NS', 'DIVISLAB.NS'];

type TabType = 'watchlist' | 'trending' | 'mostsearched' | 'explore' | 'ipo';

export default function Home() {
  const { watchlist, recentSearches, clearRecentSearches } = useStockStore();
  const [marketQuotes, setMarketQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('trending');
  const [searchFilter, setSearchFilter] = useState('');

  // Synchronize activeTab with URL search params reactively
  useEffect(() => {
    const checkTab = () => {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['watchlist', 'trending', 'mostsearched', 'explore', 'ipo'].includes(tabParam)) {
        setActiveTab(prev => prev !== tabParam ? (tabParam as TabType) : prev);
      }
    };
    checkTab();
    const interval = setInterval(checkTab, 150);
    window.addEventListener('popstate', checkTab);
    return () => {
      clearInterval(interval);
      window.removeEventListener('popstate', checkTab);
    };
  }, []);

  const [activeCollection, setActiveCollection] = useState<'all' | 'bluechip' | 'growth' | 'dividend' | 'debtfree'>('all');
  const [exploreSymbols, setExploreSymbols] = useState<string[]>(MONITOR_SYMBOLS);
  const [exploreLoading, setExploreLoading] = useState(false);

  // IPO States
  const [ipoData, setIpoData] = useState<{ open: any[]; closed: any[]; upcoming: any[] } | null>(null);
  const [ipoLoading, setIpoLoading] = useState(false);
  const [ipoCategory, setIpoCategory] = useState<'mainboard' | 'sme'>('mainboard');
  const [selectedIpoSearchId, setSelectedIpoSearchId] = useState<string | null>(null);

  const [todaysStocksTab, setTodaysStocksTab] = useState<'gainers' | 'losers' | 'mostactive' | 'high52w' | 'low52w'>('gainers');
  const [todaysStocksCap, setTodaysStocksCap] = useState<'all' | 'large' | 'mid' | 'small'>('large');

  // Mutual Funds States
  const [activeMFCategory, setActiveMFCategory] = useState<string>('largecap');
  const [mutualFunds, setMutualFunds] = useState<any[]>([]);
  const [mfLoading, setMFLoading] = useState<boolean>(true);
  const [mfReturnDuration, setMfReturnDuration] = useState<'1y' | '3y'>('1y');
  const [isMfDrawerOpen, setIsMfDrawerOpen] = useState<boolean>(false);

  // Clock state for realworld live dashboard feel
  const [timeStr, setTimeStr] = useState<string>('');
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-IN', { hour12: false }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

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

  // Fetch IPOs when active tab is ipo
  useEffect(() => {
    if (activeTab !== 'ipo') return;
    
    async function fetchIPOs() {
      setIpoLoading(true);
      try {
        const res = await axios.get('/api/stock/ipo');
        setIpoData(res.data);
      } catch (err) {
        console.error('Failed to fetch IPOs', err);
      } finally {
        setIpoLoading(false);
      }
    }
    
    fetchIPOs();
  }, [activeTab]);

  // Date formatting helpers for IPOs
  const formatDate = (timestamp: number | null | undefined): string => {
    if (!timestamp) return 'TBA';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const formatDateStr = (dateStr: string | null | undefined): string => {
    if (!dateStr) return 'TBA';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  // Get active symbols to fetch based on current UI state (optimizes speed & bandwidth)
  const activeSymbolsToFetch = useMemo(() => {
    const base = ['^NSEI', '^BSESN'];
    if (activeTab === 'trending') {
      return Array.from(new Set([...base, ...TRENDING_SYMBOLS]));
    }
    if (activeTab === 'mostsearched') {
      return Array.from(new Set([...base, ...MOST_SEARCHED_SYMBOLS]));
    }
    if (activeTab === 'watchlist') {
      return Array.from(new Set([...base, ...watchlist]));
    }
    if (activeTab === 'explore') {
      // Fetch currently visible explore symbols (up to 20 for instant rendering)
      return Array.from(new Set([...base, ...exploreSymbols.slice(0, 20)]));
    }
    return base;
  }, [activeTab, watchlist, exploreSymbols]);

  useEffect(() => {
    if (activeSymbolsToFetch.length === 0) return;

    async function fetchMarketData() {
      try {
        const symbolsParam = activeSymbolsToFetch.join(',');
        const res = await axios.get(`/api/stock/quote?symbols=${encodeURIComponent(symbolsParam)}`);
        const quotesWithFlag = (res.data || []).map((q: any) => ({
          ...q,
          isRealUpdate: true
        }));
        // Merge new quotes into state to preserve prices for other tabs
        setMarketQuotes(prev => {
          const map = new Map(prev.map(q => [q.symbol, q]));
          for (const q of quotesWithFlag) {
            map.set(q.symbol, q);
          }
          return Array.from(map.values());
        });
      } catch (err) {
        console.error('Failed to fetch market metrics', err);
      } finally {
        setLoading(false);
      }
    }

    fetchMarketData();

    // Poll for fresh market quotes every 4 seconds during market hours
    const pollInterval = setInterval(() => {
      if (isIndianMarketOpen()) {
        fetchMarketData();
      }
    }, 4000);

    return () => clearInterval(pollInterval);
  }, [activeSymbolsToFetch]);

  // Fetch market symbols in staggered chunks on mount to prevent blocking Next.js API processes
  // (Large Cap immediately, Mid Cap after 3s, Small Cap after 6s)
  useEffect(() => {
    const fetchSymbolsChunk = async (symbols: string[]) => {
      try {
        const symbolsParam = symbols.join(',');
        const res = await axios.get(`/api/stock/quote?symbols=${encodeURIComponent(symbolsParam)}`);
        const quotesWithFlag = (res.data || []).map((q: any) => ({
          ...q,
          isRealUpdate: true
        }));
        setMarketQuotes(prev => {
          const map = new Map(prev.map(q => [q.symbol, q]));
          for (const q of quotesWithFlag) {
            map.set(q.symbol, q);
          }
          return Array.from(map.values());
        });
      } catch (err) {
        console.error('Failed to fetch market symbols chunk', err);
      }
    };

    // Staggered initial loads
    fetchSymbolsChunk([...LARGE_CAP_SYMBOLS, ...TRENDING_SYMBOLS, ...MOST_SEARCHED_SYMBOLS]);
    
    const midTimeout = setTimeout(() => {
      fetchSymbolsChunk(MID_CAP_SYMBOLS);
    }, 3000);

    const smallTimeout = setTimeout(() => {
      fetchSymbolsChunk(SMALL_CAP_SYMBOLS);
    }, 6000);

    // Staggered polling intervals during market hours
    const pollInterval = setInterval(() => {
      if (isIndianMarketOpen()) {
        fetchSymbolsChunk([...LARGE_CAP_SYMBOLS, ...TRENDING_SYMBOLS, ...MOST_SEARCHED_SYMBOLS]);
        
        setTimeout(() => {
          fetchSymbolsChunk(MID_CAP_SYMBOLS);
        }, 4000);

        setTimeout(() => {
          fetchSymbolsChunk(SMALL_CAP_SYMBOLS);
        }, 8000);
      }
    }, 24000); // Poll main chunks every 24 seconds, staggered

    return () => {
      clearTimeout(midTimeout);
      clearTimeout(smallTimeout);
      clearInterval(pollInterval);
    };
  }, []);

  const hasQuotes = marketQuotes.length > 0;

  // Real-time stock price micro-fluctuations (every 1.0 second like NSE)
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
          // Smaller change percentage per second (between -0.015% and +0.015%)
          const pct = (Math.random() - 0.495) * 0.0003; 
          const newPrice = q.regularMarketPrice * (1 + pct);
          const newChange = newPrice - prevClose;
          const newChangePercent = prevClose > 0 ? (newChange / prevClose) * 100 : 0;

          return {
            ...q,
            regularMarketPrice: parseFloat(newPrice.toFixed(2)),
            regularMarketChange: parseFloat(newChange.toFixed(2)),
            regularMarketChangePercent: parseFloat(newChangePercent.toFixed(2)),
            isRealUpdate: false
          };
        });
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, hasQuotes]);

  // 1. Filter marketQuotes by cap for Today's stocks
  const filteredCapQuotes = [...marketQuotes]
    .filter(q => !q.symbol.startsWith('^'))
    .filter(q => {
      if (todaysStocksCap === 'large') return LARGE_CAP_SYMBOLS.includes(q.symbol);
      if (todaysStocksCap === 'mid') return MID_CAP_SYMBOLS.includes(q.symbol);
      if (todaysStocksCap === 'small') return SMALL_CAP_SYMBOLS.includes(q.symbol);
      return true;
    });

  // 2. Sort and slice based on Today's stocks tab
  let todaysStocksList: any[] = [];

  if (todaysStocksTab === 'gainers') {
    todaysStocksList = filteredCapQuotes
      .filter(q => q.regularMarketChangePercent > 0)
      .sort((a, b) => b.regularMarketChangePercent - a.regularMarketChangePercent)
      .slice(0, 5)
      .map(q => {
        const price = q.regularMarketPrice || 0;
        const pct = q.regularMarketChangePercent || 0;
        return {
          symbol: q.symbol,
          name: MOCK_STOCK_INFO[q.symbol]?.name || q.shortName,
          price: price,
          changePercent: pct,
          chart: generateMockSparklineData(price, pct, q.symbol)
        };
      });
  } else if (todaysStocksTab === 'losers') {
    todaysStocksList = filteredCapQuotes
      .filter(q => q.regularMarketChangePercent < 0)
      .sort((a, b) => a.regularMarketChangePercent - b.regularMarketChangePercent)
      .slice(0, 5)
      .map(q => {
        const price = q.regularMarketPrice || 0;
        const pct = q.regularMarketChangePercent || 0;
        return {
          symbol: q.symbol,
          name: MOCK_STOCK_INFO[q.symbol]?.name || q.shortName,
          price: price,
          changePercent: pct,
          chart: generateMockSparklineData(price, pct, q.symbol)
        };
      });
  } else if (todaysStocksTab === 'mostactive') {
    todaysStocksList = filteredCapQuotes
      .sort((a, b) => b.regularMarketVolume - a.regularMarketVolume)
      .slice(0, 5)
      .map(q => {
        const price = q.regularMarketPrice || 0;
        const pct = q.regularMarketChangePercent || 0;
        return {
          symbol: q.symbol,
          name: MOCK_STOCK_INFO[q.symbol]?.name || q.shortName,
          price: price,
          changePercent: pct,
          volume: q.regularMarketVolume,
          chart: generateMockSparklineData(price, pct, q.symbol)
        };
      });
  } else if (todaysStocksTab === 'high52w') {
    todaysStocksList = filteredCapQuotes
      .filter(q => q.fiftyTwoWeekHigh)
      .sort((a, b) => {
        const ratioA = a.regularMarketPrice / a.fiftyTwoWeekHigh;
        const ratioB = b.regularMarketPrice / b.fiftyTwoWeekHigh;
        return ratioB - ratioA; // closest ratio to 1 first
      })
      .slice(0, 5)
      .map(q => {
        const price = q.regularMarketPrice || 0;
        const pct = q.regularMarketChangePercent || 0;
        return {
          symbol: q.symbol,
          name: MOCK_STOCK_INFO[q.symbol]?.name || q.shortName,
          price: price,
          changePercent: pct,
          chart: generateMockSparklineData(price, pct, q.symbol)
        };
      });
  } else if (todaysStocksTab === 'low52w') {
    todaysStocksList = filteredCapQuotes
      .filter(q => q.fiftyTwoWeekLow)
      .sort((a, b) => {
        const ratioA = a.regularMarketPrice / a.fiftyTwoWeekLow;
        const ratioB = b.regularMarketPrice / b.fiftyTwoWeekLow;
        return ratioA - ratioB; // closest ratio to 1 first
      })
      .slice(0, 5)
      .map(q => {
        const price = q.regularMarketPrice || 0;
        const pct = q.regularMarketChangePercent || 0;
        return {
          symbol: q.symbol,
          name: MOCK_STOCK_INFO[q.symbol]?.name || q.shortName,
          price: price,
          changePercent: pct,
          chart: generateMockSparklineData(price, pct, q.symbol)
        };
      });
  }



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
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-12 transition-colors duration-300">
      
      {/* Hero Header Command Center Section */}
      <div className="mb-8 p-6 rounded-3xl border border-border bg-glass shadow-premium relative overflow-hidden animate-fade-in">
        {/* Decorative corner background gradient blur glow */}
        <div className="absolute top-0 right-0 h-40 w-40 bg-gradient-to-br from-emerald-500/5 to-indigo-500/5 rounded-full blur-3xl pointer-events-none select-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-widest bg-profit/15 text-profit px-2 py-0.5 rounded-md border border-profit/20">
                PRO PLATFORM
              </span>
              <div className="flex items-center gap-1.5 text-xs text-text-secondary font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-border" />
                <span>Exchange: NSE India</span>
              </div>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-text-primary mt-1">
              Market Command Center — <span className="bg-gradient-to-r from-profit to-teal-500 bg-clip-text text-transparent">OnlyProfit</span>
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary font-medium max-w-2xl leading-relaxed">
              Real-time analytics, interactive trading charts, and sector valuation metrics for NSE-listed equities.
            </p>
          </div>
          
          {/* Status widgets panel */}
          <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
            {/* Live Clock Widget */}
            {timeStr && (
              <div className="px-4 py-2 rounded-2xl bg-background border border-border/80 flex flex-col items-center justify-center shadow-inner select-none font-mono">
                <span className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest">LOCAL TIME</span>
                <span className="text-xs font-black text-text-primary tracking-wider mt-0.5">{timeStr}</span>
              </div>
            )}
            
            {/* Live Market Hours Status Widget */}
            <div className="px-4 py-2 rounded-2xl bg-background border border-border/80 flex flex-col items-start shadow-inner select-none">
              <span className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest">MARKET STATUS</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`h-2 w-2 rounded-full ${isIndianMarketOpen() ? 'bg-profit animate-pulse' : 'bg-text-secondary'} shrink-0`} />
                <span className={`text-[10px] font-black uppercase ${isIndianMarketOpen() ? 'text-profit' : 'text-text-secondary'}`}>
                  {isIndianMarketOpen() ? 'NSE MARKET OPEN' : 'NSE MARKET CLOSED'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:gap-10 lg:grid-cols-3">
        
        {/* Left Column: Explorer Board (Grid Column Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Recently Viewed Panel */}
          {recentSearches && recentSearches.length > 0 && (
            <div className="bg-card border border-border p-5 md:p-6 rounded-2xl animate-fade-in">
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

            <button
              onClick={() => setActiveTab('ipo')}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all duration-200 flex items-center gap-1.5 shrink-0 ${
                activeTab === 'ipo'
                  ? 'bg-profit/10 text-profit border border-profit/20 shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-background border border-transparent'
              }`}
            >
              <Rocket className="h-3.5 w-3.5" /> IPOs
            </button>
          </div>

          {/* TAB 1: TRENDING */}
          {activeTab === 'trending' && (
            <div className="grid grid-cols-1 gap-2.5 sm:gap-4 sm:grid-cols-2 animate-fade-in gpu-layer">
              {[...TRENDING_SYMBOLS]
                .map(symbol => {
                  const quote = marketQuotes.find(q => q.symbol === symbol);
                  return { symbol, quote };
                })
                .sort((a, b) => {
                  const priceA = a.quote?.regularMarketPrice ?? 0;
                  const priceB = b.quote?.regularMarketPrice ?? 0;
                  return priceB - priceA;
                })
                .map(({ symbol, quote }) => (
                  <StockCard key={symbol} symbol={symbol} initialQuote={quote} />
                ))}
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
                  <button 
                    onClick={() => setActiveTab('explore')}
                    className="mt-5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 shadow-md shadow-emerald-500/10 active:scale-[0.98] cursor-pointer"
                  >
                    Explore All Stocks
                  </button>
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

          {/* TAB 5: IPO DETAILS TRACKER */}
          {activeTab === 'ipo' && (
            <div className="space-y-6 animate-fade-in gpu-layer">
              {/* Category Filter Pills (Mainboard vs SME) */}
              <div className="flex justify-between items-center gap-4">
                <div className="flex gap-1.5 p-1 bg-card border border-border/70 rounded-xl">
                  {[
                    { id: 'mainboard', label: 'Mainboard IPOs' },
                    { id: 'sme', label: 'SME IPOs' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setIpoCategory(cat.id as any)}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-black shrink-0 transition-all duration-200 ${
                        ipoCategory === cat.id
                          ? 'bg-profit/10 text-profit border border-profit/15 shadow-sm'
                          : 'text-text-secondary hover:text-text-primary hover:bg-background border border-transparent'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
                
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider bg-card border border-border/80 px-2 py-1 rounded-lg">
                  IPO Live Feed
                </span>
              </div>

              {ipoLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-text-secondary">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-profit border-t-transparent" />
                  <span className="text-xs font-bold">Fetching latest IPO listings...</span>
                </div>
              ) : ipoData ? (
                <div className="space-y-8">
                  {/* SECTION 1: OPEN IPOS */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-2 w-2 rounded-full bg-profit animate-pulse" />
                      <h3 className="font-extrabold text-sm text-text-primary tracking-tight">Open IPOs</h3>
                    </div>
                    {(() => {
                      const list = (ipoData.open || []).filter(item => ipoCategory === 'sme' ? item.isSme : !item.isSme);
                      if (list.length === 0) {
                        return (
                          <div className="text-center py-8 bg-card/45 border border-dashed border-border rounded-2xl text-xs text-text-secondary font-bold">
                            No open IPOs in this category right now
                          </div>
                        );
                      }
                      return (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          {list.map((ipo) => {
                            const details = ipo.categories?.[0] || {};
                            const priceRange = details.minPrice ? `₹${details.minPrice} - ₹${details.maxPrice}` : 'Price TBA';
                            const minInvestment = details.lotSize && details.minPrice ? `₹${(details.lotSize * details.minPrice).toLocaleString('en-IN')}` : 'TBA';
                            const isHot = ipo.overallSubscription && ipo.overallSubscription > 5;
                            return (
                              <div key={ipo.symbol} className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-soft dark:shadow-soft-dark flex flex-col justify-between hover-lift transition-all">
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      {ipo.logoUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={ipo.logoUrl} alt={ipo.companyName} className="h-10 w-10 rounded-xl bg-background object-contain border border-border/60 p-1" />
                                      ) : (
                                        <div className="h-10 w-10 rounded-xl bg-profit/10 text-profit flex items-center justify-center font-bold text-sm">
                                          {ipo.symbol.substring(0, 2)}
                                        </div>
                                      )}
                                      <div>
                                        <h4 className="font-extrabold text-xs text-text-primary line-clamp-1">{ipo.companyName}</h4>
                                        <span className="text-[10px] font-bold text-text-secondary">{ipo.symbol}</span>
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                      <span className="text-[9px] font-extrabold bg-profit/10 text-profit px-2 py-0.5 rounded-full uppercase tracking-wider">
                                        Open
                                      </span>
                                      {isHot && (
                                        <span className="text-[9px] font-extrabold bg-loss/10 text-loss px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                          🔥 Hot ({ipo.overallSubscription.toFixed(1)}x)
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3 py-2 border-y border-border/60 text-[11px]">
                                    <div>
                                      <span className="text-text-secondary font-medium">Price Band</span>
                                      <div className="font-extrabold text-text-primary mt-0.5">{priceRange}</div>
                                    </div>
                                    <div>
                                      <span className="text-text-secondary font-medium">Min Investment</span>
                                      <div className="font-extrabold text-text-primary mt-0.5">{minInvestment}</div>
                                    </div>
                                    <div className="col-span-2">
                                      <span className="text-text-secondary font-medium">Bidding Dates</span>
                                      <div className="font-extrabold text-text-primary mt-0.5">
                                        {formatDate(ipo.bidStartTimestamp)} - {formatDate(ipo.bidEndTimestamp)}
                                      </div>
                                    </div>
                                    {ipo.overallSubscription !== undefined && (
                                      <div className="col-span-2 mt-1">
                                        <div className="flex justify-between items-center text-[10px] mb-1">
                                          <span className="text-text-secondary font-medium">Subscription Demand</span>
                                          <span className={`font-black ${ipo.overallSubscription >= 1 ? 'text-profit' : 'text-text-secondary'}`}>
                                            {ipo.overallSubscription ? `${ipo.overallSubscription.toFixed(2)}x` : '0.00x'} 
                                            {ipo.overallSubscription >= 1 ? ' (Fully Subscribed)' : ''}
                                          </span>
                                        </div>
                                        <div className="h-1.5 w-full bg-border/40 rounded-full overflow-hidden">
                                          <div 
                                            className={`h-full rounded-full transition-all duration-500 ${
                                              ipo.overallSubscription >= 5 
                                                ? 'bg-loss animate-pulse' 
                                                : ipo.overallSubscription >= 1 
                                                  ? 'bg-profit' 
                                                  : 'bg-primary'
                                            }`}
                                            style={{ width: `${Math.min((ipo.overallSubscription || 0) * 100, 100)}%` }}
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="mt-4 flex gap-2">
                                  <button
                                    onClick={() => setSelectedIpoSearchId(ipo.searchId)}
                                    className="flex-1 text-center py-2 bg-profit text-white rounded-xl text-xs font-bold hover:bg-profit-dark transition-colors"
                                  >
                                    View in OnlyProfit
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  {/* SECTION 2: UPCOMING IPOS */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <h3 className="font-extrabold text-sm text-text-primary tracking-tight">Upcoming IPOs</h3>
                    </div>
                    {(() => {
                      const list = (ipoData.upcoming || []).filter(item => ipoCategory === 'sme' ? item.isSme : !item.isSme);
                      if (list.length === 0) {
                        return (
                          <div className="text-center py-8 bg-card/45 border border-dashed border-border rounded-2xl text-xs text-text-secondary font-bold">
                            No upcoming IPOs announced in this category
                          </div>
                        );
                      }
                      return (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          {list.map((ipo) => {
                            return (
                              <div key={ipo.symbol} className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-soft dark:shadow-soft-dark flex flex-col justify-between hover-lift transition-all">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-3">
                                    {ipo.logoUrl ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={ipo.logoUrl} alt={ipo.companyName} className="h-10 w-10 rounded-xl bg-background object-contain border border-border/60 p-1" />
                                    ) : (
                                      <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                        {ipo.symbol.substring(0, 2)}
                                      </div>
                                    )}
                                    <div>
                                      <h4 className="font-extrabold text-xs text-text-primary line-clamp-1">{ipo.companyName}</h4>
                                      <span className="text-[10px] font-bold text-text-secondary">{ipo.symbol}</span>
                                    </div>
                                  </div>
                                  <span className="text-[9px] font-extrabold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    Upcoming
                                  </span>
                                </div>
                                <div className="flex gap-2">
                                  {ipo.documentUrl ? (
                                    <a
                                      href={ipo.documentUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex-1 text-center py-2 border border-border text-text-primary rounded-xl text-xs font-bold hover:bg-background transition-colors"
                                    >
                                      Draft Prospectus (SEBI)
                                    </a>
                                  ) : (
                                    <span className="flex-1 text-center py-2 text-text-secondary text-xs font-bold">
                                      Dates & Pricing TBA
                                    </span>
                                  )}
                                  <button
                                    onClick={() => setSelectedIpoSearchId(ipo.searchId)}
                                    className="flex-1 text-center py-2 bg-card border border-border text-text-primary rounded-xl text-xs font-bold hover:bg-background transition-colors"
                                  >
                                    Track on OnlyProfit
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  {/* SECTION 3: CLOSED/LISTED IPOS */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-2 w-2 rounded-full bg-text-secondary" />
                      <h3 className="font-extrabold text-sm text-text-primary tracking-tight">Closed / Recently Listed</h3>
                    </div>
                    {(() => {
                      const list = (ipoData.closed || []).filter(item => ipoCategory === 'sme' ? item.isSme : !item.isSme);
                      if (list.length === 0) {
                        return (
                          <div className="text-center py-8 bg-card/45 border border-dashed border-border rounded-2xl text-xs text-text-secondary font-bold">
                            No recently closed IPOs listed
                          </div>
                        );
                      }
                      return (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          {list.map((ipo) => {
                            const listingDate = ipo.listingTimestamp ? formatDate(ipo.listingTimestamp) : 'TBA';
                            return (
                              <div key={ipo.symbol} className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-soft dark:shadow-soft-dark flex flex-col justify-between hover-lift transition-all">
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      {ipo.logoUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={ipo.logoUrl} alt={ipo.companyName} className="h-10 w-10 rounded-xl bg-background object-contain border border-border/60 p-1" />
                                      ) : (
                                        <div className="h-10 w-10 rounded-xl bg-background text-text-secondary flex items-center justify-center font-bold text-sm border border-border/60">
                                          {ipo.symbol.substring(0, 2)}
                                        </div>
                                      )}
                                      <div>
                                        <h4 className="font-extrabold text-xs text-text-primary line-clamp-1">{ipo.companyName}</h4>
                                        <span className="text-[10px] font-bold text-text-secondary">{ipo.symbol}</span>
                                      </div>
                                    </div>
                                    <span className="text-[9px] font-extrabold bg-border text-text-secondary px-2 py-0.5 rounded-full uppercase tracking-wider">
                                      Closed
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3 py-2 border-y border-border/60 text-[11px]">
                                    <div>
                                      <span className="text-text-secondary font-medium">Issue Price</span>
                                      <div className="font-extrabold text-text-primary mt-0.5">₹{ipo.issuePrice || 'TBA'}</div>
                                    </div>
                                    {ipo.isListed && ipo.listingPrice ? (
                                      <div>
                                        <span className="text-text-secondary font-medium">Listing Price</span>
                                        <div className="font-extrabold text-text-primary mt-0.5">₹{ipo.listingPrice}</div>
                                      </div>
                                    ) : (
                                      <div>
                                        <span className="text-text-secondary font-medium">Subscription Rate</span>
                                        <div className="font-extrabold text-text-primary mt-0.5">
                                          {ipo.overallSubscription ? `${ipo.overallSubscription.toFixed(2)}x` : 'TBA'}
                                        </div>
                                      </div>
                                    )}
                                    <div>
                                      <span className="text-text-secondary font-medium">Bidding Dates</span>
                                      <div className="font-extrabold text-text-primary mt-0.5">
                                        {formatDateStr(ipo.openingDate)} - {formatDateStr(ipo.closingDate)}
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-text-secondary font-medium">Listing Date</span>
                                      <div className="font-extrabold text-text-primary mt-0.5">{listingDate}</div>
                                    </div>
                                    {ipo.isListed && ipo.listingReturn !== null && ipo.listingReturn !== undefined && (
                                      <div className="col-span-2 flex items-center justify-between mt-1 pt-1.5 border-t border-dashed border-border/60">
                                        <span className="text-text-secondary font-medium">Listing Performance</span>
                                        <span className={`font-black px-2 py-0.5 rounded text-[10px] flex items-center gap-0.5 ${
                                          ipo.listingReturn >= 0 
                                            ? 'bg-profit/10 text-profit' 
                                            : 'bg-loss/10 text-loss'
                                        }`}>
                                          {ipo.listingReturn >= 0 ? '▲' : '▼'}{' '}
                                          {ipo.listingReturn >= 0 ? '+' : ''}{ipo.listingReturn.toFixed(2)}%
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="mt-4 flex gap-2">
                                  {ipo.rtaLink ? (
                                    <a
                                      href={ipo.rtaLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex-1 text-center py-2 border border-border text-text-primary rounded-xl text-xs font-bold hover:bg-background transition-colors"
                                    >
                                      Check Allotment (RTA)
                                    </a>
                                  ) : null}
                                  <button
                                    onClick={() => setSelectedIpoSearchId(ipo.searchId)}
                                    className="flex-1 text-center py-2 bg-card border border-border text-text-primary rounded-xl text-xs font-bold hover:bg-background transition-colors"
                                  >
                                    View Details in OnlyProfit
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-sm text-text-secondary font-bold">
                  Failed to load IPO data. Please try again.
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Column: Gainers, Losers & Most Active (Grid Column Span 1) */}
        <div className="space-y-6">
          
          {/* Today's Stocks Card (Redesigned Unified Widget) */}
          <div className="rounded-3xl border border-border bg-card p-5 md:p-6 shadow-soft dark:shadow-soft-dark space-y-5">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h3 className="font-extrabold text-base text-text-primary tracking-tight">
                {"Today's stocks"}
              </h3>

              {/* Cap Toggle Selector Button */}
              <button 
                onClick={() => {
                  setTodaysStocksCap(prev => {
                    if (prev === 'large') return 'mid';
                    if (prev === 'mid') return 'small';
                    if (prev === 'small') return 'all';
                    return 'large';
                  });
                }}
                className="flex items-center gap-1.5 text-xs font-black text-profit hover:underline select-none shrink-0"
              >
                <span>
                  {todaysStocksCap === 'large' ? 'Large Cap' : todaysStocksCap === 'mid' ? 'Mid Cap' : todaysStocksCap === 'small' ? 'Small Cap' : 'All Caps'}
                </span>
                <ArrowLeftRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Category Pills/Tabs */}
            <div className="flex overflow-x-auto scrollbar-none gap-2 py-0.5 max-w-full">
              {[
                { id: 'gainers', label: 'Gainers', icon: TrendingUp, iconColor: 'text-emerald-500' },
                { id: 'losers', label: 'Losers', icon: TrendingDown, iconColor: 'text-rose-500' },
                { id: 'mostactive', label: 'Most Active', icon: Flame, iconColor: 'text-amber-500' },
                { id: 'high52w', label: '52W High', icon: ArrowUpRight, iconColor: 'text-emerald-500' },
                { id: 'low52w', label: '52W Low', icon: ArrowDownRight, iconColor: 'text-rose-500' }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = todaysStocksTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setTodaysStocksTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-black transition-all duration-200 shrink-0 flex items-center gap-1.5 border select-none cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 border-transparent text-white dark:bg-slate-800'
                        : 'bg-card text-text-primary border-border hover:bg-slate-50 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-white' : tab.iconColor}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* List Headers */}
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-text-secondary select-none px-2 border-b border-border/40 pb-2.5">
              <span>Stock Name</span>
              <span className="pr-12">Price & Change</span>
            </div>

            {/* Stocks List */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center justify-between py-3.5 px-2 border-b border-border/10">
                    <div className="flex items-center gap-3 flex-grow">
                      <div className="h-9 w-9 rounded-xl animate-pulse bg-slate-200 dark:bg-slate-800" />
                      <div className="space-y-1.5 flex-grow">
                        <div className="h-4 w-24 animate-pulse bg-slate-200 dark:bg-slate-800 rounded" />
                        <div className="h-3 w-16 animate-pulse bg-slate-200 dark:bg-slate-800 rounded" />
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 mr-12">
                      <div className="h-4 w-14 animate-pulse bg-slate-200 dark:bg-slate-800 rounded animate-shimmer" />
                      <div className="h-3.5 w-12 animate-pulse bg-slate-200 dark:bg-slate-800 rounded animate-shimmer" />
                    </div>
                  </div>
                ))}
              </div>
            ) : todaysStocksList.length > 0 ? (
              <div className="divide-y divide-border/40">
                {todaysStocksList.map((stock) => {
                  const isStockPositive = stock.changePercent >= 0;
                  const isBookmarked = watchlist.includes(stock.symbol);
                  const cleanName = stock.name
                    .replace(/\s+(Limited|Ltd|Co|Corp|Company)\s*$/i, '')
                    .trim();

                  return (
                    <Link
                      key={stock.symbol}
                      href={`/stock/${stock.symbol}`}
                      className="flex items-center justify-between py-3.5 px-1 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all duration-200 group"
                    >
                      {/* Left Info: Logo, Name & Ticker */}
                      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                        <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl bg-white border border-slate-200/80 dark:border-slate-800/80 p-1 flex items-center justify-center shrink-0 shadow-sm relative overflow-hidden">
                          <StockLogo symbol={stock.symbol} size="sm" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-extrabold text-xs sm:text-sm text-text-primary group-hover:text-profit transition-colors truncate">
                            {cleanName}
                          </div>
                          <div className="text-[9px] sm:text-[10px] text-text-secondary font-black tracking-wider uppercase mt-0.5 truncate">
                            {stock.symbol.split('.')[0]}
                          </div>
                        </div>
                      </div>

                      {/* Right Info: Price, Change & Bookmark */}
                      <div className="flex items-center gap-3 sm:gap-4 shrink-0 ml-2">
                        <div className="flex flex-col text-right">
                          <div className="font-extrabold text-xs sm:text-sm text-text-primary tabular-nums">
                            ₹{stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                          <div className={`text-[10px] sm:text-xs font-black tabular-nums flex items-center justify-end gap-0.5 mt-0.5 ${isStockPositive ? 'text-profit' : 'text-loss'}`}>
                            <span>{isStockPositive ? '▲' : '▼'}</span>
                            <span>{isStockPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%</span>
                          </div>
                        </div>

                        {/* Watchlist Bookmark Icon Toggle */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            useStockStore.getState().toggleWatchlist(stock.symbol);
                          }}
                          className="p-1.5 sm:p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                          aria-label={isBookmarked ? "Remove from watchlist" : "Add to watchlist"}
                        >
                          <Bookmark 
                            className={`h-4 w-4 sm:h-4.5 sm:w-4.5 transition-all duration-200 ${
                              isBookmarked 
                                ? 'text-profit fill-profit scale-110' 
                                : 'text-slate-400 dark:text-slate-500 hover:text-text-primary'
                            }`} 
                          />
                        </button>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-text-secondary font-extrabold bg-slate-50/50 dark:bg-slate-800/10 rounded-2xl border border-border/40">
                No stocks found in this category.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Mutual Funds Explorer Section */}
      <div id="mutual-funds" className="mt-12 pt-10 border-t border-border/60 space-y-6 animate-fade-in gpu-layer">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-text-primary tracking-tight">
              Mutual funds and ETFs
            </h2>
            <p className="text-xs text-text-secondary font-medium mt-1">
              Explore top mutual funds and exchange traded funds with direct returns tracking.
            </p>
          </div>

          {/* Returns duration toggle selector */}
          <button 
            onClick={() => setMfReturnDuration(prev => prev === '1y' ? '3y' : '1y')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-background text-text-primary text-xs font-extrabold select-none shrink-0 self-start sm:self-auto shadow-sm"
          >
            <span>{mfReturnDuration === '1y' ? '1Y Return' : '3Y Return'}</span>
            <ArrowUpDown className="h-3.5 w-3.5 text-profit" />
          </button>
        </div>

        {/* Category Filter Options */}
        {(() => {
          const MF_CATEGORIES = [
            { id: 'largecap', label: 'Large Cap', icon: Building, color: 'text-rose-500' },
            { id: 'midcap', label: 'Mid Cap', icon: HomeIcon, color: 'text-blue-500' },
            { id: 'smallcap', label: 'Small Cap', icon: Coins, color: 'text-amber-500' },
            { id: 'flexicap', label: 'Flexi Cap', icon: Compass, color: 'text-indigo-500' },
            { id: 'multicap', label: 'Multi Cap', icon: Layers, color: 'text-purple-500' },
            { id: 'taxsaving', label: 'Tax Saving', icon: PiggyBank, color: 'text-slate-500' },
            { id: 'index', label: 'Index Funds', icon: Target, color: 'text-emerald-500' },
            { id: 'etf', label: 'ETFs', icon: ArrowUpDown, color: 'text-violet-500' }
          ];

          const activeMFObj = MF_CATEGORIES.find(cat => cat.id === activeMFCategory) || MF_CATEGORIES[0];
          const ActiveCatIcon = activeMFObj.icon;

          return (
            <>
              {/* Desktop Category Filter Pills */}
              <div className="hidden sm:flex overflow-x-auto scrollbar-none max-w-full gap-2.5 py-1">
                {MF_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = activeMFCategory === cat.id;
                  
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveMFCategory(cat.id)}
                      className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all duration-200 shrink-0 flex items-center gap-2 border select-none cursor-pointer ${
                        isActive
                          ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-white border-transparent shadow-md'
                          : 'bg-card text-text-primary border-border hover:bg-slate-50 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      <Icon className={`h-4.5 w-4.5 shrink-0 transition-colors ${isActive ? 'text-white' : cat.color}`} />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Mobile Category Toggle Menu Bar (Mobile Only) */}
              <div className="flex sm:hidden items-center justify-between bg-card border border-border px-4 py-2.5 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-text-secondary uppercase tracking-wider">Asset Class:</span>
                  <span className="text-xs font-extrabold text-text-primary">{activeMFObj.label}</span>
                </div>
                <button
                  onClick={() => setIsMfDrawerOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-slate-50 text-text-primary text-xs font-black select-none shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  <ActiveCatIcon className={`h-4 w-4 ${activeMFObj.color}`} />
                  <span>Select Class</span>
                  <ChevronDown className="h-3.5 w-3.5 text-text-secondary animate-pulse" />
                </button>
              </div>

              {/* Mobile bottom sheet drawer overlay for selecting category */}
              {isMfDrawerOpen && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs sm:hidden animate-fade-in">
                  <div className="absolute inset-0" onClick={() => setIsMfDrawerOpen(false)} />
                  <div className="relative w-full bg-card rounded-t-3xl border-t border-border p-6 pb-8 space-y-4 animate-slide-up max-h-[85vh] overflow-y-auto z-50 shadow-2xl">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-border/40 pb-3.5">
                      <h3 className="text-xs font-black text-text-secondary uppercase tracking-wider">Select Asset Class</h3>
                      <button 
                        onClick={() => setIsMfDrawerOpen(false)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    
                    {/* Grid of categories */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      {MF_CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        const isActive = activeMFCategory === cat.id;
                        return (
                          <button
                            key={cat.id}
                            onClick={() => {
                              setActiveMFCategory(cat.id);
                              setIsMfDrawerOpen(false);
                            }}
                            className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all active:scale-98 cursor-pointer ${
                              isActive
                                ? 'bg-slate-900 border-transparent text-white dark:bg-slate-800'
                                : 'bg-background border-border text-text-primary hover:bg-slate-50 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            <Icon className={`h-6 w-6 mb-2 ${isActive ? 'text-white' : cat.color}`} />
                            <span className="text-[11px] font-black tracking-tight">{cat.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
          );
        })()}

        {/* Table column headers */}
        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-text-secondary select-none px-4 pb-2 border-b border-border/40 mt-4">
          <span>Funds</span>
          <span className="mr-14">{mfReturnDuration === '1y' ? 'Returns' : 'Returns'}</span>
        </div>

        {/* Mutual Funds List (Tabular Clean/Minimal Layout) */}
        {mfLoading ? (
          <div className="divide-y divide-border/30 bg-card border border-border rounded-3xl overflow-hidden shadow-soft dark:shadow-soft-dark">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-card">
                <div className="flex items-center gap-3.5 flex-1">
                  <div className="h-11 w-11 animate-shimmer rounded-xl shrink-0" />
                  <div className="space-y-2 flex-1 max-w-[50%]">
                    <div className="h-4 w-3/4 animate-shimmer rounded" />
                    <div className="h-3 w-1/4 animate-shimmer rounded" />
                  </div>
                </div>
                <div className="h-4 w-12 animate-shimmer rounded shrink-0 mr-4" />
                <div className="h-8 w-8 animate-shimmer rounded-lg shrink-0" />
              </div>
            ))}
          </div>
        ) : mutualFunds.length > 0 ? (
          <div className="divide-y divide-border/30 bg-card border border-border rounded-3xl overflow-hidden shadow-soft dark:shadow-soft-dark">
            {mutualFunds.map((fund) => (
              <MutualFundCard key={fund.code} fund={fund} returnDuration={mfReturnDuration} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-sm text-text-secondary font-black bg-card border border-border rounded-2xl">
            No mutual funds found in this category.
          </div>
        )}
      </div>

      {/* AI Market Alerts / SaaS Pro signals */}
      <div id="ai-signals" className="mt-12 pt-10 border-t border-border/60">
        <AISignalsWidget />
      </div>


      {/* Groww Blog Section */}
      <div id="groww-blogs" className="mt-12 pt-10 border-t border-border/60">
        <GrowwBlogSection />
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
          }).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')
        }}
      />

      <IpoDetailsModal
        searchId={selectedIpoSearchId}
        onClose={() => setSelectedIpoSearchId(null)}
      />
    </div>
  );
}
