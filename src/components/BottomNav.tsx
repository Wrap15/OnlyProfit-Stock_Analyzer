'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Star, 
  Compass, 
  TrendingUp, 
  User, 
  X, 
  Edit2, 
  Save, 
  LogOut, 
  Zap, 
  ShieldAlert, 
  CheckCircle2
} from 'lucide-react';
import { useStockStore } from '@/store/useStockStore';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

export default function BottomNav() {
  const pathname = usePathname();
  const { 
    userId, 
    userEmail, 
    userName, 
    setUser,
    setUserName,
    deactivatePro,
    toggleAuthModal 
  } = useStockStore();

  const [mounted, setMounted] = useState(false);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync custom input field on userName changes
  useEffect(() => {
    if (userName) {
      setNameInput(userName);
    } else if (userEmail) {
      setNameInput(userEmail.split('@')[0]);
    } else {
      setNameInput('');
    }
  }, [userName, userEmail]);

  if (!mounted) return null;

  const tabs = [
    { label: 'Watchlist', href: '/?tab=watchlist', icon: Star },
    { label: 'Explore', href: '/?tab=explore', icon: Compass },
    { label: 'Portfolio', href: '/simulator', icon: TrendingUp },
    { label: 'Profile', href: '#profile', icon: User }
  ];

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null, null, null);
      deactivatePro();
      setIsProfileDrawerOpen(false);
    } catch (err) {
      console.error('Error signing out user', err);
    }
  };

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed || !userId) return;

    try {
      if (auth.currentUser) {
        const { updateProfile } = await import('firebase/auth');
        await updateProfile(auth.currentUser, { displayName: trimmed });
      }

      const { setDoc, doc } = await import('firebase/firestore');
      await setDoc(doc(db, 'users', userId), { displayName: trimmed }, { merge: true });

      setUserName(trimmed);
      setIsEditingName(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to save customized name', err);
    }
  };

  return (
    <>
      <div className="sm:hidden fixed bottom-4 left-4 right-4 z-50 bg-card/75 backdrop-blur-xl border border-border/80 rounded-3xl px-4 py-2 shadow-[0_16px_48px_rgba(0,0,0,0.3)] transition-all duration-300">
        <div className="flex items-center justify-between gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isProfileTab = tab.label === 'Profile';
            
            let isActive = false;
            if (isProfileTab) {
              isActive = isProfileDrawerOpen;
            } else if (typeof window !== 'undefined') {
              const url = new URL(tab.href, window.location.origin);
              const pathnameMatch = pathname === url.pathname;
              const searchParamsMatch = !url.search || window.location.search.includes(url.searchParams.get('tab') || '');
              isActive = pathnameMatch && searchParamsMatch;
            }

            const content = (
              <>
                <div className={`relative flex items-center justify-center p-2 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-profit/10 text-profit scale-105' 
                    : 'text-text-secondary group-hover:text-text-primary'
                }`}>
                  <Icon className="h-5 w-5" />
                  {isActive && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-profit animate-pulse" />
                  )}
                </div>
                <span className={`text-[8px] font-black uppercase tracking-widest mt-0.5 transition-colors duration-200 ${
                  isActive ? 'text-profit' : 'text-text-secondary/80'
                }`}>
                  {tab.label}
                </span>
              </>
            );

            const className = `flex flex-col items-center justify-center flex-1 py-0.5 transition-all duration-200 active:scale-[0.9] cursor-pointer group`;

            if (isProfileTab) {
              return (
                <button
                  key={tab.label}
                  onClick={() => setIsProfileDrawerOpen(prev => !prev)}
                  className={className}
                  aria-label="Profile Sheet"
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
                onClick={() => setIsProfileDrawerOpen(false)}
              >
                {content}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Mobile Profile Bottom Sheet Drawer Overlay */}
      {isProfileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs sm:hidden animate-fade-in">
          {/* Close Overlay */}
          <div className="absolute inset-0" onClick={() => setIsProfileDrawerOpen(false)} />
          
          {/* Drawer content */}
          <div className="relative w-full bg-card rounded-t-3xl border-t border-border p-6 pb-8 space-y-5 animate-slide-up max-h-[85vh] overflow-y-auto z-50 shadow-2xl">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <User className="h-4.5 w-4.5 text-profit" />
                <h3 className="text-xs font-black text-text-secondary uppercase tracking-wider">Account Settings</h3>
              </div>
              <button 
                onClick={() => setIsProfileDrawerOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Profile Content Body */}
            {userId ? (
              <div className="space-y-4">
                {/* User card info */}
                <div className="p-4 rounded-2xl border border-border bg-background flex flex-col gap-2 relative">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-black text-text-primary">
                      Logged in as
                    </span>
                  </div>
                  <div className="text-sm font-black text-text-primary mt-1 truncate">
                    {userName || userEmail?.split('@')[0]}
                  </div>
                  <div className="text-2xs text-text-secondary font-semibold truncate">
                    {userEmail}
                  </div>
                </div>

                {/* Pro Tier Upgrade / Status */}
                <div className="p-4 rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-yellow-500/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-amber-500 animate-pulse" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-amber-600 dark:text-amber-400">OnlyProfit Pro Active</span>
                      <span className="text-[9px] text-text-secondary font-medium">All simulator scanners active</span>
                    </div>
                  </div>
                  <span className="text-[8px] font-black uppercase bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-0.5 rounded-md">
                    Active
                  </span>
                </div>

                {/* Edit display name panel */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-text-secondary uppercase tracking-wider">Custom Username</span>
                    {!isEditingName && (
                      <button
                        onClick={() => setIsEditingName(true)}
                        className="flex items-center gap-1 text-[10px] font-black text-profit hover:underline cursor-pointer"
                      >
                        <Edit2 className="h-3 w-3" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>

                  {isEditingName ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter username..."
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        maxLength={25}
                        className="flex-1 h-9 px-3 rounded-xl border border-border bg-background text-text-primary placeholder:text-text-secondary/50 text-xs font-bold focus:outline-none focus:border-profit focus:ring-1 focus:ring-profit/30 transition-all"
                      />
                      <button
                        onClick={handleSaveName}
                        className="h-9 px-3 rounded-xl bg-profit hover:brightness-105 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md shadow-profit/15"
                      >
                        <Save className="h-3.5 w-3.5" />
                        <span>Save</span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs font-bold text-text-primary bg-background border border-border/80 px-3 py-2 rounded-xl flex items-center justify-between">
                      <span>{userName || 'Set a custom display name'}</span>
                      {saveSuccess && (
                        <span className="text-[9px] font-black text-profit flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Saved
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Sign Out Button */}
                <button
                  onClick={handleSignOut}
                  className="w-full h-10 mt-4 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-rose-500/15 transition-all cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out of Account</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-2xl border border-border bg-background/50 text-center space-y-2">
                  <ShieldAlert className="h-8 w-8 text-text-secondary/70 mx-auto animate-bounce" />
                  <h4 className="text-xs font-black text-text-primary">Guest Session Active</h4>
                  <p className="text-[10px] text-text-secondary leading-relaxed font-semibold max-w-[250px] mx-auto">
                    Sign in to sync your paper trading history, watchlist, and custom settings across all devices.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setIsProfileDrawerOpen(false);
                    toggleAuthModal(true);
                  }}
                  className="w-full h-11 rounded-2xl bg-profit hover:brightness-105 text-white font-black text-xs transition-all shadow-md shadow-profit/15 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <User className="h-4.5 w-4.5" />
                  <span>Sign In / Create Account</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
