import { NextRequest, NextResponse } from 'next/server';
import { fetchStockQuoteFromAPI, fetchStockChartFromAPI } from '@/lib/yahooFinance';

interface BasketConfig {
  id: string;
  name: string;
  type: string;
  description: string;
  cagr: number;
  constituents: string[];
  color: string;
  volatility: 'Low Volatility' | 'Medium Volatility' | 'High Volatility';
  category: string;
}

const BASKETS: { [key: string]: BasketConfig } = {
  tata: {
    id: 'tata',
    name: 'House of Tata',
    type: 'Thematic',
    description: 'Invest in the pillars of India\'s industrial growth. This basket offers diversified exposure into the Tata group\'s leading enterprises spanning software, automobiles, steel, and luxury retail.',
    cagr: 19.5,
    constituents: ['TCS.NS', 'TMPV.NS', 'TMCV.NS', 'TATASTEEL.NS', 'TITAN.NS'],
    color: 'from-blue-600/10 to-indigo-600/10 border-blue-500/20 text-blue-600 dark:text-blue-400',
    volatility: 'Low Volatility',
    category: 'Conglomerate'
  },
  it: {
    id: 'it',
    name: 'IT Leaders',
    type: 'Sectoral',
    description: 'Capitalize on global enterprise software demand. This portfolio groups India\'s largest IT services companies, which lead cloud migrations, consulting, and digital engineering worldwide.',
    cagr: 15.2,
    constituents: ['TCS.NS', 'INFY.NS', 'WIPRO.NS', 'HCLTECH.NS'],
    color: 'from-emerald-600/10 to-teal-600/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    volatility: 'Medium Volatility',
    category: 'Technology Sector'
  },
  banking: {
    id: 'banking',
    name: 'Banking Kings',
    type: 'Sectoral',
    description: 'Bridges you to the backbone of Indian credit. A select group of private and public sector commercial banking giants positioned to capitalize on rising retail credit and investment infrastructure.',
    cagr: 14.8,
    constituents: ['HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'AXISBANK.NS'],
    color: 'from-purple-600/10 to-pink-600/10 border-purple-500/20 text-purple-600 dark:text-purple-400',
    volatility: 'Medium Volatility',
    category: 'Financial Services'
  },
  energy: {
    id: 'energy',
    name: 'Energy & Utilities',
    type: 'Thematic',
    description: 'Power the commercial expansion of India. Features refining behemoths, utility network operators, and state-backed power generation companies transitioning into renewable solar and wind assets.',
    cagr: 16.4,
    constituents: ['RELIANCE.NS', 'BPCL.NS', 'ONGC.NS', 'POWERGRID.NS'],
    color: 'from-amber-600/10 to-orange-600/10 border-amber-500/20 text-amber-600 dark:text-amber-400',
    volatility: 'High Volatility',
    category: 'Energy & Commodities'
  }
};

// Stable seeded random helper
function getSeededRandom(seedStr: string) {
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = seedStr.charCodeAt(i) + (seed << 6) + (seed << 16) - seed;
  }
  seed = Math.abs(seed);
  return function() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

// Generate fallback mock basket chart
function generateMockBasketChart(cagr: number, range: string) {
  const points = [];
  const now = new Date();
  let filterDays = 365;
  switch (range) {
    case '1mo': filterDays = 30; break;
    case '6mo': filterDays = 180; break;
    case '1y': filterDays = 365; break;
    case '5y': filterDays = 5 * 365; break;
    default: filterDays = 365; break;
  }
  
  let currentVal = 100;
  const stepReturn = Math.pow(1 + (cagr / 100), 1 / 250) - 1;
  let seed = filterDays;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  
  const count = Math.min(filterDays, 260);
  for (let i = count; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    
    const change = stepReturn + (rand() - 0.49) * 0.015;
    currentVal = currentVal * (1 + change);
    points.push({
      time: Math.floor(d.getTime() / 1000),
      value: parseFloat(currentVal.toFixed(2))
    });
  }
  
  if (points.length > 0) {
    const baseVal = points[0].value;
    return points.map(pt => ({
      time: pt.time,
      value: parseFloat(((pt.value / baseVal) * 100).toFixed(2))
    }));
  }
  return points;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id?.toLowerCase();
  const basket = BASKETS[id];

  if (!basket) {
    return NextResponse.json({ error: 'Basket not found' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || '1y';

  try {
    // 1. Fetch live quotes for components
    const quotes = await fetchStockQuoteFromAPI(basket.constituents);
    
    // Calculate equal weights (25% each for 4 stocks)
    const weightPerStock = 100 / basket.constituents.length;

    const constituentsDetails = basket.constituents.map(sym => {
      const q = quotes.find(item => item.symbol.toUpperCase() === sym.toUpperCase());
      return {
        symbol: sym,
        ticker: sym.split('.')[0],
        name: q ? q.shortName : sym.split('.')[0],
        price: q ? q.regularMarketPrice : 100,
        changePercent: q ? q.regularMarketChangePercent : 0,
        sector: q ? q.sector : 'Conglomerate',
        weight: parseFloat(weightPerStock.toFixed(2))
      };
    });

    // Compute portfolio daily change
    const basketChangePercent = constituentsDetails.reduce((sum, item) => sum + item.changePercent * (item.weight / 100), 0);

    // 2. Fetch charts for index calculation
    let alignedChartData: Array<{ time: number; value: number }> = [];
    try {
      const charts = await Promise.all(
        basket.constituents.map(sym => fetchStockChartFromAPI(sym, range))
      );

      const mainChart = charts[0];
      if (mainChart && mainChart.length > 0) {
        alignedChartData = mainChart.map((pt, mainIdx) => {
          let sumNormalized = 0;
          for (let s = 0; s < charts.length; s++) {
            const stockChart = charts[s];
            if (!stockChart || stockChart.length === 0) continue;
            
            // Find closest data point by timestamp
            let closestPt = stockChart[Math.min(mainIdx, stockChart.length - 1)];
            let minDiff = Math.abs(closestPt.time - pt.time);
            
            const startScan = Math.max(0, mainIdx - 10);
            const endScan = Math.min(stockChart.length - 1, mainIdx + 10);
            for (let idx = startScan; idx <= endScan; idx++) {
              const diff = Math.abs(stockChart[idx].time - pt.time);
              if (diff < minDiff) {
                minDiff = diff;
                closestPt = stockChart[idx];
              }
            }
            
            const startVal = stockChart[0].value || 1;
            const currentVal = closestPt.value || startVal;
            const normalized = (currentVal / startVal) * 100;
            sumNormalized += normalized * (weightPerStock / 100);
          }
          return {
            time: pt.time,
            value: parseFloat(sumNormalized.toFixed(2))
          };
        });
      }
    } catch (chartErr: any) {
      console.warn(`Failed to align live charts for basket ${id}, using fallback model: ${chartErr.message}`);
    }

    if (alignedChartData.length === 0) {
      alignedChartData = generateMockBasketChart(basket.cagr, range);
    }

    // 3. Seed consistent details
    const rand = getSeededRandom(id);
    const aum = Math.floor(rand() * 1200 + 150); // ₹150Cr - ₹1350Cr
    const minInvestmentAmount = constituentsDetails.reduce((sum, item) => sum + item.price, 0); // Price to buy 1 share of each constituent
    const managementFee = parseFloat((rand() * 0.4 + 0.1).toFixed(2)); // 0.1% to 0.5%
    const launchDate = new Date(Date.now() - Math.floor(rand() * 5 + 3) * 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const responsePayload = {
      id: basket.id,
      name: basket.name,
      type: basket.type,
      description: basket.description,
      volatility: basket.volatility,
      category: basket.category,
      cagr: basket.cagr,
      aum,
      minInvestmentAmount: Math.ceil(minInvestmentAmount),
      managementFee,
      launchDate,
      rebalancingFrequency: 'Quarterly',
      changePercent1D: parseFloat(basketChangePercent.toFixed(2)),
      constituents: constituentsDetails,
      chartData: alignedChartData
    };

    return NextResponse.json(responsePayload);
  } catch (err: any) {
    console.error(`Failed to load thematic basket ${id}`, err);
    return NextResponse.json({ error: 'Internal server error while resolving basket' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
