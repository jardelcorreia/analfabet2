import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { League, Match, Bet } from '../../types';
import { MatchCard } from './MatchCard';
import { dbHelpers } from '../../lib/database';
import { RoundSelector } from '../Ranking/RoundSelector';

interface MatchListProps {
  league: League;
  userId: string;
  matches: Match[];
  loading: boolean;
  error: string | null;
  displayedRound: number | undefined;
  selectedRound: number | 'all' | undefined;
  onRoundChange: (round: number | 'all' | undefined) => void;
}

export const MatchList: React.FC<MatchListProps> = ({
  league,
  userId,
  matches,
  loading,
  error,
  displayedRound,
  selectedRound,
  onRoundChange,
}) => {
  const [userBets, setUserBets] = useState<Bet[]>([]);

  React.useEffect(() => {
    if (displayedRound !== undefined && selectedRound !== displayedRound && selectedRound !== 'all') {
      if (selectedRound === undefined) {
        onRoundChange(displayedRound);
      }
    }
  }, [displayedRound, selectedRound, onRoundChange]);

  React.useEffect(() => {
    const fetchUserBets = async () => {
      if (!league.id) return;

      try {
        const data = await dbHelpers.getUserBets(userId, league.id);
        setUserBets(data);
      } catch (error) {
        console.error('Error fetching user bets:', error);
      }
    };

    fetchUserBets();
  }, [league.id, userId]);

  const placeBet = async (match: Match, homeScore: number, awayScore: number) => {
    const existingBet = userBets.find(bet => bet.match_id === match.id);

    try {
      // Use server-side betting endpoint for validation
      const token = localStorage.getItem('analfa_bet_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/.netlify/functions/place-bet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          matchId: match.id,
          leagueId: league.id,
          homeScore,
          awayScore,
          betId: existingBet?.id
        })
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (response.status === 403 && responseData.error === 'Betting deadline exceeded') {
          throw new Error(`Prazo para apostas encerrado: ${responseData.reason}`);
        }
        throw new Error(responseData.error || 'Erro ao processar aposta');
      }

      // Update local state with the returned bet
      if (existingBet) {
        setUserBets(prev => prev.map(bet => 
          bet.id === existingBet.id 
            ? { ...bet, home_score: homeScore, away_score: awayScore }
            : bet
        ));
      } else {
        setUserBets(prev => [...prev, responseData.bet]);
      }
      
    } catch (error) {
      console.error('Error placing bet:', error);
      throw error;
    }
  };

  const rounds = Array.from({ length: 38 }, (_, i) => i + 1);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-red-600 dark:text-red-400 text-sm sm:text-base">Erro ao carregar jogos: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with improved mobile layout */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-800 dark:to-emerald-900 rounded-lg p-4 mb-4 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Jogos</h1>
            <p className="text-green-100 text-sm">Faça suas apostas</p>
          </div>
          <div className="w-full sm:w-auto">
            <RoundSelector
              selectedRound={selectedRound}
              onRoundChange={onRoundChange}
              totalRounds={38}
              variant="onGradient"
            />
          </div>
        </div>
      </div>

      {/* Responsive grid with improved mobile layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {matches.map((match) => {
          const userBet = userBets.find(bet => bet.match_id === match.id);
          
          return (
            <MatchCard
              key={match.id}
              match={match}
              userBet={userBet}
              onPlaceBet={(homeScore, awayScore) => placeBet(match, homeScore, awayScore)}
              canBet={true}
            />
          );
        })}
      </div>

      {/* Empty state with responsive design */}
      {matches.length === 0 && (
        <div className="text-center py-8 sm:py-12 bg-gray-50 dark:bg-gray-800 rounded-lg mx-4 sm:mx-0">
          <Calendar className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">
            Nenhum jogo encontrado
          </h3>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 px-4">
            {selectedRound ? `Não há jogos para a ${selectedRound}ª rodada` : 'Não há jogos disponíveis'}
          </p>
        </div>
      )}
    </div>
  );
};
