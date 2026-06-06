'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MiniSparkline from './MiniSparkline';
import Link from 'next/link';

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
      } catch (err) {
        console.error('Failed to fetch indices data', err);
      }
    }

    fetchIndexData();
    // Poll every 30 seconds for live feeling
    const interval = setInterval(fetchIndexData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="sticky top-16 z-40 w-full border-b border-border bg-card/75 backdrop-blur-md transition-all select-none">
      <div className="relative max-w-7xl mx-auto w-full">
        {/* Gradient fades on mobile to indicate horizontal scrollability */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card to-transparent pointer-events-none z-10 sm:hidden" />
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-card to-transparent pointer-events-none z-10 sm:hidden" />
        
        <div className="w-full overflow-x-auto scrollbar-none py-2.5 px-4">
          <div className="flex items-center justify-start gap-3 md:justify-around min-w-max pr-6 sm:pr-0">
            {indices.map((index) => {
              const isPositive = index.changePercent >= 0;
              return (
                <Link
                  key={index.symbol}
                  href={`/stock/${index.symbol}`}
                  className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/50 hover:bg-background hover:border-profit/10 hover:shadow-soft p-2.5 px-4 transition-all duration-200 hover:scale-[1.02] cursor-pointer animate-fade-in"
                >
                  {index.loading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-4 bg-border/40 rounded animate-pulse" />
                      <div className="w-12 h-4 bg-border/40 rounded animate-pulse" />
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col">
                        <span className="text-[10px] sm:text-[11px] font-extrabold text-text-secondary tracking-wide uppercase">
                          {index.name}
                        </span>
                        <span className="text-xs sm:text-sm font-extrabold text-text-primary mt-0.5">
                          {index.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="flex flex-col items-end">
                        <span
                          className={`text-xs font-bold ${
                            isPositive ? 'text-profit' : 'text-loss'
                          }`}
                        >
                          {isPositive ? '+' : ''}
                          {index.changePercent.toFixed(2)}%
                        </span>
                        <span
                          className={`text-[9px] sm:text-[10px] font-bold ${
                            isPositive ? 'text-profit/85' : 'text-loss/85'
                          }`}
                        >
                          {isPositive ? '+' : ''}
                          {index.change.toFixed(2)}
                        </span>
                      </div>

                      {index.chart.length > 0 && (
                        <div className="h-6 w-16 opacity-80 hidden sm:block">
                          <MiniSparkline data={index.chart} isPositive={isPositive} width={64} height={24} />
                        </div>
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
