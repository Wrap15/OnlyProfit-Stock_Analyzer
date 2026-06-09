'use client';

import React, { useEffect, useRef, useState } from 'react';
import { 
  createChart, 
  ColorType, 
  UTCTimestamp, 
  AreaSeries, 
  LineSeries, 
  HistogramSeries, 
  CandlestickSeries 
} from 'lightweight-charts';
import { useStockStore } from '@/store/useStockStore';
import { apiClient as axios } from '@/lib/apiClient';
import { AreaChart, BarChart3, Activity } from 'lucide-react';

interface ChartPoint {
  time: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  value: number;
  volume?: number;
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
  const [chartType, setChartType] = useState<'area' | 'candlestick'>('area');

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
        vertLines: { color: isDark ? 'rgba(30, 41, 59, 0.3)' : 'rgba(226, 232, 240, 0.4)' },
        horzLines: { color: isDark ? 'rgba(30, 41, 59, 0.3)' : 'rgba(226, 232, 240, 0.4)' },
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
          color: isDark ? 'rgba(148, 163, 184, 0.4)' : 'rgba(100, 116, 139, 0.3)',
          width: 1,
          style: 3, // dashed
        },
        horzLine: {
          color: isDark ? 'rgba(148, 163, 184, 0.4)' : 'rgba(100, 116, 139, 0.3)',
          width: 1,
          style: 3, // dashed
        },
      },
      width: container.clientWidth,
      height: typeof window !== 'undefined' && window.innerWidth < 640 ? 280 : 420,
    });

    let mainSeries: any;

    const upColor = '#10b981';
    const downColor = '#ef4444';

    if (chartType === 'candlestick') {
      mainSeries = chart.addSeries(CandlestickSeries, {
        upColor,
        downColor,
        borderUpColor: upColor,
        borderDownColor: downColor,
        wickUpColor: upColor,
        wickDownColor: downColor,
      });

      const formattedCandles = data.map((pt) => ({
        time: pt.time as UTCTimestamp,
        open: pt.open !== undefined ? pt.open : pt.value,
        high: pt.high !== undefined ? pt.high : pt.value,
        low: pt.low !== undefined ? pt.low : pt.value,
        close: pt.close !== undefined ? pt.close : pt.value,
      }));

      mainSeries.setData(formattedCandles);
    } else {
      const strokeColor = isPositive ? '#10b981' : '#ef4444';
      mainSeries = chart.addSeries(AreaSeries, {
        lineColor: strokeColor,
        topColor: isPositive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
        bottomColor: 'rgba(0, 0, 0, 0)',
        lineWidth: 2,
        priceFormat: {
          type: 'price',
          precision: 2,
          minMove: 0.01,
        },
      });

      const formattedData = data.map((pt) => ({
        time: pt.time as UTCTimestamp,
        value: pt.value,
      }));

      mainSeries.setData(formattedData);
    }

    // Create Volume Series (Histogram)
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // overlay
    });

    chart.priceScale('').applyOptions({
      scaleMargins: {
        top: 0.82, // Volume occupies bottom 18%
        bottom: 0,
      },
    });

    // Format volume data points
    const volumeData = data.map((pt, idx) => {
      const openVal = pt.open !== undefined ? pt.open : (idx > 0 ? data[idx - 1].value : pt.value);
      const closeVal = pt.close !== undefined ? pt.close : pt.value;
      const isUp = closeVal >= openVal;
      return {
        time: pt.time as UTCTimestamp,
        value: pt.volume || 0,
        color: isUp ? 'rgba(16, 185, 129, 0.18)' : 'rgba(239, 68, 68, 0.18)',
      };
    });

    volumeSeries.setData(volumeData);

    // Calculate and Overlay SMA (20-day)
    let smaSeries: any;
    if (showSMA && data.length >= 5) {
      const smaData = [];
      for (let i = 0; i < data.length; i++) {
        if (i < 19) {
          let sum = 0;
          for (let j = 0; j <= i; j++) {
            sum += data[j].close !== undefined ? data[j].close! : data[j].value;
          }
          smaData.push({
            time: data[i].time as UTCTimestamp,
            value: parseFloat((sum / (i + 1)).toFixed(2))
          });
        } else {
          let sum = 0;
          for (let j = i - 19; j <= i; j++) {
            sum += data[j].close !== undefined ? data[j].close! : data[j].value;
          }
          smaData.push({
            time: data[i].time as UTCTimestamp,
            value: parseFloat((sum / 20).toFixed(2))
          });
        }
      }

      smaSeries = chart.addSeries(LineSeries, {
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

          const seriesData = param.seriesData.get(mainSeries);
          const volData = param.seriesData.get(volumeSeries);
          const vol = volData ? (volData as any).value : null;

          if (seriesData) {
            tooltip.style.opacity = '1';
            
            const formatVal = (val: number) => {
              if (val >= 10000000) return `${(val / 10000000).toFixed(2)} Cr`;
              if (val >= 100000) return `${(val / 100000).toFixed(2)} L`;
              return val.toLocaleString('en-IN');
            };

            let priceContent = '';
            if (chartType === 'candlestick') {
              const candle = seriesData as any;
              priceContent = `
                <div class="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-1">
                  <div class="flex justify-between gap-2 text-[10px]">
                    <span class="text-text-secondary font-medium">Open:</span>
                    <span class="font-bold text-text-primary">₹${candle.open.toFixed(2)}</span>
                  </div>
                  <div class="flex justify-between gap-2 text-[10px]">
                    <span class="text-text-secondary font-medium">High:</span>
                    <span class="font-bold text-profit">₹${candle.high.toFixed(2)}</span>
                  </div>
                  <div class="flex justify-between gap-2 text-[10px]">
                    <span class="text-text-secondary font-medium">Low:</span>
                    <span class="font-bold text-loss">₹${candle.low.toFixed(2)}</span>
                  </div>
                  <div class="flex justify-between gap-2 text-[10px]">
                    <span class="text-text-secondary font-medium">Close:</span>
                    <span class="font-bold text-text-primary">₹${candle.close.toFixed(2)}</span>
                  </div>
                </div>
              `;
            } else {
              const areaPt = seriesData as any;
              priceContent = `
                <div class="flex items-center justify-between gap-6 mt-1">
                  <span class="text-text-secondary font-bold text-[10px]">Price:</span>
                  <span class="font-extrabold text-text-primary text-[10px]">₹${areaPt.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              `;
            }

            tooltip.innerHTML = `
              <div class="space-y-1 p-0.5">
                <div class="text-[9px] font-black text-text-secondary uppercase tracking-wider">${dateStr}</div>
                ${priceContent}
                ${vol !== null && vol !== undefined && vol > 0 ? `
                <div class="flex items-center justify-between gap-6 pt-1 border-t border-border/30 mt-1">
                  <span class="text-text-secondary font-bold text-[10px]">Volume:</span>
                  <span class="font-extrabold text-text-primary text-[10px]">${formatVal(vol)}</span>
                </div>
                ` : ''}
              </div>
            `;

            const tooltipWidth = 180;
            const tooltipHeight = chartType === 'candlestick' ? 95 : 65;
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
        height: isMobile ? 280 : 420
      });
      chart.timeScale().fitContent();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [data, theme, isPositive, loading, range, showSMA, chartType]);

  if (loading) {
    return (
      <div className="w-full h-[280px] sm:h-[420px] bg-card rounded-2xl border border-border flex items-center justify-center animate-pulse">
        <div className="flex flex-col items-center gap-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-profit border-t-transparent" />
          <span className="text-xs text-text-secondary font-bold">Loading chart data...</span>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full h-[280px] sm:h-[420px] bg-card rounded-2xl border border-border flex items-center justify-center text-sm text-text-secondary font-bold">
        No chart data available for this range
      </div>
    );
  }

  return (
    <div className="w-full relative flex flex-col gap-3">
      {/* Chart toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 select-none z-10 -mb-2">
        <div className="flex items-center gap-1.5 p-0.5 bg-background border border-border rounded-xl">
          <button
            onClick={() => setChartType('area')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              chartType === 'area'
                ? 'bg-card text-profit shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <AreaChart className="h-3.5 w-3.5" />
            <span>Line</span>
          </button>
          <button
            onClick={() => setChartType('candlestick')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              chartType === 'candlestick'
                ? 'bg-card text-profit shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Candle</span>
          </button>
        </div>

        {!symbol.startsWith('^') && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSMA(!showSMA)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                showSMA
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-500 shadow-sm'
                  : 'border-border/80 text-text-secondary bg-card hover:text-text-primary hover:bg-background'
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>SMA-20</span>
            </button>
          </div>
        )}
      </div>

      <div className="w-full relative">
        <div ref={chartContainerRef} className="w-full h-[280px] sm:h-[420px]" />
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
