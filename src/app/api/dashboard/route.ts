import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { cacheService } from '@/services/redis';
import { fetchStockQuoteFromAPI, MOCK_STOCK_INFO } from '@/lib/yahooFinance';
import { MUTUAL_FUNDS } from '@/lib/mutualfunds';
import { REAL_MF_DATA } from '@/lib/mutualfundsData';

const IPO_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9'
};

const BASE_QUOTES = [
  '^NSEI', '^BSESN', '^NSEBANK', // Indices
  'RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS', // Large cap / Bluechips
  'TRENT.NS', 'HAL.NS', 'ZOMATO.NS', 'JIOFIN.NS' // Mid cap / Trending
];

// Fallback generator for MF mock data
function getMockMFData(fund: any) {
  const realData = REAL_MF_DATA[fund.code];
  return {
    code: fund.code,
    name: fund.name,
    category: fund.category,
    categoryLabel: fund.categoryLabel,
    nav: parseFloat(fund.baseNav.toFixed(2)),
    oneYearReturn: fund.y1Return,
    threeYearReturn: fund.y3Return,
    rating: realData ? realData.rating : 4,
    minSipAmount: realData ? realData.minSipAmount : 500,
  };
}

async function getIpoData() {
  try {
    const res = await axios.get('https://groww.in/ipo', { headers: IPO_HEADERS, timeout: 6000 });
    const html = res.data;
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (nextDataMatch) {
      const jsonData = JSON.parse(nextDataMatch[1]);
      const pageProps = jsonData.props?.pageProps || {};
      return {
        open: pageProps.openDataList || [],
        closed: pageProps.closedDataList || [],
        upcoming: pageProps.upcomingDataList || []
      };
    }
  } catch (err) {
    console.warn('Dashboard API: Failed to scrape IPO feed, returning empty arrays', err);
  }
  return { open: [], closed: [], upcoming: [] };
}

async function getMutualFundsData() {
  // Return Nip/SBI/HDFC direct schemes from list
  const schemes = MUTUAL_FUNDS.slice(0, 8);
  return schemes.map((fund) => getMockMFData(fund));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const watchlistParam = searchParams.get('watchlist') || '';

  try {
    // Check if base dashboard data exists in cache
    const cacheKey = 'dashboard:base_data';
    let baseData = await cacheService.get<any>(cacheKey);

    if (!baseData) {
      // Fetch concurrently to save round-trip latency
      const [ipo, mutualFunds, quotes] = await Promise.all([
        getIpoData(),
        getMutualFundsData(),
        fetchStockQuoteFromAPI(BASE_QUOTES)
      ]);

      baseData = { ipo, mutualFunds, quotes };
      
      // Cache base layout data in Redis for 20 seconds
      await cacheService.set(cacheKey, baseData, { ex: 20 });
    }

    // Handle user watchlist dynamic quote fetching if requested
    let finalQuotes = [...baseData.quotes];
    if (watchlistParam) {
      const watchlistSymbols = watchlistParam
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter((s) => s.length > 0 && !BASE_QUOTES.includes(s));

      if (watchlistSymbols.length > 0) {
        try {
          const freshWatchlistQuotes = await fetchStockQuoteFromAPI(watchlistSymbols);
          finalQuotes = [...finalQuotes, ...freshWatchlistQuotes];
        } catch (err) {
          console.warn('Dashboard API: Failed to fetch watchlist quotes', err);
        }
      }
    }

    return NextResponse.json({
      success: true,
      ipo: baseData.ipo,
      mutualFunds: baseData.mutualFunds,
      quotes: finalQuotes
    });

  } catch (error: any) {
    console.error('Consolidated Dashboard API failed:', error);
    return NextResponse.json(
      { success: false, error: 'Dashboard load failure: ' + error.message },
      { status: 500 }
    );
  }
}
