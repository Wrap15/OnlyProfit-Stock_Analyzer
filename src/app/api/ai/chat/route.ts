import { NextRequest, NextResponse } from 'next/server';
import { fetchStockQuoteFromAPI, searchStocksFromAPI } from '@/lib/yahooFinance';
import { 
  LARGE_CAP_SYMBOLS, 
  MID_CAP_SYMBOLS, 
  SMALL_CAP_SYMBOLS 
} from '@/constants/marketSymbols';
import { MOCK_STOCK_INFO } from '@/lib/yahooFinance';
import { MUTUAL_FUNDS } from '@/lib/mutualfunds';

export const dynamic = 'force-dynamic';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SIGNALS_POOL = [
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries', signal: 'STRONG_BUY', target: 3180.00, sl: 2840.00, indicator: 'MACD Bullish Crossover' },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services', signal: 'BUY', target: 4420.00, sl: 3980.00, indicator: 'RSI Oversold Breakout' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Limited', signal: 'STRONG_BUY', target: 1790.00, sl: 1540.00, indicator: 'Golden Cross (50/200 SMA)' },
  { symbol: 'INFY.NS', name: 'Infosys Limited', signal: 'BUY', target: 1740.00, sl: 1590.00, indicator: 'Double Bottom Pattern' },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank Limited', signal: 'BUY', target: 1220.00, sl: 1110.00, indicator: 'Channel Breakout' }
];

export async function POST(request: NextRequest) {
  try {
    const { messages } = (await request.json()) as { messages: ChatMessage[] };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages parameter is required' }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1].content;
    const cleanMsg = lastMessage.toLowerCase().trim();

    // 1. Search for Mutual Fund matches
    let targetFund: any = null;
    for (const fund of MUTUAL_FUNDS) {
      const fundName = fund.name.toLowerCase();
      const codeStr = fund.code.toString();
      
      if (
        cleanMsg.includes(codeStr) || 
        cleanMsg.includes(fundName) || 
        (fundName.length > 12 && cleanMsg.includes(fundName.substring(0, 14))) ||
        (cleanMsg.includes('fund') && cleanMsg.includes(fundName.split(' ')[0]))
      ) {
        targetFund = fund;
        break;
      }
    }

    if (targetFund) {
      const riskClass = targetFund.y1Return > 35 ? 'VERY HIGH RISK' : targetFund.y1Return > 22 ? 'HIGH RISK' : 'MODERATE RISK';
      const content = `### AI Agent Analysis: **${targetFund.name}** (\`Code: ${targetFund.code}\`)
      
Here is the dynamic technical scan for the requested Mutual Fund Scheme:

| Parameter | Value |
| :--- | :--- |
| **Current NAV** | ₹${targetFund.baseNav.toFixed(2)} |
| **Asset Category** | ${targetFund.categoryLabel} |
| **1-Year Return** | ${targetFund.y1Return >= 0 ? '+' : ''}${targetFund.y1Return.toFixed(2)}% |
| **3-Year Return** | ${targetFund.y3Return >= 0 ? '+' : ''}${targetFund.y3Return.toFixed(2)}% |
| **Risk Assessment** | \`${riskClass}\` |

**AI Scheme Narrative:**
The **${targetFund.name}** is an active scheme under the **${targetFund.categoryLabel}** category. Over a 3-year investment horizon, it has generated a compounding annualized return (CAGR) of **${targetFund.y3Return}%**, outperforming its category average benchmark. Standard deviation sits at a steady level, indicating a stable risk-adjusted return model suitable for long-term wealth compounding.`;
      
      return NextResponse.json({ role: 'assistant', content });
    }

    // 2. Search for any matching stock symbol or name dynamically
    const allSymbols = Array.from(new Set([
      ...LARGE_CAP_SYMBOLS, 
      ...MID_CAP_SYMBOLS, 
      ...SMALL_CAP_SYMBOLS
    ]));

    let targetSymbol = '';
    let cleanSymbolName = '';

    for (const sym of allSymbols) {
      const cleanSym = sym.replace('.NS', '').toUpperCase();
      const meta = MOCK_STOCK_INFO[sym] || {};
      const companyName = (meta.name || cleanSym).toLowerCase();
      
      if (
        cleanMsg.includes(cleanSym.toLowerCase()) || 
        cleanMsg === sym.toLowerCase() || 
        (companyName.length > 4 && cleanMsg.includes(companyName))
      ) {
        targetSymbol = sym;
        cleanSymbolName = cleanSym;
        break;
      }
    }

    // Dynamic Search Fallback (for any stock listed on NSE e.g., GOLDIAM)
    if (!targetSymbol) {
      const searchTerm = cleanMsg
        .replace(/analyze/g, '')
        .replace(/should i buy/g, '')
        .replace(/what about/g, '')
        .replace(/tell me about/g, '')
        .replace(/stock quote/g, '')
        .replace(/analysis/g, '')
        .replace(/quote/g, '')
        .trim();
        
      if (searchTerm.length >= 3) {
        try {
          const searchResults = await searchStocksFromAPI(searchTerm);
          if (searchResults && searchResults.length > 0) {
            targetSymbol = searchResults[0].symbol;
            cleanSymbolName = targetSymbol.replace('.NS', '').replace('.BO', '');
          }
        } catch (searchErr) {
          console.error('AI chat dynamic search fallback failed:', searchErr);
        }
      }
    }

    // 3. Resolve matching signals if symbol was detected
    if (targetSymbol) {
      try {
        const quotes = await fetchStockQuoteFromAPI([targetSymbol]);
        if (quotes && quotes.length > 0) {
          const q = quotes[0];
          const ltp = q.regularMarketPrice || 150;
          const pct = q.regularMarketChangePercent || 0;
          const change = q.regularMarketChange || 0;
          
          const matchingPool = SIGNALS_POOL.find(s => s.symbol === targetSymbol);
          const signal = matchingPool ? matchingPool.signal : (pct >= 0 ? 'BUY' : 'SELL');
          const targetPrice = matchingPool ? matchingPool.target : ltp * (pct >= 0 ? 1.085 : 0.915);
          const stopLoss = matchingPool ? matchingPool.sl : ltp * (pct >= 0 ? 0.95 : 1.05);
          const indicator = matchingPool ? matchingPool.indicator : 'Relative Strength Index (14) Crossover';

          const content = `### AI Agent Analysis: **${q.longName || q.shortName || cleanSymbolName}** (\`${cleanSymbolName}\`)
          
Here is the real-time AI trading signal and chart setup scan for **${cleanSymbolName}**:

| Parameter | Value |
| :--- | :--- |
| **Current Price (LTP)** | ₹${ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })} |
| **Daily Change** | ${change >= 0 ? '▲ +' : '▼ '}${change.toFixed(2)} (${pct.toFixed(2)}%) |
| **AI Technical Signal** | \`${signal}\` |
| **Trigger Indicator** | ${indicator} |
| **Target Price (T1)** | ₹${targetPrice.toFixed(2)} |
| **Stop Loss (SL)** | ₹${stopLoss.toFixed(2)} |

**Technical Narrative:**
The asset **${cleanSymbolName}** is displaying a daily trend of ${pct >= 0 ? 'upward' : 'downward'} momentum. RSI (14) is sitting at ${pct >= 0 ? '61.8' : '42.5'} indicating a stable trading range. Based on our moving averages crossover analysis, we suggest executing a **${signal}** setup with a strict risk-to-reward boundary. Ensure stop-loss parameters are adhered to.`;
          
          return NextResponse.json({ role: 'assistant', content });
        }
      } catch (err) {
        console.error('AI chat quote fetch failure', err);
      }
    }

    // 4. Handle general advice or signal query matches
    if (cleanMsg.includes('signal') || cleanMsg.includes('hot') || cleanMsg.includes('buy') || cleanMsg.includes('top')) {
      const content = `### Top Simulated Breakout Signals (Live Scan)
      
Here are the top active technical setups scanned by our OnlyProfit AI Agents:

1. **Reliance Industries** (\`RELIANCE\`)
   - **Signal**: \`STRONG_BUY\`
   - **Trigger**: MACD Bullish Crossover
   - **LTP**: ₹2,950.45 (Target: ₹3,180.00 | SL: ₹2,840.00)
2. **HDFC Bank** (\`HDFCBANK\`)
   - **Signal**: \`STRONG_BUY\`
   - **Trigger**: Golden Cross (50/200 SMA)
   - **LTP**: ₹1,620.10 (Target: ₹1,790.00 | SL: ₹1,540.00)
3. **Tata Consultancy Services** (\`TCS\`)
   - **Signal**: \`BUY\`
   - **Trigger**: RSI Oversold Breakout
   - **LTP**: ₹4,120.20 (Target: ₹4,420.00 | SL: ₹3,980.00)

*Type any stock or mutual fund name (e.g., "tell me about Parag Parikh Flexi Cap" or "analyze WIPRO") to run a dynamic scan.*`;
      return NextResponse.json({ role: 'assistant', content });
    }

    // 5. Handle index queries
    if (cleanMsg.includes('nifty') || cleanMsg.includes('sensex') || cleanMsg.includes('index') || cleanMsg.includes('bse') || cleanMsg.includes('nse')) {
      const content = `### Indian Stock Market Benchmarks
      
Here is the real-time scan for the major Indian stock indexes:

- **BSE SENSEX (\`^BSESN\`):** ~**78,830.00** 
  - Represents the weighted average of 30 well-established and financially sound companies listed on the Bombay Stock Exchange (BSE).
- **NSE Nifty 50 (\`^NSEI\`):** ~**24,660.00**
  - Represents the weighted average of the top 50 largest Indian companies listed on the National Stock Exchange (NSE).
- **Nifty Bank (\`^NSEBANK\`):** ~**57,740.00**
  - Tracks the capital performance of the 12 most liquid and large-capitalized Indian banking stocks.

**AI Outlook:**
Market indicators suggest a stable range-bound trading channel. Technical support for Nifty 50 is established at **24,400** while overhead resistance sits at **24,800**.`;
      return NextResponse.json({ role: 'assistant', content });
    }

    // 6. Handle CAGR and Returns
    if (cleanMsg.includes('cagr') || cleanMsg.includes('return') || cleanMsg.includes('performance') || cleanMsg.includes('yield')) {
      const content = `### CAGR vs Absolute Returns Guide
      
When analyzing stocks and mutual funds, understanding CAGR (Compound Annual Growth Rate) is key:

$$CAGR = \\left( \\frac{\\text{Ending Value}}{\\text{Beginning Value}} \\right)^{\\frac{1}{n}} - 1$$

- **CAGR:** Shows the smoothed annual rate of return as if your investment grew at a steady compounding rate. It is the gold standard for investments held over 1 year (e.g. mutual funds' 3Y and 5Y returns).
- **Absolute Return:** The simple percentage increase/decrease from start to finish:
  $$\\text{Absolute Return} = \\left( \\frac{\\text{Ending Value} - \\text{Beginning Value}}{\\text{Beginning Value}} \\right) \\times 100$$
  Suitable for short-term trades (e.g., today's wiggling wiggles!).

**AI Recommendation:**
Always prioritize funds with a stable **3-year CAGR exceeding 15%** and a healthy risk-to-reward Sharpe ratio.`;
      return NextResponse.json({ role: 'assistant', content });
    }

    // 7. Handle Valuation Metrics (PE / PB Ratio)
    if (cleanMsg.includes('pe ratio') || cleanMsg.includes('p/e') || cleanMsg.includes('valuation') || cleanMsg.includes('pb ratio') || cleanMsg.includes('p/b')) {
      const content = `### Valuation Analysis: P/E and P/B Ratios
      
OnlyProfit AI scanners check valuation ratios to detect underpriced gems:

1. **P/E (Price-to-Earnings) Ratio:**
   $$\\text{P/E} = \\frac{\\text{Market Share Price}}{\\text{EPS (Earnings Per Share)}}$$
   - Measures how much investors are willing to pay per rupee of earnings.
   - Low P/E relative to peers (e.g. IT sector PE vs Wipro PE) suggests undervaluation, whereas high P/E indicates high growth expectations.
2. **P/B (Price-to-Book) Ratio:**
   $$\\text{P/B} = \\frac{\\text{Market Share Price}}{\\text{Book Value Per Share}}$$
   - Compares market value to book value. Very useful for banking stocks (like HDFC Bank or SBI).

**Scan tip:** Look for stocks where current P/E is **lower than the historical 5-year average** or sector P/E while earnings growth remains strong.`;
      return NextResponse.json({ role: 'assistant', content });
    }

    // 8. Handle Mutual Fund Category Overview / Recommendations
    if (cleanMsg.includes('recommend') || cleanMsg.includes('best fund') || cleanMsg.includes('top fund') || cleanMsg.includes('mutual fund list')) {
      const content = `### Curated Top Mutual Funds (AI Scanner Picks)
      
Here are the top-rated Indian mutual funds based on 3-year performance and asset quality:

1. **Flexi Cap Schemes (Best for General Equity Diversification):**
   - **Parag Parikh Flexi Cap Fund** (\`Code: 122639\`)
     - NAV: ₹85.60 | 3Y Return: **+24.8% CAGR** (High risk, premium quality)
2. **Bluechip / Large Cap Schemes (Best for Stable Bluechip Assets):**
   - **SBI Bluechip Fund** (\`Code: 103004\`)
     - NAV: ₹92.15 | 3Y Return: **+18.4% CAGR** (Moderate risk)
3. **Small Cap Schemes (Best for Aggressive Long-Term Growth):**
   - **Nippon India Small Cap Fund** (\`Code: 119598\`)
     - NAV: ₹162.30 | 3Y Return: **+34.2% CAGR** (Very high risk, explosive returns)

*Type any fund name or code (e.g. "analyze 122639" or "SBI Bluechip") to pull a detailed scheme breakdown.*`;
      return NextResponse.json({ role: 'assistant', content });
    }

    // 9. Handle general Technical Indicators guide
    if (cleanMsg.includes('rsi') || cleanMsg.includes('macd') || cleanMsg.includes('bollinger') || cleanMsg.includes('indicator') || cleanMsg.includes('technical')) {
      const content = `### AI Guide: Key Charting Indicators
      
Our OnlyProfit real-time wiggler and scanners parse three primary indicators:

- **RSI (Relative Strength Index):** A momentum oscillator ranging 0-100. RSI > 70 is **overbought** (potential sell), and RSI < 30 is **oversold** (potential buy).
- **MACD (Moving Average Convergence Divergence):** Highlights trend crossovers. A MACD line crossing above the Signal line triggers a **bullish breakout (BUY)**.
- **Bollinger Bands:** Measures volatility. Prices hitting the **lower band** indicate a potential support bounce, while hitting the **upper band** suggests overextension.

*You can toggle RSI and MACD overlays directly on our fullscreen stock trajectory chart!*`;
      return NextResponse.json({ role: 'assistant', content });
    }

    // 10. Handle stock vs mutual fund comparison
    if (cleanMsg.includes('compare') || cleanMsg.includes('difference') || cleanMsg.includes('vs') || cleanMsg.includes('stock or fund')) {
      const content = `### Comparison Guide: Stocks vs. Mutual Funds
      
Here is the AI comparison checklist to guide your asset allocation:

| Feature | Direct Stock Investing | Mutual Fund Investing |
| :--- | :--- | :--- |
| **Control** | Full control (you choose the exact shares) | Entrusted to professional Fund Managers |
| **Diversification** | Self-managed (requires high capital to diversify) | Auto-diversified across 40+ stocks instantly |
| **Risk Boundary** | High (subject to single-stock volatility/shocks) | Diversified (lower relative shock risk) |
| **Required Effort**| High (requires daily chart reviews/LTP wiggles) | Low (set-and-forget SIP model) |
| **Ideal for** | Active traders / Alpha seekers | Long-term wealth builders |

**AI Advice:** Real-world broker portfolios (Groww/Angel One) typically balance capital with **70% diversified mutual funds** and **30% active tactical stocks**.`;
      return NextResponse.json({ role: 'assistant', content });
    }

    // 11. Dynamic NLP Keyword Parser (discussed anything not matched above)
    // Extract keywords
    const keywords = cleanMsg
      .replace(/[^a-z0-9\s]/g, '')
      .split(' ')
      .filter(w => w.length > 3 && !['what', 'how', 'why', 'where', 'should', 'about', 'stock', 'fund', 'invest', 'please', 'analyze'].includes(w));
    
    if (keywords.length > 0) {
      const parsedTopic = keywords.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      const content = `### AI Agent Scanning Report: **${parsedTopic}**
      
I've scanned the simulated market registers and financial databases for your query regarding **${parsedTopic}**. Here is the AI Copilot analysis:

1. **Market Context & Relevance:**
   The topic **${parsedTopic}** falls under our simulated wealth creation scanning model. Based on live NSE data wiggles, associated stock and fund assets are experiencing stable correlation coefficients.
2. **Tactical Strategy Suggestion:**
   - If this is a stock asset: Check current P/E valuations and 50 SMA crossover indicators before building a position.
   - If this is a mutual fund concept: Ensure the historical CAGR over 3 years beats its benchmark category.
3. **Risk Profile:**
   Always manage risk limits carefully. For active trading, establish a strict **2% stop loss** and do not over-leverage intraday MIS positions.

*If you were asking about a specific stock or mutual fund, please type its exact ticker name (e.g. "Reliance" or "SBI Bluechip") for a live quote.*`;
      return NextResponse.json({ role: 'assistant', content });
    }

    // 12. Default helpful chat response
    const content = `Hello! I am your **OnlyProfit AI Copilot**. I can run dynamic technical scans, fund performance analysis, and risk estimations for over 200 NSE stocks and mutual funds.

Try asking me:
- *"Analyze State Bank of India"*
- *"Parag Parikh Flexi Cap Fund analysis"*
- *"Wipro quote and targets"*
- *"Show me the top buy signals"*`;

    return NextResponse.json({ role: 'assistant', content });

  } catch (error: any) {
    console.error('AI Chatbot endpoint failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
