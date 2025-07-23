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
    if (bet.match.status !== 'finished' && bet.match.status !== 'live') return 'text-gray-500';
    if (bet.is_exact) return 'text-green-600';
    if (bet.points && bet.points > 0) return 'text-blue-600';
    return 'text-red-600';
  };

  const getResultBadge = (bet: Bet) => {
    if (bet.match.status !== 'finished' && bet.match.status !== 'live') return { text: 'P', color: 'bg-gray-100 text-gray-600' };
    if (bet.is_exact) return { text: '3', color: 'bg-green-100 text-green-700' };
    if (bet.points && bet.points > 0) return { text: '1', color: 'bg-blue-100 text-blue-700' };
    return { text: '0', color: 'bg-red-100 text-red-700' };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      {/* Header Compacto */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-800 dark:to-emerald-900 rounded-lg p-4 mb-4 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{league?.name}</h1>
            <p className="text-green-100 text-sm">Apostas da Liga</p>
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
          <div key={match.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="sm:m-1 p-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-center space-x-2 sm:space-x-1">
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 text-right w-16 sm:w-24 truncate">
                  <span className="hidden sm:inline">{timesInfo[match.home_team]?.nome || match.home_team}</span>
                  <span className="sm:hidden">{timesInfo[match.home_team]?.abrev || match.home_team}</span>
                </div>
                <img src={timesInfo[match.home_team]?.escudo} alt={match.home_team} className="h-6 w-6" />
                <div className="text-lg font-bold text-gray-900 dark:text-white flex-shrink-0">
                  <span>{match.home_score ?? ''}</span>
                  <span className="mx-1">-</span>
                  <span>{match.away_score ?? ''}</span>
                </div>
                <img src={timesInfo[match.away_team]?.escudo} alt={match.away_team} className="h-6 w-6" />
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 text-left w-16 sm:w-24 truncate">
                  <span className="hidden sm:inline">{timesInfo[match.away_team]?.nome || match.away_team}</span>
                  <span className="sm:hidden">{timesInfo[match.away_team]?.abrev || match.away_team}</span>
                </div>
              </div>
              <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                {format(new Date(match.match_date), 'dd/MM HH:mm', { locale: ptBR })}
              </div>
            </div>
            <div className="p-3 flex flex-wrap gap-3">
              {bets.map(bet => {
                const badge = getResultBadge(bet);
                return (
                  <div key={bet.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 border border-gray-200 dark:border-gray-600 flex items-center justify-between w-auto">
                    <div className="flex items-center">
                      <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate mr-1">{bet.user.name}</h4>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-gray-800 dark:text-white bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-md">
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
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="w-16 h-16 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Nenhuma aposta para exibir
          </h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
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
