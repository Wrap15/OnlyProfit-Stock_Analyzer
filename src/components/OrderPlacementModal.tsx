'use client';

import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Info, Calculator, Wallet } from 'lucide-react';
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md uppercase">
              Paper Trading Simulator
            </span>
            <h3 className="text-lg font-black text-text-primary mt-1">
              {side === 'BUY' ? 'Buy' : 'Sell'} {stockName}
            </h3>
            <span className="text-xs text-text-secondary font-bold">NSE: {symbol}</span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-background hover:bg-card-hover border border-border text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {errorText && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-xs font-bold flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>{errorText}</span>
            </div>
          )}

          {successText && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-xs font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{successText}</span>
            </div>
          )}

          {!isConfirmScreen ? (
            <form onSubmit={handleSubmitInit} className="space-y-5">
              
              {/* BUY / SELL Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-background border border-border rounded-2xl">
                <button
                  type="button"
                  onClick={() => setSide('BUY')}
                  className={`py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all ${
                    side === 'BUY'
                      ? 'bg-emerald-500 text-black shadow-md'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Buy
                </button>
                <button
                  type="button"
                  onClick={() => setSide('SELL')}
                  className={`py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all ${
                    side === 'SELL'
                      ? 'bg-red-500 text-black shadow-md'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Sell
                </button>
              </div>

              {/* Product Type (MIS vs CNC) */}
              <div>
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest block mb-2">
                  Product Type
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setProductType('CNC')}
                    className={`flex flex-col items-center justify-center p-3 border rounded-2xl text-center transition-all ${
                      productType === 'CNC'
                        ? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-400'
                        : 'border-border bg-card-hover/40 text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <span className="text-xs font-black">CNC</span>
                    <span className="text-[9px] font-bold mt-0.5 opacity-80">Delivery (Overnight)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductType('MIS')}
                    className={`flex flex-col items-center justify-center p-3 border rounded-2xl text-center transition-all ${
                      productType === 'MIS'
                        ? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-400'
                        : 'border-border bg-card-hover/40 text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <span className="text-xs font-black">MIS</span>
                    <span className="text-[9px] font-bold mt-0.5 opacity-80">Intraday (Square off)</span>
                  </button>
                </div>
              </div>

              {/* Order Type */}
              <div>
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest block mb-2">
                  Order Type
                </label>
                <div className="grid grid-cols-3 gap-2 p-1 bg-background border border-border rounded-xl">
                  {['MARKET', 'LIMIT', 'SL'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setOrderType(t as any)}
                      className={`py-1.5 rounded-lg text-[10px] font-black tracking-wider uppercase transition-all ${
                        orderType === t
                          ? 'bg-card text-emerald-400 border border-border/80 shadow-sm'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity, Price, Stop-loss Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest block mb-1.5">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full bg-background border border-border px-3 py-2 rounded-xl text-xs text-text-primary focus:border-emerald-500/50 outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest block mb-1.5">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    disabled={orderType === 'MARKET'}
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    className="w-full bg-background disabled:bg-card-hover border border-border disabled:border-border/40 px-3 py-2 rounded-xl text-xs text-text-primary disabled:text-text-secondary/60 focus:border-emerald-500/50 outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest block mb-1.5">
                    Trigger Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    disabled={orderType !== 'SL'}
                    value={stopPriceInput}
                    onChange={(e) => setStopPriceInput(e.target.value)}
                    className="w-full bg-background disabled:bg-card-hover border border-border disabled:border-border/40 px-3 py-2 rounded-xl text-xs text-text-primary disabled:text-text-secondary/60 focus:border-emerald-500/50 outline-none font-bold"
                  />
                </div>
              </div>

              {/* Estimate Summary card */}
              <div className="bg-card-hover/40 border border-border p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-text-secondary">
                  <span>Gross Value:</span>
                  <span className="text-text-primary">₹{grossValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-text-secondary">
                  <span className="flex items-center gap-1">
                    Brokerage & Taxes:
                    <Calculator className="w-3.5 h-3.5 text-text-secondary/70" />
                  </span>
                  <span className="text-text-primary">₹{totalFees.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-black border-t border-border/60 pt-2 text-text-primary">
                  <span>Estimated Total:</span>
                  <span className="text-emerald-400">₹{totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Submit Proceed Button */}
              <button
                type="submit"
                className={`w-full py-3 rounded-2xl font-black text-xs tracking-wider uppercase transition-all cursor-pointer ${
                  side === 'BUY'
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-black'
                    : 'bg-red-500 hover:bg-red-600 text-black'
                }`}
              >
                Review Order
              </button>
            </form>
          ) : (
            /* Confirmation Screen */
            <div className="space-y-6">
              <div className="text-center p-4 bg-background border border-border rounded-2xl">
                <span className="text-[10px] text-text-secondary font-black tracking-widest uppercase">
                  Verify Transaction Details
                </span>
                <div className="text-2xl font-black text-text-primary mt-1">
                  {side === 'BUY' ? 'Buy' : 'Sell'} {activeQuantity} Shares
                </div>
                <div className="text-sm font-bold text-text-secondary mt-0.5">{stockName} ({symbol})</div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-text-secondary uppercase tracking-widest">
                  Order breakdown
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
                    <span className="text-text-primary">₹{inputPrice.toFixed(2)}</span>
                  </div>
                  
                  <div className="border-t border-border/60 my-1" />

                  <div className="flex justify-between text-[11px] font-semibold text-text-secondary">
                    <span>Simulated Brokerage (0.03%):</span>
                    <span className="text-text-primary">₹{brokerage.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-semibold text-text-secondary">
                    <span>Securities Transaction Tax (STT):</span>
                    <span className="text-text-primary">₹{(inputPrice * activeQuantity * 0.001).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-semibold text-text-secondary">
                    <span>GST (18% on Brokerage):</span>
                    <span className="text-text-primary">₹{(brokerage * 0.18).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-semibold text-text-secondary">
                    <span>Stamp Duty & Exchange Fees:</span>
                    <span className="text-text-primary">₹{(taxes - parseFloat((inputPrice * activeQuantity * 0.001).toFixed(2)) - parseFloat((brokerage * 0.18).toFixed(2))).toFixed(2)}</span>
                  </div>

                  <div className="border-t border-border/60 my-1" />

                  <div className="flex justify-between text-xs font-black text-text-primary">
                    <span>Total Margin Required:</span>
                    <span className="text-emerald-400">₹{totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Confirm CTAs */}
              <div className="flex gap-4">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setIsConfirmScreen(false)}
                  className="flex-1 py-3 bg-background hover:bg-card-hover border border-border text-text-primary rounded-2xl text-xs font-black tracking-wider uppercase transition-all cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleConfirmSubmit}
                  className={`flex-1 py-3 rounded-2xl text-xs font-black tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    side === 'BUY'
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-black'
                      : 'bg-red-500 hover:bg-red-600 text-black'
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
