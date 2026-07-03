'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, ShieldAlert, CheckCircle, Mail, Lock, Shield, ArrowRight, RefreshCw, KeyRound, Eye, EyeOff, User } from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile
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

  const handleSyncUserProStatus = async (user: any, customName?: string) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      let isPro = false;
      let displayName = customName || user.displayName || '';
      
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
      
      // Sync Zustand store
      setUser(user.uid, user.email, displayName);
      if (isPro) {
        activatePro();
      }
    } catch (err) {
      console.error('Error syncing user pro status with Firestore', err);
    }
  };

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
      await sendPasswordResetEmail(auth, emailClean);
      setSuccessMsg('Reset password link has been sent to your email.');
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

  const handleGoogleAuth = async () => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    
    try {
      const userCred = await signInWithPopup(auth, googleProvider);
      setSuccessMsg('Google Authenticated successfully!');
      await handleSyncUserProStatus(userCred.user);
      
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Google Sign In Error', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Popup was closed before completing authentication.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Google authentication is not enabled in your Firebase Console. Go to Authentication > Sign-in method to enable it.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Google popup was blocked by the browser. Please allow popups and try again.');
      } else {
        setError(`Google login error: ${err.message || 'Please check your configuration.'}`);
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
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 flex gap-2.5 items-start text-xs text-rose-600 dark:text-rose-400 animate-fade-in font-semibold">
              <ShieldAlert className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex gap-2.5 items-start text-xs text-emerald-600 dark:text-emerald-400 animate-fade-in font-semibold">
              <CheckCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
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

          {/* Social Divider */}
          {!isResetMode && (
            <>
              <div className="relative flex py-2 items-center text-[10px] font-black uppercase text-text-secondary tracking-widest select-none">
                <div className="flex-grow border-t border-border/40"></div>
                <span className="flex-shrink mx-3">or continue with</span>
                <div className="flex-grow border-t border-border/40"></div>
              </div>

              {/* Google Sign-in */}
              <button
                type="button"
                disabled={loading}
                onClick={handleGoogleAuth}
                className="w-full h-11 rounded-xl border border-border hover:bg-slate-50 dark:hover:bg-slate-800 text-text-primary font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-soft dark:shadow-none"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin text-text-secondary" />
                ) : (
                  <>
                    <svg className="h-4 w-4 mr-0.5 shrink-0" viewBox="0 0 24 24" width="100%" height="100%">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Authenticate with Google</span>
                  </>
                )}
              </button>
            </>
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
