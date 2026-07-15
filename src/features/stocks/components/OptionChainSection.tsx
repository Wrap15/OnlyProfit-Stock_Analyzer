'use client';

import React from 'react';
import { calculateOptionPrice } from '@/lib/foUtils';
import { ArrowUpDown, TrendingDown, TrendingUp } from 'lucide-react';

interface ExpiryDate {
  label: string;
  value: string;
}

interface OptionChainSectionProps {
  marketQuotes: any[];
  expiryDates: ExpiryDate[];
  selectedExpiry: string;
  setSelectedExpiry: (expiry: string) => void;
  foUnderlying: string;
  setFoUnderlying: (underlying: string) => void;
  onTrade: (symbol: string, name: string, price: number) => void;
}

export default function OptionChainSection({
  marketQuotes,
  expiryDates,
  selectedExpiry,
  setSelectedExpiry,
  foUnderlying,
  setFoUnderlying,
  onTrade,
}: OptionChainSectionProps) {
  const UNDERLYING_LIST = [
    { id: '^NSEI', label: 'Nifty 50' },
    { id: '^NSEBANK', label: 'Nifty Bank' },
    { id: 'RELIANCE.NS', label: 'Reliance' },
    { id: 'TCS.NS', label: 'TCS' },
    { id: 'INFY.NS', label: 'Infosys' },
    { id: 'HDFCBANK.NS', label: 'HDFC Bank' },
    { id: 'SBIN.NS', label: 'SBI' },
    { id: 'ICICIBANK.NS', label: 'ICICI Bank' },
    { id: 'TRENT.NS', label: 'Trent' },
    { id: 'TATAMOTORS.NS', label: 'Tata Motors' },
    { id: 'MARUTI.NS', label: 'Maruti' },
    { id: 'ADANIENT.NS', label: 'Adani Ent' }
  ];

  const underlyingQuote = marketQuotes.find((q) => q.symbol === foUnderlying);
  const spot = underlyingQuote?.regularMarketPrice ?? 0;
  const spotChange = underlyingQuote?.regularMarketChangePercent ?? 0;

  // Compute option chain strikes based on spot
  const optionChainData = React.useMemo(() => {
    if (!spot || spot === 0) return { strikes: [], atmStrike: 0 };

    let interval = 100;
    if (spot < 100) interval = 5;
    else if (spot < 500) interval = 10;
    else if (spot < 1000) interval = 20;
    else if (spot < 5000) interval = 50;
    else if (spot < 20000) interval = 100;
    else interval = 100;

    const atmStrike = Math.round(spot / interval) * interval;
    const strikesList: number[] = [];
    for (let i = -3; i <= 3; i++) {
      strikesList.push(atmStrike + i * interval);
    }
    return { strikes: strikesList, atmStrike };
  }, [spot]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Underlying Selector & Expiry Selectors */}
      <div className="bg-card border border-border p-5 rounded-2xl shadow-soft dark:shadow-soft-dark space-y-4">
        <div className="flex flex-col gap-4">
          {/* Select Underlying Index/Equity */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h3 className="text-base font-extrabold text-text-primary tracking-tight">F&O Options Chain Terminal</h3>
              <p className="text-xs text-text-secondary mt-1">
                Analyze dynamic option chains and place paper trades on indices and stock underlyings.
              </p>
            </div>

            {/* Selector Pills */}
            <div className="flex items-center gap-1.5 p-0.5 bg-background border border-border rounded-xl self-start overflow-x-auto max-w-full scrollbar-none">
              {UNDERLYING_LIST.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setFoUnderlying(u.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    foUnderlying === u.id
                      ? 'bg-emerald-500 text-black border border-emerald-500 shadow-sm shadow-emerald-500/10 font-extrabold'
                      : 'hover:bg-card-hover/20 text-text-secondary border border-transparent'
                  }`}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>

          {/* Expiry selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-t border-border/40 pt-4">
            <span className="text-[10px] font-black text-text-secondary uppercase tracking-wider shrink-0 mr-1">
              Expiry Date:
            </span>
            {expiryDates.map((d) => (
              <button
                key={d.value}
                onClick={() => setSelectedExpiry(d.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border whitespace-nowrap cursor-pointer ${
                  selectedExpiry === d.value
                    ? 'bg-emerald-500 text-black border border-emerald-500 shadow-sm'
                    : 'bg-background hover:bg-card-hover/20 text-text-secondary border-border'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Spot Details Header Banner */}
        {!underlyingQuote || spot === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-text-secondary">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-profit border-t-transparent" />
            <span className="text-xs font-bold">Querying underlying market index quote...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-background border border-border/80 rounded-xl font-bold text-xs">
              <div className="flex items-center gap-2">
                <span className="text-text-primary text-sm font-extrabold uppercase">
                  {foUnderlying.replace('.NS', '')} Spot:
                </span>
                <span className="font-mono text-sm text-text-primary font-black">
                  ₹{spot.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-black ${
                  spotChange >= 0 ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss'
                }`}
              >
                {spotChange >= 0 ? '▲ +' : '▼ '}
                {spotChange.toFixed(2)}%
              </span>
            </div>

            {/* Option Chain Grid */}
            <div className="overflow-x-auto border border-border/80 rounded-2xl">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="border-b border-border/80 text-[10px] font-black text-text-secondary bg-card-hover/20 text-center uppercase tracking-widest">
                    <th colSpan={3} className="p-3 border-r border-border/60 text-emerald-400 bg-emerald-500/5">
                      Call Options (CE)
                    </th>
                    <th className="p-3">Strike</th>
                    <th colSpan={3} className="p-3 border-l border-border/60 text-rose-400 bg-rose-500/5">
                      Put Options (PE)
                    </th>
                  </tr>
                  <tr className="border-b border-border/80 text-[9px] font-black text-text-secondary uppercase tracking-widest text-center">
                    <th className="p-3 bg-emerald-500/5">Change%</th>
                    <th className="p-3 bg-emerald-500/5">LTP (CE)</th>
                    <th className="p-3 border-r border-border/60 bg-emerald-500/5">Trade CE</th>
                    <th className="p-3 bg-background font-black text-text-primary text-xs">Strike Price</th>
                    <th className="p-3 border-l border-border/60 bg-rose-500/5">Trade PE</th>
                    <th className="p-3 bg-rose-500/5">LTP (PE)</th>
                    <th className="p-3 bg-rose-500/5">Change%</th>
                  </tr>
                </thead>
                <tbody>
                  {optionChainData.strikes.map((strike) => {
                    const callOpt = calculateOptionPrice(spot, strike, selectedExpiry, 'CE');
                    const putOpt = calculateOptionPrice(spot, strike, selectedExpiry, 'PE');

                    const callChangePositive = callOpt.change >= 0;
                    const putChangePositive = putOpt.change >= 0;

                    const isATM = strike === optionChainData.atmStrike;
                    const callSymbol = `${foUnderlying.split('.')[0]}-${selectedExpiry}-${strike}-CE`;
                    const putSymbol = `${foUnderlying.split('.')[0]}-${selectedExpiry}-${strike}-PE`;

                    const callName = `${foUnderlying.split('.')[0]} ${selectedExpiry} ${strike} CE`;
                    const putName = `${foUnderlying.split('.')[0]} ${selectedExpiry} ${strike} PE`;

                    return (
                      <tr
                        key={strike}
                        className={`border-b border-border/40 text-xs font-bold text-center transition-colors hover:bg-card-hover/5 ${
                          isATM ? 'bg-emerald-500/5 dark:bg-emerald-500/2 border-y border-emerald-500/10' : ''
                        }`}
                      >
                        {/* CALL CE DATA */}
                        <td
                          onClick={() => onTrade(callSymbol, callName, callOpt.price)}
                          className={`p-3 bg-emerald-500/5 tabular-nums cursor-pointer hover:bg-emerald-500/10 transition-colors ${
                            callChangePositive ? 'text-profit' : 'text-loss'
                          }`}
                        >
                          {callChangePositive ? '+' : ''}
                          {callOpt.pct.toFixed(2)}%
                        </td>
                        <td
                          onClick={() => onTrade(callSymbol, callName, callOpt.price)}
                          className="p-3 bg-emerald-500/5 font-mono font-black text-text-primary tabular-nums cursor-pointer hover:bg-emerald-500/10 transition-colors"
                        >
                          ₹{callOpt.price.toFixed(2)}
                        </td>
                        <td className="p-3 bg-emerald-500/5 border-r border-border/60">
                          <button
                            onClick={() => onTrade(callSymbol, callName, callOpt.price)}
                            className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-black rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                          >
                            Trade
                          </button>
                        </td>

                        {/* STRIKE PRICE */}
                        <td
                          className={`p-3 font-mono font-black text-xs text-center select-none ${
                            isATM
                              ? 'text-emerald-400 font-extrabold bg-emerald-500/10 border-x border-emerald-500/20 shadow-inner'
                              : 'text-text-primary bg-background'
                          }`}
                        >
                          <div className="relative">
                            {strike}
                            {isATM && (
                              <span className="absolute right-1 top-0 text-[7px] font-black px-1 rounded bg-emerald-500 text-black uppercase tracking-widest scale-90">
                                ATM
                              </span>
                            )}
                          </div>
                        </td>

                        {/* PUT PE DATA */}
                        <td className="p-3 bg-rose-500/5 border-l border-border/60">
                          <button
                            onClick={() => onTrade(putSymbol, putName, putOpt.price)}
                            className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-black rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                          >
                            Trade
                          </button>
                        </td>
                        <td
                          onClick={() => onTrade(putSymbol, putName, putOpt.price)}
                          className="p-3 bg-rose-500/5 font-mono font-black text-text-primary tabular-nums cursor-pointer hover:bg-rose-500/10 transition-colors"
                        >
                          ₹{putOpt.price.toFixed(2)}
                        </td>
                        <td
                          onClick={() => onTrade(putSymbol, putName, putOpt.price)}
                          className={`p-3 bg-rose-500/5 tabular-nums cursor-pointer hover:bg-rose-500/10 transition-colors ${
                            putChangePositive ? 'text-profit' : 'text-loss'
                          }`}
                        >
                          {putChangePositive ? '+' : ''}
                          {putOpt.pct.toFixed(2)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
