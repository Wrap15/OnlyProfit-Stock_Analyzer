'use client';

import React from 'react';
import { Info } from 'lucide-react';
import StockLogo from '@/components/StockLogo';

interface AlertItem {
  symbol: string;
  price: number;
  condition: 'above' | 'below';
}

interface StockRightSidebarProps {
  symbol: string;
  quote: any;
  alerts: AlertItem[];
  removeAlert: (symbol: string, price: number, condition: 'above' | 'below') => void;
  peerQuotes: any[];
  recentQuotes: any[];
  trendingQuotes: any[];
  onNavigate: (symbol: string) => void;
}

export default function StockRightSidebar({
  symbol,
  quote,
  alerts,
  removeAlert,
  peerQuotes,
  recentQuotes,
  trendingQuotes,
  onNavigate,
}: StockRightSidebarProps) {
  const activeAlerts = alerts.filter((a) => a.symbol === symbol);

  return (
    <div className="space-y-6">
      {/* Price Alerts Card */}
      {activeAlerts.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-soft dark:shadow-soft-dark space-y-4">
          <h4 className="text-xs font-black text-text-primary uppercase tracking-wider pb-2 border-b border-border/40 flex items-center justify-between">
            <span>Active Price Alerts</span>
            <span className="text-[10px] bg-profit/10 text-profit px-2 py-0.5 rounded-full font-black">
              {activeAlerts.length}
            </span>
          </h4>
          <div className="space-y-2.5">
            {activeAlerts.map((alert, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs font-bold p-3 bg-background/50 rounded-xl border border-border/40 hover:border-profit/10 transition-all">
                <div className="flex flex-col gap-0.5">
                  <span className="text-text-primary">
                    Price goes {alert.condition === 'above' ? 'above' : 'below'}
                  </span>
                  <span className="text-[10px] text-text-secondary font-black">₹{alert.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <button
                  onClick={() => removeAlert(symbol, alert.price, alert.condition)}
                  className="text-[10px] font-black text-loss hover:underline cursor-pointer"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendation card */}
      {peerQuotes.length > 0 && (
        <div className="bg-gradient-to-br from-profit/5 via-card to-card border border-border/80 rounded-2xl p-5 shadow-soft dark:shadow-soft-dark space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-profit/5 rounded-full filter blur-xl pointer-events-none" />
          
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-profit/10 text-profit border border-profit/25 select-none">
              Sector Recommendations
            </span>
            <span className="text-[9px] text-text-secondary font-bold uppercase truncate max-w-[100px]">{quote.sector}</span>
          </div>
          
          <div className="space-y-3">
            {peerQuotes.slice(0, 3).map((peer) => {
              const isPosVal = peer.regularMarketChangePercent >= 0;
              return (
                <div 
                  key={peer.symbol} 
                  onClick={() => onNavigate(peer.symbol)}
                  className="flex items-center justify-between cursor-pointer group p-1.5 rounded-xl hover:bg-background/80 transition-all border border-transparent hover:border-border/30"
                >
                  <div className="flex items-center gap-2.5">
                    <StockLogo symbol={peer.symbol} size="sm" />
                    <div className="min-w-0">
                      <span className="text-xs font-black text-text-primary group-hover:text-profit transition-colors truncate block max-w-[120px]">
                        {peer.shortName || peer.longName}
                      </span>
                      <span className="text-[9px] text-text-secondary font-black uppercase">
                        {peer.symbol.split('.')[0]}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-text-primary block">
                      ₹{peer.regularMarketPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <span className={`text-[9px] font-black inline-flex items-center gap-0.5 ${isPosVal ? 'text-profit' : 'text-loss'}`}>
                      {isPosVal ? '+' : ''}{peer.regularMarketChangePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recently Viewed Stocks */}
      {recentQuotes.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-soft dark:shadow-soft-dark space-y-4">
          <h4 className="text-xs font-black text-text-primary uppercase tracking-wider pb-2 border-b border-border/40">Recently Viewed</h4>
          <div className="space-y-3">
            {recentQuotes.map((item) => {
              const isPosVal = item.regularMarketChangePercent >= 0;
              return (
                <div 
                  key={item.symbol} 
                  onClick={() => onNavigate(item.symbol)}
                  className="flex items-center justify-between cursor-pointer group p-1.5 rounded-xl hover:bg-background/80 transition-all border border-transparent hover:border-border/30"
                >
                  <div className="flex items-center gap-2.5">
                    <StockLogo symbol={item.symbol} website={item.website} size="sm" />
                    <div className="min-w-0">
                      <span className="text-xs font-black text-text-primary group-hover:text-profit transition-colors truncate block max-w-[100px]">{item.longName}</span>
                      <span className="text-[9px] text-text-secondary font-black uppercase">{item.symbol.split('.')[0]}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-text-primary block">₹{item.regularMarketPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    <span className={`text-[9px] font-black inline-flex items-center gap-0.5 ${isPosVal ? 'text-profit' : 'text-loss'}`}>
                      {isPosVal ? '+' : ''}{item.regularMarketChangePercent.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Trending Stocks List */}
      {trendingQuotes.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-soft dark:shadow-soft-dark space-y-4">
          <h4 className="text-xs font-black text-text-primary uppercase tracking-wider pb-2 border-b border-border/40">Trending on OnlyProfit</h4>
          <div className="space-y-3">
            {trendingQuotes
              .filter((t) => t.symbol !== symbol)
              .slice(0, 4)
              .map((item) => {
                const isPosVal = item.regularMarketChangePercent >= 0;
                return (
                  <div 
                    key={item.symbol} 
                    onClick={() => onNavigate(item.symbol)}
                    className="flex items-center justify-between cursor-pointer group p-1.5 rounded-xl hover:bg-background/80 transition-all border border-transparent hover:border-border/30"
                  >
                    <div className="flex items-center gap-2.5">
                      <StockLogo symbol={item.symbol} website={item.website} size="sm" />
                      <div className="min-w-0">
                        <span className="text-xs font-black text-text-primary group-hover:text-profit transition-colors truncate block max-w-[100px]">{item.longName}</span>
                        <span className="text-[9px] text-text-secondary font-black uppercase">{item.symbol.split('.')[0]}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-text-primary block">₹{item.regularMarketPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      <span className={`text-[9px] font-black inline-flex items-center gap-0.5 ${isPosVal ? 'text-profit' : 'text-loss'}`}>
                        {isPosVal ? '+' : ''}{item.regularMarketChangePercent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
