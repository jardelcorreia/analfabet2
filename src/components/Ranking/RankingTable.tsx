import React, { useLayoutEffect, useMemo } from 'react';
import { Trophy, Target, BarChart3, Medal, Crown, Star, TrendingUp, ChevronDown, ChevronUp, Info, Search, Filter } from 'lucide-react';
import { UserStats } from '../../types';
import { RoundSelector } from './RoundSelector';

interface RankingTableProps {
  ranking: UserStats[];
  currentUserId?: string;
  selectedRound: number | 'all' | undefined;
  onRoundChange: (round: number | 'all' | undefined) => void;
  totalRounds: number;
}

export const RankingTable: React.FC<RankingTableProps> = ({
  ranking,
  currentUserId,
  selectedRound,
  onRoundChange,
  totalRounds,
}) => {
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [showTopOnly, setShowTopOnly] = React.useState(false);

  useLayoutEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleRowExpansion = (userId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  // Memoize filtered and sorted ranking with proper rank assignment
  const { sortedRanking, filteredRanking } = useMemo(() => {
    // First filter based on search and top filter
    const filtered = ranking.filter(user => {
      const matchesSearch = user.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.user.email.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });

    // Sort the filtered results
    const sorted = [...filtered].sort((a, b) => {
      if (b.total_points !== a.total_points) return b.total_points - a.total_points;
      if (b.exact_scores !== a.exact_scores) return b.exact_scores - a.exact_scores;
      return a.user.name.localeCompare(b.user.name);
    });

    // Assign ranks with proper tie handling
    let rank = 1;
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0) {
        const prev = sorted[i - 1];
        const curr = sorted[i];
        if (curr.total_points !== prev.total_points || curr.exact_scores !== prev.exact_scores) {
          rank = i + 1; // Proper rank calculation for ties
        }
      }
      sorted[i].rank = rank;
    }

    // Apply top filter after ranking is assigned
    const finalFiltered = showTopOnly ? sorted.slice(0, 10) : sorted;

    return { sortedRanking: sorted, filteredRanking: finalFiltered };
  }, [ranking, searchTerm, showTopOnly]);

  // Memoize medal icon generation
  const getMedalIcon = useMemo(() => (rank: number) => {
    const allPlayersHaveZeroPoints = sortedRanking.length > 0 && sortedRanking.every(player => player.total_points === 0);

    if (allPlayersHaveZeroPoints) {
      return (
        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center border-2 border-border">
          <span className="text-sm font-bold text-muted-foreground">{rank}</span>
        </div>
      );
    }

    // Find actual ranks for medal positions
    const goldPlayers = sortedRanking.filter(p => p.rank === 1);
    const silverRank = goldPlayers.length > 0 ?
      sortedRanking.find(p => p.rank > 1)?.rank || 2 : 2;
    const bronzeRank = sortedRanking.find(p => p.rank > silverRank)?.rank || silverRank + 1;

    if (rank === 1) {
      return (
        <div className="relative">
          <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
            <Crown className="w-5 h-5 text-black" />
          </div>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-300 rounded-full animate-pulse"></div>
        </div>
      );
    }
    if (rank === silverRank) {
      return (
        <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center shadow-md">
          <Medal className="w-5 h-5 text-black" />
        </div>
      );
    }
    if (rank === bronzeRank) {
      return (
        <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center shadow-md">
          <Medal className="w-5 h-5 text-black" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center border-2 border-border">
        <span className="text-sm font-bold text-muted-foreground">{rank}</span>
      </div>
    );
  }, [sortedRanking]);

  const getRowClass = (userId: string, rank: number) => {
    const isCurrentUser = userId === currentUserId;
    const isTopThree = rank <= 3;

    if (isCurrentUser) {
      return 'bg-primary/10 border-l-4 border-primary shadow-sm';
    }

    if (isTopThree && !sortedRanking.every(p => p.total_points === 0)) {
      return 'bg-yellow-400/10 hover:bg-yellow-400/20 transition-all duration-200';
    }

    return 'bg-card hover:bg-muted transition-all duration-200';
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 70) return 'text-success bg-success/10';
    if (accuracy >= 50) return 'text-warning bg-warning/10';
    return 'text-destructive bg-destructive/10';
  };

  // Memoize podium calculations
  const podiumData = useMemo(() => {
    if (isMobile || sortedRanking.length === 0 || sortedRanking.every(player => player.total_points === 0)) {
      return null;
    }

    const goldPlayers = sortedRanking.filter(p => p.rank === 1);
    const silverRank = sortedRanking.find(p => p.rank > 1)?.rank;
    const silverPlayers = silverRank ? sortedRanking.filter(p => p.rank === silverRank) : [];
    const bronzeRank = sortedRanking.find(p => silverRank && p.rank > silverRank)?.rank;
    const bronzePlayers = bronzeRank ? sortedRanking.filter(p => p.rank === bronzeRank) : [];

    return [
      { players: silverPlayers, type: 'left', label: '2º', medalClass: "bg-gray-400" },
      { players: goldPlayers, type: 'center', label: '1º', medalClass: "bg-yellow-400" },
      { players: bronzePlayers, type: 'right', label: '3º', medalClass: "bg-yellow-600" }
    ];
  }, [isMobile, sortedRanking]);

  // Mobile Compact Row Component
  const MobileCompactRow = React.memo(({ userStat }: { userStat: UserStats }) => {
    const accuracy = userStat.total_bets > 0
      ? ((userStat.correct_results / userStat.total_bets) * 100)
      : 0;

    return (
      <div className={`border-b border-border transition-all duration-200 ${getRowClass(userStat.user_id, userStat.rank!)}`}>
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {getMedalIcon(userStat.rank!)}
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xs shadow-md flex-shrink-0">
                {userStat.user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-card-foreground truncate">
                    {userStat.user.name}
                  </span>
                  {userStat.user_id === currentUserId && (
                    <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full flex-shrink-0">
                      Você
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {userStat.user.email}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1 bg-warning/10 rounded-full px-2 py-1 flex-shrink-0">
              <Trophy className="w-3 h-3 text-warning" />
              <span className="text-sm font-bold text-yellow-800 dark:text-warning">
                {userStat.total_points}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2 text-xs">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Target className="w-3 h-3 text-success" />
                <span className="text-muted-foreground">{userStat.exact_scores}</span>
              </div>

              {selectedRound === 'all' && (
                <div className="flex items-center space-x-1">
                  <Crown className="w-3 h-3 text-secondary-foreground" />
                  <span className="text-muted-foreground">{userStat.rounds_won || 0}</span>
                  <span className="text-muted-foreground">/ {userStat.rounds_tied || 0}</span>
                </div>
              )}

              <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${getAccuracyColor(accuracy)}`}>
                {accuracy.toFixed(0)}%
              </div>
            </div>

            {selectedRound === 'all' && (userStat.rounds_won > 0 || userStat.rounds_tied > 0) && (
              <button
                onClick={() => toggleRowExpansion(userStat.user_id)}
                className="flex items-center space-x-1 text-secondary-foreground hover:text-secondary-foreground/80 transition-colors p-1"
                aria-label={`${expandedRows.has(userStat.user_id) ? 'Ocultar' : 'Mostrar'} detalhes de ${userStat.user.name}`}
              >
                <span className="text-xs">Detalhes</span>
                {expandedRows.has(userStat.user_id) ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
            )}
          </div>

          {selectedRound === 'all' && expandedRows.has(userStat.user_id) && (userStat.rounds_won > 0 || userStat.rounds_tied > 0) && (
            <div className="mt-3 p-3 bg-secondary/10 rounded-lg">
              <div className="text-xs font-medium text-secondary-foreground mb-2">
                Melhores Rodadas:
              </div>
              <div className="grid grid-cols-6 gap-1">
                {userStat.round_results?.slice(0, 12).map((result) => (
                  <div
                    key={result.round}
                    className={`flex items-center justify-center rounded px-1 py-0.5 ${
                      result.type === 'win' ? 'bg-green-500/20' : 'bg-yellow-500/20'
                    }`}
                    title={result.type === 'win' ? `Vitória na Rodada ${result.round}` : `Empate na Rodada ${result.round}`}
                  >
                    <span className={`text-xs font-medium ${
                      result.type === 'win' ? 'text-green-800 dark:text-green-300' : 'text-yellow-800 dark:text-warning'
                    }`}>
                      R{result.round} ({result.type === 'win' ? 'V' : 'E'})
                    </span>
                  </div>
                ))}
                {userStat.round_results && userStat.round_results.length > 12 && (
                  <div className="flex items-center justify-center text-xs text-secondary-foreground col-span-2">
                    +{userStat.round_results.length - 12} mais
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  });

  // Desktop Table Row Component
  const DesktopRow = React.memo(({ userStat }: { userStat: UserStats }) => {
    const accuracy = userStat.total_bets > 0
      ? ((userStat.correct_results / userStat.total_bets) * 100)
      : 0;

    return (
      <React.Fragment key={userStat.user_id}>
        <tr className={`border dark:border-border transition-all duration-200 ${getRowClass(userStat.user_id, userStat.rank!)}`}>
          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
            <div className="flex items-center">
              {getMedalIcon(userStat.rank!)}
            </div>
          </td>
          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold shadow-md">
                {userStat.user.name.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3 sm:ml-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-card-foreground">
                    {userStat.user.name}
                  </span>
                  {userStat.user_id === currentUserId && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                      Você
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {userStat.user.email}
                </div>
              </div>
            </div>
          </td>
          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-center">
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-1 bg-warning/10 rounded-full px-3 py-1">
                <Trophy className="w-4 h-4 text-warning" />
                <span className="text-sm font-bold text-yellow-800 dark:text-warning">
                  {userStat.total_points}
                </span>
              </div>
            </div>
          </td>
          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-center">
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-1 bg-success/10 rounded-full px-3 py-1">
                <Target className="w-4 h-4 text-success" />
                <span className="text-sm font-medium text-green-800">
                  {userStat.exact_scores}
                </span>
              </div>
            </div>
          </td>
          {selectedRound === 'all' && (
            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-center hidden lg:table-cell">
              <div className="flex items-center justify-center">
                <div
                  className={`flex items-center space-x-1 bg-secondary/10 rounded-full px-3 py-1 ${
                    (userStat.rounds_won > 0 || userStat.rounds_tied > 0)
                      ? 'cursor-pointer hover:bg-secondary/20 transition-colors'
                      : ''
                  }`}
                  onClick={() => (userStat.rounds_won > 0 || userStat.rounds_tied > 0) && toggleRowExpansion(userStat.user_id)}
                >
                  <Crown className="w-4 h-4 text-secondary-foreground" />
                  <span className="text-sm font-medium text-secondary-foreground">
                    {userStat.rounds_won || 0} / {userStat.rounds_tied || 0}
                  </span>
                  {(userStat.rounds_won > 0 || userStat.rounds_tied > 0) && (
                    expandedRows.has(userStat.user_id) ? (
                      <ChevronUp className="w-3 h-3 text-secondary-foreground" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-secondary-foreground" />
                    )
                  )}
                </div>
              </div>
            </td>
          )}
          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-center hidden md:table-cell">
            <span className="text-sm font-medium text-card-foreground">
              {userStat.total_bets}
            </span>
          </td>
          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-center hidden sm:table-cell">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAccuracyColor(accuracy)}`}>
              {accuracy.toFixed(1)}%
            </span>
          </td>
        </tr>
        {selectedRound === 'all' && expandedRows.has(userStat.user_id) && (userStat.rounds_won > 0 || userStat.rounds_tied > 0) && (
          <tr className="bg-secondary/10 border-l-4 border-secondary/20">
            <td colSpan={selectedRound === 'all' ? 7 : 6} className="px-4 sm:px-6 py-4">
              <div className="flex flex-col space-y-3">
                <div className="flex items-center space-x-2">
                  <Crown className="w-5 h-5 text-secondary-foreground" />
                  <span className="font-semibold text-secondary-foreground">
                    Melhores Rodadas de {userStat.user.name}:
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                  {userStat.round_results?.map((result) => (
                    <div
                      key={result.round}
                      className={`flex items-center justify-center rounded-lg px-3 py-2 transition-colors cursor-pointer ${
                        result.type === 'win' ? 'bg-green-500/20 hover:bg-green-500/30' : 'bg-yellow-500/20 hover:bg-yellow-500/30'
                      }`}
                      title={result.type === 'win' ? `Vitória na Rodada ${result.round}` : `Empate na Rodada ${result.round}`}
                    >
                      <span className={`text-sm font-medium ${
                        result.type === 'win' ? 'text-green-800 dark:text-green-300' : 'text-yellow-800 dark:text-warning'
                      }`}>
                        R{result.round} ({result.type === 'win' ? 'V' : 'E'})
                      </span>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-secondary-foreground flex items-center space-x-1">
                  <Info className="w-4 h-4" />
                  <span>
                    Total: {userStat.rounds_won} {userStat.rounds_won !== 1 ? 'vitórias' : 'vitória'} e {userStat.rounds_tied} {userStat.rounds_tied !== 1 ? 'empates' : 'empate'}
                  </span>
                </div>
              </div>
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  });

  return (
    <div className="bg-card rounded-xl shadow-lg mb-12">
      {/* Header */}
      <div className={`bg-primary px-4 md:px-6 py-3 rounded-t-xl ${isMobile ? 'sticky top-0 z-10' : ''}`}>
        <div className="flex flex-col space-y-4">
          <h2 className="text-lg md:text-2xl font-bold text-primary-foreground flex items-center space-x-2">
            <Trophy className="w-5 h-5 md:w-6 md:h-6" />
            <span>Ranking de Jogadores</span>
          </h2>

          <div className="flex flex-col space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary-foreground/70" />
              <input
                type="text"
                placeholder="Buscar jogador..."
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-primary-foreground/20 backdrop-blur-sm border border-primary-foreground/30 rounded-lg text-primary-foreground placeholder-primary-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary-foreground/50 focus:bg-primary-foreground/25 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowTopOnly(!showTopOnly)}
                className={`flex items-center justify-center space-x-2 px-4 py-2 text-sm rounded-lg transition-all ${
                  showTopOnly
                    ? 'bg-primary-foreground/30 text-primary-foreground shadow-md'
                    : 'bg-primary-foreground/10 text-primary-foreground/80 hover:bg-primary-foreground/20'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>Top 10</span>
              </button>

              <div className="flex-grow sm:flex-grow-0">
                <RoundSelector
                  selectedRound={selectedRound}
                  onRoundChange={onRoundChange}
                  totalRounds={totalRounds}
                  variant="onGradient"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="px-4 md:px-6 py-3 bg-muted border-b border-border">
        <p className="text-sm text-muted-foreground">
          Mostrando {filteredRanking.length} de {ranking.length} jogadores
          {searchTerm && ` para "${searchTerm}"`}
          {showTopOnly && ' (Top 10)'}
        </p>
      </div>

      {/* Podium */}
      {podiumData && (
        <div className="bg-gradient-to-br from-muted to-background px-4 py-6 sm:px-6">
          <div className="flex justify-center items-end space-x-4 sm:space-x-8">
            {podiumData.map((positionData) => {
              const { players, type, label, medalClass } = positionData;
              if (players.length === 0) {
                return (
                  <div key={label} className="flex flex-col items-center opacity-50">
                    {type === 'center' ? (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-muted rounded-full flex items-center justify-center mb-3 shadow-xl border border-dashed border-border">
                        <span className="text-xl sm:text-2xl font-bold text-muted-foreground">-</span>
                      </div>
                    ) : (
                      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-muted rounded-full flex items-center justify-center mb-2 shadow-lg border border-dashed border-border">
                        <span className="text-base sm:text-lg font-bold text-muted-foreground">-</span>
                      </div>
                    )}
                    <div className="text-center">
                      <p className="font-semibold text-xs sm:text-sm text-muted-foreground">Sem Jogador</p>
                      <p className="text-xs text-muted-foreground">0 pts</p>
                    </div>
                    <div className={`w-10 h-6 sm:w-12 sm:h-8 ${type === 'center' ? 'w-12 h-8 sm:w-16 sm:h-10' : ''} bg-muted rounded-t-lg mt-2 flex items-center justify-center border border-dashed border-border`}>
                      <span className="text-muted-foreground font-bold text-xs sm:text-sm">{label}</span>
                    </div>
                  </div>
                );
              }

              if (players.length === 1) {
                const player = players[0];
                let medalSizeClass, textSizeClass, baseSizeClass;
                if (type === 'center') {
                  medalSizeClass = "w-20 h-20 sm:w-24 sm:h-24";
                  textSizeClass = "text-xl sm:text-2xl";
                  baseSizeClass = "w-12 h-8 sm:w-16 sm:h-10 mt-3";
                } else {
                  medalSizeClass = "w-14 h-14 sm:w-16 sm:h-16";
                  textSizeClass = "text-base sm:text-lg";
                  baseSizeClass = "w-10 h-6 sm:w-12 sm:h-8 mt-2";
                }

                return (
                  <div key={`${label}-${player.user_id}`} className="flex flex-col items-center">
                    <div className={`${medalClass} ${medalSizeClass} rounded-full flex items-center justify-center shadow-lg relative mb-2 sm:mb-3`}>
                      <span className={`font-bold text-black ${textSizeClass}`}>
                        {player.user.name.charAt(0).toUpperCase()}
                      </span>
                      {type === 'center' && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-300 rounded-full flex items-center justify-center">
                          <Crown className="w-4 h-4 text-yellow-600" />
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <p className={`font-${type === 'center' ? 'bold' : 'semibold'} text-xs sm:text-sm text-foreground truncate max-w-[80px] sm:max-w-[100px]`}>
                        {player.user.name}
                      </p>
                      <p className={`text-xs ${type === 'center' ? 'text-sm' : 'text-xs'} text-muted-foreground`}>
                        {player.total_points} pts
                      </p>
                    </div>
                    <div className={`${medalClass} ${baseSizeClass} rounded-t-lg flex items-center justify-center`}>
                      <span className="text-black font-bold text-xs sm:text-sm">
                        {label}
                      </span>
                    </div>
                  </div>
                );
              } else {
                // Multiple players tied
                let medalSizeClass, textSizeClass, baseSizeClass, badgeSizeClass;
                if (type === 'center') {
                  medalSizeClass = "w-16 h-16 sm:w-20 sm:h-20";
                  textSizeClass = "text-lg sm:text-xl";
                  baseSizeClass = "w-12 h-8 sm:w-16 sm:h-10 mt-3";
                  badgeSizeClass = "w-6 h-6 -top-2 -right-2";
                } else {
                  medalSizeClass = "w-12 h-12 sm:w-14 sm:h-14";
                  textSizeClass = "text-base sm:text-lg";
                  baseSizeClass = "w-10 h-6 sm:w-12 sm:h-8 mt-2";
                  badgeSizeClass = "w-5 h-5 -top-1.5 -right-1.5";
                }

                return (
                  <div key={label} className="flex flex-col items-center">
                    <div className={`${medalClass} ${medalSizeClass} bg-muted rounded-full flex items-center justify-center border-2 border-border relative mb-2 sm:mb-3`}>
                      <span className={`font-bold text-muted-foreground ${textSizeClass}`}>
                        {players.length}
                      </span>
                      <div className={`absolute ${badgeSizeClass} bg-muted rounded-full flex items-center justify-center border-2 border-border`}>
                        <Star className="w-3 h-3 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className={`font-semibold text-xs sm:text-sm text-foreground truncate max-w-[80px] sm:max-w-[100px]`}>
                        {players.length} Empatados
                      </p>
                      <p className={`text-xs ${type === 'center' ? 'text-sm' : 'text-xs'} text-muted-foreground`}>
                        {players[0].total_points} pts
                      </p>
                    </div>
                    <div className={`${medalClass} ${baseSizeClass} rounded-t-lg flex items-center justify-center border-t-2 border-l-2 border-r-2 border-border`}>
                      <span className="text-muted-foreground font-bold text-xs sm:text-sm">
                        {label}
                      </span>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="overflow-x-auto min-h-[400px]">
        {isMobile ? (
          <div className="divide-y divide-border">
            {filteredRanking.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                Nenhum jogador encontrado.
              </div>
            ) : (
              filteredRanking.map((userStat) => (
                <MobileCompactRow key={userStat.user_id} userStat={userStat} />
              ))
            )}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th
                  scope="col"
                  className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Posição
                </th>
                <th
                  scope="col"
                  className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Jogador
                </th>
                <th
                  scope="col"
                  className="px-4 sm:px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  <div className="flex items-center justify-center space-x-1">
                    <Trophy className="w-4 h-4" />
                    <span>Pontos</span>
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-4 sm:px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  <div className="flex items-center justify-center space-x-1">
                    <Target className="w-4 h-4" />
                    <span>Exatos</span>
                  </div>
                </th>
                {selectedRound === 'all' && (
                  <th
                    scope="col"
                    className="px-4 sm:px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell"
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <Crown className="w-4 h-4" />
                      <span>Rodadas</span>
                    </div>
                  </th>
                )}
                <th
                  scope="col"
                  className="px-4 sm:px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell"
                >
                  <div className="flex items-center justify-center space-x-1">
                    <BarChart3 className="w-4 h-4" />
                    <span>Apostas</span>
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-4 sm:px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell"
                >
                  <div className="flex items-center justify-center space-x-1">
                    <TrendingUp className="w-4 h-4" />
                    <span>Precisão</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {filteredRanking.length === 0 ? (
                <tr>
                  <td colSpan={selectedRound === 'all' ? 7 : 6} className="px-4 sm:px-6 py-8 text-center text-muted-foreground">
                    Nenhum jogador encontrado.
                  </td>
                </tr>
              ) : (
                filteredRanking.map((userStat) => (
                  <DesktopRow key={userStat.user_id} userStat={userStat} />
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
