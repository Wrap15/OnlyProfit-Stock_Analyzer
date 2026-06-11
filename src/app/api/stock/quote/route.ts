import { NextRequest, NextResponse } from 'next/server';
import { fetchStockQuoteFromAPI, fetchCompanyProfileFromAPI, generateMockQuote, MOCK_STOCK_INFO } from '@/lib/yahooFinance';

interface CacheEntry {
  data: any;
  timestamp: number;
}

// Global server-side memory cache
const quoteCache: Record<string, CacheEntry> = {};
const FRESH_DURATION = 2000;    // 2 seconds fresh limit for near real-time pricing
const STALE_DURATION = 600000;  // 10 minutes stale allowed

function mergeProfileIntoQuote(item: any, profile: any) {
  if (!profile) return;
  item.sector = profile.sector || item.sector;
  item.industry = profile.industry || item.industry;
  item.longBusinessSummary = profile.desc || item.longBusinessSummary;
  item.website = profile.website || item.website;
  item.headquarters = profile.headquarters || item.headquarters;
  if (profile.leadership && profile.leadership.length > 0) {
    item.leadership = profile.leadership;
  }
  if (profile.ceo && profile.ceo !== 'N/A') {
    item.ceo = profile.ceo;
  }
  if (profile.ratios) {
    item.trailingPE = profile.ratios.pe ?? item.trailingPE;
    item.priceToBook = profile.ratios.pb ?? item.priceToBook;
    item.dividendYield = profile.ratios.divYield ?? item.dividendYield;
    item.epsTrailingTwelveMonths = profile.ratios.eps ?? item.epsTrailingTwelveMonths;
    item.roe = profile.ratios.roe ?? item.roe;
    item.sectorPE = profile.ratios.indpe ?? item.sectorPE;
    item.sectorPB = profile.ratios.indpb ?? item.sectorPB;
    item.fiftyTwoWeekHigh = profile.ratios.high52w ?? item.fiftyTwoWeekHigh;
    item.fiftyTwoWeekLow = profile.ratios.low52w ?? item.fiftyTwoWeekLow;
    if (profile.ratios.marketCap) {
      item.marketCap = profile.ratios.marketCap * 10000000; // Tickertape marketCap is in Crores, convert to INR
    }
  }
  if (profile.holdings) {
    item.holdings = profile.holdings;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get('symbols');

  if (!symbolsParam) {
    return NextResponse.json({ error: 'Symbols parameter is required' }, { status: 400 });
  }

  const symbols = symbolsParam.split(',').map(s => {
    let clean = s.trim().toUpperCase();
    if (!clean.startsWith('^') && !clean.endsWith('.NS') && !clean.endsWith('.BO') && !/^\d+$/.test(clean)) {
      clean = `${clean}.NS`;
    }
    return clean;
  });
  
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
        // Not cached: fetch synchronously to ensure real-world data is served on first load
        symbolsToFetchSync.push(symbol);
      }
    }

    // 1. Fetch with a 1000ms timeout budget for cache misses
    if (symbolsToFetchSync.length > 0) {
      const freshData = await Promise.race([
        fetchStockQuoteFromAPI(symbolsToFetchSync).then(async (data) => {
          if (symbols.length === 1) {
            const promises = data.map(async (item) => {
              try {
                const profile = await fetchCompanyProfileFromAPI(item.symbol);
                mergeProfileIntoQuote(item, profile);
              } catch {}
            });
            await Promise.all(promises);
          }
          return data;
        }),
        new Promise<any[]>((_, reject) => setTimeout(() => reject(new Error('timeout')), 1000))
      ]).catch((err) => {
        console.warn(`Synchronous quote fetch failed or timed out for ${symbolsToFetchSync.join(',')}: ${err.message}`);
        symbolsToFetchAsync.push(...symbolsToFetchSync);
        return [];
      });

      const fetchedSymbols = new Set<string>();
      if (freshData && freshData.length > 0) {
        for (const item of freshData) {
          quoteCache[item.symbol] = {
            data: item,
            timestamp: Date.now()
          };
          cachedData.push(item);
          fetchedSymbols.add(item.symbol);
        }
      }

      // Return mock quotes immediately for symbols that timed out
      const missingSymbols = symbolsToFetchSync.filter(s => !fetchedSymbols.has(s));
      if (missingSymbols.length > 0) {
        for (const symbol of missingSymbols) {
          const mockQuote = generateMockQuote(symbol);
          const customMeta = MOCK_STOCK_INFO[symbol] || {};
          const item = {
            ...mockQuote,
            longBusinessSummary: customMeta.desc || mockQuote.longBusinessSummary,
            sector: customMeta.sector || mockQuote.sector
          };
          cachedData.push(item);
        }
      }
    }

    // 2. Fetch asynchronously in the background for stale/missing bulk symbols
    if (symbolsToFetchAsync.length > 0) {
      fetchStockQuoteFromAPI(symbolsToFetchAsync)
        .then(async (freshData) => {
          const updateTime = Date.now();
          for (const item of freshData) {
            if (symbols.length === 1) {
              try {
                const profile = await fetchCompanyProfileFromAPI(item.symbol);
                mergeProfileIntoQuote(item, profile);
              } catch {}
            }

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
