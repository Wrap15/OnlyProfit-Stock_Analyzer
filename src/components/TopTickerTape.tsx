'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Info } from 'lucide-react';
import { apiClient as axios } from '@/lib/apiClient';
import { isIndianMarketOpen } from '@/lib/marketHours';

interface TickerItem {
  symbol: string;
  displayName: string;
  price: number;
  changePercent: number;
  isIndex: boolean;
}

const TICKER_SYMBOLS = [
  // Major Indices & Sector Departments
  '^NSEI',       // Nifty 50
  '^BSESN',      // Sensex
  '^NSEBANK',    // Nifty Bank
  '^CNXIT',      // Nifty IT
  '^CNXAUTO',    // Nifty Auto
  '^CNXPHARMA',  // Nifty Pharma
  '^CNXFMCG',    // Nifty FMCG
  '^CNXMETAL',   // Nifty Metal
  '^CNXREALTY',  // Nifty Realty
  '^CNXINFRA',   // Nifty Infra
  '^CNXENERGY',  // Nifty Energy

  // Major Stocks
  'RELIANCE.NS',
  'TCS.NS',
  'INFY.NS',
  'HDFCBANK.NS',
  'ICICIBANK.NS',
  'BHARTIARTL.NS',
  'HINDUNILVR.NS',
  'INDIGO.NS',
  'ITC.NS',
  'MARUTI.NS',
  'SBIN.NS',
  'TATASTEEL.NS',
  'AXISBANK.NS',
  'LT.NS',
  'TATAMOTORS.NS',
  'KOTAKBANK.NS',
  'SUNPHARMA.NS',
  'WIPRO.NS',
  'HCLTECH.NS',
  'ASIANPAINT.NS',
  'TITAN.NS',
  'BAJFINANCE.NS',
  'NTPC.NS',
  'POWERGRID.NS',
  'COALINDIA.NS',
  'ONGC.NS',
  'JSWSTEEL.NS',
  'M&M.NS',
  'GET&D.NS',
  'SIEMENS.NS',
  'POWERINDIA.NS',
  'CGPOWER.NS',
  'CHOLAFIN.NS'
];

const INDEX_NAME_MAP: Record<string, string> = {
  '^NSEI': 'NIFTY 50',
  '^BSESN': 'SENSEX',
  '^NSEBANK': 'NIFTY BANK',
  '^CNXIT': 'NIFTY IT',
  '^CNXAUTO': 'NIFTY AUTO',
  '^CNXPHARMA': 'NIFTY PHARMA',
  '^CNXFMCG': 'NIFTY FMCG',
  '^CNXMETAL': 'NIFTY METAL',
  '^CNXREALTY': 'NIFTY REALTY',
  '^CNXINFRA': 'NIFTY INFRA',
  '^CNXENERGY': 'NIFTY ENERGY'
};

export default function TopTickerTape() {
  const [items, setItems] = useState<TickerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch Quotes
  const fetchTickerData = async () => {
    try {
      const symbolsParam = TICKER_SYMBOLS.join(',');
      const res = await axios.get(`/api/stock/quote?symbols=${symbolsParam}`);
      if (Array.isArray(res.data)) {
        const mapped = res.data.map((item: any) => {
          const isIndex = item.symbol.startsWith('^');
          const cleanSymbol = item.symbol.replace('.NS', '');
          const displayName = isIndex 
            ? (INDEX_NAME_MAP[item.symbol] || cleanSymbol)
            : cleanSymbol;
          return {
            symbol: item.symbol,
            displayName: displayName,
            price: item.regularMarketPrice || 0,
            changePercent: item.regularMarketChangePercent || 0,
            isIndex: isIndex
          };
        });
        setItems(mapped);
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch ticker tape stock/index data', err);
    }
  };

  useEffect(() => {
    fetchTickerData();
    
    // Poll every 12 seconds if market is open
    const interval = setInterval(() => {
      if (isIndianMarketOpen()) {
        fetchTickerData();
      }
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  // Marquee scroll animation
  useEffect(() => {
    if (loading || items.length === 0) return;
    const el = scrollRef.current;
    if (!el) return;

    let frameId: number;
    const speed = 0.55; // Pixels scrolled per animation frame

    const animate = () => {
      // Scrolling is active only during Indian stock market hours
      if (isIndianMarketOpen()) {
        el.scrollLeft += speed;
        // Reset scroll position once we've scrolled past the first set of items
        if (el.scrollLeft >= el.scrollWidth / 2) {
          el.scrollLeft = 0;
        }
      }
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [loading, items]);

  if (loading && items.length === 0) {
    return (
      <div className="w-full bg-[#0c1319] border-b border-slate-800/80 h-9 flex items-center justify-center select-none text-[11px] text-slate-500 font-extrabold uppercase tracking-widest">
        Loading live ticker quotes...
      </div>
    );
  }

  // Duplicate items list for seamless looping marquee
  const displayItems = [...items, ...items];

  return (
    <div className="relative w-full bg-[#0c1319] dark:bg-[#080d11] border-b border-slate-800/50 h-9 flex items-center select-none z-40 overflow-hidden shadow-sm">
      
      {/* Ticker Items Container (Full-width edge-to-edge) */}
      <div 
        ref={scrollRef}
        className="flex items-center overflow-x-auto scrollbar-none py-1.5 px-4 w-full gap-7 scroll-smooth"
        style={{ willChange: 'scroll-position' }}
      >
        {displayItems.map((item, index) => {
          const isPositive = item.changePercent >= 0;
          return (
            <div 
              key={`${item.symbol}-${index}`}
              onClick={() => {
                const cleanSym = item.symbol.replace('.NS', '').replace('.BO', '');
                router.push(`/stock/${encodeURIComponent(cleanSym)}`);
              }}
              className="flex items-center gap-1.5 shrink-0 cursor-pointer hover:bg-slate-800/30 px-2 py-1 rounded transition-colors group"
            >
              {/* Optional Info Icon for the first item */}
              {index % items.length === 0 && (
                <Info className="h-3 w-3 text-slate-500 group-hover:text-slate-400 shrink-0" />
              )}

              <span className={`text-[11px] font-black font-mono tracking-tight uppercase transition-colors ${
                item.isIndex 
                  ? 'text-white group-hover:text-profit' 
                  : 'text-slate-300 group-hover:text-white'
              }`}>
                {item.displayName}
              </span>
              <span className="text-[11px] font-extrabold text-slate-200 font-mono tracking-tight tabular-nums">
                {item.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className={`text-[10px] font-black flex items-center gap-0.5 font-mono tracking-tighter tabular-nums ${
                isPositive ? 'text-[#10b981]' : 'text-[#f43f5e]'
              }`}>
                <span>{isPositive ? '▲' : '▼'}</span>
                <span>{Math.abs(item.changePercent).toFixed(2)}%</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
