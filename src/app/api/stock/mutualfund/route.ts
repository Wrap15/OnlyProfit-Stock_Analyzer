import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { MUTUAL_FUNDS, SchemeInfo, fillMissingBusinessDays, fetchLatestNAVFromGroww } from '@/lib/mutualfunds';
import { REAL_MF_DATA } from '@/lib/mutualfundsData';

// Cache in memory with SWR thresholds
let cachedMutualFunds: any = null;
let cacheTime = 0;
const FRESH_DURATION = 300 * 1000; // 5 minutes
let isUpdatingCache = false;

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

  // Generate 30 days of history backwards (de-compounding)
  for (let i = 0; i < 30; i++) {
    points.push(parseFloat(currentNav.toFixed(2)));
    const changePercent = (rand() - 0.46) * 0.005; // average positive daily growth
    currentNav = currentNav / (1 + changePercent);
  }

  const realData = REAL_MF_DATA[fund.code];

  // Return formatted array (oldest first for sparkline)
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
    sparkline: points.reverse()
  };
}

async function fetchAllMFData() {
  const schemesToFetch = MUTUAL_FUNDS;

  const promises = schemesToFetch.map(async (fund) => {
    try {
      const res = await axios.get(`https://api.mfapi.in/mf/${fund.code}`, { timeout: 8000 });
      let navData = res.data?.data;
      
      if (navData && navData.length > 0) {
        // Try to overlay the exact Groww NAV if available
        try {
          const growwData = await fetchLatestNAVFromGroww(fund.code);
          if (growwData) {
            if (growwData.date === navData[0].date) {
              navData[0].nav = growwData.nav.toString();
            } else {
              navData = [{ date: growwData.date, nav: growwData.nav.toString() }, ...navData];
            }
          }
        } catch (growwErr: any) {
          console.warn(`Groww overlay failed for ${fund.code}:`, growwErr.message);
        }

        // Automatically fill missing business days
        navData = fillMissingBusinessDays(navData, fund.code);

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

        const realData = REAL_MF_DATA[fund.code];

        return {
          code: fund.code,
          name: fund.name,
          category: fund.category,
          categoryLabel: fund.categoryLabel,
          nav: parseFloat(latestNav.toFixed(2)),
          oneYearReturn: parseFloat(oneYearReturn.toFixed(2)),
          threeYearReturn: parseFloat(threeYearReturn.toFixed(2)),
          rating: realData ? realData.rating : 4,
          minSipAmount: realData ? realData.minSipAmount : 500,
          sparkline
        };
      }
      throw new Error('Invalid NAV data structure');
    } catch (err: any) {
      console.warn(`MF API failed for ${fund.name} (${fund.code}). Falling back to mock data.`, err.message);
      return generateMockMFData(fund);
    }
  });

  return Promise.all(promises);
}

async function updateCacheInBackground() {
  if (isUpdatingCache) return;
  isUpdatingCache = true;
  try {
    const results = await fetchAllMFData();
    cachedMutualFunds = results;
    cacheTime = Date.now();
    console.log('Mutual funds list cache successfully updated in background');
  } catch (err: any) {
    console.warn('Failed to update mutual funds list cache in background:', err.message);
  } finally {
    isUpdatingCache = false;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const categoryFilter = searchParams.get('category'); // e.g. 'smallcap'

  const now = Date.now();
  let triggerUpdate = false;

  if (cachedMutualFunds) {
    const age = now - cacheTime;
    if (age > FRESH_DURATION) {
      triggerUpdate = true;
    }
  } else {
    cachedMutualFunds = MUTUAL_FUNDS.map(f => generateMockMFData(f));
    cacheTime = now - FRESH_DURATION;
    triggerUpdate = true;
  }

  if (triggerUpdate) {
    updateCacheInBackground();
  }

  const filtered = categoryFilter
    ? cachedMutualFunds.filter((f: any) => f.category === categoryFilter.toLowerCase())
    : cachedMutualFunds;

  return NextResponse.json(filtered);
}

export const dynamic = 'force-dynamic';
