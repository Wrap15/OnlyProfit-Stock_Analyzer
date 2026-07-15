import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { isIndianMarketOpen } from '@/lib/marketHours';
import { useStockStore } from '@/store/useStockStore';

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
    promoters: number;
    fii: number;
    dii: number;
    mutualFunds: number;
    retail: number;
  } | null;
  website?: string;
  sector?: string;
  industry?: string;
  regularMarketDayLow?: number;
  regularMarketDayHigh?: number;
  longBusinessSummary?: string;
}

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
    const lowerSector = (sector || 'Financials').toLowerCase();
    if (lowerSector.includes('it') || lowerSector.includes('software')) group = it;
    else if (lowerSector.includes('bank') || lowerSector.includes('financial') || lowerSector.includes('finance')) group = banking;
    else if (lowerSector.includes('auto') || lowerSector.includes('motor') || lowerSector.includes('car')) group = auto;
    else if (lowerSector.includes('fmcg') || lowerSector.includes('consumer') || lowerSector.includes('food')) group = fmcg;
    else if (lowerSector.includes('metal') || lowerSector.includes('steel') || lowerSector.includes('mining')) group = metals;
    else if (lowerSector.includes('power') || lowerSector.includes('utility') || lowerSector.includes('oil') || lowerSector.includes('gas')) group = energy;
    else group = infra;
  }

  return group;
}

export function useStockDetails(symbol: string) {
  const { recentSearches, addToRecentSearches } = useStockStore();
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [financials, setFinancials] = useState<{ annual: any[]; quarterly: any[] } | null>(null);

  // Peers and Sidebar states
  const [peerQuotes, setPeerQuotes] = useState<QuoteData[]>([]);
  const [peersLoading, setPeersLoading] = useState(false);
  const [trendingQuotes, setTrendingQuotes] = useState<any[]>([]);
  const [recentQuotes, setRecentQuotes] = useState<any[]>([]);

  // News states
  const [liveNews, setLiveNews] = useState<any[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);

  // 1. Sync Recent Searches
  useEffect(() => {
    if (!symbol) return;
    addToRecentSearches(symbol);
  }, [symbol, addToRecentSearches]);

  // 2. Fetch stock detail quote and set interval polling (every 3s during market open)
  useEffect(() => {
    if (!symbol) return;

    async function fetchQuoteData(showLoadingState = true) {
      try {
        if (showLoadingState) setLoading(true);
        const res = await apiClient.get(`/api/stock/quote?symbols=${symbol}`);
        if (res.data && res.data.length > 0) {
          setQuote({
            ...res.data[0],
            isRealUpdate: true,
          });
        }
      } catch (err) {
        console.error(`Failed to fetch details for ${symbol}`, err);
      } finally {
        if (showLoadingState) setLoading(false);
      }
    }

    fetchQuoteData(true);

    const pollInterval = setInterval(() => {
      if (isIndianMarketOpen()) {
        fetchQuoteData(false);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [symbol]);

  // 3. Fetch real-world financials from server API
  useEffect(() => {
    if (!symbol) return;
    async function fetchFinancials() {
      try {
        const res = await apiClient.get(`/api/stock/financials?symbol=${symbol}`);
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

  // 4. Real-time stock price micro-fluctuations (every 1s)
  useEffect(() => {
    if (loading || !quote) return;
    
    const interval = setInterval(() => {
      if (!isIndianMarketOpen()) return;

      setQuote((prev) => {
        if (!prev) return null;
        const prevClose = prev.regularMarketPrice - prev.regularMarketChange;
        const pct = (Math.random() - 0.495) * 0.0003; 
        const newPrice = prev.regularMarketPrice * (1 + pct);
        const newChange = newPrice - prevClose;
        const newChangePercent = prevClose > 0 ? (newChange / prevClose) * 100 : 0;
        
        return {
          ...prev,
          regularMarketPrice: parseFloat(newPrice.toFixed(2)),
          regularMarketChange: parseFloat(newChange.toFixed(2)),
          regularMarketChangePercent: parseFloat(newChangePercent.toFixed(2)),
          isRealUpdate: false,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, quote]);

  // 5. Fetch trending stocks
  useEffect(() => {
    async function fetchTrending() {
      try {
        const res = await apiClient.get('/api/stock/quote?symbols=RELIANCE.NS,TCS.NS,INFY.NS,TMPV.NS,TMCV.NS,HDFCBANK.NS');
        if (res.data) setTrendingQuotes(res.data);
      } catch (err) {
        console.error('Failed to fetch trending quotes', err);
      }
    }
    fetchTrending();
  }, []);

  // 6. Fetch recently viewed quotes
  useEffect(() => {
    if (recentSearches.length === 0) return;
    async function fetchRecents() {
      try {
        const symbolsToFetch = recentSearches.filter((s) => s !== symbol && !/^\d+$/.test(s)).slice(0, 3);
        if (symbolsToFetch.length === 0) {
          setRecentQuotes([]);
          return;
        }
        const res = await apiClient.get(`/api/stock/quote?symbols=${symbolsToFetch.join(',')}`);
        if (res.data) setRecentQuotes(res.data);
      } catch (err) {
        console.error('Failed to fetch recent quotes', err);
      }
    }
    fetchRecents();
  }, [recentSearches, symbol]);

  // 7. Fetch peer quotes
  useEffect(() => {
    if (!quote) return;
    const peers = getPeersList(quote.symbol, quote.sector || '');
    if (peers.length === 0) {
      setPeerQuotes([]);
      return;
    }

    async function fetchPeers() {
      try {
        setPeersLoading(true);
        const res = await apiClient.get(`/api/stock/quote?symbols=${peers.join(',')}`);
        if (res.data) {
          setPeerQuotes(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch peer quotes', err);
      } finally {
        setPeersLoading(false);
      }
    }
    fetchPeers();
  }, [quote]);

  // 8. Fetch live RSS news
  useEffect(() => {
    async function fetchStockNews() {
      if (!quote) return;
      setNewsLoading(true);
      try {
        const res = await apiClient.get('/api/blog/news');
        if (res.data && Array.isArray(res.data)) {
          const cleanName = (quote.longName || quote.shortName || symbol).split(' ')[0].toLowerCase();
          const cleanSym = symbol.split('.')[0].toLowerCase();
          
          const filtered = res.data.filter((item: any) => {
            const title = item.title.toLowerCase();
            const desc = item.description.toLowerCase();
            return (
              title.includes(cleanSym) || 
              desc.includes(cleanSym) || 
              title.includes(cleanName) || 
              desc.includes(cleanName) ||
              item.symbol === symbol
            );
          });
          
          if (filtered.length > 0) {
            setLiveNews(filtered.slice(0, 8));
          } else {
            setLiveNews(res.data.slice(0, 8));
          }
        }
      } catch (err) {
        console.error('Failed to load live RSS news for stock details:', err);
      } finally {
        setNewsLoading(false);
      }
    }
    fetchStockNews();
  }, [quote, symbol]);

  return {
    quote,
    loading,
    financials,
    peerQuotes,
    peersLoading,
    recentQuotes,
    trendingQuotes,
    liveNews,
    newsLoading,
    setQuote,
  };
}
