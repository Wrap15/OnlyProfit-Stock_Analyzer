'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { ShieldAlert, RefreshCw, Home } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an analytics service
    console.error('Captured unhandled application crash:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-6 animate-fade-in">
      <div className="h-16 w-16 bg-rose-500/10 text-rose-500 border border-rose-500/15 rounded-3xl flex items-center justify-center shadow-lg shadow-rose-500/5">
        <ShieldAlert className="h-8 w-8" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-black text-text-primary tracking-tight">Something went wrong</h2>
        <p className="text-xs text-text-secondary leading-relaxed font-semibold">
          An unexpected error occurred during client-side execution. The session has been secured to prevent layout breaking.
        </p>
      </div>

      {error.digest && (
        <code className="block text-[10px] font-mono bg-card border border-border px-3 py-1.5 rounded-lg text-text-secondary select-all">
          Error ID: {error.digest}
        </code>
      )}

      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <button
          onClick={reset}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-profit text-white rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-profit-dark transition-colors shadow-lg shadow-profit/20 active:scale-[0.98] cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" /> Try Again
        </button>

        <Link
          href="/"
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-3 border border-border bg-card text-text-secondary hover:text-text-primary rounded-2xl font-black text-xs uppercase tracking-wider transition-colors hover:bg-background"
        >
          <Home className="h-4 w-4" /> Dashboard
        </Link>
      </div>
    </div>
  );
}
