# OnlyProfit — Smart Investing & Market Simulator

**OnlyProfit** is a premium, mobile-first simulated market intelligence platform designed for Indian equities. It provides real-time tracking, interactive historical charts, fundamental key metrics (P/E, EPS), simulated mutual fund explorations, and a responsive Systematic Investment Plan (SIP) and Lumpsum return yield calculator.

Built on Next.js 14, OnlyProfit implements state-of-the-art caching, robust API fallbacks, search engine optimization (SEO), and hardware-accelerated animations for a premium, lightweight investing simulation experience.

---

## 🚀 Key Features

- **Unified Global Search (Stocks & Mutual Funds)**: Dynamically search and discover both NSE stock symbols and mutual fund schemes inside a single, unified navigation autocomplete bar. Routes to appropriate stock sidebars or mutual fund profiles with official Groww partner CDN logos.
- **Mobile-First Responsive Layouts**: Fully responsive interface scaling from compact mobile viewports (swipeable filter pills, full-screen search overlay, touch-friendly thick range sliders) up to large desktop dashboard grids.
- **Real-Time NSE Equity Tracking**: Monitor 30+ top National Stock Exchange (NSE) companies and indexes (Nifty 50, Sensex, Bank Nifty, Nifty IT) with live Yahoo Finance feeds.
- **Interactive Price Trend Charts**: Financial charting powered by `lightweight-charts`, rendering daily, monthly, yearly, and 5-year trendlines with dynamic resize adjustments.
- **Fundamental & Valuation Analysis**: Displays core valuation metrics including P/E Ratio, EPS (TTM), Market Cap, Daily Volume, and 52-Week Highs/Lows.
- **Tata Motors Demerger Alignment**: Fully aligned with the real-world corporate demerger by replacing the legacy delisted `TATAMOTORS` ticker with `TMPV.NS` (Tata Motors Passenger Vehicles Ltd) and `TMCV.NS` (Tata Motors Commercial Vehicles segment), returning actual live quotes.
- **Real-Time Market Movers**: Calculates and renders actual live-market **Top Gainers**, **Top Losers**, and **Most Active Stocks** on the homepage using live Yahoo Finance feeds.
- **Seeded Metric Consistency**: Utilizes stable seeded random values based on the symbol hash to generate mathematically consistent valuation metrics (`Price = P/E * EPS`) when Yahoo Finance's free APIs omit them for Indian shares.
- **Association of Mutual Funds in India (AMFI) Integration**: Fetches direct-growth mutual funds (small-cap, mid-cap, flexi-cap, multi-cap, index funds) with live NAV rates.
- **Horizontal Swipe Filter Strips**: Filters categories on mobile smoothly using horizontal swipe selectors without wrapping items or expanding headers.
- **Interactive Return Yield Calculator**: Toggle between **Monthly SIP** and **Lumpsum** modes with thick range sliders. It generates a reactive SVG doughnut chart dividing "Invested Amount" vs "Estimated Returns".
- **"Use in SIP" Dynamic Auto-Fill**: Clicking on any mutual fund card instantly applies that fund's 3-year cagr returns into the calculator and smoothly scrolls the user to the form.
- **Global Loading Progress Indicator**: Displays a sleek, glowing indicator bar on the top edge of the browser window during any active API requests, backed by clean shimmer skeletons for individual elements to eliminate Cumulative Layout Shift (CLS).
- **SEO & Structured Schema**: Dynamic metadata injection, auto-generated `sitemap.xml` for all static stock paths, `robots.txt` instructions, and JSON-LD Structured Schema (WebSite & FinancialProduct types) for search indexing.

---

## 🛠️ Technology Stack

- **Core Framework**: [Next.js 14.2.35](https://nextjs.org/) (App Router, Server-Side Endpoints, Route Metadata)
- **Programming Language**: [TypeScript](https://www.typescriptlang.org/) (Strict type-checking)
- **Global State Management**: [Zustand](https://github.com/pmndrs/zustand) (Persistent local storage store for watchlists and themes)
- **Styling & Theme**: [Tailwind CSS](https://tailwindcss.com/) & Vanilla CSS variables for smooth light/dark toggles
- **API Fetching & Interceptors**: [Axios](https://axios-http.com/)
- **Charts Engine**: [Financial Lightweight Charts (by TradingView)](https://www.tradingview.com/lightweight-charts/)
- **Design Icons**: [Lucide React](https://lucide.dev/)

---

## 📂 Folder Architecture

```text
onlyprofit/
├── public/                 # Static assets (favicons, site previews)
│   ├── favicon.ico
│   └── op.png
├── src/
│   ├── app/                # Next.js App Router paths and API controllers
│   │   ├── api/            # Server-side API proxy controllers
│   │   │   ├── stock/
│   │   │   │   ├── chart/     # Historical price chart resolver (Yahoo Finance)
│   │   │   │   ├── mutualfund/# AMFI mutual funds API with 1-hour memory caching
│   │   │   │   ├── quote/     # Live stock quote handler with 15-second caching
│   │   │   │   └── search/    # Stock query autocomplete handler
│   │   ├── fonts/          # Typography assets (Inter font files)
│   │   ├── stock/[symbol]/ # Dynamic detail view layout for each stock symbol
│   │   ├── globals.css     # CSS variable rules, shimmer loaders, custom slider thumbs
│   │   ├── icon.jpg        # Auto-discovered branding favicon
│   │   ├── layout.tsx      # App shell (dynamic metadata, theme context, Navbar, Footer)
│   │   ├── page.tsx        # Homepage dashboard (Capsule Tabs, Gainers, Mutual Funds, SIP)
│   │   ├── robots.ts       # Crawler instructions (robots.txt)
│   │   └── sitemap.ts      # Crawl mapping (sitemap.xml) for SEO listing
│   ├── components/         # Presentation & Interaction elements
│   │   ├── GlobalLoadingBar.tsx # Sleek glowing green progress bar at browser top edge
│   │   ├── MiniSparkline.tsx    # SVG miniature chart trajectory for rows and index pills
│   │   ├── MutualFundCard.tsx   # Direct NAV, 3Y returns, and calculator integration button
│   │   ├── Navbar.tsx           # Sticky top header and full-screen mobile search modal
│   │   ├── SipCalculator.tsx    # SIP/Lumpsum return form, custom sliders, SVG doughnut
│   │   ├── StockCard.tsx        # Mobile compact row / desktop spacious card layout
│   │   ├── StockChart.tsx       # TradingView interactive chart (Client-only SSR disabled)
│   │   ├── StockLogo.tsx        # Lazy-loaded logo resolver (Groww CDN + seeded initials)
│   │   └── TopIndexStrip.tsx    # Live banking and market index ticker with gradient fades
│   ├── lib/
│   │   └── yahooFinance.ts      # Yahoo Finance fetch wrappers, name sanitizers, and fallback resolvers
│   └── store/
│       └── useStockStore.ts     # Persistent Zustand state store (theme & watchlists)
├── tailwind.config.ts      # Tailwind configuration with corporate emerald and slate tokens
├── package.json            # Dependency registration and script targets
└── tsconfig.json           # compiler options configuration
```

---

## 📡 API Reference & Caching Strategy

OnlyProfit communicates with server-side proxy routes to bypass CORS, protect requests, and cache responses:

### 1. Stock Quote Endpoint (`/api/stock/quote?symbols=RELIANCE.NS,TCS.NS`)
- **Controller**: `src/app/api/stock/quote/route.ts`
- **Source**: Yahoo Finance API.
- **Caching**: **60 seconds** server-side in-memory cache.
- **Batch-Chunked Fallback Chain**: To comply with Yahoo's 20-symbol limit on their Spark endpoint (`/v7/finance/spark`), requests are chunked in groups of 20 symbols. A per-symbol resolution chain runs in parallel:
  1. Try parsing from the chunked Spark API data.
  2. If missing, make an individual live Chart query (`/v8/finance/chart/[symbol]`).
  3. If chart fails, fall back to stable seed-based mock data.
  This ensures individual symbol errors do not disrupt the entire batch of 60 symbols.

### 2. Mutual Fund Detail Endpoint (`/api/stock/mutualfund/[code]`)
- **Controller**: `src/app/api/stock/mutualfund/[code]/route.ts`
- **Source**: AMFI public endpoint (`https://api.mfapi.in`).
- **Resilience**: Features automatic retry logic and reverse code searches to translate codes into exact fund house AMC names, fetching direct-growth NAV history, and resolving CDN logos dynamically.
- **Caching**: **1 hour** server-side in-memory cache. Because AMFI only publishes new NAV files once daily at market close, caching responses avoids making duplicate external HTTP requests on every refresh.

### 3. Historical Charts (`/api/stock/chart?symbol=RELIANCE.NS&range=1y`)
- **Controller**: `src/app/api/stock/chart/route.ts`
- **Source**: Yahoo Finance Chart API. Maps range parameters (`1d`, `1mo`, `6mo`, `1y`, `5y`) to appropriate intervals (`5m`, `1d`, `1wk`).

---

## 🛠️ Installation & Build Process

Follow these step-by-step instructions to set up the project locally and compile it for production.

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v18 or higher recommended) and npm installed.

### Step 1: Clone and Navigate to the Workspace
Open a terminal in your workspace folder:
```bash
cd OnlyProfit
```

### Step 2: Install Dependencies
Install all package dependencies defined in `package.json`:
```bash
npm install
```
This installs the required dependencies including Next.js, React, Zustand, Axios, and Tailwind CSS.

### Step 3: Run the Development Server
Launch the local development environment:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to inspect the application. The project uses hot-reloading; modifications to components or styles will update in the browser instantly.

### Step 4: Run the Production Build
To verify type-safety, resolve ESLint rules, and build an optimized production bundle:
```bash
npm run build
```

During this process:
1. **Next.js Compiler**: Creates an optimized client bundle.
2. **TypeScript Checker**: Verifies all types across pages, layout routes, and API endpoints.
3. **Static Generation**: Pre-renders sitemap paths, index files, and layout blocks.

Once compilation completes, the terminal will report the bundle sizes:
```text
✓ Compiled successfully
Linting and checking validity of types ...
Collecting page data ...
✓ Generating static pages (7/7)
Finalizing page optimization ...
Collecting build traces ...

Route (app)                              Size     First Load JS
┌ ○ /                                    9.73 kB         131 kB
├ ○ /_not-found                          873 B          88.3 kB
├ ƒ /api/stock/chart                     0 B                0 B
├ ƒ /api/stock/mutualfund                0 B                0 B
├ ƒ /api/stock/quote                     0 B                0 B
├ ƒ /api/stock/search                    0 B                0 B
├ ○ /icon.jpg                            0 B                0 B
├ ○ /robots.txt                          0 B                0 B
├ ○ /sitemap.xml                         0 B                0 B
└ ƒ /stock/[symbol]                      6.4 kB          119 kB
+ First Load JS shared by all            87.4 kB
```

### Step 5: Start the Production Server
Run the compiled code in a production-ready server environment:
```bash
npm run start
```
The app will serve the optimized production build locally on port `3000`.

---

## 🔌 Integrating Official Tickertape & Smallcase APIs

To transition this simulated platform into a live production application with stock transactions, basket order execution, and official Tickertape/Smallcase metrics, you can utilize the following official developer gateway paths:

### 1. smallcase Gateway SDK
The **smallcase Gateway** provides developer interfaces to allow transactional baskets (smallcases) inside third-party applications:
- **Developer Documentation**: [developers.gateway.smallcase.com](https://developers.gateway.smallcase.com/)
- **Core Integrations**:
  - **Basket Orders**: Place multiple stock and ETF orders in a single transaction (custom baskets).
  - **smallcase Transactions**: Enable buying, rebalancing, and tracking of smallcases directly through users' broker accounts (Zerodha, Groww, Angel One, Upstox, etc.).
  - **Holdings Import**: Sync and display existing users' equity portfolios.
- **Client-Side Setup**: Set up the gateway using the official Javascript SDK:
  ```javascript
  import { SmallcaseGateway } from '@smallcase/gateway-js';
  
  // Initialize with your unique Gateway credential parameters
  SmallcaseGateway.init({
    gatewayName: 'YOUR_GATEWAY_NAME',
    environment: 'production', // or 'sandbox'
  });
  ```

### 2. Tickertape Widgets & Screens
Tickertape does not expose raw public API keys for their screener data. However, they provide official embedding tools:
- **Tickertape Web Components**: Embed specific stock performance cards or transaction buttons directly inside component views using Tickertape web integration scripts.
- **Data screener alternatives**: To build a custom stock screener (similar to Tickertape's filters for P/E ratio, market cap, and dividend yield), developers use broker APIs like **Kite Connect (Zerodha)**, **Upstox Developer API**, or financial data providers (like Alpha Vantage, RapidAPI NSE feeds, or custom stock scrapers) to query raw fundamentals.

---

## 🔒 Simulation & Education Disclaimer
OnlyProfit is a **pure tracking and simulation platform** built for educational analysis. It does not interface with securities brokers, process real-world stock market transactions, or provide financial advice. Prices and details are retrieved from public Yahoo Finance feeds and may be delayed.




