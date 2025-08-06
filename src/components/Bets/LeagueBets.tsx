import React, { useState, useMemo, useEffect } from 'react';
import { useLeagueBets } from '../../hooks/useLeagueBets';
import { RoundSelector } from '../Ranking/RoundSelector';
import { Bet, League } from '../../types';
import { timesInfo } from '../../lib/teams';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Users, Trophy, Target, ChevronDown, ChevronUp } from 'lucide-react';

interface LeagueBetsProps {
  league: League;
}

export const LeagueBets: React.FC<LeagueBetsProps> = ({ league }) => {
  const [selectedRound, setSelectedRound] = useState<number | 'all' | undefined>();
  const { bets, loading, displayedRound } = useLeagueBets(league.id, selectedRound);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (displayedRound !== undefined && selectedRound !== displayedRound && selectedRound !== 'all') {
      if (selectedRound === undefined) {
        setSelectedRound(displayedRound);
      }
    }
  }, [displayedRound, selectedRound]);

  const betsByMatch = useMemo(() => {
    const now = new Date();
    return bets
      .filter(bet => new Date(bet.match.match_date) <= now)
      .reduce((acc, bet) => {
        const match = bet.match;
        if (!acc[match.id]) {
          acc[match.id] = {
            match,
            bets: [],
          };
        }
        acc[match.id].bets.push(bet);
        return acc;
      }, {} as Record<string, { match: any; bets: Bet[] }>);
  }, [bets]);

  const getResultColor = (bet: Bet) => {
    if (bet.match.status !== 'finished' && bet.match.status !== 'live') return 'text-muted-foreground';
    if (bet.is_exact) return 'text-success';
    if (bet.points && bet.points > 0) return 'text-secondary-foreground';
    return 'text-destructive';
  };

  const getResultBadge = (bet: Bet) => {
    if (bet.match.status !== 'finished' && bet.match.status !== 'live') return { text: 'P', color: 'bg-muted text-muted-foreground' };
    if (bet.is_exact) return { text: '3', color: 'bg-success/10 text-success' };
    if (bet.points && bet.points > 0) return { text: '1', color: 'bg-warning/10 text-warning' };
    return { text: '0', color: 'bg-destructive/10 text-destructive' };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl shadow-lg">
      {/* Header Compacto */}
      <div className={`bg-primary rounded-lg p-4 mb-4 text-primary-foreground ${isMobile ? 'sticky top-0 z-10' : ''}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{league?.name}</h1>
            <p className="text-primary-foreground/80 text-sm">Apostas da Liga</p>
          </div>
          <div className="w-full sm:w-auto">
            <RoundSelector
              selectedRound={selectedRound}
              onRoundChange={setSelectedRound}
              totalRounds={38}
              variant="onGradient"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 p-1">
        {Object.values(betsByMatch).map(({ match, bets }) => (
          <div key={match.id} className="bg-card rounded-lg shadow-sm border border-border">
            <div className="sm:m-1 p-3 bg-muted border-b border-border">
              <div className="flex items-center justify-center space-x-2 sm:space-x-1">
                <div className="text-sm font-semibold text-foreground text-right w-16 sm:w-24 truncate">
                  <span className="hidden sm:inline">{timesInfo[match.home_team]?.nome || match.home_team}</span>
                  <span className="sm:hidden">{timesInfo[match.home_team]?.abrev || match.home_team}</span>
                </div>
                <img src={timesInfo[match.home_team]?.escudo} alt={match.home_team} className="h-6 w-6" />
                <div className="text-lg font-bold text-foreground flex-shrink-0">
                  <span>{match.home_score ?? ''}</span>
                  <span className="mx-1">-</span>
                  <span>{match.away_score ?? ''}</span>
                </div>
                <img src={timesInfo[match.away_team]?.escudo} alt={match.away_team} className="h-6 w-6" />
                <div className="text-sm font-semibold text-foreground text-left w-16 sm:w-24 truncate">
                  <span className="hidden sm:inline">{timesInfo[match.away_team]?.nome || match.away_team}</span>
                  <span className="sm:hidden">{timesInfo[match.away_team]?.abrev || match.away_team}</span>
                </div>
              </div>
              <div className="text-center text-xs text-muted-foreground mt-1">
                {format(new Date(match.match_date), "eeee, d 'de' MMMM - HH:mm", { locale: ptBR })}
              </div>
            </div>
            <div className="p-3 flex flex-wrap gap-3">
              {bets.map(bet => {
                const badge = getResultBadge(bet);
                return (
                  <div key={bet.id} className="bg-muted rounded-lg p-2 border border-border flex items-center justify-between w-auto">
                    <div className="flex items-center">
                      <h4 className="font-semibold text-sm text-foreground truncate mr-1">{bet.user.name}</h4>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-foreground bg-background px-2 py-1 rounded-md">
                        {bet.home_score} : {bet.away_score}
                      </span>
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${badge.color}`}>
                        {badge.text}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Estado Vazio */}
      {Object.keys(betsByMatch).length === 0 && (
        <div className="text-center py-12 bg-card rounded-lg shadow-sm border border-border">
          <div className="w-16 h-16 bg-gradient-to-r from-muted to-muted/80 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Nenhuma aposta para exibir
          </h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            {selectedRound
              ? `As apostas da rodada ${selectedRound} serão exibidas aqui após o início de cada partida.`
              : 'As apostas serão exibidas aqui após o início de cada partida.'
            }
          </p>
        </div>
      )}
    </div>
  );
};
