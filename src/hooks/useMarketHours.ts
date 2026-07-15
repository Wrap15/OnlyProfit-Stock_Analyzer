import { useState, useEffect } from 'react';
import { isIndianMarketOpen } from '@/lib/marketHours';

export interface MarketStatus {
  isOpen: boolean;
  label: string;
  className: string;
  dotColor: string;
  timeStr: string;
}

export function useMarketHours() {
  const [status, setStatus] = useState<MarketStatus>({
    isOpen: false,
    label: 'NSE MARKET CLOSED',
    className: 'text-text-secondary',
    dotColor: 'bg-text-secondary',
    timeStr: '',
  });

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });

      const isOpen = isIndianMarketOpen();
      let label = 'NSE MARKET CLOSED';
      let className = 'text-text-secondary';
      let dotColor = 'bg-text-secondary';

      if (isOpen) {
        label = 'NSE MARKET OPEN';
        className = 'text-profit font-black';
        dotColor = 'bg-profit animate-pulse';
      } else {
        const day = now.getDay();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const currentMin = hours * 60 + minutes;

        const isFridayNight = day === 5 && currentMin >= 15 * 60 + 30;
        const isWeekend = day === 6 || day === 0 || isFridayNight;

        if (isWeekend) {
          label = 'CLOSED • OPENS MONDAY 9:15 AM';
          className = 'text-rose-500/90 dark:text-rose-400 font-extrabold';
          dotColor = 'bg-rose-500';
        } else if (currentMin < 9 * 60 + 15) {
          label = 'CLOSED • OPENS TODAY 9:15 AM';
          className = 'text-amber-500/90 dark:text-amber-400 font-extrabold';
          dotColor = 'bg-amber-500';
        } else {
          label = 'CLOSED • OPENS TOMORROW 9:15 AM';
          className = 'text-text-secondary font-medium';
          dotColor = 'bg-text-secondary';
        }
      }

      setStatus({
        isOpen,
        label,
        className,
        dotColor,
        timeStr,
      });
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return status;
}
