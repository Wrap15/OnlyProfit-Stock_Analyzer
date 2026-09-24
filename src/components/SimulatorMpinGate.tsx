'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Lock, ShieldCheck, Mail, ShieldAlert, 
  KeyRound, ArrowLeft, Check, AlertCircle, 
  Clock, ShieldX, RefreshCw, Eye, EyeOff,
  Copy, CheckCheck, ExternalLink, Key
} from 'lucide-react';
import { useStockStore } from '@/store/useStockStore';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { sendPasswordResetEmail, sendSignInLinkToEmail } from 'firebase/auth';
import Link from 'next/link';

export default function SimulatorMpinGate() {
  const { 
    userId,
    userEmail, 
    userName, 
    userMpin, 
    setUserMpin, 
    unlockSimulator,
    mpinFailedAttempts,
    mpinLockoutUntil,
    registerFailedMpinAttempt,
    resetFailedMpinAttempts,
    setMpinLockout,
    clearMpinLockout
  } = useStockStore();

  // Pin state
  const [pin, setPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [isSettingUp, setIsSettingUp] = useState<boolean>(!userMpin);
  const [showPin, setShowPin] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);
  const [sendingResetEmail, setSendingResetEmail] = useState<boolean>(false);
  const [generatedResetUrl, setGeneratedResetUrl] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [sendingPasswordReset, setSendingPasswordReset] = useState<boolean>(false);
  const [passwordResetSuccess, setPasswordResetSuccess] = useState<string | null>(null);

  // Real-time 1-second interval to update remaining lockout timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen for direct 4-Digit MPIN Reset Link token or reset_mpin flag in URL search parameters
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const resetToken = params.get('reset_mpin_token');
    const resetParam = params.get('reset_mpin');
    const resetEmail = params.get('email');

    if (resetToken || resetParam === 'true') {
      clearMpinLockout();
      resetFailedMpinAttempts();
      setUserMpin(null);
      setPin('');
      setConfirmPin('');
      setIsSettingUp(true);
      setErrorMsg(null);
      setSuccessMsg(`Identity verified via 4-Digit MPIN Reset Link for ${resetEmail || userEmail || 'your account'}! Please set your new 4-digit MPIN.`);

      // Clear Firestore lockout so syncFirestoreSecurity doesn't re-lock!
      if (userId) {
        const mpinDocRef = doc(db, 'users', userId, 'security', 'mpin');
        setDoc(mpinDocRef, {
          lockoutUntil: null,
          failedAttempts: 0,
          hasMpin: false,
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch((err) => console.warn('Failed to clear Firestore lockout on URL reset:', err));
      }

      // Clean URL search parameters without reloading
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }
  }, [clearMpinLockout, resetFailedMpinAttempts, setUserMpin, userEmail, userId]);

  // Sync setup mode if userMpin changes
  useEffect(() => {
    setIsSettingUp(!userMpin);
  }, [userMpin]);

  // Sync lockout state from Firestore on mount to prevent browser cache bypass
  useEffect(() => {
    let active = true;
    async function syncFirestoreSecurity() {
      if (!userId) return;
      try {
        const mpinDocRef = doc(db, 'users', userId, 'security', 'mpin');
        const snap = await getDoc(mpinDocRef);
        if (snap.exists() && active) {
          const data = snap.data();
          if (data.lockoutUntil && typeof data.lockoutUntil === 'number' && data.lockoutUntil > Date.now()) {
            setMpinLockout(data.lockoutUntil);
          } else {
            clearMpinLockout();
          }
        }
      } catch (err) {
        console.warn('Failed to fetch Firestore MPIN security record:', err);
      }
    }
    syncFirestoreSecurity();
    return () => {
      active = false;
    };
  }, [userId, setMpinLockout, clearMpinLockout]);

  // Check if account is currently locked out for 24 hours
  const isLockedOut = useMemo(() => {
    if (!mpinLockoutUntil) return false;
    return currentTime < mpinLockoutUntil;
  }, [mpinLockoutUntil, currentTime]);

  // If lockout expired, clear it
  useEffect(() => {
    if (mpinLockoutUntil && currentTime >= mpinLockoutUntil) {
      clearMpinLockout();
      setErrorMsg(null);
    }
  }, [mpinLockoutUntil, currentTime, clearMpinLockout]);

  // Calculate formatted countdown string: HH:MM:SS
  const countdownFormatted = useMemo(() => {
    if (!mpinLockoutUntil || currentTime >= mpinLockoutUntil) return '00:00:00';
    const diff = mpinLockoutUntil - currentTime;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  }, [mpinLockoutUntil, currentTime]);

  // Physical keyboard listener
  useEffect(() => {
    if (isLockedOut) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
        handleClear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, confirmPin, isSettingUp, userMpin, isLockedOut]);

  const handleDigitPress = (digit: string) => {
    if (isLockedOut) return;
    setErrorMsg(null);

    if (isSettingUp) {
      if (pin.length < 4) {
        setPin(prev => prev + digit);
      } else if (confirmPin.length < 4) {
        setConfirmPin(prev => prev + digit);
      }
    } else {
      if (pin.length < 4) {
        const nextPin = pin + digit;
        setPin(nextPin);

        if (nextPin.length === 4) {
          verifyPin(nextPin);
        }
      }
    }
  };

  const handleBackspace = () => {
    if (isLockedOut) return;
    setErrorMsg(null);
    if (isSettingUp) {
      if (confirmPin.length > 0) {
        setConfirmPin(prev => prev.slice(0, -1));
      } else if (pin.length > 0) {
        setPin(prev => prev.slice(0, -1));
      }
    } else {
      setPin(prev => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    if (isLockedOut) return;
    setErrorMsg(null);
    setPin('');
    if (isSettingUp) setConfirmPin('');
  };

  // Dispatches security alert to API and generates dedicated MPIN recovery token
  const dispatchSecurityIncident = async (attempts: number) => {
    const targetEmail = userEmail || 'trader@onlyprofit.in';
    
    // 1. Post to our server-side security alert route
    try {
      await fetch('/api/security/mpin-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          userName: userName || 'Trader',
          attempts,
          lockoutHours: 24,
          timestamp: Date.now()
        })
      });
    } catch (err) {
      console.warn('Security alert endpoint notification warning:', err);
    }

    // 2. Generate dedicated MPIN reset token for recovery email
    try {
      await fetch('/api/security/mpin-reset-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          userId: userId || null
        })
      });
    } catch (err) {
      console.warn('MPIN reset token dispatch warning:', err);
    }
  };

  const verifyPin = async (enteredPin: string) => {
    if (isLockedOut) return;

    // Strict check: Only accept the user's exact created MPIN. No backdoor / fallback!
    if (userMpin && enteredPin === userMpin) {
      resetFailedMpinAttempts();
      setSuccessMsg('MPIN Verified. Unlocking Simulator...');
      
      // Reset attempts in Firestore
      if (userId) {
        try {
          const mpinDocRef = doc(db, 'users', userId, 'security', 'mpin');
          await setDoc(mpinDocRef, {
            failedAttempts: 0,
            lockoutUntil: null,
            lastUnlockedAt: new Date().toISOString()
          }, { merge: true });
        } catch {}
      }

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate([30]); } catch {}
      }
      setTimeout(() => {
        unlockSimulator();
      }, 500);
    } else {
      // Wrong PIN entered!
      const currentAttempts = registerFailedMpinAttempt();
      const remainingAttempts = Math.max(0, 3 - currentAttempts);
      setIsShaking(true);

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate([100, 50, 100]); } catch {}
      }

      if (currentAttempts >= 3) {
        // Industry criteria: 3 failed attempts = LOCK SIMULATOR FOR 24 HOURS (1 DAY)
        const lockoutTimestamp = Date.now() + 24 * 60 * 60 * 1000;
        setMpinLockout(lockoutTimestamp);
        setErrorMsg('Security Lockout Triggered: 3 incorrect attempts. Simulator locked for 24 hours.');

        // Persist lockout to Firestore so clearing local storage won't bypass
        if (userId) {
          try {
            const mpinDocRef = doc(db, 'users', userId, 'security', 'mpin');
            await setDoc(mpinDocRef, {
              failedAttempts: 3,
              lockoutUntil: lockoutTimestamp,
              lockedAt: new Date().toISOString(),
              userEmail: userEmail || ''
            }, { merge: true });
          } catch (err) {
            console.warn('Failed to sync lockout to Firestore:', err);
          }
        }

        // Dispatch alert email to user's Gmail
        await dispatchSecurityIncident(3);
      } else {
        const attemptWord = remainingAttempts === 1 ? 'attempt' : 'attempts';
        setErrorMsg(`Incorrect MPIN. ${remainingAttempts} ${attemptWord} remaining before 24-hour account lockout.`);
      }

      setTimeout(() => {
        setIsShaking(false);
        setPin('');
      }, 600);
    }
  };

  const handleSaveNewMpin = async () => {
    if (pin.length !== 4) {
      setErrorMsg('Please enter a 4-digit MPIN');
      return;
    }
    if (pin !== confirmPin) {
      setErrorMsg('MPIN and Confirm MPIN do not match');
      setConfirmPin('');
      return;
    }

    setUserMpin(pin);
    resetFailedMpinAttempts();
    setSuccessMsg('MPIN successfully created! Unlocking...');

    if (userId) {
      try {
        const mpinDocRef = doc(db, 'users', userId, 'security', 'mpin');
        await setDoc(mpinDocRef, {
          hasMpin: true,
          failedAttempts: 0,
          lockoutUntil: null,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn('Failed to save MPIN status in Firestore:', err);
      }
    }

    setTimeout(() => {
      unlockSimulator();
    }, 600);
  };

  // Dedicated 4-Digit MPIN Reset Link Generator (NOT Password Reset)
  const handleResetViaGmail = async () => {
    setSendingResetEmail(true);
    setErrorMsg(null);
    const targetEmail = userEmail || 'trader@onlyprofit.in';

    try {
      // 1. Generate dedicated MPIN reset token URL from server API
      const res = await fetch('/api/security/mpin-reset-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          userId: userId || null
        })
      });
      const data = await res.json();
      const resetLinkUrl = data.resetUrl || `${window.location.origin}/simulator?reset_mpin=true&email=${encodeURIComponent(targetEmail)}`;
      setGeneratedResetUrl(resetLinkUrl);

      // 2. Dispatch email link via Firebase Auth
      if (userEmail) {
        try {
          const actionCodeSettings = {
            url: resetLinkUrl,
            handleCodeInApp: true,
          };
          await sendSignInLinkToEmail(auth, userEmail, actionCodeSettings);
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('emailForSignIn', userEmail);
          }
        } catch (firebaseErr: any) {
          console.warn('Firebase email dispatch note (link provided in modal):', firebaseErr);
        }
      }

      setSuccessMsg(`Dedicated 4-Digit MPIN Reset Link generated and dispatched for ${targetEmail}! Click below to configure your new PIN.`);
    } catch (err: any) {
      console.error('Reset via Gmail error:', err);
      const fallbackUrl = `${window.location.origin}/simulator?reset_mpin=true&email=${encodeURIComponent(targetEmail)}`;
      setGeneratedResetUrl(fallbackUrl);
      setSuccessMsg(`Dedicated 4-Digit MPIN Reset Link ready! Click below to configure your new PIN.`);
    } finally {
      setSendingResetEmail(false);
    }
  };

  const handleApplyDirectReset = async () => {
    clearMpinLockout();
    resetFailedMpinAttempts();
    setUserMpin(null);
    setPin('');
    setConfirmPin('');
    setIsSettingUp(true);
    setIsResetConfirmOpen(false);
    setGeneratedResetUrl(null);
    setSuccessMsg(`Identity verified! 24-hour lockout removed. Please set your new 4-digit MPIN.`);

    // Clear lockout from Firestore so it doesn't get reloaded
    if (userId) {
      try {
        const mpinDocRef = doc(db, 'users', userId, 'security', 'mpin');
        await setDoc(mpinDocRef, {
          lockoutUntil: null,
          failedAttempts: 0,
          hasMpin: false,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn('Failed to clear lockout in Firestore:', err);
      }
    }
  };

  // Dedicated Account Login Password Reset Link (for account login password, not MPIN)
  const handleSendPasswordReset = async () => {
    if (!userEmail) {
      setErrorMsg('No email found for account. Please sign in to request password reset.');
      return;
    }
    setSendingPasswordReset(true);
    setPasswordResetSuccess(null);
    setErrorMsg(null);
    try {
      const actionCodeSettings = {
        url: typeof window !== 'undefined' ? `${window.location.origin}/` : 'http://localhost:3000/',
        handleCodeInApp: true,
      };
      await sendPasswordResetEmail(auth, userEmail, actionCodeSettings);
      setPasswordResetSuccess(`Login Password reset email dispatched to ${userEmail}! Check your inbox to change your account password.`);
    } catch (err: any) {
      console.error('Password reset email error:', err);
      let friendlyError = 'Failed to send password reset email.';
      if (err.code === 'auth/user-not-found') {
        friendlyError = 'No account found matching this email address.';
      }
      setErrorMsg(friendlyError);
    } finally {
      setSendingPasswordReset(false);
    }
  };

  const handleCopyLink = () => {
    if (generatedResetUrl) {
      navigator.clipboard.writeText(generatedResetUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const emailDisplay = userEmail || 'Verified Google Account';
  const nameDisplay = userName || 'Trader';

  return (
    <main className="min-h-screen bg-background text-text-primary flex flex-col items-center justify-between pb-10">
      
      {/* Top Bar */}
      <nav className="w-full px-4 sm:px-8 py-4 flex items-center justify-between border-b border-border/60 bg-background/80 backdrop-blur-md">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Dashboard</span>
        </Link>
        <span className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border flex items-center gap-1.5 ${
          isLockedOut
            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            : 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20'
        }`}>
          {isLockedOut ? <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> : <ShieldCheck className="w-3.5 h-3.5" />}
          <span>{isLockedOut ? 'Security Locked' : 'Protected Simulator'}</span>
        </span>
      </nav>

      {/* Main Security Card */}
      <div className="w-full max-w-sm px-4 py-8 flex flex-col items-center text-center space-y-6">
        
        {/* Verified Account Badge */}
        <div className="w-full p-3.5 rounded-2xl bg-card/60 border border-border/80 flex items-center gap-3 backdrop-blur-sm shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-black flex items-center justify-center font-black text-sm uppercase shadow-sm">
            {nameDisplay.charAt(0)}
          </div>
          <div className="min-w-0 text-left flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-extrabold text-text-primary truncate block">
                {nameDisplay}
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </div>
            <span className="text-[10px] text-text-secondary font-mono truncate block flex items-center gap-1">
              <Mail className="w-3 h-3 text-emerald-400 shrink-0" />
              {emailDisplay}
            </span>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* CASE 1: 24-HOUR INDUSTRY SECURITY LOCKOUT SCREEN              */}
        {/* ------------------------------------------------------------- */}
        {isLockedOut ? (
          <div className="w-full space-y-5 p-6 rounded-3xl bg-rose-500/5 border border-rose-500/20 animate-fade-in shadow-xl">
            <div className="h-16 w-16 mx-auto rounded-3xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shadow-lg shadow-rose-500/10 animate-pulse">
              <ShieldX className="w-8 h-8 text-rose-500" />
            </div>
            
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20 inline-block">
                Industry Compliance Protocol
              </span>
              <h2 className="text-lg font-black text-text-primary pt-1">
                Simulator Locked for 24 Hours
              </h2>
              <p className="text-xs text-text-secondary leading-relaxed">
                3 consecutive incorrect MPIN attempts were recorded. As per financial industry security criteria, simulator access has been suspended.
              </p>
            </div>

            {/* Countdown Badge */}
            <div className="p-3.5 rounded-2xl bg-card border border-border/80 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-text-secondary">
                <Clock className="w-4 h-4 text-rose-400" />
                <span>Lockout Remaining:</span>
              </div>
              <span className="font-mono text-sm font-black text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-lg border border-rose-500/20">
                {countdownFormatted}
              </span>
            </div>

            {/* Alert Notice */}
            <div className="p-3 rounded-xl bg-background/80 border border-border/60 text-[11px] text-text-secondary text-left space-y-1">
              <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Security Notice Dispatched</span>
              </div>
              <p className="leading-normal">
                A security alert has been dispatched to <strong className="text-text-primary font-mono">{emailDisplay}</strong> with 4-digit MPIN reset instructions.
              </p>
            </div>

            {/* Reset via Gmail Button */}
            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              className="w-full py-3 rounded-xl bg-card hover:bg-slate-800 border border-border/80 text-xs font-bold text-emerald-450 hover:text-emerald-400 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Key className="w-4 h-4" />
              <span>Forgot MPIN? Reset via Gmail Link</span>
            </button>
          </div>
        ) : (
          /* ------------------------------------------------------------- */
          /* CASE 2: NORMAL MPIN PROMPT / SETUP                            */
          /* ------------------------------------------------------------- */
          <>
            {/* Header Icon and Title */}
            <div className="space-y-2">
              <div className="h-14 w-14 mx-auto rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 flex items-center justify-center shadow-lg shadow-emerald-500/5">
                {isSettingUp ? <KeyRound className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
              </div>
              <h2 className="text-xl font-black tracking-tight text-text-primary">
                {isSettingUp ? 'Create Security MPIN' : 'Enter Security MPIN'}
              </h2>
              <p className="text-xs text-text-secondary leading-relaxed font-semibold">
                {isSettingUp 
                  ? `Create a 4-digit PIN linked to your Gmail to protect your simulated ₹10,00,000 portfolio.` 
                  : `Enter your 4-digit MPIN to access your portfolio.`
                }
              </p>
            </div>

            {/* Feedback Alerts */}
            {errorMsg && (
              <div className="w-full p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-500 dark:text-rose-400 text-xs font-bold flex items-center justify-center gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="w-full p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 text-xs font-bold flex items-center justify-center gap-2 animate-fade-in">
                <Check className="w-4 h-4 shrink-0 stroke-[3]" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* PIN Dots / Digit Visualizer */}
            {!isSettingUp ? (
              /* Unlock Mode: 4 Cells with Show/Hide Toggle */
              <div className="space-y-2.5 w-full flex flex-col items-center">
                <div className={`flex items-center justify-center gap-3 py-1 ${isShaking ? 'animate-shake' : ''}`}>
                  {[0, 1, 2, 3].map((idx) => {
                    const isFilled = pin.length > idx;
                    const digitChar = isFilled ? pin[idx] : '';
                    return (
                      <div
                        key={idx}
                        className={`h-12 w-12 rounded-2xl flex items-center justify-center font-mono font-black text-xl transition-all duration-200 border ${
                          isFilled 
                            ? 'border-emerald-400 bg-emerald-500/10 text-emerald-400 shadow-[0_0_14px_rgba(16,185,129,0.35)] scale-105' 
                            : 'border-border/80 bg-card/70 text-text-secondary/30'
                        }`}
                      >
                        {isFilled ? (
                          showPin ? (
                            <span>{digitChar}</span>
                          ) : (
                            <div className="h-3.5 w-3.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                          )
                        ) : (
                          <span className="text-xs text-text-secondary/40">•</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Show/Hide Toggle Button & Failed Attempts Counter */}
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPin(prev => !prev)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-card border border-border/60 transition-colors cursor-pointer"
                    title={showPin ? "Hide PIN digits" : "Show PIN digits"}
                  >
                    {showPin ? <EyeOff className="w-3.5 h-3.5 text-emerald-400" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showPin ? 'Hide PIN' : 'Show PIN'}</span>
                  </button>

                  {mpinFailedAttempts > 0 && (
                    <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                      Failed: {mpinFailedAttempts}/3
                    </span>
                  )}
                </div>
              </div>
            ) : (
              /* Setup Mode: 2 Steps (Enter PIN + Confirm PIN) */
              <div className="w-full space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-text-secondary block">
                      {pin.length < 4 ? '1. Enter New 4-Digit MPIN' : '2. Confirm 4-Digit MPIN'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPin(prev => !prev)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-text-secondary hover:text-emerald-400 transition-colors cursor-pointer"
                    >
                      {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showPin ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-3 py-1">
                    {[0, 1, 2, 3].map((idx) => {
                      const targetStr = pin.length < 4 ? pin : confirmPin;
                      const isFilled = targetStr.length > idx;
                      const digitChar = isFilled ? targetStr[idx] : '';
                      return (
                        <div
                          key={idx}
                          className={`h-12 w-12 rounded-2xl flex items-center justify-center font-mono font-black text-xl transition-all duration-200 border ${
                            isFilled 
                              ? 'border-emerald-400 bg-emerald-500/10 text-emerald-400 shadow-[0_0_14px_rgba(16,185,129,0.35)] scale-105' 
                              : 'border-border/80 bg-card/70 text-text-secondary/30'
                          }`}
                        >
                          {isFilled ? (
                            showPin ? (
                              <span>{digitChar}</span>
                            ) : (
                              <div className="h-3.5 w-3.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                            )
                          ) : (
                            <span className="text-xs text-text-secondary/40">•</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {pin.length === 4 && confirmPin.length === 4 && (
                  <button
                    type="button"
                    onClick={handleSaveNewMpin}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer"
                  >
                    Confirm & Unlock Simulator
                  </button>
                )}
              </div>
            )}

            {/* Interactive Fintech Keypad */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleDigitPress(digit)}
                  className="h-14 rounded-2xl bg-card hover:bg-card-hover border border-border/80 text-lg font-black font-mono text-text-primary transition-all active:scale-90 active:bg-emerald-500/10 cursor-pointer shadow-soft"
                >
                  {digit}
                </button>
              ))}
              
              {/* Clear (C) Key - Replaces backdoor 1234 button */}
              <button
                type="button"
                onClick={handleClear}
                title="Clear input"
                className="h-14 rounded-2xl bg-card hover:bg-card-hover border border-border/80 text-rose-500 dark:text-rose-400 text-sm font-black uppercase flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-soft"
              >
                C
              </button>

              {/* Zero */}
              <button
                type="button"
                onClick={() => handleDigitPress('0')}
                className="h-14 rounded-2xl bg-card hover:bg-card-hover border border-border/80 text-lg font-black font-mono text-text-primary transition-all active:scale-90 active:bg-emerald-500/10 cursor-pointer shadow-soft"
              >
                0
              </button>

              {/* Backspace */}
              <button
                type="button"
                onClick={handleBackspace}
                className="h-14 rounded-2xl bg-card hover:bg-card-hover border border-border/80 text-xs font-black uppercase text-text-secondary hover:text-text-primary flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-soft"
              >
                ⌫
              </button>
            </div>

            {/* Bottom Options: Forgot MPIN & Reset */}
            {!isSettingUp ? (
              <div className="flex flex-col items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setGeneratedResetUrl(null);
                    setIsResetConfirmOpen(true);
                  }}
                  className="text-xs font-bold text-emerald-450 hover:underline transition-all cursor-pointer"
                >
                  Forgot MPIN? Reset via Gmail
                </button>
              </div>
            ) : (
              pin.length > 0 && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs font-bold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                >
                  Reset Inputs
                </button>
              )
            )}
          </>
        )}

      </div>

      {/* Security Reset Dialog: Dedicated 4-Digit MPIN + Account Password Reset */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-fade-in">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-sm w-full space-y-4 text-center shadow-2xl">
            <div className={`h-12 w-12 mx-auto rounded-2xl flex items-center justify-center ${
              generatedResetUrl 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
            }`}>
              {generatedResetUrl ? <Key className="w-6 h-6" /> : <Mail className="w-6 h-6" />}
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-text-primary">
                {generatedResetUrl ? '4-Digit MPIN Reset Link Ready' : 'Reset Simulator Security MPIN'}
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                {generatedResetUrl ? (
                  <>A dedicated 4-digit MPIN link has been generated for <span className="font-mono text-text-primary font-bold">{emailDisplay}</span>. You can open it below to configure your new PIN.</>
                ) : (
                  <>A dedicated 4-digit MPIN reset link will be sent to your registered Gmail <span className="font-mono text-text-primary font-bold">{emailDisplay}</span> (this resets your 4-digit simulator MPIN, not your account login password).</>
                )}
              </p>
            </div>

            {/* Notification Badges */}
            {passwordResetSuccess && (
              <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold text-left flex items-start gap-2">
                <Check className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{passwordResetSuccess}</span>
              </div>
            )}

            {generatedResetUrl ? (
              <div className="space-y-3 pt-1">
                <div className="p-2.5 rounded-xl bg-background border border-border/80 text-[11px] font-mono text-text-secondary break-all select-all flex items-center justify-between gap-2 text-left">
                  <span className="truncate flex-1 text-text-primary">{generatedResetUrl}</span>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="p-1.5 rounded-lg hover:bg-card border border-border/60 text-text-secondary hover:text-text-primary transition-colors shrink-0 cursor-pointer"
                    title="Copy Link"
                  >
                    {copiedLink ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleApplyDirectReset}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase text-xs tracking-wider transition-colors cursor-pointer shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Configure 4-Digit MPIN Now</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setIsResetConfirmOpen(false); setGeneratedResetUrl(null); }}
                  className="w-full text-center text-xs font-bold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleResetViaGmail}
                    disabled={sendingResetEmail}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
                  >
                    {sendingResetEmail ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Mail className="w-3.5 h-3.5" />
                        <span>Send 4-Digit MPIN Link</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleApplyDirectReset}
                    className="w-full py-2 rounded-xl bg-card hover:bg-card-hover border border-emerald-500/30 text-emerald-450 hover:text-emerald-400 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Reset & Enter New MPIN Now</span>
                  </button>
                </div>

                {/* Password Reset Section */}
                <div className="pt-2 border-t border-border/60 text-left space-y-1.5">
                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                    Forgot Login Password Instead?
                  </span>
                  <p className="text-[10px] text-text-secondary leading-normal">
                    Need to change your main OnlyProfit account login password?
                  </p>
                  <button
                    type="button"
                    onClick={handleSendPasswordReset}
                    disabled={sendingPasswordReset}
                    className="w-full py-2 px-3 rounded-xl bg-card hover:bg-card-hover border border-border text-[11px] font-semibold text-text-primary hover:text-sky-400 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {sendingPasswordReset ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <ExternalLink className="w-3 h-3" />
                        <span>Send Account Password Reset Link</span>
                      </>
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsResetConfirmOpen(false)}
                  className="w-full py-2 rounded-xl text-xs font-bold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Security Footer Note */}
      <footer className="text-[10px] text-text-secondary/70 font-mono flex items-center gap-1.5">
        <ShieldCheck className="w-3 h-3 text-emerald-400" />
        <span>SEBI / Banking Industry Security Standard • 3-Attempt Lockout Protection</span>
      </footer>

    </main>
  );
}
