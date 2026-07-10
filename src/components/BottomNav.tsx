'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Star, Compass, TrendingUp, User } from 'lucide-react';
import { useStockStore } from '@/store/useStockStore';

export default function BottomNav() {
  const pathname = usePathname();
  const { isMobileMenuOpen, toggleMobileMenu } = useStockStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const tabs = [
    { label: 'Watchlist', href: '/?tab=watchlist', icon: Star },
    { label: 'Explore', href: '/?tab=explore', icon: Compass },
    { label: 'Portfolio', href: '/simulator', icon: TrendingUp },
    { label: 'Profile', href: '#menu', icon: User }
  ];

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border px-4 py-2 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-between gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isProfileTab = tab.label === 'Profile';
          
          let isActive = false;
          if (isProfileTab) {
            isActive = isMobileMenuOpen;
          } else if (typeof window !== 'undefined') {
            const url = new URL(tab.href, window.location.origin);
            const pathnameMatch = pathname === url.pathname;
            const searchParamsMatch = !url.search || window.location.search.includes(url.searchParams.get('tab') || '');
            isActive = pathnameMatch && searchParamsMatch;
          }

          const content = (
            <>
              <Icon className={`h-5.5 w-5.5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[9px] font-black uppercase tracking-wider mt-0.5">{tab.label}</span>
            </>
          );

          const className = `flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
            isActive 
              ? 'text-profit font-black' 
              : 'text-text-secondary hover:text-text-primary'
          }`;

          if (isProfileTab) {
            return (
              <button
                key={tab.label}
                onClick={() => toggleMobileMenu()}
                className={className}
                aria-label="Profile Menu"
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={className}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
