'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, Building2, TrendingUp, CheckCircle2, 
  AlertCircle, ChevronDown, ChevronUp, 
  Layers, Info, ShieldCheck
} from 'lucide-react';
import { apiClient as axios } from '@/lib/apiClient';

interface IpoDetailsModalProps {
  searchId: string | null;
  onClose: () => void;
}

export default function IpoDetailsModal({ searchId, onClose }: IpoDetailsModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'financials' | 'proscons' | 'faqs'>('overview');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [finMetric, setFinMetric] = useState<'Revenue' | 'Profit' | 'Total Assets'>('Revenue');

  useEffect(() => {
    if (!searchId) return;

    async function fetchIpoDetails() {
      try {
        setLoading(true);
        setError(null);
        setData(null);
        setActiveTab('overview');
        setExpandedFaq(null);

        const res = await axios.get(`/api/stock/ipo/details?searchId=${searchId}`);
        setData(res.data);
      } catch (err: any) {
        console.error('Failed to fetch IPO details:', err);
        setError(err.response?.data?.error || err.message || 'Failed to load IPO details');
      } finally {
        setLoading(false);
      }
    }

    fetchIpoDetails();
  }, [searchId]);

  if (!searchId) return null;

  // Formatting helpers
  const formatDate = (dateStr: string | number | null) => {
    if (!dateStr) return 'TBA';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr.toString();
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'TBA';
    }
  };

  const formatCurrency = (amount: number | string | null) => {
    if (amount === null || amount === undefined) return 'TBA';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return amount.toString();
    
    if (num >= 10000000) {
      return `₹${(num / 10000000).toFixed(2)} Cr`;
    } else if (num >= 100000) {
      return `₹${(num / 100000).toFixed(2)} Lakh`;
    }
    return `₹${num.toLocaleString('en-IN')}`;
  };

  // Find max value in financials to scale bars
  const getFinancialChartData = () => {
    if (!data?.financials) return [];
    const metricObj = data.financials.find((f: any) => f.title.toLowerCase() === finMetric.toLowerCase());
    if (!metricObj) return [];
    
    const years = Object.keys(metricObj.yearly || {}).sort();
    const values = years.map(yr => metricObj.yearly[yr]);
    const maxVal = Math.max(...values, 1);
    
    return years.map(year => ({
      year,
      value: metricObj.yearly[year],
      percentage: Math.max((metricObj.yearly[year] / maxVal) * 100, 5) // at least 5% height for visual block
    }));
  };

  const chartData = getFinancialChartData();

  // Subscription calculation helpers
  const getSubscriptionProgress = (rate: number | null) => {
    if (rate === null || rate === undefined) return 0;
    return Math.min(rate * 10, 100); // Scale up subscription: e.g. 10x is 100% full
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6 bg-black/75 backdrop-blur-md animate-fade-in">
      {/* Backdrop Click */}
      <div className="absolute inset-0" onClick={onClose} />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-2xl h-[90vh] sm:h-auto sm:max-h-[85vh] bg-card border border-border/70 rounded-t-3xl sm:rounded-3xl shadow-2xl dark:shadow-soft-dark flex flex-col overflow-hidden animate-slide-up sm:animate-fade-in gpu-layer z-10">
        
        {/* Header */}
        <div className="p-5 border-b border-border/60 flex items-center justify-between shrink-0 bg-card/85 backdrop-blur-md sticky top-0 z-10">
          {loading ? (
            <div className="flex items-center gap-3 w-2/3">
              <div className="h-10 w-10 rounded-xl bg-border/40 animate-shimmer" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 bg-border/40 rounded animate-shimmer w-3/4" />
                <div className="h-3 bg-border/40 rounded animate-shimmer w-1/3" />
              </div>
            </div>
          ) : data ? (
            <div className="flex items-center gap-3">
              {data.logoUrl ? (
                <img 
                  src={data.logoUrl} 
                  alt={data.companyName} 
                  className="h-11 w-11 rounded-xl bg-background object-contain border border-border/60 p-1"
                />
              ) : (
                <div className="h-11 w-11 rounded-xl bg-profit/10 text-profit flex items-center justify-center font-bold text-base border border-profit/20">
                  {data.symbol?.substring(0, 2) || 'IP'}
                </div>
              )}
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-text-primary line-clamp-1">{data.companyName}</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-black text-text-secondary bg-background border border-border/60 px-1.5 py-0.5 rounded uppercase">{data.symbol}</span>
                  {data.isSme && (
                    <span className="text-[9px] font-black bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                      SME IPO
                    </span>
                  )}
                  {data.status && (
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                      data.status === 'OPEN' || data.status === 'ACTIVE'
                        ? 'bg-profit/15 text-profit'
                        : data.status === 'UPCOMING'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-border text-text-secondary'
                    }`}>
                      {data.status}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <span className="font-extrabold text-sm text-text-primary">IPO Details</span>
          )}
          
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg border border-border hover:bg-background text-text-secondary hover:text-text-primary transition-all duration-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {loading && (
            <div className="space-y-6 py-4">
              {/* Tabs shimmer */}
              <div className="flex gap-2 border-b border-border/40 pb-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-8 bg-border/40 rounded-lg animate-shimmer w-20" />
                ))}
              </div>
              {/* Stats Grid shimmer */}
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-16 bg-border/40 rounded-xl animate-shimmer" />
                ))}
              </div>
              {/* Description shimmer */}
              <div className="space-y-2">
                <div className="h-4 bg-border/40 rounded animate-shimmer w-1/4" />
                <div className="h-3 bg-border/40 rounded animate-shimmer w-full" />
                <div className="h-3 bg-border/40 rounded animate-shimmer w-5/6" />
                <div className="h-3 bg-border/40 rounded animate-shimmer w-4/5" />
              </div>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-3">
              <AlertCircle className="h-12 w-12 text-loss" />
              <h4 className="font-extrabold text-sm text-text-primary">Failed to load IPO</h4>
              <p className="text-xs text-text-secondary max-w-sm">{error}</p>
              <button 
                onClick={onClose}
                className="mt-2 px-4 py-2 bg-profit text-white rounded-xl text-xs font-bold hover:bg-profit-dark transition-colors"
              >
                Close
              </button>
            </div>
          )}

          {data && !loading && !error && (
            <>
              {/* Tabs Navigation */}
              <div className="flex border-b border-border/60 overflow-x-auto scrollbar-none sticky top-[-20px] bg-card py-1.5 z-10 gap-1.5">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'timeline', label: 'Timeline & Info' },
                  { id: 'financials', label: 'Financials & Demand' },
                  { id: 'proscons', label: 'Pros & Cons' },
                  { id: 'faqs', label: 'FAQs' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black shrink-0 uppercase tracking-wider transition-all duration-200 border ${
                      activeTab === tab.id
                        ? 'bg-profit/10 text-profit border-profit/25'
                        : 'text-text-secondary hover:text-text-primary hover:bg-background border-transparent'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-5 animate-fade-in">
                  
                  {/* Highlight Banner */}
                  <div className="rounded-2xl bg-profit/5 border border-profit/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-profit uppercase tracking-wider">Price Band</span>
                      <h4 className="text-base font-black text-text-primary mt-0.5">
                        {data.minPrice ? `₹${data.minPrice} - ₹${data.maxPrice}` : 'Price TBA'}
                      </h4>
                      {data.lotSize && (
                        <p className="text-[10px] text-text-secondary font-medium mt-0.5">
                          Lot size: {data.lotSize} shares (Min. Investment: {data.minPrice ? `₹${(data.lotSize * data.minPrice).toLocaleString('en-IN')}` : 'TBA'})
                        </p>
                      )}
                    </div>
                    {data.overallSubscription !== undefined && (
                      <div className="border-t sm:border-t-0 sm:border-l border-border/60 pt-2.5 sm:pt-0 sm:pl-4 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-profit/10 text-profit flex items-center justify-center">
                          <TrendingUp className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider font-semibold">Total Subscription</span>
                          <h4 className="text-base font-black text-profit mt-0.5">
                            {data.overallSubscription ? `${data.overallSubscription.toFixed(2)}x` : '0.00x'}
                          </h4>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Core Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-background border border-border/60 rounded-xl">
                      <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">Issue Size</span>
                      <span className="text-xs font-black text-text-primary block mt-0.5">{formatCurrency(data.issueSize)}</span>
                    </div>
                    <div className="p-3 bg-background border border-border/60 rounded-xl">
                      <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">Face Value</span>
                      <span className="text-xs font-black text-text-primary block mt-0.5">{data.faceValue ? `₹${data.faceValue} per share` : 'TBA'}</span>
                    </div>
                    <div className="p-3 bg-background border border-border/60 rounded-xl col-span-2 sm:col-span-1">
                      <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">Listing Date</span>
                      <span className="text-xs font-black text-text-primary block mt-0.5">{formatDate(data.listingDate)}</span>
                    </div>
                    {data.aboutCompany?.yearFounded && (
                      <div className="p-3 bg-background border border-border/60 rounded-xl">
                        <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">Founded</span>
                        <span className="text-xs font-black text-text-primary block mt-0.5">{data.aboutCompany.yearFounded}</span>
                      </div>
                    )}
                    {data.aboutCompany?.managingDirector && (
                      <div className="p-3 bg-background border border-border/60 rounded-xl col-span-2">
                        <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">Managing Director</span>
                        <span className="text-xs font-black text-text-primary block mt-0.5 line-clamp-1">{data.aboutCompany.managingDirector}</span>
                      </div>
                    )}
                  </div>

                  {/* About Section */}
                  {data.aboutCompany?.aboutCompany && (
                    <div className="space-y-2">
                      <h4 className="font-extrabold text-xs text-text-primary uppercase tracking-wider">About the Company</h4>
                      <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">
                        {data.aboutCompany.aboutCompany}
                      </p>
                    </div>
                  )}

                  {/* Document and RTA Quick Links */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border/60">
                    {data.documentUrl && (
                      <a 
                        href={data.documentUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-1 py-2 text-center border border-border hover:bg-background text-text-primary rounded-xl text-xs font-bold transition-colors"
                      >
                        Official Prospectus (SEBI)
                      </a>
                    )}
                    {data.rtaLink && (
                      <a 
                        href={data.rtaLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-1 py-2 text-center bg-profit hover:bg-profit-dark text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <ShieldCheck className="h-4 w-4" /> Check Allotment Status
                      </a>
                    )}
                  </div>

                </div>
              )}

              {/* TAB 2: TIMELINE & INFO */}
              {activeTab === 'timeline' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Timeline Journey */}
                  <div>
                    <h4 className="font-extrabold text-xs text-text-primary uppercase tracking-wider mb-4">IPO Timeline Journey</h4>
                    
                    <div className="relative pl-6 border-l-2 border-border space-y-5 py-1">
                      
                      {/* Bidding Start */}
                      <div className="relative">
                        <div className="absolute -left-[31px] top-0.5 h-4 w-4 rounded-full border-2 border-profit bg-card flex items-center justify-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-profit" />
                        </div>
                        <div>
                          <h5 className="text-xs font-black text-text-primary">Bidding Start Date</h5>
                          <span className="text-[10px] text-text-secondary font-bold">{formatDate(data.startDate)}</span>
                        </div>
                      </div>

                      {/* Bidding End */}
                      <div className="relative">
                        <div className="absolute -left-[31px] top-0.5 h-4 w-4 rounded-full border-2 border-profit bg-card flex items-center justify-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-profit" />
                        </div>
                        <div>
                          <h5 className="text-xs font-black text-text-primary">Bidding End Date</h5>
                          <span className="text-[10px] text-text-secondary font-bold">{formatDate(data.endDate)}</span>
                        </div>
                      </div>

                      {/* Allotment Finalization */}
                      <div className="relative">
                        <div className="absolute -left-[31px] top-0.5 h-4 w-4 rounded-full border-2 border-primary bg-card flex items-center justify-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        </div>
                        <div>
                          <h5 className="text-xs font-black text-text-primary">Allotment Date</h5>
                          <span className="text-[10px] text-text-secondary font-bold">{formatDate(data.allotmentDate)}</span>
                          <p className="text-[9px] text-text-secondary font-medium">Bidders notified of share allotments.</p>
                        </div>
                      </div>

                      {/* Listing Date */}
                      <div className="relative">
                        <div className="absolute -left-[31px] top-0.5 h-4 w-4 rounded-full border-2 border-primary bg-card flex items-center justify-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        </div>
                        <div>
                          <h5 className="text-xs font-black text-text-primary">IPO Listing Date</h5>
                          <span className="text-[10px] text-text-secondary font-bold">{formatDate(data.listingDate)}</span>
                          <p className="text-[9px] text-text-secondary font-medium">Trading commences on NSE/BSE stock exchanges.</p>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Technical Information Details */}
                  <div className="border-t border-border/60 pt-5 space-y-3">
                    <h4 className="font-extrabold text-xs text-text-primary uppercase tracking-wider">Registrar & Listing Details</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {data.registrar && (
                        <div className="flex items-center justify-between p-3 bg-background border border-border/60 rounded-xl">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-text-secondary" />
                            <span className="text-text-secondary font-medium">Registrar</span>
                          </div>
                          <span className="font-black text-text-primary max-w-[180px] text-right line-clamp-1">{data.registrar}</span>
                        </div>
                      )}
                      {data.symbol && (
                        <div className="flex items-center justify-between p-3 bg-background border border-border/60 rounded-xl">
                          <div className="flex items-center gap-2">
                            <Layers className="h-4 w-4 text-text-secondary" />
                            <span className="text-text-secondary font-medium">Exchange Listing</span>
                          </div>
                          <span className="font-black text-text-primary">NSE, BSE</span>
                        </div>
                      )}
                      {data.isin && (
                        <div className="flex items-center justify-between p-3 bg-background border border-border/60 rounded-xl">
                          <div className="flex items-center gap-2">
                            <Info className="h-4 w-4 text-text-secondary" />
                            <span className="text-text-secondary font-medium">ISIN</span>
                          </div>
                          <span className="font-black text-text-primary select-all">{data.isin}</span>
                        </div>
                      )}
                      {data.issueType && (
                        <div className="flex items-center justify-between p-3 bg-background border border-border/60 rounded-xl">
                          <div className="flex items-center gap-2">
                            <Info className="h-4 w-4 text-text-secondary" />
                            <span className="text-text-secondary font-medium">Issue Type</span>
                          </div>
                          <span className="font-black text-text-primary">{data.issueType}</span>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 3: FINANCIALS & DEMAND */}
              {activeTab === 'financials' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Subscription Demand Section */}
                  {data.subscriptionRates && data.subscriptionRates.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-extrabold text-xs text-text-primary uppercase tracking-wider">Subscription Bid Details</h4>
                      
                      <div className="space-y-3 bg-background border border-border/60 rounded-2xl p-4">
                        {data.subscriptionRates.map((sub: any) => {
                          const isTotal = sub.category === 'TOTAL';
                          return (
                            <div key={sub.category} className={`space-y-1 ${isTotal ? 'pt-2 border-t border-dashed border-border' : ''}`}>
                              <div className="flex justify-between text-xs">
                                <span className={isTotal ? 'font-black text-text-primary' : 'text-text-secondary font-semibold'}>
                                  {sub.categoryName} ({sub.category})
                                </span>
                                <span className={`font-black ${isTotal ? 'text-profit text-sm' : 'text-text-primary'}`}>
                                  {sub.subscriptionRate ? `${sub.subscriptionRate.toFixed(2)}x` : '0.00x'}
                                </span>
                              </div>
                              <div className="h-2 w-full bg-border/40 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    isTotal 
                                      ? 'bg-profit' 
                                      : sub.category === 'QIB' 
                                        ? 'bg-primary' 
                                        : sub.category === 'NII' 
                                          ? 'bg-violet-500' 
                                          : 'bg-amber-500'
                                  }`}
                                  style={{ width: `${getSubscriptionProgress(sub.subscriptionRate)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Financial Metrics Charts */}
                  {data.financials && data.financials.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                        <h4 className="font-extrabold text-xs text-text-primary uppercase tracking-wider">Financial Performance</h4>
                        
                        <div className="flex gap-1.5">
                          {(['Revenue', 'Profit', 'Total Assets'] as const).map((metric) => (
                            <button
                              key={metric}
                              onClick={() => setFinMetric(metric)}
                              className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border transition-all ${
                                finMetric === metric
                                  ? 'bg-profit text-white border-profit'
                                  : 'text-text-secondary hover:text-text-primary border-border/60 hover:bg-background'
                              }`}
                            >
                              {metric === 'Total Assets' ? 'Assets' : metric}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Custom Bar Chart */}
                      <div className="bg-background border border-border/60 rounded-2xl p-5 flex flex-col items-center">
                        <div className="flex items-end justify-center gap-8 w-full h-36 pt-4 border-b border-border/70 px-4">
                          {chartData.map((bar: any) => (
                            <div key={bar.year} className="flex flex-col items-center w-16 group relative">
                              
                              {/* Hover Value Popup */}
                              <div className="absolute -top-7 scale-0 group-hover:scale-100 transition-all duration-200 bg-foreground text-card text-[10px] font-black px-2 py-0.5 rounded shadow-md pointer-events-none select-none z-10 whitespace-nowrap">
                                {formatCurrency(bar.value)} Cr
                              </div>
                              
                              {/* Bar Block */}
                              <div 
                                className={`w-10 rounded-t-lg transition-all duration-700 ease-out origin-bottom ${
                                  finMetric === 'Profit'
                                    ? bar.value >= 0 ? 'bg-profit/80 hover:bg-profit' : 'bg-loss/80 hover:bg-loss'
                                    : finMetric === 'Revenue'
                                      ? 'bg-primary/80 hover:bg-primary'
                                      : 'bg-indigo-500/80 hover:bg-indigo-500'
                                }`}
                                style={{ height: `${bar.percentage}%` }}
                              />
                              
                              {/* Year Label */}
                              <span className="text-[10px] font-bold text-text-secondary mt-2">{bar.year}</span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="w-full flex justify-between items-center text-[10px] text-text-secondary font-medium mt-3 px-1">
                          <span>Values in Crores (₹)</span>
                          <span className="font-extrabold text-text-primary">Fiscal Year (FY) Period</span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* TAB 4: PROS & CONS */}
              {activeTab === 'proscons' && (
                <div className="space-y-5 animate-fade-in">
                  
                  {/* Pros Section */}
                  {data.pros && data.pros.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded-full bg-profit/15 text-profit flex items-center justify-center">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </div>
                        <h4 className="font-extrabold text-xs text-text-primary uppercase tracking-wider">Strengths & Pros</h4>
                      </div>
                      
                      <div className="space-y-2">
                        {data.pros.map((pro: string, idx: number) => (
                          <div key={idx} className="flex gap-2.5 items-start p-3 bg-profit/5 border border-profit/10 rounded-xl text-xs text-text-primary">
                            <span className="text-profit font-black mt-0.5">•</span>
                            <p className="leading-relaxed font-semibold">{pro}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cons Section */}
                  {data.cons && data.cons.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded-full bg-loss/15 text-loss flex items-center justify-center">
                          <AlertCircle className="h-3.5 w-3.5" />
                        </div>
                        <h4 className="font-extrabold text-xs text-text-primary uppercase tracking-wider">Risks & Cons</h4>
                      </div>
                      
                      <div className="space-y-2">
                        {data.cons.map((con: string, idx: number) => (
                          <div key={idx} className="flex gap-2.5 items-start p-3 bg-loss/5 border border-loss/10 rounded-xl text-xs text-text-primary">
                            <span className="text-loss font-black mt-0.5">•</span>
                            <p className="leading-relaxed font-semibold">{con}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty Pros & Cons state */}
                  {(!data.pros || data.pros.length === 0) && (!data.cons || data.cons.length === 0) && (
                    <div className="text-center py-16 text-xs text-text-secondary font-bold">
                      No strengths or risk factors published for this listing
                    </div>
                  )}

                </div>
              )}

              {/* TAB 5: FAQS */}
              {activeTab === 'faqs' && (
                <div className="space-y-3 animate-fade-in">
                  <h4 className="font-extrabold text-xs text-text-primary uppercase tracking-wider mb-3">Frequently Asked Questions</h4>
                  
                  {data.faqs && data.faqs.length > 0 ? (
                    <div className="space-y-2.5">
                      {data.faqs.map((faq: any, idx: number) => {
                        const isOpen = expandedFaq === idx;
                        return (
                          <div 
                            key={idx}
                            className="border border-border/70 rounded-xl bg-background overflow-hidden transition-all"
                          >
                            <button
                              onClick={() => setExpandedFaq(isOpen ? null : idx)}
                              className="w-full p-4 flex justify-between items-center text-left text-xs font-black text-text-primary hover:bg-card/40 transition-colors"
                            >
                              <span>{faq.question}</span>
                              {isOpen ? (
                                <ChevronUp className="h-4 w-4 text-text-secondary shrink-0" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-text-secondary shrink-0" />
                              )}
                            </button>
                            {isOpen && (
                              <div className="p-4 pt-0 border-t border-border/40 text-xs text-text-secondary leading-relaxed bg-card/10 font-medium whitespace-pre-wrap">
                                {faq.answer}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-16 text-xs text-text-secondary font-bold">
                      No FAQs listed for this IPO
                    </div>
                  )}
                </div>
              )}
            </>
          )}

        </div>
        
      </div>
    </div>
  );
}
