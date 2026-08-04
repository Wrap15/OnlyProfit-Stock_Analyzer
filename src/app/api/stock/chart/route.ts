import { NextRequest, NextResponse } from 'next/server';
import { fetchStockChartFromAPI, generateMockChartData, quoteCache } from '@/lib/yahooFinance';

export const dynamic = 'force-dynamic';

interface CacheEntry {
  data: any;
  timestamp: number;
}

// Global server-side memory cache for stock charts
const chartCache: Record<string, CacheEntry> = {};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  let range = searchParams.get('range') || '1d';
  if (range === '5d' || range === '1w') range = '1w';
  if (range === '1m' || range === '1mo') range = '1mo';
  if (range === '6m' || range === '6mo') range = '6mo';

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
  }

  let cleanSymbol = symbol.toUpperCase().trim();
  if (!cleanSymbol.startsWith('^') && !cleanSymbol.endsWith('.NS') && !cleanSymbol.endsWith('.BO') && !/^\d+$/.test(cleanSymbol)) {
    cleanSymbol = `${cleanSymbol}.NS`;
  }
  const cacheKey = `${cleanSymbol}_${range}`;
  const now = Date.now();

  // Intraday charts expire in 15s, historical charts in 2 hours
  const cacheDuration = range === '1d' ? 15000 : 7200000;
  let data: any = null;
  let triggerUpdate = false;

  const cached = chartCache[cacheKey];
  if (cached) {
    const age = now - cached.timestamp;
    if (age < cacheDuration) {
      data = cached.data;
    } else {
      if (range === '1d') {
        // For intraday, fetch synchronously to ensure live real-world ticks with zero cache delay
        data = null;
      } else {
        data = cached.data;
        triggerUpdate = true;
      }
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

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'no-store, max-age=0, must-revalidate'
    }
  });
}
