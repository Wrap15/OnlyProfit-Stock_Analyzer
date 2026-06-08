'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Sun, Moon, TrendingUp, X, ArrowLeft, GitCompare } from 'lucide-react';
import { useStockStore } from '@/store/useStockStore';
import axios from 'axios';

interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}

export default function Navbar() {
  const router = useRouter();
  const { theme, toggleTheme, addToRecentSearches } = useStockStore();
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch search results on query change
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setLoading(true);
        try {
          const res = await axios.get(`/api/stock/search?q=${encodeURIComponent(query)}`);
          setResults(res.data || []);
          setShowDropdown(true);
        } catch (err) {
          console.error('Failed to search', err);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  // Focus mobile search input when overlay opens
  useEffect(() => {
    if (isMobileSearchOpen && mobileInputRef.current) {
      setTimeout(() => {
        mobileInputRef.current?.focus();
      }, 150);
    }
  }, [isMobileSearchOpen]);

  // Toggle body scroll lock when mobile search overlay is open
  useEffect(() => {
    if (isMobileSearchOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileSearchOpen]);

  // Click outside listener for desktop search
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (symbol: string) => {
    setQuery('');
    setShowDropdown(false);
    setIsMobileSearchOpen(false);
    addToRecentSearches(symbol);
    router.push(`/stock/${symbol}`);
  };

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-border bg-card/85 backdrop-blur-md transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            
            {/* Logo Section */}
            <Link href="/" className="flex items-center gap-2.5 group shrink-0 select-none">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-md shadow-emerald-500/10 group-hover:shadow-emerald-500/20 group-hover:scale-105 transition-all duration-300">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 opacity-20 blur-sm group-hover:opacity-45 transition-opacity" />
                <TrendingUp className="h-5 w-5 relative z-10" />
              </div>
              <div className="hidden xs:block sm:block">
                <span className="text-base sm:text-lg font-black tracking-tight bg-gradient-to-r from-text-primary via-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-white dark:to-emerald-400 block -mb-0.5">
                  OnlyProfit
                </span>
                <span className="block text-[8px] sm:text-[9px] font-black text-text-secondary tracking-widest uppercase opacity-75">
                  Smart Investing
                </span>
              </div>
            </Link>

            {/* Desktop Search Bar (Hidden on Mobile) */}
            <div className="hidden sm:block relative flex-1 max-w-lg" ref={dropdownRef}>
              <div className="relative group">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-4 w-4 text-text-secondary group-focus-within:text-profit transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder="Search Indian stocks (e.g., RELIANCE, TCS, INFY)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => query.trim().length >= 2 && setShowDropdown(true)}
                  className="w-full h-10 pl-10 pr-8 rounded-full border border-border bg-background text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-profit/20 focus:border-profit transition-all duration-200"
                />
                {query && (
                  <button 
                    onClick={() => setQuery('')}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-secondary hover:text-text-primary"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Desktop Dropdown Menu */}
              {showDropdown && (
                <div className="absolute left-0 mt-2 w-full max-h-80 overflow-y-auto rounded-2xl border border-border bg-card p-2 shadow-premium dark:shadow-premium-dark animate-in fade-in slide-in-from-top-2 duration-150">
                  {loading ? (
                    <div className="flex items-center justify-center py-6 text-sm text-text-secondary">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-profit border-t-transparent mr-2" />
                      Searching markets...
                    </div>
                  ) : results.length > 0 ? (
                    <div className="space-y-0.5">
                      {results.map((item) => (
                        <button
                          key={item.symbol}
                          onClick={() => handleSelect(item.symbol)}
                          className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-background transition-colors text-left"
                        >
                          <div>
                            <div className="font-bold text-sm text-text-primary">{item.symbol.split('.')[0]}</div>
                            <div className="text-xs text-text-secondary truncate max-w-[200px] sm:max-w-xs">{item.name}</div>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-background border border-border text-text-secondary">
                            {item.exchange}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-sm text-text-secondary">
                      No results found for &quot;{query}&quot;
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Buttons Section */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Mobile Search Button trigger (Visible on Mobile Only) */}
              <button
                onClick={() => setIsMobileSearchOpen(true)}
                className="flex sm:hidden h-10 w-10 items-center justify-center rounded-xl border border-border bg-card hover:bg-background text-text-primary transition-all duration-200"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Compare Page Link */}
              <Link
                href="/compare"
                className="flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-border bg-card hover:bg-background text-text-secondary hover:text-text-primary text-xs font-bold transition-all duration-200"
                title="Compare Stocks side-by-side"
              >
                <GitCompare className="h-4.5 w-4.5 text-profit" />
                <span className="hidden xs:inline">Compare</span>
              </Link>

              {/* Theme Toggle */}
              {mounted && (
                <button
                  onClick={toggleTheme}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card hover:bg-background text-text-primary transition-all duration-200"
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
                </button>
              )}
            </div>

          </div>
        </div>
      </nav>

      {/* MOBILE SEARCH OVERLAY (Visible only when triggered on Mobile) */}
      {isMobileSearchOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-background animate-in fade-in slide-in-from-bottom duration-200">
          {/* Header Row */}
          <div className="flex h-16 items-center px-4 gap-3 border-b border-border bg-card">
            <button
              onClick={() => {
                setIsMobileSearchOpen(false);
                setQuery('');
              }}
              className="p-1 rounded-lg text-text-secondary hover:text-text-primary"
              aria-label="Back"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            
            <div className="relative flex-1">
              <input
                ref={mobileInputRef}
                type="text"
                placeholder="Search stocks (e.g. RELIANCE, TCS)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-10 pl-3 pr-8 rounded-xl border border-border bg-background text-sm text-text-primary focus:outline-none focus:border-profit transition-colors"
              />
              {query && (
                <button 
                  onClick={() => setQuery('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-secondary"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Results Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-background">
            {query.trim().length < 2 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center text-text-secondary">
                <Search className="h-8 w-8 opacity-40 mb-2" />
                <p className="text-xs font-semibold">Type at least 2 characters to search stocks.</p>
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center h-48 text-text-secondary">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-profit border-t-transparent mb-2" />
                <p className="text-xs font-semibold">Searching Indian markets...</p>
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-1">
                {results.map((item) => (
                  <button
                    key={item.symbol}
                    onClick={() => handleSelect(item.symbol)}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl border border-border/30 bg-card hover:bg-border/30 transition-colors text-left"
                  >
                    <div>
                      <div className="font-extrabold text-sm text-text-primary">{item.symbol.split('.')[0]}</div>
                      <div className="text-xs text-text-secondary truncate max-w-[220px]">{item.name}</div>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-background border border-border text-text-secondary uppercase">
                      {item.exchange}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center text-text-secondary">
                <p className="text-xs font-semibold">No stocks found matching &quot;{query}&quot;</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
