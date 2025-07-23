import { useState, useEffect, useCallback } from 'react';
import { User } from '../types'; // Assuming User type is defined, might need a specific Member type
import { dbHelpers } from '../lib/database';

interface LeagueMember extends Pick<User, 'id' | 'name' | 'avatar' | 'email'> {
  // Add any other member-specific properties if needed
}

export const useLeagueMembers = (leagueId: string | undefined) => {
  const [members, setMembers] = useState<LeagueMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!leagueId) {
      setMembers([]);
      setLoading(false);
      return;
    }

    console.log(`[useLeagueMembers] Fetching members for league ID: ${leagueId}`);
    setLoading(true);
    setError(null);
    try {
      const data = await dbHelpers.getLeagueMembers(leagueId);
      console.log(`[useLeagueMembers] Members fetched for league ${leagueId}:`, data);
      setMembers(data as LeagueMember[]); // Cast or ensure data matches LeagueMember[]
    } catch (err: any) {
      console.error(`[useLeagueMembers] Error fetching members for league ${leagueId}:`, err);
      setError(err.message || 'Failed to fetch league members.');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [leagueId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]); // fetchMembers dependency is stable due to useCallback with [leagueId]

  return { members, loading, error, refreshMembers: fetchMembers };
};
