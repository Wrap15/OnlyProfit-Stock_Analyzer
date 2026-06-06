import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StockState {
  watchlist: string[];
  selectedStock: string | null;
  theme: 'light' | 'dark';
  addToWatchlist: (symbol: string) => void;
  removeFromWatchlist: (symbol: string) => void;
  toggleWatchlist: (symbol: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setSelectedStock: (symbol: string | null) => void;
}

export const useStockStore = create<StockState>()(
  persist(
    (set) => ({
      watchlist: ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS'], // default Indian stock symbols
      selectedStock: null,
      theme: 'light',
      addToWatchlist: (symbol) =>
        set((state) => ({
          watchlist: state.watchlist.includes(symbol)
            ? state.watchlist
            : [...state.watchlist, symbol],
        })),
      removeFromWatchlist: (symbol) =>
        set((state) => ({
          watchlist: state.watchlist.filter((s) => s !== symbol),
        })),
      toggleWatchlist: (symbol) =>
        set((state) => {
          const exists = state.watchlist.includes(symbol);
          return {
            watchlist: exists
              ? state.watchlist.filter((s) => s !== symbol)
              : [...state.watchlist, symbol],
          };
        }),
      setTheme: (theme) => {
        if (typeof window !== 'undefined') {
          if (theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          localStorage.setItem('theme', theme);
        }
        set({ theme });
      },
      toggleTheme: () =>
        set((state) => {
          const nextTheme = state.theme === 'light' ? 'dark' : 'light';
          if (typeof window !== 'undefined') {
            if (nextTheme === 'dark') {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
            localStorage.setItem('theme', nextTheme);
          }
          return { theme: nextTheme };
        }),
      setSelectedStock: (symbol) => set({ selectedStock: symbol }),
    }),
    {
      name: 'onlyprofit-storage', // local storage key
      partialize: (state) => ({
        watchlist: state.watchlist,
        theme: state.theme,
      }),
    }
  )
);
