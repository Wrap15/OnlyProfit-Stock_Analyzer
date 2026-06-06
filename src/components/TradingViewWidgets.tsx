'use client';

import React, { useEffect, useRef } from 'react';

interface WidgetProps {
  symbol: string;
  theme: 'light' | 'dark';
}

declare global {
  interface Window {
    TradingView: any;
  }
}

// Helper to translate Yahoo symbols to TradingView symbols
export const getTradingViewSymbol = (sym: string) => {
  if (sym === '^NSEI') return 'NSE:NIFTY';
  if (sym === '^BSESN') return 'BSE:SENSEX';
  if (sym === '^NSEBANK') return 'NSE:BANKNIFTY';
  if (sym === '^CNXIT') return 'NSE:CNXIT';

  if (sym.endsWith('.NS')) {
    return `NSE:${sym.split('.')[0]}`;
  }
  if (sym.endsWith('.BO')) {
    return `BSE:${sym.split('.')[0]}`;
  }
  return `NSE:${sym}`; // fallback
};

// 1. Advanced Chart Widget using s3.tradingview.com/tv.js for 100% React compatibility
export function TradingViewChart({ symbol, theme }: WidgetProps) {
  const containerId = 'tradingview_chart_advanced_container';
  const tvSymbol = getTradingViewSymbol(symbol);

  useEffect(() => {
    // Dynamically append the script if not present
    const scriptId = 'tradingview-tv-js';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    const initWidget = () => {
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = ''; // Clear prior iframe/widgets
      }

      if (typeof window !== 'undefined' && window.TradingView) {
        new window.TradingView.widget({
          width: '100%',
          height: 500,
          symbol: tvSymbol,
          interval: 'D',
          timezone: 'Asia/Kolkata',
          theme: theme === 'dark' ? 'dark' : 'light',
          style: '1',
          locale: 'en',
          enable_publishing: false,
          hide_side_toolbar: false,
          allow_symbol_change: true,
          container_id: containerId,
          studies: ['RSI@tv-basicstudies', 'MASimple@tv-basicstudies'],
        });
      }
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://s3.tradingview.com/tv.js';
      script.type = 'text/javascript';
      script.async = true;
      document.head.appendChild(script);
    }

    // Polling mechanism to check when script is fully loaded in window
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (typeof window !== 'undefined' && window.TradingView) {
        initWidget();
        clearInterval(interval);
      } else if (attempts >= 30) { // 3 seconds timeout
        clearInterval(interval);
        console.error('TradingView script load timed out.');
      }
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, [tvSymbol, theme]);

  return (
    <div className="w-full h-[500px] bg-card rounded-2xl overflow-hidden border border-border">
      <div id={containerId} className="w-full h-full" />
    </div>
  );
}


// 2. Company Profile Widget
export function TradingViewProfile({ symbol, theme }: WidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tvSymbol = getTradingViewSymbol(symbol);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = ''; // Clear prior elements

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-profile.js';
    script.async = true;
    script.type = 'text/javascript';
    script.innerHTML = JSON.stringify({
      symbol: tvSymbol,
      width: '100%',
      height: 380,
      colorTheme: theme === 'dark' ? 'dark' : 'light',
      isTransparent: false,
      locale: 'en'
    });

    containerRef.current.appendChild(script);
  }, [tvSymbol, theme]);

  return (
    <div className="tradingview-widget-container" ref={containerRef}>
      <div className="tradingview-widget-container__widget h-[380px]"></div>
    </div>
  );
}

// 3. Financials Grid Widget
export function TradingViewFinancials({ symbol, theme }: WidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tvSymbol = getTradingViewSymbol(symbol);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = ''; // Clear prior elements

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-financials.js';
    script.async = true;
    script.type = 'text/javascript';
    script.innerHTML = JSON.stringify({
      symbol: tvSymbol,
      colorTheme: theme === 'dark' ? 'dark' : 'light',
      isTransparent: false,
      largeChartUrl: '',
      displayMode: 'regular',
      width: '100%',
      height: 480,
      locale: 'en'
    });

    containerRef.current.appendChild(script);
  }, [tvSymbol, theme]);

  return (
    <div className="tradingview-widget-container" ref={containerRef}>
      <div className="tradingview-widget-container__widget h-[480px]"></div>
    </div>
  );
}

// 4. Technical analysis Gauge Widget
export function TradingViewTechnical({ symbol, theme }: WidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tvSymbol = getTradingViewSymbol(symbol);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = ''; // Clear prior elements

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js';
    script.async = true;
    script.type = 'text/javascript';
    script.innerHTML = JSON.stringify({
      interval: '1D',
      width: '100%',
      isTransparent: false,
      height: 380,
      symbol: tvSymbol,
      showIntervalTabs: true,
      locale: 'en',
      colorTheme: theme === 'dark' ? 'dark' : 'light'
    });

    containerRef.current.appendChild(script);
  }, [tvSymbol, theme]);

  return (
    <div className="tradingview-widget-container" ref={containerRef}>
      <div className="tradingview-widget-container__widget h-[380px]"></div>
    </div>
  );
}
