import { MetadataRoute } from 'next';

const BASE_URL = 'https://onlyprofit.com';

const MONITOR_SYMBOLS = [
  'RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS',
  'SBIN.NS', 'BHARTIAIRTEL.NS', 'LT.NS', 'ITC.NS', 'TATAMOTORS.NS',
  'WIPRO.NS', 'HCLTECH.NS', 'ASIANPAINT.NS', 'AXISBANK.NS', 'BAJFINANCE.NS',
  'BAJAJFINSV.NS', 'BPCL.NS', 'COALINDIA.NS', 'HINDUNILVR.NS', 'JSWSTEEL.NS',
  'KOTAKBANK.NS', 'M&M.NS', 'MARUTI.NS', 'NESTLEIND.NS', 'NTPC.NS',
  'ONGC.NS', 'POWERGRID.NS', 'SUNPHARMA.NS', 'TATASTEEL.NS', 'TITAN.NS',
  'ULTRACEMCO.NS', 'ADANIENT.NS', 'ADANIPORTS.NS', 'GRASIM.NS', 'HEROMOTOCO.NS',
  'HINDALCO.NS', 'JIOFIN.NS'
];

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
  ];

  const stockRoutes = MONITOR_SYMBOLS.map((symbol) => ({
    url: `${BASE_URL}/stock/${symbol}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  return [...routes, ...stockRoutes];
}
