import { NextRequest, NextResponse } from 'next/server';
import { fetchStockChartFromAPI, generateMockChartData, quoteCache } from '@/lib/yahooFinance';

interface CacheEntry {
  data: any;
  timestamp: number;
}

// Global server-side memory cache for stock charts
const chartCache: Record<string, CacheEntry> = {};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const range = searchParams.get('range') || '1d';

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
  }

  const cleanSymbol = symbol.toUpperCase().trim();
  const cacheKey = `${cleanSymbol}_${range}`;
  const now = Date.now();

  // Intraday charts expire in 60s, historical charts in 2 hours
  const cacheDuration = range === '1d' ? 60000 : 7200000;
  let data: any = null;
  let triggerUpdate = false;

  const cached = chartCache[cacheKey];
  if (cached) {
    const age = now - cached.timestamp;
    if (age < cacheDuration) {
      data = cached.data;
    } else {
      data = cached.data;
      triggerUpdate = true;
    }
  }

  const fetchAndCacheChart = async () => {
    try {
      const freshData = await fetchStockChartFromAPI(cleanSymbol, range);
      chartCache[cacheKey] = {
        data: freshData,
        timestamp: Date.now()
      };
      return freshData;
    } catch (err: any) {
      console.warn(`Background chart fetch failed for ${cleanSymbol}:`, err.message);
      throw err;
    }
  };

  if (!data) {
    try {
      data = await fetchAndCacheChart();
    } catch (err: any) {
      console.warn(`Synchronous chart fetch failed for ${cleanSymbol}: ${err.message}`);
      const cachedQuote = quoteCache[cleanSymbol]?.data;
      const basePrice = cachedQuote?.regularMarketPrice;
      data = generateMockChartData(cleanSymbol, range, basePrice);
      triggerUpdate = true;
    }
  } else if (triggerUpdate) {
    fetchAndCacheChart().catch(() => {});
  }

  return NextResponse.json(data);
}
export const dynamic = 'force-dynamic';

