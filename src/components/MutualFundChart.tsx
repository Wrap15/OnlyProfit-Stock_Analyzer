'use client';

import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, UTCTimestamp, AreaSeries } from 'lightweight-charts';
import { useStockStore } from '@/store/useStockStore';

interface ChartPoint {
  time: number;
  value: number;
}

interface MutualFundChartProps {
  data: ChartPoint[];
  isPositive: boolean;
}

export default function MutualFundChart({ data, isPositive }: MutualFundChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const { theme } = useStockStore();

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    const container = chartContainerRef.current;
    const isDark = theme === 'dark';

    // Configure Chart
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
        timeVisible: false,
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

    // Color theme matching growth/decline
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

    // Parse data points
    const formattedData = data.map((pt) => ({
      time: pt.time as UTCTimestamp,
      value: pt.value,
    }));

    areaSeries.setData(formattedData);
    chart.timeScale().fitContent();

    // Responsive sizing observer
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0 || !entries[0].contentRect) return;
      const { width } = entries[0].contentRect;
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
      chart.applyOptions({
        width,
        height: isMobile ? 260 : 380,
      });
      chart.timeScale().fitContent();
    });

    resizeObserver.observe(container);

    // Cleanup on unmount or updates
    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [data, theme, isPositive]);

  return (
    <div className="w-full relative">
      <div ref={chartContainerRef} className="w-full h-[260px] sm:h-[380px]" />
    </div>
  );
}
