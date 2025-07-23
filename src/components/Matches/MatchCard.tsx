import React, { useState, useRef } from 'react';
import { Clock, Target, Trophy, Calendar } from 'lucide-react';
import { Match, Bet } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { timesInfo } from '../../lib/teams';

interface MatchCardProps {
  match: Match;
  userBet?: Bet;
  onPlaceBet: (homeScore: number, awayScore: number) => Promise<void>;
  canBet: boolean;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  userBet,
  onPlaceBet,
  canBet
}) => {
  const [showBetForm, setShowBetForm] = useState(false);
  const [homeScore, setHomeScore] = useState<number | null>(userBet?.home_score ?? null);
  const [awayScore, setAwayScore] = useState<number | null>(userBet?.away_score ?? null);
  const [loading, setLoading] = useState(false);
  const awayScoreInputRef = useRef<HTMLInputElement>(null);

  // Check if betting is allowed (client-side validation for UX)
  const isBettingAllowed = () => {
    if (!canBet || match.status !== 'scheduled') return false;
    if (match.status === 'postponed') return false;

    const matchDate = new Date(match.match_date);
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    return matchDate > fiveMinutesFromNow;
  };

  const getTimeUntilDeadline = () => {
    const matchDate = new Date(match.match_date);
    const now = new Date();
    const deadlineTime = new Date(matchDate.getTime() - 5 * 60 * 1000); // 5 minutes before match

    if (deadlineTime <= now) return null;

    const diffMs = deadlineTime.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    let timeString = 'Apostas encerram em ';
    if (diffHours > 0) {
      timeString += `${diffHours}h e ${diffMinutes}m`;
    } else {
      timeString += `${diffMinutes}m`;
    }

    return timeString;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isBettingAllowed()) {
      alert('Prazo para apostas encerrado. O jogo começa em menos de 5 minutos ou já começou.');
      return;
    }

    if (homeScore === null || awayScore === null) {
      alert('Preencha o placar corretamente.');
      return;
    }

    setLoading(true);
    try {
      await onPlaceBet(homeScore, awayScore);
      setShowBetForm(false);
    } catch (error) {
      console.error('Error placing bet:', error);
      // Show user-friendly error message
      if (error.message && error.message.includes('deadline')) {
        alert('Prazo para apostas encerrado. Não é mais possível apostar neste jogo.');
      } else {
        alert('Erro ao salvar aposta. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'live':
        return 'bg-green-100 text-green-800';
      case 'finished':
        return 'bg-gray-100 text-gray-800';
      case 'postponed':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Agendado';
      case 'live':
        return 'Ao Vivo';
      case 'finished':
        return 'Finalizado';
      case 'postponed':
        return 'Adiado';
      default:
        return status;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
      {/* Header with date and status - improved mobile layout */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-4">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            {format(new Date(match.match_date), 'dd/MM/yyyy - HH:mm', { locale: ptBR })}
          </span>
        </div>
        <span className={`self-start sm:self-auto px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(match.status)}`}>
          {getStatusText(match.status)}
        </span>
      </div>

      {/* Teams and score - improved mobile layout */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex-1 text-center min-w-0">
          <img
            src={timesInfo[match.home_team]?.escudo}
            alt={match.home_team}
            className="w-12 h-12 mx-auto mb-2"
          />
          <h3 className="font-semibold text-gray-800 dark:text-white mb-1 text-sm sm:text-base truncate px-1">
            {timesInfo[match.home_team]?.nome || match.home_team}
          </h3>
        </div>

        <div className="flex-shrink-0 mx-2 sm:mx-4">
          {(match.status === 'finished' || match.status === 'live') && match.home_score !== null && match.away_score !== null ? (
            <div className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
              {match.home_score} - {match.away_score}
            </div>
          ) : (
            <div className="text-xl sm:text-2xl font-bold text-gray-400 dark:text-gray-500">
              - : -
            </div>
          )}
        </div>

        <div className="flex-1 text-center min-w-0">
          <img
            src={timesInfo[match.away_team]?.escudo}
            alt={match.away_team}
            className="w-12 h-12 mx-auto mb-2"
          />
          <h3 className="font-semibold text-gray-800 dark:text-white mb-1 text-sm sm:text-base truncate px-1">
            {timesInfo[match.away_team]?.nome || match.away_team}
          </h3>
        </div>
      </div>

      {/* User bet section - improved mobile layout */}
      {userBet && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Sua aposta: {userBet.home_score} - {userBet.away_score}
              </span>
            </div>
            {(match.status === 'finished' || match.status === 'live') && userBet.points !== null && (
              <div className="flex items-center space-x-2 ml-6 sm:ml-0">
                <Trophy className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {userBet.points} pontos
                </span>
                {userBet.is_exact && (
                  <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 px-2 py-1 rounded">
                    Exato!
                  </span>
                )}
              </div>
            )}
            {(match.status === 'finished' || match.status === 'live') && userBet.points === null && (
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-6 sm:ml-0">Calculando pontos...</span>
            )}
          </div>
        </div>
      )}

      {/* Enhanced betting conditions with deadline validation */}
      {isBettingAllowed() && (
        <div className="space-y-3">
          {/* Show time until betting deadline */}
          {getTimeUntilDeadline() && (
            <div className="text-center text-xs text-gray-500 dark:text-gray-400 bg-yellow-50 dark:bg-yellow-900 py-2 px-2 rounded">
              <div className="break-words">
                {getTimeUntilDeadline()}
              </div>
            </div>
          )}

          {!showBetForm ? (
            <button
              onClick={() => {
                setHomeScore(userBet?.home_score ?? null);
                setAwayScore(userBet?.away_score ?? null);
                setShowBetForm(true);
              }}
              className="w-full px-4 py-2 sm:py-3 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-sm sm:text-base"
            >
              {userBet ? 'Alterar Aposta' : 'Fazer Aposta'}
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Betting form - improved mobile layout */}
              <div className="flex items-center justify-center space-x-2 sm:space-x-4">
                <div className="text-center flex-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <span className="truncate block max-w-full">
                      {timesInfo[match.home_team]?.abrev || match.home_team}
                    </span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={homeScore ?? ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setHomeScore(value === '' ? null : Number(value));
                      if (value.length > 0) {
                        awayScoreInputRef.current?.focus();
                      }
                    }}
                    className="w-12 sm:w-16 px-1 sm:px-2 py-1 sm:py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded text-center text-sm sm:text-base"
                    required
                  />
                </div>
                <span className="text-lg sm:text-xl font-bold text-gray-500 dark:text-gray-400 flex-shrink-0">×</span>
                <div className="text-center flex-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <span className="truncate block max-w-full">
                      {timesInfo[match.away_team]?.abrev || match.away_team}
                    </span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={awayScore ?? ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setAwayScore(value === '' ? null : Number(value));
                    }}
                    ref={awayScoreInputRef}
                    className="w-12 sm:w-16 px-1 sm:px-2 py-1 sm:py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded text-center text-sm sm:text-base"
                    required
                  />
                </div>
              </div>

              {/* Action buttons - improved mobile layout */}
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 sm:py-3 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded-lg disabled:opacity-50 text-sm sm:text-base font-medium"
                >
                  {loading ? 'Salvando...' : 'Confirmar'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBetForm(false)}
                  className="flex-1 px-4 py-2 sm:py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm sm:text-base font-medium"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Status messages - improved mobile layout */}
      {canBet && match.status === 'scheduled' && !isBettingAllowed() && (
        <div className="text-center text-xs sm:text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900 py-2 px-4 rounded-lg">
          <Clock className="w-4 h-4 inline mr-1" />
          <span className="break-words">Prazo para apostas encerrado</span>
        </div>
      )}

      {match.status === 'finished' && (
        <div className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-4">
          <Clock className="w-4 h-4 inline mr-1" />
          Jogo finalizado
        </div>
      )}

      {match.status === 'live' && (
        <div className="text-center text-xs sm:text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900 py-2 px-4 rounded-lg">
          <Clock className="w-4 h-4 inline mr-1" />
          Jogo em andamento
        </div>
      )}

      {match.status === 'postponed' && (
        <div className="text-center text-xs sm:text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900 py-2 px-4 rounded-lg">
          <Clock className="w-4 h-4 inline mr-1" />
          Jogo adiado
        </div>
      )}
    </div>
  );
};