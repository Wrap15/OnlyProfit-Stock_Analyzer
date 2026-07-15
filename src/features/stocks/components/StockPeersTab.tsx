'use client';

import React, { useState } from 'react';
import StockLogo from '@/components/StockLogo';

interface StockPeersTabProps {
  peerQuotes: any[];
  peersLoading: boolean;
  formatIndianNumber: (num: number, isCurrency?: boolean) => string;
  onAnalyze: (symbol: string) => void;
}

export default function StockPeersTab({
  peerQuotes,
  peersLoading,
  formatIndianNumber,
  onAnalyze,
}: StockPeersTabProps) {
  const [peerSortKey, setPeerSortKey] = useState<'price' | 'pe' | 'mcap'>('mcap');

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-soft dark:shadow-soft-dark space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <h3 className="font-extrabold text-sm text-text-primary uppercase tracking-wider">
            Sector Peers
          </h3>
          <p className="text-[10px] text-text-secondary font-medium mt-0.5">Benchmark performance indicators with sector competitors.</p>
        </div>
        
        {/* Sorting columns */}
        <div className="flex items-center gap-2 text-xs font-bold text-text-secondary">
          <span>Sort by:</span>
          <select
            value={peerSortKey}
            onChange={(e) => setPeerSortKey(e.target.value as any)}
            className="bg-background border border-border/80 rounded-xl px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-profit text-text-primary font-black"
          >
            <option value="mcap">Market Cap</option>
            <option value="price">Market Price</option>
            <option value="pe">P/E Ratio</option>
          </select>
        </div>
      </div>

      {peersLoading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-profit border-t-transparent" />
          <span className="text-[10px] text-text-secondary font-black">Fetching sector competitors...</span>
        </div>
      ) : peerQuotes.length === 0 ? (
        <p className="text-xs text-text-secondary font-medium text-center py-12">No sector peers found for this symbol.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-bold min-w-[500px]">
            <thead>
              <tr className="border-b border-border/80 text-[10px] font-bold text-text-secondary uppercase">
                <th className="py-2.5">Company</th>
                <th className="py-2.5 text-right">Price</th>
                <th className="py-2.5 text-right">1D Change</th>
                <th className="py-2.5 text-right">P/E Ratio</th>
                <th className="py-2.5 text-right">Market Cap</th>
                <th className="py-2.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {peerQuotes
                .sort((a, b) => {
                  if (peerSortKey === 'price') return b.regularMarketPrice - a.regularMarketPrice;
                  if (peerSortKey === 'pe') return (b.trailingPE || 999) - (a.trailingPE || 999);
                  return b.marketCap - a.marketCap;
                })
                .map((peer) => {
                  const isPeerPos = peer.regularMarketChangePercent >= 0;
                  return (
                    <tr key={peer.symbol} className="hover:bg-background/40 transition-colors">
                      <td className="py-3 text-text-primary font-black flex items-center gap-2">
                        <StockLogo symbol={peer.symbol} size="sm" />
                        <div className="min-w-0">
                          <span className="block truncate max-w-[120px] sm:max-w-[200px]">{peer.longName}</span>
                          <span className="text-[9px] text-text-secondary font-bold uppercase">{peer.symbol.split('.')[0]}</span>
                        </div>
                      </td>
                      <td className="py-3 text-right">₹{peer.regularMarketPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className={`py-3 text-right ${isPeerPos ? 'text-profit' : 'text-loss'}`}>
                        {isPeerPos ? '+' : ''}{peer.regularMarketChangePercent.toFixed(2)}%
                      </td>
                      <td className="py-3 text-right">{peer.trailingPE ? peer.trailingPE.toFixed(1) : 'N/A'}</td>
                      <td className="py-3 text-right">{formatIndianNumber(peer.marketCap, true)}</td>
                      <td className="py-3 text-center">
                        <button
                          onClick={() => onAnalyze(peer.symbol)}
                          className="px-2.5 py-1 text-[9px] rounded-lg border border-border bg-card hover:bg-background hover:text-profit font-black transition-colors cursor-pointer"
                        >
                          Analyze
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
