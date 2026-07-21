'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, TrendingUp } from 'lucide-react';
import MiniSparkline, { generateMockSparkline } from '@/components/MiniSparkline';
import StockLogo from '@/components/StockLogo';

interface HoldingItem {
  symbol: string;
  avgBuyPrice: number;
  quantity: number;
  totalInvested: number;
}

interface HistoryItem {
  symbol: string;
  side: 'BUY' | 'SELL';
  status: string;
  timestamp: string | number;
}

interface SimulatorHoldingsTabProps {
  holdings: HoldingItem[];
  livePrices: Record<string, { price: number; change: number; pct: number }>;
  history: HistoryItem[];
  isMasked: boolean;
  onOpenTradeModal?: (symbol: string, side: 'BUY' | 'SELL', livePrice: number) => void;
}

export default function SimulatorHoldingsTab({
  holdings,
  livePrices,
  history,
  isMasked,
  onOpenTradeModal,
}: SimulatorHoldingsTabProps) {

  const renderSymbolName = (symbol: string) => {
    const isMF = symbol.startsWith('MF_') || !isNaN(Number(symbol));
    const cleanSym = symbol.replace('MF_', '').replace('.NS', '');
    return (
      <div className="flex items-center gap-2">
        <StockLogo symbol={symbol} size="xs" />
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-text-primary tracking-tight">{cleanSym}</span>
            {isMF && (
              <span className="text-[8px] font-black uppercase px-1.5 py-0.5 bg-profit/15 text-profit rounded border border-profit/30">
                Mutual Fund
              </span>
            )}
          </div>
          <span className="text-[10px] text-text-secondary font-semibold">
            {isMF ? 'AMFI Direct Growth' : 'NSE Equity'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-border/80 text-[10px] font-black text-text-secondary uppercase tracking-widest bg-card-hover/20">
              <th className="p-4 sm:p-5">Company</th>
              <th className="p-4 sm:p-5">Purchase Date</th>
              <th className="p-4 sm:p-5">Market price (1D%)</th>
              <th className="p-4 sm:p-5">Returns (Total / 1D)</th>
              <th className="p-4 sm:p-5">Current (Invested)</th>
              <th className="p-4 sm:p-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {holdings.length > 0 ? (
              holdings.map((h) => {
                const quote = livePrices[h.symbol];
                const ltp = quote ? quote.price : h.avgBuyPrice;
                const pct = quote ? quote.pct : 0;
                const isStockPositive = pct >= 0;
                const currentValue = ltp * h.quantity;
                const pnl = currentValue - h.totalInvested;
                const pnlPct = h.totalInvested > 0 ? (pnl / h.totalInvested) * 100 : 0;
                const isPnLPositive = pnl >= 0;
                const sparkPoints = generateMockSparkline(h.symbol, isStockPositive);

                const lastBuyOrder = history.find(
                  (hist) => hist.symbol === h.symbol && hist.side === 'BUY' && hist.status === 'EXECUTED'
                );
                const purchaseDate = lastBuyOrder 
                  ? new Date(lastBuyOrder.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                  : 'N/A';
                const isBoughtToday = lastBuyOrder && new Date(lastBuyOrder.timestamp).toDateString() === new Date().toDateString();

                const holdingDayPnL = isBoughtToday 
                  ? (ltp - h.avgBuyPrice) * h.quantity 
                  : (quote ? quote.change : 0) * h.quantity;
                const holdingDayPnLPct = isBoughtToday
                  ? (h.avgBuyPrice > 0 ? ((ltp - h.avgBuyPrice) / h.avgBuyPrice) * 100 : 0)
                  : pct;
                const isHoldingDayPnLPositive = holdingDayPnL >= 0;

                return (
                  <tr key={h.symbol} className="border-b border-border/40 hover:bg-card-hover/10 text-xs font-bold transition-all">
                    {/* Company Column */}
                    <td className="p-4 sm:p-5">
                      <div className="flex items-center gap-3">
                        <div className="min-w-0">
                          {renderSymbolName(h.symbol)}
                          <div className="text-[10px] text-text-secondary font-medium mt-0.5 truncate">
                            {h.quantity} shares • Avg. ₹{h.avgBuyPrice.toFixed(2)}
                          </div>
                        </div>
                        <div className="ml-auto pr-2 shrink-0">
                          <MiniSparkline data={sparkPoints} isPositive={isStockPositive} width={60} height={20} />
                        </div>
                      </div>
                    </td>

                    {/* Purchase Date Column */}
                    <td className="p-4 sm:p-5">
                      <div className="font-extrabold text-text-secondary tabular-nums">
                        {purchaseDate}
                      </div>
                    </td>

                    {/* Market Price Column */}
                    <td className="p-4 sm:p-5">
                      <div className="font-extrabold text-text-primary tabular-nums font-mono">
                        ₹{ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <div className={`text-[10px] font-black tabular-nums flex items-center gap-0.5 mt-0.5 ${isStockPositive ? 'text-profit' : 'text-loss'}`}>
                        <span>{isStockPositive ? '▲ +' : '▼ '}{pct.toFixed(2)}%</span>
                      </div>
                    </td>

                    {/* Returns Column */}
                    <td className="p-4 sm:p-5">
                      <div className={`font-black tabular-nums font-mono ${isPnLPositive ? 'text-profit' : 'text-loss'}`}>
                        {isMasked ? '•••••' : `${isPnLPositive ? '+' : ''}₹${pnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                      </div>
                      <div className={`text-[10px] font-black tabular-nums flex items-center gap-0.5 mt-0.5 ${isPnLPositive ? 'text-profit' : 'text-loss'}`}>
                        <span>Total: {isPnLPositive ? '+' : ''}{pnlPct.toFixed(2)}%</span>
                      </div>
                      <div className={`text-[10px] font-black tabular-nums flex items-center gap-0.5 mt-1.5 ${isHoldingDayPnLPositive ? 'text-profit' : 'text-loss'}`}>
                        <span>1D: {isMasked ? '•••••' : `${isHoldingDayPnLPositive ? '+' : ''}₹${holdingDayPnL.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} ({isHoldingDayPnLPositive ? '+' : ''}{holdingDayPnLPct.toFixed(2)}%)</span>
                      </div>
                    </td>

                    {/* Current (Invested) Column */}
                    <td className="p-4 sm:p-5">
                      <div className="font-extrabold text-text-primary tabular-nums font-mono">
                        {isMasked ? '•••••' : `₹${currentValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                      </div>
                      <div className="text-[10px] text-text-secondary font-medium tabular-nums mt-0.5">
                        ₹{h.totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </td>

                    {/* Action Row */}
                    <td className="p-4 sm:p-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenTradeModal ? onOpenTradeModal(h.symbol, 'BUY', ltp) : null}
                          className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/20 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                        >
                          Buy
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenTradeModal ? onOpenTradeModal(h.symbol, 'SELL', ltp) : null}
                          className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                        >
                          Sell / Redeem
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="p-12 text-center text-xs text-text-secondary font-bold">
                  <div className="flex flex-col items-center justify-center gap-4 py-4">
                    <TrendingUp className="h-10 w-10 text-text-secondary/30 animate-pulse" />
                    <div className="space-y-1">
                      <div>No active CNC Holdings found.</div>
                      <div className="text-[10px] font-medium text-text-secondary/80">Place a delivery order from any stock page to build your portfolio.</div>
                    </div>
                    <Link 
                      href="/?tab=explore"
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-500/10 active:scale-[0.98]"
                    >
                      Explore Stocks to Buy
                    </Link>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards list */}
      <div className="block sm:hidden space-y-3 p-4 bg-background/20">
        {holdings.length > 0 ? (
          holdings.map((h) => {
            const quote = livePrices[h.symbol];
            const ltp = quote ? quote.price : h.avgBuyPrice;
            const pct = quote ? quote.pct : 0;
            const isStockPositive = pct >= 0;
            const currentValue = ltp * h.quantity;
            const pnl = currentValue - h.totalInvested;
            const pnlPct = h.totalInvested > 0 ? (pnl / h.totalInvested) * 100 : 0;
            const isPnLPositive = pnl >= 0;

            const lastBuyOrder = history.find(
              (hist) => hist.symbol === h.symbol && hist.side === 'BUY' && hist.status === 'EXECUTED'
            );
            const purchaseDate = lastBuyOrder 
              ? new Date(lastBuyOrder.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
              : 'N/A';
            const isBoughtToday = lastBuyOrder && new Date(lastBuyOrder.timestamp).toDateString() === new Date().toDateString();

            const holdingDayPnL = isBoughtToday 
              ? (ltp - h.avgBuyPrice) * h.quantity 
              : (quote ? quote.change : 0) * h.quantity;
            const holdingDayPnLPct = isBoughtToday
              ? (h.avgBuyPrice > 0 ? ((ltp - h.avgBuyPrice) / h.avgBuyPrice) * 100 : 0)
              : pct;
            const isHoldingDayPnLPositive = holdingDayPnL >= 0;

            return (
              <div key={h.symbol} className="p-4 rounded-2xl border border-border bg-card flex flex-col gap-3.5 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-1.5">
                      {renderSymbolName(h.symbol)}
                      <span className="text-[8px] font-black text-text-secondary/75 uppercase bg-background border border-border px-1 py-0.5 rounded">CNC</span>
                    </div>
                    <div className="text-[10px] text-text-secondary font-semibold mt-1">
                      {h.quantity} shares • Avg: ₹{h.avgBuyPrice.toFixed(2)}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-mono font-black text-text-primary">₹{ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    <span className={`text-[9px] font-black mt-0.5 ${isStockPositive ? 'text-profit' : 'text-loss'}`}>
                      {isStockPositive ? '▲ +' : '▼ '}{pct.toFixed(2)}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40 text-[10px]">
                  <div>
                    <span className="text-text-secondary font-semibold">Total Invested:</span>
                    <div className="font-mono font-extrabold text-text-primary mt-0.5">₹{h.totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                  </div>
                  <div>
                    <span className="text-text-secondary font-semibold">Current Value:</span>
                    <div className="font-mono font-extrabold text-text-primary mt-0.5">{isMasked ? '•••••' : `₹${currentValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40 text-[10px]">
                  <div>
                    <span className="text-text-secondary font-semibold">Total PnL Returns:</span>
                    <div className={`font-mono font-black mt-0.5 ${isPnLPositive ? 'text-profit' : 'text-loss'}`}>
                      {isMasked ? '•••••' : `${isPnLPositive ? '+' : ''}₹${pnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} ({isPnLPositive ? '+' : ''}{pnlPct.toFixed(2)}%)
                    </div>
                  </div>
                  <div>
                    <span className="text-text-secondary font-semibold">1D Return:</span>
                    <div className={`font-mono font-black mt-0.5 ${isHoldingDayPnLPositive ? 'text-profit' : 'text-loss'}`}>
                      {isMasked ? '•••••' : `${isHoldingDayPnLPositive ? '+' : ''}₹${holdingDayPnL.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} ({isHoldingDayPnLPositive ? '+' : ''}{holdingDayPnLPct.toFixed(2)}%)
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-border/40 text-[9px] text-text-secondary font-semibold">
                  <span>Bought: {purchaseDate}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onOpenTradeModal ? onOpenTradeModal(h.symbol, 'BUY', ltp) : null}
                      className="px-2.5 py-1 bg-emerald-500 text-black rounded-lg font-black uppercase tracking-wider active:scale-95 transition-all"
                    >
                      Buy
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenTradeModal ? onOpenTradeModal(h.symbol, 'SELL', ltp) : null}
                      className="px-2.5 py-1 bg-rose-500 text-white rounded-lg font-black uppercase tracking-wider active:scale-95 transition-all"
                    >
                      Redeem
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-10 bg-card rounded-2xl border border-border p-4">
            <TrendingUp className="h-8 w-8 text-text-secondary/30 mx-auto mb-2 animate-pulse" />
            <span className="text-[10px] text-text-secondary font-semibold block">No delivery holdings found.</span>
            <Link 
              href="/?tab=explore"
              className="mt-3 inline-block px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black rounded-xl text-[9px] font-black uppercase tracking-wider shadow-md shadow-emerald-500/10 active:scale-[0.98]"
            >
              Explore Stocks to Buy
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
