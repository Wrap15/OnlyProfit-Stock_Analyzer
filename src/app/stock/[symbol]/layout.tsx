import { Metadata } from 'next';
import { fetchStockQuoteFromAPI } from '@/lib/yahooFinance';

interface Props {
  params: {
    symbol: string;
  };
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const rawSymbol = params.symbol;
  const cleanSym = rawSymbol.toUpperCase();
  const querySym = cleanSym.endsWith('.NS') || cleanSym.endsWith('.BO') || cleanSym.startsWith('^')
    ? cleanSym
    : `${cleanSym}.NS`;

  try {
    const quotes = await fetchStockQuoteFromAPI([querySym]);
    if (quotes && quotes.length > 0) {
      const q = quotes[0];
      const name = q.longName || q.shortName || cleanSym;
      const desc = q.longBusinessSummary 
        ? q.longBusinessSummary.slice(0, 155) + '...'
        : `Track real-time simulated price updates, options chain matrix, and technical sentiment scores for ${name}.`;

      return {
        title: `${name} (${cleanSym}) Live Share Price & Analysis`,
        description: desc,
        openGraph: {
          title: `${name} (${cleanSym}) Share Price - OnlyProfit`,
          description: desc,
          type: 'website',
          url: `https://onlyprofit.com/stock/${rawSymbol}`
        }
      };
    }
  } catch (err) {
    console.warn(`generateMetadata failed for stock symbol ${rawSymbol}`, err);
  }

  return {
    title: `${cleanSym} Live Stock Chart & Technical Scans`,
    description: `Analyze live charts, options pricing matrix, technical oscillators, and corporate actions for stock ticker ${cleanSym}.`
  };
}

export default function StockLayout({ children }: Props) {
  return <>{children}</>;
}
