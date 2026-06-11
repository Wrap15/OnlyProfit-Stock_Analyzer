'use client';

import React from 'react';
import Link from 'next/link';
import MiniSparkline from './MiniSparkline';
import { Shield, Sparkles, Layers, TrendingUp, Compass } from 'lucide-react';

interface MutualFundData {
  code: string;
  name: string;
  category: string;
  categoryLabel: string;
  nav: number;
  oneYearReturn: number;
  threeYearReturn: number;
  rating?: number;
  minSipAmount?: number;
  sparkline: number[];
}

interface MutualFundCardProps {
  fund: MutualFundData;
}

export default function MutualFundCard({ fund }: MutualFundCardProps) {
  const isPositive = fund.oneYearReturn >= 0;

  // Resolve category icon and theme color
  const getCategoryConfig = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'smallcap':
        return {
          icon: <Sparkles className="h-4.5 w-4.5 text-emerald-500" />,
          bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/20',
          textColor: 'text-emerald-600 dark:text-emerald-400'
        };
      case 'midcap':
        return {
          icon: <TrendingUp className="h-4.5 w-4.5 text-orange-500" />,
          bgColor: 'bg-orange-500/10 dark:bg-orange-500/20 border-orange-500/20',
          textColor: 'text-orange-600 dark:text-orange-400'
        };
      case 'flexicap':
        return {
          icon: <Compass className="h-4.5 w-4.5 text-blue-500" />,
          bgColor: 'bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/20',
          textColor: 'text-blue-600 dark:text-blue-400'
        };
      case 'multicap':
        return {
          icon: <Layers className="h-4.5 w-4.5 text-purple-500" />,
          bgColor: 'bg-purple-500/10 dark:bg-purple-500/20 border-purple-500/20',
          textColor: 'text-purple-600 dark:text-purple-400'
        };
      case 'index':
      default:
        return {
          icon: <Shield className="h-4.5 w-4.5 text-teal-500" />,
          bgColor: 'bg-teal-500/10 dark:bg-teal-500/20 border-teal-500/20',
          textColor: 'text-teal-600 dark:text-teal-400'
        };
    }
  };

  const config = getCategoryConfig(fund.category);

  return (
    <div className="flex flex-col w-full rounded-2xl border border-border bg-card p-5 shadow-soft dark:shadow-soft-dark hover:shadow-premium dark:hover:shadow-premium-dark hover:border-profit/20 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 overflow-hidden animate-fade-in gpu-layer">
      
      <Link href={`/mutualfund/${fund.code}`} className="group flex flex-col flex-grow cursor-pointer">
        {/* Header Info */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-3 min-w-0">
            {/* Category Avatar Icon */}
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${config.bgColor}`}>
              {config.icon}
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-sm text-text-primary tracking-tight truncate group-hover:text-profit transition-colors duration-200">
                {fund.name.replace(' - Growth', '')}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${config.bgColor} ${config.textColor}`}>
                  {fund.categoryLabel}
                </span>
                {fund.rating !== undefined && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/15 text-amber-500 select-none">
                    ★ {fund.rating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* NAV Display Section */}
        <div className="mt-5 flex items-baseline justify-between">
          <div>
            <span className="block text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">Net Asset Value (NAV)</span>
            <div className="text-xl font-black text-text-primary tracking-tight mt-0.5">
              ₹{fund.nav.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
          
          {/* CAGR Return Badge */}
          <div className="text-right">
            <span className="block text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">3Y Return (cagr)</span>
            <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-lg bg-profit/10 text-profit border border-profit/15 text-xs font-black">
              {fund.threeYearReturn.toFixed(2)}% p.a.
            </span>
          </div>
        </div>

        {/* Sparkline Visual History */}
        <div className="flex items-end justify-between mt-6 pt-3 border-t border-border/30">
          <div className="flex flex-col">
            <span className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">
              1Y Return
            </span>
            <span className={`text-xs font-black mt-0.5 ${fund.oneYearReturn >= 0 ? 'text-profit' : 'text-loss'}`}>
              {fund.oneYearReturn >= 0 ? '+' : ''}{fund.oneYearReturn.toFixed(2)}%
            </span>
          </div>
          
          {fund.minSipAmount !== undefined && (
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">
                Min. SIP
              </span>
              <span className="text-xs font-black text-text-primary mt-0.5">
                ₹{fund.minSipAmount}
              </span>
            </div>
          )}
          
          {fund.sparkline.length > 0 && (
            <div className="h-8 w-24 opacity-85 hover:opacity-100 transition-opacity">
              <MiniSparkline data={fund.sparkline} isPositive={isPositive} width={96} height={32} />
            </div>
          )}
        </div>
      </Link>



    </div>
  );
}
