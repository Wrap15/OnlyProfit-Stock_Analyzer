'use client';

import React, { useState, useEffect } from 'react';
import { MUTUAL_FUNDS, getAmcLogoUrl } from '@/lib/mutualfunds';
import { getTickertapeSid } from '@/lib/yahooFinance';

interface StockLogoProps {
  symbol: string;
  website?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  name?: string;
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
  'TMPV.NS': { initials: 'TMPV', gradient: 'from-blue-600 to-indigo-500' },
  'TMCV.NS': { initials: 'TMCV', gradient: 'from-slate-600 to-slate-700' },
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
  if (/^\d+$/.test(sym)) return 'MF';
  const clean = sym.split('.')[0].replace('^', '');
  if (clean.length <= 3) return clean;
  return clean.substring(0, 2);
}

function extractDomain(urlStr?: string): string | null {
  if (!urlStr) return null;
  try {
    const cleanUrl = urlStr.startsWith('http') ? urlStr : `https://${urlStr}`;
    const url = new URL(cleanUrl);
    return url.hostname.replace('www.', '');
  } catch {
    return null;
  }
}

export default function StockLogo({ symbol, website, size = 'md', name }: StockLogoProps) {
  // We try loading in tiers: Clearbit (if domain is available) -> Google Favicon -> Tickertape CDN -> Fallback Initials
  const [logoTier, setLogoTier] = useState<number>(0); 
  // 0: Clearbit Logo, 1: Google Favicon, 2: Tickertape, 3: Fallback Initials

  const domain = extractDomain(website);
  const cleanTicker = symbol.split('.')[0].replace('^', '').toUpperCase();

  const sizeClasses = {
    xs: 'h-4 w-4 text-[6px] rounded-sm',
    sm: 'h-8 w-8 text-[10px] rounded-lg',
    md: 'h-10 w-10 text-[12px] rounded-xl',
    lg: 'h-14 w-14 text-[16px] rounded-2xl',
    xl: 'h-16 w-16 text-[18px] rounded-2xl'
  };

  useEffect(() => {
    // Reset tier if symbol/website changes
    if (domain) {
      setLogoTier(0);
    } else if (!symbol.startsWith('^')) {
      setLogoTier(2); // Start at Tickertape if website domain isn't available
    } else {
      setLogoTier(3); // Start at initials for indices
    }
  }, [symbol, website, domain]);

  const handleImageError = () => {
    // Progress to next tier on error
    setLogoTier((prev) => prev + 1);
  };

  const isMf = /^\d+$/.test(symbol);

  if (isMf) {
    const mf = MUTUAL_FUNDS.find(f => f.code === symbol);
    const mfLogoUrl = getAmcLogoUrl('', name || (mf ? mf.name : ''));
    
    if (mfLogoUrl) {
      return (
        <div className={`relative flex items-center justify-center bg-white dark:bg-slate-800 overflow-hidden shrink-0 shadow-sm border border-border/40 hover:border-profit/20 transition-all duration-300 ${sizeClasses[size]}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mfLogoUrl}
            alt={name || symbol}
            className="object-contain w-3/4 h-3/4 select-none pointer-events-none rounded-lg"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
              const parent = (e.target as HTMLElement).parentElement;
              if (parent) {
                parent.className = `flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black select-none shrink-0 shadow-sm border border-white/10 ${sizeClasses[size]}`;
                parent.innerText = 'MF';
              }
            }}
            loading="lazy"
          />
        </div>
      );
    }

    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black select-none shrink-0 shadow-sm border border-white/10 ${sizeClasses[size]}`}
      >
        MF
      </div>
    );
  }

  if (logoTier === 0 && domain) {
    const clearbitUrl = `https://logo.clearbit.com/${domain}`;
    return (
      <div className={`relative flex items-center justify-center bg-white dark:bg-slate-800 overflow-hidden shrink-0 shadow-sm border border-border/40 hover:border-profit/20 transition-all duration-300 ${sizeClasses[size]}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={clearbitUrl}
          alt={cleanTicker}
          className="object-contain w-3/4 h-3/4 select-none pointer-events-none rounded-lg"
          onError={handleImageError}
          loading="lazy"
        />
      </div>
    );
  }

  if (logoTier === 1 && domain) {
    const googleFaviconUrl = `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;
    return (
      <div className={`relative flex items-center justify-center bg-white dark:bg-slate-800 overflow-hidden shrink-0 shadow-sm border border-border/40 hover:border-profit/20 transition-all duration-300 ${sizeClasses[size]}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={googleFaviconUrl}
          alt={cleanTicker}
          className="object-contain w-3/4 h-3/4 select-none pointer-events-none rounded-lg"
          onError={handleImageError}
          loading="lazy"
        />
      </div>
    );
  }

  if (logoTier === 2 && !symbol.startsWith('^')) {
    const tickertapeUrl = `https://assets.tickertape.in/stock-logos/${getTickertapeSid(symbol)}.png`;
    return (
      <div className={`relative flex items-center justify-center bg-white dark:bg-slate-800 overflow-hidden shrink-0 shadow-sm border border-border/40 hover:border-profit/20 transition-all duration-300 ${sizeClasses[size]}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={tickertapeUrl}
          alt={cleanTicker}
          className="object-contain w-3/4 h-3/4 select-none pointer-events-none rounded-lg"
          onError={handleImageError}
          loading="lazy"
        />
      </div>
    );
  }

  // Fallback initial badge
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
