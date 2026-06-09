import { MetadataRoute } from 'next';

const BASE_URL = 'https://onlyprofit.com';

const MONITOR_SYMBOLS = [
  // Financials (20)
  'HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'KOTAKBANK.NS', 'AXISBANK.NS',
  'BAJFINANCE.NS', 'BAJAJFINSV.NS', 'HDFCLIFE.NS', 'SBILIFE.NS', 'LICHSGFIN.NS',
  'PFC.NS', 'RECLTD.NS', 'MUTHOOTFIN.NS', 'CHOLAFIN.NS', 'SHRIRAMFIN.NS',
  'BANDHANBNK.NS', 'IDFCFIRSTB.NS', 'INDUSINDBK.NS', 'PNB.NS', 'BOB.NS',

  // IT (20)
  'TCS.NS', 'INFY.NS', 'WIPRO.NS', 'HCLTECH.NS', 'TECHM.NS',
  'HAPPSTMNDS.NS', 'LTTS.NS', 'PERSISTENT.NS', 'COFORGE.NS', 'MPHASIS.NS',
  'KPITTECH.NS', 'TATAELXSI.NS', 'CYIENT.NS', 'SONATSOFTW.NS', 'ZENSARTECH.NS',
  'OFSS.NS', 'BSOFT.NS', 'NAUKRI.NS', 'AFFLE.NS', 'FSL.NS',

  // Staples (20)
  'HINDUNILVR.NS', 'ITC.NS', 'NESTLEIND.NS', 'BRITANNIA.NS', 'DABUR.NS',
  'GODREJCP.NS', 'COLPAL.NS', 'MARICO.NS', 'TATACONSUM.NS', 'VBL.NS',
  'UBL.NS', 'UNITDSPR.NS', 'BALRAMCHIN.NS', 'KRBL.NS', 'LTFOODS.NS',
  'HERITGFOOD.NS', 'AVANTIFEED.NS', 'EMAMILTD.NS', 'JYOTHYLAB.NS', 'HATSUN.NS',

  // Discretionary (20)
  'MARUTI.NS', 'TMPV.NS', 'TMCV.NS', 'M&M.NS', 'EICHERMOT.NS',
  'HEROMOTOCO.NS', 'BAJAJ-AUTO.NS', 'TITAN.NS', 'TRENT.NS', 'DMART.NS',
  'PAGEIND.NS', 'BATAINDIA.NS', 'RELAXO.NS', 'KALYANKJIL.NS', 'ABFRL.NS',
  'DEVYANI.NS', 'JUBLFOOD.NS', 'WESTLIFE.NS', 'VIPIND.NS', 'RAYMOND.NS',

  // Energy (20)
  'RELIANCE.NS', 'ONGC.NS', 'IOC.NS', 'BPCL.NS', 'HPCL.NS',
  'OIL.NS', 'COALINDIA.NS', 'ADANIGREEN.NS', 'ADANIENSOL.NS', 'MRPL.NS',
  'CHENNPETRO.NS', 'PETRONET.NS', 'GSPL.NS', 'GAIL.NS', 'MGL.NS',
  'IGL.NS', 'PANAMAPET.NS', 'ATGL.NS', 'CASTROLIND.NS', 'AEGISLOG.NS',

  // Industrials (20)
  'LT.NS', 'RVNL.NS', 'BHEL.NS', 'IRCTC.NS', 'IRFC.NS',
  'CONCOR.NS', 'BEL.NS', 'HAL.NS', 'GMRAIRPORT.NS', 'IRCON.NS',
  'HEG.NS', 'GRAPHITE.NS', 'CUMMINSIND.NS', 'ABB.NS', 'SIEMENS.NS',
  'THERMAX.NS', 'VOLTAS.NS', 'BLUESTARCO.NS', 'KEC.NS', 'ENGINERSIN.NS',

  // Materials (20)
  'TATASTEEL.NS', 'JSWSTEEL.NS', 'HINDALCO.NS', 'GRASIM.NS', 'AMBUJACEM.NS',
  'ULTRACEMCO.NS', 'ACC.NS', 'SHREECEM.NS', 'JKCEMENT.NS', 'RAMCOCEM.NS',
  'SAIL.NS', 'JINDALSTEL.NS', 'NMDC.NS', 'NATIONALUM.NS', 'ASIANPAINT.NS',
  'BERGEPAINT.NS', 'KANSAINER.NS', 'PIDILITIND.NS', 'SRF.NS', 'DEEPAKNTR.NS',

  // Health Care (20)
  'SUNPHARMA.NS', 'CIPLA.NS', 'DIVISLAB.NS', 'APOLLOHOSP.NS', 'DRREDDY.NS',
  'LUPIN.NS', 'AUROPHARMA.NS', 'BIOCON.NS', 'GLAND.NS', 'IPCALAB.NS',
  'LAURUSLABS.NS', 'MAXHEALTH.NS', 'FORTIS.NS', 'SYNGENE.NS', 'METROPOLIS.NS',
  'LALPATHLAB.NS', 'TORNTPHARM.NS', 'ALKEM.NS', 'ZYDUSLIFE.NS', 'GLAXO.NS',

  // Communication (20)
  'BHARTIARTL.NS', 'IDEA.NS', 'TATACOMM.NS', 'ZEEL.NS', 'SUNTV.NS',
  'PVRINOX.NS', 'NETWORK18.NS', 'HATHWAY.NS', 'DEN.NS', 'SAREGAMA.NS',
  'TIPSMUSIC.NS', 'DISHTV.NS', 'MTNL.NS', 'ROUTE.NS', 'TANLA.NS',
  'ZEEMEDIA.NS', 'DBCORP.NS', 'JAGRAN.NS', 'ENIL.NS', 'TVTODAY.NS',

  // Utilities (20)
  'NTPC.NS', 'TATAPOWER.NS', 'POWERGRID.NS', 'ADANIPOWER.NS', 'TORNTPOWER.NS',
  'CESC.NS', 'NLCINDIA.NS', 'JPPOWER.NS', 'RTNPOWER.NS', 'GIPCL.NS',
  'SJVN.NS', 'NHPC.NS', 'WABAG.NS', 'JSWENERGY.NS', 'KPIGREEN.NS',
  'PTC.NS', 'GUJGASLTD.NS', 'GENUSPOWER.NS', 'SWSOLAR.NS', 'BFUTILITIE.NS'
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
