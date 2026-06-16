import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9'
};

let cachedIpoData: any = null;
let lastFetchTime = 0;
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

export async function GET(_request: NextRequest) {
  const now = Date.now();
  if (cachedIpoData && (now - lastFetchTime < CACHE_DURATION)) {
    return NextResponse.json(cachedIpoData);
  }

  try {
    const res = await axios.get('https://groww.in/ipo', { headers: HEADERS, timeout: 10000 });
    const html = res.data;
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    
    if (nextDataMatch) {
      const jsonData = JSON.parse(nextDataMatch[1]);
      const pageProps = jsonData.props?.pageProps || {};
      
      const ipoData = {
        open: pageProps.openDataList || [],
        closed: pageProps.closedDataList || [],
        upcoming: pageProps.upcomingDataList || []
      };
      
      cachedIpoData = ipoData;
      lastFetchTime = now;
      
      return NextResponse.json(ipoData);
    } else {
      throw new Error('Could not find __NEXT_DATA__ block on Groww page');
    }
  } catch (err: any) {
    console.error('Failed to scrape Groww IPO page:', err.message);
    // Return stale cache if available, otherwise return error
    if (cachedIpoData) {
      return NextResponse.json(cachedIpoData);
    }
    return NextResponse.json({ error: 'Failed to fetch IPO details: ' + err.message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
