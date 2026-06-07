'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Sun, Sunset, Moon, Sunrise, X } from 'lucide-react';

export default function TopGreetingBanner() {
  const [visible, setVisible] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [icon, setIcon] = useState<React.ReactNode>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    let text = '';
    let greetingIcon = null;

    if (hour >= 5 && hour < 12) {
      text = 'Good Morning';
      greetingIcon = <Sunrise className="h-4 w-4 text-amber-300 animate-pulse" />;
    } else if (hour >= 12 && hour < 17) {
      text = 'Good Afternoon';
      greetingIcon = <Sun className="h-4 w-4 text-amber-200 animate-pulse" />;
    } else if (hour >= 17 && hour < 21) {
      text = 'Good Evening';
      greetingIcon = <Sunset className="h-4 w-4 text-orange-300 animate-pulse" />;
    } else {
      text = 'Good Night';
      greetingIcon = <Moon className="h-4 w-4 text-indigo-200 animate-pulse" />;
    }

    setGreeting(text);
    setIcon(greetingIcon);
    
    // Smooth enter animation shortly after mounting
    const showTimer = setTimeout(() => {
      setVisible(true);
    }, 150);

    // Auto-dismiss after 4 seconds (4000ms + 150ms delay)
    const hideTimer = setTimeout(() => {
      setVisible(false);
    }, 4150);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <div
      style={{
        maxHeight: visible ? '44px' : '0px',
        opacity: visible ? 1 : 0,
        transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      className="relative overflow-hidden w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 text-white text-xs font-black shadow-inner flex items-center justify-center select-none z-50 border-b border-white/10"
    >
      <div className="flex items-center justify-center gap-2 py-3 px-4 text-center">
        {icon}
        <span>
          {greeting ? `${greeting}, Investor!` : 'Welcome, Investor!'} Welcome to OnlyProfit. Start analyzing your favorite stocks.
        </span>
        <Sparkles className="h-3.5 w-3.5 text-yellow-200 animate-pulse hidden sm:inline" />
      </div>
      <button 
        onClick={() => setVisible(false)}
        className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-80 transition-opacity p-1 text-white/80 hover:text-white"
        aria-label="Close Greeting"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
