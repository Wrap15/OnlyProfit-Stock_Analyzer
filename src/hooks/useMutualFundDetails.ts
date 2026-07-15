import { useState, useEffect, useMemo } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useStockStore } from '@/store/useStockStore';

interface FundDetails {
  code: string;
  name: string;
  category: string;
  categoryLabel: string;
  fundHouse: string;
  schemeType: string;
  schemeCategory: string;
  latestNav: number;
  navChange: number;
  navChangePercent: number;
  oneYearReturn: number;
  threeYearReturn: number;
  fiveYearReturn: number;
  aum: number;
  expenseRatio: number;
  categoryAvgExpenseRatio: number;
  sharpeRatio: number;
  sortinoRatio: number;
  standardDeviation: number;
  beta: number;
  minSipAmount: number;
  minLumpsumAmount: number;
  exitLoad: string;
  turnOverRatio: number;
  assetAllocation: {
    equity: number;
    debt: number;
    cash: number;
  };
  topHoldings: Array<{
    name: string;
    sector: string;
    weight: number;
  }>;
  fundManager: {
    name: string;
    bio: string;
    tenure: string;
  };
  chartData: Array<{
    time: number;
    value: number;
  }>;
  logoUrl?: string | null;
  rating: number;
}

export function useMutualFundDetails(code: string, activeRange: string) {
  const { addToRecentSearches } = useStockStore();
  const [fund, setFund] = useState<FundDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // Peers and Sidebar states
  const [peers, setPeers] = useState<any[]>([]);
  const [peersLoading, setPeersLoading] = useState(false);

  // Save to recent searches
  useEffect(() => {
    if (code) {
      addToRecentSearches(code);
    }
  }, [code, addToRecentSearches]);

  // Fetch fund details
  useEffect(() => {
    if (!code) return;

    async function fetchFundDetails() {
      try {
        setLoading(true);
        const res = await apiClient.get(`/api/stock/mutualfund/${code}?range=${activeRange}`);
        setFund(res.data);
      } catch (err) {
        console.error(`Failed to fetch mutual fund details for code ${code}`, err);
      } finally {
        setLoading(false);
      }
    }

    fetchFundDetails();
  }, [code, activeRange]);

  // Dynamic Peer Fetcher
  useEffect(() => {
    if (!fund) return;
    const fundCategory = fund.category;
    const fundCode = fund.code;
    
    async function fetchPeers() {
      try {
        setPeersLoading(true);
        const res = await apiClient.get('/api/stock/mutualfund');
        const list = res.data || [];
        const filtered = list.filter((f: any) => f.category === fundCategory && f.code !== fundCode);
        setPeers(filtered.slice(0, 3));
      } catch (err) {
        console.error('Failed to fetch peer funds', err);
      } finally {
        setPeersLoading(false);
      }
    }
    
    fetchPeers();
  }, [fund]);

  // Set document metadata dynamically
  useEffect(() => {
    if (fund) {
      document.title = `${fund.name} NAV, Growth Charts & Returns Analysis | OnlyProfit`;
      
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', `Analyze live NAV, past returns, expense ratio, AUM, asset allocation, top stock holdings, and fund managers for ${fund.name}. Calculate SIP yields on OnlyProfit.`);
      }
    }
  }, [fund]);

  // Aggregate sector concentrations dynamically
  const sectorAllocation = useMemo(() => {
    if (!fund) return [];
    const sectorWeights = fund.topHoldings.reduce((acc: Record<string, number>, curr) => {
      acc[curr.sector] = (acc[curr.sector] || 0) + curr.weight;
      return acc;
    }, {});
    return Object.entries(sectorWeights)
      .map(([name, weight]) => ({ name, weight: parseFloat(weight.toFixed(1)) }))
      .sort((a, b) => b.weight - a.weight);
  }, [fund]);

  // Derive risk level
  const riskLevel = useMemo(() => {
    if (!fund) return 'Very High Risk';
    const cat = fund.category;
    switch (cat?.toLowerCase()) {
      case 'index':
        return 'Moderately High Risk';
      case 'smallcap':
      case 'midcap':
      case 'multicap':
      case 'flexicap':
      default:
        return 'Very High Risk';
    }
  }, [fund]);

  return {
    fund,
    loading,
    peers,
    peersLoading,
    sectorAllocation,
    riskLevel,
  };
}
