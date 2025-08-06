import { useState, useEffect, useCallback } from 'react';
import { SportsDbTable } from '../types';

export const useStandings = () => {
  const [standings, setStandings] = useState<SportsDbTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStandings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/.netlify/functions/fetch-standings');
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData?.error || 'Failed to fetch standings.');
      }
      setStandings(responseData.standings || []);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred while fetching standings.');
      setStandings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStandings();
  }, [fetchStandings]);

  return {
    standings,
    loading,
    error,
    refreshStandings: fetchStandings
  };
};
