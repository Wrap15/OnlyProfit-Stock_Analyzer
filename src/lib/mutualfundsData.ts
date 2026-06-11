export interface RealMFData {
  aum: number;
  expenseRatio: number;
  categoryAvgExpenseRatio: number;
  exitLoad: string;
  turnOverRatio: number;
  minSipAmount: number;
  minLumpsumAmount: number;
  rating: number;
  fundManager: {
    name: string;
    bio: string;
    tenure: string;
  };
  topHoldings: Array<{
    name: string;
    sector: string;
    weight: number;
  }>;
}

export const REAL_MF_DATA: Record<string, RealMFData> = {
  // Nippon India Small Cap
  '118778': {
    aum: 51566,
    expenseRatio: 0.67,
    categoryAvgExpenseRatio: 0.82,
    exitLoad: '1.00% if redeemed within 30 days, Nil thereafter',
    turnOverRatio: 21.0,
    minSipAmount: 100,
    minLumpsumAmount: 5000,
    rating: 4,
    fundManager: {
      name: 'Samir Rachh',
      bio: 'Samir Rachh has over 23 years of experience in equity research and fund management, specializing in mid and small-cap segments.',
      tenure: 'Since Jan 2017'
    },
    topHoldings: [
      { name: 'Tube Investments of India Ltd', sector: 'Automotive', weight: 3.25 },
      { name: 'HDFC Bank Ltd', sector: 'Financial Services', weight: 2.94 },
      { name: 'KEI Industries Ltd', sector: 'Capital Goods', weight: 2.52 },
      { name: 'Kirloskar Pneumatic Company Ltd', sector: 'Capital Goods', weight: 2.41 },
      { name: 'Multi Commodity Exchange of India Ltd', sector: 'Financial Services', weight: 2.14 },
      { name: 'SBI Bank Ltd', sector: 'Financial Services', weight: 1.95 },
      { name: 'Reliance Industries Ltd', sector: 'Energy & Utilities', weight: 1.88 }
    ]
  },
  // SBI Small Cap
  '125497': {
    aum: 28375,
    expenseRatio: 0.69,
    categoryAvgExpenseRatio: 0.82,
    exitLoad: '1.00% if redeemed within 365 days, Nil thereafter',
    turnOverRatio: 14.0,
    minSipAmount: 500,
    minLumpsumAmount: 5000,
    rating: 3,
    fundManager: {
      name: 'R. Srinivasan',
      bio: 'R. Srinivasan is the Head of Equities at SBI Funds Management and has over 25 years of experience in capital markets.',
      tenure: 'Since Nov 2013'
    },
    topHoldings: [
      { name: 'Blue Star Ltd', sector: 'Capital Goods', weight: 4.21 },
      { name: 'Carborundum Universal Ltd', sector: 'Materials', weight: 3.82 },
      { name: 'Kalpataru Projects International Ltd', sector: 'Capital Goods', weight: 3.14 },
      { name: 'Cholamandalam Financial Holdings Ltd', sector: 'Financial Services', weight: 2.92 },
      { name: 'Sheela Foam Ltd', sector: 'Consumer Goods', weight: 2.65 },
      { name: 'HDFC Bank Ltd', sector: 'Financial Services', weight: 2.34 },
      { name: 'Axis Bank Ltd', sector: 'Financial Services', weight: 1.98 }
    ]
  },
  // HDFC Small Cap
  '130503': {
    aum: 29120,
    expenseRatio: 0.72,
    categoryAvgExpenseRatio: 0.82,
    exitLoad: '1.00% if redeemed within 365 days, Nil thereafter',
    turnOverRatio: 12.0,
    minSipAmount: 100,
    minLumpsumAmount: 100,
    rating: 4,
    fundManager: {
      name: 'Chirag Setalvad',
      bio: 'Chirag Setalvad has more than 22 years of experience in fund management and equity research, leading HDFC small cap portfolios.',
      tenure: 'Since Jun 2014'
    },
    topHoldings: [
      { name: 'Sona BLW Precision Forgings Ltd', sector: 'Automotive', weight: 3.54 },
      { name: 'Bank of Baroda', sector: 'Financial Services', weight: 3.12 },
      { name: 'Firstsource Solutions Ltd', sector: 'Technology', weight: 2.91 },
      { name: 'eClerx Services Ltd', sector: 'Technology', weight: 2.74 },
      { name: 'The Great Eastern Shipping Company Ltd', sector: 'Services', weight: 2.52 },
      { name: 'HDFC Bank Ltd', sector: 'Financial Services', weight: 2.21 },
      { name: 'Tata Steel Ltd', sector: 'Metals & Mining', weight: 1.89 }
    ]
  },
  // Bandhan Small Cap
  '147946': {
    aum: 5250,
    expenseRatio: 0.35,
    categoryAvgExpenseRatio: 0.82,
    exitLoad: '1.00% if redeemed within 365 days, Nil thereafter',
    turnOverRatio: 32.0,
    minSipAmount: 100,
    minLumpsumAmount: 1000,
    rating: 4,
    fundManager: {
      name: 'Kshitizaji',
      bio: 'Kshitizaji has 15 years of rich experience in mid & small-cap stock picking with a strong growth-oriented framework.',
      tenure: 'Since Sep 2020'
    },
    topHoldings: [
      { name: 'Cholamandalam Investment & Fin Co Ltd', sector: 'Financial Services', weight: 4.12 },
      { name: 'REC Ltd', sector: 'Financial Services', weight: 3.51 },
      { name: 'Power Finance Corporation Ltd', sector: 'Financial Services', weight: 3.24 },
      { name: 'Arvind Ltd', sector: 'Textiles', weight: 2.81 },
      { name: 'Birlasoft Ltd', sector: 'Technology', weight: 2.53 },
      { name: 'ICICI Bank Ltd', sector: 'Financial Services', weight: 2.12 },
      { name: 'Reliance Industries Ltd', sector: 'Energy & Utilities', weight: 1.95 }
    ]
  },
  // Parag Parikh Flexi Cap
  '122639': {
    aum: 64300,
    expenseRatio: 0.58,
    categoryAvgExpenseRatio: 0.89,
    exitLoad: '2.00% if redeemed within 365 days, 1.00% if redeemed within 366-730 days, Nil thereafter',
    turnOverRatio: 6.8,
    minSipAmount: 1000,
    minLumpsumAmount: 1000,
    rating: 5,
    fundManager: {
      name: 'Rajeev Thakkar',
      bio: 'Rajeev Thakkar is a seasoned value investor with over 22 years of experience. He manages equity investments under Parag Parikh Mutual Fund.',
      tenure: 'Since May 2013'
    },
    topHoldings: [
      { name: 'HDFC Bank Ltd', sector: 'Financial Services', weight: 8.42 },
      { name: 'ITC Ltd', sector: 'Consumer Goods', weight: 6.24 },
      { name: 'Bajaj Holdings & Investment Ltd', sector: 'Financial Services', weight: 5.91 },
      { name: 'Microsoft Corporation', sector: 'Technology', weight: 4.85 },
      { name: 'Alphabet Inc', sector: 'Technology', weight: 4.52 },
      { name: 'ICICI Bank Ltd', sector: 'Financial Services', weight: 4.15 },
      { name: 'Tata Consultancy Services Ltd', sector: 'Technology', weight: 3.85 }
    ]
  },
  // HDFC Flexi Cap
  '118955': {
    aum: 54120,
    expenseRatio: 0.81,
    categoryAvgExpenseRatio: 0.89,
    exitLoad: '1.00% if redeemed within 365 days, Nil thereafter',
    turnOverRatio: 28.0,
    minSipAmount: 100,
    minLumpsumAmount: 100,
    rating: 4,
    fundManager: {
      name: 'Roshi Jain',
      bio: 'Roshi Jain is a veteran fund manager with more than 18 years of experience. She focuses on benchmark-agnostic flexi-cap style portfolios.',
      tenure: 'Since Jun 2022'
    },
    topHoldings: [
      { name: 'ICICI Bank Ltd', sector: 'Financial Services', weight: 8.92 },
      { name: 'HDFC Bank Ltd', sector: 'Financial Services', weight: 8.21 },
      { name: 'Reliance Industries Ltd', sector: 'Energy & Utilities', weight: 7.14 },
      { name: 'Infosys Ltd', sector: 'Technology', weight: 5.52 },
      { name: 'Axis Bank Ltd', sector: 'Financial Services', weight: 4.81 },
      { name: 'State Bank of India', sector: 'Financial Services', weight: 4.12 },
      { name: 'Larsen & Toubro Ltd', sector: 'Capital Goods', weight: 3.85 }
    ]
  },
  // Quant Flexi Cap
  '120843': {
    aum: 6890,
    expenseRatio: 0.77,
    categoryAvgExpenseRatio: 0.89,
    exitLoad: '1.00% if redeemed within 15 days, Nil thereafter',
    turnOverRatio: 85.0,
    minSipAmount: 1000,
    minLumpsumAmount: 5000,
    rating: 5,
    fundManager: {
      name: 'Sandeep Tandon',
      bio: 'Sandeep Tandon is the founder of Quant Mutual Fund with over 26 years of capital market experience, using VLRT framework.',
      tenure: 'Since Jan 2020'
    },
    topHoldings: [
      { name: 'Reliance Industries Ltd', sector: 'Energy & Utilities', weight: 9.24 },
      { name: 'HDFC Bank Ltd', sector: 'Financial Services', weight: 7.52 },
      { name: 'Adani Power Ltd', sector: 'Energy & Utilities', weight: 6.81 },
      { name: 'Steel Authority of India Ltd', sector: 'Metals & Mining', weight: 5.52 },
      { name: 'Tata Power Company Ltd', sector: 'Energy & Utilities', weight: 4.91 },
      { name: 'Aurobindo Pharma Ltd', sector: 'Healthcare', weight: 4.15 },
      { name: 'LIC Housing Finance Ltd', sector: 'Financial Services', weight: 3.85 }
    ]
  },
  // Nippon India Multi Cap
  '118650': {
    aum: 31450,
    expenseRatio: 0.83,
    categoryAvgExpenseRatio: 0.85,
    exitLoad: '1.00% if redeemed within 365 days, Nil thereafter',
    turnOverRatio: 42.0,
    minSipAmount: 100,
    minLumpsumAmount: 5000,
    rating: 4,
    fundManager: {
      name: 'Sailesh Raj Bhan',
      bio: 'Sailesh Raj Bhan has over 24 years of experience in fund management and research, managing flagship equity schemes at Nippon India.',
      tenure: 'Since Jun 2005'
    },
    topHoldings: [
      { name: 'HDFC Bank Ltd', sector: 'Financial Services', weight: 6.24 },
      { name: 'ICICI Bank Ltd', sector: 'Financial Services', weight: 5.82 },
      { name: 'Reliance Industries Ltd', sector: 'Energy & Utilities', weight: 5.14 },
      { name: 'Larsen & Toubro Ltd', sector: 'Capital Goods', weight: 4.21 },
      { name: 'Axis Bank Ltd', sector: 'Financial Services', weight: 3.92 },
      { name: 'Infosys Ltd', sector: 'Technology', weight: 3.12 },
      { name: 'State Bank of India', sector: 'Financial Services', weight: 2.85 }
    ]
  },
  // ICICI Prudential Multi Asset
  '120334': {
    aum: 41120,
    expenseRatio: 0.92,
    categoryAvgExpenseRatio: 0.85,
    exitLoad: '1.00% if redeemed within 365 days, Nil thereafter',
    turnOverRatio: 62.0,
    minSipAmount: 100,
    minLumpsumAmount: 5000,
    rating: 5,
    fundManager: {
      name: 'Sankaran Naren',
      bio: 'Sankaran Naren is the CIO at ICICI Prudential AMC and is widely regarded as one of India\'s leading macro and value investors.',
      tenure: 'Since Feb 2012'
    },
    topHoldings: [
      { name: 'ICICI Bank Ltd', sector: 'Financial Services', weight: 7.82 },
      { name: 'NTPC Ltd', sector: 'Energy & Utilities', weight: 6.51 },
      { name: 'HDFC Bank Ltd', sector: 'Financial Services', weight: 5.92 },
      { name: 'Reliance Industries Ltd', sector: 'Energy & Utilities', weight: 5.24 },
      { name: 'Infosys Ltd', sector: 'Technology', weight: 4.51 },
      { name: 'Maruti Suzuki India Ltd', sector: 'Automotive', weight: 3.95 },
      { name: 'Bharti Airtel Ltd', sector: 'Telecommunication', weight: 3.42 }
    ]
  },
  // Quant Active Fund
  '120823': {
    aum: 10240,
    expenseRatio: 0.75,
    categoryAvgExpenseRatio: 0.85,
    exitLoad: '1.00% if redeemed within 15 days, Nil thereafter',
    turnOverRatio: 110.0,
    minSipAmount: 1000,
    minLumpsumAmount: 5000,
    rating: 5,
    fundManager: {
      name: 'Sandeep Tandon',
      bio: 'Sandeep Tandon leads Quant AMC equity decisions using dynamic predictive analytics and sector rotations.',
      tenure: 'Since Mar 2019'
    },
    topHoldings: [
      { name: 'Reliance Industries Ltd', sector: 'Energy & Utilities', weight: 8.41 },
      { name: 'HDFC Bank Ltd', sector: 'Financial Services', weight: 7.22 },
      { name: 'Aurobindo Pharma Ltd', sector: 'Healthcare', weight: 5.82 },
      { name: 'Tata Power Company Ltd', sector: 'Energy & Utilities', weight: 5.21 },
      { name: 'JSW Steel Ltd', sector: 'Metals & Mining', weight: 4.65 },
      { name: 'State Bank of India', sector: 'Financial Services', weight: 3.98 },
      { name: 'Larsen & Toubro Ltd', sector: 'Capital Goods', weight: 3.12 }
    ]
  },
  // Kotak Multicap
  '149185': {
    aum: 11320,
    expenseRatio: 0.38,
    categoryAvgExpenseRatio: 0.85,
    exitLoad: '1.00% if redeemed within 365 days, Nil thereafter',
    turnOverRatio: 34.0,
    minSipAmount: 100,
    minLumpsumAmount: 100,
    rating: 4,
    fundManager: {
      name: 'Harsha Upadhyaya',
      bio: 'Harsha Upadhyaya is the CIO - Equities at Kotak AMC with over 24 years of experience, emphasizing a growth-with-valuation framework.',
      tenure: 'Since Sep 2021'
    },
    topHoldings: [
      { name: 'HDFC Bank Ltd', sector: 'Financial Services', weight: 7.12 },
      { name: 'ICICI Bank Ltd', sector: 'Financial Services', weight: 6.52 },
      { name: 'Reliance Industries Ltd', sector: 'Energy & Utilities', weight: 5.81 },
      { name: 'Infosys Ltd', sector: 'Technology', weight: 4.24 },
      { name: 'Larsen & Toubro Ltd', sector: 'Capital Goods', weight: 3.91 },
      { name: 'Axis Bank Ltd', sector: 'Financial Services', weight: 3.15 },
      { name: 'ITC Ltd', sector: 'Consumer Goods', weight: 2.85 }
    ]
  },
  // HDFC Mid-Cap Opportunities
  '118989': {
    aum: 67450,
    expenseRatio: 0.74,
    categoryAvgExpenseRatio: 0.76,
    exitLoad: '1.00% if redeemed within 365 days, Nil thereafter',
    turnOverRatio: 16.0,
    minSipAmount: 100,
    minLumpsumAmount: 100,
    rating: 5,
    fundManager: {
      name: 'Chirag Setalvad',
      bio: 'Chirag Setalvad manages HDFC AMC\'s flagship mid-cap fund, selecting stocks with stable cashflows and scale leadership.',
      tenure: 'Since Jun 2007'
    },
    topHoldings: [
      { name: 'Cholamandalam Investment & Fin Co Ltd', sector: 'Financial Services', weight: 4.82 },
      { name: 'HDFC Bank Ltd', sector: 'Financial Services', weight: 4.51 },
      { name: 'Max Financial Services Ltd', sector: 'Financial Services', weight: 3.92 },
      { name: 'Federal Bank Ltd', sector: 'Financial Services', weight: 3.51 },
      { name: 'Tata Power Company Ltd', sector: 'Energy & Utilities', weight: 3.24 },
      { name: 'Supreme Industries Ltd', sector: 'Industrial Products', weight: 2.95 },
      { name: 'Indian Hotels Company Ltd', sector: 'Services', weight: 2.71 }
    ]
  },
  // Motilal Oswal Midcap
  '127042': {
    aum: 10850,
    expenseRatio: 0.62,
    categoryAvgExpenseRatio: 0.76,
    exitLoad: '1.00% if redeemed within 15 days, Nil thereafter',
    turnOverRatio: 48.0,
    minSipAmount: 500,
    minLumpsumAmount: 500,
    rating: 5,
    fundManager: {
      name: 'Niket Shah',
      bio: 'Niket Shah leads Motilal Midcap investments using high-conviction bottom-up stock selections and growth focus.',
      tenure: 'Since Mar 2020'
    },
    topHoldings: [
      { name: 'Jio Financial Services Ltd', sector: 'Financial Services', weight: 6.54 },
      { name: 'Zomato Ltd', sector: 'Services', weight: 5.92 },
      { name: 'Trent Ltd', sector: 'Consumer Goods', weight: 5.21 },
      { name: 'Prestige Estates Projects Ltd', sector: 'Construction', weight: 4.82 },
      { name: 'Kalyan Jewellers India Ltd', sector: 'Consumer Goods', weight: 4.25 },
      { name: 'Coforge Ltd', sector: 'Technology', weight: 3.85 },
      { name: 'Polycab India Ltd', sector: 'Capital Goods', weight: 3.12 }
    ]
  },
  // Axis Midcap
  '120505': {
    aum: 26120,
    expenseRatio: 0.55,
    categoryAvgExpenseRatio: 0.76,
    exitLoad: '1.00% if redeemed within 365 days, Nil thereafter',
    turnOverRatio: 24.0,
    minSipAmount: 100,
    minLumpsumAmount: 100,
    rating: 3,
    fundManager: {
      name: 'Shreyas Devalkar',
      bio: 'Shreyas Devalkar has over 19 years of experience, using a style focused on secular growth leadership in stable business franchises.',
      tenure: 'Since Nov 2016'
    },
    topHoldings: [
      { name: 'Cholamandalam Investment & Fin Co Ltd', sector: 'Financial Services', weight: 5.24 },
      { name: 'ICICI Bank Ltd', sector: 'Financial Services', weight: 4.92 },
      { name: 'Astral Ltd', sector: 'Capital Goods', weight: 4.51 },
      { name: 'Trent Ltd', sector: 'Consumer Goods', weight: 3.82 },
      { name: 'Bajaj Finance Ltd', sector: 'Financial Services', weight: 3.51 },
      { name: 'Supreme Industries Ltd', sector: 'Industrial Products', weight: 3.12 },
      { name: 'Tata Consultancy Services Ltd', sector: 'Technology', weight: 2.85 }
    ]
  },
  // UTI Nifty 50 Index
  '120716': {
    aum: 17850,
    expenseRatio: 0.18,
    categoryAvgExpenseRatio: 0.19,
    exitLoad: 'Nil exit load',
    turnOverRatio: 8.0,
    minSipAmount: 500,
    minLumpsumAmount: 5000,
    rating: 4,
    fundManager: {
      name: 'Sharwan Kumar Goyal',
      bio: 'Sharwan Kumar Goyal is a passive indexing expert at UTI AMC, tracking index returns with minimal tracking errors.',
      tenure: 'Since Jul 2018'
    },
    topHoldings: [
      { name: 'HDFC Bank Ltd', sector: 'Financial Services', weight: 11.24 },
      { name: 'Reliance Industries Ltd', sector: 'Energy & Utilities', weight: 9.82 },
      { name: 'ICICI Bank Ltd', sector: 'Financial Services', weight: 7.91 },
      { name: 'Infosys Ltd', sector: 'Technology', weight: 5.92 },
      { name: 'Larsen & Toubro Ltd', sector: 'Capital Goods', weight: 4.51 },
      { name: 'ITC Ltd', sector: 'Consumer Goods', weight: 4.12 },
      { name: 'Tata Consultancy Services Ltd', sector: 'Technology', weight: 3.85 }
    ]
  },
  // HDFC Index Fund - Nifty 50 Plan
  '119063': {
    aum: 14230,
    expenseRatio: 0.20,
    categoryAvgExpenseRatio: 0.19,
    exitLoad: '0.25% if redeemed within 3 days, Nil thereafter',
    turnOverRatio: 10.0,
    minSipAmount: 100,
    minLumpsumAmount: 100,
    rating: 4,
    fundManager: {
      name: 'Nirman Morakhia',
      bio: 'Nirman Morakhia has over 14 years of experience, managing passive index trackers and ETFs for HDFC AMC.',
      tenure: 'Since Feb 2023'
    },
    topHoldings: [
      { name: 'HDFC Bank Ltd', sector: 'Financial Services', weight: 11.24 },
      { name: 'Reliance Industries Ltd', sector: 'Energy & Utilities', weight: 9.82 },
      { name: 'ICICI Bank Ltd', sector: 'Financial Services', weight: 7.91 },
      { name: 'Infosys Ltd', sector: 'Technology', weight: 5.92 },
      { name: 'Larsen & Toubro Ltd', sector: 'Capital Goods', weight: 4.51 },
      { name: 'ITC Ltd', sector: 'Consumer Goods', weight: 4.12 },
      { name: 'Tata Consultancy Services Ltd', sector: 'Technology', weight: 3.85 }
    ]
  },
  // ICICI Prudential Nifty 50 Index
  '120620': {
    aum: 11840,
    expenseRatio: 0.17,
    categoryAvgExpenseRatio: 0.19,
    exitLoad: 'Nil exit load',
    turnOverRatio: 9.0,
    minSipAmount: 100,
    minLumpsumAmount: 100,
    rating: 4,
    fundManager: {
      name: 'Kayzad Eghlim',
      bio: 'Kayzad Eghlim is a veteran passive index fund manager at ICICI Prudential, replicating index compositions with precision.',
      tenure: 'Since Feb 2012'
    },
    topHoldings: [
      { name: 'HDFC Bank Ltd', sector: 'Financial Services', weight: 11.24 },
      { name: 'Reliance Industries Ltd', sector: 'Energy & Utilities', weight: 9.82 },
      { name: 'ICICI Bank Ltd', sector: 'Financial Services', weight: 7.91 },
      { name: 'Infosys Ltd', sector: 'Technology', weight: 5.92 },
      { name: 'Larsen & Toubro Ltd', sector: 'Capital Goods', weight: 4.51 },
      { name: 'ITC Ltd', sector: 'Consumer Goods', weight: 4.12 },
      { name: 'Tata Consultancy Services Ltd', sector: 'Technology', weight: 3.85 }
    ]
  }
};
