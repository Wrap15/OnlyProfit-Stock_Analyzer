'use client';

import React, { useState, useEffect } from 'react';
import { 
  Star, ChevronLeft, GitCompare, Share2, TrendingUp, CheckCircle, Copy, Send, X 
} from 'lucide-react';
import StockLogo from '@/components/StockLogo';

interface StockHeroSectionProps {
  symbol: string;
  quote: any;
  isFavorited: boolean;
  onToggleWatchlist: () => void;
  onCompare: () => void;
  onTrade: () => void;
  onBack: () => void;
}

export default function StockHeroSection({
  symbol,
  quote,
  isFavorited,
  onToggleWatchlist,
  onCompare,
  onTrade,
  onBack,
}: StockHeroSectionProps) {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const isPositive = quote.regularMarketChangePercent >= 0;

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
  };

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const fallbackCopyText = (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      triggerToast('Share link copied to clipboard!');
    } catch (err) {
      console.error('Fallback copy failed', err);
      triggerToast('Failed to copy link');
    }
    document.body.removeChild(textArea);
  };

  const copyShareLink = () => {
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url)
          .then(() => triggerToast('Share link copied to clipboard!'))
          .catch(() => fallbackCopyText(url));
      } else {
        fallbackCopyText(url);
      }
    }
  };

  const handleShareClick = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: `${quote.longName} (${quote.symbol.split('.')[0]}) Share Price | OnlyProfit`,
        text: `Check out ${quote.longName} (${quote.symbol.split('.')[0]}) live price at ₹${quote.regularMarketPrice.toLocaleString('en-IN')} on OnlyProfit!`,
        url: window.location.href,
      }).catch((err) => {
        console.log('Native share failed or dismissed, opening custom fallback', err);
        setShowShareMenu(true);
      });
    } else {
      setShowShareMenu(!showShareMenu);
    }
  };

  const getMarketStatus = () => {
    const now = new Date();
    const day = now.getDay();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const timeInMinutes = hours * 60 + minutes;
    
    const isOpenDay = day >= 1 && day <= 5; // Monday to Friday
    const isOpenTime = timeInMinutes >= 9 * 60 + 15 && timeInMinutes <= 15 * 60 + 30; // 9:15 AM to 3:30 PM
    
    if (isOpenDay && isOpenTime) {
      return { desc: 'Market Open', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
    } else {
      return { desc: 'Market Closed', color: 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20' };
    }
  };

  const marketStatus = getMarketStatus();

  return (
    <div className="space-y-4">
      {/* Toast popup */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-5 py-3 rounded-2xl shadow-premium z-50 text-xs font-bold flex items-center gap-2 animate-fade-in border border-white/10 dark:border-black/5">
          <CheckCircle className="h-4 w-4 text-emerald-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb back navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Dashboard
        </button>
      </div>

      {/* Premium Glassmorphism Hero Section */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-soft dark:shadow-soft-dark flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-profit/5 rounded-full filter blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-indigo-500/5 rounded-full filter blur-2xl pointer-events-none" />

        <div className="flex items-start sm:items-center gap-4 relative z-10">
          <StockLogo symbol={quote.symbol} website={quote.website} size="lg" />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
                {quote.longName}
              </h1>
              <span className="text-xs font-black px-2 py-0.5 rounded bg-background border border-border text-text-secondary">
                {quote.symbol.split('.')[0]}
              </span>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${marketStatus.color} uppercase tracking-wider select-none`}>
                {marketStatus.desc}
              </span>
            </div>
            
            <p className="text-xs font-bold text-text-secondary flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>Sector: <strong className="text-text-primary">{quote.sector}</strong></span>
              <span className="text-border">•</span>
              <span>Industry: <strong className="text-text-primary">{quote.industry || 'Diversified'}</strong></span>
              <span className="text-border">•</span>
              <span>Exchange: <strong className="text-text-primary">{symbol.startsWith('^') ? 'INDEX' : 'NSE'}</strong></span>
            </p>
          </div>
        </div>

        {/* Price display and CTA actions */}
        <div className="flex flex-col md:items-end justify-between gap-4 relative z-10 shrink-0">
          <div className="flex flex-col md:items-end">
            <div className="text-3xl font-black tracking-tight text-text-primary rounded-xl px-2 py-0.5 inline-block font-mono">
              ₹{quote.regularMarketPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className={`flex items-center gap-1.5 text-xs font-black mt-1 ${isPositive ? 'text-profit' : 'text-loss'}`}>
              <span>{isPositive ? '▲' : '▼'}</span>
              <span>{isPositive ? '+' : ''}{quote.regularMarketChangePercent.toFixed(2)}%</span>
              <span className="opacity-80">({isPositive ? '+' : ''}{quote.regularMarketChange.toFixed(2)})</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onToggleWatchlist}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer ${
                isFavorited
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-sm'
                  : 'border-border text-text-secondary bg-card hover:text-text-primary hover:bg-background'
              }`}
            >
              <Star className={`h-4 w-4 ${isFavorited ? 'fill-current text-amber-500' : ''}`} />
              <span>{isFavorited ? 'Watchlisted' : 'Watchlist'}</span>
            </button>

            <button
              onClick={onCompare}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border text-xs font-bold text-text-secondary bg-card hover:text-text-primary hover:bg-background transition-all cursor-pointer"
            >
              <GitCompare className="h-4 w-4" />
              <span>Compare</span>
            </button>

            {!symbol.startsWith('^') && (
              <button
                onClick={onTrade}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-black font-black text-xs transition-all shadow-sm shadow-emerald-500/5 cursor-pointer animate-fade-in"
              >
                <TrendingUp className="h-4 w-4" />
                <span>Paper Trade</span>
              </button>
            )}

            {/* Share Button with Native / Custom Fallback */}
            <div className="relative">
              <button
                onClick={handleShareClick}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border text-xs font-bold text-text-secondary bg-card hover:text-text-primary hover:bg-background transition-all cursor-pointer"
                title="Share options"
              >
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </button>
              
              {/* Desktop Dropdown Fallback */}
              {showShareMenu && (
                <div className="hidden md:block">
                  <div 
                    className="fixed inset-0 z-20 cursor-default" 
                    onClick={() => setShowShareMenu(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-premium dark:shadow-premium-dark p-2 z-30 animate-fade-in flex flex-col gap-1">
                    <button
                      onClick={() => {
                        copyShareLink();
                        setShowShareMenu(false);
                      }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-left text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-background rounded-lg transition-colors cursor-pointer"
                    >
                      <Copy className="h-3.5 w-3.5 text-text-secondary" />
                      <span>Copy Link</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          const text = `Check out ${quote.longName} (${quote.symbol.split('.')[0]}) live price at ₹${quote.regularMarketPrice.toLocaleString('en-IN')} on OnlyProfit: ${window.location.href}`;
                          window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
                        }
                        setShowShareMenu(false);
                      }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-left text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-background rounded-lg transition-colors cursor-pointer"
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current text-profit">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.456L0 24zm6.59-4.846c1.6.95 3.488 1.449 5.412 1.451 5.428 0 9.85-4.417 9.854-9.842.002-2.628-1.02-5.1-2.875-6.958C17.18 1.846 14.71 .825 12.01 .825c-5.437 0-9.86 4.418-9.863 9.843-.001 1.926.501 3.805 1.458 5.41l-.955 3.486 3.576-.938zm11.367-6.406c-.31-.156-1.834-.905-2.11-.1-.28.1-.482.4-.592.5-.11.11-.22.12-.53-.04-.31-.156-1.3-.48-2.478-1.53-.918-.82-1.537-1.83-1.72-2.14-.18-.31-.02-.48.136-.635.14-.14.31-.36.467-.54.156-.18.21-.31.31-.52.1-.2.05-.38-.025-.54-.075-.156-.675-1.63-.925-2.235-.244-.587-.49-.508-.675-.518-.174-.01-.373-.01-.572-.01-.2 0-.523.074-.797.373-.273.3-1.045 1.02-1.045 2.487 0 1.468 1.07 2.885 1.22 3.085.15.2 2.103 3.2 5.093 4.49.71.3 1.266.49 1.7.63.715.225 1.366.193 1.88.117.573-.085 1.834-.75 2.09-1.437.258-.687.258-1.278.18-1.4-.078-.125-.285-.203-.593-.36z" />
                      </svg>
                      <span>Share on WhatsApp</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          const text = `Check out ${quote.longName} (${quote.symbol.split('.')[0]}) on OnlyProfit`;
                          window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
                        }
                        setShowShareMenu(false);
                      }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-left text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-background rounded-lg transition-colors cursor-pointer"
                    >
                      <Send className="h-3.5 w-3.5 text-sky-500" />
                      <span>Share on Telegram</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Bottom Sheet Drawer Fallback */}
            {showShareMenu && (
              <div className="block md:hidden fixed inset-0 z-50 animate-fade-in">
                <div 
                  className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
                  onClick={() => setShowShareMenu(false)}
                />
                <div className="absolute bottom-0 inset-x-0 bg-card border-t border-border rounded-t-3xl shadow-premium dark:shadow-premium-dark p-6 z-10 animate-slide-up space-y-4">
                  <div className="w-12 h-1 bg-border rounded-full mx-auto mb-2" />
                  
                  <div>
                    <h3 className="font-extrabold text-sm text-text-primary uppercase tracking-wider">Share Stock</h3>
                    <p className="text-[10px] text-text-secondary font-medium mt-0.5">Select a method to share {quote.longName}.</p>
                  </div>
                  
                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      onClick={() => {
                        copyShareLink();
                        setShowShareMenu(false);
                      }}
                      className="flex items-center gap-3.5 w-full px-4 py-3 bg-background border border-border/80 hover:bg-background/80 rounded-xl transition-colors text-left cursor-pointer"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-text-secondary/10 text-text-secondary">
                        <Copy className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-text-primary">Copy Link</span>
                        <span className="text-[9px] text-text-secondary font-medium">Copy direct link to clipboard</span>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          const text = `Check out ${quote.longName} (${quote.symbol.split('.')[0]}) live price at ₹${quote.regularMarketPrice.toLocaleString('en-IN')} on OnlyProfit!`;
                          window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
                        }
                        setShowShareMenu(false);
                      }}
                      className="flex items-center gap-3.5 w-full px-4 py-3 bg-background border border-border/80 hover:bg-background/80 rounded-xl transition-colors text-left cursor-pointer"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-profit/10 text-profit">
                        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.456L0 24zm6.59-4.846c1.6.95 3.488 1.449 5.412 1.451 5.428 0 9.85-4.417 9.854-9.842.002-2.628-1.02-5.1-2.875-6.958C17.18 1.846 14.71 .825 12.01 .825c-5.437 0-9.86 4.418-9.863 9.843-.001 1.926.501 3.805 1.458 5.41l-.955 3.486 3.576-.938zm11.367-6.406c-.31-.156-1.834-.905-2.11-.1-.28.1-.482.4-.592.5-.11.11-.22.12-.53-.04-.31-.156-1.3-.48-2.478-1.53-.918-.82-1.537-1.83-1.72-2.14-.18-.31-.02-.48.136-.635.14-.14.31-.36.467-.54.156-.18.21-.31.31-.52.1-.2.05-.38-.025-.54-.075-.156-.675-1.63-.925-2.235-.244-.587-.49-.508-.675-.518-.174-.01-.373-.01-.572-.01-.2 0-.523.074-.797.373-.273.3-1.045 1.02-1.045 2.487 0 1.468 1.07 2.885 1.22 3.085.15.2 2.103 3.2 5.093 4.49.71.3 1.266.49 1.7.63.715.225 1.366.193 1.88.117.573-.085 1.834-.75 2.09-1.437.258-.687.258-1.278.18-1.4-.078-.125-.285-.203-.593-.36z" />
                        </svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-text-primary">WhatsApp</span>
                        <span className="text-[9px] text-text-secondary font-medium">Share directly to WhatsApp contacts</span>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          const text = `Check out ${quote.longName} (${quote.symbol.split('.')[0]}) on OnlyProfit`;
                          window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
                        }
                        setShowShareMenu(false);
                      }}
                      className="flex items-center gap-3.5 w-full px-4 py-3 bg-background border border-border/80 hover:bg-background/80 rounded-xl transition-colors text-left cursor-pointer"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-500">
                        <Send className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-text-primary">Telegram</span>
                        <span className="text-[9px] text-text-secondary font-medium">Send link via Telegram Messenger</span>
                      </div>
                    </button>

                    <button
                      onClick={() => setShowShareMenu(false)}
                      className="w-full text-center py-2.5 border border-border text-text-primary font-black rounded-xl text-xs bg-background/50 hover:bg-background hover:text-loss transition-colors mt-2 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
