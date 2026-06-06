'use client';

import React, { useState } from 'react';

interface StockLogoProps {
  symbol: string;
  size?: 'sm' | 'md' | 'lg';
}

const BRAND_LOGOS: Record<string, { initials: string; gradient: string }> = {
  'RELIANCE.NS': { initials: 'RE', gradient: 'from-blue-600 to-indigo-700' },
  'TCS.NS': { initials: 'TCS', gradient: 'from-blue-500 to-sky-600' },
  'INFY.NS': { initials: 'INF', gradient: 'from-green-600 to-emerald-500' },
  'HDFCBANK.NS': { initials: 'HDF', gradient: 'from-blue-700 to-indigo-800' },
  'ICICIBANK.NS': { initials: 'ICI', gradient: 'from-orange-500 to-amber-600' },
  'SBIN.NS': { initials: 'SBI', gradient: 'from-sky-500 to-cyan-600' },
  'BHARTIAIRTEL.NS': { initials: 'AIR', gradient: 'from-red-500 to-rose-600' },
  'LT.NS': { initials: 'L&T', gradient: 'from-amber-500 to-yellow-600' },
  'ITC.NS': { initials: 'ITC', gradient: 'from-blue-800 to-indigo-900' },
  'TATAMOTORS.NS': { initials: 'TTM', gradient: 'from-blue-600 to-indigo-500' },
  'WIPRO.NS': { initials: 'WIP', gradient: 'from-violet-500 to-purple-600' },
  'HCLTECH.NS': { initials: 'HCL', gradient: 'from-blue-600 to-sky-600' },
  'ASIANPAINT.NS': { initials: 'AP', gradient: 'from-red-500 to-orange-500' },
  'AXISBANK.NS': { initials: 'AXI', gradient: 'from-purple-800 to-pink-600' },
  'BAJFINANCE.NS': { initials: 'BAJ', gradient: 'from-sky-600 to-blue-700' },
  'BAJAJFINSV.NS': { initials: 'BAJ', gradient: 'from-cyan-600 to-teal-700' },
  'JIOFIN.NS': { initials: 'JIO', gradient: 'from-blue-500 to-rose-500' },
  '^NSEI': { initials: 'N50', gradient: 'from-emerald-500 to-teal-600' },
  '^BSESN': { initials: 'B30', gradient: 'from-indigo-600 to-violet-500' },
  '^NSEBANK': { initials: 'BNK', gradient: 'from-sky-600 to-indigo-600' },
  '^CNXIT': { initials: 'IT', gradient: 'from-purple-600 to-fuchsia-600' }
};

const GRADIENTS = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-violet-500 to-purple-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-sky-500 to-blue-600',
  'from-cyan-500 to-teal-600',
  'from-fuchsia-500 to-purple-600'
];

function getHashGradient(sym: string) {
  let hash = 0;
  for (let i = 0; i < sym.length; i++) {
    hash = sym.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % GRADIENTS.length;
  return GRADIENTS[index];
}

function getInitials(sym: string) {
  const clean = sym.split('.')[0].replace('^', '');
  if (clean.length <= 3) return clean;
  return clean.substring(0, 2);
}

export default function StockLogo({ symbol, size = 'md' }: StockLogoProps) {
  const [imgError, setImgError] = useState(false);

  const cleanTicker = symbol.split('.')[0].replace('^', '').toUpperCase();
  const logoUrl = `https://assets-netstorage.groww.in/stock-assets/logos/${cleanTicker}.png`;

  const sizeClasses = {
    sm: 'h-7 w-7 text-[9px] rounded-lg',
    md: 'h-9 w-9 text-[11px] rounded-xl',
    lg: 'h-12 w-12 text-[14px] rounded-2xl'
  };

  const tryLoadImage = !imgError && !symbol.startsWith('^');

  if (tryLoadImage) {
    return (
      <div className={`relative flex items-center justify-center bg-slate-100 dark:bg-slate-800/80 overflow-hidden shrink-0 shadow-sm border border-border/30 hover:border-profit/20 transition-all duration-300 ${sizeClasses[size]}`}>
        <img
          src={logoUrl}
          alt={cleanTicker}
          className="object-contain w-3/4 h-3/4 select-none pointer-events-none"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      </div>
    );
  }

  // Fallback dynamic gradient initial badge
  const brand = BRAND_LOGOS[symbol];
  const initials = brand ? brand.initials : getInitials(symbol);
  const gradient = brand ? brand.gradient : getHashGradient(symbol);

  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br ${gradient} text-white font-black select-none shrink-0 shadow-sm border border-white/10 ${sizeClasses[size]}`}
    >
      {initials}
    </div>
  );
}
