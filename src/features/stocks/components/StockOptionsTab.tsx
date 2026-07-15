'use client';

import React, { useState, useRef, useMemo } from 'react';
import { calculateOptionPrice } from '@/lib/foUtils';
import { Info } from 'lucide-react';

interface ExpiryDate {
  label: string;
  value: string;
}

interface StockOptionsTabProps {
  symbol: string;
  quote: any;
  expiryDates: ExpiryDate[];
  selectedExpiry: string;
  setSelectedExpiry: (expiry: string) => void;
  onTrade: (symbol: string, name: string, price: number) => void;
}

export default function StockOptionsTab({
  symbol,
  quote,
  expiryDates,
  selectedExpiry,
  setSelectedExpiry,
  onTrade,
}: StockOptionsTabProps) {
  const spot = quote.regularMarketPrice ?? 0;
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  // Height of each virtualized row
  const ROW_HEIGHT = 48;
  const VISIBLE_HEIGHT = 400; // height of viewport container
  const BUFFER_ITEMS = 4;

  const optionChainData = useMemo(() => {
    if (!spot || spot === 0) return { strikes: [], atmStrike: 0 };

    let interval = 100;
    if (spot < 100) interval = 5;
    else if (spot < 500) interval = 10;
    else if (spot < 1000) interval = 20;
    else if (spot < 5000) interval = 50;

    const atmStrike = Math.round(spot / interval) * interval;
    
    // Generate a professional 41 strikes chain (from -20 to +20 strikes around ATM)
    const strikesList: number[] = [];
    for (let i = -20; i <= 20; i++) {
      strikesList.push(atmStrike + i * interval);
    }
    return { strikes: strikesList, atmStrike };
  }, [spot]);

  // Handle scroll to calculate current index range
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const totalRows = optionChainData.strikes.length;
  const totalHeight = totalRows * ROW_HEIGHT;

  // Calculate slice indices
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER_ITEMS);
  const endIndex = Math.min(totalRows - 1, Math.floor((scrollTop + VISIBLE_HEIGHT) / ROW_HEIGHT) + BUFFER_ITEMS);

  const visibleStrikes = useMemo(() => {
    return optionChainData.strikes.slice(startIndex, endIndex + 1).map((strike, idx) => ({
      strike,
      originalIndex: startIndex + idx
    }));
  }, [optionChainData.strikes, startIndex, endIndex]);

  // Auto scroll to ATM strike when component mounts
  React.useEffect(() => {
    if (containerRef.current && optionChainData.strikes.length > 0) {
      const atmIndex = optionChainData.strikes.indexOf(optionChainData.atmStrike);
      if (atmIndex !== -1) {
        // Center ATM strike in view
        const scrollPosition = atmIndex * ROW_HEIGHT - (VISIBLE_HEIGHT / 2) + (ROW_HEIGHT / 2);
        containerRef.current.scrollTop = Math.max(0, scrollPosition);
        setScrollTop(Math.max(0, scrollPosition));
      }
    }
  }, [optionChainData.strikes, optionChainData.atmStrike]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Option Chain Header & Expiry selector */}
      <div className="bg-card border border-border p-5 rounded-2xl shadow-soft dark:shadow-soft-dark space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h3 className="text-base font-extrabold text-text-primary tracking-tight">Option Chain Matrix</h3>
            <p className="text-xs text-text-secondary mt-1">
              Scroll table vertically to navigate strikes. ATM centered dynamically at ₹{spot.toFixed(2)}
            </p>
          </div>
          
          {/* Expiry Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[10px] font-black text-text-secondary uppercase tracking-wider shrink-0 mr-1">Expiry:</span>
            {expiryDates.map((d) => (
              <button
                key={d.value}
                onClick={() => setSelectedExpiry(d.value)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap cursor-pointer bg-background hover:bg-card-hover/20 text-text-secondary border-border"
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Virtualized Table Container */}
        <div className="border border-border/85 rounded-2xl overflow-hidden bg-background/25">
          {/* Header row */}
          <table className="w-full text-left border-collapse min-w-[700px] table-fixed">
            <thead>
              <tr className="border-b border-border text-[10px] font-black text-text-secondary bg-card text-center uppercase tracking-widest">
                <th colSpan={3} className="p-3 border-r border-border/60 text-emerald-400 bg-emerald-500/5 w-[42%]">Call Options (CE)</th>
                <th className="p-3 w-[16%]">Strike</th>
                <th colSpan={3} className="p-3 border-l border-border/60 text-rose-400 bg-rose-500/5 w-[42%]">Put Options (PE)</th>
              </tr>
              <tr className="border-b border-border/60 text-[9px] font-black text-text-secondary uppercase tracking-widest text-center bg-card-hover/25">
                <th className="p-2.5 bg-emerald-500/5 w-[14%]">Change%</th>
                <th className="p-2.5 bg-emerald-500/5 w-[14%]">LTP (CE)</th>
                <th className="p-2.5 border-r border-border/60 bg-emerald-500/5 w-[14%]">Trade</th>
                <th className="p-2.5 bg-card font-black text-text-primary text-xs w-[16%]">Strike Price</th>
                <th className="p-2.5 border-l border-border/60 bg-rose-500/5 w-[14%]">Trade</th>
                <th className="p-2.5 bg-rose-500/5 w-[14%]">LTP (PE)</th>
                <th className="p-2.5 bg-rose-500/5 w-[14%]">Change%</th>
              </tr>
            </thead>
          </table>

          {/* Scrollable container with fixed height */}
          <div 
            ref={containerRef}
            onScroll={handleScroll}
            className="overflow-y-auto scrollbar-none relative" 
            style={{ height: `${VISIBLE_HEIGHT}px` }}
          >
            {/* Total height spacer */}
            <div style={{ height: `${totalHeight}px`, width: '100%', position: 'relative' }}>
              
              {/* Visible sliced items */}
              <div 
                className="absolute w-full left-0 top-0" 
                style={{ transform: `translateY(${startIndex * ROW_HEIGHT}px)` }}
              >
                <table className="w-full text-left border-collapse min-w-[700px] table-fixed">
                  <tbody>
                    {visibleStrikes.map(({ strike }) => {
                      const callOpt = calculateOptionPrice(spot, strike, selectedExpiry, 'CE');
                      const putOpt = calculateOptionPrice(spot, strike, selectedExpiry, 'PE');
                      
                      const callChangePositive = callOpt.change >= 0;
                      const putChangePositive = putOpt.change >= 0;
                      
                      const isATM = strike === optionChainData.atmStrike;
                      const callSymbol = `${symbol.split('.')[0]}-${selectedExpiry}-${strike}-CE`;
                      const putSymbol = `${symbol.split('.')[0]}-${selectedExpiry}-${strike}-PE`;
                      
                      const callName = `${symbol.split('.')[0]} ${selectedExpiry} ${strike} CE`;
                      const putName = `${symbol.split('.')[0]} ${selectedExpiry} ${strike} PE`;

                      return (
                        <tr 
                          key={strike} 
                          style={{ height: `${ROW_HEIGHT}px` }}
                          className={`border-b border-border/20 text-xs font-bold text-center transition-colors hover:bg-card-hover/5 ${
                            isATM ? 'bg-emerald-500/5 dark:bg-emerald-500/2 border-y border-emerald-500/10' : ''
                          }`}
                        >
                          {/* CALL DATA */}
                          <td 
                            onClick={() => onTrade(callSymbol, callName, callOpt.price)}
                            className={`p-2.5 bg-emerald-500/5 tabular-nums cursor-pointer hover:bg-emerald-500/10 transition-colors w-[14%] ${callChangePositive ? 'text-profit' : 'text-loss'}`}
                          >
                            {callChangePositive ? '+' : ''}{callOpt.pct.toFixed(2)}%
                          </td>
                          <td 
                            onClick={() => onTrade(callSymbol, callName, callOpt.price)}
                            className="p-2.5 bg-emerald-500/5 font-mono font-black text-text-primary tabular-nums cursor-pointer hover:bg-emerald-500/10 transition-colors w-[14%]"
                          >
                            ₹{callOpt.price.toFixed(2)}
                          </td>
                          <td className="p-2.5 bg-emerald-500/5 border-r border-border/60 w-[14%]">
                            <button
                              onClick={() => onTrade(callSymbol, callName, callOpt.price)}
                              className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-black rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                            >
                              Trade
                            </button>
                          </td>

                          {/* STRIKE PRICE */}
                          <td className={`p-2.5 font-mono font-black text-xs text-center select-none w-[16%] ${
                            isATM 
                              ? 'text-emerald-400 font-extrabold bg-emerald-500/10 border-x border-emerald-500/20 shadow-inner' 
                              : 'text-text-primary bg-background'
                          }`}>
                            <div className="relative">
                              {strike}
                              {isATM && (
                                <span className="absolute right-0 top-0 text-[6px] font-black px-1 rounded bg-emerald-500 text-black uppercase tracking-widest scale-90">ATM</span>
                              )}
                            </div>
                          </td>

                          {/* PUT DATA */}
                          <td className="p-2.5 bg-rose-500/5 border-l border-border/60 w-[14%]">
                            <button
                              onClick={() => onTrade(putSymbol, putName, putOpt.price)}
                              className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-black rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                            >
                              Trade
                            </button>
                          </td>
                          <td 
                            onClick={() => onTrade(putSymbol, putName, putOpt.price)}
                            className="p-2.5 bg-rose-500/5 font-mono font-black text-text-primary tabular-nums cursor-pointer hover:bg-rose-500/10 transition-colors w-[14%]"
                          >
                            ₹{putOpt.price.toFixed(2)}
                          </td>
                          <td 
                            onClick={() => onTrade(putSymbol, putName, putOpt.price)}
                            className={`p-2.5 bg-rose-500/5 tabular-nums cursor-pointer hover:bg-rose-500/10 transition-colors w-[14%] ${putChangePositive ? 'text-profit' : 'text-loss'}`}
                          >
                            {putChangePositive ? '+' : ''}{putOpt.pct.toFixed(2)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-background border border-border/80 text-[10px] text-text-secondary font-medium">
          <Info className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
          <span>
            This virtualized list displays 41 active option contracts (CE & PE) centered dynamically. Virtualization ensures 60 FPS scrolling and low memory footprint on low-end devices.
          </span>
        </div>
      </div>
    </div>
  );
}
