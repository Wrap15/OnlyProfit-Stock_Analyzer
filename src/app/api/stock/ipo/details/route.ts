import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9'
};

// Simple memory cache: map searchId -> { data, timestamp }
const cacheMap = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 1800000; // 30 minutes

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const searchId = searchParams.get('searchId');

  if (!searchId) {
    return NextResponse.json({ error: 'searchId is required' }, { status: 400 });
  }

  const now = Date.now();
  const cached = cacheMap.get(searchId);
  if (cached && (now - cached.timestamp < CACHE_DURATION)) {
    return NextResponse.json(cached.data);
  }

  try {
    const res = await axios.get(`https://groww.in/ipo/${searchId}`, { headers: HEADERS, timeout: 10000 });
    const html = res.data;
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);

    if (nextDataMatch) {
      const jsonData = JSON.parse(nextDataMatch[1]);
      const ipoData = jsonData.props?.pageProps?.ipoData || null;

      if (!ipoData) {
        throw new Error('IPO data not found in page properties');
      }

      cacheMap.set(searchId, { data: ipoData, timestamp: now });
      return NextResponse.json(ipoData);
    } else {
      throw new Error('Could not find __NEXT_DATA__ block on IPO details page');
    }
  } catch (err: any) {
    console.error(`Failed to fetch details for IPO ${searchId}:`, err.message);
    if (cached) {
      console.log(`Returning stale cache for IPO ${searchId}`);
      return NextResponse.json(cached.data);
    }
    return NextResponse.json({ error: `Failed to fetch IPO details: ${err.message}` }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
