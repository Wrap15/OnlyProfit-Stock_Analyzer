'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Sun, Moon, TrendingUp, GitCompare, Zap, LogOut, Edit2, User, Save, X } from 'lucide-react';
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
    userName,
    setUser, 
    setUserName,
    activatePro, 
    deactivatePro 
  } = useStockStore();

  const [mounted, setMounted] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const [customNameInput, setCustomNameInput] = useState('');

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync custom input field on userName changes
  useEffect(() => {
    if (userName) {
      setCustomNameInput(userName);
    } else if (userEmail) {
      setCustomNameInput(userEmail.split('@')[0]);
    } else {
      setCustomNameInput('');
    }
  }, [userName, userEmail]);

  // Listen for Firebase Auth session status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          let isPro = false;
          let displayName = user.displayName || '';
          if (userSnap.exists()) {
            const data = userSnap.data();
            isPro = !!data.isProUser;
            if (data.displayName) {
              displayName = data.displayName;
            }
          }
          setUser(user.uid, user.email, displayName);
          if (isPro) {
            activatePro();
          } else {
            deactivatePro();
          }
        } catch (err) {
          console.error('Session restoration fail', err);
          setUser(user.uid, user.email, user.displayName || '');
        }
      } else {
        setUser(null, null, null);
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
      setUser(null, null, null);
      deactivatePro();
    } catch (err) {
      console.error('Error signing out user', err);
    }
  };

  const handleSaveCustomName = async () => {
    const trimmed = customNameInput.trim();
    if (!trimmed || !userId) return;

    try {
      // 1. Update Firebase Auth Profile
      if (auth.currentUser) {
        const { updateProfile } = await import('firebase/auth');
        await updateProfile(auth.currentUser, { displayName: trimmed });
      }

      // 2. Update Firestore User Profile document
      const { setDoc, doc } = await import('firebase/firestore');
      await setDoc(doc(db, 'users', userId), { displayName: trimmed }, { merge: true });

      // 3. Update Zustand Store State
      setUserName(trimmed);
      setIsEditNameOpen(false);
    } catch (err) {
      console.error('Failed to save customized name', err);
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-border bg-card/85 backdrop-blur-md transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            
            {/* Logo details */}
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2 select-none group">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/10 group-hover:brightness-105 transition-all">
                  <TrendingUp className="h-5.5 w-5.5" />
                </span>
                <span className="font-black text-base tracking-tight text-text-primary group-hover:text-profit transition-colors">
                  OnlyProfit
                </span>
              </Link>
            </div>

            {/* Desktop Command search shortcut button */}
            <div className="hidden sm:block flex-1 max-w-md">
              <button 
                onClick={() => setIsSearchModalOpen(true)}
                className="w-full h-10 rounded-2xl border border-border bg-card/60 hover:bg-background text-text-secondary hover:text-text-primary px-4 flex items-center justify-between text-xs font-bold transition-all duration-250 cursor-pointer shadow-inner"
              >
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  <span>Search stocks, mutual funds, baskets...</span>
                </div>
                <kbd className="h-6 px-1.5 rounded-lg border border-border bg-background text-[10px] font-mono flex items-center justify-center select-none uppercase tracking-wider text-text-secondary/70">
                  Ctrl K
                </kbd>
              </button>
            </div>

            {/* Header action menus */}
            <div className="flex items-center gap-3">
              {/* Mobile Search trigger */}
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
              >
                <GitCompare className="h-4.5 w-4.5 text-profit" />
                <span className="hidden xs:inline">Compare</span>
              </Link>

              {/* User Account State details */}
              {mounted && (
                userId ? (
                  <div className="flex items-center gap-2 border border-border bg-background px-3 py-1.5 h-10 rounded-xl select-none max-w-[150px] sm:max-w-[220px]">
                    <span className="relative flex h-1.5 w-1.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                    <span 
                      className="text-[11px] font-bold text-text-primary truncate cursor-pointer hover:text-profit transition-colors"
                      title={`${userName || userEmail} (Click to edit username)`}
                      onClick={() => setIsEditNameOpen(true)}
                    >
                      {userName || userEmail?.split('@')[0]}
                    </span>
                    
                    {/* Username custom edit pencil button */}
                    <button
                      onClick={() => setIsEditNameOpen(true)}
                      className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                      title="Edit Display Name"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>

                    <button
                      onClick={handleSignOut}
                      className="p-1 rounded-lg text-text-secondary hover:text-loss transition-colors cursor-pointer shrink-0 ml-1"
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

      {/* Edit Username Modal Popover */}
      {isEditNameOpen && (
        <div className="fixed inset-0 z-[130] bg-slate-950/45 dark:bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-card border border-border rounded-3xl shadow-2xl overflow-hidden relative p-6 animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsEditNameOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                <User className="h-4.5 w-4.5" />
              </div>
              <h3 className="font-extrabold text-base text-text-primary tracking-tight">
                Customize Name
              </h3>
            </div>

            <p className="text-xs text-text-secondary font-semibold mb-4 leading-relaxed">
              Set a custom display name. This will be visible on your workspace profile and reports.
            </p>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Enter custom username..."
                value={customNameInput}
                onChange={(e) => setCustomNameInput(e.target.value)}
                maxLength={25}
                className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-text-primary placeholder:text-text-secondary/50 text-xs font-bold focus:outline-none focus:border-profit focus:ring-1 focus:ring-profit/30 transition-all"
              />

              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => setIsEditNameOpen(false)}
                  className="flex-1 h-9 rounded-xl border border-border hover:bg-slate-50 dark:hover:bg-slate-800 text-text-secondary text-xs font-extrabold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCustomName}
                  className="flex-1 h-9 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-white hover:brightness-105 text-xs font-extrabold transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center gap-1.5 cursor-pointer border border-emerald-500/20"
                >
                  <Save className="h-3.5 w-3.5" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
