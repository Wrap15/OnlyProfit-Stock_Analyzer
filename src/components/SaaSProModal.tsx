'use client';

import React, { useRef, useEffect } from 'react';
import { X, ShieldCheck, Cpu, Play, BarChart3, Zap } from 'lucide-react';
import { useStockStore } from '@/store/useStockStore';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SaaSProModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthPrompt?: () => void;
}

export default function SaaSProModal({ isOpen, onClose, onAuthPrompt }: SaaSProModalProps) {
  const { isProUser, userId, activatePro, deactivatePro } = useStockStore();
  const containerRef = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleTogglePro = async () => {
    if (!userId) {
      // Close this modal and prompt auth modal (prevents overlaps and unmount bugs)
      onClose();
      if (onAuthPrompt) onAuthPrompt();
      return;
    }

    try {
      const nextStatus = !isProUser;
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, { isProUser: nextStatus }, { merge: true });

      if (nextStatus) {
        activatePro();
      } else {
        deactivatePro();
      }
      onClose();
    } catch (err) {
      console.error('Error toggling Pro state in Firestore', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] bg-slate-955/45 dark:bg-slate-955/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        ref={containerRef}
        className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header Branding */}
        <div className="p-6 pb-4 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-transparent border-b border-border/40 relative">
          <div className="absolute top-6 left-6 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20">
            <Zap className="h-5 w-5" />
          </div>
          <div className="pl-14">
            <h3 className="font-extrabold text-lg text-text-primary tracking-tight">
              OnlyProfit Pro
            </h3>
            <p className="text-xs text-text-secondary font-semibold mt-0.5">
              Supercharge your investing simulation workspace.
            </p>
          </div>
        </div>

        {/* Feature List */}
        <div className="p-6 space-y-4">
          <div className="flex gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
              <Cpu className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Live AI Technical Signals</h4>
              <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed font-semibold">
                Instant indicator scanner tracking MACD crossovers, RSI oversold/overbought thresholds, and SMA crosses on your watchlists.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Advanced Financial Analytics</h4>
              <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed font-semibold">
                Unlock deep sheet assets ratios, cash flow summaries, sector peer comparisons, and dividend yields for all NSE listings.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
              <Play className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Historical Basket Backtests</h4>
              <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed font-semibold">
                Simulate 5-year CAGR performance histories for your custom watchlists and custom baskets instantly.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action Footer */}
        <div className="p-6 border-t border-border/40 bg-background/50 flex flex-col gap-2 text-center">
          <button
            onClick={handleTogglePro}
            className={`w-full h-11 rounded-xl font-extrabold text-sm transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer ${
              isProUser
                ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-border text-text-primary shadow-none'
                : 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:brightness-105 text-slate-950 shadow-amber-500/15'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            {isProUser ? 'Downgrade to Free Basic' : userId ? 'Unlock Pro Tier (Save to Cloud)' : 'Sign In to Unlock Pro'}
          </button>
          <span className="text-[9px] text-text-secondary font-semibold opacity-75">
            Secure Cloud authentication via Firebase.
          </span>
        </div>
      </div>
    </div>
  );
}
