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
import { isIndianMarketOpen } from '@/lib/marketHours';
import { AreaChart, BarChart3, Maximize2, Minimize2, X, Sun, Moon } from 'lucide-react';

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
  range?: string;
  isPositive: boolean;
}

// ----------------------------------------------------
// Technical Indicator Mathematical Calculation Helpers
// ----------------------------------------------------

function calculateEMA(prices: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const ema: number[] = [];
  if (prices.length === 0) return [];
  let prevEma = prices[0];
  ema.push(prevEma);
  for (let i = 1; i < prices.length; i++) {
    const val = prices[i] * k + prevEma * (1 - k);
    ema.push(val);
    prevEma = val;
  }
  return ema;
}

export default function StockChart({ symbol, range, isPositive }: StockChartProps) {
  const mainChartContainerRef = useRef<HTMLDivElement>(null);
  const rsiChartContainerRef = useRef<HTMLDivElement>(null);
  const macdChartContainerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const mainSeriesRef = useRef<any>(null);
  const lastQuotePriceRef = useRef<number>(0);
  const lastTimestampRef = useRef<number>(0);
  const chartTypeRef = useRef<'area' | 'candlestick'>('area');

  const { theme, toggleTheme } = useStockStore();
  const [data, setData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);

  // Range and Fullscreen States
  const [activeRange, setActiveRange] = useState(range);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Overlay Indicator Toggles (Main Pane)
  const [showSMA, setShowSMA] = useState(false);
  const [showBB, setShowBB] = useState(false);
  const [showST, setShowST] = useState(false);

  // Sub-Panel Indicator Toggles (Secondary Panes)
  const [showRSI, setShowRSI] = useState(false);
  const [showMACD, setShowMACD] = useState(false);

  const [chartType, setChartType] = useState<'area' | 'candlestick'>('area');

  // Synchronize range prop changes with activeRange state
  useEffect(() => {
    setActiveRange(range);
  }, [range]);

  // Listen to Escape keypress to exit fullscreen, and lock scrolling
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsFullScreen(false);
      }
    }
    if (isFullScreen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isFullScreen]);

  // Keep chartType ref updated
  useEffect(() => {
    chartTypeRef.current = chartType;
  }, [chartType]);

  // Fetch chart data on symbol or activeRange changes
  useEffect(() => {
    async function fetchChartData() {
      try {
        setLoading(true);
        const res = await axios.get(`/api/stock/chart?symbol=${encodeURIComponent(symbol)}&range=${activeRange}`);
        const chartPoints = res.data || [];
        setData(chartPoints);
        
        // Sync starting price & timestamp refs
        if (chartPoints.length > 0) {
          const lastPoint = chartPoints[chartPoints.length - 1];
          lastQuotePriceRef.current = lastPoint.close || lastPoint.value || 0;
          lastTimestampRef.current = lastPoint.time;
        }
      } catch (err) {
        console.error('Failed to load chart data', err);
      } finally {
        setLoading(false);
      }
    }
    fetchChartData();
  }, [symbol, activeRange]);

  // Poll quote API every 3s during market hours to get actual live price updates
  useEffect(() => {
    if (loading || activeRange !== '1d') return;

    let active = true;
    async function fetchLiveQuote() {
      try {
        const res = await axios.get(`/api/stock/quote?symbols=${encodeURIComponent(symbol)}`);
        if (active && res.data && res.data.length > 0) {
          const q = res.data[0];
          lastQuotePriceRef.current = q.regularMarketPrice;
        }
      } catch (err) {
        console.warn('Live quote polling failed for chart:', err);
      }
    }

    fetchLiveQuote();
    const interval = setInterval(() => {
      if (isIndianMarketOpen()) {
        fetchLiveQuote();
      }
    }, 3000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [symbol, activeRange, loading]);

  // High-speed 400ms wiggler loop for wiggling & candle updates
  useEffect(() => {
    if (loading || activeRange !== '1d') return;

    const wiggler = setInterval(() => {
      if (!isIndianMarketOpen() || !mainSeriesRef.current || lastQuotePriceRef.current === 0) return;

      // 1. Simulate a tiny micro-fluctuation (random walk ±0.015%)
      const pct = (Math.random() - 0.495) * 0.00015;
      lastQuotePriceRef.current = lastQuotePriceRef.current * (1 + pct);
      const livePrice = parseFloat(lastQuotePriceRef.current.toFixed(2));

      // 2. Fetch current time and calculate if it is a new minute
      const nowSec = Math.floor(Date.now() / 1000);
      const lastPointTime = lastTimestampRef.current;
      const isNewMinute = nowSec - lastPointTime >= 60;

      if (isNewMinute) {
        // Roll over to next minute timestamp (standardized to 60s boundaries)
        const nextMinTime = lastPointTime + 60;
        lastTimestampRef.current = nextMinTime;
        
        if (chartTypeRef.current === 'candlestick') {
          mainSeriesRef.current.update({
            time: nextMinTime as UTCTimestamp,
            open: livePrice,
            high: livePrice,
            low: livePrice,
            close: livePrice
          });
        } else {
          mainSeriesRef.current.update({
            time: nextMinTime as UTCTimestamp,
            value: livePrice
          });
        }
      } else {
        // Update the current wiggling bar
        if (chartTypeRef.current === 'candlestick') {
          mainSeriesRef.current.update({
            time: lastPointTime as UTCTimestamp,
            open: livePrice, 
            high: livePrice, 
            low: livePrice,
            close: livePrice
          });
        } else {
          mainSeriesRef.current.update({
            time: lastPointTime as UTCTimestamp,
            value: livePrice
          });
        }
      }
    }, 400);

    return () => clearInterval(wiggler);
  }, [activeRange, loading]);

  // Handle instantiation & synchronization of all charts
  useEffect(() => {
    if (!mainChartContainerRef.current || data.length === 0 || loading) return;

    const isDark = theme === 'dark';

    // Sort and deduplicate data by timestamp (essential safeguard for lightweight-charts)
    const sortedData = [...data]
      .sort((a, b) => a.time - b.time)
      .filter((item, index, self) => index === 0 || item.time > self[index - 1].time);

    if (sortedData.length === 0) return;

    const mainContainer = mainChartContainerRef.current;
    
    // Clear previous raw containers to prevent duplicate appends
    mainContainer.innerHTML = '';
    if (rsiChartContainerRef.current) rsiChartContainerRef.current.innerHTML = '';
    if (macdChartContainerRef.current) macdChartContainerRef.current.innerHTML = '';

    const chartWidth = mainContainer.clientWidth;
    const upColor = '#10b981';
    const downColor = '#ef4444';

    const commonChartOptions = {
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
        timeVisible: activeRange === '1d' || activeRange === '5d' || activeRange === '1w',
        secondsVisible: false,
      },
      crosshair: {
        vertLine: {
          color: isDark ? 'rgba(148, 163, 184, 0.4)' : 'rgba(100, 116, 139, 0.3)',
          width: 1,
          style: 3,
        },
        horzLine: {
          color: isDark ? 'rgba(148, 163, 184, 0.4)' : 'rgba(100, 116, 139, 0.3)',
          width: 1,
          style: 3,
        },
      },
      width: chartWidth,
    };

    // ----------------------------------------------------
    // 1. Create Main Price Panel Chart
    // ----------------------------------------------------
    const mainChart = createChart(mainContainer, {
      ...commonChartOptions,
      height: typeof window !== 'undefined' && window.innerWidth < 640 ? 240 : 340,
    } as any);

    let mainSeries;
    if (chartType === 'candlestick') {
      mainSeries = mainChart.addSeries(CandlestickSeries, {
        upColor,
        downColor,
        borderUpColor: upColor,
        borderDownColor: downColor,
        wickUpColor: upColor,
        wickDownColor: downColor,
      });

      const formattedCandles = sortedData.map((pt) => ({
        time: pt.time as UTCTimestamp,
        open: pt.open !== undefined ? pt.open : pt.value,
        high: pt.high !== undefined ? pt.high : pt.value,
        low: pt.low !== undefined ? pt.low : pt.value,
        close: pt.close !== undefined ? pt.close : pt.value,
      }));
      mainSeries.setData(formattedCandles);
    } else {
      const strokeColor = isPositive ? '#10b981' : '#ef4444';
      mainSeries = mainChart.addSeries(AreaSeries, {
        lineColor: strokeColor,
        topColor: isPositive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
        bottomColor: 'rgba(0, 0, 0, 0)',
        lineWidth: 2,
      });

      const formattedData = sortedData.map((pt) => ({
        time: pt.time as UTCTimestamp,
        value: pt.value,
      }));
      mainSeries.setData(formattedData);
    }

    // Set series reference for high-speed updates
    mainSeriesRef.current = mainSeries;

    // Volume Overlay inside Main Chart
    const volumeSeries = mainChart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '', // overlay
    });
    mainChart.priceScale('').applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
    });
    const volumeData = sortedData.map((pt, idx) => {
      const openVal = pt.open !== undefined ? pt.open : (idx > 0 ? sortedData[idx - 1].value : pt.value);
      const closeVal = pt.close !== undefined ? pt.close : pt.value;
      const isUp = closeVal >= openVal;
      return {
        time: pt.time as UTCTimestamp,
        value: pt.volume || 0,
        color: isUp ? 'rgba(16, 185, 129, 0.18)' : 'rgba(239, 68, 68, 0.18)',
      };
    });
    volumeSeries.setData(volumeData);

    // SMA-20 Overlay
    let smaSeries: any;
    if (showSMA && sortedData.length >= 20) {
      const smaData = sortedData.map((pt, idx) => {
        if (idx < 19) {
          return { time: pt.time as UTCTimestamp, value: pt.value };
        }
        let sum = 0;
        for (let j = idx - 19; j <= idx; j++) {
          sum += sortedData[j].close ?? sortedData[j].value;
        }
        return { time: pt.time as UTCTimestamp, value: sum / 20 };
      });
      smaSeries = mainChart.addSeries(LineSeries, {
        color: '#f59e0b',
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      smaSeries.setData(smaData);
    }

    // Bollinger Bands (20, 2) Overlay
    let bbUpperSeries: any, bbLowerSeries: any, bbBasisSeries: any;
    if (showBB && sortedData.length >= 20) {
      const bbUpper = [];
      const bbLower = [];
      const bbBasis = [];

      for (let i = 0; i < sortedData.length; i++) {
        if (i < 19) {
          const val = sortedData[i].close ?? sortedData[i].value;
          bbUpper.push({ time: sortedData[i].time as UTCTimestamp, value: val });
          bbLower.push({ time: sortedData[i].time as UTCTimestamp, value: val });
          bbBasis.push({ time: sortedData[i].time as UTCTimestamp, value: val });
        } else {
          let sum = 0;
          for (let j = i - 19; j <= i; j++) {
            sum += sortedData[j].close ?? sortedData[j].value;
          }
          const mean = sum / 20;
          let varSum = 0;
          for (let j = i - 19; j <= i; j++) {
            const val = sortedData[j].close ?? sortedData[j].value;
            varSum += Math.pow(val - mean, 2);
          }
          const sd = Math.sqrt(varSum / 20);

          bbBasis.push({ time: sortedData[i].time as UTCTimestamp, value: mean });
          bbUpper.push({ time: sortedData[i].time as UTCTimestamp, value: mean + 2 * sd });
          bbLower.push({ time: sortedData[i].time as UTCTimestamp, value: mean - 2 * sd });
        }
      }

      bbBasisSeries = mainChart.addSeries(LineSeries, { color: 'rgba(245, 158, 11, 0.5)', lineWidth: 1, priceLineVisible: false });
      bbUpperSeries = mainChart.addSeries(LineSeries, { color: 'rgba(6, 182, 212, 0.7)', lineWidth: 1, priceLineVisible: false });
      bbLowerSeries = mainChart.addSeries(LineSeries, { color: 'rgba(6, 182, 212, 0.7)', lineWidth: 1, priceLineVisible: false });

      bbBasisSeries.setData(bbBasis);
      bbUpperSeries.setData(bbUpper);
      bbLowerSeries.setData(bbLower);
    }

    // SuperTrend (10, 1.5) Overlay
    let stSeries: any;
    const stValuesMap = new Map<number, { val: number; dir: number }>();
    if (showST && sortedData.length >= 10) {
      const tr: number[] = [sortedData[0].high! - sortedData[0].low!];
      for (let i = 1; i < sortedData.length; i++) {
        const high = sortedData[i].high ?? sortedData[i].value;
        const low = sortedData[i].low ?? sortedData[i].value;
        const prevClose = sortedData[i - 1].close ?? sortedData[i - 1].value;
        tr.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)));
      }

      const atr: number[] = [];
      let trSum = 0;
      for (let i = 0; i < 10; i++) trSum += tr[i];
      let prevAtr = trSum / 10;
      for (let i = 0; i < sortedData.length; i++) {
        if (i < 9) atr.push(tr[i]);
        else if (i === 9) atr.push(prevAtr);
        else {
          const curAtr = (prevAtr * 9 + tr[i]) / 10;
          atr.push(curAtr);
          prevAtr = curAtr;
        }
      }

      let trend = 1;
      let prevUpper = (sortedData[0].high! + sortedData[0].low!) / 2;
      let prevLower = prevUpper;
      const stDataPoints = [];

      for (let i = 0; i < sortedData.length; i++) {
        const high = sortedData[i].high ?? sortedData[i].value;
        const low = sortedData[i].low ?? sortedData[i].value;
        const close = sortedData[i].close ?? sortedData[i].value;
        const mid = (high + low) / 2;
        const mult = 1.5;

        const basicUpper = mid + mult * atr[i];
        const basicLower = mid - mult * atr[i];

        let finalUpper = basicUpper;
        let finalLower = basicLower;

        if (i > 0) {
          const prevCloseVal = sortedData[i - 1].close ?? sortedData[i - 1].value;
          finalUpper = basicUpper < prevUpper || prevCloseVal > prevUpper ? basicUpper : prevUpper;
          finalLower = basicLower > prevLower || prevCloseVal < prevLower ? basicLower : prevLower;
        }

        let stVal = finalUpper;
        if (i > 0) {
          if (trend === 1 && close < finalLower) {
            trend = -1;
            stVal = finalUpper;
          } else if (trend === -1 && close > finalUpper) {
            trend = 1;
            stVal = finalLower;
          } else {
            stVal = trend === 1 ? finalLower : finalUpper;
          }
        }

        stDataPoints.push({ time: sortedData[i].time as UTCTimestamp, value: stVal });
        stValuesMap.set(sortedData[i].time, { val: stVal, dir: trend });

        prevUpper = finalUpper;
        prevLower = finalLower;
      }

      stSeries = mainChart.addSeries(LineSeries, {
        color: '#10b981',
        lineWidth: 2,
        priceLineVisible: false,
      });

      stSeries.setData(stDataPoints);
    }

    // ----------------------------------------------------
    // 2. Create RSI Sub-Panel Chart (if enabled)
    // ----------------------------------------------------
    let rsiChart: any;
    let rsiSeries: any;
    const rsiValuesMap = new Map<number, number>();

    if (showRSI && rsiChartContainerRef.current) {
      rsiChart = createChart(rsiChartContainerRef.current, {
        ...commonChartOptions,
        height: 100,
      } as any);

      // Calculate RSI-14
      const gains: number[] = [];
      const losses: number[] = [];
      for (let i = 1; i < sortedData.length; i++) {
        const diff = (sortedData[i].close ?? sortedData[i].value) - (sortedData[i - 1].close ?? sortedData[i - 1].value);
        gains.push(diff > 0 ? diff : 0);
        losses.push(diff < 0 ? -diff : 0);
      }

      let avgGain = gains.slice(0, 14).reduce((a, b) => a + b, 0) / 14;
      let avgLoss = losses.slice(0, 14).reduce((a, b) => a + b, 0) / 14;
      const rsiPoints = [];

      for (let i = 0; i < sortedData.length; i++) {
        if (i < 13) {
          rsiPoints.push({ time: sortedData[i].time as UTCTimestamp, value: 50 });
          rsiValuesMap.set(sortedData[i].time, 50);
        } else if (i === 13) {
          const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
          const rsiVal = 100 - 100 / (1 + rs);
          rsiPoints.push({ time: sortedData[i].time as UTCTimestamp, value: rsiVal });
          rsiValuesMap.set(sortedData[i].time, rsiVal);
        } else {
          avgGain = (avgGain * 13 + gains[i - 1]) / 14;
          avgLoss = (avgLoss * 13 + losses[i - 1]) / 14;
          const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
          const rsiVal = 100 - 100 / (1 + rs);
          rsiPoints.push({ time: sortedData[i].time as UTCTimestamp, value: rsiVal });
          rsiValuesMap.set(sortedData[i].time, rsiVal);
        }
      }

      // Shading boundaries (Overbought 70, Oversold 30)
      const line30 = rsiChart.addSeries(LineSeries, { color: 'rgba(99, 102, 241, 0.3)', lineWidth: 1, priceLineVisible: false });
      const line70 = rsiChart.addSeries(LineSeries, { color: 'rgba(99, 102, 241, 0.3)', lineWidth: 1, priceLineVisible: false });
      line30.setData(sortedData.map(d => ({ time: d.time as UTCTimestamp, value: 30 })));
      line70.setData(sortedData.map(d => ({ time: d.time as UTCTimestamp, value: 70 })));

      rsiSeries = rsiChart.addSeries(LineSeries, {
        color: '#8b5cf6',
        lineWidth: 2,
        priceLineVisible: false,
      });
      rsiSeries.setData(rsiPoints);
    }

    // ----------------------------------------------------
    // 3. Create MACD Sub-Panel Chart (if enabled)
    // ----------------------------------------------------
    let macdChart: any;
    let macdLineSeries: any, macdSignalSeries: any, macdHistSeries: any;
    const macdValuesMap = new Map<number, { macd: number; signal: number; hist: number }>();

    if (showMACD && macdChartContainerRef.current) {
      macdChart = createChart(macdChartContainerRef.current, {
        ...commonChartOptions,
        height: 110,
      } as any);

      // Calculate MACD (12, 26, 9)
      const prices = sortedData.map(d => d.close ?? d.value);
      const ema12 = calculateEMA(prices, 12);
      const ema26 = calculateEMA(prices, 26);
      const macdLine: number[] = [];
      for (let i = 0; i < sortedData.length; i++) {
        macdLine.push(ema12[i] - ema26[i]);
      }
      const signalLine = calculateEMA(macdLine, 9);
      
      const macdPoints = [];
      const signalPoints = [];
      const histPoints = [];

      for (let i = 0; i < sortedData.length; i++) {
        const histVal = macdLine[i] - signalLine[i];
        macdPoints.push({ time: sortedData[i].time as UTCTimestamp, value: macdLine[i] });
        signalPoints.push({ time: sortedData[i].time as UTCTimestamp, value: signalLine[i] });
        histPoints.push({
          time: sortedData[i].time as UTCTimestamp,
          value: histVal,
          color: histVal >= 0 ? 'rgba(16, 185, 129, 0.6)' : 'rgba(239, 68, 68, 0.6)'
        });
        macdValuesMap.set(sortedData[i].time, { macd: macdLine[i], signal: signalLine[i], hist: histVal });
      }

      macdHistSeries = macdChart.addSeries(HistogramSeries, { priceLineVisible: false });
      macdLineSeries = macdChart.addSeries(LineSeries, { color: '#3b82f6', lineWidth: 1, priceLineVisible: false });
      macdSignalSeries = macdChart.addSeries(LineSeries, { color: '#f59e0b', lineWidth: 1, priceLineVisible: false });

      macdHistSeries.setData(histPoints);
      macdLineSeries.setData(macdPoints);
      macdSignalSeries.setData(signalPoints);
    }

    // ----------------------------------------------------
    // 4. Synchronize Multi-Pane Scrolling & Zooming
    // ----------------------------------------------------
    const allCharts = [
      mainChart,
      ...(rsiChart ? [rsiChart] : []),
      ...(macdChart ? [macdChart] : []),
    ];

    let isSyncing = false;
    allCharts.forEach((c) => {
      c.timeScale().subscribeVisibleLogicalRangeChange((logicalRange: any) => {
        if (isSyncing || !logicalRange) return;
        isSyncing = true;
        allCharts.forEach((target) => {
          if (target !== c) {
            target.timeScale().setVisibleLogicalRange(logicalRange);
          }
        });
        isSyncing = false;
      });
    });

    // Resize Observer for synchronized width adjustments
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0 || !entries[0].contentRect) return;
      const { width } = entries[0].contentRect;
      mainChart.applyOptions({ width });
      if (rsiChart) rsiChart.applyOptions({ width });
      if (macdChart) macdChart.applyOptions({ width });
      mainChart.timeScale().fitContent();
    });
    resizeObserver.observe(mainContainer);

    // ----------------------------------------------------
    // 5. Crosshair Sync & Integrated Floating Tooltip
    // ----------------------------------------------------
    const tooltip = tooltipRef.current;
    if (tooltip) {
      mainChart.subscribeCrosshairMove((param: any) => {
        if (
          !param.point ||
          !param.time ||
          param.point.x < 0 ||
          param.point.x > mainContainer.clientWidth ||
          param.point.y < 0 ||
          param.point.y > mainContainer.clientHeight
        ) {
          tooltip.style.opacity = '0';
        } else {
          const timestamp = param.time as number;
          const dateStr = activeRange === '1d' || activeRange === '5d' || activeRange === '1w'
            ? new Date(timestamp * 1000).toLocaleString('en-IN', {
                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
              })
            : new Date(timestamp * 1000).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric',
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
                <div class="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-1 border-b border-border/20 pb-1.5 mb-1.5">
                  <div class="flex justify-between gap-2 text-[10px]">
                    <span class="text-text-secondary font-bold">O:</span>
                    <span class="font-extrabold text-text-primary">₹${candle.open.toFixed(2)}</span>
                  </div>
                  <div class="flex justify-between gap-2 text-[10px]">
                    <span class="text-text-secondary font-bold">H:</span>
                    <span class="font-extrabold text-profit">₹${candle.high.toFixed(2)}</span>
                  </div>
                  <div class="flex justify-between gap-2 text-[10px]">
                    <span class="text-text-secondary font-bold">L:</span>
                    <span class="font-extrabold text-loss">₹${candle.low.toFixed(2)}</span>
                  </div>
                  <div class="flex justify-between gap-2 text-[10px]">
                    <span class="text-text-secondary font-bold">C:</span>
                    <span class="font-extrabold text-text-primary">₹${candle.close.toFixed(2)}</span>
                  </div>
                </div>
              `;
            } else {
              const areaPt = seriesData as any;
              priceContent = `
                <div class="flex items-center justify-between gap-6 mt-1 border-b border-border/20 pb-1.5 mb-1.5">
                  <span class="text-text-secondary font-bold text-[10px]">Price:</span>
                  <span class="font-extrabold text-text-primary text-[10px]">₹${areaPt.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              `;
            }

            // Indicator Specific Tooltip data
            let indicatorsContent = '';
            if (showSMA && param.seriesData.get(smaSeries)) {
              const smaVal = (param.seriesData.get(smaSeries) as any).value;
              indicatorsContent += `
                <div class="flex items-center justify-between gap-4 text-[10px] text-amber-500 font-bold">
                  <span>SMA (20):</span>
                  <span>₹${smaVal.toFixed(2)}</span>
                </div>
              `;
            }
            if (showBB && param.seriesData.get(bbBasisSeries)) {
              const upperVal = (param.seriesData.get(bbUpperSeries) as any).value;
              const basisVal = (param.seriesData.get(bbBasisSeries) as any).value;
              const lowerVal = (param.seriesData.get(bbLowerSeries) as any).value;
              indicatorsContent += `
                <div class="flex items-center justify-between gap-4 text-[10px] text-cyan-400 font-bold">
                  <span>BB (20, 2):</span>
                  <span>[${lowerVal.toFixed(1)}, ${basisVal.toFixed(1)}, ${upperVal.toFixed(1)}]</span>
                </div>
              `;
            }
            if (showST && stValuesMap.has(timestamp)) {
              const st = stValuesMap.get(timestamp)!;
              indicatorsContent += `
                <div class="flex items-center justify-between gap-4 text-[10px] ${st.dir === 1 ? 'text-emerald-500' : 'text-rose-500'} font-bold">
                  <span>SuperTrend:</span>
                  <span>₹${st.val.toFixed(2)}</span>
                </div>
              `;
            }
            if (showRSI && rsiValuesMap.has(timestamp)) {
              const rsiVal = rsiValuesMap.get(timestamp)!;
              indicatorsContent += `
                <div class="flex items-center justify-between gap-4 text-[10px] text-purple-400 font-bold">
                  <span>RSI (14):</span>
                  <span>${rsiVal.toFixed(2)}</span>
                </div>
              `;
            }
            if (showMACD && macdValuesMap.has(timestamp)) {
              const macdVal = macdValuesMap.get(timestamp)!;
              indicatorsContent += `
                <div class="flex items-center justify-between gap-4 text-[10px] text-blue-400 font-bold">
                  <span>MACD:</span>
                  <span>${macdVal.macd.toFixed(2)} (Sig: ${macdVal.signal.toFixed(2)})</span>
                </div>
              `;
            }

            tooltip.innerHTML = `
              <div class="space-y-1 p-0.5">
                <div class="text-[9px] font-black text-text-secondary uppercase tracking-wider">${dateStr}</div>
                ${priceContent}
                ${vol !== null && vol !== undefined && vol > 0 ? `
                <div class="flex items-center justify-between gap-6 text-[10px]">
                  <span class="text-text-secondary font-bold">Volume:</span>
                  <span class="font-extrabold text-text-primary">${formatVal(vol)}</span>
                </div>
                ` : ''}
                ${indicatorsContent ? `<div class="border-t border-border/20 pt-1.5 mt-1.5 space-y-1">${indicatorsContent}</div>` : ''}
              </div>
            `;

            const tooltipWidth = 200;
            const tooltipHeight = 150;
            const left = Math.min(
              mainContainer.clientWidth - tooltipWidth - 12,
              Math.max(12, param.point.x - tooltipWidth / 2)
            );
            const top = Math.min(
              mainContainer.clientHeight - tooltipHeight - 12,
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

    mainChart.timeScale().fitContent();

    return () => {
      resizeObserver.disconnect();
      mainChart.remove();
      if (rsiChart) rsiChart.remove();
      if (macdChart) macdChart.remove();
    };
  }, [data, theme, isPositive, loading, activeRange, showSMA, showBB, showST, showRSI, showMACD, chartType]);

  if (loading) {
    return (
      <div className="w-full h-[320px] sm:h-[420px] bg-card rounded-2xl border border-border flex items-center justify-center animate-pulse">
        <div className="flex flex-col items-center gap-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-profit border-t-transparent" />
          <span className="text-xs text-text-secondary font-bold">Loading premium technical chart...</span>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full h-[320px] sm:h-[420px] bg-card rounded-2xl border border-border flex items-center justify-center text-sm text-text-secondary font-bold">
        No chart data available for this range
      </div>
    );
  }

  return (
    <div className={`w-full flex flex-col gap-4 bg-card/25 border border-border/80 p-4 sm:p-5 rounded-3xl backdrop-blur-md shadow-premium ${
      isFullScreen 
        ? 'fixed inset-0 bg-[#0b0c10] border-none rounded-none z-50 p-6 flex flex-col gap-6 overflow-y-auto' 
        : ''
    }`}>
      
      {/* Immersive Header inside Fullscreen Mode */}
      {isFullScreen && (
        <div className="flex items-center justify-between border-b border-border/40 pb-3 gap-4 select-none">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-profit/10 border border-profit/25 text-profit rounded-xl font-black text-xs uppercase tracking-wider animate-pulse">
              LIVE FEED
            </span>
            <div>
              <h1 className="text-base font-extrabold text-text-primary uppercase tracking-tight flex items-center gap-1.5">
                {symbol.split('.')[0]} Trajectory Chart
              </h1>
              <p className="text-[10px] text-text-secondary font-bold flex items-center gap-1">
                <span>Power by OnlyProfit Data Feed • Press</span>
                <kbd className="px-1 py-0.5 rounded bg-card border border-border text-[9px] font-mono">ESC</kbd>
                <span>or click Close to exit</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 border border-border bg-card/60 text-text-secondary hover:text-text-primary rounded-xl transition-all cursor-pointer flex items-center justify-center"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="h-4.5 w-4.5 text-amber-500" /> : <Moon className="h-4.5 w-4.5 text-indigo-500" />}
            </button>
            <button
              onClick={() => setIsFullScreen(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 hover:text-rose-400 rounded-xl transition-all cursor-pointer text-xs font-black uppercase tracking-wider border border-rose-500/20 shadow-sm"
            >
              <X className="h-4 w-4" />
              <span>Close</span>
            </button>
          </div>
        </div>
      )}

      {/* Chart toolbar containing internal range bar and fullscreen controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 select-none z-10 border-b border-border/40 pb-3">
        
        {/* Left Side: Standardized intervals separated directly inside the chart */}
        <div className="flex items-center gap-1.5 p-0.5 bg-background border border-border rounded-xl">
          {[
            { label: '1D', value: '1d' },
            { label: '5D', value: '5d' },
            { label: '1M', value: '1m' },
            { label: '6M', value: '6m' },
            { label: '1Y', value: '1y' },
            { label: '5Y', value: '5y' },
            { label: 'MAX', value: 'max' }
          ].map((r) => (
            <button
              key={r.value}
              onClick={() => setActiveRange(r.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 active:scale-95 cursor-pointer ${
                activeRange === r.value
                  ? 'bg-card text-profit shadow-sm font-extrabold border border-border'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Right Side: Type, Indicators overlays and Full Screen control button */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Chart Type Toggle */}
          <div className="flex items-center gap-1.5 p-0.5 bg-background border border-border rounded-xl">
            <button
              onClick={() => setChartType('area')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                chartType === 'area'
                  ? 'bg-card text-profit shadow-sm font-black'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <AreaChart className="h-3.5 w-3.5" />
              <span>Line</span>
            </button>
            <button
              onClick={() => setChartType('candlestick')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                chartType === 'candlestick'
                  ? 'bg-card text-profit shadow-sm font-black'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Candle</span>
            </button>
          </div>

          {/* Technical Overlay Indicators */}
          {!symbol.startsWith('^') && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setShowSMA(!showSMA)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  showSMA
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                    : 'border-border/85 text-text-secondary bg-card/60 hover:text-text-primary'
                }`}
              >
                <span>SMA</span>
              </button>
              <button
                onClick={() => setShowBB(!showBB)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  showBB
                    ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                    : 'border-border/85 text-text-secondary bg-card/60 hover:text-text-primary'
                }`}
              >
                <span>BB</span>
              </button>
              <button
                onClick={() => setShowST(!showST)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  showST
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-450'
                    : 'border-border/85 text-text-secondary bg-card/60 hover:text-text-primary'
                }`}
              >
                <span>ST</span>
              </button>
              <button
                onClick={() => setShowRSI(!showRSI)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  showRSI
                    ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                    : 'border-border/85 text-text-secondary bg-card/60 hover:text-text-primary'
                }`}
              >
                <span>RSI</span>
              </button>
              <button
                onClick={() => setShowMACD(!showMACD)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  showMACD
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                    : 'border-border/85 text-text-secondary bg-card/60 hover:text-text-primary'
                }`}
              >
                <span>MACD</span>
              </button>
            </div>
          )}

          {/* Full Screen Toggle button */}
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-2 border border-border bg-card/60 text-text-secondary hover:text-text-primary rounded-xl transition-all cursor-pointer flex items-center justify-center"
            title={isFullScreen ? 'Exit Full Screen' : 'View Full Chart'}
          >
            {isFullScreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Chart Canvas Panels */}
      <div className="w-full relative flex flex-col gap-2">
        {/* Main Price Panel */}
        <div className="w-full relative">
          <div 
            ref={mainChartContainerRef} 
            style={{ height: isFullScreen ? '520px' : '340px' }} 
            className="w-full" 
          />
          
          {/* Floating Custom HTML Tooltip */}
          <div
            ref={tooltipRef}
            className="absolute border border-border bg-card/95 backdrop-blur-sm px-3 py-2 rounded-xl shadow-premium dark:shadow-premium-dark pointer-events-none z-30 transition-all duration-75 text-xs opacity-0"
            style={{ pointerEvents: 'none' }}
          />
        </div>

        {/* RSI Panel */}
        {showRSI && (
          <div className="w-full relative border-t border-border/40 pt-2 animate-slide-down">
            <div 
              ref={rsiChartContainerRef} 
              style={{ height: isFullScreen ? '130px' : '100px' }} 
              className="w-full" 
            />
          </div>
        )}

        {/* MACD Panel */}
        {showMACD && (
          <div className="w-full relative border-t border-border/40 pt-2 animate-slide-down">
            <div 
              ref={macdChartContainerRef} 
              style={{ height: isFullScreen ? '140px' : '110px' }} 
              className="w-full" 
            />
          </div>
        )}
      </div>
      
      {/* Chart Footer Indicator Info */}
      <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-text-secondary/60 select-none">
        <span>Powered by OnlyProfit Data Feed</span>
        <span>All calculations updated in Real-Time</span>
      </div>
    </div>
  );
}
