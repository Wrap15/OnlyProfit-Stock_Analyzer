export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  date: string;
  readTime: string;
  author: string;
  authorRole: string;
  content: string[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    id: 'curated-blog-1',
    slug: 'how-to-choose-mutual-fund',
    title: 'How to Choose the Right Mutual Fund for Your Portfolio',
    description: 'Learn the essential parameters to evaluate when choosing a mutual fund, including asset size, expense ratio, historical performance, and risk metrics.',
    category: 'Mutual Funds',
    date: 'Jul 8, 2026',
    readTime: '6 min read',
    author: 'Aarav Mehta',
    authorRole: 'Chief Investment Officer',
    content: [
      "Choosing the right mutual fund is essential to meeting your long-term financial goals. With thousands of schemes available in the Indian market, filtering the options can be overwhelming.",
      "The first step in choosing a mutual fund is defining your investment objective, risk tolerance, and time horizon. Equity funds are suitable for long-term wealth creation (5+ years) but carry higher volatility, while debt funds are better for short-term preservation and income stability.",
      "Key metrics to evaluate include:",
      "1. Expense Ratio: This is the annual fee charged by the fund house to manage the fund. A lower expense ratio directly increases your net returns over time, making direct plans highly attractive.",
      "2. Historical Returns: Comparing a fund's performance against its benchmark (e.g., Nifty 50 TRI) across 3-year, 5-year, and 10-year horizons helps evaluate consistency.",
      "3. Risk Ratios: Look at Sharpe Ratio (returns per unit of risk) and Sortino Ratio. A higher Sharpe ratio indicates better risk-adjusted returns.",
      "4. Assets Under Management (AUM): For debt funds, a larger asset size is preferred to manage liquidity risks. For equity small-cap funds, extremely large sizes can sometimes make it harder for fund managers to build positions.",
      "By assessing these parameters and aligning them with your investment horizon, you can build a diversified mutual fund portfolio that delivers stable compound interest."
    ]
  },
  {
    id: 'curated-blog-2',
    slug: 'sip-vs-lumpsum-investment-better',
    title: 'SIP vs Lumpsum: Which is Better for Long-Term Investing?',
    description: 'Understand the key differences between Systematic Investment Plans (SIP) and Lumpsum investments, and decide which method suits your cash flow.',
    category: 'Mutual Funds',
    date: 'Jul 7, 2026',
    readTime: '5 min read',
    author: 'Priya Sharma',
    authorRole: 'Wealth Manager',
    content: [
      "When embarking on your investment journey, one of the first decisions you'll face is whether to invest via a Systematic Investment Plan (SIP) or make a Lumpsum payment.",
      "A SIP allows you to invest a fixed sum at regular intervals (daily, monthly, or quarterly) into your chosen mutual fund. This method encourages disciplined investing and leverages Rupee Cost Averaging. When markets are down, your SIP buys more units; when markets rise, it buys fewer. This reduces the risk of trying to time the market.",
      "On the other hand, Lumpsum investing refers to placing a significant sum of money into a mutual fund all at once. This is common when investors receive a bonus, inherit property, or sell an asset.",
      "Which is better?",
      "If you have a regular stream of income, SIPs are highly recommended. They are less stressful and yield excellent compounding returns over the long term. If you have a lump sum of money, you can choose to make a lumpsum investment during market corrections, or use a Systematic Transfer Plan (STP) to transition the funds from a liquid fund to equities over 12-18 months."
    ]
  },
  {
    id: 'curated-blog-3',
    slug: 'what-is-stock-split-effects',
    title: 'What is a Stock Split and How Does it Affect Investors?',
    description: 'A stock split increases the number of shares outstanding while reducing the share price proportionally. Find out how this impacts liquidity and valuation.',
    category: 'Stocks',
    date: 'Jul 6, 2026',
    readTime: '4 min read',
    author: 'Rohan Gupta',
    authorRole: 'Equity Analyst',
    content: [
      "A stock split is a corporate action in which a company divides its existing shares into multiple shares to boost liquidity.",
      "Although the number of shares outstanding increases by a specific multiple, the total dollar value of the shares remains the same. For example, in a 2-for-1 stock split, if you held 100 shares of a company valued at ₹1,000 per share, you will now own 200 shares valued at ₹500 per share.",
      "Why do companies split their stocks?",
      "1. Make shares affordable: When a stock price rises to thousands of rupees, retail investors find it difficult to buy. A split lowers the price, making it accessible to a wider audience.",
      "2. Boost trading liquidity: More shares in the market mean higher trading volumes and tighter bid-ask spreads, making it easier to buy and sell.",
      "For investors, a stock split is generally positive because it signals that the company is growing and confident in its future prospects."
    ]
  },
  {
    id: 'curated-blog-4',
    slug: 'how-to-apply-for-ipo',
    title: 'How to Invest in Upcoming IPOs in India: A Step-by-Step Guide',
    description: 'Looking to invest in the latest public listings? Read our detailed walkthrough on checking eligibility, ASBA payments, UPI mandate, and allocation criteria.',
    category: 'IPOs',
    date: 'Jul 5, 2026',
    readTime: '7 min read',
    author: 'Karan Kapoor',
    authorRole: 'Capital Markets Specialist',
    content: [
      "Investing in an Initial Public Offering (IPO) is a popular way to buy shares of a company at the ground level before they begin trading on exchanges like NSE and BSE.",
      "To apply for an IPO in India, you need three key accounts: a demat account (to hold the shares), a trading account (to submit the bids), and a bank account linked with UPI or ASBA (Applications Supported by Blocked Amount).",
      "Steps to Apply:",
      "1. Choose the IPO: Research upcoming listings, study their Draft Red Herring Prospectus (DRHP), and read broker recommendations.",
      "2. Submit Bid: Open your broker platform, select the active IPO, choose the number of bid lots (minimum application size), and enter the cut-off price.",
      "3. Approve Mandate: A UPI mandate request will be sent to your banking app. Approve it to block the application amount in your bank account.",
      "4. Allocation: If allocated shares, they will credit to your demat account; if not, the blocked money will be automatically released."
    ]
  },
  {
    id: 'curated-blog-5',
    slug: 'p-b-price-to-book-value-ratio',
    title: 'Understanding Price-to-Book (P/B) Ratio and How to Calculate It',
    description: 'The P/B ratio compares a company\'s market value to its book value. Learn how to use it to identify undervalued banking and financial sector stocks.',
    category: 'Stocks',
    date: 'Jul 4, 2026',
    readTime: '5 min read',
    author: 'Neha Deshmukh',
    authorRole: 'Valuation Lead',
    content: [
      "The Price-to-Book (P/B) ratio is a widely used financial metric that compares a company's market capitalization to its book value (net asset value).",
      "It is calculated by dividing the current market price per share by the book value per share. The book value is essentially what remains if a company shuts down, sells all its assets, and pays off all liabilities.",
      "A P/B ratio of 1 indicates the stock is trading at its book value. A ratio below 1 suggests the stock is undervalued, while a high ratio indicate a premium valuation.",
      "P/B ratios are particularly useful for evaluating asset-heavy businesses like commercial banks, insurance firms, and real estate developers, whose earnings fluctuate less than their asset basis."
    ]
  },
  {
    id: 'curated-blog-6',
    slug: 'income-tax-slabs',
    title: 'Income Tax Slab Rates FY 2024-25 (AY 2025-26): New vs Old Regime',
    description: 'Compare the income tax slabs for the new and old tax regimes for financial year 2024-25, and discover which regime saves you more tax.',
    category: 'Personal Finance',
    date: 'Jul 3, 2026',
    readTime: '8 min read',
    author: 'Vikram Malhotra',
    authorRole: 'Tax Consultant',
    content: [
      "Understanding tax liabilities is vital to personal financial planning. In India, taxpayers can choose between the Old Tax Regime (with deductions) and the New Tax Regime (with lower slab rates but no deductions).",
      "The New Tax Regime is the default option and offers a standard deduction of ₹75,000 for salaried employees. Slabs range from 0% (up to ₹3L) to 30% (above ₹15L).",
      "The Old Tax Regime permits deductions under Section 80C (up to ₹1.5L for PPF, ELSS, Life Insurance), Section 80D (health insurance premiums), and Section 24 (home loan interest).",
      "To choose the best regime, calculate your total eligible deductions. If deductions are less than ₹2.5L per year, the New Tax Regime is typically more beneficial."
    ]
  }
];
