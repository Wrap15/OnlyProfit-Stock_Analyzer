'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, ShieldAlert, CheckCircle, Mail, Lock, Shield, ArrowRight, RefreshCw, KeyRound, Eye, EyeOff, User } from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';
import { useStockStore } from '@/store/useStockStore';

interface FirebaseAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function FirebaseAuthModal({ isOpen, onClose, onSuccess }: FirebaseAuthModalProps) {
  const { setUser, activatePro } = useStockStore();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Input fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleSyncUserProStatus = async (user: any, customName?: string) => {
    let isPro = false;
    let displayName = customName || user.displayName || '';

    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        isPro = !!data.isProUser;
        if (data.displayName) {
          displayName = data.displayName;
        }
      } else {
        // Create user document in database
        await setDoc(userRef, {
          email: user.email || '',
          displayName: displayName,
          isProUser: false,
          createdAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.warn('Firestore database profile sync bypassed/unauthorized (using local profile instead):', err);
    }
    
    // ALWAYS synchronize local Zustand store state to guarantee login succeeds
    setUser(user.uid, user.email, displayName);
    if (isPro) {
      activatePro();
    }
  };

  // Check redirect result on mount (when returning from Google Sign-In redirect)
  useEffect(() => {
    let active = true;
    getRedirectResult(auth)
      .then(async (result) => {
        if (!active || !result?.user) return;
        await handleSyncUserProStatus(result.user);
        setSuccessMsg(`Welcome, ${result.user.displayName || result.user.email}!`);
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1000);
      })
      .catch((err: any) => {
        if (!active) return;
        if (err.code === 'auth/unauthorized-domain') {
          setError('Domain not authorized in Firebase: Please add your Vercel domain in Firebase Console > Authentication > Settings > Authorized domains.');
        } else if (err.code) {
          console.warn('Redirect auth result warning:', err);
        }
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Focus and fields reset on modal launch
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessMsg(null);
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setIsRegisterMode(false);
      setIsResetMode(false);
      setShowPassword(false);
    }
  }, [isOpen]);

  // Click outside backdrop to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const emailClean = email.trim();
    if (isRegisterMode) {
      const nameClean = name.trim();

      if (!nameClean || !emailClean || !password) {
        setError('Please fill in all register fields.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      setLoading(true);
      try {
        const userCred = await createUserWithEmailAndPassword(auth, emailClean, password);
        // Save name to Auth Profile
        await updateProfile(userCred.user, { displayName: nameClean });
        setSuccessMsg('Account registered successfully!');
        
        // Save to Firestore and sync store
        await handleSyncUserProStatus(userCred.user, nameClean);

        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1000);
      } catch (err: any) {
        console.error('Registration Error', err);
        let friendlyError = 'Registration failed. Check details.';
        if (err.code === 'auth/email-already-in-use') {
          friendlyError = 'This email address is already in use.';
        } else if (err.code === 'auth/invalid-email') {
          friendlyError = 'Invalid email format.';
        } else if (err.code === 'auth/weak-password') {
          friendlyError = 'Password is too weak.';
        }
        setError(friendlyError);
      } finally {
        setLoading(false);
      }
    } else {
      // Email Login
      if (!emailClean || !password) {
        setError('Please fill in email and password.');
        return;
      }

      setLoading(true);
      try {
        const userCred = await signInWithEmailAndPassword(auth, emailClean, password);
        setSuccessMsg('Logged in successfully!');
        await handleSyncUserProStatus(userCred.user);

        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1000);
      } catch (err: any) {
        console.error('Login Error', err);
        let friendlyError = 'Invalid credentials. Please try again.';
        if (err.code === 'auth/invalid-credential') {
          friendlyError = 'Invalid email or password.';
        } else if (err.code === 'auth/invalid-email') {
          friendlyError = 'Invalid email format.';
        }
        setError(friendlyError);
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const emailClean = email.trim();
    if (!emailClean) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const actionCodeSettings = {
        url: typeof window !== 'undefined' ? `${window.location.origin}/` : 'http://localhost:3000/',
        handleCodeInApp: true,
      };
      await sendPasswordResetEmail(auth, emailClean, actionCodeSettings);
      setSuccessMsg(`Account Login Password reset link dispatched to ${emailClean}. Follow the link in your email to set a new password.`);
    } catch (err: any) {
      console.error('Password Reset Error', err);
      let friendlyError = 'Failed to send reset link.';
      if (err.code === 'auth/user-not-found') {
        friendlyError = 'No account found matching this email.';
      }
      setError(friendlyError);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async (forceRedirect: boolean = false) => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    if (forceRedirect) {
      try {
        setSuccessMsg('Redirecting to Google Sign-In...');
        await signInWithRedirect(auth, googleProvider);
        return;
      } catch (redirectErr: any) {
        console.error('Google Redirect Error:', redirectErr);
        if (redirectErr.code === 'auth/unauthorized-domain') {
          setError('Domain unauthorized in Firebase: Please add your Vercel URL to Firebase Console > Authentication > Settings > Authorized domains.');
        } else {
          setError(redirectErr.message || 'Failed to redirect to Google.');
        }
        setLoading(false);
        return;
      }
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      await handleSyncUserProStatus(result.user);
      setSuccessMsg(`Welcome, ${result.user.displayName || result.user.email}!`);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (err.code === 'auth/popup-blocked') {
        // Automatically fallback to signInWithRedirect when the browser blocks the popup
        try {
          setSuccessMsg('Browser blocked popup window. Redirecting to Google Sign-In...');
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectErr: any) {
          if (redirectErr.code === 'auth/unauthorized-domain') {
            setError('This Vercel domain is not authorized in Firebase Console. Please add your Vercel domain to Firebase Console > Authentication > Settings > Authorized domains.');
          } else {
            setError('Browser blocked sign-in popup. Please click the direct sign-in button below.');
          }
        }
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Google sign-in window was closed before completing.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        // Ignored
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('Domain not authorized: Please add your Vercel URL to Firebase Console > Authentication > Settings > Authorized domains.');
      } else {
        setError(err.message || 'Failed to sign in with Google.');
      }
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="fixed inset-0 z-[120] bg-slate-955/45 dark:bg-slate-955/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        ref={containerRef}
        className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200"
      >
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Branding header */}
        <div className="p-6 pb-4 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border-b border-border/40 relative">
          <div className="absolute top-6 left-6 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-md shadow-emerald-500/15">
            {isResetMode ? <KeyRound className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
          </div>
          <div className="pl-14">
            <h3 className="font-extrabold text-lg text-text-primary tracking-tight">
              {isResetMode ? 'Recover Password' : 'OnlyProfit Workspace Auth'}
            </h3>
            <p className="text-xs text-text-secondary font-semibold mt-0.5">
              {isResetMode ? 'Request a reset token link.' : 'Secure your portfolio with Firebase Authentication.'}
            </p>
          </div>
        </div>

        {/* Auth Mode Tabs (Sign In / Create Account) */}
        {!isResetMode && (
          <div className="flex border-b border-border/40 text-xs font-bold text-center select-none">
            <button 
              type="button"
              onClick={() => { setIsRegisterMode(false); setError(null); setSuccessMsg(null); }}
              className={`flex-1 py-3 transition-colors cursor-pointer ${
                !isRegisterMode
                  ? 'border-b-2 border-profit text-profit bg-slate-500/5' 
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Sign In
            </button>
            <button 
              type="button"
              onClick={() => { setIsRegisterMode(true); setError(null); setSuccessMsg(null); }}
              className={`flex-1 py-3 transition-colors cursor-pointer ${
                isRegisterMode
                  ? 'border-b-2 border-profit text-profit bg-slate-500/5' 
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Form Body Workspace */}
        <div className="p-6 space-y-4">
          
          {/* Notification Banners */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 flex flex-col gap-2.5 text-xs text-rose-600 dark:text-rose-400 animate-fade-in font-semibold">
              <div className="flex gap-2.5 items-start">
                <ShieldAlert className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
              {(error.toLowerCase().includes('popup') || error.toLowerCase().includes('blocked')) && (
                <button
                  type="button"
                  onClick={() => handleGoogleSignIn(true)}
                  className="w-full py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-[0.98]"
                >
                  <span>Sign In with Google (Direct Redirect)</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              )}
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex gap-2.5 items-start text-xs text-emerald-600 dark:text-emerald-400 animate-fade-in font-semibold">
              <CheckCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {!isResetMode && (
            <>
              <button
                type="button"
                onClick={() => handleGoogleSignIn(false)}
                disabled={loading}
                className="w-full h-11 rounded-xl border border-border bg-background hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors font-bold text-xs text-text-primary flex items-center justify-center gap-2.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.4 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.92 0 12s.45 3.85 1.24 5.42l4.04-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.6 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-border"></div>
                <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-text-secondary tracking-wider">or with email</span>
                <div className="flex-grow border-t border-border"></div>
              </div>
            </>
          )}

          {isResetMode ? (
            /* Forgot Password Form */
            <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Registered Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-secondary pointer-events-none">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input 
                    type="email"
                    placeholder="name@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-background text-sm text-text-primary placeholder:text-text-secondary focus:border-profit focus:ring-0 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-profit hover:brightness-105 disabled:brightness-95 disabled:cursor-not-allowed text-white font-extrabold text-sm shadow-md shadow-profit/15 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>Send Reset Email</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setIsResetMode(false); setError(null); setSuccessMsg(null); }}
                className="w-full text-center text-xs font-bold text-text-secondary hover:text-text-primary transition-colors cursor-pointer mt-1"
              >
                Back to Sign In
              </button>
            </form>
          ) : !isRegisterMode ? (
            /* Email & Password login form */
            <form onSubmit={handleEmailAuthSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-secondary pointer-events-none">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input 
                    type="email"
                    placeholder="name@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-background text-sm text-text-primary placeholder:text-text-secondary focus:border-profit focus:ring-0 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Password</label>
                  <button 
                    type="button" 
                    onClick={() => { setIsResetMode(true); setError(null); setSuccessMsg(null); }}
                    className="text-[10px] text-profit hover:underline font-bold cursor-pointer focus:outline-none"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-secondary pointer-events-none">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 pl-10 pr-10 rounded-xl border border-border bg-background text-sm text-text-primary placeholder:text-text-secondary focus:border-profit focus:ring-0 focus:outline-none"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-secondary hover:text-text-primary cursor-pointer focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-profit hover:brightness-105 disabled:brightness-95 disabled:cursor-not-allowed text-white font-extrabold text-sm shadow-md shadow-profit/15 transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-4"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Create Account Form (captures name, email, password) */
            <form onSubmit={handleEmailAuthSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-secondary pointer-events-none">
                    <User className="h-4 w-4" />
                  </span>
                  <input 
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-background text-sm text-text-primary placeholder:text-text-secondary focus:border-profit focus:ring-0 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-secondary pointer-events-none">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input 
                    type="email"
                    placeholder="name@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-background text-sm text-text-primary placeholder:text-text-secondary focus:border-profit focus:ring-0 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-secondary pointer-events-none">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 pl-10 pr-10 rounded-xl border border-border bg-background text-sm text-text-primary placeholder:text-text-secondary focus:border-profit focus:ring-0 focus:outline-none"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-secondary hover:text-text-primary cursor-pointer focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Confirm Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-secondary pointer-events-none">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Verify password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-11 pl-10 pr-10 rounded-xl border border-border bg-background text-sm text-text-primary placeholder:text-text-secondary focus:border-profit focus:ring-0 focus:outline-none"
                    required={isRegisterMode}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-profit hover:brightness-105 disabled:brightness-95 disabled:cursor-not-allowed text-white font-extrabold text-sm shadow-md shadow-profit/15 transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-4"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>Create Free Account</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}


        </div>

        {/* Help footer */}
        <div className="p-4 border-t border-border/40 bg-background/50 text-[10px] text-center text-text-secondary select-none font-semibold">
          <span>Protected by Firebase Authentication services.</span>
        </div>
      </div>
    </div>
  );
}
