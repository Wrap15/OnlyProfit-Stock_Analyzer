import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PriceAlert {
  symbol: string;
  price: number;
  condition: 'above' | 'below';
  isActive: boolean;
}

interface StockState {
  watchlist: string[];
  recentSearches: string[];
  selectedStock: string | null;
  theme: 'light' | 'dark';
  alerts: PriceAlert[];
  isProUser: boolean;
  userId: string | null;
  userEmail: string | null;
  addToWatchlist: (symbol: string) => void;
  removeFromWatchlist: (symbol: string) => void;
  toggleWatchlist: (symbol: string) => void;
  addToRecentSearches: (symbol: string) => void;
  removeFromRecentSearches: (symbol: string) => void;
  clearRecentSearches: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setSelectedStock: (symbol: string | null) => void;
  addAlert: (alert: PriceAlert) => void;
  removeAlert: (symbol: string, price: number, condition: 'above' | 'below') => void;
  activatePro: () => void;
  deactivatePro: () => void;
  setUser: (userId: string | null, userEmail: string | null) => void;
}

export const useStockStore = create<StockState>()(
  persist(
    (set) => ({
      watchlist: ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS'], // default Indian stock symbols
      recentSearches: [],
      selectedStock: null,
      theme: 'light',
      alerts: [],
      isProUser: false,
      userId: null,
      userEmail: null,
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
      addToRecentSearches: (symbol) =>
        set((state) => {
          const cleanSymbol = symbol.toUpperCase();
          const filtered = state.recentSearches.filter((s) => s !== cleanSymbol);
          return {
            recentSearches: [cleanSymbol, ...filtered].slice(0, 5), // Keep last 5 unique searches
          };
        }),
      removeFromRecentSearches: (symbol) =>
        set((state) => ({
          recentSearches: state.recentSearches.filter((s) => s !== symbol.toUpperCase()),
        })),
      clearRecentSearches: () =>
        set({ recentSearches: [] }),
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
      addAlert: (alert) =>
        set((state) => ({
          alerts: [...state.alerts, alert],
        })),
      removeAlert: (symbol, price, condition) =>
        set((state) => ({
          alerts: state.alerts.filter(
            (a) => !(a.symbol === symbol && a.price === price && a.condition === condition)
          ),
        })),
      activatePro: () => set({ isProUser: true }),
      deactivatePro: () => set({ isProUser: false }),
      setUser: (userId, userEmail) => set({ userId, userEmail }),
    }),
    {
      name: 'onlyprofit-storage', // local storage key
      partialize: (state) => ({
        watchlist: state.watchlist,
        recentSearches: state.recentSearches,
        theme: state.theme,
        alerts: state.alerts,
        isProUser: state.isProUser,
        userId: state.userId,
        userEmail: state.userEmail,
      }),
    }
  )
);
