import { NextRequest, NextResponse } from 'next/server';
import { fetchStockQuoteFromAPI, fetchCompanyProfileFromAPI, quoteCache, pendingFetches, MOCK_STOCK_INFO } from '@/lib/yahooFinance';

export const dynamic = 'force-dynamic';

function getMockQuote(symbol: string) {
  const cleanSym = symbol.replace('.NS', '');
  const info = MOCK_STOCK_INFO[cleanSym] || MOCK_STOCK_INFO[symbol] || {
    name: cleanSym,
    sector: 'Financials',
    desc: 'Company information not available.'
  };

  const seed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  let randomPrice = 100 + (seed % 900) + (seed % 10) * 0.1;
  if (symbol === '^BSESN') randomPrice = 78830.00;
  else if (symbol === '^NSEI') randomPrice = 24660.00;
  else if (symbol === '^NSEBANK') randomPrice = 57740.00;
  else if (symbol === '^CNXIT') randomPrice = 31400.00;
  const randomChangePercent = ((seed % 15) - 7) / 2; // e.g. -3.5% to +3.5%
  const change = (randomPrice * randomChangePercent) / 100;

  return {
    symbol: symbol,
    regularMarketPrice: randomPrice,
    regularMarketChange: parseFloat(change.toFixed(2)),
    regularMarketChangePercent: parseFloat(randomChangePercent.toFixed(2)),
    regularMarketVolume: 1000000 + (seed * 1000) % 5000000,
    fiftyTwoWeekHigh: randomPrice * 1.25,
    fiftyTwoWeekLow: randomPrice * 0.75,
    longName: info.name,
    shortName: info.name,
    sector: info.sector,
    industry: 'Sector Leader',
    longBusinessSummary: info.desc
  };
}

const FRESH_DURATION = 2000;   // 2 seconds fresh limit (ultra low latency)
const STALE_DURATION = 10000;  // 10 seconds stale limit

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

function copyProfileFromCache(item: any, cachedItem: any) {
  if (!cachedItem) return;
  item.sector = cachedItem.sector || item.sector;
  item.industry = cachedItem.industry || item.industry;
  item.longBusinessSummary = cachedItem.longBusinessSummary || item.longBusinessSummary;
  item.website = cachedItem.website || item.website;
  item.headquarters = cachedItem.headquarters || item.headquarters;
  item.leadership = cachedItem.leadership || item.leadership;
  item.ceo = cachedItem.ceo || item.ceo;
  item.trailingPE = cachedItem.trailingPE || item.trailingPE;
  item.priceToBook = cachedItem.priceToBook || item.priceToBook;
  item.dividendYield = cachedItem.dividendYield || item.dividendYield;
  item.epsTrailingTwelveMonths = cachedItem.epsTrailingTwelveMonths || item.epsTrailingTwelveMonths;
  item.roe = cachedItem.roe || item.roe;
  item.sectorPE = cachedItem.sectorPE || item.sectorPE;
  item.sectorPB = cachedItem.sectorPB || item.sectorPB;
  item.marketCap = cachedItem.marketCap || item.marketCap;
  item.holdings = cachedItem.holdings || item.holdings;
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
          // Stale but usable: for detail pages (<= 5 symbols) fetch synchronously to guarantee fresh prices
          if (symbols.length <= 5) {
            if (!pendingFetches.has(symbol)) {
              symbolsToFetchSync.push(symbol);
            } else {
              cachedData.push(cached.data);
            }
          } else {
            cachedData.push(cached.data);
            if (!pendingFetches.has(symbol)) {
              symbolsToFetchAsync.push(symbol);
            }
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
                const cached = quoteCache[item.symbol];
                if (cached?.data?.longBusinessSummary) {
                  copyProfileFromCache(item, cached.data);
                } else {
                  const profile = await fetchCompanyProfileFromAPI(item.symbol);
                  mergeProfileIntoQuote(item, profile);
                }
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
                const cached = quoteCache[item.symbol];
                if (cached?.data?.longBusinessSummary) {
                  copyProfileFromCache(item, cached.data);
                } else {
                  const profile = await fetchCompanyProfileFromAPI(item.symbol);
                  mergeProfileIntoQuote(item, profile);
                }
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

    // Map back to the original order of requested symbols, filling in mock quotes for missing ones
    const orderedData = symbols.map(s => {
      let quote = cachedData.find(item => item.symbol === s);
      if (!quote) {
        // Fallback to mock quote in case of API failure / offline mode
        quote = getMockQuote(s);
        // Save to cache so subsequent requests are fast
        quoteCache[s] = {
          data: quote,
          timestamp: Date.now()
        };
      }
      return quote;
    });

    return NextResponse.json(orderedData, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate'
      }
    });
  } catch (error: any) {
    console.error('Failed to fetch stock quotes:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch stock quote' }, { status: 500 });
  }
}
