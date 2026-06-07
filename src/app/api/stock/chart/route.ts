import { NextRequest, NextResponse } from 'next/server';
import { fetchStockChartFromAPI } from '@/lib/yahooFinance';

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

  const cached = chartCache[cacheKey];
  if (cached && (now - cached.timestamp < cacheDuration)) {
    return NextResponse.json(cached.data);
  }

  try {
    const data = await fetchStockChartFromAPI(cleanSymbol, range);
    
    // Store in memory cache
    chartCache[cacheKey] = {
      data,
      timestamp: now
    };

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch stock chart data' }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';

