import { NextResponse } from 'next/server';
import axios from 'axios';

// In-Memory cache variables
let cachedNews: any[] = [];
let cacheTime = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes cache revalidation

const RSS_FEEDS = [
  { url: 'https://economictimes.indiatimes.com/markets/rssfeedofxml.cms', source: 'Economic Times' },
  { url: 'https://www.moneycontrol.com/rss/MC_markets.xml', source: 'Moneycontrol' }
];

function getRelativeTimeAgo(publishedAtStr: string): string {
  const publishedDate = new Date(publishedAtStr);
  const now = new Date();
  
  if (isNaN(publishedDate.getTime())) {
    return '1 hour ago';
  }
  
  const diffMs = now.getTime() - publishedDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

// Tag articles to symbols/sectors based on keyword match
function extractTags(title: string, description: string) {
  const text = `${title} ${description}`.toLowerCase();
  const tags: { symbol?: string; sector?: string } = {};

  if (text.includes('reliance')) {
    tags.symbol = 'RELIANCE.NS';
    tags.sector = 'Energy & Retail';
  } else if (text.includes('tcs') || text.includes('tata consultancy')) {
    tags.symbol = 'TCS.NS';
    tags.sector = 'IT Services';
  } else if (text.includes('infosys') || text.includes('infy')) {
    tags.symbol = 'INFY.NS';
    tags.sector = 'IT Services';
  } else if (text.includes('hdfc')) {
    tags.symbol = 'HDFCBANK.NS';
    tags.sector = 'Banking & Finance';
  } else if (text.includes('icici')) {
    tags.symbol = 'ICICIBANK.NS';
    tags.sector = 'Banking & Finance';
  } else if (text.includes('sbi ') || text.includes('state bank')) {
    tags.symbol = 'SBIN.NS';
    tags.sector = 'Banking & Finance';
  } else if (text.includes('itc')) {
    tags.symbol = 'ITC.NS';
    tags.sector = 'FMCG';
  } else if (text.includes('tata motors')) {
    tags.symbol = 'TATAMOTORS.NS';
    tags.sector = 'Automotive';
  } else if (text.includes('maruti')) {
    tags.symbol = 'MARUTI.NS';
    tags.sector = 'Automotive';
  } else if (text.includes('bharti airtel') || text.includes('airtel')) {
    tags.symbol = 'BHARTIARTL.NS';
    tags.sector = 'Telecom';
  } else if (text.includes('adani')) {
    tags.symbol = 'ADANIENT.NS';
    tags.sector = 'Infrastructure';
  } else if (text.includes(' Larsen ') || text.includes('l&t')) {
    tags.symbol = 'LT.NS';
    tags.sector = 'Infrastructure';
  }

  // Fallback sectors if symbol is not tagged
  if (!tags.sector) {
    if (text.includes('it ') || text.includes('software') || text.includes('tech')) {
      tags.sector = 'Technology';
    } else if (text.includes('bank') || text.includes('nifty bank') || text.includes('loan') || text.includes('rate hike')) {
      tags.sector = 'Banking';
    } else if (text.includes('ipo') || text.includes('listing')) {
      tags.sector = 'Primary Market';
    } else if (text.includes('gold') || text.includes('silver') || text.includes('commodity')) {
      tags.sector = 'Commodities';
    } else if (text.includes('rupee') || text.includes('forex') || text.includes('dollar')) {
      tags.sector = 'Forex';
    } else {
      tags.sector = 'Market Updates';
    }
  }

  return tags;
}

export async function GET() {
  const now = Date.now();

  // Return cached result if valid
  if (cachedNews.length > 0 && (now - cacheTime) < CACHE_DURATION) {
    console.log('Serving news RSS feed from in-memory cache.');
    return NextResponse.json(cachedNews, {
      headers: {
        'Cache-Control': 'public, max-age=900, must-revalidate'
      }
    });
  }

  const items: any[] = [];

  for (const feed of RSS_FEEDS) {
    try {
      console.log(`Fetching RSS feed from: ${feed.url}`);
      const res = await axios.get(feed.url, {
        headers: {
          'User-Agent': 'Mozilla/5.5 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/xml, application/xml, application/rss+xml'
        },
        timeout: 5000
      });

      if (res.status === 200 && res.data) {
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;
        let count = 0;

        while ((match = itemRegex.exec(res.data)) !== null && count < 15) {
          const itemContent = match[1];

          // Title extraction
          const titleMatch = itemContent.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || itemContent.match(/<title>([\s\S]*?)<\/title>/);
          const title = titleMatch ? titleMatch[1].trim() : '';

          // Description extraction
          const descMatch = itemContent.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || itemContent.match(/<description>([\s\S]*?)<\/description>/);
          let description = descMatch ? descMatch[1].trim() : '';
          
          // Clean HTML tags and limit length
          description = description.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"');
          if (description.length > 220) {
            description = description.substring(0, 220).trim() + '...';
          }

          // Link extraction
          const linkMatch = itemContent.match(/<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>/) || itemContent.match(/<link>([\s\S]*?)<\/link>/);
          let link = linkMatch ? linkMatch[1].trim() : '';
          link = link.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/[\r\n\t]/g, '').trim();

          // Date extraction
          const pubDateMatch = itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
          const pubDate = pubDateMatch ? pubDateMatch[1].trim() : '';

          if (title && link) {
            const tags = extractTags(title, description);
            
            items.push({
              id: `${feed.source.toLowerCase().replace(' ', '-')}-${Date.now()}-${count}`,
              title: title.replace(/&amp;/g, '&').replace(/&quot;/g, '"'),
              description: description || 'Read the full article for market insights.',
              link,
              pubDate,
              timeAgo: getRelativeTimeAgo(pubDate),
              source: feed.source,
              ...tags
            });
            count++;
          }
        }
      }
    } catch (err: any) {
      console.warn(`Failed to parse RSS feed from ${feed.source}:`, err.message);
    }
  }

  // Fallback to static mock articles if both calls fail
  if (items.length === 0) {
    console.log('All RSS calls failed. Using baseline news feed.');
    const mockFeed = [
      {
        id: 'fallback-1',
        title: 'Nifty 50 trades flat as tech stocks experience profit booking',
        description: 'TCS, Infosys, and Wipro lead losses while banking bluechips like HDFC Bank and ICICI Bank offer support to hold index levels.',
        link: 'https://economictimes.indiatimes.com/markets',
        pubDate: new Date().toUTCString(),
        timeAgo: '15m ago',
        source: 'Economic Times',
        sector: 'Market Updates'
      },
      {
        id: 'fallback-2',
        title: 'RBI Monetary Policy Committee keeps repo rate unchanged at 6.5%',
        description: 'The central bank reiterates its stance on withdrawal of accommodation to bring CPI inflation targets to a steady 4% level.',
        link: 'https://www.moneycontrol.com/news/business/economy',
        pubDate: new Date().toUTCString(),
        timeAgo: '45m ago',
        source: 'Moneycontrol',
        sector: 'Macro Economy'
      },
      {
        id: 'fallback-3',
        title: 'Gold prices hit record high of ₹73,200 per 10 grams amid global tensions',
        description: 'Commodity desks expect safe-haven flows to continue supporting precious metals over the third quarter of 2026.',
        link: 'https://www.moneycontrol.com/news/business/commodities',
        pubDate: new Date().toUTCString(),
        timeAgo: '2h ago',
        source: 'Moneycontrol',
        sector: 'Commodities'
      }
    ];
    items.push(...mockFeed);
  }

  // Sort by date (newest first)
  items.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

  // Store in cache
  cachedNews = items;
  cacheTime = now;

  return NextResponse.json(items, {
    headers: {
      'Cache-Control': 'public, max-age=900, must-revalidate'
    }
  });
}

export const dynamic = 'force-dynamic';
