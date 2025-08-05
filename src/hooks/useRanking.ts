import { useState, useEffect, useCallback } from 'react';
import { UserStats } from '../types';

export const useRanking = (leagueId: string, round?: number | 'all') => {
  const [ranking, setRanking] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayedRound, setDisplayedRound] = useState<number | undefined>();

  const fetchRanking = useCallback(async (fetchForRound?: number | 'all') => {
    if (!leagueId) {
      setRanking([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let url = `/.netlify/functions/fetch-ranking?leagueId=${leagueId}`;
      if (fetchForRound) {
        url += `&round=${fetchForRound}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch ranking');
      }
      const data = await response.json();
      setRanking(data.ranking);
      setDisplayedRound(data.determinedRound);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [leagueId]);

  useEffect(() => {
    fetchRanking(round);
  }, [round, fetchRanking]);

  return { ranking, loading, error, displayedRound, refreshRanking: () => fetchRanking(round) };
};