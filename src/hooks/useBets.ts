import { useState, useEffect, useCallback } from 'react';
import { Bet } from '../types';

export const useBets = (leagueId: string, userId: string, round?: number | 'all') => {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayedRound, setDisplayedRound] = useState<number | undefined>();

  const fetchBets = useCallback(async (fetchForRound?: number | 'all') => {
    if (!leagueId || !userId) {
      setBets([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let url = `/.netlify/functions/fetch-bets?leagueId=${leagueId}&userId=${userId}`;
      if (fetchForRound) {
        url += `&round=${fetchForRound}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch bets');
      }
      const data = await response.json();
      setBets(data.bets);
      setDisplayedRound(data.determinedRound);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [leagueId, userId]);

  useEffect(() => {
    fetchBets(round);
  }, [round, fetchBets]);

  return { bets, loading, error, displayedRound, refreshBets: () => fetchBets(round) };
};
