import { useState, useEffect, useMemo, useRef } from 'react';
import { useStockStore } from '@/store/useStockStore';
import { apiClient } from '@/lib/apiClient';
import { isIndianMarketOpen } from '@/lib/marketHours';
import { 
  LARGE_CAP_SYMBOLS, 
  MID_CAP_SYMBOLS, 
  SMALL_CAP_SYMBOLS, 
  TRENDING_SYMBOLS, 
  MOST_SEARCHED_SYMBOLS 
} from '@/constants/marketSymbols';

function getInitialSeededQuotes(): any[] {
  const allSymbols = Array.from(new Set([
    ...LARGE_CAP_SYMBOLS.slice(0, 15),
    ...MID_CAP_SYMBOLS.slice(0, 15),
    ...SMALL_CAP_SYMBOLS.slice(0, 15),
    ...TRENDING_SYMBOLS,
    ...MOST_SEARCHED_SYMBOLS
  ]));

  return allSymbols.map(symbol => {
    const seed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const price = 150 + (seed % 800) + (seed % 10) * 0.15;
    const changePct = ((seed % 12) - 6) / 2.5; // e.g. -2.4% to +2.4%
    const change = (price * changePct) / 100;
    
    return {
      symbol,
      regularMarketPrice: price,
      regularMarketChange: change,
      regularMarketChangePercent: changePct,
      regularMarketVolume: 1200000 + (seed % 20) * 100000,
      fiftyTwoWeekHigh: price * 1.15,
      fiftyTwoWeekLow: price * 0.85
    };
  });
}

export function useDashboardQuotes(activeTab: string, foUnderlying: string) {
  const { watchlist } = useStockStore();
  const [marketQuotes, setMarketQuotes] = useState<any[]>(() => getInitialSeededQuotes());
  const [loading, setLoading] = useState(true);

  // Determine active symbols to fetch on high priority (every 4s)
  const activeSymbolsToFetch = useMemo(() => {
    const base = ['^NSEI', '^BSESN', '^NSEBANK'];
    if (activeTab === 'fo') {
      return Array.from(new Set([...base, foUnderlying]));
    }
    if (activeTab === 'trending') {
      return Array.from(new Set([...base, ...TRENDING_SYMBOLS]));
    }
    if (activeTab === 'mostsearched') {
      return Array.from(new Set([...base, ...MOST_SEARCHED_SYMBOLS]));
    }
    if (activeTab === 'watchlist') {
      return Array.from(new Set([...base, ...watchlist]));
    }
    return base;
  }, [activeTab, watchlist, foUnderlying]);

  const activeSymbolsRef = useRef(activeSymbolsToFetch);
  useEffect(() => {
    activeSymbolsRef.current = activeSymbolsToFetch;
  }, [activeSymbolsToFetch]);

  // Priority Quote Fetcher (polls every 4s)
  const fetchPriorityData = async () => {
    const currentSymbols = activeSymbolsRef.current;
    if (currentSymbols.length === 0) return;
    try {
      const symbolsParam = currentSymbols.join(',');
      const res = await apiClient.get(`/api/stock/quote?symbols=${encodeURIComponent(symbolsParam)}`);
      const fresh = (res.data || []).map((q: any) => ({ ...q, isRealUpdate: true }));
      
      setMarketQuotes((prev) => {
        const map = new Map(prev.map((q) => [q.symbol.toUpperCase(), q]));
        for (const q of fresh) {
          if (q.symbol) {
            map.set(q.symbol.toUpperCase(), q);
          }
        }
        return Array.from(map.values());
      });
    } catch (err) {
      console.error('useDashboardQuotes: Priority fetch failed', err);
    }
  };

  // Staggered Chunk Fetcher (polls every 24s, sliced to prevent HTTP 414/431 URI limits)
  const fetchSymbolsChunk = async (symbols: string[]) => {
    if (!symbols || symbols.length === 0) return;
    const chunkSize = 20;
    const chunks: string[][] = [];
    for (let i = 0; i < symbols.length; i += chunkSize) {
      chunks.push(symbols.slice(i, i + chunkSize));
    }

    try {
      await Promise.all(
        chunks.map(async (chunk) => {
          const symbolsParam = chunk.join(',');
          const res = await apiClient.get(`/api/stock/quote?symbols=${encodeURIComponent(symbolsParam)}`);
          const fresh = (res.data || []).map((q: any) => ({ ...q, isRealUpdate: true }));
          
          setMarketQuotes((prev) => {
            const map = new Map(prev.map((q) => [q.symbol.toUpperCase(), q]));
            for (const q of fresh) {
              if (q.symbol) {
                map.set(q.symbol.toUpperCase(), q);
              }
            }
            return Array.from(map.values());
          });
        })
      );
    } catch (err) {
      console.error('useDashboardQuotes: Chunk fetch failed', err);
    }
  };

  // 1. Setup Priority Polling
  useEffect(() => {
    fetchPriorityData(); // Immediate first priority load

    const interval = setInterval(() => {
      if (isIndianMarketOpen()) {
        fetchPriorityData();
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [activeSymbolsToFetch]);

  // 2. Setup Staggered Chunk Loading & Polling
  useEffect(() => {
    // Initial staggered loads
    fetchSymbolsChunk([...LARGE_CAP_SYMBOLS, ...TRENDING_SYMBOLS, ...MOST_SEARCHED_SYMBOLS])
      .then(() => setLoading(false));

    const midTimeout = setTimeout(() => {
      fetchSymbolsChunk(MID_CAP_SYMBOLS);
    }, 3000);

    const smallTimeout = setTimeout(() => {
      fetchSymbolsChunk(SMALL_CAP_SYMBOLS);
    }, 6000);

    // Staggered polling interval (every 24s)
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
    }, 24000);

    return () => {
      clearTimeout(midTimeout);
      clearTimeout(smallTimeout);
      clearInterval(pollInterval);
    };
  }, []);

  // 3. Client-side price micro-fluctuations (every 1s)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isIndianMarketOpen()) return;

      setMarketQuotes((prev) => {
        if (prev.length === 0) return prev;
        return prev.map((q) => {
          if (q.symbol.startsWith('^')) return q; // Skip indices

          const prevClose = q.regularMarketPrice - q.regularMarketChange;
          const pct = (Math.random() - 0.495) * 0.0003;
          const newPrice = q.regularMarketPrice * (1 + pct);
          const newChange = newPrice - prevClose;
          const newChangePercent = prevClose > 0 ? (newChange / prevClose) * 100 : 0;

          return {
            ...q,
            regularMarketPrice: parseFloat(newPrice.toFixed(2)),
            regularMarketChange: parseFloat(newChange.toFixed(2)),
            regularMarketChangePercent: parseFloat(newChangePercent.toFixed(2)),
            isRealUpdate: false,
          };
        });
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return { marketQuotes, loading };
}
