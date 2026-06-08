'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, UTCTimestamp, AreaSeries, LineSeries, HistogramSeries } from 'lightweight-charts';
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
  const tooltipRef = useRef<HTMLDivElement>(null);
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

    // Create Volume Series (Histogram)
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // overlay
    });

    chart.priceScale('').applyOptions({
      scaleMargins: {
        top: 0.8, // Volume occupies bottom 20%
        bottom: 0,
      },
    });

    // Format data points for lightweight-charts
    const formattedData = data.map((pt) => ({
      time: pt.time as UTCTimestamp,
      value: pt.value,
    }));

    areaSeries.setData(formattedData);

    // Format volume data points
    const volumeData = data.map((pt, idx) => {
      const prevVal = idx > 0 ? data[idx - 1].value : pt.value;
      const isUp = pt.value >= prevVal;
      return {
        time: pt.time as UTCTimestamp,
        value: (pt as any).volume || 0,
        color: isUp ? 'rgba(16, 185, 129, 0.28)' : 'rgba(239, 68, 68, 0.28)', // profit green / loss red
      };
    });

    volumeSeries.setData(volumeData);

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

    // Subscribe to crosshair moves for custom floating HTML Tooltip
    const tooltip = tooltipRef.current;
    if (tooltip) {
      chart.subscribeCrosshairMove((param) => {
        if (
          param.point === undefined ||
          !param.time ||
          param.point.x < 0 ||
          param.point.x > container.clientWidth ||
          param.point.y < 0 ||
          param.point.y > container.clientHeight
        ) {
          tooltip.style.opacity = '0';
        } else {
          const dateStr = range === '1d' || range === '1w'
            ? new Date((param.time as number) * 1000).toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })
            : new Date((param.time as number) * 1000).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              });

          const priceData = param.seriesData.get(areaSeries);
          const volData = param.seriesData.get(volumeSeries);
          
          const price = priceData ? (priceData as any).value : null;
          const vol = volData ? (volData as any).value : null;

          if (price !== null) {
            tooltip.style.opacity = '1';
            
            const formatVal = (val: number) => {
              if (val >= 10000000) return `${(val / 10000000).toFixed(2)} Cr`;
              if (val >= 100000) return `${(val / 100000).toFixed(2)} L`;
              return val.toLocaleString('en-IN');
            };

            tooltip.innerHTML = `
              <div class="space-y-1.5 p-0.5">
                <div class="text-[9px] font-black text-text-secondary uppercase tracking-wider">${dateStr}</div>
                <div class="flex items-center justify-between gap-6">
                  <span class="text-text-secondary font-bold text-[10px]">Price:</span>
                  <span class="font-extrabold text-text-primary text-[10px]">₹${price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                ${vol !== null && vol !== undefined && vol > 0 ? `
                <div class="flex items-center justify-between gap-6">
                  <span class="text-text-secondary font-bold text-[10px]">Volume:</span>
                  <span class="font-extrabold text-text-primary text-[10px]">${formatVal(vol)}</span>
                </div>
                ` : ''}
              </div>
            `;

            const tooltipWidth = 160;
            const tooltipHeight = 65;
            const left = Math.min(
              container.clientWidth - tooltipWidth - 12,
              Math.max(12, param.point.x - tooltipWidth / 2)
            );
            const top = Math.min(
              container.clientHeight - tooltipHeight - 12,
              Math.max(12, param.point.y - tooltipHeight - 20)
            );

            tooltip.style.left = `${left}px`;
            tooltip.style.top = `${top}px`;
          } else {
            tooltip.style.opacity = '0';
          }
        }
      });
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
      <div className="w-full relative">
        <div ref={chartContainerRef} className="w-full h-[260px] sm:h-[380px]" />
        {/* Floating Custom HTML Tooltip */}
        <div
          ref={tooltipRef}
          className="absolute border border-border bg-card/95 backdrop-blur-sm px-3 py-2 rounded-xl shadow-premium dark:shadow-premium-dark pointer-events-none z-30 transition-all duration-75 text-xs opacity-0"
          style={{ pointerEvents: 'none' }}
        />
      </div>
    </div>
  );
}

