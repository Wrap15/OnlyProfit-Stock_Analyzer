'use client';

import React from 'react';
import { ChevronDown, X } from 'lucide-react';

interface IpoDetails {
  minPrice?: number;
  maxPrice?: number;
  lotSize?: number;
}

interface IpoItem {
  symbol: string;
  companyName: string;
  searchId: string;
  logoUrl?: string;
  isSme?: boolean;
  overallSubscription?: number;
  bidStartTimestamp?: number;
  bidEndTimestamp?: number;
  documentUrl?: string;
  openingDate?: string;
  closingDate?: string;
  issuePrice?: number;
  isListed?: boolean;
  listingPrice?: number;
  listingTimestamp?: number;
  listingReturn?: number;
  rtaLink?: string;
  categories?: IpoDetails[];
}

interface IpoSectionProps {
  ipoData: { open: IpoItem[]; closed: IpoItem[]; upcoming: IpoItem[] } | null;
  ipoLoading: boolean;
  ipoCategory: 'mainboard' | 'sme';
  setIpoCategory: (category: 'mainboard' | 'sme') => void;
  setSelectedIpoSearchId: (id: string | null) => void;
}

export default function IpoSection({
  ipoData,
  ipoLoading,
  ipoCategory,
  setIpoCategory,
  setSelectedIpoSearchId,
}: IpoSectionProps) {
  // Date formatting helpers
  const formatDate = (timestamp: number | null | undefined): string => {
    if (!timestamp) return 'TBA';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const formatDateStr = (dateStr: string | null | undefined): string => {
    if (!dateStr) return 'TBA';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-6 animate-fade-in gpu-layer">
      {/* Category Filter Pills (Mainboard vs SME) */}
      <div className="flex justify-between items-center gap-4">
        <div className="flex gap-1.5 p-1 bg-card border border-border/70 rounded-xl">
          {[
            { id: 'mainboard', label: 'Mainboard IPOs' },
            { id: 'sme', label: 'SME IPOs' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setIpoCategory(cat.id as any)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black shrink-0 transition-all duration-200 cursor-pointer ${
                ipoCategory === cat.id
                  ? 'bg-profit/10 text-profit border border-profit/15 shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-background border border-transparent'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider bg-card border border-border/80 px-2 py-1 rounded-lg">
          IPO Live Feed
        </span>
      </div>

      {ipoLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-text-secondary">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-profit border-t-transparent" />
          <span className="text-xs font-bold">Fetching latest IPO listings...</span>
        </div>
      ) : ipoData ? (
        <div className="space-y-8">
          {/* SECTION 1: OPEN IPOS */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-2 w-2 rounded-full bg-profit animate-pulse" />
              <h3 className="font-extrabold text-sm text-text-primary tracking-tight">Open IPOs</h3>
            </div>
            {(() => {
              const list = (ipoData.open || []).filter((item) =>
                ipoCategory === 'sme' ? item.isSme : !item.isSme
              );
              if (list.length === 0) {
                return (
                  <div className="text-center py-8 bg-card/45 border border-dashed border-border rounded-2xl text-xs text-text-secondary font-bold">
                    No open IPOs in this category right now
                  </div>
                );
              }
              return (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {list.map((ipo) => {
                    const details = ipo.categories?.[0] || {};
                    const priceRange = details.minPrice
                      ? `₹${details.minPrice} - ₹${details.maxPrice}`
                      : 'Price TBA';
                    const minInvestment =
                      details.lotSize && details.minPrice
                        ? `₹${(details.lotSize * details.minPrice).toLocaleString('en-IN')}`
                        : 'TBA';
                    const isHot = ipo.overallSubscription && ipo.overallSubscription > 5;
                    return (
                      <div
                        key={ipo.symbol}
                        onClick={() => setSelectedIpoSearchId(ipo.searchId)}
                        className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-soft dark:shadow-soft-dark flex flex-col justify-between hover-lift transition-all cursor-pointer hover:border-profit/30 select-none"
                      >
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {ipo.logoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={ipo.logoUrl}
                                  alt={ipo.companyName}
                                  className="h-10 w-10 rounded-xl bg-background object-contain border border-border/60 p-1"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-xl bg-profit/10 text-profit flex items-center justify-center font-bold text-sm">
                                  {ipo.symbol.substring(0, 2)}
                                </div>
                              )}
                              <div>
                                <h4 className="font-extrabold text-xs text-text-primary line-clamp-1">
                                  {ipo.companyName}
                                </h4>
                                <span className="text-[10px] font-bold text-text-secondary">{ipo.symbol}</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-[9px] font-extrabold bg-profit/10 text-profit px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Open
                              </span>
                              {isHot && (
                                <span className="text-[9px] font-extrabold bg-loss/10 text-loss px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                  🔥 Hot ({ipo.overallSubscription!.toFixed(1)}x)
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 py-2 border-y border-border/60 text-[11px]">
                            <div>
                              <span className="text-text-secondary font-medium">Price Band</span>
                              <div className="font-extrabold text-text-primary mt-0.5">{priceRange}</div>
                            </div>
                            <div>
                              <span className="text-text-secondary font-medium">Min Investment</span>
                              <div className="font-extrabold text-text-primary mt-0.5">{minInvestment}</div>
                            </div>
                            <div className="col-span-2">
                              <span className="text-text-secondary font-medium">Bidding Dates</span>
                              <div className="font-extrabold text-text-primary mt-0.5">
                                {formatDate(ipo.bidStartTimestamp)} - {formatDate(ipo.bidEndTimestamp)}
                              </div>
                            </div>
                            {ipo.overallSubscription !== undefined && (
                              <div className="col-span-2 mt-1">
                                <div className="flex justify-between items-center text-[10px] mb-1">
                                  <span className="text-text-secondary font-medium">Subscription Demand</span>
                                  <span
                                    className={`font-black ${
                                      ipo.overallSubscription >= 1 ? 'text-profit' : 'text-text-secondary'
                                    }`}
                                  >
                                    {ipo.overallSubscription ? `${ipo.overallSubscription.toFixed(2)}x` : '0.00x'}
                                    {ipo.overallSubscription >= 1 ? ' (Fully Subscribed)' : ''}
                                  </span>
                                </div>
                                <div className="h-1.5 w-full bg-border/40 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      ipo.overallSubscription >= 5
                                        ? 'bg-loss animate-pulse'
                                        : ipo.overallSubscription >= 1
                                        ? 'bg-profit'
                                        : 'bg-primary'
                                    }`}
                                    style={{
                                      width: `${Math.min((ipo.overallSubscription || 0) * 100, 100)}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={() => setSelectedIpoSearchId(ipo.searchId)}
                            className="flex-grow text-center py-2 bg-profit text-white rounded-xl text-xs font-bold hover:bg-profit-dark transition-colors"
                          >
                            View in OnlyProfit
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* SECTION 2: UPCOMING IPOS */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <h3 className="font-extrabold text-sm text-text-primary tracking-tight">Upcoming IPOs</h3>
            </div>
            {(() => {
              const list = (ipoData.upcoming || []).filter((item) =>
                ipoCategory === 'sme' ? item.isSme : !item.isSme
              );
              if (list.length === 0) {
                return (
                  <div className="text-center py-8 bg-card/45 border border-dashed border-border rounded-2xl text-xs text-text-secondary font-bold">
                    No upcoming IPOs announced in this category
                  </div>
                );
              }
              return (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {list.map((ipo) => {
                    return (
                      <div
                        key={ipo.symbol}
                        onClick={() => setSelectedIpoSearchId(ipo.searchId)}
                        className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-soft dark:shadow-soft-dark flex flex-col justify-between hover-lift transition-all cursor-pointer hover:border-profit/30 select-none"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            {ipo.logoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={ipo.logoUrl}
                                alt={ipo.companyName}
                                className="h-10 w-10 rounded-xl bg-background object-contain border border-border/60 p-1"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                {ipo.symbol.substring(0, 2)}
                              </div>
                            )}
                            <div>
                              <h4 className="font-extrabold text-xs text-text-primary line-clamp-1">
                                {ipo.companyName}
                              </h4>
                              <span className="text-[10px] font-bold text-text-secondary">{ipo.symbol}</span>
                            </div>
                          </div>
                          <span className="text-[9px] font-extrabold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Upcoming
                          </span>
                        </div>
                        <div className="flex gap-2">
                          {ipo.documentUrl ? (
                            <a
                              href={ipo.documentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1 text-center py-2 border border-border text-text-primary rounded-xl text-xs font-bold hover:bg-background transition-colors"
                            >
                              Draft Prospectus (SEBI)
                            </a>
                          ) : (
                            <span className="flex-1 text-center py-2 text-text-secondary text-xs font-bold">
                              Dates & Pricing TBA
                            </span>
                          )}
                          <button
                            onClick={() => setSelectedIpoSearchId(ipo.searchId)}
                            className="flex-1 text-center py-2 bg-card border border-border text-text-primary rounded-xl text-xs font-bold hover:bg-background transition-colors"
                          >
                            Track on OnlyProfit
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* SECTION 3: CLOSED/LISTED IPOS */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-2 w-2 rounded-full bg-text-secondary" />
              <h3 className="font-extrabold text-sm text-text-primary tracking-tight">
                Closed / Recently Listed
              </h3>
            </div>
            {(() => {
              const list = (ipoData.closed || []).filter((item) =>
                ipoCategory === 'sme' ? item.isSme : !item.isSme
              );
              if (list.length === 0) {
                return (
                  <div className="text-center py-8 bg-card/45 border border-dashed border-border rounded-2xl text-xs text-text-secondary font-bold">
                    No recently closed IPOs listed
                  </div>
                );
              }
              return (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {list.map((ipo) => {
                    const listingDate = ipo.listingTimestamp ? formatDate(ipo.listingTimestamp) : 'TBA';
                    return (
                      <div
                        key={ipo.symbol}
                        onClick={() => setSelectedIpoSearchId(ipo.searchId)}
                        className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-soft dark:shadow-soft-dark flex flex-col justify-between hover-lift transition-all cursor-pointer hover:border-profit/30 select-none"
                      >
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {ipo.logoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={ipo.logoUrl}
                                  alt={ipo.companyName}
                                  className="h-10 w-10 rounded-xl bg-background object-contain border border-border/60 p-1"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-xl bg-background text-text-secondary flex items-center justify-center font-bold text-sm border border-border/60">
                                  {ipo.symbol.substring(0, 2)}
                                </div>
                              )}
                              <div>
                                <h4 className="font-extrabold text-xs text-text-primary line-clamp-1">
                                  {ipo.companyName}
                                </h4>
                                <span className="text-[10px] font-bold text-text-secondary">{ipo.symbol}</span>
                              </div>
                            </div>
                            <span className="text-[9px] font-extrabold bg-border text-text-secondary px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Closed
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 py-2 border-y border-border/60 text-[11px]">
                            <div>
                              <span className="text-text-secondary font-medium">Issue Price</span>
                              <div className="font-extrabold text-text-primary mt-0.5">
                                ₹{ipo.issuePrice || 'TBA'}
                              </div>
                            </div>
                            {ipo.isListed && ipo.listingPrice ? (
                              <div>
                                <span className="text-text-secondary font-medium">Listing Price</span>
                                <div className="font-extrabold text-text-primary mt-0.5">
                                  ₹{ipo.listingPrice}
                                </div>
                              </div>
                            ) : (
                              <div>
                                <span className="text-text-secondary font-medium">Subscription Rate</span>
                                <div className="font-extrabold text-text-primary mt-0.5">
                                  {ipo.overallSubscription
                                    ? `${ipo.overallSubscription.toFixed(2)}x`
                                    : 'TBA'}
                                </div>
                              </div>
                            )}
                            <div>
                              <span className="text-text-secondary font-medium">Bidding Dates</span>
                              <div className="font-extrabold text-text-primary mt-0.5">
                                {formatDateStr(ipo.openingDate)} - {formatDateStr(ipo.closingDate)}
                              </div>
                            </div>
                            <div>
                              <span className="text-text-secondary font-medium">Listing Date</span>
                              <div className="font-extrabold text-text-primary mt-0.5">{listingDate}</div>
                            </div>
                            {ipo.isListed &&
                              ipo.listingReturn !== null &&
                              ipo.listingReturn !== undefined && (
                                <div className="col-span-2 flex items-center justify-between mt-1 pt-1.5 border-t border-dashed border-border/60">
                                  <span className="text-text-secondary font-medium">
                                    Listing Performance
                                  </span>
                                  <span
                                    className={`font-black px-2 py-0.5 rounded text-[10px] flex items-center gap-0.5 ${
                                      ipo.listingReturn >= 0
                                        ? 'bg-profit/10 text-profit'
                                        : 'bg-loss/10 text-loss'
                                    }`}
                                  >
                                    {ipo.listingReturn >= 0 ? '▲' : '▼'}{' '}
                                    {ipo.listingReturn >= 0 ? '+' : ''}
                                    {ipo.listingReturn.toFixed(2)}%
                                  </span>
                                </div>
                              )}
                          </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                          {ipo.rtaLink ? (
                            <a
                              href={ipo.rtaLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1 text-center py-2 border border-border text-text-primary rounded-xl text-xs font-bold hover:bg-background transition-colors"
                            >
                              Check Allotment (RTA)
                            </a>
                          ) : null}
                          <button
                            onClick={() => setSelectedIpoSearchId(ipo.searchId)}
                            className="flex-1 text-center py-2 bg-card border border-border text-text-primary rounded-xl text-xs font-bold hover:bg-background transition-colors"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-sm text-text-secondary font-bold">
          Failed to load IPO data. Please try again.
        </div>
      )}
    </div>
  );
}
