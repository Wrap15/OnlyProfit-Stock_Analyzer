'use client';

import React, { useState, useEffect, useMemo } from 'react';

interface MarketDepthProps {
  livePrice: number;
  symbol: string;
}

interface DepthEntry {
  orders: number;
  qty: number;
  price: number;
}

export default function MarketDepth({ livePrice, symbol }: MarketDepthProps) {
  const [tick, setTick] = useState(0);

  // Generate realistic 5-level Order Depth based on current livePrice
  const { bids, asks, totalBuyQty, totalSellQty, spread } = useMemo(() => {
    const base = livePrice > 0 ? livePrice : 1000;
    
    // Slight jitter based on symbol seed and tick
    const hash = symbol.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) + tick;
    
    const bidsData: DepthEntry[] = [];
    const asksData: DepthEntry[] = [];
    
    let buySum = 0;
    let sellSum = 0;

    for (let i = 0; i < 5; i++) {
      const bidDiff = (i + 1) * 0.05 + ((hash + i * 7) % 3) * 0.05;
      const askDiff = (i + 1) * 0.05 + ((hash + i * 11) % 3) * 0.05;

      const bidPrice = Math.max(0.05, parseFloat((base - bidDiff).toFixed(2)));
      const askPrice = parseFloat((base + askDiff).toFixed(2));

      const bidOrders = 1 + ((hash * 3 + i * 13) % 24);
      const askOrders = 1 + ((hash * 5 + i * 17) % 22);

      const bidQty = ((hash + i * 101) % 450 + 50) * 15;
      const askQty = ((hash + i * 107) % 430 + 40) * 15;

      buySum += bidQty;
      sellSum += askQty;

      bidsData.push({ orders: bidOrders, qty: bidQty, price: bidPrice });
      asksData.push({ orders: askOrders, qty: askQty, price: askPrice });
    }

    const currentSpread = asksData[0] && bidsData[0] 
      ? parseFloat((asksData[0].price - bidsData[0].price).toFixed(2)) 
      : 0.10;

    return {
      bids: bidsData,
      asks: asksData,
      totalBuyQty: buySum,
      totalSellQty: sellSum,
      spread: currentSpread
    };
  }, [livePrice, symbol, tick]);

  // Subtle live tick refresh (every 1.2s to simulate real exchange order matching)
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(prev => (prev + 1) % 1000);
    }, 1200);
    return () => clearInterval(timer);
  }, []);

  const maxQty = Math.max(
    ...bids.map(b => b.qty),
    ...asks.map(a => a.qty),
    1
  );

  const buyRatio = (totalBuyQty / (totalBuyQty + totalSellQty)) * 100;
  const sellRatio = 100 - buyRatio;

  return (
    <div className="bg-card border border-border/70 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-profit animate-ping" />
          <span className="text-xs font-black text-text-primary tracking-wide uppercase font-sans flex items-center gap-1.5">
            Level 2 Market Depth <span className="text-[10px] text-text-secondary font-normal">(5 Bids / 5 Asks)</span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-sans">
          <span className="text-text-secondary">Spread:</span>
          <span className="font-bold text-text-primary bg-background/80 px-2 py-0.5 rounded border border-border/50">
            ₹{spread.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Depth Table Grid */}
      <div className="grid grid-cols-2 gap-3 text-[10.5px]">
        {/* Bids Column */}
        <div className="space-y-1.5">
          <div className="grid grid-cols-3 text-[9px] font-black uppercase tracking-wider text-text-secondary pb-1 border-b border-border/30 px-1 font-sans">
            <span>Orders</span>
            <span className="text-right">Qty</span>
            <span className="text-right text-profit font-black">Bid Price</span>
          </div>
          {bids.map((bid, idx) => {
            const fillWidth = (bid.qty / maxQty) * 100;
            return (
              <div
                key={`bid-${idx}`}
                className="relative grid grid-cols-3 py-1 px-1.5 rounded text-text-primary items-center overflow-hidden hover:bg-profit/5 transition-colors"
              >
                {/* Volume Depth Fill Bar */}
                <div
                  className="absolute right-0 top-0 bottom-0 bg-profit/15 -z-10 rounded transition-all duration-300"
                  style={{ width: `${fillWidth}%` }}
                />
                <span className="text-text-secondary text-[10px]">{bid.orders}</span>
                <span className="text-right font-medium">{bid.qty.toLocaleString('en-IN')}</span>
                <span className="text-right font-bold text-profit">₹{bid.price.toFixed(2)}</span>
              </div>
            );
          })}
          {/* Total Bids */}
          <div className="pt-2 border-t border-border/30 flex justify-between text-[10px] px-1 font-sans font-bold">
            <span className="text-text-secondary">Total Bids</span>
            <span className="text-profit font-mono">{totalBuyQty.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Asks Column */}
        <div className="space-y-1.5">
          <div className="grid grid-cols-3 text-[9px] font-black uppercase tracking-wider text-text-secondary pb-1 border-b border-border/30 px-1 font-sans">
            <span className="text-loss font-black">Ask Price</span>
            <span className="text-right">Orders</span>
            <span className="text-right">Qty</span>
          </div>
          {asks.map((ask, idx) => {
            const fillWidth = (ask.qty / maxQty) * 100;
            return (
              <div
                key={`ask-${idx}`}
                className="relative grid grid-cols-3 py-1 px-1.5 rounded text-text-primary items-center overflow-hidden hover:bg-loss/5 transition-colors"
              >
                {/* Volume Depth Fill Bar */}
                <div
                  className="absolute left-0 top-0 bottom-0 bg-loss/15 -z-10 rounded transition-all duration-300"
                  style={{ width: `${fillWidth}%` }}
                />
                <span className="font-bold text-loss">₹{ask.price.toFixed(2)}</span>
                <span className="text-right text-text-secondary text-[10px]">{ask.orders}</span>
                <span className="text-right font-medium">{ask.qty.toLocaleString('en-IN')}</span>
              </div>
            );
          })}
          {/* Total Asks */}
          <div className="pt-2 border-t border-border/30 flex justify-between text-[10px] px-1 font-sans font-bold">
            <span className="text-text-secondary">Total Asks</span>
            <span className="text-loss font-mono">{totalSellQty.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Buyer vs Seller Strength Bar (Groww & Angel One signature meter) */}
      <div className="space-y-1.5 pt-2 border-t border-border/40 font-sans">
        <div className="flex justify-between items-center text-[10px] font-bold">
          <span className="text-profit flex items-center gap-1">
            Buyers {buyRatio.toFixed(1)}%
          </span>
          <span className="text-loss flex items-center gap-1">
            Sellers {sellRatio.toFixed(1)}%
          </span>
        </div>
        <div className="h-2 w-full bg-loss/40 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-profit transition-all duration-500 rounded-l-full"
            style={{ width: `${buyRatio}%` }}
          />
        </div>
      </div>
    </div>
  );
}
