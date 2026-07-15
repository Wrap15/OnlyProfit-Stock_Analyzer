import { useState, useEffect, useMemo } from 'react';
import { 
  getSimulatorState, 
  pollLimitOrders, 
  checkAutoSquareOff,
  syncLocalDataToFirestore,
  saveCashBalance,
  resetSimulatorState,
  SimulatorState 
} from '@/lib/simulatorService';
import { apiClient } from '@/lib/apiClient';
import { parseOptionSymbol, calculateOptionPrice } from '@/lib/foUtils';

export function useSimulatorDetails(userId: string | null) {
  const [state, setState] = useState<SimulatorState>({
    cash: 0,
    holdings: [],
    positions: [],
    orders: [],
    history: []
  });
  
  const [livePrices, setLivePrices] = useState<Record<string, { price: number; change: number; pct: number }>>({});
  const [loading, setLoading] = useState(true);
  const [triggerRefresh, setTriggerRefresh] = useState(0);

  // 1. Fetch simulator database state
  useEffect(() => {
    let active = true;
    async function loadSimulatorData() {
      try {
        if (active) setLoading(true);
        if (userId) {
          await syncLocalDataToFirestore(userId);
        }
        const simState = await getSimulatorState(userId);
        if (active) {
          setState(simState);
        }
      } catch (err) {
        console.error('Failed to load simulator data', err);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadSimulatorData();
    return () => {
      active = false;
    };
  }, [userId, triggerRefresh]);

  // Compute stable dependency keys
  const holdingsSymbolsKey = state.holdings.map(h => h.symbol).sort().join(',');
  const activePositionsSymbolsKey = state.positions.filter(p => p.quantity !== 0).map(p => p.symbol).sort().join(',');
  const pendingOrdersSymbolsKey = state.orders.filter(o => o.status === 'PENDING').map(o => o.symbol).sort().join(',');

  // Fetch live prices for all active symbols in holdings, positions, and orders
  useEffect(() => {
    const allSymbols = new Set<string>();
    state.holdings.forEach(h => allSymbols.add(h.symbol));
    state.positions.forEach(p => {
      if (p.quantity !== 0) allSymbols.add(p.symbol);
    });
    state.orders.forEach(o => {
      if (o.status === 'PENDING') allSymbols.add(o.symbol);
    });

    if (allSymbols.size === 0) {
      setLivePrices({});
      return;
    }

    async function fetchLiveQuotes() {
      try {
        const underlyingsToFetch = new Set<string>();
        const optionSymbolsInUse: string[] = [];

        allSymbols.forEach(sym => {
          const parsed = parseOptionSymbol(sym);
          if (parsed) {
            underlyingsToFetch.add(parsed.underlying);
            optionSymbolsInUse.push(sym);
          } else {
            underlyingsToFetch.add(sym);
          }
        });

        if (underlyingsToFetch.size === 0) {
          setLivePrices({});
          return;
        }

        const symbolsParam = Array.from(underlyingsToFetch).join(',');
        const res = await apiClient.get(`/api/stock/quote?symbols=${encodeURIComponent(symbolsParam)}`);
        
        if (res.data && Array.isArray(res.data)) {
          const priceMap: Record<string, { price: number; change: number; pct: number }> = {};
          
          res.data.forEach((q: any) => {
            priceMap[q.symbol] = {
              price: q.regularMarketPrice,
              change: q.regularMarketChange,
              pct: q.regularMarketChangePercent
            };
            const baseSym = q.symbol.split('.')[0];
            priceMap[baseSym] = {
              price: q.regularMarketPrice,
              change: q.regularMarketChange,
              pct: q.regularMarketChangePercent
            };
          });

          optionSymbolsInUse.forEach(optSym => {
            const parsed = parseOptionSymbol(optSym);
            if (parsed) {
              const underlyingQuote = priceMap[parsed.underlying] || priceMap[parsed.underlying + '.NS'];
              if (underlyingQuote) {
                const optDetails = calculateOptionPrice(
                  underlyingQuote.price,
                  parsed.strike,
                  parsed.expiry,
                  parsed.type
                );
                priceMap[optSym] = {
                  price: optDetails.price,
                  change: optDetails.change,
                  pct: optDetails.pct
                };
              }
            }
          });

          setLivePrices(priceMap);

          const plainPrices: Record<string, number> = {};
          Object.keys(priceMap).forEach(sym => {
            plainPrices[sym] = priceMap[sym].price;
          });

          const limitTriggered = await pollLimitOrders(userId, plainPrices);
          const squareOffTriggered = await checkAutoSquareOff(userId, plainPrices);

          if (limitTriggered || squareOffTriggered) {
            setTriggerRefresh(prev => prev + 1);
          }
        }
      } catch (err) {
        console.error('Failed to poll quotes for simulator', err);
      }
    }

    fetchLiveQuotes();
    const interval = setInterval(fetchLiveQuotes, 5000);
    return () => clearInterval(interval);
  }, [holdingsSymbolsKey, activePositionsSymbolsKey, pendingOrdersSymbolsKey, userId]);

  const handleAddMoney = async () => {
    const addedAmount = 100000;
    await saveCashBalance(userId, state.cash + addedAmount);
    setTriggerRefresh(prev => prev + 1);
  };

  const handleResetSimulator = async () => {
    const ok = window.confirm('Are you sure you want to reset your paper trading simulator account? This will clear all holdings, order book history, and reset your cash balance back to ₹10,00,000.');
    if (!ok) return;
    
    setLoading(true);
    await resetSimulatorState(userId);
    setTriggerRefresh(prev => prev + 1);
    setLoading(false);
  };

  return {
    state,
    livePrices,
    loading,
    handleAddMoney,
    handleResetSimulator,
    refreshSimulatorData: () => setTriggerRefresh(prev => prev + 1),
  };
}
