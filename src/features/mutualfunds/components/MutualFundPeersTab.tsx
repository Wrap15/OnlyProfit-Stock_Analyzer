'use client';

import React from 'react';
import Link from 'next/link';

interface PeerFund {
  code: string;
  name: string;
  nav: number;
  oneYearReturn: number;
  threeYearReturn: number;
}

interface MutualFundPeersTabProps {
  peers: PeerFund[];
  peersLoading: boolean;
}

export default function MutualFundPeersTab({
  peers,
  peersLoading,
}: MutualFundPeersTabProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-card border border-border rounded-2xl p-6 shadow-soft dark:shadow-soft-dark space-y-4">
        <div>
          <h3 className="font-extrabold text-sm text-text-primary uppercase tracking-wider">
            Category Peer Comparison
          </h3>
          <p className="text-[10px] text-text-secondary font-medium mt-0.5">
            Compare live NAV and performance returns against top funds in the same segment.
          </p>
        </div>

        {peersLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-text-secondary">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-profit border-t-transparent" />
            <span className="text-xs font-bold">Fetching peer comparison data...</span>
          </div>
        ) : peers.length > 0 ? (
          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left border-collapse text-xs min-w-[500px]">
              <thead>
                <tr className="border-b border-border text-text-secondary uppercase text-[10px] font-black tracking-wider">
                  <th className="py-2.5 px-1">Peer Fund Scheme</th>
                  <th className="py-2.5 px-1 text-right">NAV</th>
                  <th className="py-2.5 px-1 text-right">1Y Return</th>
                  <th className="py-2.5 px-1 text-right">3Y CAGR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30 font-bold">
                {peers.map((peer, idx) => (
                  <tr key={idx} className="hover:bg-background/20 transition-colors">
                    <td className="py-3.5 px-1">
                      <Link 
                        href={`/mutualfund/${peer.code}`}
                        className="text-profit hover:underline font-black"
                      >
                        {peer.name}
                      </Link>
                    </td>
                    <td className="py-3.5 px-1 text-right text-text-primary">₹{peer.nav.toFixed(2)}</td>
                    <td className="py-3.5 px-1 text-right text-profit">+{peer.oneYearReturn.toFixed(2)}%</td>
                    <td className="py-3.5 px-1 text-right text-profit">+{peer.threeYearReturn.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-text-secondary font-bold">
            No matching category peer funds available in this category folder.
          </div>
        )}
      </div>
    </div>
  );
}
