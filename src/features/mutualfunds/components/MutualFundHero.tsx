'use client';

import React from 'react';
import { ChevronLeft, Star } from 'lucide-react';

interface FundDetails {
  code: string;
  name: string;
  category: string;
  categoryLabel: string;
  fundHouse: string;
  schemeType: string;
  schemeCategory: string;
  latestNav: number;
  navChange: number;
  navChangePercent: number;
  rating: number;
  logoUrl?: string | null;
}

interface MutualFundHeroProps {
  fund: FundDetails;
  isFavorited: boolean;
  onToggleWatchlist: () => void;
  logoError: boolean;
  setLogoError: (err: boolean) => void;
  onBack: () => void;
}

export default function MutualFundHero({
  fund,
  isFavorited,
  onToggleWatchlist,
  logoError,
  setLogoError,
  onBack,
}: MutualFundHeroProps) {
  const isPositive = fund.navChangePercent >= 0;

  const getCategoryConfig = (cat: string) => {
    switch (cat?.toLowerCase()) {
      case 'smallcap':
        return {
          bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/20',
          textColor: 'text-emerald-600 dark:text-emerald-400'
        };
      case 'midcap':
        return {
          bgColor: 'bg-orange-500/10 dark:bg-orange-500/20 border-orange-500/20',
          textColor: 'text-orange-600 dark:text-orange-400'
        };
      case 'flexicap':
        return {
          bgColor: 'bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/20',
          textColor: 'text-blue-600 dark:text-blue-400'
        };
      case 'multicap':
        return {
          bgColor: 'bg-purple-500/10 dark:bg-purple-500/20 border-purple-500/20',
          textColor: 'text-purple-600 dark:text-purple-400'
        };
      case 'index':
      default:
        return {
          bgColor: 'bg-teal-500/10 dark:bg-teal-500/20 border-teal-500/20',
          textColor: 'text-teal-600 dark:text-teal-400'
        };
    }
  };

  const config = getCategoryConfig(fund.category);

  return (
    <div className="space-y-4">
      {/* Back navigation & Watchlist / Invest Buttons */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Mutual Funds
        </button>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleWatchlist}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer ${
              isFavorited
                ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 text-amber-500 shadow-sm'
                : 'border-border text-text-secondary bg-card hover:text-text-primary hover:bg-background'
            }`}
          >
            <Star className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
            {isFavorited ? 'Watchlisted' : 'Add to Watchlist'}
          </button>
        </div>
      </div>

      {/* Fund Header Section (Groww-Style UI) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 border-b border-border/60">
        <div className="flex items-center gap-4 flex-1">
          {/* AMC visual badge representation */}
          {fund.logoUrl && !logoError ? (
            <div className="relative flex h-16 w-16 items-center justify-center bg-white dark:bg-slate-900 overflow-hidden shrink-0 shadow-sm border border-border rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fund.logoUrl}
                alt={fund.name}
                className="object-contain w-5/6 h-5/6 select-none pointer-events-none rounded-lg"
                onError={() => setLogoError(true)}
                loading="lazy"
              />
            </div>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-profit/20 to-indigo-500/20 border border-profit/15 text-profit font-black text-base uppercase shrink-0">
              {fund.fundHouse.split(' ').slice(0, 2).map((n) => n[0]).join('')}
            </div>
          )}
          <div className="space-y-1.5 min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight leading-tight">
              {fund.name}
            </h1>
            
            <div className="flex flex-wrap items-center gap-2 select-none">
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border ${config.bgColor} ${config.textColor}`}>
                {fund.categoryLabel}
              </span>
              <span className="text-[10px] font-extrabold bg-card border border-border px-2 py-0.5 rounded-lg text-text-secondary">
                {fund.schemeType}
              </span>
              <span className="text-[10px] font-extrabold bg-card border border-border px-2 py-0.5 rounded-lg text-text-secondary">
                {fund.schemeCategory}
              </span>
              {fund.rating > 0 && (
                <div className="flex items-center gap-0.5 bg-profit/10 text-profit border border-profit/15 px-2 py-0.5 rounded-lg text-[10px] font-black">
                  <span>★</span>
                  <span>{fund.rating}★</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live NAV price */}
        <div className="flex flex-col md:items-end justify-center shrink-0">
          <span className="text-[10px] font-black uppercase tracking-wider text-text-secondary">Latest NAV</span>
          <div className="text-2xl sm:text-3xl font-black text-text-primary mt-1 font-mono">
            ₹{fund.latestNav.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className={`text-[11px] font-black mt-1 flex items-center gap-0.5 ${isPositive ? 'text-profit' : 'text-loss'}`}>
            <span>{isPositive ? '▲' : '▼'}</span>
            <span>{isPositive ? '+' : ''}{fund.navChange.toFixed(2)} ({isPositive ? '+' : ''}{fund.navChangePercent.toFixed(2)}%)</span>
          </span>
        </div>
      </div>
    </div>
  );
}
