'use client';

import React, { useState } from 'react';
import { X, Share2, Check, ShieldCheck } from 'lucide-react';

interface ShareTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  tradeData: {
    symbol: string;
    stockName?: string;
    side?: 'BUY' | 'SELL';
    quantity?: number;
    price?: number;
    pnl?: number;
    pnlPercent?: number;
    totalInvested?: number;
  };
}

export default function ShareTradeModal({ isOpen, onClose, tradeData }: ShareTradeModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const {
    symbol,
    stockName = symbol,
    side = 'BUY',
    quantity = 10,
    price = 2450.00,
    pnl = 1845.50,
    pnlPercent = 7.53,
    totalInvested = quantity * price
  } = tradeData;

  const isProfit = pnl >= 0;
  const pnlColor = isProfit ? 'text-emerald-400' : 'text-rose-400';
  const glowBorder = isProfit 
    ? 'border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.2)]' 
    : 'border-rose-500/40 shadow-[0_0_30px_rgba(244,63,94,0.2)]';

  const handleCopySummary = () => {
    const text = `🚀 Simulated Trade on OnlyProfit!
📈 ${stockName} (${symbol})
💰 Return: ${isProfit ? '+' : ''}₹${pnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${isProfit ? '+' : ''}${pnlPercent.toFixed(2)}%)
⚡ Trade: ${side} ${quantity} shares @ ₹${price.toFixed(2)}
🎯 Practice & Master Indian Equities with OnlyProfit Paper Trading!`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm space-y-4">
        
        {/* The Glassmorphic Story Card */}
        <div 
          className={`relative overflow-hidden rounded-3xl bg-zinc-950/90 border ${glowBorder} p-6 text-white space-y-5 backdrop-blur-2xl transition-all`}
        >
          {/* Ambient Corner Glow Gradients */}
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Card Top Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-450 animate-ping" />
              <span className="text-xs font-black tracking-wider uppercase text-white">
                Only<span className="text-emerald-450">Profit</span>
              </span>
            </div>
            <div className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-full text-[9px] font-bold text-emerald-450 border border-white/10">
              <ShieldCheck className="w-3 h-3" /> Verified Paper Trade
            </div>
          </div>

          {/* Stock Info */}
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">
              {side} • {quantity} Shares
            </span>
            <h3 className="text-lg font-black tracking-tight text-white mt-0.5">
              {stockName}
            </h3>
            <span className="text-xs font-mono text-zinc-400">{symbol}</span>
          </div>

          {/* Big P&L Display */}
          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block">
              Simulated Returns
            </span>
            <div className={`text-2xl sm:text-3xl font-black font-mono tracking-tight flex items-baseline gap-2 ${pnlColor}`}>
              <span>{isProfit ? '+' : ''}₹{pnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 font-sans font-extrabold">
                {isProfit ? '+' : ''}{pnlPercent.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Trade Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-white/[0.03] p-2.5 rounded-xl border border-white/5">
              <span className="text-[9px] uppercase font-bold text-zinc-400 block">Avg Price</span>
              <span className="font-mono font-bold text-white">₹{price.toFixed(2)}</span>
            </div>
            <div className="bg-white/[0.03] p-2.5 rounded-xl border border-white/5">
              <span className="text-[9px] uppercase font-bold text-zinc-400 block">Total Capital</span>
              <span className="font-mono font-bold text-white">₹{totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Card Footer Watermark */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[9px] text-zinc-400 font-medium">
            <span>Market Simulator • ₹10,00,000 Starting Cap</span>
            <span>{new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Modal Action Controls */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCopySummary}
            className="flex-1 py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Share Trade Summary</span>
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={onClose}
            className="p-3 rounded-2xl bg-card hover:bg-card-hover border border-border text-text-primary transition-all active:scale-95 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      </div>
    </div>
  );
}
