'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Sun, Moon, TrendingUp, GitCompare, Zap, LogOut } from 'lucide-react';
import { useStockStore } from '@/store/useStockStore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import SearchCommandCenter from './SearchCommandCenter';
import SaaSProModal from './SaaSProModal';
import FirebaseAuthModal from './FirebaseAuthModal';

export default function Navbar() {
  const { 
    theme, 
    toggleTheme, 
    userId, 
    userEmail, 
    setUser, 
    activatePro, 
    deactivatePro 
  } = useStockStore();

  const [mounted, setMounted] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Listen for Firebase Auth session status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          let isPro = false;
          if (userSnap.exists()) {
            isPro = !!userSnap.data().isProUser;
          }
          setUser(user.uid, user.email);
          if (isPro) {
            activatePro();
          } else {
            deactivatePro();
          }
        } catch (err) {
          console.error('Session restoration fail', err);
          setUser(user.uid, user.email);
        }
      } else {
        setUser(null, null);
        deactivatePro();
      }
    });
    return () => unsubscribe();
  }, [setUser, activatePro, deactivatePro]);

  // Ctrl + K key binding
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null, null);
      deactivatePro();
    } catch (err) {
      console.error('Error signing out user', err);
    }
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

            {/* Desktop Search Button (Triggering Search Modal) */}
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="hidden sm:flex relative flex-1 max-w-lg items-center justify-between h-10 pl-10 pr-4 rounded-full border border-border bg-background text-sm text-text-secondary hover:text-text-primary transition-all duration-200 hover:border-profit/35 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 cursor-pointer select-none text-left"
            >
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <Search className="h-4 w-4 text-text-secondary" />
              </div>
              <span>Search stocks, mutual funds, baskets...</span>
              <kbd className="px-2 py-0.5 rounded bg-card border border-border/80 text-[10px] text-text-secondary font-mono select-none flex items-center gap-0.5">
                <span className="text-[8px]">Ctrl</span><span>K</span>
              </kbd>
            </button>

            {/* Right Buttons Section */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Mobile Search Button trigger (Visible on Mobile Only) */}
              <button
                onClick={() => setIsSearchModalOpen(true)}
                className="flex sm:hidden h-10 w-10 items-center justify-center rounded-xl border border-border bg-card hover:bg-background text-text-primary transition-all duration-200"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* SaaS Pro Tier Badge */}
              {mounted && !userId && (
                <button
                  onClick={() => setIsProModalOpen(true)}
                  className="hidden sm:flex h-10 px-3 rounded-xl border items-center gap-1 text-xs font-bold transition-all duration-200 select-none cursor-pointer bg-gradient-to-r from-amber-500/5 to-yellow-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400 hover:from-amber-500/10 hover:to-yellow-500/10"
                  title="Upgrade to OnlyProfit Pro"
                >
                  <Zap className="h-4 w-4 shrink-0 text-amber-500" />
                  <span className="hidden sm:inline">Go Pro</span>
                </button>
              )}

              {/* Compare Page Link */}
              <Link
                href="/compare"
                className="flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-border bg-card hover:bg-background text-text-secondary hover:text-text-primary text-xs font-bold transition-all duration-200"
                title="Compare Stocks side-by-side"
              >
                <GitCompare className="h-4.5 w-4.5 text-profit" />
                <span className="hidden xs:inline">Compare</span>
              </Link>

              {/* User Account State details */}
              {mounted && (
                userId ? (
                  <div className="flex items-center gap-2 border border-border bg-background px-3 py-1.5 h-10 rounded-xl select-none max-w-[140px] sm:max-w-[200px]">
                    <span className="relative flex h-1.5 w-1.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                    <span 
                      className="text-[11px] font-bold text-text-primary truncate"
                      title={`${userEmail} (Firebase Cloud Connected)`}
                    >
                      {userEmail?.split('@')[0]}
                    </span>
                    <button
                      onClick={handleSignOut}
                      className="p-1 rounded-lg text-text-secondary hover:text-loss transition-colors cursor-pointer shrink-0"
                      title="Sign Out"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="h-10 px-3.5 rounded-xl border border-border bg-card hover:bg-background text-text-primary text-xs font-bold transition-all duration-200 cursor-pointer"
                  >
                    Sign In
                  </button>
                )
              )}

              {/* Theme Toggle */}
              {mounted && (
                <button
                  onClick={toggleTheme}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card hover:bg-background text-text-primary transition-all duration-200 cursor-pointer"
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
                </button>
              )}
            </div>

          </div>
        </div>
      </nav>

      {/* Global Search Command Center Modal */}
      <SearchCommandCenter 
        isOpen={isSearchModalOpen} 
        onClose={() => setIsSearchModalOpen(false)} 
      />

      {/* SaaS Pro Modal */}
      <SaaSProModal 
        isOpen={isProModalOpen} 
        onClose={() => setIsProModalOpen(false)} 
        onAuthPrompt={() => setIsAuthModalOpen(true)}
      />

      {/* Firebase Account Auth Modal */}
      <FirebaseAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}
