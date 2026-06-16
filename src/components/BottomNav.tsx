'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, TrendingUp, GitCompare, Landmark } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const tabs = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Nifty 50', href: '/stock/%5ENSEI', icon: TrendingUp },
    { label: 'SENSEX', href: '/stock/%5EBSESN', icon: Landmark },
    { label: 'Compare', href: '/compare', icon: GitCompare }
  ];

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-md border-t border-border px-6 py-2 pb-safe shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href || (tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href.split('%')[0]));
          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={`flex flex-col items-center gap-1 flex-1 py-1 transition-all ${
                isActive 
                  ? 'text-profit scale-105' 
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[9px] font-black uppercase tracking-wider">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
