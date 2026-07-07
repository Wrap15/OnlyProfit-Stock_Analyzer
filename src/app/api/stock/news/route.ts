import { NextResponse } from 'next/server';

function getDynamicDailyNews() {
  const today = new Date();
  const daySeed = today.getFullYear() * 1000 + (today.getMonth() + 1) * 31 + today.getDate();
  
  // Stable random generator based on the day seed
  let seed = daySeed;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const getDynamicDateStr = (daysOffset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Pools of news templates that rotate based on the calendar day seed
  const newsPool = [
    {
      symbol: 'TCS',
      title: 'TCS wins multi-million dollar cloud migration deal with UK retail giant',
      description: 'Tata Consultancy Services announced a strategic partnership to transform the digital infrastructure and cloud capabilities of one of Europe\'s largest retailers, generating long-term recurring revenue streams.',
      source: 'ECONOMIC TIMES'
    },
    {
      symbol: 'INFY',
      title: 'Infosys expands AI collaboration with global chip designer for enterprise solutions',
      description: 'Infosys announced a broad-based partnership to build generative AI solutions for industrial engineering clients, leveraging state-of-the-art model deployments and consulting pipelines.',
      source: 'MINT'
    },
    {
      symbol: 'RELIANCE',
      title: 'Reliance Retail footprint grows with 150 new store launches in tier-2 cities',
      description: 'Reliance Retail Ventures announced an aggressive expansion plan for its smart superstore formats, boosting retail logistics coverage and digital delivery integrations across North India.',
      source: 'FINANCIAL EXPRESS'
    },
    {
      symbol: 'HDFCBANK',
      title: 'HDFC Bank net interest margins stabilize as deposit growth matches loan books',
      description: 'HDFC Bank reported stable net interest margins (NIMs) for the latest quarter, driven by strong growth in retail deposits and commercial lending segments.',
      source: 'BUSINESS LINE'
    },
    {
      symbol: 'ICICIBANK',
      title: 'ICICI Bank launches digital banking suite for MSME export financing',
      description: 'ICICI Bank introduced an integrated digital ecosystem to facilitate cross-border credit facilities and working capital management for medium scale manufacturing exporters.',
      source: 'CNBC TV18'
    },
    {
      symbol: 'TATASTEEL',
      title: 'Tata Steel green energy transition picks up speed at European facilities',
      description: 'Tata Steel announced a capital allocation package to build electric arc furnaces in the UK and Netherlands, reducing carbon footprints while lowering energy costs.',
      source: 'REUTERS'
    },
    {
      symbol: 'BHARTIARTL',
      title: 'Bharti Airtel rolls out high-speed FWA services across 50 capital cities',
      description: 'Airtel has expanded its fixed wireless access (FWA) broadband services to major metropolitan areas, providing fiber-like speeds over 5G networks to residential complexes.',
      source: 'TELECOM TALK'
    },
    {
      symbol: 'LTIM',
      title: 'LTIMindtree launches enterprise cybersecurity framework for banking clients',
      description: 'LTIMindtree announced a suite of defense solutions to prevent ransomware and operational disruptions at retail banking infrastructures.',
      source: 'MONEYCONTROL'
    },
    {
      symbol: 'TITAN',
      title: 'Titan watches and eyewear divisions register double-digit revenue growth',
      description: 'Titan Company reported strong Q1 consumer demand in its luxury watch and eyewear retail channels, offsetting temporary adjustments in gold imports.',
      source: 'NDTV PROFIT'
    },
    {
      symbol: 'M&M',
      title: 'Mahindra utility vehicle bookings cross 2.5 lakh units as SUV demand surges',
      description: 'Mahindra & Mahindra reported robust demand for its premium SUV line, leading to extended production schedules and higher manufacturing throughput.',
      source: 'AUTO CAR INDIA'
    }
  ];

  const selectedStories = [];
  const shuffledPool = [...newsPool].sort(() => rand() - 0.5);
  for (let i = 0; i < 4; i++) {
    const story = shuffledPool[i % shuffledPool.length];
    const change = (rand() * 4 - 1.8);
    const timeIdx = Math.floor(rand() * 4);
    const times = ['45 MINUTES AGO', '2 HOURS AGO', '4 HOURS AGO', '6 HOURS AGO'];
    selectedStories.push({
      id: `dynamic-news-${i}-${daySeed}`,
      type: 'news' as const,
      symbol: story.symbol,
      changePercent: parseFloat(change.toFixed(2)),
      title: story.title,
      description: story.description,
      timeAgo: times[timeIdx],
      source: story.source
    });
  }

  const staticItems = [
    {
      id: 'event-1',
      type: 'news' as const,
      symbol: 'OBEROIRLTY',
      changePercent: 2.34,
      title: 'Oberoi Realty gains on clocking Rs 8,109-cr gross bookings at debut NCR luxury project',
      description: 'The project, located on Golf Course Extension Road in Sector 58, Gurugram, recorded bookings for around 2.1 million square feet of residential space.',
      timeAgo: '39 MINUTES AGO',
      source: 'CAPITAL MARKET - LIVE'
    },
    {
      id: 'event-2',
      type: 'corp' as const,
      symbol: 'GUJINJEC',
      changePercent: 1.15,
      title: 'Share Split',
      description: 'Face Value Change from 10 To 1',
      exDate: getDynamicDateStr(1),
      details: 'Face Value Change from 10 To 1'
    },
    {
      id: 'event-3',
      type: 'dividend' as const,
      symbol: 'CERA',
      changePercent: 0.95,
      title: 'Cash Dividend',
      description: 'Final • Dividend/Share: ₹75.00',
      exDate: getDynamicDateStr(0),
      details: 'Final • Dividend/Share: ₹75.00'
    },
    {
      id: 'event-7',
      type: 'dividend' as const,
      symbol: 'TCS',
      changePercent: -0.35,
      title: 'Interim Dividend',
      description: 'First Interim Dividend • Dividend/Share: ₹10.00',
      exDate: getDynamicDateStr(8),
      details: 'First Interim Dividend • Dividend/Share: ₹10.00'
    }
  ];

  return [...selectedStories, ...staticItems];
}

export async function GET() {
  const fallbackNews = getDynamicDailyNews();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3-second strict timeout

    // Attempt to pull external live feeds if available
    const res = await fetch('https://api.tickertape.in/market/news?limit=15', {
      signal: controller.signal,
      next: { revalidate: 60 } // Cache for 60 seconds
    });
    
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.data)) {
        // Map Tickertape API structure to our clean visual design
        const mapped = data.data.map((item: any, idx: number) => {
          const titleText = (item.title || '').toLowerCase();
          const summaryText = (item.summary || item.description || '').toLowerCase();
          const combinedText = `${titleText} ${summaryText}`;

          let typeVal: 'news' | 'corp' | 'dividend' | 'macro' | 'earnings' = 'news';
          if (combinedText.includes('dividend') || combinedText.includes('interim') || combinedText.includes('distribution')) {
            typeVal = 'dividend';
          } else if (combinedText.includes('split') || combinedText.includes('bonus') || combinedText.includes('merger') || combinedText.includes('face value') || combinedText.includes('share split') || combinedText.includes('demerger')) {
            typeVal = 'corp';
          } else if (combinedText.includes('profit') || combinedText.includes('earnings') || combinedText.includes('net profit') || combinedText.includes('revenue') || combinedText.includes('q1') || combinedText.includes('q2') || combinedText.includes('q3') || combinedText.includes('q4') || combinedText.includes('sales')) {
            typeVal = 'earnings';
          } else if (combinedText.includes('inflation') || combinedText.includes('cpi') || combinedText.includes('rbi') || combinedText.includes('repo rate') || combinedText.includes('gdp') || combinedText.includes('macro') || combinedText.includes('economic')) {
            typeVal = 'macro';
          }

          const change = (Math.random() * 4 - 1.8); // Simulate change percent for badge
          
          // Generate a realistic Ex Date if it's a dividend or corporate action event
          const exDate = typeVal === 'corp' || typeVal === 'dividend'
            ? `Jul ${10 + (idx % 18)}, 2026`
            : undefined;

          return {
            id: `api-news-${idx}-${item.id || Math.random()}`,
            type: typeVal,
            symbol: item.stocks?.[0]?.toUpperCase() || 'NIFTY 50',
            changePercent: parseFloat(change.toFixed(2)),
            title: item.title || 'Market Update',
            description: item.summary || item.description || 'Details published by market sources.',
            timeAgo: item.time || '1 HOUR AGO',
            source: item.source || 'TICKERTAPE',
            exDate: exDate,
            details: typeVal === 'corp' ? 'Face Value Split Details' : typeVal === 'dividend' ? 'Dividend Yield Declared' : undefined
          };
        });
        
        // Merge with our user-mockup events placing live daily news FIRST so the widget updates daily!
        return NextResponse.json([...mapped, ...fallbackNews]);
      }
    }
  } catch (err: any) {
    console.warn('News feed fetch failed or timed out. Serving high-fidelity dynamic news.', err.message);
  }
  
  return NextResponse.json(fallbackNews);
}
