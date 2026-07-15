'use client';

import React from 'react';
import { History } from 'lucide-react';
import StockLogo from '@/components/StockLogo';

interface HistoryItem {
  id: string;
  timestamp: string | number;
  symbol: string;
  side: 'BUY' | 'SELL';
  type: string;
  productType: string;
  quantity: number;
  executionPrice?: number;
  brokerage: number;
  taxes: number;
  status: string;
  rejectionReason?: string;
}

interface SimulatorHistoryTabProps {
  history: HistoryItem[];
}

export default function SimulatorHistoryTab({ history }: SimulatorHistoryTabProps) {
  const renderSymbolName = (symbol: string) => {
    const cleanSym = symbol.replace('.NS', '');
    return (
      <div className="flex items-center gap-2">
        <StockLogo symbol={symbol} size="xs" />
        <span className="font-black text-text-primary tracking-tight">{cleanSym}</span>
      </div>
    );
  };

  return (
    <>
      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[750px]">
          <thead>
            <tr className="border-b border-border/80 text-[10px] font-black text-text-secondary uppercase tracking-widest bg-card-hover/20">
              <th className="p-4 sm:p-5">Date & Time</th>
              <th className="p-4 sm:p-5">Symbol</th>
              <th className="p-4 sm:p-5">Type</th>
              <th className="p-4 sm:p-5">Product</th>
              <th className="p-4 sm:p-5">Qty</th>
              <th className="p-4 sm:p-5">Exec Price</th>
              <th className="p-4 sm:p-5">Fees Paid</th>
              <th className="p-4 sm:p-5">Status</th>
              <th className="p-4 sm:p-5 text-right">Reason</th>
            </tr>
          </thead>
          <tbody>
            {history.length > 0 ? (
              history.map((h) => (
                <tr key={h.id} className="border-b border-border/40 hover:bg-card-hover/10 text-xs font-bold transition-all">
                  <td className="p-4 sm:p-5 text-text-secondary">
                    {new Date(h.timestamp).toLocaleString('en-IN', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-4 sm:p-5">
                    {renderSymbolName(h.symbol)}
                  </td>
                  <td className={`p-4 sm:p-5 font-black uppercase text-[10px] tracking-wider ${h.side === 'BUY' ? 'text-profit' : 'text-loss'}`}>
                    {h.side} ({h.type})
                  </td>
                  <td className="p-4 sm:p-5 text-text-secondary uppercase tracking-wider text-[10px]">{h.productType}</td>
                  <td className="p-4 sm:p-5 text-text-primary">{h.quantity}</td>
                  <td className="p-4 sm:p-5 text-text-primary">
                    {h.status === 'EXECUTED' ? `₹${h.executionPrice?.toFixed(2)}` : '-'}
                  </td>
                  <td className="p-4 sm:p-5 text-text-secondary">
                    ₹{(h.brokerage + h.taxes).toFixed(2)}
                  </td>
                  <td className="p-4 sm:p-5">
                    <span className={`px-2 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-wider ${
                      h.status === 'EXECUTED'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : h.status === 'CANCELLED'
                        ? 'bg-slate-500/10 border-slate-500/20 text-text-secondary'
                        : 'bg-red-500/10 border-red-500/20 text-red-500'
                    }`}>
                      {h.status}
                    </span>
                  </td>
                  <td className="p-4 sm:p-5 text-right text-text-secondary max-w-xs truncate">
                    {h.rejectionReason || '-'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="p-12 text-center text-xs text-text-secondary font-bold">
                  <History className="w-10 h-10 mx-auto text-text-secondary/30 mb-2 animate-pulse" />
                  No transaction history available. Completed buy/sell logs appear here.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards list */}
      <div className="block sm:hidden space-y-3 p-4 bg-background/20">
        {history.length > 0 ? (
          history.map((h) => (
            <div key={h.id} className="p-4 rounded-2xl border border-border bg-card flex flex-col gap-2 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-1.5">
                    {renderSymbolName(h.symbol)}
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                      h.side === 'BUY' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-500'
                    }`}>
                      {h.side}
                    </span>
                    <span className="text-[8px] font-black text-text-secondary/85 uppercase bg-background border border-border px-1 py-0.5 rounded">{h.productType}</span>
                  </div>
                  <span className="text-[8px] text-text-secondary font-semibold block mt-1">
                    {new Date(h.timestamp).toLocaleString('en-IN', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                <span className={`px-2 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-wider shrink-0 ${
                  h.status === 'EXECUTED'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : h.status === 'CANCELLED'
                    ? 'bg-slate-500/10 border-slate-500/20 text-text-secondary'
                    : 'bg-red-500/10 border-red-500/20 text-red-500'
                }`}>
                  {h.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/40 text-[10px] font-semibold text-text-secondary">
                <div>
                  <span>Quantity:</span>
                  <div className="font-extrabold text-text-primary mt-0.5">{h.quantity}</div>
                </div>
                <div>
                  <span>Price:</span>
                  <div className="font-mono font-extrabold text-text-primary mt-0.5">₹{h.executionPrice?.toFixed(2)}</div>
                </div>
                <div>
                  <span>Fees Paid:</span>
                  <div className="font-mono font-extrabold text-text-primary mt-0.5">₹{(h.brokerage + h.taxes).toFixed(2)}</div>
                </div>
              </div>

              {h.rejectionReason && (
                <div className="mt-1.5 p-2 bg-red-500/5 border border-red-500/10 text-red-400 rounded-lg text-[9px] font-bold">
                  Reason: {h.rejectionReason}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-10 bg-card rounded-2xl border border-border p-4">
            <History className="h-8 w-8 text-text-secondary/30 mx-auto mb-2" />
            <span className="text-[10px] text-text-secondary font-semibold block">No completed trades found.</span>
          </div>
        )}
      </div>
    </>
  );
}
