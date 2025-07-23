import { useState, useEffect, useCallback } from 'react';
import { Bet } from '../types';
import { useAuth } from './useAuth';

export const useLeagueBets = (leagueId: string, round?: number | 'all') => {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayedRound, setDisplayedRound] = useState<number | undefined>();
  const { user } = useAuth();

  const fetchLeagueBets = useCallback(async (fetchForRound?: number | 'all') => {
    if (!user) return;

    setLoading(true);
    try {
      let url = `/.netlify/functions/fetch-league-bets?leagueId=${leagueId}`;
      if (fetchForRound) {
        url += `&round=${fetchForRound}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch league bets');
      }
      const data = await response.json();
      setBets(data.bets);
      setDisplayedRound(data.determinedRound);
    } catch (error) {
      console.error('Error fetching league bets:', error);
    } finally {
      setLoading(false);
    }
  }, [leagueId, user]);

  useEffect(() => {
    fetchLeagueBets(round);
  }, [round, fetchLeagueBets]);

  return { bets, loading, displayedRound };
};
