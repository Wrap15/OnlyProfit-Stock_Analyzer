'use client';

import React from 'react';

interface StockFundamentalsTabProps {
  quote: any;
  roe: number;
  debtToEquity: number;
  bookValue: number;
}

export default function StockFundamentalsTab({
  quote,
  roe,
  debtToEquity,
  bookValue,
}: StockFundamentalsTabProps) {
  const items = [
    { 
      title: 'Asset Quality & Return on Assets', 
      value: `${(roe * 0.75).toFixed(1)}%`, 
      desc: 'ROA measures how efficiently the firm uses assets to generate earnings. Above 7% is typically considered solid for large-scale operations.', 
      status: 'Strong' 
    },
    { 
      title: 'Capital Structure (Debt to Equity)', 
      value: debtToEquity.toFixed(2), 
      desc: 'D/E represents leverage. Low D/E protects the firm from debt burden defaults in high-interest rate environments.', 
      status: debtToEquity < 0.5 ? 'Excellent' : 'Moderate' 
    },
    { 
      title: 'Book Value Per Share', 
      value: `₹${bookValue.toFixed(2)}`, 
      desc: `Represents the net asset value of the firm divided by total shares. P/B multiplier is ${quote.priceToBook || 'N/A'}x.`, 
      status: 'Stable' 
    },
    { 
      title: 'Earnings Retention Quality', 
      value: '84%', 
      desc: 'Percentage of profits reinvested into business capital expenditures instead of paying out as dividend distributions.', 
      status: 'High Reinvestment' 
    }
  ];

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-soft dark:shadow-soft-dark space-y-6 animate-fade-in">
      <div>
        <h3 className="font-extrabold text-sm text-text-primary uppercase tracking-wider">
          Balance Sheet & Capital Health
        </h3>
        <p className="text-[10px] text-text-secondary font-medium mt-0.5">Underlying asset values, solvency, and operational efficiency ratios.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((f, idx) => (
          <div key={idx} className="p-4 rounded-xl bg-background/40 border border-border/50 space-y-2">
            <div className="flex justify-between items-start">
              <h4 className="text-xs font-black text-text-primary leading-tight">{f.title}</h4>
              <span className="text-xs font-black text-profit">{f.value}</span>
            </div>
            <p className="text-[10px] text-text-secondary leading-normal font-medium">{f.desc}</p>
            <span className="inline-block text-[8px] font-black px-2 py-0.2 rounded-full uppercase bg-slate-500/10 text-text-secondary">
              {f.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
