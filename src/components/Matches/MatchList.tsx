import React, { useState } from 'react';
import { Calendar, Shield } from 'lucide-react';
import { League, Match, Bet } from '../../types';
import { MatchCard } from './MatchCard';
import { dbHelpers } from '../../lib/database';
import { RoundSelector } from '../Ranking/RoundSelector';
import { StandingsTable } from '../Standings/StandingsTable';
import { useStandings } from '../../hooks/useStandings';

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
  const [view, setView] = useState<'matches' | 'standings'>('matches');
  const { standings, loading: standingsLoading, error: standingsError } = useStandings();
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const renderContent = () => {
    if (view === 'standings') {
      return <StandingsTable standings={standings} loading={standingsLoading} error={standingsError} />;
    }

    if (loading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12 px-4">
          <p className="text-destructive text-sm sm:text-base">Erro ao carregar jogos: {error}</p>
        </div>
      );
    }

    if (matches.length === 0) {
      return (
        <div className="text-center py-8 sm:py-12 bg-muted rounded-lg mx-4 sm:mx-0">
          <Calendar className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-semibold text-muted-foreground mb-2">
            Nenhum jogo encontrado
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground px-4">
            {selectedRound ? `Não há jogos para a ${selectedRound}ª rodada` : 'Não há jogos disponíveis'}
          </p>
        </div>
      );
    }

    return (
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
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className={`bg-primary rounded-lg p-4 mb-4 text-primary-foreground ${isMobile ? 'sticky top-0 z-10' : ''}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{view === 'matches' ? 'Jogos' : 'Classificação'}</h1>
            <p className="text-primary-foreground/80 text-sm">
              {view === 'matches' ? 'Faça suas apostas' : 'Confira a tabela do campeonato'}
            </p>
          </div>
          <div className="flex bg-primary-foreground/20 rounded-lg p-1">
            <button
              onClick={() => setView('matches')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                view === 'matches' ? 'bg-primary-foreground text-primary' : 'text-primary-foreground/80'
              }`}
            >
              <Calendar className="w-4 h-4 inline-block mr-2" />
              Jogos
            </button>
            <button
              onClick={() => setView('standings')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                view === 'standings' ? 'bg-primary-foreground text-primary' : 'text-primary-foreground/80'
              }`}
            >
              <Shield className="w-4 h-4 inline-block mr-2" />
              Classificação
            </button>
          </div>
        </div>
      </div>

      {view === 'matches' && (
        <div className="w-full sm:w-auto">
          <RoundSelector
            selectedRound={selectedRound}
            onRoundChange={onRoundChange}
            totalRounds={38}
            variant="onGradient"
          />
        </div>
      )}

      {renderContent()}
    </div>
  );
};
