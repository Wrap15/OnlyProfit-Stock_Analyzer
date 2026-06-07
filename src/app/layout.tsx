import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import TopGreetingBanner from "@/components/TopGreetingBanner";
import TopIndexStrip from "@/components/TopIndexStrip";
import GlobalLoadingBar from "@/components/GlobalLoadingBar";
import Link from "next/link";
import { TrendingUp } from "lucide-react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "OnlyProfit — Indian Stock Market Simulator & Analysis",
    template: "%s | OnlyProfit"
  },
  description: "Analyze Indian Equities in real-time with interactive charts, technical indicators, and live market data. Create your custom watchlist and track top market gainers and losers.",
  keywords: ["Stock Market", "Indian Equities", "NSE", "Nifty 50", "Sensex", "Mutual Funds", "SIP Calculator", "Stock Simulator", "OnlyProfit", "Technical Analysis", "Share Market"],
  authors: [{ name: "Dhaval Panchal" }],
  creator: "Dhaval Panchal",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://onlyprofit.com",
    title: "OnlyProfit — Indian Stock Market Simulator & Analysis",
    description: "Analyze Indian Equities in real-time with interactive charts, technical indicators, and live market data.",
    siteName: "OnlyProfit",
    images: [
      {
        url: "/op.png",
        width: 1200,
        height: 630,
        alt: "OnlyProfit - Stock Market Analysis"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "OnlyProfit — Indian Stock Market Simulator & Analysis",
    description: "Analyze Indian Equities in real-time with interactive charts, technical indicators, and live market data.",
    images: ["/op.png"],
  },
  metadataBase: new URL("https://onlyprofit.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark')
                } else {
                  document.documentElement.classList.remove('dark')
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="bg-background text-foreground min-h-screen flex flex-col">
        <GlobalLoadingBar />
        <TopGreetingBanner />
        <Navbar />
        <TopIndexStrip />
        <main className="flex-grow">
          {children}
        </main>
        
        <footer className="border-t border-border bg-card/65 backdrop-blur-md pt-10 pb-6 text-text-secondary select-none font-semibold mt-auto">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 pb-8 border-b border-border/40">
              
              {/* Brand and Description */}
              <div className="space-y-3 col-span-1 sm:col-span-2 md:col-span-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-profit text-white shadow-md shadow-profit/25">
                    <TrendingUp className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-base font-extrabold tracking-tight text-text-primary">
                    OnlyProfit
                  </span>
                </div>
                <div className="text-xs sm:text-sm text-text-secondary font-medium leading-relaxed max-w-xl">
                  <span className="text-profit font-extrabold">OnlyProfit</span> provides data, information & content for Indian stocks, mutual funds & indices. Advanced stock analysis simulator for the Indian equity Market. Get instant interactive charts, real-time metrics, and custom watchlists built with speed and elegance.
                </div>
              </div>

              {/* Navigation Quick Links */}
              <div className="space-y-3 col-span-1">
                <h4 className="text-xs font-black text-text-primary uppercase tracking-wider">Features</h4>
                <ul className="space-y-2 text-xs font-medium">
                  <li>
                    <Link href="/" className="hover:text-profit transition-colors">Market Dashboard</Link>
                  </li>
                  <li>
                    <Link href="/" className="hover:text-profit transition-colors">Nifty & Sensex Indices</Link>
                  </li>
                  <li>
                    <Link href="/#mutual-funds" className="hover:text-profit transition-colors">Mutual Funds</Link>
                  </li>
                </ul>
              </div>

              {/* Learn & Share Tips */}
              <div className="space-y-3 col-span-1">
                <h4 className="text-xs font-black text-text-primary uppercase tracking-wider">Learn & Share</h4>
                <ul className="space-y-3 text-[11px] font-medium leading-relaxed">
                  <li>
                    <span className="text-profit font-extrabold block text-[9px] uppercase tracking-wider">P/E Valuation</span>
                    PE ratio compares price to earnings. Lower ratios can indicate undervalued stocks; high P/Es signal growth expectations.
                  </li>
                  <li>
                    <span className="text-profit font-extrabold block text-[9px] uppercase tracking-wider">Compound SIP Yields</span>
                    SIP investments leverage rupee-cost averaging and compound returns. Apply CAGR yields to predict future values.
                  </li>
                </ul>
              </div>

              {/* simulated data safety notices */}
              <div className="space-y-3 col-span-1">
                <h4 className="text-xs font-black text-text-primary uppercase tracking-wider">Disclaimer</h4>
                <p className="text-[11px] text-text-secondary font-medium leading-relaxed">
                  OnlyProfit is a simulated tracking tool. We do not process orders, transactions, or financial advice. Simulated rates might differ from real-time trading terminals.
                </p>
              </div>

            </div>

            {/* Bottom Copyright & Credit Row */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 text-[11px] font-semibold text-text-secondary">
              <p>© 2026 OnlyProfit Stock Market Analysis. Designed for Indian Equities. All simulation rights reserved.</p>
              <div className="flex items-center gap-1.5 font-bold">
                <span>Designed & Built with passion by</span> 
                <a 
                  href="https://my-portfolio-nine-eta-63.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-0.5 rounded-full bg-profit/10 text-profit border border-profit/15 text-[10px] uppercase font-black tracking-wider hover:bg-profit hover:text-white transition-colors duration-300 flex items-center gap-1"
                >
                  DHAVAL PANCHAL <span className="animate-pulse inline-block">💜</span>
                </a>
              </div>
            </div>

          </div>
        </footer>
      </body>
    </html>
  );
}


