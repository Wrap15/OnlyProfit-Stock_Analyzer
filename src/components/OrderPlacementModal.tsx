'use client';

import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Info, Calculator, Wallet, Plus, Minus } from 'lucide-react';
import { useStockStore } from '@/store/useStockStore';
import { calculateFees, placeOrder } from '@/lib/simulatorService';

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
  const { userId } = useStockStore();
  const [productType, setProductType] = useState<'CNC' | 'MIS'>('CNC');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT' | 'SL'>('MARKET');
  const [quantity, setQuantity] = useState<number>(1);
  const [priceInput, setPriceInput] = useState<string>(livePrice.toFixed(2));
  const [stopPriceInput, setStopPriceInput] = useState<string>((livePrice * 0.95).toFixed(2));
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [isConfirmScreen, setIsConfirmScreen] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [successText, setSuccessText] = useState<string | null>(null);

  // Sync price input on mount / live price updates if market order
  useEffect(() => {
    if (orderType === 'MARKET') {
      setPriceInput(livePrice.toFixed(2));
    }
  }, [livePrice, orderType]);

  if (!isOpen) return null;

  const inputPrice = orderType === 'LIMIT' ? parseFloat(priceInput) || livePrice : livePrice;
  const activeQuantity = Math.max(1, quantity);
  const { brokerage, taxes, total: totalFees } = calculateFees(inputPrice, activeQuantity);
  const grossValue = inputPrice * activeQuantity;
  const totalCost = side === 'BUY' ? grossValue + totalFees : grossValue - totalFees;

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
    if (quantity < 1) {
      setErrorText('Quantity must be at least 1');
      return;
    }
    if (orderType === 'LIMIT' && (!priceInput || parseFloat(priceInput) <= 0)) {
      setErrorText('Limit price must be greater than 0');
      return;
    }
    if (orderType === 'SL' && (!stopPriceInput || parseFloat(stopPriceInput) <= 0)) {
      setErrorText('Stop price must be greater than 0');
      return;
    }
    setIsConfirmScreen(true);
  };

  const handleConfirmSubmit = async () => {
    setLoading(true);
    setErrorText(null);
    setSuccessText(null);

    const limitPriceVal = orderType === 'LIMIT' ? parseFloat(priceInput) : undefined;
    const stopPriceVal = orderType === 'SL' ? parseFloat(stopPriceInput) : undefined;

    try {
      const res = await placeOrder(
        userId,
        {
          symbol,
          side,
          type: orderType,
          productType,
          quantity: activeQuantity,
          limitPrice: limitPriceVal,
          stopPrice: stopPriceVal
        },
        livePrice
      );

      if (res.success) {
        const actionStr = orderType === 'MARKET' ? 'executed' : 'placed successfully';
        setSuccessText(`Order ${actionStr}! ${side === 'BUY' ? 'Bought' : 'Sold'} ${activeQuantity} shares of ${symbol}`);
        
        if (onOrderExecuted) {
          onOrderExecuted();
        }

        setTimeout(() => {
          onClose();
          setIsConfirmScreen(false);
          setSuccessText(null);
        }, 2000);
      } else {
        setErrorText(res.reason || 'Failed to submit order');
        setIsConfirmScreen(false);
      }
    } catch (err) {
      console.error('Order placement failed:', err);
      setErrorText('Server timeout. Failed to record transaction.');
      setIsConfirmScreen(false);
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
          {errorText && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fade-in">
              <Info className="w-4 h-4 shrink-0" />
              <span>{errorText}</span>
            </div>
          )}

          {successText && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fade-in">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{successText}</span>
            </div>
          )}

          {!isConfirmScreen ? (
            <form onSubmit={handleSubmitInit} className="space-y-5">
              
              {/* BUY / SELL Switcher Pill */}
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

              {/* Product Type Buttons */}
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
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-background border border-border/80 rounded-xl">
                  {['MARKET', 'LIMIT', 'SL'].map((t) => (
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
                    orderType !== 'SL' ? 'border-border/40 opacity-60' : 'border-border'
                  }`}>
                    <button 
                      type="button" 
                      disabled={orderType !== 'SL'}
                      onClick={() => adjustTriggerPrice(-0.05)}
                      className="px-2 py-2 text-text-secondary hover:text-text-primary disabled:hover:text-text-secondary bg-card-hover/20 hover:bg-card-hover/40 border-r border-border disabled:border-transparent transition-colors cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      step="0.05"
                      disabled={orderType !== 'SL'}
                      value={stopPriceInput}
                      onChange={(e) => setStopPriceInput(e.target.value)}
                      className="w-full bg-transparent text-center py-2 text-xs text-text-primary disabled:text-text-secondary outline-none font-bold font-mono focus:ring-0 border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button 
                      type="button" 
                      disabled={orderType !== 'SL'}
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
                <div className="flex items-center justify-between text-xs font-black border-t border-border/60 pt-2.5 text-text-primary">
                  <span>Estimated Total Margin:</span>
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
                    ? 'bg-emerald-50 hover:bg-emerald-600 text-black shadow-md shadow-emerald-500/20'
                    : 'bg-red-500 hover:bg-red-600 text-black shadow-md shadow-red-500/20'
                }`}
              >
                Review {side === 'BUY' ? 'Buy' : 'Sell'} Order
              </button>
            </form>
          ) : (
            /* Confirmation Details Screen */
            <div className="space-y-6 animate-fade-in">
              <div className="text-center p-5 bg-background border border-border/80 rounded-2xl space-y-1">
                <span className={`text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded ${
                  side === 'BUY' ? 'bg-emerald-500/10 text-emerald-450' : 'bg-rose-500/10 text-rose-455'
                }`}>
                  Verify Order Details
                </span>
                <div className="text-xl sm:text-2xl font-black text-text-primary">
                  {side === 'BUY' ? 'Buy' : 'Sell'} {activeQuantity} Shares
                </div>
                <div className="text-xs font-bold text-text-secondary">{stockName} ({symbol})</div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[9px] font-black text-text-secondary uppercase tracking-widest">
                  Order Breakdown
                </h4>
                
                <div className="bg-card-hover/20 border border-border/80 rounded-2xl p-4 space-y-2.5">
                  <div className="flex justify-between text-xs font-bold text-text-secondary">
                    <span>Product:</span>
                    <span className="text-text-primary">{productType === 'CNC' ? 'CNC (Delivery)' : 'MIS (Intraday)'}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-text-secondary">
                    <span>Order Type:</span>
                    <span className="text-text-primary uppercase">{orderType}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-text-secondary">
                    <span>Execution Price:</span>
                    <span className="text-text-primary font-mono">₹{inputPrice.toFixed(2)}</span>
                  </div>
                  
                  <div className="border-t border-border/60 my-1" />

                  <div className="flex justify-between text-[10px] font-semibold text-text-secondary">
                    <span>Simulated Brokerage (0.03%):</span>
                    <span className="text-text-primary font-mono">₹{brokerage.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-semibold text-text-secondary">
                    <span>Securities Transaction Tax (STT):</span>
                    <span className="text-text-primary font-mono">₹{(inputPrice * activeQuantity * 0.001).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-semibold text-text-secondary">
                    <span>GST (18% on Brokerage):</span>
                    <span className="text-text-primary font-mono">₹{(brokerage * 0.18).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-semibold text-text-secondary">
                    <span>Stamp Duty & exchange fees:</span>
                    <span className="text-text-primary font-mono font-extrabold">₹{(taxes - parseFloat((inputPrice * activeQuantity * 0.001).toFixed(2)) - parseFloat((brokerage * 0.18).toFixed(2))).toFixed(2)}</span>
                  </div>

                  <div className="border-t border-border/60 my-1" />

                  <div className="flex justify-between text-xs font-black text-text-primary pt-1">
                    <span>Total Cost / Margin Required:</span>
                    <span className={side === 'BUY' ? 'text-emerald-450 font-mono font-black text-sm' : 'text-rose-455 font-mono font-black text-sm'}>
                      ₹{totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Confirm Actions */}
              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setIsConfirmScreen(false)}
                  className="flex-1 py-3.5 bg-background hover:bg-card-hover border border-border text-text-primary rounded-2xl text-xs font-black tracking-wider uppercase transition-all cursor-pointer hover:border-border-dark active:scale-[0.98]"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleConfirmSubmit}
                  className={`flex-1 py-3.5 rounded-2xl text-xs font-black tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98] ${
                    side === 'BUY'
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-black shadow-md shadow-emerald-500/20'
                      : 'bg-red-500 hover:bg-red-600 text-black shadow-md shadow-red-500/20'
                  }`}
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent animate-spin rounded-full" />
                  ) : (
                    <>
                      <Wallet className="w-4 h-4" />
                      <span>Confirm {side === 'BUY' ? 'Buy' : 'Sell'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
