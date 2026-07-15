'use client';

import React from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { useStockStore } from '@/store/useStockStore';
import StockLogo from '@/components/StockLogo';
import { MUTUAL_FUNDS } from '@/lib/mutualfunds';

export default function RecentlyViewedSection() {
  const { recentSearches, clearRecentSearches } = useStockStore();

  if (!recentSearches || recentSearches.length === 0) return null;

  return (
    <div className="bg-card border border-border p-5 md:p-6 rounded-2xl animate-fade-in shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
          <Search className="h-3.5 w-3.5 text-profit animate-pulse" /> Recently Viewed
        </h3>
        <button
          onClick={clearRecentSearches}
          className="text-[10px] font-bold text-text-secondary hover:text-loss transition-colors"
        >
          Clear History
        </button>
      </div>
      <div className="flex flex-wrap gap-2.5">
        {recentSearches.map((sym) => {
          const isMf = /^\d+$/.test(sym);
          const mf = isMf ? MUTUAL_FUNDS.find((f) => f.code === sym) : null;
          const displayName = mf
            ? mf.name.replace(' - Growth', '').replace(' Fund', '')
            : sym.split('.')[0];
          const href = isMf ? `/mutualfund/${sym}` : `/stock/${sym}`;
          return (
            <Link
              key={sym}
              href={href}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-background border border-border hover:border-profit/30 hover:bg-card hover-lift transition-all"
            >
              <StockLogo symbol={sym} size="sm" name={displayName} />
              <span className="text-xs font-bold text-text-primary">{displayName}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
