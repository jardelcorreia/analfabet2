import { useState, useEffect, useCallback } from 'react';
import { Match } from '../types';
// dbHelpers will no longer be directly used here for fetching matches.
// import { dbHelpers } from '../lib/database';

export const useMatches = (round?: number | 'all') => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayedRound, setDisplayedRound] = useState<number | undefined>();

  const fetchMatches = useCallback(async (fetchForRound?: number | 'all') => {
    setLoading(true);
    setError(null);
    try {
      let url = '/.netlify/functions/fetch-matches';
      if (fetchForRound) {
        url += `?round=${fetchForRound}`;
      }
      const response = await fetch(url);
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData?.error || 'Failed to fetch matches.');
      }
      setMatches(responseData.matches || []);
      setDisplayedRound(responseData.determinedRound);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred while fetching matches.');
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches(round);
  }, [round, fetchMatches]);

  return {
    matches,
    loading,
    error,
    displayedRound, // Return the actual round being displayed
    refreshMatches: () => fetchMatches(round) // Refresh based on current user-selected round prop
  };
};