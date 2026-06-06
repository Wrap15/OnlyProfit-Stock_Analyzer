import { NextRequest, NextResponse } from 'next/server';
import { fetchStockQuoteFromAPI } from '@/lib/yahooFinance';

interface CacheEntry {
  data: any;
  timestamp: number;
}

// Global server-side memory cache
const quoteCache: Record<string, CacheEntry> = {};
const CACHE_DURATION = 15000; // 15 seconds cache duration

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get('symbols');

  if (!symbolsParam) {
    return NextResponse.json({ error: 'Symbols parameter is required' }, { status: 400 });
  }

  const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase());
  
  if (symbols.length === 0) {
    return NextResponse.json({ error: 'No valid symbols provided' }, { status: 400 });
  }

  try {
    const now = Date.now();
    const cachedData: any[] = [];
    const symbolsToFetch: string[] = [];

    // Check cache for each symbol individually
    for (const symbol of symbols) {
      const cached = quoteCache[symbol];
      if (cached && (now - cached.timestamp < CACHE_DURATION)) {
        cachedData.push(cached.data);
      } else {
        symbolsToFetch.push(symbol);
      }
    }

    // Fetch fresh quotes only for missing or expired symbols
    if (symbolsToFetch.length > 0) {
      const freshData = await fetchStockQuoteFromAPI(symbolsToFetch);
      for (const item of freshData) {
        quoteCache[item.symbol] = {
          data: item,
          timestamp: now
        };
        cachedData.push(item);
      }
    }

    // Map back to the original order of requested symbols
    const orderedData = symbols
      .map(s => cachedData.find(item => item.symbol === s))
      .filter(Boolean);

    return NextResponse.json(orderedData);
  } catch (error: any) {
    console.error('Failed to fetch stock quotes:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch stock quote' }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
