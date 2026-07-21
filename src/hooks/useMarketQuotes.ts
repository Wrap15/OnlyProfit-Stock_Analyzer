import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/apiClient';
import { isIndianMarketOpen } from '@/lib/marketHours';

export interface Quote {
  symbol: string;
  shortName: string;
  longName: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketVolume: number;
  marketCap: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  isRealUpdate?: boolean;
}

export function useMarketQuotes(symbols: string[]) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const symbolsRef = useRef<string[]>(symbols);

  // Sync symbols to ref to avoid stale closure in intervals
  useEffect(() => {
    symbolsRef.current = symbols;
  }, [symbols]);

  // Main Fetcher function
  const fetchQuotes = async (showLoading = false) => {
    const currentSymbols = symbolsRef.current;
    if (currentSymbols.length === 0) {
      setLoading(false);
      return;
    }
    try {
      if (showLoading) setLoading(true);
      const symbolsParam = currentSymbols.join(',');
      const res = await apiClient.get<Quote[]>(`/api/stock/quote?symbols=${encodeURIComponent(symbolsParam)}`);
      
      const newQuotes = (res.data || []).map((q) => ({
        ...q,
        isRealUpdate: true,
      }));

      setQuotes((prev) => {
        const map = new Map(prev.map((item) => [item.symbol, item]));
        for (const q of newQuotes) {
          map.set(q.symbol, q);
        }
        return Array.from(map.values());
      });
    } catch (err) {
      console.error('useMarketQuotes: Failed to fetch quotes', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // 1. Initial Load & active polling (every 4 seconds) during market hours
  useEffect(() => {
    fetchQuotes(true);

    const pollInterval = setInterval(() => {
      if (isIndianMarketOpen()) {
        fetchQuotes(false);
      }
    }, 4000);

    return () => clearInterval(pollInterval);
  }, [symbols]); // Reload whenever active symbols array changes

  // 2. Client-side micro-fluctuations (every 400ms) during market hours
  useEffect(() => {
    const fluctuationInterval = setInterval(() => {
      if (!isIndianMarketOpen()) return;

      setQuotes((prev) => {
        if (prev.length === 0) return prev;
        return prev.map((q) => {
          if (q.symbol.startsWith('^')) return q; // Skip indices

          const prevClose = q.regularMarketPrice - q.regularMarketChange;
          const pct = (Math.random() - 0.495) * 0.00015;
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
    }, 400);

    return () => clearInterval(fluctuationInterval);
  }, []);

  return { quotes, loading, refetch: () => fetchQuotes(true) };
}
