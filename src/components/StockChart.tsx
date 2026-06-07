'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, UTCTimestamp, AreaSeries, LineSeries } from 'lightweight-charts';
import { useStockStore } from '@/store/useStockStore';
import axios from 'axios';

interface ChartPoint {
  time: number;
  value: number;
}

interface StockChartProps {
  symbol: string;
  range: string;
  isPositive: boolean;
}

export default function StockChart({ symbol, range, isPositive }: StockChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const { theme } = useStockStore();
  const [data, setData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSMA, setShowSMA] = useState(false);

  // Fetch chart data on symbol or range changes
  useEffect(() => {
    async function fetchChartData() {
      try {
        setLoading(true);
        const res = await axios.get(`/api/stock/chart?symbol=${encodeURIComponent(symbol)}&range=${range}`);
        setData(res.data || []);
      } catch (err) {
        console.error('Failed to load chart data', err);
      } finally {
        setLoading(false);
      }
    }

    fetchChartData();
  }, [symbol, range]);

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0 || loading) return;

    const container = chartContainerRef.current;
    const isDark = theme === 'dark';

    // Chart Options
    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: isDark ? '#94a3b8' : '#64748b',
        fontFamily: 'Inter, sans-serif',
      },
      grid: {
        vertLines: { color: isDark ? 'rgba(31, 41, 55, 0.4)' : 'rgba(226, 232, 240, 0.6)' },
        horzLines: { color: isDark ? 'rgba(31, 41, 55, 0.4)' : 'rgba(226, 232, 240, 0.6)' },
      },
      rightPriceScale: {
        borderVisible: false,
        textColor: isDark ? '#94a3b8' : '#64748b',
      },
      timeScale: {
        borderVisible: false,
        timeVisible: range === '1d', // show time for intraday
        secondsVisible: false,
      },
      crosshair: {
        vertLine: {
          color: isDark ? '#475569' : '#cbd5e1',
          width: 1,
          style: 3, // dashed
        },
        horzLine: {
          color: isDark ? '#475569' : '#cbd5e1',
          width: 1,
          style: 3, // dashed
        },
      },
      width: container.clientWidth,
      height: typeof window !== 'undefined' && window.innerWidth < 640 ? 260 : 380,
    });

    // Create Area Series
    const strokeColor = isPositive ? '#00c853' : '#ff5252';
    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: strokeColor,
      topColor: isPositive ? 'rgba(0, 200, 83, 0.15)' : 'rgba(255, 82, 82, 0.15)',
      bottomColor: isPositive ? 'rgba(0, 200, 83, 0.0)' : 'rgba(255, 82, 82, 0.0)',
      lineWidth: 2,
      priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.01,
      },
    });


    // Format data points for lightweight-charts
    const formattedData = data.map((pt) => ({
      time: pt.time as UTCTimestamp,
      value: pt.value,
    }));


    areaSeries.setData(formattedData);

    // Calculate and Overlay SMA (20-day)
    if (showSMA && data.length >= 5) {
      const smaData = [];
      for (let i = 0; i < data.length; i++) {
        if (i < 19) {
          // Average of available prices for the initial points
          let sum = 0;
          for (let j = 0; j <= i; j++) {
            sum += data[j].value;
          }
          smaData.push({
            time: data[i].time as UTCTimestamp,
            value: parseFloat((sum / (i + 1)).toFixed(2))
          });
        } else {
          // 20-day rolling average
          let sum = 0;
          for (let j = i - 19; j <= i; j++) {
            sum += data[j].value;
          }
          smaData.push({
            time: data[i].time as UTCTimestamp,
            value: parseFloat((sum / 20).toFixed(2))
          });
        }
      }

      const smaSeries = chart.addSeries(LineSeries, {
        color: '#6366f1', // Indigo-500
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      smaSeries.setData(smaData);
    }

    chart.timeScale().fitContent();

    // Resize Observer for Responsiveness
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0 || !entries[0].contentRect) return;
      const { width } = entries[0].contentRect;
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
      chart.applyOptions({ 
        width,
        height: isMobile ? 260 : 380
      });
      chart.timeScale().fitContent();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [data, theme, isPositive, loading, range, showSMA]);

  if (loading) {
    return (
      <div className="w-full h-[260px] sm:h-[380px] bg-card rounded-2xl border border-border flex items-center justify-center animate-pulse">
        <div className="flex flex-col items-center gap-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-profit border-t-transparent" />
          <span className="text-xs text-text-secondary font-bold">Loading chart data...</span>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full h-[260px] sm:h-[380px] bg-card rounded-2xl border border-border flex items-center justify-center text-sm text-text-secondary font-bold">
        No chart data available for this range
      </div>
    );
  }

  return (
    <div className="w-full relative flex flex-col gap-3">
      {!symbol.startsWith('^') && (
        <div className="flex items-center gap-2 self-end text-xs font-bold text-text-secondary select-none z-10">
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-text-primary transition-colors">
            <input
              type="checkbox"
              checked={showSMA}
              onChange={(e) => setShowSMA(e.target.checked)}
              className="rounded border-border text-profit focus:ring-profit/20 h-3.5 w-3.5"
            />
            <span>SMA-20 Overlay</span>
          </label>
        </div>
      )}
      <div ref={chartContainerRef} className="w-full h-[260px] sm:h-[380px]" />
    </div>
  );
}

