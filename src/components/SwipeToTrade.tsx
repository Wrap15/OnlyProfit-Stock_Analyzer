'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { ChevronsRight, Check, Loader2 } from 'lucide-react';

interface SwipeToTradeProps {
  side: 'BUY' | 'SELL';
  onConfirm: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export default function SwipeToTrade({
  side,
  onConfirm,
  loading = false,
  disabled = false,
}: SwipeToTradeProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [maxDrag, setMaxDrag] = useState(240);

  const x = useMotionValue(0);

  // Update track width bounds on mount and resize
  useEffect(() => {
    const updateBounds = () => {
      if (containerRef.current) {
        const thumbWidth = 52;
        const width = containerRef.current.offsetWidth - thumbWidth - 8; // 8px total padding
        setMaxDrag(Math.max(100, width));
      }
    };
    updateBounds();
    window.addEventListener('resize', updateBounds);
    return () => window.removeEventListener('resize', updateBounds);
  }, []);

  // Calculate dynamic fill opacity and width
  const fillWidth = useTransform(x, [0, maxDrag], ['0%', '100%']);
  const textOpacity = useTransform(x, [0, maxDrag * 0.5], [1, 0]);

  const handleDragEnd = () => {
    if (disabled || loading) return;

    if (x.get() >= maxDrag * 0.75) {
      // Trigger success latch
      x.set(maxDrag);
      setIsSuccess(true);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate([40]);
        } catch {}
      }
      onConfirm();
    } else {
      // Snap back
      x.set(0);
    }
  };

  const isBuy = side === 'BUY';
  const trackBg = isBuy ? 'bg-emerald-500/10' : 'bg-rose-500/10';
  const borderCol = isBuy ? 'border-emerald-500/30' : 'border-rose-500/30';
  const fillCol = isBuy 
    ? 'bg-gradient-to-r from-emerald-500/30 to-emerald-500/60' 
    : 'bg-gradient-to-r from-rose-500/30 to-rose-500/60';
  const thumbCol = isBuy
    ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
    : 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]';

  return (
    <div className="space-y-2 select-none w-full">
      <div
        ref={containerRef}
        className={`relative h-14 w-full rounded-2xl border ${borderCol} ${trackBg} p-1 overflow-hidden flex items-center shadow-inner transition-all backdrop-blur-sm`}
      >
        {/* Dynamic Progress Fill */}
        <motion.div
          className={`absolute left-0 top-0 bottom-0 rounded-2xl ${fillCol}`}
          style={{ width: fillWidth }}
        />

        {/* Shimmering Centered Instruction Text */}
        <motion.div
          style={{ opacity: textOpacity }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none gap-1.5"
        >
          <span className="text-xs font-black tracking-widest uppercase text-text-primary">
            Swipe to {isBuy ? 'Buy' : 'Sell'}
          </span>
          <ChevronsRight className={`w-4 h-4 animate-pulse ${isBuy ? 'text-emerald-400' : 'text-rose-400'}`} />
        </motion.div>

        {/* Draggable Thumb */}
        <motion.div
          drag={disabled || loading || isSuccess ? false : 'x'}
          dragConstraints={{ left: 0, right: maxDrag }}
          dragElastic={0.08}
          onDragEnd={handleDragEnd}
          style={{ x }}
          className={`relative z-10 h-12 w-12 rounded-xl ${thumbCol} flex items-center justify-center text-black cursor-grab active:cursor-grabbing shadow-md active:scale-95 transition-transform`}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-black" />
          ) : isSuccess ? (
            <Check className="w-5 h-5 text-black stroke-[3]" />
          ) : (
            <ChevronsRight className="w-5 h-5 text-black stroke-[2.5]" />
          )}
        </motion.div>
      </div>

      {/* Fallback Tap Option for Desktop / Mouse Users */}
      <div className="flex justify-between items-center px-1">
        <span className="text-[9px] text-text-secondary font-bold">
          {isSuccess ? 'Order submitted!' : 'Drag thumb right to execute'}
        </span>
        <button
          type="button"
          disabled={disabled || loading}
          onClick={() => {
            setIsSuccess(true);
            onConfirm();
          }}
          className="text-[9px] text-text-secondary hover:text-text-primary underline font-bold transition-colors cursor-pointer"
        >
          Or click to execute
        </button>
      </div>
    </div>
  );
}
