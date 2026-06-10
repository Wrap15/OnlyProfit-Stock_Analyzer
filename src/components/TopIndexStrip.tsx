'use client';

import React, { useState, useEffect } from 'react';
import { apiClient as axios } from '@/lib/apiClient';
import IndexCard from './IndexCard';

interface IndexData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  chart: number[];
  loading: boolean;
}

const INDEX_SYMBOLS = [
  { symbol: '^NSEI', name: 'NIFTY 50' },
  { symbol: '^BSESN', name: 'SENSEX' },
  { symbol: '^NSEBANK', name: 'BANK NIFTY' },
  { symbol: '^CNXIT', name: 'NIFTY IT' }
];

export default function TopIndexStrip() {
  const [indices, setIndices] = useState<IndexData[]>(
    INDEX_SYMBOLS.map(item => ({
      symbol: item.symbol,
      name: item.name,
      price: 0,
      change: 0,
      changePercent: 0,
      chart: [],
      loading: true
    }))
  );
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    async function fetchIndexData() {
      try {
        // 1. Fetch quotes
        const symbolsParam = INDEX_SYMBOLS.map(i => i.symbol).join(',');
        const quoteRes = await axios.get(`/api/stock/quote?symbols=${symbolsParam}`);
        const quotes = quoteRes.data || [];

        // 2. Fetch charts in parallel
        const chartPromises = INDEX_SYMBOLS.map(i => 
          axios.get(`/api/stock/chart?symbol=${encodeURIComponent(i.symbol)}&range=1d`)
            .then(res => ({ symbol: i.symbol, data: res.data || [] }))
            .catch(() => ({ symbol: i.symbol, data: [] }))
        );
        const charts = await Promise.all(chartPromises);

        // 3. Map together
        const updated = INDEX_SYMBOLS.map(item => {
          const quote = quotes.find((q: any) => q.symbol === item.symbol) || {};
          const chartObj = charts.find(c => c.symbol === item.symbol) || { data: [] };
          const chartPoints = chartObj.data.map((pt: any) => pt.value) || [];

          return {
            symbol: item.symbol,
            name: item.name,
            price: quote.regularMarketPrice || 0,
            change: quote.regularMarketChange || 0,
            changePercent: quote.regularMarketChangePercent || 0,
            chart: chartPoints,
            loading: false
          };
        });

        setIndices(updated);
        setHasLoaded(true);
      } catch (err) {
        console.error('Failed to fetch indices data', err);
      }
    }

    fetchIndexData();
    // Poll every 30 seconds for live data sync
    const interval = setInterval(fetchIndexData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Real-time client-side fluctuations for indices (every 2.5 seconds)
  useEffect(() => {
    if (!hasLoaded) return;

    const interval = setInterval(() => {
      setIndices(prev => {
        if (prev.length === 0) return prev;
        return prev.map(ind => {
          // Low volatility fluctuation for indices (max ±0.015%)
          const pct = (Math.random() - 0.495) * 0.0003; 
          const newPrice = ind.price * (1 + pct);
          const basePrice = ind.price - ind.change;
          const newChange = newPrice - basePrice;
          const newChangePercent = basePrice > 0 ? (newChange / basePrice) * 100 : 0;

          return {
            ...ind,
            price: parseFloat(newPrice.toFixed(2)),
            change: parseFloat(newChange.toFixed(2)),
            changePercent: parseFloat(newChangePercent.toFixed(2))
          };
        });
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [hasLoaded]);

  return (
    <div className="sticky top-16 z-40 w-full border-b border-border bg-card/75 backdrop-blur-md transition-all select-none">
      <div className="relative max-w-7xl mx-auto w-full">
        {/* Gradient fades on mobile to indicate horizontal scrollability */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card to-transparent pointer-events-none z-10 sm:hidden" />
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-card to-transparent pointer-events-none z-10 sm:hidden" />
        
        <div className="w-full overflow-x-auto scrollbar-none py-2.5 px-4">
          <div className="flex items-center justify-start gap-3 md:justify-around min-w-max pr-6 sm:pr-0">
            {indices.map((index) => (
              <IndexCard
                key={index.symbol}
                symbol={index.symbol}
                name={index.name}
                price={index.price}
                change={index.change}
                changePercent={index.changePercent}
                chart={index.chart}
                loading={index.loading}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
