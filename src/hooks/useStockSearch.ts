import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';

export interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}

export function useStockSearch(initialQuery = '') {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await apiClient.get<SearchResult[]>(`/api/stock/search?q=${encodeURIComponent(query)}`);
        setResults(res.data || []);
      } catch (err) {
        console.error('useStockSearch error:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  return { query, setQuery, results, loading };
}
