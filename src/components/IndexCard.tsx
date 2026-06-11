'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import MiniSparkline from './MiniSparkline';

interface IndexCardProps {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  chart: number[];
  loading: boolean;
  isRealUpdate?: boolean;
}

export default function IndexCard({
  symbol,
  name,
  price,
  change,
  changePercent,
  chart,
  loading,
  isRealUpdate
}: IndexCardProps) {
  const isPositive = changePercent >= 0;
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const prevPriceRef = useRef<number>(price);

  useEffect(() => {
    if (loading || !price) return;
    if (prevPriceRef.current && prevPriceRef.current !== price) {
      if (isRealUpdate) {
        const direction = price > prevPriceRef.current ? 'up' : 'down';
        setFlash(direction);
        const timer = setTimeout(() => setFlash(null), 1500); // 1.5s lazy transition
        prevPriceRef.current = price;
        return () => clearTimeout(timer);
      }
    }
    prevPriceRef.current = price;
  }, [price, loading, isRealUpdate]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/50 p-2.5 px-4 min-w-[140px] sm:min-w-[180px]">
        <div className="flex flex-col gap-1.5 flex-1">
          <div className="w-16 h-3 bg-border/40 rounded animate-pulse" />
          <div className="w-12 h-4 bg-border/40 rounded animate-pulse" />
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className="w-8 h-3.5 bg-border/40 rounded animate-pulse" />
          <div className="w-6 h-3 bg-border/40 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <Link
      href={`/stock/${symbol}`}
      className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/50 hover:bg-background hover:border-profit/10 hover:shadow-soft p-2.5 px-4 transition-all duration-200 hover:scale-[1.02] cursor-pointer animate-fade-in"
    >
      <div className="flex flex-col">
        <span className="text-[10px] sm:text-[11px] font-extrabold text-text-secondary tracking-wide uppercase">
          {name}
        </span>
        <span className={`text-xs sm:text-sm font-extrabold mt-0.5 transition-colors ease-out rounded px-1.5 py-0.5 inline-block ${
          flash === 'up'
            ? 'text-profit duration-0'
            : flash === 'down'
            ? 'text-loss duration-0'
            : 'text-text-primary duration-[1500ms]'
        }`}>
          ₹{price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      </div>

      <div className="flex flex-col items-end">
        <span
          className={`text-xs font-bold ${
            isPositive ? 'text-profit' : 'text-loss'
          }`}
        >
          {isPositive ? '▲' : '▼'}{isPositive ? '+' : ''}{changePercent.toFixed(2)}%
        </span>
        <span
          className={`text-[9px] sm:text-[10px] font-bold ${
            isPositive ? 'text-profit/85' : 'text-loss/85'
          }`}
        >
          {isPositive ? '+' : ''}{change.toFixed(2)}
        </span>
      </div>

      {chart && chart.length > 0 && (
        <div className="h-6 w-16 opacity-80 hidden sm:block shrink-0">
          <MiniSparkline data={chart} isPositive={isPositive} width={64} height={24} />
        </div>
      )}
    </Link>
  );
}
