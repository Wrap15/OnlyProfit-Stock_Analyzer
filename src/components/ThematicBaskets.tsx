'use client';

import React from 'react';
import Link from 'next/link';
import StockLogo from './StockLogo';
import { Layers, Sparkles, TrendingUp, Landmark } from 'lucide-react';

interface BasketData {
  id: string;
  name: string;
  type: 'Thematic' | 'Sectoral';
  description: string;
  cagr: number;
  members: string[];
  color: string;
  icon: React.ReactNode;
}

export default function ThematicBaskets() {
  const baskets: BasketData[] = [
    {
      id: 'tata',
      name: 'House of Tata',
      type: 'Thematic',
      description: 'Diversified exposure into India\'s most trusted conglomerate, balancing legacy and innovation.',
      cagr: 19.5,
      members: ['TCS.NS', 'TMPV.NS', 'TMCV.NS', 'TATASTEEL.NS', 'TITAN.NS'],
      color: 'from-blue-600/10 to-indigo-600/10 border-blue-500/20 text-blue-600 dark:text-blue-400',
      icon: <Sparkles className="h-4.5 w-4.5 text-blue-500" />
    },
    {
      id: 'it',
      name: 'IT Leaders',
      type: 'Sectoral',
      description: 'Capitalize on global digitization by investing in India\'s largest software exporters and consultants.',
      cagr: 15.2,
      members: ['TCS.NS', 'INFY.NS', 'WIPRO.NS', 'HCLTECH.NS'],
      color: 'from-emerald-600/10 to-teal-600/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
      icon: <Layers className="h-4.5 w-4.5 text-emerald-500" />
    },
    {
      id: 'banking',
      name: 'Banking Kings',
      type: 'Sectoral',
      description: 'High-liquidity banking institutions fueling India\'s retail credit growth and infrastructure capital.',
      cagr: 14.8,
      members: ['HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'AXISBANK.NS'],
      color: 'from-purple-600/10 to-pink-600/10 border-purple-500/20 text-purple-600 dark:text-purple-400',
      icon: <Landmark className="h-4.5 w-4.5 text-purple-500" />
    },
    {
      id: 'energy',
      name: 'Energy & Utilities',
      type: 'Thematic',
      description: 'A blend of refining powerhouses and utility leaders transitioning into clean solar/wind resources.',
      cagr: 16.4,
      members: ['RELIANCE.NS', 'BPCL.NS', 'ONGC.NS', 'POWERGRID.NS'],
      color: 'from-amber-600/10 to-orange-600/10 border-amber-500/20 text-amber-600 dark:text-amber-400',
      icon: <TrendingUp className="h-4.5 w-4.5 text-amber-500" />
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-profit/10 text-profit">
            <Layers className="h-4 w-4" />
          </span>
          <h2 className="text-2xl font-black text-text-primary tracking-tight">
            Thematic Stock Baskets
          </h2>
        </div>
        <p className="text-xs text-text-secondary font-medium mt-1">
          Diversified baskets (Smallcases) grouped by industrial themes or sectors, with aggregate historical CAGR yields.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {baskets.map((basket) => (
          <Link
            key={basket.id}
            href={`/basket/${basket.id}`}
            className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-soft dark:shadow-soft-dark hover:shadow-premium dark:hover:shadow-premium-dark hover:border-profit/20 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 overflow-hidden animate-fade-in gpu-layer group cursor-pointer"
          >
            {/* Header info */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-background border border-border">
                {basket.icon}
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-text-primary tracking-tight group-hover:text-profit transition-colors duration-200">
                  {basket.name}
                </h3>
                <span className="inline-block text-[8px] font-black uppercase tracking-wider mt-0.5 px-2 py-0.2 rounded border border-border/80 text-text-secondary">
                  {basket.type}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-text-secondary leading-relaxed font-semibold mt-4 flex-1">
              {basket.description}
            </p>

            {/* Overlapping member logos row */}
            <div className="flex items-center justify-between mt-6 pt-3 border-t border-border/30">
              <div className="flex -space-x-2.5 overflow-hidden">
                {basket.members.map((sym) => (
                  <div key={sym} className="ring-2 ring-card rounded-lg overflow-hidden" title={sym.split('.')[0]}>
                    <StockLogo symbol={sym} size="sm" />
                  </div>
                ))}
              </div>

              {/* Basket CAGR yield */}
              <div className="text-right">
                <span className="block text-[8px] font-black text-text-secondary uppercase tracking-wider">Est. CAGR (3y)</span>
                <span className="inline-block text-xs font-black text-profit mt-0.5">
                  {basket.cagr.toFixed(1)}% p.a.
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
