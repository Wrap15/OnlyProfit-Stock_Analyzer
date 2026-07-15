'use client';

import React from 'react';
import Link from 'next/link';

interface HoldingItem {
  name: string;
  sector: string;
  weight: number;
}

interface SectorAllocationItem {
  name: string;
  weight: number;
}

interface FundDetails {
  assetAllocation: {
    equity: number;
    debt: number;
    cash: number;
  };
  topHoldings: HoldingItem[];
}

interface MutualFundHoldingsTabProps {
  fund: FundDetails;
  sectorAllocation: SectorAllocationItem[];
}

const getStockSymbolLink = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('hdfc bank')) return 'HDFCBANK.NS';
  if (lower.includes('icici bank')) return 'ICICIBANK.NS';
  if (lower.includes('reliance')) return 'RELIANCE.NS';
  if (lower.includes('infosys')) return 'INFY.NS';
  if (lower.includes('tata consultancy') || lower.includes('tcs')) return 'TCS.NS';
  if (lower.includes('larsen')) return 'LT.NS';
  if (lower.includes('axis bank')) return 'AXISBANK.NS';
  if (lower.includes('state bank') || lower.includes('sbi')) return 'SBIN.NS';
  if (lower.includes('bharti airtel')) return 'BHARTIAIRTEL.NS';
  if (lower.includes('itc')) return 'ITC.NS';
  if (lower.includes('hindustan unilever')) return 'HINDUNILVR.NS';
  if (lower.includes('maruti')) return 'MARUTI.NS';
  if (lower.includes('sun pharma')) return 'SUNPHARMA.NS';
  if (lower.includes('tata steel')) return 'TATASTEEL.NS';
  return null;
};

export default function MutualFundHoldingsTab({
  fund,
  sectorAllocation,
}: MutualFundHoldingsTabProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Asset Allocation */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-soft dark:shadow-soft-dark space-y-5">
        <div>
          <h3 className="font-extrabold text-sm text-text-primary uppercase tracking-wider">
            Asset Class Allocation
          </h3>
          <p className="text-[10px] text-text-secondary font-medium mt-0.5">
            Breakdown of equity, debt, and cash components.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {[
            { label: 'Equity (Stocks)', val: fund.assetAllocation.equity, color: 'bg-indigo-500', desc: 'High-growth assets' },
            { label: 'Debt (Bonds)', val: fund.assetAllocation.debt, color: 'bg-amber-500', desc: 'Fixed income safety' },
            { label: 'Cash & Equivalents', val: fund.assetAllocation.cash, color: 'bg-emerald-500', desc: 'Liquidity reserves' }
          ].map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-background/40 border border-border/40 space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-black text-text-primary">{item.label}</span>
                <span className="text-sm font-black text-text-primary">{item.val}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-background border border-border/40 overflow-hidden">
                <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.val}%` }} />
              </div>
              <span className="block text-[9px] text-text-secondary font-semibold uppercase tracking-wider">{item.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sector Concentration */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-soft dark:shadow-soft-dark space-y-4">
        <div>
          <h3 className="font-extrabold text-sm text-text-primary uppercase tracking-wider">
            Sector Allocation Concentration
          </h3>
          <p className="text-[10px] text-text-secondary font-medium mt-0.5">
            Aggregated sector exposure weights calculated dynamically.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {sectorAllocation.map((sec, idx) => {
            const maxWeight = Math.max(...sectorAllocation.map((s) => s.weight));
            const barPct = maxWeight > 0 ? ((sec.weight / maxWeight) * 100).toFixed(0) : '0';
            
            return (
              <div key={idx} className="p-3.5 rounded-xl bg-background/30 border border-border/40 space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-text-primary">{sec.name}</span>
                  <span className="text-text-primary font-black">{sec.weight}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 rounded-full bg-background overflow-hidden">
                    <div className="h-full bg-profit rounded-full" style={{ width: `${barPct}%` }} />
                  </div>
                  <span className="text-[9px] font-bold text-text-secondary w-6 text-right">{barPct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Portfolio Top Holdings */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-soft dark:shadow-soft-dark space-y-4">
        <div>
          <h3 className="font-extrabold text-sm text-text-primary uppercase tracking-wider">
            Top Stocks Holdings
          </h3>
          <p className="text-[10px] text-text-secondary font-medium mt-0.5">
            Full stock details. Click on matching equities to explore our analysis sheets.
          </p>
        </div>

        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left border-collapse text-xs min-w-[500px]">
            <thead>
              <tr className="border-b border-border text-text-secondary uppercase text-[10px] font-black tracking-wider">
                <th className="py-2.5 px-1">Holding Stock</th>
                <th className="py-2.5 px-1">Sector</th>
                <th className="py-2.5 px-1 text-right">Portfolio Weight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30 font-bold">
              {fund.topHoldings.map((h, idx) => {
                const stockLink = getStockSymbolLink(h.name);
                
                return (
                  <tr key={idx} className="hover:bg-background/20 transition-colors">
                    <td className="py-3 px-1">
                      {stockLink ? (
                        <Link 
                          href={`/stock/${stockLink}`}
                          className="text-profit hover:underline flex items-center gap-1.5"
                        >
                          <span>{h.name}</span>
                          <span className="text-[9px] px-1.5 py-0.5 bg-profit/5 border border-profit/15 rounded font-black text-profit select-none uppercase tracking-wider">Analyze</span>
                        </Link>
                      ) : (
                        <span className="text-text-primary">{h.name}</span>
                      )}
                    </td>
                    <td className="py-3 px-1 text-text-secondary">{h.sector}</td>
                    <td className="py-3 px-1 text-right text-text-primary font-black">{h.weight}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
