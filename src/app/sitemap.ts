import { MetadataRoute } from 'next';

const BASE_URL = 'https://onlyprofit.com';

const MONITOR_SYMBOLS = [
  'RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS',
  'SBIN.NS', 'BHARTIAIRTEL.NS', 'LT.NS', 'ITC.NS', 'TMPV.NS', 'TMCV.NS',
  'WIPRO.NS', 'HCLTECH.NS', 'ASIANPAINT.NS', 'AXISBANK.NS', 'BAJFINANCE.NS',
  'BAJAJFINSV.NS', 'BPCL.NS', 'COALINDIA.NS', 'HINDUNILVR.NS', 'JSWSTEEL.NS',
  'KOTAKBANK.NS', 'M&M.NS', 'MARUTI.NS', 'NESTLEIND.NS', 'NTPC.NS',
  'ONGC.NS', 'POWERGRID.NS', 'SUNPHARMA.NS', 'TATASTEEL.NS', 'TITAN.NS',
  'ULTRACEMCO.NS', 'ADANIENT.NS', 'ADANIPORTS.NS', 'GRASIM.NS', 'HEROMOTOCO.NS',
  'HINDALCO.NS', 'JIOFIN.NS'
];

const MUTUAL_FUNDS = [
  '118778', '125497', '130503', '122639', '118955',
  '120843', '118650', '120334', '120823', '118989',
  '127042', '120505', '120716', '119063', '120620'
];

const BASKETS = ['tata', 'it', 'banking', 'energy'];

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

  const fundRoutes = MUTUAL_FUNDS.map((code) => ({
    url: `${BASE_URL}/mutualfund/${code}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const basketRoutes = BASKETS.map((id) => ({
    url: `${BASE_URL}/basket/${id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...routes, ...stockRoutes, ...fundRoutes, ...basketRoutes];
}
