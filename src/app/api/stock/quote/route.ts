import { NextRequest, NextResponse } from 'next/server';
import { fetchStockQuoteFromAPI, fetchCompanyProfileFromAPI, quoteCache, pendingFetches } from '@/lib/yahooFinance';

const FRESH_DURATION = 12000;   // 12 seconds fresh limit (matches user target of 10-15s and prevents API thrashing)
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
          // Stale but usable: use cached data and update in background if not already pending
          cachedData.push(cached.data);
          if (!pendingFetches.has(symbol)) {
            symbolsToFetchAsync.push(symbol);
          }
        } else {
          // Too stale: fetch synchronously for detail pages, otherwise serve stale + fetch in background
          if (symbols.length > 5) {
            cachedData.push(cached.data);
            if (!pendingFetches.has(symbol)) {
              symbolsToFetchAsync.push(symbol);
            }
          } else {
            if (!pendingFetches.has(symbol)) {
              symbolsToFetchSync.push(symbol);
            } else {
              // A fetch is already pending. Use cached data for now to avoid blocking.
              cachedData.push(cached.data);
            }
          }
        }
      } else {
        // Not cached: fetch synchronously to ensure real-world data is served on first load
        if (!pendingFetches.has(symbol)) {
          symbolsToFetchSync.push(symbol);
        }
      }
    }

    // 1. Fetch synchronously for cache misses (no timeout, wait for real prices)
    if (symbolsToFetchSync.length > 0) {
      for (const symbol of symbolsToFetchSync) {
        pendingFetches.add(symbol);
      }
      try {
        const freshData = await fetchStockQuoteFromAPI(symbolsToFetchSync).then(async (data) => {
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
        });

        if (freshData && freshData.length > 0) {
          for (const item of freshData) {
            quoteCache[item.symbol] = {
              data: item,
              timestamp: Date.now()
            };
            cachedData.push(item);
          }
        }
      } catch (err: any) {
        console.warn(`Synchronous quote fetch failed for ${symbolsToFetchSync.join(',')}: ${err.message}`);
        // Stale cache fallback if available
        for (const symbol of symbolsToFetchSync) {
          const cached = quoteCache[symbol];
          if (cached) {
            cachedData.push(cached.data);
          }
        }
      } finally {
        for (const symbol of symbolsToFetchSync) {
          pendingFetches.delete(symbol);
        }
      }
    }

    // 2. Fetch asynchronously in the background for stale/missing bulk symbols
    if (symbolsToFetchAsync.length > 0) {
      for (const symbol of symbolsToFetchAsync) {
        pendingFetches.add(symbol);
      }
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
        })
        .finally(() => {
          for (const symbol of symbolsToFetchAsync) {
            pendingFetches.delete(symbol);
          }
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
