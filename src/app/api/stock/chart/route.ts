import { NextRequest, NextResponse } from 'next/server';
import { fetchStockChartFromAPI } from '@/lib/yahooFinance';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const range = searchParams.get('range') || '1d';

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
  }

  try {
    const data = await fetchStockChartFromAPI(symbol.toUpperCase(), range);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch stock chart data' }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
