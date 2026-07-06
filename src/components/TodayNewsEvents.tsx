'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Globe, 
  FileText, 
  Compass, 
  Megaphone, 
  Briefcase, 
  Coins, 
  RotateCw 
} from 'lucide-react';

interface FeedItem {
  id: string;
  type: 'news' | 'corp' | 'dividend' | 'macro' | 'earnings';
  symbol: string;
  changePercent: number;
  title: string;
  description: string;
  timeAgo?: string;
  source?: string;
  exDate?: string;
  details?: string;
}

const EVENTS_DATA: FeedItem[] = [
  {
    id: 'event-1',
    type: 'news',
    symbol: 'OBEROIRLTY',
    changePercent: 2.34,
    title: 'Oberoi Realty gains on clocking Rs 8,109-cr gross bookings at debut NCR luxury project',
    description: 'The project, located on Golf Course Extension Road in Sector 58, Gurugram, recorded bookings for around 2.1 million square feet of residential space.',
    timeAgo: '39 MINUTES AGO',
    source: 'CAPITAL MARKET - LIVE'
  },
  {
    id: 'event-2',
    type: 'corp',
    symbol: 'GUJINJEC',
    changePercent: 1.15,
    title: 'Share Split',
    description: 'Face Value Change from 10 To 1',
    exDate: 'Jul 8, 2026',
    details: 'Face Value Change from 10 To 1'
  },
  {
    id: 'event-3',
    type: 'dividend',
    symbol: 'CERA',
    changePercent: 0.95,
    title: 'Cash Dividend',
    description: 'Final • Dividend/Share: ₹75.00',
    exDate: 'Jul 7, 2026',
    details: 'Final • Dividend/Share: ₹75.00'
  },
  {
    id: 'event-4',
    type: 'news',
    symbol: 'NIFTY 50',
    changePercent: 0.42,
    title: 'Indices trade with modest gains; auto shares in demand',
    description: 'The domestic equity benchmarks traded with modest gains in mid-morning trade, supported by gains in the automobile and IT indexes, amid positive global queues.',
    timeAgo: '2 HOURS AGO',
    source: 'BUSINESS STANDARD'
  },
  {
    id: 'event-5',
    type: 'earnings',
    symbol: 'RELIANCE',
    changePercent: 1.85,
    title: 'Reliance Industries Q1 Net Profit Beats Estimates',
    description: 'RIL reported consolidated revenues of Rs 2.36 lakh crore, driven by strong growth in the retail segment and digital services (Jio Platforms).',
    timeAgo: '4 HOURS AGO',
    source: 'CNBC TV18'
  },
  {
    id: 'event-6',
    type: 'macro',
    symbol: 'INFLATION',
    changePercent: -0.25,
    title: 'India Retail CPI Inflation cools down to 4.3%',
    description: 'The consumer price index (CPI) database index for food and energy baskets decreased significantly during June, easing pressure on the Reserve Bank of India.',
    timeAgo: '5 HOURS AGO',
    source: 'FINANCIAL EXPRESS'
  },
  {
    id: 'event-7',
    type: 'dividend',
    symbol: 'TCS',
    changePercent: -0.35,
    title: 'Interim Dividend',
    description: 'First Interim Dividend • Dividend/Share: ₹10.00',
    exDate: 'Jul 15, 2026',
    details: 'First Interim Dividend • Dividend/Share: ₹10.00'
  }
];

export default function TodayNewsEvents() {
  const [activeTab, setActiveTab] = useState<'all' | 'news' | 'macro' | 'earnings' | 'corp' | 'dividend'>('all');
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const loadFeed = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stock/news');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setFeedItems(data);
          setLoading(false);
          return;
        }
      }
    } catch {}
    
    setTimeout(() => {
      setFeedItems(EVENTS_DATA);
      setLoading(false);
    }, 300);
  };

  useEffect(() => {
    loadFeed();
  }, []);

  const filteredItems = feedItems.filter(item => {
    if (activeTab === 'all') return true;
    return item.type === activeTab;
  });

  const getPillIcon = (tabType: string) => {
    switch (tabType) {
      case 'all': return Globe;
      case 'news': return FileText;
      case 'macro': return Compass;
      case 'earnings': return Megaphone;
      case 'corp': return Briefcase;
      case 'dividend': return Coins;
      default: return Globe;
    }
  };

  const getIconColorClass = (tabType: string, isActive: boolean) => {
    if (isActive) return 'text-white';
    switch (tabType) {
      case 'all': return 'text-slate-400';
      case 'news': return 'text-blue-500';
      case 'macro': return 'text-rose-500';
      case 'earnings': return 'text-blue-400';
      case 'corp': return 'text-emerald-500';
      case 'dividend': return 'text-amber-500';
      default: return 'text-slate-400';
    }
  };

  const renderBadge = (symbol: string, changePercent: number) => {
    const isPositive = changePercent >= 0;
    const initial = symbol.charAt(0);
    const isIndex = symbol.includes('NIFTY') || symbol === 'SENSEX';
    return (
      <div 
        onClick={(e) => {
          e.stopPropagation();
          if (isIndex) {
            router.push(`/stock/%5ENSEI`);
          } else if (symbol !== 'INFLATION' && symbol !== 'MARKET') {
            router.push(`/stock/${symbol}.NS`);
          }
        }}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-black select-none border tracking-wide uppercase cursor-pointer hover:scale-105 active:scale-95 transition-all ${
          isPositive 
            ? 'bg-emerald-500/[0.06] border-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
            : 'bg-rose-500/[0.06] border-rose-500/10 text-rose-600 dark:text-rose-400'
        }`}
      >
        <span className="w-3.5 h-3.5 flex items-center justify-center rounded bg-white dark:bg-slate-800 text-[8px] font-black shadow-sm shrink-0 border border-slate-200/50">
          {initial}
        </span>
        <span>{symbol}</span>
        <span>{isPositive ? '▲' : '▼'}</span>
      </div>
    );
  };

  return (
    <div className="w-full bg-card border border-border p-5 md:p-6 rounded-3xl shadow-soft dark:shadow-soft-dark space-y-6">
      
      {/* Widget Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <h3 className="font-extrabold text-base text-text-primary tracking-tight">
          {"Today's news and events"}
        </h3>
        
        <div className="flex items-center gap-3">
          {/* Refresh Action */}
          <button 
            onClick={loadFeed}
            className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-text-primary transition-colors ${loading ? 'animate-spin' : ''}`}
            title="Refresh Feed"
          >
            <RotateCw className="h-4 w-4" />
          </button>
          
          <span className="text-xs font-black text-blue-600 dark:text-blue-400 hover:underline select-none cursor-pointer flex items-center gap-1">
            Market ⇄
          </span>
        </div>
      </div>

      {/* Tabs / Pills */}
      <div className="flex overflow-x-auto scrollbar-none gap-2 py-0.5 max-w-full">
        {(['all', 'news', 'macro', 'earnings', 'corp', 'dividend'] as const).map(tab => {
          const Icon = getPillIcon(tab);
          const isActive = activeTab === tab;
          const label = tab === 'all' 
            ? 'All' 
            : tab === 'corp' 
            ? 'Corp Action' 
            : tab.charAt(0).toUpperCase() + tab.slice(1);
          
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-full text-[10px] font-black transition-all duration-200 shrink-0 flex items-center gap-1.5 border select-none cursor-pointer ${
                isActive
                  ? 'bg-slate-900 border-transparent text-white dark:bg-slate-800'
                  : 'bg-card text-text-primary border-border hover:bg-slate-50 dark:hover:bg-slate-800/30'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 shrink-0 ${getIconColorClass(tab, isActive)}`} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Feed Area: Vertical List separated by horizontal dividers */}
      {loading ? (
        <div className="divide-y divide-border/40">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="py-4 first:pt-0 last:pb-0 space-y-3 bg-card animate-pulse">
              <div className="flex justify-between items-center">
                <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
              <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-12 w-full bg-slate-100 dark:bg-slate-900 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="divide-y divide-border/40 flex flex-col">
          {filteredItems.map(item => {
            const isExDateEvent = item.type === 'corp' || item.type === 'dividend';
            return (
              <div 
                key={item.id}
                className="py-5 first:pt-0 last:pb-0 flex flex-col space-y-3.5 min-w-0"
              >
                {/* Header Line */}
                <div className="flex items-center justify-between gap-4">
                  {renderBadge(item.symbol, item.changePercent)}
                  
                  {isExDateEvent && item.exDate && (
                    <div className="text-right shrink-0">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ex Date</span>
                      <span className="block text-xs font-black text-text-primary mt-0.5">{item.exDate}</span>
                    </div>
                  )}
                </div>

                {/* Title */}
                <h4 className="font-extrabold text-sm text-text-primary tracking-tight leading-snug">
                  {item.title}
                </h4>

                {/* Description Box */}
                {item.description && (
                  <div className="p-3.5 bg-slate-50/70 dark:bg-slate-800/10 border border-border/40 rounded-xl text-text-secondary text-[11px] font-medium leading-relaxed">
                    {item.description}
                  </div>
                )}

                {/* Footer Line */}
                {!isExDateEvent && item.timeAgo && (
                  <div className="flex items-center gap-1.5 text-[9px] font-black text-text-secondary/80 tracking-wider uppercase select-none pt-0.5">
                    <span>{item.timeAgo}</span>
                    <span>•</span>
                    <span>{item.source}</span>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10 text-xs text-text-secondary font-black bg-slate-50/50 dark:bg-slate-800/10 rounded-2xl border border-border/40">
          No news or events found for this category.
        </div>
      )}

    </div>
  );
}
