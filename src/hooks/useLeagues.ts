import { useState, useEffect, useCallback } from 'react';
import { League } from '../types';
import { dbHelpers } from '../lib/database';

export const useLeagues = (userId?: string) => {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeagues = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const data = await dbHelpers.getUserLeagues(userId);
      setLeagues(data);
    } catch (error) {
      console.error('Error fetching leagues:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchLeagues();
  }, [fetchLeagues]);

  const createLeague = async (name: string, description?: string) => {
    if (!userId) return;

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const league = await dbHelpers.createLeague(name, description, code, userId, false);

    // Add creator as member
    await dbHelpers.addLeagueMember(league.id, userId);

    setLeagues(prev => [league, ...prev]);
    return league;
  };

  const joinLeague = async (code: string) => {
    if (!userId) return;

    const league = await dbHelpers.getLeagueByCode(code);

    if (!league) {
      throw new Error('Liga não encontrada');
    }

    // Check if already member
    const membership = await dbHelpers.checkLeagueMembership(league.id, userId);

    if (membership) {
      throw new Error('Você já é membro desta liga');
    }

    await dbHelpers.addLeagueMember(league.id, userId);

    // Fetch updated leagues
    await fetchLeagues();
  };

  return {
    leagues,
    loading,
    createLeague,
    joinLeague,
    refreshLeagues: fetchLeagues,
  };
};