import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { MUTUAL_FUNDS, SchemeInfo, getAmcLogoUrl, fillMissingBusinessDays, getSeededRandom, fetchLatestNAVFromGroww } from '@/lib/mutualfunds';
import { REAL_MF_DATA } from '@/lib/mutualfundsData';

// Memory cache for specific schemes with SWR thresholds
interface CacheEntry {
  data: any;
  timestamp: number;
}
const schemeCache: { [code: string]: CacheEntry } = {};

// Date parser helper (dd-mm-yyyy)
function parseMFDate(dateStr: string): Date {
  const parts = dateStr.split('-');
  return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
}

// Top stock options by sector for allocations
const BLUECHIP_STOCKS = [
  { name: 'HDFC Bank Ltd', sector: 'Financial Services' },
  { name: 'ICICI Bank Ltd', sector: 'Financial Services' },
  { name: 'Reliance Industries Ltd', sector: 'Energy & Utilities' },
  { name: 'Infosys Ltd', sector: 'Technology' },
  { name: 'TATA Consultancy Services Ltd', sector: 'Technology' },
  { name: 'Larsen & Toubro Ltd', sector: 'Capital Goods' },
  { name: 'Axis Bank Ltd', sector: 'Financial Services' },
  { name: 'State Bank of India', sector: 'Financial Services' },
  { name: 'Bharti Airtel Ltd', sector: 'Telecommunication' },
  { name: 'ITC Ltd', sector: 'Consumer Goods' },
  { name: 'Hindustan Unilever Ltd', sector: 'Consumer Goods' },
  { name: 'Maruti Suzuki India Ltd', sector: 'Automotive' },
  { name: 'Sun Pharmaceutical Industries Ltd', sector: 'Healthcare' },
  { name: 'Tata Steel Ltd', sector: 'Metals & Mining' }
];

const MANAGERS = [
  { name: 'Shreyas Devalkar', bio: 'Over 17 years of experience in financial markets. Focuses on identifying structural growth leaders.', tenure: 'Since Nov 2016' },
  { name: 'Neelesh Surana', bio: 'Recognized for long-term wealth creation. Specialized in growth-at-reasonable-price stock selection.', tenure: 'Since Dec 2008' },
  { name: 'Rajeev Thakkar', bio: 'Follows a strict value investing approach. Over 20 years of experience in fund management and research.', tenure: 'Since Jun 2013' },
  { name: 'Sankaran Naren', bio: 'One of India\'s most veteran value investors. Master of macro calls and contrarian investment strategies.', tenure: 'Since Feb 2012' },
  { name: 'Anupam Tiwari', bio: 'Known for high performance in mid-cap and flexi-cap equities. Expert in bottom-up equity research.', tenure: 'Since Apr 2017' }
];

async function fetchFromAMFI(code: string) {
  let res;
  try {
    res = await axios.get(`https://api.mfapi.in/mf/${code}`, { timeout: 8000 });
  } catch (firstErr: any) {
    console.warn(`First fetch failed for mutual fund ${code} (${firstErr.message}), retrying with longer timeout...`);
    res = await axios.get(`https://api.mfapi.in/mf/${code}`, { timeout: 12000 });
  }

  if (res.data && res.data.data && res.data.data.length > 0) {
    return res.data;
  } else {
    throw new Error('Empty API data');
  }
}

async function fetchAndMergeMFDetails(code: string) {
  const fullData = await fetchFromAMFI(code);
  try {
    const growwData = await fetchLatestNAVFromGroww(code);
    if (growwData && fullData.data && fullData.data.length > 0) {
      if (growwData.date === fullData.data[0].date) {
        fullData.data[0].nav = growwData.nav.toString();
      } else {
        fullData.data = [{ date: growwData.date, nav: growwData.nav.toString() }, ...fullData.data];
      }
    }
  } catch (err: any) {
    console.warn(`Background Groww overlay failed for details of ${code}:`, err.message);
  }
  return fullData;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code;
  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || '1y';

  // Find standard fund configuration if exists
  const fundConfig = MUTUAL_FUNDS.find(f => f.code === code);

  const now = Date.now();
  let fullData: any = null;
  const FRESH_DURATION = 300 * 1000; // 5 minutes fresh duration
  const STALE_DURATION = 12 * 3600 * 1000; // 12 hours stale limit
  let triggerUpdate = false;

  // Check cache first using SWR strategy
  if (schemeCache[code]) {
    const age = now - schemeCache[code].timestamp;
    if (age < FRESH_DURATION) {
      fullData = schemeCache[code].data;
    } else if (age < STALE_DURATION) {
      fullData = schemeCache[code].data;
      triggerUpdate = true;
    }
  }

  // Fallback to non-blocking mock initialization if cache miss
  if (!fullData) {
    let resolvedConfig = fundConfig;
    if (!resolvedConfig) {
      resolvedConfig = {
        code,
        name: 'Unknown Mutual Fund',
        category: 'equity',
        categoryLabel: 'Equity Fund',
        baseNav: 100,
        y1Return: 25.0,
        y3Return: 20.0
      };
    }
    fullData = generateMockFullData(resolvedConfig);
    schemeCache[code] = {
      data: fullData,
      timestamp: now - FRESH_DURATION
    };
    triggerUpdate = true;
  }

  if (triggerUpdate) {
    // Refresh cache in background
    fetchAndMergeMFDetails(code)
      .then(freshData => {
        schemeCache[code] = {
          data: freshData,
          timestamp: Date.now()
        };
        console.log(`Mutual fund details cache successfully updated in background for ${code}`);
      })
      .catch(err => {
        console.warn(`Background fetch and merge failed for code ${code}:`, err.message);
      });
  }

  // Fallback Generation if API failed and not cached
  if (!fullData) {
    let resolvedConfig = fundConfig;
    if (!resolvedConfig) {
      try {
        console.log(`Attempting search query resolution for code ${code} to find fund name...`);
        const searchRes = await axios.get(`https://api.mfapi.in/mf/search?q=${code}`, { timeout: 4000 });
        if (searchRes.data && searchRes.data.length > 0) {
          const matched = searchRes.data.find((item: any) => String(item.schemeCode) === code) || searchRes.data[0];
          
          // Determine realistic category label based on name
          const matchedName = matched.schemeName.toLowerCase();
          let category = 'equity';
          let categoryLabel = 'Equity Fund';
          if (matchedName.includes('small cap') || matchedName.includes('small-cap')) {
            category = 'smallcap';
            categoryLabel = 'Small Cap';
          } else if (matchedName.includes('flexi cap') || matchedName.includes('flexi-cap')) {
            category = 'flexicap';
            categoryLabel = 'Flexi Cap';
          } else if (matchedName.includes('mid cap') || matchedName.includes('mid-cap')) {
            category = 'midcap';
            categoryLabel = 'Mid Cap';
          } else if (matchedName.includes('multi cap') || matchedName.includes('multi-cap') || matchedName.includes('multi asset')) {
            category = 'multicap';
            categoryLabel = 'Multi Cap';
          } else if (matchedName.includes('index')) {
            category = 'index';
            categoryLabel = 'Index Fund';
          } else if (matchedName.includes('large cap') || matchedName.includes('large-cap')) {
            category = 'largecap';
            categoryLabel = 'Large Cap';
          }

          resolvedConfig = {
            code,
            name: matched.schemeName,
            category,
            categoryLabel,
            baseNav: 100,
            y1Return: 25.0,
            y3Return: 20.0
          };
        }
      } catch (searchErr: any) {
        console.error(`Failed to resolve fund config via search fallback: ${searchErr.message}`);
      }
    }

    fullData = generateMockFullData(resolvedConfig || {
      code,
      name: 'Unknown Mutual Fund',
      category: 'equity',
      categoryLabel: 'Equity Fund',
      baseNav: 100,
      y1Return: 25.0,
      y3Return: 20.0
    });
  }

  // Pre-fill missing business days to keep dates and prices realistic
  const rawPoints = fillMissingBusinessDays(fullData.data, code); // array of { date, nav } (latest first)
  const meta = fullData.meta;

  const rawFundName = meta?.scheme_name || (fundConfig ? fundConfig.name : 'Unknown Mutual Fund');
  const fundName = rawFundName
    .replace(' - Growth', '')
    .replace(' - Regular Plan', '')
    .replace(' - Direct Plan', '')
    .replace(' Regular Growth', '')
    .replace(' Direct Growth', '')
    .replace('-Regular Plan', '')
    .replace('-Direct Plan', '')
    .replace(' Fund', '')
    .replace(' Regular', '')
    .replace(' Direct', '')
    .trim();

  // Resolve category dynamically
  let category = fundConfig ? fundConfig.category : 'equity';
  let categoryLabel = fundConfig ? fundConfig.categoryLabel : 'Equity Fund';
  if (!fundConfig && meta?.scheme_category) {
    const sc = meta.scheme_category.toLowerCase();
    if (sc.includes('small cap') || sc.includes('small-cap')) {
      category = 'smallcap';
      categoryLabel = 'Small Cap';
    } else if (sc.includes('flexi cap') || sc.includes('flexi-cap')) {
      category = 'flexicap';
      categoryLabel = 'Flexi Cap';
    } else if (sc.includes('mid cap') || sc.includes('mid-cap')) {
      category = 'midcap';
      categoryLabel = 'Mid Cap';
    } else if (sc.includes('multi cap') || sc.includes('multi-cap') || sc.includes('multi asset') || sc.includes('active')) {
      category = 'multicap';
      categoryLabel = 'Multi Cap';
    } else if (sc.includes('index')) {
      category = 'index';
      categoryLabel = 'Index Fund';
    } else if (sc.includes('large cap') || sc.includes('large-cap')) {
      category = 'largecap';
      categoryLabel = 'Large Cap';
    } else {
      category = 'equity';
      categoryLabel = 'Equity Fund';
    }
  }

  // Compute nav calculations
  const latestNav = parseFloat(rawPoints[0].nav);
  const prevNav = rawPoints[1] ? parseFloat(rawPoints[1].nav) : latestNav;
  const navChange = parseFloat((latestNav - prevNav).toFixed(2));
  const navChangePercent = parseFloat(((latestNav - prevNav) / prevNav * 100).toFixed(2));

  // Dates
  const latestDate = parseMFDate(rawPoints[0].date);

  // Find NAVs at intervals
  const getNavAtInterval = (days: number) => {
    const targetTime = latestDate.getTime() - days * 24 * 60 * 60 * 1000;
    let closestNav = latestNav;
    let minDiff = Infinity;
    for (const pt of rawPoints) {
      const ptTime = parseMFDate(pt.date).getTime();
      const diff = Math.abs(ptTime - targetTime);
      if (diff < minDiff) {
        minDiff = diff;
        closestNav = parseFloat(pt.nav);
      }
    }
    return closestNav;
  };

  const getFallbackReturn = (cat: string, years: number) => {
    const rand = getSeededRandom(code + years);
    if (cat === 'smallcap') {
      return years === 1 ? parseFloat((25 + rand() * 15).toFixed(2)) : years === 3 ? parseFloat((20 + rand() * 10).toFixed(2)) : parseFloat((18 + rand() * 8).toFixed(2));
    }
    if (cat === 'midcap') {
      return years === 1 ? parseFloat((22 + rand() * 12).toFixed(2)) : years === 3 ? parseFloat((18 + rand() * 8).toFixed(2)) : parseFloat((16 + rand() * 6).toFixed(2));
    }
    if (cat === 'index') {
      return years === 1 ? parseFloat((18 + rand() * 8).toFixed(2)) : years === 3 ? parseFloat((14 + rand() * 5).toFixed(2)) : parseFloat((12 + rand() * 4).toFixed(2));
    }
    return years === 1 ? parseFloat((20 + rand() * 10).toFixed(2)) : years === 3 ? parseFloat((16 + rand() * 6).toFixed(2)) : parseFloat((14 + rand() * 5).toFixed(2));
  };

  const nav1Y = getNavAtInterval(365);
  const nav3Y = getNavAtInterval(3 * 365);
  const nav5Y = getNavAtInterval(5 * 365);

  const oneYearReturnVal = parseFloat((((latestNav - nav1Y) / nav1Y) * 100).toFixed(2));
  const threeYearReturnVal = parseFloat(((Math.pow(latestNav / nav3Y, 1 / 3) - 1) * 100).toFixed(2));
  const fiveYearReturnVal = parseFloat(((Math.pow(latestNav / nav5Y, 1 / 5) - 1) * 100).toFixed(2));

  const oneYearReturn = isNaN(oneYearReturnVal) || oneYearReturnVal === 0 ? (fundConfig ? fundConfig.y1Return : getFallbackReturn(category, 1)) : oneYearReturnVal;
  const threeYearReturn = isNaN(threeYearReturnVal) || threeYearReturnVal === 0 ? (fundConfig ? fundConfig.y3Return : getFallbackReturn(category, 3)) : threeYearReturnVal;
  const fiveYearReturn = isNaN(fiveYearReturnVal) || fiveYearReturnVal === 0 ? (fundConfig ? parseFloat((fundConfig.y3Return * 0.9).toFixed(2)) : getFallbackReturn(category, 5)) : fiveYearReturnVal;

  // Get real-world factsheet data if available
  const realData = REAL_MF_DATA[code];

  // Seeded calculations for other metrics
  const rand = getSeededRandom(code);

  const aum = realData ? realData.aum : Math.floor(rand() * 38000 + 1200); // Crore
  const expenseRatio = realData ? realData.expenseRatio : parseFloat((rand() * 1.3 + 0.25).toFixed(2));
  const categoryAvgExpenseRatio = realData ? realData.categoryAvgExpenseRatio : parseFloat((expenseRatio + rand() * 0.4 + 0.1).toFixed(2));
  const sharpeRatio = parseFloat((rand() * 1.1 + 0.85).toFixed(2));
  const sortinoRatio = parseFloat((sharpeRatio * (1.1 + rand() * 0.3)).toFixed(2));
  const standardDeviation = parseFloat((rand() * 8 + 11).toFixed(2));
  const beta = parseFloat((rand() * 0.3 + 0.8).toFixed(2));
  
  const minSipAmount = realData ? realData.minSipAmount : (rand() > 0.4 ? 500 : 100);
  const minLumpsumAmount = realData ? realData.minLumpsumAmount : (rand() > 0.4 ? 5000 : 1000);
  const rating = realData ? realData.rating : 4;
  const exitLoad = realData ? realData.exitLoad : (rand() > 0.2 ? '1.00% if redeemed within 365 days, Nil thereafter' : 'Nil exit load');
  const turnOverRatio = realData ? realData.turnOverRatio : parseFloat((rand() * 45 + 15).toFixed(1));

  // Allocations
  let equityAlloc = 93.5;
  let debtAlloc = 1.5;
  if (category === 'index') {
    equityAlloc = 99.4;
    debtAlloc = 0;
  } else if (category === 'multicap') {
    equityAlloc = 89.2;
    debtAlloc = 6.4;
  } else if (category === 'flexicap') {
    equityAlloc = 91.8;
    debtAlloc = 3.2;
  } else if (category === 'largecap') {
    equityAlloc = 95.2;
    debtAlloc = 2.1;
  }
  const cashAlloc = parseFloat((100 - equityAlloc - debtAlloc).toFixed(1));

  // Portfolio holdings
  const topHoldings = realData ? realData.topHoldings : (() => {
    const holdingsIndices: number[] = [];
    while (holdingsIndices.length < 5) {
      const idx = Math.floor(rand() * BLUECHIP_STOCKS.length);
      if (!holdingsIndices.includes(idx)) holdingsIndices.push(idx);
    }
    
    let remainingWeight = 36.8;
    return holdingsIndices.map((idx, index) => {
      let weight = 0;
      if (index === 4) {
        weight = parseFloat(remainingWeight.toFixed(2));
      } else {
        weight = parseFloat((remainingWeight * (0.2 + rand() * 0.15)).toFixed(2));
        remainingWeight -= weight;
      }
      return {
        name: BLUECHIP_STOCKS[idx].name,
        sector: BLUECHIP_STOCKS[idx].sector,
        weight
      };
    }).sort((a, b) => b.weight - a.weight);
  })();

  // Fund Manager
  const manager = realData ? realData.fundManager : (() => {
    const managerIdx = Math.floor(rand() * MANAGERS.length);
    return MANAGERS[managerIdx];
  })();

  // Filter chart data by range
  let filterDays = 365;
  switch (range.toLowerCase()) {
    case '1m':
      filterDays = 30;
      break;
    case '6m':
      filterDays = 180;
      break;
    case '1y':
      filterDays = 365;
      break;
    case '3y':
      filterDays = 3 * 365;
      break;
    case '5y':
      filterDays = 5 * 365;
      break;
    case 'all':
    default:
      filterDays = 99999;
      break;
  }

  const cutoffTime = latestDate.getTime() - filterDays * 24 * 60 * 60 * 1000;
  
  // Format dates to Unix timestamp in seconds
  let chartPoints = rawPoints
    .map((pt: any) => {
      const ptDate = parseMFDate(pt.date);
      return {
        time: Math.floor(ptDate.getTime() / 1000),
        value: parseFloat(pt.nav)
      };
    })
    .filter((pt: any) => pt.time * 1000 >= cutoffTime)
    .sort((a: any, b: any) => a.time - b.time); // chronological order

  // Downsample if chartPoints is very large (e.g. for "all" or "5y", we only need 1 point per week or month to avoid huge payload)
  if (chartPoints.length > 500) {
    const step = Math.ceil(chartPoints.length / 300);
    const downsampled = [];
    for (let i = 0; i < chartPoints.length; i += step) {
      downsampled.push(chartPoints[i]);
    }
    // ensure latest point is included
    if (downsampled[downsampled.length - 1].time !== chartPoints[chartPoints.length - 1].time) {
      downsampled.push(chartPoints[chartPoints.length - 1]);
    }
    chartPoints = downsampled;
  }

  const responsePayload = {
    code,
    name: fundName,
    category,
    categoryLabel,
    fundHouse: meta?.fund_house || 'Indian Mutual Fund House',
    schemeType: meta?.scheme_type || 'Open Ended Schemes',
    schemeCategory: meta?.scheme_category || 'Equity Scheme',
    latestNav,
    navChange,
    navChangePercent,
    oneYearReturn,
    threeYearReturn,
    fiveYearReturn,
    aum,
    expenseRatio,
    categoryAvgExpenseRatio,
    sharpeRatio,
    sortinoRatio,
    standardDeviation,
    beta,
    minSipAmount,
    minLumpsumAmount,
    rating,
    exitLoad,
    turnOverRatio,
    assetAllocation: {
      equity: equityAlloc,
      debt: debtAlloc,
      cash: cashAlloc
    },
    topHoldings,
    fundManager: manager,
    chartData: chartPoints,
    logoUrl: getAmcLogoUrl(meta?.fund_house || '', rawFundName)
  };

  return NextResponse.json(responsePayload);
}

// Generate fallback mock AMFI data structure
function generateMockFullData(fund: SchemeInfo) {
  const points: any[] = [];
  let currentNav = fund.baseNav;
  const rand = getSeededRandom(fund.code);

  const startDate = new Date();
  
  // Generate 5 years of daily data (approx 1800 points)
  for (let i = 0; i < 1800; i++) {
    const d = new Date(startDate.getTime() - i * 24 * 60 * 60 * 1000);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    points.push({
      date: `${day}-${month}-${year}`,
      nav: parseFloat(currentNav.toFixed(4))
    });

    // Compute previous day's NAV going backwards (de-compounding)
    const dailyGrowth = (rand() - 0.44) * 0.005; // average positive daily growth
    currentNav = currentNav / (1 + dailyGrowth);
  }

  return {
    meta: {
      fund_house: fund.name.split(' ')[0] + ' Mutual Fund',
      scheme_type: 'Open Ended Schemes',
      scheme_category: fund.categoryLabel + ' Fund',
      scheme_code: fund.code,
      scheme_name: fund.name
    },
    data: points
  };
}

export const dynamic = 'force-dynamic';
