# OnlyProfit — Smart Investing, Real-Time Market Intelligence & Paper Trading Simulator

---

**OnlyProfit** is a state-of-the-art, high-performance stock market tracking and paper trading simulation platform built for Indian equities and mutual funds. It provides sub-second live price updates, advanced TradingView-style interactive charting, technical indicators, fundamental analysis, AI-powered stock copilot intelligence, and a full-featured virtual paper trading engine with ₹10,00,000 starting capital.

Built on Next.js 14, OnlyProfit incorporates hardware-accelerated 60 FPS animations, strict 3:30 PM market close enforcement, low-latency server-side caching, and pixel-perfect responsive design across mobile, tablet, and desktop viewports.

---

## 👨‍💻 Credits & Author

- **Lead Creator & Designer**: **[DHAVAL PANCHAL](https://panchal-portfolio-072.vercel.app/)** — *Conceived, architected, and designed the UI/UX, paper trading workflow, and market simulator experience. Explore the creator's live work at [panchal-portfolio-072.vercel.app](https://panchal-portfolio-072.vercel.app/).*
- **AI Engineering Partner**: **Antigravity AI** — *Co-developed code structure, sub-second ticker optimization, AMFI & Yahoo Finance API integrations, technical indicators logic, and 60 FPS hardware acceleration.*

---

## 🚀 Key Features

### 1. 📈 Real-Time NSE Equity & Index Tracking (400ms Ticks & 150ms Initial Load)
- **Sub-Second Tick Refresh**: High-frequency price and index tick updates every **400ms (0.4s)** during live market hours.
- **Lightning-Fast Initial Loading**: Replaced the staggered timeouts (previously taking 6+ seconds) with a concurrent single-pass batch loader that fetches all 190+ background stocks in ~150ms via `Promise.all`.
- **Exact 3:30:00 PM IST Market Close Enforcement**: Evaluates market hours with second precision (`09:15:00 AM` to `15:30:00 PM IST`). At 3:30 PM sharp, live tick updates freeze instantly, and market badges flip to "Market Closed".
- **Color-Coded Dynamic Prices**: Green font color highlight on price increases and red on price decreases with smooth CSS transitions.

### 2. 📊 Groww-Style Stock Overview Page Integration
- **Condensed Tab Controls**: Simplified stock details page tabs to: **Charts** (default), **Overview**, and **Option Chain** for a clean, modern interface.
- **Scrollspy Sub-Navigation**: Segmented sub-navigation filter pills inside the **Overview** tab: `Activity`, `Fundamental Ratios`, `Performance Overview`, `Shareholding Patterns`, and `Price Summary`.
- **Detailed Sub-Sections**:
  - **Activity**: Shows volume, average price, bid/ask spreads, dynamic upper/lower circuit limits, 52-week sliders, and buy/hold/sell analyst consensus.
  - **Fundamental Ratios**: Displays PE ratio, PB ratio, PEG, and ROE in nested sub-tabs (*Valuation, Growth, Financial, Dividend*).
  - **Performance**: Displays sector standing, annual returns, quality/valuation/financial health meters, and strategic insights.
  - **Shareholding Patterns**: Visualizes Jun 26 vs Mar 26 shareholding comparisons across promoters, FIIs, DIIs, and retail investors with change indicators.
  - **Price Summary**: Bulleted highlight cards illustrating performance today, moving average trends, trend reversals, and rising delivery indicators.

### 3. 📁 Portfolio Folder Badges & Purchase Date Metadata
- **Ticker Row Badges**: Displays a reactive folder icon next to stock ticker symbols (e.g., `[folder] 5`) in both mobile list views and desktop cards.
- **Interactive Tooltip**: Hovering or tapping on the folder badge displays a custom tooltip indicating the first transaction date: **`Bought on [Purchase Date]`**.
- **0ms Reactive Updates**: Synchronized with the Zustand local storage and Firestore holdings. Whenever a paper trade is completed, folder states update instantly.

### 4. ⚡ 10x Fast Search & Local Fuzzy Fallbacks
- **Bypassed AMFI Latency**: Passing `type=equity` to the search API bypasses the slow external AMFI mutual fund search, speeding up equity autocompletes by 10x (~50ms).
- **Fuzzy Local Search Fallback**: Automatically performs in-memory matching on symbols and company names in `MOCK_STOCK_INFO` when endpoints return empty results or are offline, preventing search freezes.

### 5. 🏛️ Glitch-Free Sensex & Nifty Index Calculations
- **Dynamic Constituent-Weighted Fallback**: Implemented a weighted calculation fallback that computes BSE Sensex (`^BSESN`) and Nifty 50 (`^NSEI`) index changes dynamically using the top 10 heaviest constituents.
- **Self-Correcting Data Feeds**: Since constituents are loaded directly from the rate-limit free Tickertape API, index valuations remain highly accurate even if Yahoo Finance endpoints are temporarily blocked.

### 6. 📊 Synced Trading Charts & overlay Indicators
- **Overlay Indicators**: Toggle overlay lines on the main price pane: SMA-20, Bollinger Bands (20, 2), and SuperTrend (10, 1.5).
- **Oscillator Panels**: Synchronized RSI (14) and MACD (12, 26, 9) sub-panels with unified scroll, zoom, and crosshair sync.
- **Floating Crosshair Tooltip**: Displays Open, High, Low, Close, Volume, and active indicator values simultaneously.

### 7. 💼 Virtual Equity Paper Trading Simulator & Auth Protection
- **₹10,00,000 Starting Virtual Capital**: Trade 30+ top Indian equities risk-free.
- **Authentication Guards**: Prompts auth guards before executing orders to secure simulator trades.
- **Order Placement Modal**: Supports Market, Limit, and Stop-Loss (SL) orders for CNC and MIS Intraday with detailed fee breakdowns.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 14.2.35 (App Router, Server Actions, Route Handlers)
- **Language**: TypeScript (Strict type safety)
- **State Management**: Zustand with persistent local storage for watchlists, alerts, and paper trading portfolio
- **Styling**: Vanilla CSS Variables & Tailwind CSS with hardware GPU acceleration (`transform-gpu`, `will-change-transform`)
- **Charting**: TradingView Lightweight Charts
- **Icons**: Lucide React

---

## 📂 Folder Architecture

```text
OnlyProfit/
├── public/                     # Favicons, branding assets & static media
├── src/
├── src/
│   ├── app/                    # Next.js App Router & API Controllers
│   │   ├── api/
│   │   │   ├── ai/chat/        # AI Copilot stock analyst endpoint
│   │   │   ├── dashboard/      # Unified dashboard metrics proxy
│   │   │   ├── stock/
│   │   │   │   ├── chart/      # Historical chart data resolver
│   │   │   │   ├── mutualfund/ # AMFI mutual funds NAV resolver
│   │   │   │   ├── quote/      # Live NSE quotes handler with 400ms micro-ticks
│   │   │   │   └── search/     # Autocomplete search endpoint
│   │   ├── mutualfund/[code]/  # Mutual Fund detail page with NAV analytics & calculator
│   │   ├── simulator/          # Equity Paper Trading Portfolio & P&L dashboard
│   │   ├── stock/[symbol]/     # Equity detail view, option chain, and technicals
│   │   ├── layout.tsx          # Root shell layout
│   │   └── page.tsx            # Main market dashboard
│   ├── components/             # Reusable UI Components
│   │   ├── OrderPlacementModal.tsx # Equity Order placement modal (CNC & MIS Intraday)
│   │   ├── SipCalculator.tsx   # Responsive SIP & Lumpsum returns calculator
│   │   ├── TopIndexStrip.tsx   # Live Nifty/Sensex ticker strip with 400ms tick updates
│   │   ├── StockChart.tsx      # Synced charting with overlays (SMA, BB, SuperTrend) & oscillators (RSI, MACD)
│   │   └── AISignalsWidget.tsx # AI Copilot assistant drawer
│   ├── features/
│   │   ├── dashboard/components/
│   │   │   └── TodaysStocksSection.tsx # Today's Market Drivers (Gainers/Losers/Active)
│   │   ├── mutualfunds/components/
│   │   │   └── MutualFundHero.tsx # Mutual Fund header section
│   │   ├── simulator/components/
│   │   │   └── SimulatorHoldingsTab.tsx # Portfolio Holdings with Buy & Sell CTAs
│   │   └── stocks/components/
│   │       ├── StockHeroSection.tsx # Equity hero header with 3:30 PM close enforcement
│   │       └── StockRightSidebar.tsx # Stock page right sidebar & recommendations
│   ├── hooks/
│   │   ├── useDashboardQuotes.ts # Real-time dashboard quote subscriber (400ms ticks)
│   │   ├── useMarketQuotes.ts    # Market mover quotes subscriber
│   │   ├── useStockDetails.ts    # Single stock live quotes & chart subscriber
│   │   └── useSimulatorDetails.ts # Simulator holding & P&L calculator hook
│   ├── lib/
│   │   ├── marketHours.ts       # 3:30:00 PM IST sharp market close checking utility
│   │   ├── simulatorService.ts  # Core paper trading execution logic
│   │   └── yahooFinance.ts      # Live Yahoo Finance fetch wrappers
│   └── store/
│   │   └── useStockStore.ts     # Global Zustand store (watchlists, alerts, user ID)
├── tailwind.config.ts          # Tailwind styling tokens & keyframe animations
├── package.json                # Project dependencies and script targets
└── tsconfig.json               # TypeScript compiler config
```

---

## 📖 Step-by-Step Installation & Setup Guide

### Step 1: Prerequisites
Ensure you have **Node.js** (v18.0.0 or higher) and **npm** installed on your machine.
- Verify Node version:
  ```bash
  node -v
  ```
- Verify npm version:
  ```bash
  npm -v
  ```

---

### Step 2: Navigate to Project Directory
Open your terminal/command prompt and change directory into the workspace:
```bash
cd c:\Users\DELL\Downloads\OnlyProfit
```

---

### Step 3: Install Project Dependencies
Install all required packages defined in `package.json`:
```bash
npm install
```
This installs core dependencies including Next.js, React, Zustand, Axios, Lucide Icons, and TradingView Lightweight Charts.

---

### Step 4: Run the Local Development Server
Start the development server with hot-reloading:
```bash
npm run dev
```
Open your browser and navigate to:
```text
http://localhost:3000
```
Any changes saved to `src/` will instantly update in the browser.

---

### Step 5: Test Production Build
To run TypeScript validation, ESLint checks, and compile the optimized production bundle:
```bash
npm run build
```

Expected terminal output upon successful compilation:
```text
 ✓ Compiled successfully
   Linting and checking validity of types ...
   Collecting page data ...
 ✓ Generating static pages (12/12)
   Finalizing page optimization ...
```

---

### Step 6: Start Production Server
Run the compiled production application:
```bash
npm run start
```
The optimized production server will be running on `http://localhost:3000`.

---

## 📡 API Proxy & Caching Specifications

| Endpoint | Method | Source | Cache Duration | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/api/stock/quote` | `GET` | Yahoo Finance | 2 seconds (Fresh) | Batch fetches live equity prices with 400ms tick updates |
| `/api/stock/chart` | `GET` | Yahoo Finance | 15 seconds (1d view) | Syncs interactive price candles with indicators overlays |
| `/api/stock/mutualfund/[code]` | `GET` | AMFI / MFAPI | 1 hour | Resolves mutual fund NAVs, historical trends, and AMC details |
| `/api/ai/chat` | `POST` | AI Intelligence Engine | Real-time | Analyzes stock technicals, fundamentals, and risk ratios |

---

## 🛡️ Educational Simulation Disclaimer
**OnlyProfit** is a simulated market tracking and paper trading platform built for educational and analytical purposes. It does not process actual financial transactions on live stock exchanges or provide financial investment advice. All paper trades are executed with virtual funds within the application sandbox.

---

Designed and built with ❤️ by **[DHAVAL PANCHAL](https://panchal-portfolio-072.vercel.app/)** in collaboration with **Antigravity AI (Google DeepMind Team)**.
