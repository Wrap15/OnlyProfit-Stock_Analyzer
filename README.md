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

### 1. 📈 Real-Time NSE Equity & Index Tracking (400ms Ticks)
- **Sub-Second Tick Refresh**: High-frequency price and index tick updates every **400ms (0.4s)** during live market hours.
- **Exact 3:30:00 PM IST Market Close Enforcement**: Evaluates market hours with second precision (`09:15:00 AM` to `15:30:00 PM IST`). At 3:30 PM sharp, live tick updates freeze instantly, and market badges flip to "Market Closed".
- **Color-Coded Dynamic Prices**: Green font color highlight on price increases and red on price decreases with smooth CSS transitions.

### 2. 📊 Advanced Synchronized Trading Charts & Indicators
- **High-Fidelity Candlestick/Area Views**: Seamless toggle between Line/Area charts and standard Candlestick series.
- **1-Minute Chart Resolution**: Intraday `1d` chart interval upgraded from `5m` to `1m` (1-minute candles) to match real-world trading configurations.
- **Technical Overlay Indicators**: Toggle overlay lines on the main price pane:
  - **SMA-20** (Simple Moving Average)
  - **Bollinger Bands (20, 2)**: Plots upper, lower, and middle basis lines dynamically.
  - **SuperTrend (10, 1.5)**: Employs Average True Range (ATR) to draw green/red trend-following step lines.
- **Synchronized Oscillator Panels**:
  - **RSI (14)** sub-panel featuring overbought (70) and oversold (30) boundary highlights.
  - **MACD (12, 26, 9)** sub-panel charting MACD line, Signal line, and colored volume histograms (green/red).
- **Time-Axis and Scroll Sync**: Zooming or panning on any chart pane automatically synchronizes the scroll timeline across all active indicators.
- **Cache-Busting Data Feeds**: Chart data updates in real-time every **15 seconds** with background API calls utilizing a custom `&nocache=${Date.now()}` query parameter to bypass CDN caching.
- **Integrated Floating HTML Tooltip**: Tracks crosshairs dynamically, presenting Open, High, Low, Close, Volume, and active technical indicator values simultaneously.

### 3. 💼 Virtual Equity Paper Trading Simulator & Auth Protection
- **₹10,00,000 Starting Virtual Capital**: Trade 30+ top Indian equities risk-free in a virtual paper trading environment.
- **Enforced Authentication Guards**: Enforces strict user sign-in before executing or submitting orders. Unauthenticated guest users are blocked from trading and automatically prompted with the Sign-In / Register Modal.
- **Order Placement Modal**: Supports Market, Limit, and Stop-Loss (SL) orders for CNC (Delivery) and MIS (Intraday) product types with auto square-off indicators and fee breakdowns (brokerage, STT, exchange charges).
- **Portfolio & P&L Tracker**: Calculates real-time 1D Returns, Total P&L, holdings, executed order history, and net portfolio value with direct **Buy** and **Sell** action buttons.

### 4. 🎯 Mutual Fund Hub & Interactive Returns Calculator
- **AMFI Integration**: Direct-growth mutual funds (Small-Cap, Mid-Cap, Flexi-Cap, Index Funds) fetched with live NAV rates.
- **Interactive Returns Calculator**: Toggle between **Monthly SIP** and **Lumpsum** modes with:
  - **Quick Amount Chips**: Instant selection (`₹1k`, `₹2.5k`, `₹5k`, `₹10k`, `₹25k`, `₹50k` for SIP; `₹10k`, `₹25k`, `₹50k`, `₹1L`, `₹5L`, `₹10L` for Lumpsum).
  - **Timeframe Presets**: 1-tap duration pills (`1Y`, `3Y`, `5Y`, `10Y`, `15Y`, `20Y`, `30Y`).
  - **Reactive Visualizations**: SVG Doughnut chart and dual-color progress breakdown bars separating Invested Amount vs Est. Returns.
  - **Wealth Growth Badge**: Dynamic multiplier display (e.g., `2.4x Growth`).

### 5. 🔥 Today's Market Drivers
- **Crash-Proof Responsive Sidebar**: Displays Top Gainers, Top Losers, and Most Active stocks in a 60 FPS hardware-accelerated card list format optimized for narrow sidebar columns (~340px) as well as full-width mobile viewports.

### 6. 🤖 AI Copilot Stock & Fund Analyst
- **Interactive Chat Application**: Instant technical scans, fundamental analysis, target estimations, and performance comparisons across 200+ NSE stocks and AMFI mutual funds.

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
Remove-Item -Recurse -Force .next; npm run build
```
*(On Linux/Mac bash: `rm -rf .next && npm run build`)*

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
