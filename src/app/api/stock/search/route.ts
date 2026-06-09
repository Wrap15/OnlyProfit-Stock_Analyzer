import { NextRequest, NextResponse } from 'next/server';
import { searchStocksFromAPI } from '@/lib/yahooFinance';
import { MUTUAL_FUNDS } from '@/lib/mutualfunds';
import axios from 'axios';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json([]);
  }

  try {
    // 1. Fetch stock results
    const stockResults = await searchStocksFromAPI(query);

    // 2. Query mutual fund listings dynamically from AMFI API
    let mfResults: any[] = [];
    try {
      const amfiRes = await axios.get(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(query)}`, { timeout: 3000 });
      const amfiData = amfiRes.data;
      if (Array.isArray(amfiData)) {
        mfResults = amfiData.slice(0, 10).map((item: any) => ({
          symbol: String(item.schemeCode),
          name: item.schemeName,
          exchange: 'MF',
          type: 'MUTUALFUND'
        }));
      }
    } catch (amfiErr) {
      console.error('Failed to search AMFI API, falling back to local search:', amfiErr);
      const lowerQuery = query.toLowerCase();
      mfResults = MUTUAL_FUNDS.filter(
        f => f.name.toLowerCase().includes(lowerQuery) || 
             f.code.includes(lowerQuery) || 
             f.categoryLabel.toLowerCase().includes(lowerQuery)
      ).map(f => ({
        symbol: f.code,
        name: f.name,
        exchange: 'MF',
        type: 'MUTUALFUND'
      }));
    }

    // 3. Combine results (mutual funds first for visibility, then stocks)
    return NextResponse.json([...mfResults, ...stockResults]);
  } catch (error: any) {
    console.error('Search API failure:', error);
    return NextResponse.json({ error: error.message || 'Failed to search' }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
