'use client';

import React from 'react';

interface TechnicalsData {
  score: number;
  rsi: number;
  macd: {
    signal: number | string;
    hist: number;
  };
  movingAverages: {
    ema20: number;
  };
  support1: number | string;
  support2: number | string;
  resistance1: number | string;
  resistance2: number | string;
}

interface StockTechnicalsTabProps {
  quote: any;
  technicals: TechnicalsData;
}

const TechnicalGauge = ({ score }: { score: number }) => {
  const angle = ((score + 100) / 200) * 180; // maps to 0 to 180 degrees
  
  let label = 'Neutral';
  let color = 'text-slate-500 bg-slate-500/10 border-slate-500/20';
  let strokeColor = '#64748b';
  
  if (score > 50) {
    label = 'Strong Buy';
    color = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    strokeColor = '#10b981';
  } else if (score > 15) {
    label = 'Buy';
    color = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    strokeColor = '#34d399';
  } else if (score < -50) {
    label = 'Strong Sell';
    color = 'text-rose-500 bg-rose-500/10 border-rose-500/20';
    strokeColor = '#ef4444';
  } else if (score < -15) {
    label = 'Sell';
    color = 'text-rose-500 bg-rose-500/10 border-rose-500/20';
    strokeColor = '#f87171';
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 gap-4">
      <div className="relative w-48 h-24 overflow-hidden">
        <svg viewBox="0 0 100 50" className="w-full h-full">
          {/* Base gauge track */}
          <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="var(--border)" strokeWidth="8" strokeLinecap="round" className="opacity-30" />
          {/* Active gauge track */}
          <path 
            d="M 10 50 A 40 40 0 0 1 90 50" 
            fill="none" 
            stroke="url(#gauge-gradient)" 
            strokeWidth="8" 
            strokeLinecap="round" 
          />
          <defs>
            <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
          {/* Needle */}
          <g transform={`rotate(${angle} 50 50)`}>
            <line x1="50" y1="50" x2="15" y2="50" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="50" cy="50" r="4" fill={strokeColor} />
          </g>
        </svg>
        <div className="absolute bottom-0 inset-x-0 text-center flex flex-col items-center">
          <span className="text-[10px] text-text-secondary uppercase font-bold tracking-widest">Sentiment</span>
          <span className={`text-sm font-black px-2.5 py-0.5 rounded-full mt-0.5 border ${color}`}>{label}</span>
        </div>
      </div>
    </div>
  );
};

export default function StockTechnicalsTab({
  quote,
  technicals,
}: StockTechnicalsTabProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-soft dark:shadow-soft-dark space-y-6 animate-fade-in">
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        
        {/* Gauge indicator */}
        <div className="border border-border/50 rounded-xl p-4 bg-background/20 shadow-inner">
          <h4 className="text-xs font-black text-text-primary uppercase tracking-wider text-center mb-2">Technical Summary</h4>
          <TechnicalGauge score={technicals.score} />
        </div>

        {/* Indicators Table */}
        <div className="md:col-span-2 space-y-3">
          <h4 className="text-xs font-black text-text-primary uppercase tracking-wider">Momentum Oscillators</h4>
          <div className="divide-y divide-border/40">
            {[
              { 
                label: 'RSI (14)', 
                value: technicals.rsi, 
                status: technicals.rsi > 70 ? 'Overbought (Sell)' : technicals.rsi < 30 ? 'Oversold (Buy)' : 'Neutral', 
                color: technicals.rsi > 70 ? 'text-loss' : technicals.rsi < 30 ? 'text-profit' : 'text-text-secondary' 
              },
              { 
                label: 'MACD (12, 26)', 
                value: `Signal: ${technicals.macd.signal}`, 
                status: technicals.macd.hist > 0 ? 'Bullish Crossover' : 'Bearish Crossover', 
                color: technicals.macd.hist > 0 ? 'text-profit' : 'text-loss' 
              },
              { 
                label: 'SMA (20) Relation', 
                value: `₹${technicals.movingAverages.ema20.toFixed(2)}`, 
                status: quote.regularMarketPrice >= technicals.movingAverages.ema20 ? 'Above Average (Bullish)' : 'Below Average (Bearish)', 
                color: quote.regularMarketPrice >= technicals.movingAverages.ema20 ? 'text-profit' : 'text-loss' 
              }
            ].map((ind, idx) => (
              <div key={idx} className="flex justify-between items-center py-2.5 text-xs font-bold">
                <span className="text-text-secondary">{ind.label}</span>
                <div className="flex items-center gap-4">
                  <span className="text-text-primary">{ind.value}</span>
                  <span className={`text-[10px] font-black ${ind.color}`}>{ind.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Support and Resistance values */}
      <div className="p-4 bg-background/40 border border-border/50 rounded-xl space-y-3 shadow-inner">
        <h4 className="text-xs font-black text-text-primary uppercase tracking-wider">Pivot Support & Resistance Points</h4>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
          <div className="space-y-1">
            <span className="block text-[8px] font-black text-text-secondary uppercase">Support 2 (S2)</span>
            <span className="text-xs font-black text-loss">₹{technicals.support2}</span>
          </div>
          <div className="space-y-1">
            <span className="block text-[8px] font-black text-text-secondary uppercase">Support 1 (S1)</span>
            <span className="text-xs font-black text-loss/80">₹{technicals.support1}</span>
          </div>
          <div className="space-y-1">
            <span className="block text-[8px] font-black text-text-secondary uppercase">Resistance 1 (R1)</span>
            <span className="text-xs font-black text-profit/80">₹{technicals.resistance1}</span>
          </div>
          <div className="space-y-1">
            <span className="block text-[8px] font-black text-text-secondary uppercase">Resistance 2 (R2)</span>
            <span className="text-xs font-black text-profit">₹{technicals.resistance2}</span>
          </div>
        </div>
      </div>

    </div>
  );
}
