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
    console.warn('Search API failure, serving mock search results:', error.message);
    const lowerQuery = query.toLowerCase();
    
    // Fallback mutual fund search results
    const mfResults = MUTUAL_FUNDS.filter(
      f => f.name.toLowerCase().includes(lowerQuery) || 
           f.code.includes(lowerQuery)
    ).map(f => ({
      symbol: f.code,
      name: f.name,
      exchange: 'MF',
      type: 'MUTUALFUND'
    }));

    // Fallback stock search results
    const mockStocks = [
      { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', exchange: 'NSE', type: 'EQUITY' },
      { symbol: 'TCS', name: 'Tata Consultancy Services Ltd', exchange: 'NSE', type: 'EQUITY' },
      { symbol: 'INFY', name: 'Infosys Ltd', exchange: 'NSE', type: 'EQUITY' },
      { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', exchange: 'NSE', type: 'EQUITY' },
      { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', exchange: 'NSE', type: 'EQUITY' },
      { symbol: 'SBIN', name: 'State Bank of India', exchange: 'NSE', type: 'EQUITY' }
    ].filter(s => s.symbol.toLowerCase().includes(lowerQuery) || s.name.toLowerCase().includes(lowerQuery));

    return NextResponse.json([...mfResults, ...mockStocks]);
  }
}
export const dynamic = 'force-dynamic';
