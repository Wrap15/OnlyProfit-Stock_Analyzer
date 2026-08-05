'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, Search, Download, 
  MoreVertical, ArrowUpDown, Check, Trash2, X 
} from 'lucide-react';
import StockLogo from '@/components/StockLogo';

interface HoldingItem {
  symbol: string;
  avgBuyPrice: number;
  quantity: number;
  totalInvested: number;
}

interface HistoryItem {
  symbol: string;
  side: 'BUY' | 'SELL';
  status: string;
  timestamp: string | number;
}

interface SimulatorHoldingsTabProps {
  holdings: HoldingItem[];
  livePrices: Record<string, { price: number; change: number; pct: number }>;
  history: HistoryItem[];
  isMasked: boolean;
  onOpenTradeModal?: (symbol: string, side: 'BUY' | 'SELL', livePrice: number) => void;
}

type SortFieldType = 'symbol' | 'quantity' | 'avgBuyPrice' | 'ltp' | 'invested' | 'current' | 'overallPnL' | 'dayPnL';

export default function SimulatorHoldingsTab({
  holdings,
  livePrices,
  history,
  isMasked,
  onOpenTradeModal,
}: SimulatorHoldingsTabProps) {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  
  // Sort State
  const [sortField, setSortField] = useState<SortFieldType>('symbol');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Select & Exit State (Bulk Mode)
  const [isSelectExitMode, setIsSelectExitMode] = useState(false);
  const [selectedSymbols, setSelectedSymbols] = useState<Set<string>>(new Set());

  // Download Menu state
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  // Sorting Handler
  const handleSort = (field: SortFieldType) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Excel Export utility (.xls tab-separated format)
  const handleExportExcel = () => {
    if (holdings.length === 0) return;
    
    const headers = ['Symbol', 'Quantity', 'Avg Price', 'LTP', 'Invested Amt', 'Current Value', 'Overall PnL', 'Day PnL'];
    const rows = holdings.map(h => {
      const quote = livePrices[h.symbol];
      const ltp = quote ? quote.price : h.avgBuyPrice;
      const currentVal = ltp * h.quantity;
      const overallPnL = currentVal - h.totalInvested;
      const lastBuyOrder = history.find(hist => hist.symbol === h.symbol && hist.side === 'BUY');
      const isBoughtToday = lastBuyOrder && new Date(lastBuyOrder.timestamp).toDateString() === new Date().toDateString();
      const dayPnL = isBoughtToday ? (ltp - h.avgBuyPrice) * h.quantity : (quote ? quote.change : 0) * h.quantity;
      
      return [
        h.symbol,
        h.quantity,
        h.avgBuyPrice.toFixed(2),
        ltp.toFixed(2),
        h.totalInvested.toFixed(2),
        currentVal.toFixed(2),
        overallPnL.toFixed(2),
        dayPnL.toFixed(2)
      ];
    });

    const tsvContent = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    const blob = new Blob([tsvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `onlyprofit_portfolio_${Date.now()}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Export utility (renders styled print page)
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rowsHtml = holdings.map(h => {
      const quote = livePrices[h.symbol];
      const ltp = quote ? quote.price : h.avgBuyPrice;
      const currentVal = ltp * h.quantity;
      const overallPnL = currentVal - h.totalInvested;
      const lastBuyOrder = history.find(hist => hist.symbol === h.symbol && hist.side === 'BUY');
      const isBoughtToday = lastBuyOrder && new Date(lastBuyOrder.timestamp).toDateString() === new Date().toDateString();
      const dayPnL = isBoughtToday ? (ltp - h.avgBuyPrice) * h.quantity : (quote ? quote.change : 0) * h.quantity;
      const cleanSym = h.symbol.replace('MF_', '').replace('.NS', '');

      return `
        <tr>
          <td>${cleanSym}</td>
          <td>${h.quantity}</td>
          <td>₹${h.avgBuyPrice.toFixed(2)}</td>
          <td>₹${ltp.toFixed(2)}</td>
          <td>₹${h.totalInvested.toFixed(2)}</td>
          <td>₹${currentVal.toFixed(2)}</td>
          <td class="${overallPnL >= 0 ? 'text-profit' : 'text-loss'}">
            ₹${overallPnL.toFixed(2)} (${(h.totalInvested > 0 ? (overallPnL / h.totalInvested) * 100 : 0).toFixed(2)}%)
          </td>
          <td class="${dayPnL >= 0 ? 'text-profit' : 'text-loss'}">
            ₹${dayPnL.toFixed(2)}
          </td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>OnlyProfit Portfolio Report</title>
          <style>
            body { font-family: 'Inter', sans-serif; background-color: #0b0c10; color: #fff; padding: 40px; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1f2937; padding-bottom: 20px; margin-bottom: 30px; }
            h1 { margin: 0; color: #10b981; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #1f2937; font-size: 12px; }
            th { color: #94a3b8; text-transform: uppercase; font-size: 10px; letter-spacing: 1px; }
            .text-profit { color: #10b981; font-weight: bold; }
            .text-loss { color: #ef4444; font-weight: bold; }
            .footer { margin-top: 40px; font-size: 10px; color: #94a3b8; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>OnlyProfit</h1>
              <p>Simulated Investment Portfolio Report</p>
            </div>
            <div style="text-align: right; color: #94a3b8; font-size: 12px;">
              Date: ${new Date().toLocaleDateString('en-IN')}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Qty</th>
                <th>Avg Price</th>
                <th>LTP</th>
                <th>Invested</th>
                <th>Current</th>
                <th>Overall G/L</th>
                <th>Day's G/L</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <div class="footer">
            Designed and built by DHAVAL PANCHAL in collaboration with Antigravity AI
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Selection toggle
  const toggleSymbolSelection = (symbol: string) => {
    const next = new Set(selectedSymbols);
    if (next.has(symbol)) {
      next.delete(symbol);
    } else {
      next.add(symbol);
    }
    setSelectedSymbols(next);
  };

  const toggleSelectAll = () => {
    if (selectedSymbols.size === holdings.length) {
      setSelectedSymbols(new Set());
    } else {
      setSelectedSymbols(new Set(holdings.map(h => h.symbol)));
    }
  };

  // Bulk exit
  const handleBulkExit = () => {
    if (selectedSymbols.size === 0) return;
    // Iterate over selected symbols and trigger sell modal for each
    const firstSymbol = Array.from(selectedSymbols)[0];
    const quote = livePrices[firstSymbol];
    const ltp = quote ? quote.price : 0;
    if (onOpenTradeModal) {
      onOpenTradeModal(firstSymbol, 'SELL', ltp);
    }
  };

  // Process holdings table data
  const processedHoldings = useMemo(() => {
    // 1. Filter by search query
    const filtered = holdings.filter(h => {
      const clean = h.symbol.replace('MF_', '').replace('.NS', '').toLowerCase();
      return clean.includes(searchQuery.toLowerCase());
    });

    // 2. Apply Sorting
    return filtered.sort((a, b) => {
      let valA: any = a.symbol;
      let valB: any = b.symbol;

      const quoteA = livePrices[a.symbol];
      const quoteB = livePrices[b.symbol];

      const ltpA = quoteA ? quoteA.price : a.avgBuyPrice;
      const ltpB = quoteB ? quoteB.price : b.avgBuyPrice;

      const currentValA = ltpA * a.quantity;
      const currentValB = ltpB * b.quantity;

      const overallPnLA = currentValA - a.totalInvested;
      const overallPnLB = currentValB - b.totalInvested;

      const lastBuyOrderA = history.find(hist => hist.symbol === a.symbol && hist.side === 'BUY');
      const isBoughtTodayA = lastBuyOrderA && new Date(lastBuyOrderA.timestamp).toDateString() === new Date().toDateString();
      const dayPnLA = isBoughtTodayA ? (ltpA - a.avgBuyPrice) * a.quantity : (quoteA ? quoteA.change : 0) * a.quantity;

      const lastBuyOrderB = history.find(hist => hist.symbol === b.symbol && hist.side === 'BUY');
      const isBoughtTodayB = lastBuyOrderB && new Date(lastBuyOrderB.timestamp).toDateString() === new Date().toDateString();
      const dayPnLB = isBoughtTodayB ? (ltpB - b.avgBuyPrice) * b.quantity : (quoteB ? quoteB.change : 0) * b.quantity;

      if (sortField === 'symbol') {
        valA = a.symbol;
        valB = b.symbol;
      } else if (sortField === 'quantity') {
        valA = a.quantity;
        valB = b.quantity;
      } else if (sortField === 'avgBuyPrice') {
        valA = a.avgBuyPrice;
        valB = b.avgBuyPrice;
      } else if (sortField === 'ltp') {
        valA = ltpA;
        valB = ltpB;
      } else if (sortField === 'invested') {
        valA = a.totalInvested;
        valB = b.totalInvested;
      } else if (sortField === 'current') {
        valA = currentValA;
        valB = currentValB;
      } else if (sortField === 'overallPnL') {
        valA = overallPnLA;
        valB = overallPnLB;
      } else if (sortField === 'dayPnL') {
        valA = dayPnLA;
        valB = dayPnLB;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [holdings, livePrices, history, searchQuery, sortField, sortDirection]);

  return (
    <div className="w-full bg-[#12131a]/80 border border-border/80 rounded-2xl overflow-hidden shadow-premium backdrop-blur-md">
      
      {/* Holdings Section Toolbar exactly matches the reference uploaded image */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 select-none border-b border-border/40">
        
        {/* Title + Pill Count */}
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-black text-text-primary uppercase tracking-wider">
            Holdings
          </h2>
          <span className="h-5 w-5 bg-indigo-500/10 text-indigo-400 text-[10px] font-black flex items-center justify-center rounded-full border border-indigo-500/20">
            {holdings.length}
          </span>
        </div>

        {/* Action controllers group on the right */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Enhanced search bar widget */}
          <div className="relative group/search flex items-center">
            <button 
              type="button"
              onClick={() => searchInputRef.current?.focus()}
              style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}
              className="absolute flex items-center justify-center text-text-secondary group-focus-within/search:text-indigo-400 group-hover/search:text-text-primary transition-colors focus:outline-none cursor-pointer"
              title="Click to search"
            >
              <Search className="h-3.5 w-3.5" />
            </button>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search symbol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '36px', paddingRight: '28px' }}
              className="py-2 text-[10px] font-black text-text-primary bg-background/50 hover:bg-background/85 focus:bg-background border border-border/80 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 w-full sm:w-56 transition-all placeholder:text-text-secondary/60 shadow-lg shadow-black/5"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Download/Export Dropdown button */}
          <div className="relative">
            <button 
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              className="p-2 border border-border hover:border-text-primary text-text-secondary hover:text-text-primary bg-background rounded-xl transition-all cursor-pointer flex items-center justify-center"
              title="Download portfolio statement"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
            {showDownloadMenu && (
              <div className="absolute right-0 mt-1.5 w-40 bg-card border border-border rounded-xl shadow-premium z-50 p-1 animate-slide-down">
                <button
                  onClick={() => {
                    handleExportExcel();
                    setShowDownloadMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-[10px] font-black uppercase tracking-wider text-text-secondary hover:bg-background hover:text-text-primary rounded-lg transition-all"
                >
                  Export Excel (.xls)
                </button>
                <button
                  onClick={() => {
                    handleExportPDF();
                    setShowDownloadMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-[10px] font-black uppercase tracking-wider text-text-secondary hover:bg-background hover:text-text-primary rounded-lg transition-all"
                >
                  Export PDF Report
                </button>
              </div>
            )}
          </div>

          {/* Select & Exit button toggle */}
          <button
            onClick={() => {
              setIsSelectExitMode(!isSelectExitMode);
              setSelectedSymbols(new Set());
            }}
            className={`px-3 py-1.5 border text-[9px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              isSelectExitMode
                ? 'bg-rose-500/10 border-rose-500/35 text-rose-450 hover:bg-rose-500 hover:text-white'
                : 'border-border text-text-secondary hover:text-text-primary hover:border-text-primary'
            }`}
          >
            {isSelectExitMode ? 'Cancel Selection' : 'Select & Exit'}
          </button>

          {/* More options ellipsis button */}
          <button className="p-2 border border-transparent hover:border-border text-text-secondary hover:text-text-primary rounded-xl transition-all cursor-pointer">
            <MoreVertical className="h-3.5 w-3.5" />
          </button>

        </div>
      </div>

      {/* Select Exit Action bar if active */}
      {isSelectExitMode && (
        <div className="flex items-center justify-between p-3 bg-rose-500/5 border-b border-rose-500/20 text-[10px] font-black uppercase tracking-wider select-none animate-slide-down text-rose-450 px-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary"
            >
              <span className="border border-border h-3.5 w-3.5 rounded flex items-center justify-center bg-background">
                {selectedSymbols.size === holdings.length && <Check className="h-2.5 w-2.5 text-profit" />}
              </span>
              <span>Select All</span>
            </button>
            <span>•</span>
            <span className="text-text-primary">{selectedSymbols.size} Holdings Selected</span>
          </div>

          <button
            onClick={handleBulkExit}
            disabled={selectedSymbols.size === 0}
            className="flex items-center gap-1 px-3 py-1.5 bg-rose-500 text-white rounded-lg active:scale-95 disabled:opacity-50 transition-all font-black text-[9px] tracking-widest uppercase cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Square Off Exit ({selectedSymbols.size})</span>
          </button>
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-border/40 text-[9px] font-black text-text-secondary uppercase tracking-widest bg-card/10 select-none">
              {isSelectExitMode && <th className="p-4 w-12 text-center" />}
              <th className="p-4 cursor-pointer hover:text-text-primary transition-colors" onClick={() => handleSort('symbol')}>
                <div className="flex items-center gap-1">
                  <span>Name</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="p-4 text-right cursor-pointer hover:text-text-primary transition-colors" onClick={() => handleSort('quantity')}>
                <div className="flex items-center justify-end gap-1">
                  <span>Quantity</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="p-4 text-right cursor-pointer hover:text-text-primary transition-colors" onClick={() => handleSort('avgBuyPrice')}>
                <div className="flex items-center justify-end gap-1">
                  <span>Avg. Price</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="p-4 text-right cursor-pointer hover:text-text-primary transition-colors" onClick={() => handleSort('ltp')}>
                <div className="flex items-center justify-end gap-1">
                  <span>LTP</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="p-4 text-right cursor-pointer hover:text-text-primary transition-colors" onClick={() => handleSort('invested')}>
                <div className="flex items-center justify-end gap-1">
                  <span>Inv. Amt.</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="p-4 text-right cursor-pointer hover:text-text-primary transition-colors" onClick={() => handleSort('current')}>
                <div className="flex items-center justify-end gap-1">
                  <span>Current Val.</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="p-4 text-right cursor-pointer hover:text-text-primary transition-colors" onClick={() => handleSort('overallPnL')}>
                <div className="flex items-center justify-end gap-1">
                  <span>Overall G/L</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="p-4 text-right cursor-pointer hover:text-text-primary transition-colors" onClick={() => handleSort('dayPnL')}>
                <div className="flex items-center justify-end gap-1">
                  <span>Day&apos;s G/L</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              {!isSelectExitMode && <th className="p-4 text-right w-20" />}
            </tr>
          </thead>
          <tbody>
            {processedHoldings.length > 0 ? (
              processedHoldings.map((h) => {
                const quote = livePrices[h.symbol];
                const ltp = quote ? quote.price : h.avgBuyPrice;
                const pct = quote ? quote.pct : 0;
                
                const currentValue = ltp * h.quantity;
                const pnl = currentValue - h.totalInvested;
                const pnlPct = h.totalInvested > 0 ? (pnl / h.totalInvested) * 100 : 0;
                const isPnLPositive = pnl >= 0;

                const lastBuyOrder = history.find(
                  (hist) => hist.symbol === h.symbol && hist.side === 'BUY' && hist.status === 'EXECUTED'
                );
                const isBoughtToday = lastBuyOrder && new Date(lastBuyOrder.timestamp).toDateString() === new Date().toDateString();

                const holdingDayPnL = isBoughtToday 
                  ? (ltp - h.avgBuyPrice) * h.quantity 
                  : (quote ? quote.change : 0) * h.quantity;
                const holdingDayPnLPct = isBoughtToday
                  ? (h.avgBuyPrice > 0 ? ((ltp - h.avgBuyPrice) / h.avgBuyPrice) * 100 : 0)
                  : pct;
                const isHoldingDayPnLPositive = holdingDayPnL >= 0;
                const isSelected = selectedSymbols.has(h.symbol);

                const cleanSym = h.symbol.replace('MF_', '').replace('.NS', '');
                const isMF = h.symbol.startsWith('MF_') || !isNaN(Number(h.symbol));

                return (
                  <tr 
                    key={h.symbol} 
                    className={`border-b border-border/40 hover:bg-card-hover/20 text-xs font-bold transition-all ${
                      isSelected ? 'bg-indigo-500/5' : ''
                    }`}
                  >
                    {/* Checkbox column if select exit mode is toggled */}
                    {isSelectExitMode && (
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => toggleSymbolSelection(h.symbol)}
                          className="border border-border h-4 w-4 rounded flex items-center justify-center bg-background mx-auto"
                        >
                          {isSelected && <Check className="h-3 w-3 text-indigo-400" />}
                        </button>
                      </td>
                    )}

                    {/* Company Name */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <StockLogo symbol={h.symbol} size="xs" />
                        <div className="flex flex-col min-w-0">
                          <span className="font-extrabold text-text-primary text-[11px] truncate uppercase">
                            {cleanSym}
                          </span>
                          {isMF && (
                            <span className="text-[7px] font-black uppercase text-indigo-400 tracking-wider">
                              Mutual Fund
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Quantity */}
                    <td className="p-4 text-right font-mono text-[11px] font-semibold text-text-primary tabular-nums">
                      {h.quantity}
                    </td>

                    {/* Average Purchase Price */}
                    <td className="p-4 text-right font-mono text-[11px] text-text-secondary tabular-nums">
                      {h.avgBuyPrice.toFixed(2)}
                    </td>

                    {/* LTP */}
                    <td className="p-4 text-right font-mono text-[11px] text-text-primary tabular-nums">
                      {ltp.toFixed(2)}
                    </td>

                    {/* Invested Amount */}
                    <td className="p-4 text-right font-mono text-[11px] text-text-secondary tabular-nums">
                      {h.totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Current Value */}
                    <td className="p-4 text-right font-mono text-[11px] text-text-primary font-extrabold tabular-nums">
                      {isMasked ? '•••••' : currentValue.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </td>

                    {/* Overall Profit & Loss Gain */}
                    <td className="p-4 text-right tabular-nums">
                      <div className={`font-mono text-[11px] font-black ${isPnLPositive ? 'text-profit' : 'text-loss'}`}>
                        {isMasked ? '•••••' : `${pnl >= 0 ? '' : '-'}${Math.abs(pnl).toFixed(2)}`}
                      </div>
                      <div className={`text-[9px] font-black mt-0.5 ${isPnLPositive ? 'text-profit' : 'text-loss'}`}>
                        {isPnLPositive ? '+' : ''}{pnlPct.toFixed(2)}%
                      </div>
                    </td>

                    {/* Day Profit & Loss Gain */}
                    <td className="p-4 text-right tabular-nums">
                      <div className={`font-mono text-[11px] font-black ${isHoldingDayPnLPositive ? 'text-profit' : 'text-loss'}`}>
                        {isMasked ? '•••••' : `${holdingDayPnL >= 0 ? '' : '-'}${Math.abs(holdingDayPnL).toFixed(2)}`}
                      </div>
                      <div className={`text-[9px] font-black mt-0.5 ${isHoldingDayPnLPositive ? 'text-profit' : 'text-loss'}`}>
                        {isHoldingDayPnLPositive ? '+' : ''}{holdingDayPnLPct.toFixed(2)}%
                      </div>
                    </td>

                    {/* Actions button */}
                    {!isSelectExitMode && (
                      <td className="p-4 text-right">
                        {isMF ? (
                          <Link
                            href={`/mutualfund/${cleanSym}`}
                            className="inline-flex items-center px-2 py-1 border border-border hover:border-indigo-500 bg-background text-[9px] font-black text-text-secondary hover:text-indigo-400 rounded-lg uppercase tracking-wider transition-all"
                          >
                            View
                          </Link>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => onOpenTradeModal ? onOpenTradeModal(h.symbol, 'BUY', ltp) : null}
                              className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/20 rounded-md text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                            >
                              Buy
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenTradeModal ? onOpenTradeModal(h.symbol, 'SELL', ltp) : null}
                              className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500 text-rose-450 hover:text-white border border-rose-500/20 rounded-md text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                            >
                              Sell
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={isSelectExitMode ? 10 : 9} className="p-12 text-center text-xs text-text-secondary font-bold">
                  <div className="flex flex-col items-center justify-center gap-3 py-6">
                    <TrendingUp className="h-8 w-8 text-text-secondary/25 animate-pulse" />
                    <div className="space-y-0.5">
                      <div>No CNC Holdings found matching filters.</div>
                      <div className="text-[9px] font-semibold text-text-secondary/70">Place a delivery order to build your virtual portfolio.</div>
                    </div>
                    <Link 
                      href="/?tab=explore"
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black rounded-xl text-[9px] font-black uppercase tracking-wider transition-all mt-2"
                    >
                      Explore Stocks
                    </Link>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="block sm:hidden space-y-3 p-4 bg-background/10">
        {processedHoldings.length > 0 ? (
          processedHoldings.map((h) => {
            const quote = livePrices[h.symbol];
            const ltp = quote ? quote.price : h.avgBuyPrice;
            const pct = quote ? quote.pct : 0;
            const isStockPositive = pct >= 0;
            const currentValue = ltp * h.quantity;
            const pnl = currentValue - h.totalInvested;
            const pnlPct = h.totalInvested > 0 ? (pnl / h.totalInvested) * 100 : 0;
            const isPnLPositive = pnl >= 0;

            const lastBuyOrder = history.find(
              (hist) => hist.symbol === h.symbol && hist.side === 'BUY' && hist.status === 'EXECUTED'
            );
            const isBoughtToday = lastBuyOrder && new Date(lastBuyOrder.timestamp).toDateString() === new Date().toDateString();

            const holdingDayPnL = isBoughtToday 
              ? (ltp - h.avgBuyPrice) * h.quantity 
              : (quote ? quote.change : 0) * h.quantity;
            const holdingDayPnLPct = isBoughtToday
              ? (h.avgBuyPrice > 0 ? ((ltp - h.avgBuyPrice) / h.avgBuyPrice) * 100 : 0)
              : pct;
            const isHoldingDayPnLPositive = holdingDayPnL >= 0;
            const isSelected = selectedSymbols.has(h.symbol);
            const cleanSym = h.symbol.replace('MF_', '').replace('.NS', '');

            return (
              <div 
                key={h.symbol} 
                onClick={() => isSelectExitMode && toggleSymbolSelection(h.symbol)}
                className={`p-4 rounded-xl border border-border/80 bg-[#161720]/80 flex flex-col gap-3 shadow-soft relative overflow-hidden transition-all ${
                  isSelected ? 'border-indigo-500/50 bg-indigo-500/5' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    {isSelectExitMode && (
                      <span className="border border-border h-3.5 w-3.5 rounded flex items-center justify-center bg-background shrink-0">
                        {isSelected && <Check className="h-2.5 w-2.5 text-indigo-400" />}
                      </span>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center">
                        <span className="font-black text-text-primary text-sm uppercase tracking-tight">{cleanSym}</span>
                      </div>
                      <div className="text-[9px] text-text-secondary font-bold mt-0.5">
                        {h.quantity} Shares • Avg: ₹{h.avgBuyPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-xs font-mono font-black text-text-primary">₹{ltp.toFixed(2)}</span>
                    <span className={`text-[8px] font-black mt-0.5 ${isStockPositive ? 'text-profit' : 'text-loss'}`}>
                      {isStockPositive ? '▲ +' : '▼ '}{pct.toFixed(2)}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40 text-[9px] font-bold">
                  <div>
                    <span className="text-text-secondary uppercase text-[8px]">Inv. Amt.</span>
                    <div className="font-mono text-text-primary mt-0.5">₹{h.totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                  </div>
                  <div>
                    <span className="text-text-secondary uppercase text-[8px]">Current Val.</span>
                    <div className="font-mono text-text-primary mt-0.5">{isMasked ? '•••••' : `₹${currentValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40 text-[9px] font-bold">
                  <div>
                    <span className="text-text-secondary uppercase text-[8px]">Overall G/L</span>
                    <div className={`font-mono font-black mt-0.5 ${isPnLPositive ? 'text-profit' : 'text-loss'}`}>
                      {isMasked ? '•••••' : `${isPnLPositive ? '+' : '-'}${Math.abs(pnl).toFixed(2)}`} ({pnlPct.toFixed(2)}%)
                    </div>
                  </div>
                  <div>
                    <span className="text-text-secondary uppercase text-[8px]">Day&apos;s G/L</span>
                    <div className={`font-mono font-black mt-0.5 ${isHoldingDayPnLPositive ? 'text-profit' : 'text-loss'}`}>
                      {isMasked ? '•••••' : `${isHoldingDayPnLPositive ? '+' : '-'}${Math.abs(holdingDayPnL).toFixed(2)}`} ({holdingDayPnLPct.toFixed(2)}%)
                    </div>
                  </div>
                </div>

                {!isSelectExitMode && (
                  <div className="flex items-center justify-end gap-1.5 pt-2.5 border-t border-border/40">
                    {h.symbol.startsWith('MF_') || !isNaN(Number(h.symbol)) ? (
                      <Link
                        href={`/mutualfund/${cleanSym}`}
                        className="px-2.5 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg text-[8px] font-black uppercase tracking-wider"
                      >
                        View Fund
                      </Link>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenTradeModal?.(h.symbol, 'BUY', ltp);
                          }}
                          className="px-3 py-1.5 bg-emerald-500 text-black rounded-lg text-[8px] font-black uppercase tracking-wider cursor-pointer"
                        >
                          Buy
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenTradeModal?.(h.symbol, 'SELL', ltp);
                          }}
                          className="px-3 py-1.5 bg-rose-500 text-white rounded-lg text-[8px] font-black uppercase tracking-wider cursor-pointer"
                        >
                          Sell
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 bg-[#161720]/80 rounded-2xl border border-border p-4">
            <TrendingUp className="h-6 w-6 text-text-secondary/20 mx-auto mb-2 animate-pulse" />
            <span className="text-[9px] text-text-secondary font-bold block">No delivery holdings found.</span>
            <Link 
              href="/?tab=explore"
              className="mt-3 inline-block px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-black rounded-xl text-[8px] font-black uppercase tracking-wider"
            >
              Explore Stocks
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}
