import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

interface SchemeInfo {
  code: string;
  name: string;
  category: string;
  categoryLabel: string;
  baseNav: number;
  y1Return: number;
  y3Return: number;
}

const MUTUAL_FUNDS: SchemeInfo[] = [
  // Small Cap
  { code: '118778', name: 'Nippon India Small Cap Fund - Growth', category: 'smallcap', categoryLabel: 'Small Cap', baseNav: 195.04, y1Return: 38.6, y3Return: 29.4 },
  { code: '125497', name: 'SBI Small Cap Fund - Growth', category: 'smallcap', categoryLabel: 'Small Cap', baseNav: 194.75, y1Return: 28.2, y3Return: 23.5 },
  { code: '130503', name: 'HDFC Small Cap Fund - Growth', category: 'smallcap', categoryLabel: 'Small Cap', baseNav: 152.67, y1Return: 34.2, y3Return: 26.8 },
  
  // Flexi Cap
  { code: '122639', name: 'Parag Parikh Flexi Cap Fund - Growth', category: 'flexicap', categoryLabel: 'Flexi Cap', baseNav: 89.15, y1Return: 24.5, y3Return: 21.2 },
  { code: '118955', name: 'HDFC Flexi Cap Fund - Growth', category: 'flexicap', categoryLabel: 'Flexi Cap', baseNav: 2119.56, y1Return: 26.8, y3Return: 22.5 },
  { code: '120843', name: 'Quant Flexi Cap Fund - Growth', category: 'flexicap', categoryLabel: 'Flexi Cap', baseNav: 119.89, y1Return: 39.4, y3Return: 30.2 },
  
  // Multi Cap
  { code: '118650', name: 'Nippon India Multi Cap Fund - Growth', category: 'multicap', categoryLabel: 'Multi Cap', baseNav: 323.74, y1Return: 29.6, y3Return: 23.8 },
  { code: '120334', name: 'ICICI Prudential Multi Asset Fund - Growth', category: 'multicap', categoryLabel: 'Multi Cap', baseNav: 877.92, y1Return: 23.2, y3Return: 19.8 },
  { code: '120823', name: 'Quant Active Fund - Growth', category: 'multicap', categoryLabel: 'Multi Cap', baseNav: 705.43, y1Return: 32.8, y3Return: 26.2 },
  
  // Mid Cap
  { code: '118989', name: 'HDFC Mid-Cap Opportunities Fund - Growth', category: 'midcap', categoryLabel: 'Mid Cap', baseNav: 220.33, y1Return: 35.4, y3Return: 27.2 },
  { code: '127042', name: 'Motilal Oswal Midcap Fund - Growth', category: 'midcap', categoryLabel: 'Mid Cap', baseNav: 105.11, y1Return: 41.2, y3Return: 32.5 },
  { code: '120505', name: 'Axis Midcap Fund - Growth', category: 'midcap', categoryLabel: 'Mid Cap', baseNav: 135.45, y1Return: 21.8, y3Return: 18.5 },
  
  // Index Funds
  { code: '120716', name: 'UTI Nifty 50 Index Fund - Growth', category: 'index', categoryLabel: 'Index Fund', baseNav: 163.67, y1Return: 23.4, y3Return: 17.5 },
  { code: '119063', name: 'HDFC Index Fund - Nifty 50 Plan - Growth', category: 'index', categoryLabel: 'Index Fund', baseNav: 227.58, y1Return: 23.2, y3Return: 17.2 },
  { code: '120620', name: 'ICICI Prudential Nifty 50 Index Fund - Growth', category: 'index', categoryLabel: 'Index Fund', baseNav: 246.07, y1Return: 23.5, y3Return: 17.6 }
];

// Memory cache for specific schemes
interface CacheEntry {
  data: any;
  timestamp: number;
}
const schemeCache: { [code: string]: CacheEntry } = {};
const CACHE_DURATION = 3600 * 1000; // 1 hour

// Stable seeded random helper
function getSeededRandom(seedStr: string) {
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = seedStr.charCodeAt(i) + (seed << 6) + (seed << 16) - seed;
  }
  seed = Math.abs(seed); // Force positive seed to avoid negative modulus results in JavaScript
  return function() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

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

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code;
  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || '1y';

  // Find standard fund configuration if exists
  const fundConfig = MUTUAL_FUNDS.find(f => f.code === code) || {
    code,
    name: 'Unknown Mutual Fund',
    category: 'equity',
    categoryLabel: 'Equity Fund',
    baseNav: 100,
    y1Return: 25.0,
    y3Return: 20.0
  };

  const now = Date.now();
  let fullData: any = null;

  // Check cache first
  if (schemeCache[code] && (now - schemeCache[code].timestamp < CACHE_DURATION)) {
    fullData = schemeCache[code].data;
  } else {
    try {
      // Fetch details from AMFI
      const res = await axios.get(`https://api.mfapi.in/mf/${code}`, { timeout: 5000 });
      if (res.data && res.data.data && res.data.data.length > 0) {
        fullData = res.data;
        schemeCache[code] = {
          data: fullData,
          timestamp: now
        };
      } else {
        throw new Error('Empty API data');
      }
    } catch (err: any) {
      console.warn(`Failed to fetch AMFI data for mutual fund ${code}, generating mock data: ${err.message}`);
    }
  }

  // Fallback Generation if API failed and not cached
  if (!fullData) {
    fullData = generateMockFullData(fundConfig);
  }

  const rawPoints = fullData.data; // array of { date, nav } (latest first)
  const meta = fullData.meta;

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

  const nav1Y = getNavAtInterval(365);
  const nav3Y = getNavAtInterval(3 * 365);
  const nav5Y = getNavAtInterval(5 * 365);

  const oneYearReturn = parseFloat((((latestNav - nav1Y) / nav1Y) * 100).toFixed(2));
  const threeYearReturn = parseFloat(((Math.pow(latestNav / nav3Y, 1 / 3) - 1) * 100).toFixed(2));
  const fiveYearReturn = parseFloat(((Math.pow(latestNav / nav5Y, 1 / 5) - 1) * 100).toFixed(2));

  // Seeded calculations for other metrics
  const rand = getSeededRandom(code);

  const aum = Math.floor(rand() * 38000 + 1200); // Crore
  const expenseRatio = parseFloat((rand() * 1.3 + 0.25).toFixed(2));
  const categoryAvgExpenseRatio = parseFloat((expenseRatio + rand() * 0.4 + 0.1).toFixed(2));
  const sharpeRatio = parseFloat((rand() * 1.1 + 0.85).toFixed(2));
  const sortinoRatio = parseFloat((sharpeRatio * (1.1 + rand() * 0.3)).toFixed(2));
  const standardDeviation = parseFloat((rand() * 8 + 11).toFixed(2));
  const beta = parseFloat((rand() * 0.3 + 0.8).toFixed(2));
  
  const minSipAmount = rand() > 0.4 ? 500 : 100;
  const minLumpsumAmount = rand() > 0.4 ? 5000 : 1000;
  const exitLoad = rand() > 0.2 ? '1.00% if redeemed within 365 days, Nil thereafter' : 'Nil exit load';
  const turnOverRatio = parseFloat((rand() * 45 + 15).toFixed(1));

  // Allocations
  let equityAlloc = 93.5;
  let debtAlloc = 1.5;
  if (fundConfig.category === 'index') {
    equityAlloc = 99.4;
    debtAlloc = 0;
  } else if (fundConfig.category === 'multicap') {
    equityAlloc = 89.2;
    debtAlloc = 6.4;
  } else if (fundConfig.category === 'flexicap') {
    equityAlloc = 91.8;
    debtAlloc = 3.2;
  }
  const cashAlloc = parseFloat((100 - equityAlloc - debtAlloc).toFixed(1));

  // Seed top 5 holdings
  const holdingsIndices: number[] = [];
  while (holdingsIndices.length < 5) {
    const idx = Math.floor(rand() * BLUECHIP_STOCKS.length);
    if (!holdingsIndices.includes(idx)) holdingsIndices.push(idx);
  }
  
  let remainingWeight = 36.8;
  const topHoldings = holdingsIndices.map((idx, index) => {
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

  // Seed Manager
  const managerIdx = Math.floor(rand() * MANAGERS.length);
  const manager = MANAGERS[managerIdx];

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
    name: fundConfig.name.replace(' - Growth', ''),
    category: fundConfig.category,
    categoryLabel: fundConfig.categoryLabel,
    fundHouse: meta?.fund_house || 'Indian Mutual Fund House',
    schemeType: meta?.scheme_type || 'Open Ended Schemes',
    schemeCategory: meta?.scheme_category || 'Equity Scheme',
    latestNav,
    navChange,
    navChangePercent,
    oneYearReturn: isNaN(oneYearReturn) ? fundConfig.y1Return : oneYearReturn,
    threeYearReturn: isNaN(threeYearReturn) ? fundConfig.y3Return : threeYearReturn,
    fiveYearReturn: isNaN(fiveYearReturn) ? parseFloat((fundConfig.y3Return * 0.9).toFixed(2)) : fiveYearReturn,
    aum,
    expenseRatio,
    categoryAvgExpenseRatio,
    sharpeRatio,
    sortinoRatio,
    standardDeviation,
    beta,
    minSipAmount,
    minLumpsumAmount,
    exitLoad,
    turnOverRatio,
    assetAllocation: {
      equity: equityAlloc,
      debt: debtAlloc,
      cash: cashAlloc
    },
    topHoldings,
    fundManager: manager,
    chartData: chartPoints
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
    const change = (rand() - 0.47) * 0.01; // slightly upward bias
    currentNav = currentNav * (1 + change);
    
    const d = new Date(startDate.getTime() - i * 24 * 60 * 60 * 1000);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    points.push({
      date: `${day}-${month}-${year}`,
      nav: parseFloat(currentNav.toFixed(4))
    });
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
