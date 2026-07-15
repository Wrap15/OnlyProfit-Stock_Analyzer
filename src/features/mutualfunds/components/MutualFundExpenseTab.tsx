'use client';

import React from 'react';
import { Clock, Percent } from 'lucide-react';

interface FundDetails {
  expenseRatio: number;
  categoryAvgExpenseRatio: number;
  exitLoad: string;
}

interface MutualFundExpenseTabProps {
  fund: FundDetails;
}

export default function MutualFundExpenseTab({ fund }: MutualFundExpenseTabProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Expense details */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-soft dark:shadow-soft-dark space-y-5">
        <div>
          <h3 className="font-extrabold text-sm text-text-primary uppercase tracking-wider">
            Fees, Charges & Stamp Duty
          </h3>
          <p className="text-[10px] text-text-secondary font-medium mt-0.5">
            Scheme maintenance costs, entry-exit loads, and government purchase charges.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-background/40 border border-border/40 space-y-1">
            <span className="text-[10px] font-black text-text-secondary uppercase tracking-wider">Expense Ratio</span>
            <span className="block text-base font-black text-text-primary">{fund.expenseRatio}%</span>
            <span className="block text-[9px] text-text-secondary font-medium">Category Avg: {fund.categoryAvgExpenseRatio}%</span>
          </div>

          <div className="p-4 rounded-xl bg-background/40 border border-border/40 space-y-1">
            <span className="text-[10px] font-black text-text-secondary uppercase tracking-wider">Exit Load</span>
            <span className="block text-xs font-black text-text-primary truncate" title={fund.exitLoad}>
              {fund.exitLoad.split(',')[0]}
            </span>
            <span className="block text-[9px] text-text-secondary font-medium">Charges on redemption</span>
          </div>

          <div className="p-4 rounded-xl bg-background/40 border border-border/40 space-y-1">
            <span className="text-[10px] font-black text-text-secondary uppercase tracking-wider">Stamp Duty</span>
            <span className="block text-base font-black text-text-primary">0.005%</span>
            <span className="block text-[9px] text-text-secondary font-medium">Govt charge on purchase</span>
          </div>
        </div>
      </div>

      {/* Equity Tax Implications */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-soft dark:shadow-soft-dark space-y-4">
        <div>
          <h3 className="font-extrabold text-sm text-text-primary uppercase tracking-wider">
            Mutual Fund Taxation (Equity)
          </h3>
          <p className="text-[10px] text-text-secondary font-medium mt-0.5">
            Tax rules applied to capital gains upon redemption (FY 2026-27 rules).
          </p>
        </div>

        <div className="space-y-4 pt-2">
          <div className="flex gap-4 p-4 rounded-xl bg-rose-500/5 border border-rose-500/15">
            <div className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
              <Clock className="h-4.5 w-4.5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-text-primary">Short-Term Capital Gains (STCG)</h4>
              <p className="text-[11px] text-text-secondary leading-relaxed mt-1 font-medium">
                If you redeem your mutual fund units **within 1 year** of purchase, gains are taxed at a flat rate of <strong className="text-rose-500 font-extrabold">20.00%</strong>.
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <Percent className="h-4.5 w-4.5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-text-primary">Long-Term Capital Gains (LTCG)</h4>
              <p className="text-[11px] text-text-secondary leading-relaxed mt-1 font-medium">
                If you redeem units **after 1 year** of purchase, gains are taxed at <strong className="text-profit font-extrabold">12.50%</strong>. 
                However, gains up to <strong className="text-text-primary">₹1.25 Lakhs</strong> per financial year are completely tax-exempt.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
