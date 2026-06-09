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
