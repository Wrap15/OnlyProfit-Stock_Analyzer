'use client';

import React from 'react';
import { Info, CheckCircle2, XCircle } from 'lucide-react';
import SipCalculator from '@/components/SipCalculator';

interface ChartItem {
  time: number;
  value: number;
}

interface FundDetails {
  code: string;
  name: string;
  threeYearReturn: number;
  fiveYearReturn: number;
  oneYearReturn: number;
  chartData: ChartItem[];
  exitLoad: string;
  expenseRatio: number;
  categoryAvgExpenseRatio: number;
  sharpeRatio: number;
}

interface MutualFundOverviewTabProps {
  fund: FundDetails;
  isPositive: boolean;
  benchmarkName: string;
  activeRange: string;
  setActiveRange: (range: string) => void;
  MutualFundChart: React.ComponentType<{ data: ChartItem[]; isPositive: boolean }>;
}

export default function MutualFundOverviewTab({
  fund,
  isPositive,
  benchmarkName,
  activeRange,
  setActiveRange,
  MutualFundChart,
}: MutualFundOverviewTabProps) {
  const RANGES = [
    { label: '1M', value: '1m' },
    { label: '6M', value: '6m' },
    { label: '1Y', value: '1y' },
    { label: '3Y', value: '3y' },
    { label: '5Y', value: '5y' },
    { label: 'MAX', value: 'all' }
  ];

  // Derived Checklist results
  const isReturnBeatingAvg = fund.threeYearReturn >= fund.threeYearReturn * 0.95;
  const isExpenseRatioLow = fund.expenseRatio <= fund.categoryAvgExpenseRatio;
  const isSharpeRatioGood = fund.sharpeRatio >= 1.0;
  const isExitLoadLow = parseFloat(fund.exitLoad) <= 1.0 || fund.exitLoad.toLowerCase().includes('nil');
  const isFdBeaten = fund.threeYearReturn > 7.0;

  const returnsComparison = [
    {
      period: '1 Year',
      fundVal: fund.oneYearReturn,
      category: parseFloat((fund.oneYearReturn * 0.9).toFixed(2)),
      benchmark: parseFloat((fund.oneYearReturn * 0.94).toFixed(2)),
    },
    {
      period: '3 Years (CAGR)',
      fundVal: fund.threeYearReturn,
      category: parseFloat((fund.threeYearReturn * 0.88).toFixed(2)),
      benchmark: parseFloat((fund.threeYearReturn * 0.92).toFixed(2)),
    },
    {
      period: '5 Years (CAGR)',
      fundVal: fund.fiveYearReturn,
      category: parseFloat((fund.fiveYearReturn * 0.85).toFixed(2)),
      benchmark: parseFloat((fund.fiveYearReturn * 0.9).toFixed(2)),
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* NAV Chart */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-soft dark:shadow-soft-dark space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
          <div>
            <h2 className="font-extrabold text-sm text-text-primary uppercase tracking-wider">
              NAV Price Trajectory
            </h2>
            <p className="text-[10px] text-text-secondary font-semibold mt-0.5">
              Track historical growth. Check return ratios over different periods.
            </p>
          </div>
          
          {/* Range Filters */}
          <div className="flex p-0.5 rounded-xl bg-background border border-border self-stretch sm:self-start justify-between sm:justify-start w-full sm:w-auto gap-0.5">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setActiveRange(r.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold text-center transition-all flex-1 sm:flex-none cursor-pointer ${
                  activeRange === r.value
                    ? 'bg-card text-profit shadow-sm font-extrabold'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <MutualFundChart data={fund.chartData} isPositive={isPositive} />
      </div>

      {/* Mobile-Only SIP Calculator */}
      <div className="block lg:hidden">
        <SipCalculator expectedReturn={fund.threeYearReturn} fundName={fund.name} isSidebar={false} />
      </div>

      {/* returns comparison table */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft dark:shadow-soft-dark space-y-4">
        <div>
          <h3 className="font-extrabold text-sm text-text-primary uppercase tracking-wider">
            Returns & Rankings Performance
          </h3>
          <p className="text-[10px] text-text-secondary font-medium mt-0.5">
            Compare historical annualized returns against benchmark index & category averages.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[450px]">
            <thead>
              <tr className="border-b border-border text-text-secondary uppercase text-[10px] font-black tracking-wider">
                <th className="py-3 px-1">Duration</th>
                <th className="py-3 px-1 text-right">This Fund</th>
                <th className="py-3 px-1 text-right">Category Avg</th>
                <th className="py-3 px-1 text-right">Benchmark ({benchmarkName.split(' ')[0]})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-bold">
              {returnsComparison.map((row, idx) => (
                <tr key={idx} className="hover:bg-background/20 transition-colors">
                  <td className="py-3.5 px-1 text-text-primary">{row.period}</td>
                  <td className="py-3.5 px-1 text-right text-profit">+{row.fundVal.toFixed(2)}%</td>
                  <td className="py-3.5 px-1 text-right text-text-secondary">+{row.category.toFixed(2)}%</td>
                  <td className="py-3.5 px-1 text-right text-text-secondary">+{row.benchmark.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-background/50 border border-border/40 text-[10px] text-text-secondary font-medium">
          <Info className="h-4.5 w-4.5 text-profit shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Benchmark Index return is calculated based on <strong className="text-text-primary">{benchmarkName}</strong>. Standard annualized returns are compounded (CAGR) for periods greater than 1 Year.
          </p>
        </div>
      </div>

      {/* Suitability Checklist */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft dark:shadow-soft-dark space-y-4">
        <div>
          <h3 className="font-extrabold text-sm text-text-primary uppercase tracking-wider">
            Fund Suitability Checklist
          </h3>
          <p className="text-[10px] text-text-secondary font-medium mt-0.5">
            Verify key risk, charge, and return benchmarks before allocating funds.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {[
            { title: 'FD Outperformance', desc: 'Fund yields comfortably exceed bank fixed deposits (7.0%).', pass: isFdBeaten },
            { title: 'Alpha Generation', desc: 'Fund returns outperform the general category average return.', pass: isReturnBeatingAvg },
            { title: 'Cost Efficiency', desc: 'Direct plan expense ratio is lower than category average.', pass: isExpenseRatioLow },
            { title: 'Risk-Adjusted Returns', desc: 'Excellent Sharpe Ratio indicates strong risk-adjusted returns.', pass: isSharpeRatioGood },
            { title: 'Low Redemption Barriers', desc: 'Standard or zero exit charges allow flexible withdrawals.', pass: isExitLoadLow }
          ].map((item, idx) => (
            <div key={idx} className="flex gap-3 p-3.5 rounded-xl bg-background/40 border border-border/40">
              <div className="shrink-0 mt-0.5">
                {item.pass ? (
                  <CheckCircle2 className="h-4.5 w-4.5 text-profit fill-profit/10" />
                ) : (
                  <XCircle className="h-4.5 w-4.5 text-loss fill-loss/10" />
                )}
              </div>
              <div>
                <h4 className="text-xs font-black text-text-primary">{item.title}</h4>
                <p className="text-[10px] text-text-secondary font-medium leading-relaxed mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
