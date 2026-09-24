'use client';

import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Info, Calculator, Plus, Minus, Lock, Shield, Share2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useStockStore } from '@/store/useStockStore';
import { calculateFees, placeOrder } from '@/lib/simulatorService';
import SwipeToTrade from '@/components/SwipeToTrade';
import ConfettiEffect from '@/components/ConfettiEffect';
import ShareTradeModal from '@/components/ShareTradeModal';

interface OrderPlacementModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  stockName: string;
  livePrice: number;
  onOrderExecuted?: () => void;
}

export default function OrderPlacementModal({
  isOpen,
  onClose,
  symbol,
  stockName,
  livePrice,
  onOrderExecuted
}: OrderPlacementModalProps) {
  const { userId, toggleAuthModal, userMpin, setUserMpin } = useStockStore();
  const [productType, setProductType] = useState<'CNC' | 'MIS'>('CNC');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT' | 'SL' | 'GTT'>('MARKET');
  const [quantity, setQuantity] = useState<number>(1);
  const [priceInput, setPriceInput] = useState<string>(livePrice.toFixed(2));
  const [stopPriceInput, setStopPriceInput] = useState<string>((livePrice * 0.95).toFixed(2));
  const [mpin, setMpin] = useState<string>('');
  const [showMpin, setShowMpin] = useState<boolean>(false);
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [availableHoldingQty, setAvailableHoldingQty] = useState<number>(0);
  const [isConfirmScreen, setIsConfirmScreen] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [successText, setSuccessText] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [executedTrade, setExecutedTrade] = useState<any>(null);

  // Reset security state on modal open/close
  useEffect(() => {
    if (!isOpen) {
      setMpin('');
      setIsConfirmScreen(false);
      setErrorText(null);
    }
  }, [isOpen]);

  // Sync price input on mount & fetch available holdings
  useEffect(() => {
    if (orderType === 'MARKET') {
      setPriceInput(livePrice.toFixed(2));
    }
  }, [livePrice, orderType]);

  useEffect(() => {
    if (isOpen && userId) {
      import('@/lib/simulatorService').then(({ getSimulatorState }) => {
        getSimulatorState(userId).then((st) => {
          const holding = st.holdings.find(h => h.symbol === symbol);
          if (holding) {
            setAvailableHoldingQty(holding.quantity);
          } else {
            setAvailableHoldingQty(0);
          }
        });
      });
    }
  }, [isOpen, userId, symbol]);

  if (!isOpen) return null;

  const inputPrice = orderType === 'LIMIT' ? parseFloat(priceInput) || livePrice : livePrice;
  const activeQuantity = Math.max(1, quantity);
  const { brokerage, taxes, total: totalFees } = calculateFees(inputPrice, activeQuantity);
  const grossValue = inputPrice * activeQuantity;
  const marginRequired = productType === 'MIS' ? grossValue * 0.20 : grossValue;
  const totalCost = side === 'BUY' ? marginRequired + totalFees : marginRequired - totalFees;

  // Stepper Handlers for premium click inputs
  const adjustQty = (amount: number) => {
    setQuantity(prev => Math.max(1, prev + amount));
  };

  const adjustPrice = (amount: number) => {
    const val = parseFloat(priceInput) || livePrice;
    setPriceInput(Math.max(0.05, val + amount).toFixed(2));
  };

  const adjustTriggerPrice = (amount: number) => {
    const val = parseFloat(stopPriceInput) || (livePrice * 0.95);
    setStopPriceInput(Math.max(0.05, val + amount).toFixed(2));
  };

  const handleSubmitInit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText(null);

    // If user is not logged in, trigger Sign-In Modal
    if (!userId) {
      onClose();
      toggleAuthModal(true);
      return;
    }

    if (quantity < 1) {
      setErrorText('Quantity must be at least 1');
      return;
    }
    if (orderType === 'LIMIT' && (!priceInput || parseFloat(priceInput) <= 0)) {
      setErrorText('Limit price must be greater than 0');
      return;
    }
    if ((orderType === 'SL' || orderType === 'GTT') && (!stopPriceInput || parseFloat(stopPriceInput) <= 0)) {
      setErrorText('Trigger / Stop price must be greater than 0');
      return;
    }
    setIsConfirmScreen(true);
  };

  const handleConfirmSubmit = async () => {
    // 0. Strict 4-Digit MPIN Authorization (SEBI & Broker Standard)
    if (!mpin || !/^\d{4}$/.test(mpin)) {
      setErrorText('Please enter your 4-digit Security MPIN to authorize trade');
      return;
    }

    if (userMpin && mpin !== userMpin) {
      setErrorText('Security Verification Failed: Incorrect 4-Digit MPIN');
      return;
    }

    // If user has not yet established an MPIN in their profile, configure it now
    if (!userMpin) {
      setUserMpin(mpin);
      if (userId) {
        import('@/lib/firebase').then(({ db }) => {
          import('firebase/firestore').then(({ doc, setDoc }) => {
            setDoc(doc(db, 'users', userId, 'security', 'mpin'), {
              hasMpin: true,
              failedAttempts: 0,
              lockoutUntil: null,
              updatedAt: new Date().toISOString()
            }, { merge: true }).catch(() => {});
          });
        });
      }
    }

    setLoading(true);
    setErrorText(null);
    setSuccessText(null);

    const limitPriceVal = (orderType === 'LIMIT' || orderType === 'GTT') ? parseFloat(priceInput) : undefined;
    const stopPriceVal = (orderType === 'SL' || orderType === 'GTT') ? parseFloat(stopPriceInput) : undefined;

    try {
      // 1. Server-side Risk Management System (RMS) & Security Verification
      const response = await fetch('/api/trade/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          symbol,
          side,
          type: orderType,
          productType,
          quantity: activeQuantity,
          limitPrice: limitPriceVal,
          stopPrice: stopPriceVal,
          mpin: mpin
        })
      });

      const serverResult = await response.json();

      if (!response.ok) {
        setErrorText(serverResult.error || 'Order rejected by Risk Management System (RMS)');
        setLoading(false);
        return;
      }

      // 2. Synchronize with local simulator portfolio
      const res = await placeOrder(
        userId,
        {
          symbol,
          side,
          type: orderType === 'GTT' ? 'LIMIT' : orderType,
          productType,
          quantity: activeQuantity,
          limitPrice: limitPriceVal,
          stopPrice: stopPriceVal
        },
        livePrice
      );

      if (res.success) {
        const actionStr = orderType === 'MARKET' ? 'executed' : `placed successfully as ${orderType}`;
        setSuccessText(`Order ${actionStr}! ${side === 'BUY' ? 'Bought' : 'Sold'} ${activeQuantity} shares of ${symbol}`);
        setShowConfetti(true);
        setExecutedTrade({
          symbol,
          stockName,
          side,
          quantity: activeQuantity,
          price: inputPrice,
          pnl: parseFloat((inputPrice * activeQuantity * 0.048).toFixed(2)),
          pnlPercent: 4.80,
          totalInvested: parseFloat((inputPrice * activeQuantity).toFixed(2))
        });
        
        if (onOrderExecuted) {
          onOrderExecuted();
        }

        setTimeout(() => {
          if (!showShareModal) {
            onClose();
            setIsConfirmScreen(false);
            setSuccessText(null);
            setShowConfetti(false);
          }
        }, 3200);
      } else {
        setErrorText(res.reason || 'Failed to submit order');
      }
    } catch (err) {
      console.error('Order placement failed:', err);
      setErrorText('Server timeout. Failed to record transaction.');
    } finally {
      setLoading(false);
    }
  };

  // Border Accent variables based on BUY vs SELL
  const shadowGlowClass = side === 'BUY' 
    ? 'shadow-[0_0_24px_rgba(16,185,129,0.15)] border-emerald-500/20' 
    : 'shadow-[0_0_24px_rgba(244,63,94,0.15)] border-rose-500/20';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-background/80 backdrop-blur-sm transition-all duration-300">
      
      {/* Container: Responsive bottom sheet on mobile, modal box on desktop */}
      <div className={`bg-card border-t sm:border w-full max-w-lg rounded-t-[2.25rem] sm:rounded-3xl overflow-hidden shadow-2xl relative animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 pb-10 sm:pb-0 ${shadowGlowClass}`}>
        
        {/* Dynamic Glow Accent Top Strip */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${side === 'BUY' ? 'from-emerald-500 to-teal-400' : 'from-rose-500 to-orange-400'} absolute top-0 left-0`} />
        
        {/* Modal Header */}
        <div className={`p-6 border-b border-border/80 flex items-center justify-between mt-1 ${
          side === 'BUY' ? 'bg-gradient-to-r from-emerald-500/5 via-transparent to-transparent' : 'bg-gradient-to-r from-rose-500/5 via-transparent to-transparent'
        }`}>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-black tracking-widest px-2 py-0.5 rounded uppercase ${
                side === 'BUY' ? 'bg-emerald-500/10 text-emerald-450' : 'bg-rose-500/10 text-rose-450'
              }`}>
                Simulator Order
              </span>
              {productType === 'MIS' && (
                <span className="text-[9px] font-black tracking-widest bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded uppercase">
                  Intraday
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-black text-text-primary mt-1.5">
              {side === 'BUY' ? 'Buy' : 'Sell'} {stockName}
            </h3>
            <span className="text-[10px] sm:text-xs text-text-secondary font-bold">NSE Equity: {symbol}</span>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2.5 rounded-xl bg-background hover:bg-card-hover border border-border text-text-secondary hover:text-text-primary transition-all cursor-pointer active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-4">
          {!userId && (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between gap-3 text-amber-500 text-xs font-bold animate-fade-in">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0 text-amber-500" />
                <span>Account required to execute orders</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  toggleAuthModal(true);
                }}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-[10px] tracking-wider rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
              >
                Sign In
              </button>
            </div>
          )}

          {errorText && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fade-in">
              <Info className="w-4 h-4 shrink-0" />
              <span>{errorText}</span>
            </div>
          )}

          {successText && (
            <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-450 rounded-2xl text-xs font-bold space-y-2 animate-fade-in shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-400" />
                <span>{successText}</span>
              </div>
              {executedTrade && (
                <button
                  type="button"
                  onClick={() => setShowShareModal(true)}
                  className="w-full py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase text-[10px] tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>View & Share Trade Story Card</span>
                </button>
              )}
            </div>
          )}

          {!isConfirmScreen ? (
            <form onSubmit={handleSubmitInit} className="space-y-5">
              
              {/* BUY / SELL Switcher Pill for Equities */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-background border border-border/80 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setSide('BUY')}
                  className={`py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                    side === 'BUY'
                      ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/10'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Buy
                </button>
                <button
                  type="button"
                  onClick={() => setSide('SELL')}
                  className={`py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                    side === 'SELL'
                      ? 'bg-red-500 text-black shadow-md shadow-red-500/10'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Sell
                </button>
              </div>

              {/* Available Holdings Banner */}
              {availableHoldingQty > 0 && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-background/60 border border-border/60 text-xs">
                  <span className="font-bold text-text-secondary">Available Holdings:</span>
                  <span className="font-black text-text-primary font-mono">
                    {availableHoldingQty} Shares
                  </span>
                </div>
              )}

              {/* Product Type Buttons for Equities */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-text-secondary uppercase tracking-widest block">
                  Product Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setProductType('CNC')}
                    className={`flex flex-col items-center justify-center p-3.5 border rounded-2xl text-center transition-all cursor-pointer ${
                      productType === 'CNC'
                        ? (side === 'BUY' ? 'border-emerald-500 bg-emerald-500/5 text-emerald-455 shadow-sm' : 'border-rose-500 bg-rose-500/5 text-rose-455 shadow-sm')
                        : 'border-border bg-background text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <span className="text-xs font-extrabold uppercase">CNC (Delivery)</span>
                    <span className="text-[8px] font-medium mt-0.5 opacity-80">Full cash required • Keep overnight</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductType('MIS')}
                    className={`flex flex-col items-center justify-center p-3.5 border rounded-2xl text-center transition-all cursor-pointer ${
                      productType === 'MIS'
                        ? (side === 'BUY' ? 'border-emerald-500 bg-emerald-500/5 text-emerald-455 shadow-sm' : 'border-rose-500 bg-rose-500/5 text-rose-455 shadow-sm')
                        : 'border-border bg-background text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <span className="text-xs font-extrabold uppercase">MIS (Intraday)</span>
                    <span className="text-[8px] font-medium mt-0.5 opacity-80">Auto square-off at 3:15 PM</span>
                  </button>
                </div>
              </div>

              {/* Order Type Tabs */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-text-secondary uppercase tracking-widest block">
                  Order Type
                </label>
                <div className="grid grid-cols-4 gap-1.5 p-1 bg-background border border-border/80 rounded-xl">
                  {['MARKET', 'LIMIT', 'SL', 'GTT'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setOrderType(t as any)}
                      className={`py-1.5 rounded-lg text-[9px] font-black tracking-wider uppercase transition-all cursor-pointer ${
                        orderType === t
                          ? 'bg-card text-text-primary border border-border/80 shadow-soft'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {t === 'SL' ? 'Stop Loss' : t}
                    </button>
                  ))}
                </div>
                {orderType === 'GTT' && (
                  <p className="text-[9px] text-profit font-bold bg-profit/10 p-2 rounded-xl border border-profit/20 animate-fade-in">
                    ⚡ GTT (Good Till Triggered): Order is kept active for 365 days until your trigger price is reached.
                  </p>
                )}
              </div>

              {/* Quantity, Price, Trigger Price Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Quantity with click steppers */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-text-secondary uppercase tracking-widest block">
                    Quantity
                  </label>
                  <div className="flex items-center bg-background border border-border rounded-xl overflow-hidden focus-within:border-emerald-500/50">
                    <button 
                      type="button" 
                      onClick={() => adjustQty(-1)}
                      className="px-2.5 py-2 text-text-secondary hover:text-text-primary bg-card-hover/20 hover:bg-card-hover/40 border-r border-border transition-colors cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                      className="w-full bg-transparent text-center py-2 text-xs text-text-primary outline-none font-bold font-mono focus:ring-0 border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button 
                      type="button" 
                      onClick={() => adjustQty(1)}
                      className="px-2.5 py-2 text-text-secondary hover:text-text-primary bg-card-hover/20 hover:bg-card-hover/40 border-l border-border transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Price Input with steppers */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-text-secondary uppercase tracking-widest block">
                    Price (₹)
                  </label>
                  <div className={`flex items-center bg-background border rounded-xl overflow-hidden ${
                    orderType === 'MARKET' ? 'border-border/40 opacity-60' : 'border-border'
                  }`}>
                    <button 
                      type="button" 
                      disabled={orderType === 'MARKET'}
                      onClick={() => adjustPrice(-0.05)}
                      className="px-2 py-2 text-text-secondary hover:text-text-primary disabled:hover:text-text-secondary bg-card-hover/20 hover:bg-card-hover/40 border-r border-border disabled:border-transparent transition-colors cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      step="0.05"
                      disabled={orderType === 'MARKET'}
                      value={priceInput}
                      onChange={(e) => setPriceInput(e.target.value)}
                      className="w-full bg-transparent text-center py-2 text-xs text-text-primary disabled:text-text-secondary outline-none font-bold font-mono focus:ring-0 border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button 
                      type="button" 
                      disabled={orderType === 'MARKET'}
                      onClick={() => adjustPrice(0.05)}
                      className="px-2 py-2 text-text-secondary hover:text-text-primary disabled:hover:text-text-secondary bg-card-hover/20 hover:bg-card-hover/40 border-l border-border disabled:border-transparent transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Trigger Price with steppers */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-text-secondary uppercase tracking-widest block">
                    Trigger (₹)
                  </label>
                  <div className={`flex items-center bg-background border rounded-xl overflow-hidden ${
                    orderType !== 'SL' && orderType !== 'GTT' ? 'border-border/40 opacity-60' : 'border-border'
                  }`}>
                    <button 
                      type="button" 
                      disabled={orderType !== 'SL' && orderType !== 'GTT'}
                      onClick={() => adjustTriggerPrice(-0.05)}
                      className="px-2 py-2 text-text-secondary hover:text-text-primary disabled:hover:text-text-secondary bg-card-hover/20 hover:bg-card-hover/40 border-r border-border disabled:border-transparent transition-colors cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      step="0.05"
                      disabled={orderType !== 'SL' && orderType !== 'GTT'}
                      value={stopPriceInput}
                      onChange={(e) => setStopPriceInput(e.target.value)}
                      className="w-full bg-transparent text-center py-2 text-xs text-text-primary disabled:text-text-secondary outline-none font-bold font-mono focus:ring-0 border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button 
                      type="button" 
                      disabled={orderType !== 'SL' && orderType !== 'GTT'}
                      onClick={() => adjustTriggerPrice(0.05)}
                      className="px-2 py-2 text-text-secondary hover:text-text-primary disabled:hover:text-text-secondary bg-card-hover/20 hover:bg-card-hover/40 border-l border-border disabled:border-transparent transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

              </div>

              {/* Estimate Calculations Card */}
              <div className="bg-card-hover/30 border border-border/80 p-4 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-text-secondary">
                  <span>Gross Value:</span>
                  <span className="text-text-primary font-mono font-extrabold">₹{grossValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-bold text-text-secondary">
                  <span className="flex items-center gap-1">
                    Brokerage & Exchange Fees:
                    <Calculator className="w-3.5 h-3.5 text-text-secondary/70" />
                  </span>
                  <span className="text-text-primary font-mono font-extrabold">₹{totalFees.toFixed(2)}</span>
                </div>
                {productType === 'MIS' && (
                  <div className="flex items-center justify-between text-[10px] font-black text-emerald-450 bg-emerald-500/5 px-2.5 py-1.5 rounded-xl border border-emerald-500/10 select-none">
                    <span>MIS Intraday 5x Leverage:</span>
                    <span>20% margin blocked</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs font-black border-t border-border/60 pt-2.5 text-text-primary">
                  <span>{productType === 'MIS' ? 'Estimated Margin Required:' : 'Estimated Total Cost:'}</span>
                  <span className={side === 'BUY' ? 'text-emerald-400 font-mono font-black' : 'text-rose-400 font-mono font-black'}>
                    ₹{totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Submit Proceed Button */}
              <button
                type="submit"
                className={`w-full py-3.5 rounded-2xl font-black text-xs tracking-wider uppercase transition-all duration-200 cursor-pointer active:scale-[0.99] ${
                  side === 'BUY'
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-black shadow-md shadow-emerald-500/20'
                    : 'bg-red-500 hover:bg-red-600 text-black shadow-md shadow-red-500/20'
                }`}
              >
                Review {side === 'BUY' ? 'Buy' : 'Sell'} Order
              </button>
            </form>
          ) : (
            /* Confirmation Details Screen */
            <div className="space-y-4 animate-fade-in">
              <div className="text-center p-4 bg-background border border-border/80 rounded-2xl space-y-1">
                <span className={`text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded ${
                  side === 'BUY' ? 'bg-emerald-500/10 text-emerald-450' : 'bg-rose-500/10 text-rose-455'
                }`}>
                  Verify Order Details
                </span>
                <div className="text-lg sm:text-xl font-black text-text-primary">
                  {side === 'BUY' ? 'Buy' : 'Sell'} {activeQuantity} Shares
                </div>
                <div className="text-xs font-bold text-text-secondary">{stockName} ({symbol})</div>
              </div>

              <div className="space-y-2">
                <h4 className="text-[9px] font-black text-text-secondary uppercase tracking-widest">
                  Order Breakdown
                </h4>
                
                <div className="bg-card-hover/20 border border-border/80 rounded-2xl p-3.5 space-y-2 text-xs">
                  <div className="flex justify-between font-bold text-text-secondary">
                    <span>Product:</span>
                    <span className="text-text-primary">{productType === 'CNC' ? 'CNC (Delivery)' : 'MIS (Intraday)'}</span>
                  </div>
                  <div className="flex justify-between font-bold text-text-secondary">
                    <span>Order Type:</span>
                    <span className="text-text-primary uppercase">{orderType}</span>
                  </div>
                  <div className="flex justify-between font-bold text-text-secondary">
                    <span>Target Execution Price:</span>
                    <span className="text-text-primary font-mono">₹{inputPrice.toFixed(2)}</span>
                  </div>
                  {orderType === 'GTT' && (
                    <div className="flex justify-between font-bold text-text-secondary">
                      <span>Trigger Price:</span>
                      <span className="text-profit font-mono">₹{stopPriceInput}</span>
                    </div>
                  )}
                  
                  <div className="border-t border-border/60 my-1" />

                  <div className="flex justify-between text-[10px] font-semibold text-text-secondary">
                    <span>Brokerage & Exchange Fee:</span>
                    <span className="text-text-primary font-mono">₹{brokerage.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-semibold text-text-secondary">
                    <span>Statutory Taxes (STT + GST + Stamp):</span>
                    <span className="text-text-primary font-mono">₹{taxes.toFixed(2)}</span>
                  </div>

                  <div className="border-t border-border/60 my-1" />

                  <div className="flex justify-between text-xs font-black text-text-primary pt-0.5">
                    <span>Total Margin / Capital:</span>
                    <span className={side === 'BUY' ? 'text-emerald-450 font-mono font-black text-sm' : 'text-rose-455 font-mono font-black text-sm'}>
                      ₹{totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* SEBI 2FA & 4-Digit MPIN Security Verification (Groww & Angel One Standard) */}
              <div className="bg-background/90 border border-border/90 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-black text-text-primary">
                    <Lock className="w-3.5 h-3.5 text-profit" />
                    <span>Enter 4-Digit Security MPIN</span>
                  </div>
                  <span className="text-[9px] font-bold text-profit flex items-center gap-1 bg-profit/10 px-2 py-0.5 rounded-full">
                    <Shield className="w-2.5 h-2.5" /> 2FA Mandatory
                  </span>
                </div>

                <div className="relative">
                  <input
                    type={showMpin ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={mpin}
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setMpin(digitsOnly);
                      if (errorText) setErrorText(null);
                    }}
                    placeholder="••••"
                    autoFocus
                    className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-center text-lg tracking-[0.5em] font-mono font-black text-text-primary focus:border-profit focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMpin(!showMpin)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-1 cursor-pointer transition-colors"
                    title={showMpin ? 'Hide MPIN' : 'Show MPIN'}
                  >
                    {showMpin ? <EyeOff className="w-4 h-4 text-profit" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center justify-between text-[9px] text-text-secondary px-0.5">
                  <span>Enter your personal 4-digit trade MPIN</span>
                  <span className="font-mono text-profit font-bold">4 Digits</span>
                </div>
              </div>

              {/* Confirm Actions: Interactive Swipe-to-Trade Slider */}
              <div className="space-y-3 pt-1">
                <SwipeToTrade 
                  side={side} 
                  onConfirm={handleConfirmSubmit} 
                  loading={loading} 
                />

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setIsConfirmScreen(false)}
                  className="w-full py-2.5 bg-background hover:bg-card-hover border border-border text-text-secondary hover:text-text-primary rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to modify order</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Celebratory Particle Confetti on Order Execution */}
      {showConfetti && (
        <ConfettiEffect onComplete={() => setShowConfetti(false)} />
      )}

      {/* Shareable Glassmorphic P&L Story Card Modal */}
      {executedTrade && (
        <ShareTradeModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          tradeData={executedTrade}
        />
      )}
    </div>
  );
}
