'use client';

import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WifiOff } from 'lucide-react';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 20 * 1000, // 20 seconds stale time
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOffline(!window.navigator.onLine);
      
      const handleOnline = () => setIsOffline(false);
      const handleOffline = () => setIsOffline(true);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      
      {/* Global Offline Banner Indicator */}
      {isOffline && (
        <div className="fixed bottom-20 sm:bottom-6 right-6 z-50 animate-bounce">
          <div className="flex items-center gap-2.5 px-4 py-3 bg-rose-500/90 dark:bg-rose-950/90 backdrop-blur-md border border-rose-400/20 text-white rounded-2xl shadow-xl shadow-rose-500/10 text-xs font-black select-none">
            <WifiOff className="h-4.5 w-4.5 text-rose-200 shrink-0" />
            <span>Connection Lost. Live market feeds paused.</span>
          </div>
        </div>
      )}
    </QueryClientProvider>
  );
}
