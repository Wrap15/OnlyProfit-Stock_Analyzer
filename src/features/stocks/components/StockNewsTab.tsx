'use client';

import React, { useState } from 'react';
import { Clock, Calendar } from 'lucide-react';

interface NewsItem {
  link: string;
  source: string;
  timeAgo: string;
  title: string;
  description: string;
  sector?: string;
}

interface EventItem {
  title: string;
  desc: string;
  date: string;
}

interface StockNewsTabProps {
  newsList: NewsItem[];
  newsLoading: boolean;
  eventsList: EventItem[];
}

export default function StockNewsTab({
  newsList,
  newsLoading,
  eventsList,
}: StockNewsTabProps) {
  const [visibleCount, setVisibleCount] = useState(4);

  const hasMore = newsList.length > visibleCount;
  const slicedNews = newsList.slice(0, visibleCount);

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-soft dark:shadow-soft-dark space-y-6 animate-fade-in">
      
      {/* News timeline */}
      <div className="space-y-4">
        <h3 className="font-extrabold text-sm text-text-primary uppercase tracking-wider flex items-center gap-2">
          <Clock className="h-4.5 w-4.5 text-profit" /> Latest News & Market Buzz
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {newsLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="p-4 rounded-xl bg-background/40 border border-border/50 animate-pulse space-y-3">
                <div className="w-24 h-3.5 bg-border rounded" />
                <div className="w-full h-8 bg-border rounded-lg" />
                <div className="w-16 h-3 bg-border rounded" />
              </div>
            ))
          ) : slicedNews.length > 0 ? (
            slicedNews.map((item, idx) => (
              <a 
                key={idx} 
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-xl bg-background/40 border border-border/50 space-y-2 flex flex-col justify-between hover:border-profit/30 transition-all hover:bg-card-hover/20 group"
              >
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[9px] font-black text-text-secondary uppercase">
                    <span>{item.source} • {item.timeAgo}</span>
                    {item.sector && (
                      <span className="px-1.5 py-0.2 rounded bg-slate-500/10 text-text-secondary">
                        {item.sector}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-black text-text-primary leading-snug group-hover:text-profit transition-colors">{item.title}</h4>
                  <p className="text-[10px] text-text-secondary leading-normal font-medium">{item.description}</p>
                </div>
              </a>
            ))
          ) : (
            <div className="col-span-2 text-center py-6 text-xs text-text-secondary font-bold">
              No recent news updates found.
            </div>
          )}
        </div>

        {hasMore && !newsLoading && (
          <div className="flex justify-center pt-2">
            <button
              onClick={() => setVisibleCount((prev) => prev + 4)}
              className="px-4 py-2 border border-border hover:border-profit/30 bg-background hover:bg-profit/5 text-xs text-text-secondary hover:text-profit font-black uppercase rounded-xl transition-all cursor-pointer"
            >
              Load More News
            </button>
          </div>
        )}
      </div>

      {/* Upcoming Events list */}
      <div className="space-y-4 pt-4 border-t border-border/40">
        <h3 className="font-extrabold text-sm text-text-primary uppercase tracking-wider flex items-center gap-2">
          <Calendar className="h-4.5 w-4.5 text-profit" /> Corporate Action & Calendar
        </h3>
        
        <div className="divide-y divide-border/40">
          {eventsList.map((item, idx) => (
            <div key={idx} className="py-3 flex justify-between items-start gap-4 text-xs font-bold">
              <div className="space-y-1">
                <h4 className="text-text-primary font-black">{item.title}</h4>
                <p className="text-[10px] text-text-secondary leading-normal font-medium">{item.desc}</p>
              </div>
              <span className="text-[10px] font-black bg-background border border-border rounded-xl px-3 py-1 text-text-primary shrink-0 select-none">
                {item.date}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
