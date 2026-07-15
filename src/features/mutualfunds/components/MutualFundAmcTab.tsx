'use client';

import React from 'react';
import { Landmark, Users, Layers } from 'lucide-react';

interface Manager {
  name: string;
  bio: string;
  tenure: string;
}

interface FundDetails {
  fundHouse: string;
  fundManager: Manager;
}

interface AmcInfo {
  incorp: string;
  rank: string;
  totalAum: string;
}

interface MutualFundAmcTabProps {
  fund: FundDetails;
  amcInfo: AmcInfo;
}

export default function MutualFundAmcTab({
  fund,
  amcInfo,
}: MutualFundAmcTabProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* AMC corporate statistics */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-soft dark:shadow-soft-dark space-y-4">
        <div>
          <h3 className="font-extrabold text-sm text-text-primary uppercase tracking-wider">
            About the Asset Management Company
          </h3>
          <p className="text-[10px] text-text-secondary font-medium mt-0.5">
            Corporate details and size of the fund house.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-background/40 border border-border/40">
            <div className="h-8 w-8 rounded-lg bg-profit/10 text-profit flex items-center justify-center shrink-0">
              <Landmark className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="block text-[9px] font-black text-text-secondary uppercase tracking-wider">AMC Incorporated</span>
              <span className="block text-xs font-black text-text-primary mt-0.5">{amcInfo.incorp}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-xl bg-background/40 border border-border/40">
            <div className="h-8 w-8 rounded-lg bg-profit/10 text-profit flex items-center justify-center shrink-0">
              <Users className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="block text-[9px] font-black text-text-secondary uppercase tracking-wider">AMC Market Rank</span>
              <span className="block text-xs font-black text-text-primary mt-0.5">{amcInfo.rank}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-xl bg-background/40 border border-border/40">
            <div className="h-8 w-8 rounded-lg bg-profit/10 text-profit flex items-center justify-center shrink-0">
              <Layers className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="block text-[9px] font-black text-text-secondary uppercase tracking-wider">Total AMC AUM</span>
              <span className="block text-xs font-black text-text-primary mt-0.5">{amcInfo.totalAum}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fund Manager Profile */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-soft dark:shadow-soft-dark space-y-4">
        <div>
          <h3 className="font-extrabold text-sm text-text-primary uppercase tracking-wider">
            Fund Managers Portfolio Profiles
          </h3>
          <p className="text-[10px] text-text-secondary font-medium mt-0.5">
            Meet the fund managers driving stock selection.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-start pt-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-profit/10 border border-profit/15 text-profit font-black uppercase shrink-0">
            {fund.fundManager.name.split(' ').map((n) => n[0]).join('')}
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2 flex-wrap">
              <h4 className="text-sm font-black text-text-primary">{fund.fundManager.name}</h4>
              <span className="text-[10px] font-bold text-profit px-2 py-0.5 bg-profit/5 border border-profit/10 rounded-md">
                Managing {fund.fundManager.tenure}
              </span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed font-medium pt-1.5">
              {fund.fundManager.bio}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
