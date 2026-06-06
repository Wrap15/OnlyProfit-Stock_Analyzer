import { NextRequest, NextResponse } from 'next/server';
import { searchStocksFromAPI } from '@/lib/yahooFinance';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json([]);
  }

  try {
    const data = await searchStocksFromAPI(query);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to search stocks' }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
