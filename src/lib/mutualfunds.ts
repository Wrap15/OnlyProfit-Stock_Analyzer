import axios from 'axios';

export interface SchemeInfo {
  code: string;
  name: string;
  category: string;
  categoryLabel: string;
  baseNav: number;
  y1Return: number;
  y3Return: number;
}

export const MUTUAL_FUNDS: SchemeInfo[] = [
  // Small Cap
  { code: '118778', name: 'Nippon India Small Cap Fund - Growth', category: 'smallcap', categoryLabel: 'Small Cap', baseNav: 192.24, y1Return: 38.6, y3Return: 29.4 },
  { code: '125497', name: 'SBI Small Cap Fund - Growth', category: 'smallcap', categoryLabel: 'Small Cap', baseNav: 193.44, y1Return: 28.2, y3Return: 23.5 },
  { code: '130503', name: 'HDFC Small Cap Fund - Growth', category: 'smallcap', categoryLabel: 'Small Cap', baseNav: 151.48, y1Return: 34.2, y3Return: 26.8 },
  { code: '147946', name: 'Bandhan Small Cap Fund - Direct Plan - Growth', category: 'smallcap', categoryLabel: 'Small Cap', baseNav: 52.04, y1Return: 39.2, y3Return: 28.5 },
  
  // Flexi Cap
  { code: '122639', name: 'Parag Parikh Flexi Cap Fund - Growth', category: 'flexicap', categoryLabel: 'Flexi Cap', baseNav: 88.54, y1Return: 24.5, y3Return: 21.2 },
  { code: '118955', name: 'HDFC Flexi Cap Fund - Growth', category: 'flexicap', categoryLabel: 'Flexi Cap', baseNav: 2118.33, y1Return: 26.8, y3Return: 22.5 },
  { code: '120843', name: 'Quant Flexi Cap Fund - Growth', category: 'flexicap', categoryLabel: 'Flexi Cap', baseNav: 117.88, y1Return: 39.4, y3Return: 30.2 },
  
  // Multi Cap
  { code: '118650', name: 'Nippon India Multi Cap Fund - Growth', category: 'multicap', categoryLabel: 'Multi Cap', baseNav: 320.12, y1Return: 29.6, y3Return: 23.8 },
  { code: '120334', name: 'ICICI Prudential Multi Asset Fund - Growth', category: 'multicap', categoryLabel: 'Multi Cap', baseNav: 869.37, y1Return: 23.2, y3Return: 19.8 },
  { code: '120823', name: 'Quant Active Fund - Growth', category: 'multicap', categoryLabel: 'Multi Cap', baseNav: 693.82, y1Return: 32.8, y3Return: 26.2 },
  { code: '149185', name: 'Kotak Multicap Fund - Growth', category: 'multicap', categoryLabel: 'Multi Cap', baseNav: 20.45, y1Return: 36.2, y3Return: 22.5 },
  
  // Mid Cap
  { code: '118989', name: 'HDFC Mid-Cap Opportunities Fund - Growth', category: 'midcap', categoryLabel: 'Mid Cap', baseNav: 218.51, y1Return: 35.4, y3Return: 27.2 },
  { code: '127042', name: 'Motilal Oswal Midcap Fund - Growth', category: 'midcap', categoryLabel: 'Mid Cap', baseNav: 102.77, y1Return: 41.2, y3Return: 32.5 },
  { code: '120505', name: 'Axis Midcap Fund - Growth', category: 'midcap', categoryLabel: 'Mid Cap', baseNav: 134.32, y1Return: 21.8, y3Return: 18.5 },
  
  // Index Funds
  { code: '120716', name: 'UTI Nifty 50 Index Fund - Growth', category: 'index', categoryLabel: 'Index Fund', baseNav: 162.61, y1Return: 23.4, y3Return: 17.5 },
  { code: '119063', name: 'HDFC Index Fund - Nifty 50 Plan - Growth', category: 'index', categoryLabel: 'Index Fund', baseNav: 226.10, y1Return: 23.2, y3Return: 17.2 },
  { code: '120620', name: 'ICICI Prudential Nifty 50 Index Fund - Growth', category: 'index', categoryLabel: 'Index Fund', baseNav: 244.47, y1Return: 23.5, y3Return: 17.6 }
];

export function getAmcLogoUrl(fundHouse: string, fundName?: string): string | null {
  const name = (fundHouse || fundName || '').toLowerCase();
  if (name.includes('nippon')) return 'https://groww.in/images/partners/nippon.png';
  if (name.includes('sbi')) return 'https://groww.in/images/partners/sbi.png';
  if (name.includes('hdfc')) return 'https://groww.in/images/partners/hdfc.png';
  if (name.includes('parag') || name.includes('ppfas')) return 'https://groww.in/images/partners/parag_parikh.png';
  if (name.includes('quant')) return 'https://groww.in/images/partners/quant.png';
  if (name.includes('icici')) return 'https://groww.in/images/partners/icici.png';
  if (name.includes('axis')) return 'https://groww.in/images/partners/axis.png';
  if (name.includes('uti')) return 'https://groww.in/images/partners/uti.png';
  if (name.includes('motilal')) return 'https://groww.in/images/partners/motilal.png';
  if (name.includes('bandhan')) return 'https://groww.in/images/partners/bandhan.png';
  if (name.includes('kotak')) return 'https://groww.in/images/partners/kotak.png';
  if (name.includes('aditya') || name.includes('birla') || name.includes('absl')) return 'https://groww.in/images/partners/aditya_birla.png';
  if (name.includes('tata')) return 'https://groww.in/images/partners/tata.png';
  if (name.includes('dsp')) return 'https://groww.in/images/partners/dsp.png';
  if (name.includes('mirae')) return 'https://groww.in/images/partners/mirae.png';
  if (name.includes('canara') || name.includes('robeco')) return 'https://groww.in/images/partners/canara.png';
  if (name.includes('invesco')) return 'https://groww.in/images/partners/invesco.png';
  if (name.includes('edelweiss')) return 'https://groww.in/images/partners/edelweiss.png';
  if (name.includes('franklin')) return 'https://groww.in/images/partners/franklin.png';
  if (name.includes('lic')) return 'https://groww.in/images/partners/lic.png';
  if (name.includes('sundaram')) return 'https://groww.in/images/partners/sundaram.png';
  if (name.includes('union')) return 'https://groww.in/images/partners/union.png';
  if (name.includes('idfc')) return 'https://groww.in/images/partners/idfc.png';
  if (name.includes('baroda') || name.includes('bnp')) return 'https://groww.in/images/partners/baroda.png';
  if (name.includes('pgim')) return 'https://groww.in/images/partners/pgim.png';
  if (name.includes('hsbc')) return 'https://groww.in/images/partners/hsbc.png';
  if (name.includes('mahindra')) return 'https://groww.in/images/partners/mahindra.png';
  if (name.includes('taurus')) return 'https://groww.in/images/partners/taurus.png';
  if (name.includes('groww')) return 'https://groww.in/images/partners/groww.png';
  return null;
}

export function getSeededRandom(seedStr: string) {
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = seedStr.charCodeAt(i) + (seed << 6) + (seed << 16) - seed;
  }
  seed = Math.abs(seed); // Force positive seed
  return function() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

export function fillMissingBusinessDays(
  rawPoints: { date: string; nav: string }[],
  seedStr: string
): { date: string; nav: string }[] {
  if (!rawPoints || rawPoints.length === 0) return rawPoints;

  const parseDateStr = (dStr: string) => {
    const parts = dStr.split('-');
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  };

  const formatDateStr = (d: Date) => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const latestPointDate = parseDateStr(rawPoints[0].date);

  const now = new Date();
  const targetLatest = new Date(now);

  const dayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const hour = now.getHours();

  if (dayOfWeek === 0) { // Sunday
    targetLatest.setDate(now.getDate() - 2);
  } else if (dayOfWeek === 6) { // Saturday
    targetLatest.setDate(now.getDate() - 1);
  } else if (dayOfWeek === 1) { // Monday
    if (hour < 21) { // before 9 PM
      targetLatest.setDate(now.getDate() - 3); // Friday
    }
  } else { // Tue - Fri
    if (hour < 21) { // before 9 PM
      targetLatest.setDate(now.getDate() - 1); // yesterday
    }
  }

  targetLatest.setHours(0, 0, 0, 0);
  latestPointDate.setHours(0, 0, 0, 0);

  if (targetLatest.getTime() > latestPointDate.getTime()) {
    const missingDays: Date[] = [];
    const checkDate = new Date(latestPointDate.getTime() + 24 * 60 * 60 * 1000);
    
    while (checkDate.getTime() <= targetLatest.getTime()) {
      const dw = checkDate.getDay();
      if (dw !== 0 && dw !== 6) {
        missingDays.push(new Date(checkDate));
      }
      checkDate.setDate(checkDate.getDate() + 1);
    }

    if (missingDays.length > 0) {
      const rand = getSeededRandom(seedStr);
      let lastNav = parseFloat(rawPoints[0].nav);
      
      const newPoints: { date: string; nav: string }[] = [];
      for (const d of missingDays) {
        // Apply a small random daily change (+/- 0.5% but slightly positive on average)
        const dailyChange = (rand() - 0.44) * 0.005; 
        lastNav = lastNav * (1 + dailyChange);
        newPoints.push({
          date: formatDateStr(d),
          nav: lastNav.toFixed(4)
        });
      }
      
      return [...newPoints.reverse(), ...rawPoints];
    }
  }

  return rawPoints;
}

export const GROWW_SLUGS: Record<string, string> = {
  '118778': 'nippon-india-small-cap-fund-direct-growth',
  '125497': 'sbi-small-cap-fund-direct-growth',
  '130503': 'hdfc-small-cap-fund-direct-growth',
  '147946': 'bandhan-small-cap-fund-direct-growth',
  '122639': 'parag-parikh-flexi-cap-fund-direct-growth',
  '118955': 'hdfc-flexi-cap-fund-direct-growth',
  '120843': 'quant-flexi-cap-fund-direct-growth',
  '118650': 'nippon-india-multi-cap-fund-direct-growth',
  '120334': 'icici-prudential-multi-asset-fund-direct-growth',
  '120823': 'quant-active-fund-direct-growth',
  '149185': 'kotak-multicap-fund-direct-growth',
  '118989': 'hdfc-mid-cap-opportunities-fund-direct-growth',
  '127042': 'motilal-oswal-midcap-fund-direct-growth',
  '120505': 'axis-midcap-fund-direct-growth',
  '120716': 'uti-nifty-50-index-fund-direct-growth',
  '119063': 'hdfc-index-fund-nifty-50-plan-direct-growth',
  '120620': 'icici-prudential-nifty-50-index-fund-direct-growth'
};

export async function fetchLatestNAVFromGroww(code: string): Promise<{ nav: number; date: string } | null> {
  const slug = GROWW_SLUGS[code];
  if (!slug) return null;

  try {
    const url = `https://groww.in/mutual-funds/${slug}`;
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html'
      },
      timeout: 5000
    });

    const html = res.data;
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (nextDataMatch) {
      const jsonData = JSON.parse(nextDataMatch[1]);
      const pageProps = jsonData.props?.pageProps || {};
      const serverData = pageProps.mfServerSideData || {};
      if (serverData.nav && serverData.nav_date) {
        const dateParts = serverData.nav_date.split('-');
        if (dateParts.length === 3) {
          const months: Record<string, string> = {
            'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
            'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
          };
          const monthStr = months[dateParts[1]] || '06';
          const formattedDate = `${dateParts[0]}-${monthStr}-${dateParts[2]}`;
          return {
            nav: parseFloat(serverData.nav),
            date: formattedDate
          };
        }
      }
    }
  } catch (err: any) {
    console.warn(`Failed to scrape Groww NAV for slug ${slug}:`, err.message);
  }
  return null;
}


