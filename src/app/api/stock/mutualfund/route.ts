import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { MUTUAL_FUNDS, SchemeInfo } from '@/lib/mutualfunds';

// Cache in memory to make reload instantaneous
let cachedMutualFunds: any = null;
let cacheTime = 0;
const CACHE_DURATION = 3600 * 1000; // 1 hour cache duration

// Parser helper for date in AMFI format (dd-mm-yyyy)
function parseMFDate(dateStr: string): Date {
  const parts = dateStr.split('-');
  return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
}

// Generate fallback mock NAV history based on seeds
function generateMockMFData(fund: SchemeInfo) {
  const points: number[] = [];
  let currentNav = fund.baseNav;
  
  // Create stable seeded values based on code
  const codeNum = parseInt(fund.code) || 123456;
  let seed = codeNum / 1000000;
  
  const rand = () => {
    // Linear congruential generator for stable mock data
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  // Generate 30 days of history backwards
  for (let i = 0; i < 30; i++) {
    const changePercent = (rand() - 0.48) * 0.006; // upward trend
    currentNav = currentNav * (1 + changePercent);
    points.push(parseFloat(currentNav.toFixed(2)));
  }

  // Return formatted array (oldest first for sparkline)
  return {
    code: fund.code,
    name: fund.name,
    category: fund.category,
    categoryLabel: fund.categoryLabel,
    nav: parseFloat(fund.baseNav.toFixed(2)),
    oneYearReturn: fund.y1Return,
    threeYearReturn: fund.y3Return,
    sparkline: points.reverse()
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const categoryFilter = searchParams.get('category'); // e.g. 'smallcap'

  // If memory cache is fresh, return cached data instantly
  const now = Date.now();
  if (cachedMutualFunds && (now - cacheTime < CACHE_DURATION)) {
    const filtered = categoryFilter
      ? cachedMutualFunds.filter((f: any) => f.category === categoryFilter.toLowerCase())
      : cachedMutualFunds;
    return NextResponse.json(filtered);
  }

  // Filter schemes
  const schemesToFetch = MUTUAL_FUNDS;

  const promises = schemesToFetch.map(async (fund) => {
    try {
      // Fetch details from open AMFI API (timeout after 4 seconds)
      const res = await axios.get(`https://api.mfapi.in/mf/${fund.code}`, { timeout: 4000 });
      const navData = res.data?.data;
      
      if (navData && navData.length > 0) {
        const latestNav = parseFloat(navData[0].nav);
        
        // Find NAV 1 year ago (365 days ago)
        const latestDate = parseMFDate(navData[0].date);
        const date1Y = new Date(latestDate.getTime() - 365 * 24 * 60 * 60 * 1000);
        const date3Y = new Date(latestDate.getTime() - 3 * 365 * 24 * 60 * 60 * 1000);

        let nav1Y = latestNav;
        let nav3Y = latestNav;
        let diff1Y = Infinity;
        let diff3Y = Infinity;

        // Loop to find the closest dates in history
        for (const pt of navData) {
          const ptDate = parseMFDate(pt.date);
          const val = parseFloat(pt.nav);
          
          const d1 = Math.abs(ptDate.getTime() - date1Y.getTime());
          if (d1 < diff1Y) {
            diff1Y = d1;
            nav1Y = val;
          }

          const d3 = Math.abs(ptDate.getTime() - date3Y.getTime());
          if (d3 < diff3Y) {
            diff3Y = d3;
            nav3Y = val;
          }
        }

        // Calculate Returns
        const oneYearReturn = ((latestNav - nav1Y) / (nav1Y || 1)) * 100;
        // Annualized CAGR for 3 years
        const threeYearReturn = (Math.pow((latestNav / (nav3Y || 1)), 1 / 3) - 1) * 100;

        // Extract last 30 data points for sparkline (reverse to get oldest to newest)
        const sparklineRaw = navData.slice(0, 30).map((pt: any) => parseFloat(pt.nav));
        const sparkline = sparklineRaw.reverse();

        return {
          code: fund.code,
          name: fund.name,
          category: fund.category,
          categoryLabel: fund.categoryLabel,
          nav: parseFloat(latestNav.toFixed(2)),
          oneYearReturn: parseFloat(oneYearReturn.toFixed(2)),
          threeYearReturn: parseFloat(threeYearReturn.toFixed(2)),
          sparkline
        };
      }
      throw new Error('Invalid NAV data structure');
    } catch (err: any) {
      console.warn(`MF API failed for ${fund.name} (${fund.code}). Falling back to mock data.`, err.message);
      return generateMockMFData(fund);
    }
  });

  try {
    const results = await Promise.all(promises);
    
    // Save to cache
    cachedMutualFunds = results;
    cacheTime = now;

    const filtered = categoryFilter
      ? results.filter((f: any) => f.category === categoryFilter.toLowerCase())
      : results;
    return NextResponse.json(filtered);
  } catch (err: any) {
    console.error('Failed to process mutual fund data:', err);
    return NextResponse.json({ error: 'Failed to process mutual fund data' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
