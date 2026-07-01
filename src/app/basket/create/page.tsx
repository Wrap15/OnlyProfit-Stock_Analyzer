'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Trash, Check, AlertCircle, Sparkles, Layers, Sliders } from 'lucide-react';
import { MOCK_STOCK_INFO, cleanStockName } from '@/lib/yahooFinance';
import { useStockStore } from '@/store/useStockStore';
import StockLogo from '@/components/StockLogo';

interface SelectedStock {
  symbol: string;
  weight: number;
}

// Deterministic CAGR calculation per stock symbol
function getStockCAGR(symbol: string): number {
  const seed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return 10 + (seed % 151) / 10; // stable returns between 10.0% and 25.0%
}

export default function CreateBasketPage() {
  const router = useRouter();
  const { addToWatchlist } = useStockStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [minInvestment, setMinInvestment] = useState(5000);
  const [selectedStocks, setSelectedStocks] = useState<SelectedStock[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Get list of all stocks available
  const allStocks = useMemo(() => {
    return Object.keys(MOCK_STOCK_INFO).map(sym => ({
      symbol: sym,
      name: cleanStockName(MOCK_STOCK_INFO[sym].name)
    }));
  }, []);

  // Filter stocks for selection
  const filteredStocks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return allStocks.slice(0, 10); // Show top 10 initially
    return allStocks.filter(
      s => s.symbol.toLowerCase().includes(query) || s.name.toLowerCase().includes(query)
    );
  }, [searchQuery, allStocks]);

  // Handle stock selection toggle
  const toggleStock = useCallback((symbol: string) => {
    setSelectedStocks(prev => {
      const exists = prev.find(s => s.symbol === symbol);
      if (exists) {
        return prev.filter(s => s.symbol !== symbol);
      } else {
        // Equal distribution by default for simplicity when adding
        const newCount = prev.length + 1;
        const newWeight = parseFloat((100 / newCount).toFixed(1));
        const updated = [...prev.map(s => ({ ...s, weight: newWeight })), { symbol, weight: newWeight }];
        // Adjust final weight slightly if rounding error leaves it off from 100%
        const sum = updated.reduce((acc, s) => acc + s.weight, 0);
        if (sum !== 100 && updated.length > 0) {
          updated[updated.length - 1].weight += parseFloat((100 - sum).toFixed(1));
        }
        return updated;
      }
    });
  }, []);

  // Update weight of a constituent stock
  const updateWeight = (symbol: string, val: number) => {
    setSelectedStocks(prev => prev.map(s => s.symbol === symbol ? { ...s, weight: val } : s));
  };

  // Re-distribute weights equally
  const distributeEqually = () => {
    if (selectedStocks.length === 0) return;
    const equalWeight = parseFloat((100 / selectedStocks.length).toFixed(2));
    const updated = selectedStocks.map(s => ({ ...s, weight: equalWeight }));
    
    // Cleanup float rounding errors by giving difference to final member
    const sum = updated.reduce((acc, s) => acc + s.weight, 0);
    const diff = parseFloat((100 - sum).toFixed(2));
    if (diff !== 0 && updated.length > 0) {
      updated[updated.length - 1].weight = parseFloat((updated[updated.length - 1].weight + diff).toFixed(2));
    }
    setSelectedStocks(updated);
  };

  // Compute stats
  const totalWeight = useMemo(() => {
    return parseFloat(selectedStocks.reduce((acc, s) => acc + s.weight, 0).toFixed(2));
  }, [selectedStocks]);

  const aggregateCAGR = useMemo(() => {
    if (selectedStocks.length === 0) return 0;
    const weightedSum = selectedStocks.reduce((acc, s) => acc + getStockCAGR(s.symbol) * (s.weight / 100), 0);
    return parseFloat(weightedSum.toFixed(2));
  }, [selectedStocks]);

  // Handle Save
  const handleSave = () => {
    if (!name.trim() || !description.trim() || selectedStocks.length === 0 || totalWeight !== 100) return;

    const basketId = `custom_${Date.now()}`;
    const customBasket = {
      id: basketId,
      name: name.trim(),
      description: description.trim(),
      cagr: aggregateCAGR,
      constituents: selectedStocks,
      minInvestmentAmount: minInvestment,
      launchDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    };

    // Save basket configuration to LocalStorage
    localStorage.setItem(`basket_${basketId}`, JSON.stringify(customBasket));

    // Save custom basket IDs list to LocalStorage
    const savedCustomBasketsList = localStorage.getItem('onlyprofit_custom_baskets_list');
    const list = savedCustomBasketsList ? JSON.parse(savedCustomBasketsList) : [];
    if (!list.includes(basketId)) {
      list.push(basketId);
      localStorage.setItem('onlyprofit_custom_baskets_list', JSON.stringify(list));
    }

    // Add to main store watchlist to show in Dashboard favorites
    addToWatchlist(`basket_${basketId}`);

    // Redirect to home
    router.push('/');
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-text-primary mb-6 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="flex flex-col gap-8 md:flex-row">
        
        {/* Creator Form */}
        <div className="flex-1 space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft dark:shadow-soft-dark">
            <h2 className="text-xl font-black text-text-primary tracking-tight mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-profit" />
              Configure Custom Basket
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">Basket Name</label>
                <input
                  type="text"
                  placeholder="e.g. High Yield IT Kings"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-profit transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  placeholder="e.g. Custom thematic investment focused on software giants and technology providers."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full p-4 rounded-xl border border-border bg-background text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-profit transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">Minimum Investment (₹)</label>
                <input
                  type="number"
                  placeholder="5000"
                  value={minInvestment}
                  onChange={(e) => setMinInvestment(Number(e.target.value))}
                  className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-profit transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Select Stocks */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft dark:shadow-soft-dark">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-3">Select Constituent Stocks</h3>
            
            {/* Stock Search Input */}
            <input
              type="text"
              placeholder="Filter stocks by symbol or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 px-4 rounded-xl border border-border bg-background text-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-profit transition-colors mb-4"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {filteredStocks.map((stock) => {
                const isSelected = selectedStocks.some(s => s.symbol === stock.symbol);
                return (
                  <button
                    key={stock.symbol}
                    onClick={() => toggleStock(stock.symbol)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                      isSelected 
                        ? 'border-profit bg-profit/5 text-text-primary' 
                        : 'border-border/60 hover:bg-slate-50 dark:hover:bg-slate-800/30 text-text-secondary'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <StockLogo symbol={stock.symbol} size="xs" />
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-text-primary truncate">{stock.symbol.split('.')[0]}</div>
                        <div className="text-[10px] text-text-secondary truncate max-w-[150px]">{stock.name}</div>
                      </div>
                    </div>
                    <div className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-profit border-profit text-white' : 'border-border'
                    }`}>
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Weights & Allocation Details */}
        <div className="w-full md:w-80 space-y-6">
          
          {/* Summary Box */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft dark:shadow-soft-dark space-y-4">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-2">Aggregate Metrics</h3>
            
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-border/40 text-center">
              <span className="block text-[10px] font-black text-text-secondary uppercase tracking-widest">Aggregate CAGR</span>
              <span className="inline-block text-2xl font-black text-profit mt-1 tabular-nums">
                {aggregateCAGR.toFixed(2)}% p.a.
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-text-secondary">Constituents Selected</span>
                <span className="text-text-primary">{selectedStocks.length}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-text-secondary">Total Weight</span>
                <span className={`tabular-nums ${totalWeight === 100 ? 'text-profit font-bold' : 'text-loss font-bold'}`}>
                  {totalWeight}%
                </span>
              </div>
            </div>

            {/* Error or validation alert */}
            {selectedStocks.length > 0 && totalWeight !== 100 && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-600 dark:text-rose-400 font-semibold leading-relaxed">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  Allocation sum is {totalWeight}%. Custom weights must equal exactly 100% to save.
                </div>
              </div>
            )}

            {selectedStocks.length > 0 && (
              <button
                onClick={distributeEqually}
                className="w-full h-9 rounded-xl border border-border bg-background hover:bg-slate-50 dark:hover:bg-slate-800/30 text-xs font-bold text-text-primary flex items-center justify-center gap-1.5 transition-colors"
              >
                <Sliders className="h-3.5 w-3.5 text-profit" />
                Distribute Equally
              </button>
            )}

            <button
              onClick={handleSave}
              disabled={!name.trim() || !description.trim() || selectedStocks.length === 0 || totalWeight !== 100}
              className="w-full h-11 rounded-xl bg-profit disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-600 text-white font-extrabold text-sm transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center gap-1"
            >
              <Layers className="h-4 w-4" />
              Save Custom Basket
            </button>
          </div>

          {/* Allocation Sliders */}
          {selectedStocks.length > 0 && (
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft dark:shadow-soft-dark space-y-4 max-h-[300px] overflow-y-auto">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Configure Weights</h3>
              <div className="space-y-3">
                {selectedStocks.map((stock) => {
                  const info = MOCK_STOCK_INFO[stock.symbol] || { name: stock.symbol.split('.')[0] };
                  return (
                    <div key={stock.symbol} className="space-y-1.5 p-2 rounded-xl bg-background border border-border/40">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <StockLogo symbol={stock.symbol} size="xs" />
                          <span className="truncate text-text-primary" title={cleanStockName(info.name)}>{stock.symbol.split('.')[0]}</span>
                        </div>
                        <span className="text-text-secondary font-mono">{stock.weight}%</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={stock.weight}
                          onChange={(e) => updateWeight(stock.symbol, Number(e.target.value))}
                          className="flex-1 h-1 bg-border rounded-lg appearance-none cursor-pointer accent-profit"
                        />
                        <button
                          onClick={() => toggleStock(stock.symbol)}
                          className="text-text-secondary hover:text-loss p-1"
                          title="Remove Stock"
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
