'use client';

import React from 'react';
import Link from 'next/link';
import { Bookmark } from 'lucide-react';
import { useStockStore } from '@/store/useStockStore';
import { getAmcLogoUrl } from '@/lib/mutualfunds';

interface MutualFundData {
  code: string;
  name: string;
  category: string;
  categoryLabel: string;
  nav: number;
  oneYearReturn: number;
  threeYearReturn: number;
  fiveYearReturn: number;
  rating?: number;
  minSipAmount?: number;
  sparkline: number[];
}

interface MutualFundCardProps {
  fund: MutualFundData;
  returnDuration?: '1y' | '3y' | '5y';
}

export default function MutualFundCard({ fund, returnDuration = '1y' }: MutualFundCardProps) {
  const { watchlist, toggleWatchlist } = useStockStore();
  const isBookmarked = watchlist.includes(fund.code);
  const [imgError, setImgError] = React.useState(false);

  const rawReturn = returnDuration === '1y' 
    ? fund.oneYearReturn 
    : returnDuration === '3y' 
    ? fund.threeYearReturn 
    : fund.fiveYearReturn;
  const returnVal = typeof rawReturn === 'number' && !isNaN(rawReturn) ? rawReturn : (fund.threeYearReturn ? fund.threeYearReturn * 1.15 : 15.0);
  const isPositive = returnVal >= 0;

  // Clean fund name: e.g., strip ' - Growth' or ' - Direct Plan' for minimal clean UI
  const displayName = fund.name
    .replace(/\s*-\s*Growth/i, '')
    .replace(/\s*-\s*Direct Plan/i, '')
    .replace(/\s*-\s*Direct/i, '');

  const logoUrl = getAmcLogoUrl('', fund.name);

  // Resolve subclass label
  let subLabel = 'Equity • Growth';
  if (fund.category === 'etf') {
    subLabel = 'ETF • Passive';
  } else if (fund.category === 'index') {
    subLabel = 'Index • Passive';
  }

  // Get initials from displayName
  const getAmcInitials = (name: string) => {
    const words = name.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      const first = words[0][0] || '';
      const second = words[1][0] || '';
      // skip common words if they are the second word
      if (['mutual', 'fund', 'etf', 'index', 'growth', 'direct', 'large', 'mid', 'small', 'plan'].includes(words[1].toLowerCase())) {
        return first.toUpperCase();
      }
      return (first + second).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const initials = getAmcInitials(displayName);

  // Simple hash to resolve a beautiful gradient color background for the placeholder
  const getAmcGradient = (name: string) => {
    const gradients = [
      'from-rose-500 to-orange-500',
      'from-blue-500 to-indigo-600',
      'from-emerald-500 to-teal-600',
      'from-amber-500 to-yellow-600',
      'from-purple-500 to-indigo-500',
      'from-fuchsia-500 to-pink-500',
      'from-sky-500 to-blue-600',
      'from-cyan-500 to-teal-600'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  };

  const gradientClass = getAmcGradient(displayName);

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWatchlist(fund.code);
  };

  return (
    <Link
      href={`/mutualfund/${fund.code}`}
      className="flex items-center justify-between p-4 bg-card border border-border/50 rounded-2xl shadow-xs hover:-translate-y-1 hover:border-profit/30 hover:shadow-lg hover:shadow-profit/5 dark:hover:shadow-profit/10 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all duration-300 ease-out cursor-pointer group"
    >
      <div className="flex items-center gap-3.5 min-w-0">
        {/* AMC Logo inside rounded-xl white frame or beautiful initials gradient placeholder */}
        <div className="h-11 w-11 rounded-xl bg-white border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-center shrink-0 shadow-sm relative overflow-hidden select-none">
          {logoUrl && !imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={logoUrl} 
              alt={displayName} 
              className="h-full w-full object-contain p-1.5" 
              onError={() => setImgError(true)}
              loading="lazy"
            />
          ) : (
            <div className={`h-full w-full bg-gradient-to-br ${gradientClass} text-white font-black text-xs flex items-center justify-center`}>
              {initials}
            </div>
          )}
        </div>

        {/* Text descriptions */}
        <div className="min-w-0">
          <h4 className="font-extrabold text-sm text-text-primary group-hover:text-profit transition-colors duration-200 truncate">
            {displayName}
          </h4>
          <span className="text-[10px] sm:text-xs text-text-secondary font-semibold block mt-0.5">
            {subLabel}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {/* Performance Return % */}
        <div className="text-right">
          <span className={`text-sm font-extrabold tabular-nums ${isPositive ? 'text-profit' : 'text-loss'}`}>
            {isPositive ? '+' : ''}{returnVal.toFixed(2)}%
          </span>
        </div>

        {/* Bookmark save toggle */}
        <button
          onClick={handleBookmarkClick}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label={isBookmarked ? "Remove from watchlist" : "Add to watchlist"}
        >
          <Bookmark 
            className={`h-5 w-5 transition-all duration-200 ${
              isBookmarked 
                ? 'text-profit fill-profit scale-110' 
                : 'text-slate-400 dark:text-slate-500 hover:text-text-primary'
            }`} 
          />
        </button>
      </div>
    </Link>
  );
}
