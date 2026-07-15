'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Lock, Cpu, Sparkles, Clock, Zap, ChevronRight, 
  Activity, Shield, MessageSquare, Send, Bot, RefreshCw, User 
} from 'lucide-react';
import { useStockStore } from '@/store/useStockStore';
import StockLogo from './StockLogo';
import MiniSparkline from './MiniSparkline';
import FirebaseAuthModal from './FirebaseAuthModal';
import { MUTUAL_FUNDS } from '@/lib/mutualfunds';
import { isIndianMarketOpen } from '@/lib/marketHours';

interface SignalItem {
  symbol: string;
  name: string;
  indicator: string;
  signal: 'BUY' | 'STRONG_BUY' | 'SELL' | 'STRONG_SELL';
  confidence: number;
  defaultPrice: number;
  targetPrice: number;
  stopLoss: number;
  riskReward: string;
  time: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function renderMarkdown(text: string): React.ReactNode {
  if (!text) return null;
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  
  let inTable = false;
  let tableHeaders: string[] = [];
  let tableRows: string[][] = [];
  
  const parseInline = (lineText: string): React.ReactNode[] => {
    const parts = lineText.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, idx) => {
      if (idx % 2 === 1) {
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={idx} className="px-1.5 py-0.5 rounded bg-background border border-border font-mono text-[10px] font-black text-profit">{part.slice(1, -1)}</code>;
        }
        return <strong key={idx} className="font-extrabold text-text-primary">{part}</strong>;
      }
      const codeParts = part.split(/`([^`]+)`/g);
      if (codeParts.length > 1) {
        return codeParts.map((subPart, subIdx) => {
          if (subIdx % 2 === 1) {
            return <code key={subIdx} className="px-1.5 py-0.5 rounded bg-background border border-border font-mono text-[10px] font-black text-profit">{subPart}</code>;
          }
          return subPart;
        });
      }
      return part;
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('|')) {
      const cells = line.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      if (line.includes('---')) {
        continue;
      }
      if (!inTable) {
        inTable = true;
        tableHeaders = cells;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      inTable = false;
      const headers = [...tableHeaders];
      const rows = [...tableRows];
      elements.push(
        <div key={`table-${i}`} className="overflow-x-auto my-2 rounded-xl border border-border/80 bg-background/50">
          <table className="min-w-full divide-y divide-border/60 text-[10px] text-left">
            <thead className="bg-card select-none">
              <tr>
                {headers.map((h, idx) => (
                  <th key={idx} className="px-3 py-1.5 font-black text-text-secondary uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20 font-medium text-text-primary">
              {rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-card/30">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3 py-1.5 font-mono">{parseInline(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      tableHeaders = [];
    }

    if (line.startsWith('###')) {
      elements.push(<h4 key={i} className="text-[11px] font-black text-text-primary uppercase tracking-wider mt-3 mb-1 flex items-center gap-1">{parseInline(line.replace('###', '').trim())}</h4>);
    } else if (line.startsWith('##')) {
      elements.push(<h3 key={i} className="text-xs font-black text-text-primary mt-3 mb-1.5 flex items-center gap-1">{parseInline(line.replace('##', '').trim())}</h3>);
    } else if (line.startsWith('#')) {
      elements.push(<h2 key={i} className="text-sm font-black text-text-primary mt-3 mb-1.5 flex items-center gap-1">{parseInline(line.replace('#', '').trim())}</h2>);
    } else if (line.startsWith('-') || line.startsWith('*')) {
      elements.push(<div key={i} className="flex gap-1.5 pl-1.5 text-text-secondary text-[11px]"><span className="text-profit font-black">•</span><div className="flex-1">{parseInline(line.substring(1).trim())}</div></div>);
    } else if (/^\d+\./.test(line)) {
      const match = line.match(/^(\d+)\.(.*)/);
      if (match) {
        elements.push(<div key={i} className="flex gap-1.5 pl-1.5 text-text-secondary text-[11px]"><span className="text-profit font-black">{match[1]}.</span><div className="flex-1">{parseInline(match[2].trim())}</div></div>);
      }
    } else if (line) {
      elements.push(<p key={i} className="text-[11px] leading-relaxed text-text-secondary font-medium" style={{ margin: '4px 0' }}>{parseInline(line)}</p>);
    }
  }

  if (inTable && tableHeaders.length > 0) {
    const headers = [...tableHeaders];
    const rows = [...tableRows];
    elements.push(
      <div key="table-trail" className="overflow-x-auto my-2 rounded-xl border border-border/80 bg-background/50">
        <table className="min-w-full divide-y divide-border/60 text-[10px] text-left">
          <thead className="bg-card select-none">
            <tr>
              {headers.map((h, idx) => (
                <th key={idx} className="px-3 py-1.5 font-black text-text-secondary uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20 font-medium text-text-primary">
            {rows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-card/30">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-3 py-1.5 font-mono">{parseInline(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return <div className="space-y-1.5">{elements}</div>;
}

const ALL_SIGNALS_POOL: SignalItem[] = [
  {
    symbol: 'RELIANCE.NS',
    name: 'Reliance Industries',
    indicator: 'MACD Bullish Crossover',
    signal: 'STRONG_BUY',
    confidence: 94,
    defaultPrice: 2950.45,
    targetPrice: 3180.00,
    stopLoss: 2840.00,
    riskReward: '1:2.1',
    time: '9:15 AM'
  },
  {
    symbol: '122639',
    name: 'Parag Parikh Flexi Cap Fund',
    indicator: 'NAV Breakout (50 EMA)',
    signal: 'STRONG_BUY',
    confidence: 92,
    defaultPrice: 88.54,
    targetPrice: 94.20,
    stopLoss: 86.10,
    riskReward: '1:2.3',
    time: '9:18 AM'
  },
  {
    symbol: 'TCS.NS',
    name: 'Tata Consultancy Services',
    indicator: 'RSI Oversold Breakout',
    signal: 'BUY',
    confidence: 87,
    defaultPrice: 4120.20,
    targetPrice: 4420.00,
    stopLoss: 3980.00,
    riskReward: '1:2.3',
    time: '9:25 AM'
  },
  {
    symbol: '118778',
    name: 'Nippon India Small Cap Fund',
    indicator: 'Volume Breakout Trigger',
    signal: 'BUY',
    confidence: 85,
    defaultPrice: 192.24,
    targetPrice: 215.00,
    stopLoss: 184.00,
    riskReward: '1:2.5',
    time: '9:30 AM'
  },
  {
    symbol: 'HDFCBANK.NS',
    name: 'HDFC Bank Limited',
    indicator: 'Golden Cross (50/200 SMA)',
    signal: 'STRONG_BUY',
    confidence: 91,
    defaultPrice: 1620.10,
    targetPrice: 1790.00,
    stopLoss: 1540.00,
    riskReward: '1:2.4',
    time: '9:45 AM'
  },
  {
    symbol: '120334',
    name: 'ICICI Pru Multi Asset Fund',
    indicator: 'Asset Allocation Rebalance',
    signal: 'SELL',
    confidence: 81,
    defaultPrice: 869.37,
    targetPrice: 820.00,
    stopLoss: 890.00,
    riskReward: '1:1.8',
    time: '9:50 AM'
  }
];

export default function AISignalsWidget() {
  const router = useRouter();
  const { userId } = useStockStore();
  
  const [activeTab, setActiveTab] = useState<'scanner' | 'copilot'>('scanner');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [signals, setSignals] = useState<SignalItem[]>([]);
  const [quotes, setQuotes] = useState<Record<string, { price: number; changePercent: number }>>({});

  // Chatbot State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Hello! I am your **OnlyProfit AI Copilot**.

I can scan breakouts, calculate targets, or inspect live market indices. Try asking me:
- *"Analyze Reliance Industries"*
- *"What are the top buy signals today?"*
- *"Should I buy HDFC bank?"*`
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Sync signals list
  useEffect(() => {
    setSignals(ALL_SIGNALS_POOL);
  }, []);

  // Fetch Live Quotes for component stocks
  useEffect(() => {
    if (signals.length === 0) return;
    const stockSymbols = signals.filter(s => s.symbol.includes('.NS')).map(s => s.symbol);
    
    const fetchQuotes = async () => {
      try {
        const res = await fetch(`/api/stock/quote?symbols=${stockSymbols.join(',')}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          const mapped: Record<string, { price: number; changePercent: number }> = {};
          data.forEach((item: any) => {
            mapped[item.symbol] = {
              price: item.regularMarketPrice || 0,
              changePercent: item.regularMarketChangePercent || 0
            };
          });
          setQuotes(mapped);
        }
      } catch (err) {
        console.error('Failed to fetch AI widget stock quotes', err);
      }
    };

    fetchQuotes();
    const interval = setInterval(() => {
      if (isIndianMarketOpen()) {
        fetchQuotes();
      }
    }, 24000);
    return () => clearInterval(interval);
  }, [signals]);

  const getStockQuote = useCallback((symbol: string, defaultPrice: number) => {
    if (quotes[symbol]) return quotes[symbol];
    return { price: defaultPrice, changePercent: 0.0 };
  }, [quotes]);

  const getMutualFundNAV = useCallback((code: string) => {
    const fund = MUTUAL_FUNDS.find(f => f.code === code);
    if (!fund) return { price: 100, changePercent: 0 };
    const seed = parseInt(code) || 100;
    const variation = Math.sin(seed) * 0.3;
    const price = fund.baseNav * (1 + variation / 100);
    return { price, changePercent: variation };
  }, []);

  const getSignalBadge = (signal: SignalItem['signal']) => {
    switch (signal) {
      case 'STRONG_BUY':
        return 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400';
      case 'BUY':
        return 'bg-teal-500/10 border-teal-500/25 text-teal-600 dark:text-teal-400';
      case 'STRONG_SELL':
        return 'bg-rose-500/10 border-rose-500/25 text-rose-600 dark:text-rose-400';
      case 'SELL':
        return 'bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400';
    }
  };

  const getSignalColorClass = (signal: SignalItem['signal']) => {
    if (signal.includes('BUY')) return 'bg-emerald-500';
    if (signal === 'SELL') return 'bg-amber-500';
    return 'bg-rose-500';
  };

  // Scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, chatLoading]);

  // Send message to AI endpoint
  const handleSendMessage = async (textToSend?: string) => {
    const messageText = textToSend || inputVal;
    if (!messageText.trim()) return;

    if (!textToSend) setInputVal('');

    const newUserMessage: ChatMessage = { role: 'user', content: messageText };
    setChatHistory(prev => [...prev, newUserMessage]);
    setChatLoading(true);

    try {
      const updatedMessages = [...chatHistory, newUserMessage];
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      });
      const data = await res.json();
      if (data && data.content) {
        setChatHistory(prev => [...prev, { role: 'assistant', content: data.content }]);
      } else {
        throw new Error('Invalid chat response payload');
      }
    } catch (err) {
      console.error('Chat compilation error', err);
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'Connection timed out. Please try sending your query again.' }]);
    } finally {
      setChatLoading(false);
    }
  };


  return (
    <div className="space-y-4">
      
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
            <Cpu className="h-4.5 w-4.5" />
          </span>
          <h2 className="text-xl font-black text-text-primary tracking-tight flex items-center gap-2">
            AI Scanners & Chat Copilot
            <span className="inline-flex items-center gap-0.5 text-[9px] font-black bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 px-2 py-0.5 rounded-md border border-amber-400/20 shadow-sm shadow-amber-500/10 uppercase select-none">
              <Zap className="h-2.5 w-2.5 fill-current" />
              Pro
            </span>
          </h2>
        </div>

        {/* Tab Selector Strip */}
        <div className="flex p-0.5 rounded-xl bg-card border border-border">
          <button
            onClick={() => setActiveTab('scanner')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'scanner'
                ? 'bg-background text-profit border border-border shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Signal Scanner
          </button>
          <button
            onClick={() => setActiveTab('copilot')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'copilot'
                ? 'bg-background text-profit border border-border shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            AI Copilot Chat
          </button>
        </div>
      </div>

      {/* Signals Body Workspace */}
      <div className="relative rounded-3xl border border-border bg-card overflow-hidden shadow-soft dark:shadow-soft-dark min-h-[380px] flex flex-col">
        
        {/* TAB 1: RADAR SIGNAL SCANNER */}
        {activeTab === 'scanner' && (
          <div className="flex flex-col flex-grow">
            {/* Desktop Grid Columns Header (Hidden on Mobile) */}
            <div className={`hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-border/40 bg-slate-50/40 dark:bg-slate-800/15 text-[10px] font-bold uppercase tracking-wider text-text-secondary select-none ${
              !userId ? 'blur-[1.5px] pointer-events-none' : ''
            }`}>
              <div className="col-span-3">Asset</div>
              <div className="col-span-3">Technical Breakout Indicator</div>
              <div className="col-span-2">Simulated Live Price</div>
              <div className="col-span-2 text-center">AI Signal & Confidence</div>
              <div className="col-span-1.5 text-right pl-2">R:R Ratio</div>
              <div className="col-span-0.5"></div>
            </div>

            {/* Signals List Layout */}
            <div className={`flex-1 flex flex-col gap-3 p-4 md:p-0 md:gap-0 md:divide-y md:divide-border/30 transition-all duration-300 ${
              !userId ? 'blur-sm select-none pointer-events-none' : ''
            }`}>
              {signals.map((item) => {
                const isMf = /^\d+$/.test(item.symbol);
                const quote = isMf 
                  ? getMutualFundNAV(item.symbol)
                  : getStockQuote(item.symbol, item.defaultPrice);
                
                const price = quote.price || item.defaultPrice;
                const changePercent = quote.changePercent;
                const isPositive = changePercent >= 0;

                return (
                  <div 
                    key={item.symbol} 
                    className="flex flex-col gap-3.5 p-4 rounded-2xl border border-border/60 bg-background/25 md:grid md:grid-cols-12 md:gap-4 md:px-6 md:py-4 md:items-center md:rounded-none md:border-none md:bg-transparent hover:bg-card-hover/5 transition-colors duration-150"
                  >
                    {/* Asset details */}
                    <div className="col-span-3 flex items-center gap-3">
                      <StockLogo symbol={item.symbol} size="sm" />
                      <div className="min-w-0">
                        <span className="font-black text-xs text-text-primary block truncate">{item.name}</span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[9px] font-extrabold text-text-secondary uppercase">{item.symbol.replace('.NS', '')}</span>
                          <span className="text-[8px] font-black bg-background border border-border/80 text-text-secondary px-1 py-0.2 rounded uppercase select-none">
                            {isMf ? 'Direct MF' : 'CNC'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Indicator Breakout */}
                    <div className="col-span-3 flex items-center gap-1.5 text-xs text-text-primary font-bold">
                      <Activity className="h-3.5 w-3.5 text-profit shrink-0" />
                      <span className="truncate">{item.indicator}</span>
                    </div>

                    {/* Price Ticker */}
                    <div className="col-span-2">
                      <span className="text-sm font-black text-text-primary block tabular-nums">
                        ₹{price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                      <span className={`text-[10px] font-black flex items-center gap-0.5 mt-0.5 tabular-nums ${isPositive ? 'text-profit' : 'text-loss'}`}>
                        <span>{isPositive ? '▲' : '▼'}</span>
                        <span>{changePercent !== 0 ? `${isPositive ? '+' : ''}${changePercent.toFixed(2)}%` : '0.00%'}</span>
                      </span>
                    </div>

                    {/* Signal Badge & Confidence */}
                    <div className="col-span-2 flex flex-col md:items-center gap-1.5">
                      <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg border tracking-wider uppercase inline-flex items-center gap-1.5 ${getSignalBadge(item.signal)}`}>
                        <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${
                          item.signal.includes('BUY') ? 'bg-emerald-500' : 'bg-rose-500'
                        }`} />
                        {item.signal.replace('_', ' ')}
                      </span>
                      <div className="flex items-center gap-1.5 text-[9px] text-text-secondary font-black select-none">
                        <span>{item.confidence}% Conf</span>
                        <div className="w-12 bg-slate-100 dark:bg-slate-800/80 h-1 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${getSignalColorClass(item.signal)}`} style={{ width: `${item.confidence}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* R:R target Slabs */}
                    <div className="col-span-1.5 text-right pl-2 hidden md:block">
                      <span className="text-xs font-black text-text-primary font-mono block">{item.riskReward}</span>
                      <span className="text-[9px] text-text-secondary font-medium">Tgt: ₹{item.targetPrice.toFixed(0)}</span>
                    </div>

                    {/* Explore route */}
                    <div className="col-span-0.5 text-right hidden md:block">
                      <button 
                        onClick={() => router.push(isMf ? `/mutualfund/${item.symbol}` : `/stock/${item.symbol}`)}
                        className="p-1 rounded-lg hover:bg-background border border-transparent hover:border-border text-text-secondary hover:text-text-primary transition-all cursor-pointer"
                        title="Analyze details sheet"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: INTERACTIVE AI COPILOT CHAT */}
        {activeTab === 'copilot' && (
          <div className="flex flex-col flex-grow h-[450px]">
            {/* Scrollable messages container */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 scrollbar-none">
              {chatHistory.map((msg, idx) => (
                <div 
                  key={idx}
                  className={`flex gap-3 max-w-[85%] ${
                    msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  }`}
                >
                  <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border select-none ${
                    msg.role === 'user'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                  }`}>
                    {msg.role === 'user' ? <User className="h-4.5 w-4.5" /> : <Bot className="h-4.5 w-4.5" />}
                  </div>

                  <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed space-y-2 w-full ${
                    msg.role === 'user'
                      ? 'bg-emerald-500/5 border-emerald-500/15 text-text-primary rounded-tr-none'
                      : 'bg-background border-border/80 text-text-primary rounded-tl-none markdown-container'
                  }`}>
                    {renderMarkdown(msg.content)}
                  </div>
                </div>
              ))}

              {/* Bot typing state indicator */}
              {chatLoading && (
                <div className="flex gap-3 mr-auto items-center max-w-[80%]">
                  <div className="h-8 w-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 animate-pulse">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  </div>
                  <span className="text-[10px] text-text-secondary font-black animate-pulse">OnlyProfit Agent scanning markets...</span>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* suggestion quick pills */}
            <div className="px-4 py-2 border-t border-border/40 flex items-center gap-1.5 overflow-x-auto scrollbar-none bg-background/25">
              {[
                { label: 'Analyze RELIANCE', query: 'Analyze Reliance Industries' },
                { label: 'Top buy signals', query: 'What are the top buy signals today?' },
                { label: 'Check HDFCBANK', query: 'Should I buy HDFC bank?' }
              ].map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(p.query)}
                  className="px-3 py-1 border border-border hover:border-profit/35 bg-background hover:bg-profit/5 rounded-xl text-[9px] font-black uppercase text-text-secondary hover:text-profit shrink-0 transition-all cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Message input bar */}
            <div className="p-3 border-t border-border/40 bg-slate-50/20 dark:bg-slate-800/10 flex items-center gap-2">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask AI Copilot (e.g. 'Should I buy Reliance?')..."
                className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-xs text-text-primary outline-none focus:border-profit transition-colors"
                disabled={chatLoading}
              />
              <button
                onClick={() => handleSendMessage()}
                className="h-8 w-8 rounded-xl bg-profit hover:brightness-105 text-white flex items-center justify-center shadow-md shadow-profit/15 transition-all cursor-pointer shrink-0 disabled:opacity-50"
                disabled={chatLoading}
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Lock Overlay for non-Pro users */}
        {!userId && (
          <div className="absolute inset-0 bg-slate-900/10 dark:bg-slate-950/20 backdrop-blur-[2.5px] flex flex-col items-center justify-center text-center p-6 select-none animate-in fade-in duration-200 z-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/80 border border-border shadow-md mb-3 text-amber-500 animate-bounce">
              <Lock className="h-5 w-5" />
            </div>
            
            <h3 className="font-black text-sm text-text-primary tracking-tight flex items-center gap-1.5">
              <Sparkles className="h-4.5 w-4.5 text-profit" />
              Unlock Professional AI Copilot Scanners
            </h3>
            
            <p className="text-[10px] text-text-secondary leading-relaxed font-semibold mt-1.5 max-w-sm px-4">
              Connect your account to access live technical breakout triggers, indicator scanners, target prices, risk-reward ratios, and automated buy/sell signals.
            </p>

            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="mt-4 h-9 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-105 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/10 cursor-pointer border border-emerald-500/20"
            >
              <Lock className="h-3.5 w-3.5" />
              Sign In to Unlock Copilot
            </button>
          </div>
        )}
      </div>

      {/* Auth Modal */}
      <FirebaseAuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
}
