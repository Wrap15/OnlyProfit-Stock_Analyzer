import { NextRequest, NextResponse } from 'next/server';
import { fetchStockQuoteFromAPI, generateMockQuote } from '@/lib/yahooFinance';

interface CacheEntry {
  data: any;
  timestamp: number;
}

// Global server-side memory cache
const quoteCache: Record<string, CacheEntry> = {};
const FRESH_DURATION = 30000;   // 30 seconds fresh limit
const STALE_DURATION = 600000;  // 10 minutes stale allowed

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
    const symbolsToFetchSync: string[] = [];
    const symbolsToFetchAsync: string[] = [];

    // Check cache for each symbol individually
    for (const symbol of symbols) {
      const cached = quoteCache[symbol];
      if (cached) {
        const age = now - cached.timestamp;
        if (age < FRESH_DURATION) {
          // Fresh: use cached data directly
          cachedData.push(cached.data);
        } else if (age < STALE_DURATION) {
          // Stale but usable: use cached data and update in background
          cachedData.push(cached.data);
          symbolsToFetchAsync.push(symbol);
        } else {
          // Too stale: fetch synchronously for detail pages, otherwise serve stale + fetch in background
          if (symbols.length > 5) {
            cachedData.push(cached.data);
            symbolsToFetchAsync.push(symbol);
          } else {
            symbolsToFetchSync.push(symbol);
          }
        }
      } else {
        // Not cached: fetch synchronously for detail pages, otherwise serve mock + fetch in background
        if (symbols.length > 5) {
          const mockQuote = generateMockQuote(symbol);
          cachedData.push(mockQuote);
          symbolsToFetchAsync.push(symbol);
        } else {
          symbolsToFetchSync.push(symbol);
        }
      }
    }

    // 1. Fetch synchronously for symbols that need immediate real-world accuracy
    if (symbolsToFetchSync.length > 0) {
      const freshData = await fetchStockQuoteFromAPI(symbolsToFetchSync);
      for (const item of freshData) {
        quoteCache[item.symbol] = {
          data: item,
          timestamp: now
        };
        cachedData.push(item);
      }
    }

    // 2. Fetch asynchronously in the background for stale/missing bulk symbols
    if (symbolsToFetchAsync.length > 0) {
      fetchStockQuoteFromAPI(symbolsToFetchAsync)
        .then(freshData => {
          const updateTime = Date.now();
          for (const item of freshData) {
            quoteCache[item.symbol] = {
              data: item,
              timestamp: updateTime
            };
          }
        })
        .catch(err => {
          console.warn('Background quote prefetch failed:', err);
        });
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
