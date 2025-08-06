import React, { useLayoutEffect } from 'react';
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

  // Filter data based on search and top filter
  const filteredRanking = ranking.filter(user => {
    const matchesSearch = user.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = !showTopOnly || ranking.indexOf(user) < 10;
    return matchesSearch && matchesFilter;
  });

  // --- Sort and assign ranks with ties, matching backend logic ---
  const sortedRanking = [...filteredRanking].sort((a, b) => {
    if (b.total_points !== a.total_points) return b.total_points - a.total_points;
    if (b.exact_scores !== a.exact_scores) return b.exact_scores - a.exact_scores;
    return a.user.name.localeCompare(b.user.name);
  });

  let rank = 1;
  for (let i = 0; i < sortedRanking.length; i++) {
    if (i > 0) {
      const prev = sortedRanking[i - 1];
      const curr = sortedRanking[i];
      if (curr.total_points !== prev.total_points || curr.exact_scores !== prev.exact_scores) {
        rank++;
      }
    }
    sortedRanking[i].rank = rank;
  }

  // --- Update getMedalIcon to use rank ---
  const getMedalIcon = (rank: number) => {
    const allPlayersHaveZeroPoints = sortedRanking.length > 0 && sortedRanking.every(player => player.total_points === 0);

    if (allPlayersHaveZeroPoints) {
      return (
        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center border-2 border-border">
          <span className="text-sm font-bold text-muted-foreground">{rank}</span>
        </div>
      );
    }

    const goldPlayers = sortedRanking.filter(p => p.rank === 1);
    const silverRank = goldPlayers.length + 1;
    const silverPlayers = sortedRanking.filter(p => p.rank === silverRank);
    const bronzeRank = silverPlayers.length + silverRank;

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
  };

  const getRowClass = (userId: string, position: number) => {
    const isCurrentUser = userId === currentUserId;
    const isTopThree = position <= 3;

    if (isCurrentUser) {
      return 'bg-primary/10 border-l-4 border-primary shadow-sm';
    }

    if (isTopThree) {
      return 'bg-yellow-400/10 hover:bg-yellow-400/20 transition-all duration-200';
    }

    return 'bg-card hover:bg-muted transition-all duration-200';
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 70) return 'text-success bg-success/10';
    if (accuracy >= 50) return 'text-warning bg-warning/10';
    return 'text-destructive bg-destructive/10';
  };

  const getPositionBadge = (position: number) => {
    if (position === 1) return 'bg-yellow-400 text-black';
    if (position === 2) return 'bg-gray-400 text-black';
    if (position === 3) return 'bg-yellow-600 text-black';
    return 'bg-muted text-muted-foreground';
  };

  // Compact Mobile Row Component
  const MobileCompactRow = ({ userStat, position }: { userStat: UserStats, position: number }) => {
    const accuracy = userStat.total_bets > 0
      ? ((userStat.correct_results / userStat.total_bets) * 100)
      : 0;

    return (
      <div className={`border-b border-border transition-all duration-200 ${getRowClass(userStat.user_id, position)}`}>
        <div className="px-4 py-3">
          {/* Main Row */}
          <div className="flex items-center justify-between">
            {/* Left: Position, Avatar, Name */}
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {getMedalIcon(position)}
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

            {/* Right: Points */}
            <div className="flex items-center space-x-1 bg-warning/10 rounded-full px-2 py-1 flex-shrink-0">
              <Trophy className="w-3 h-3 text-warning" />
              <span className="text-sm font-bold text-yellow-800 dark:text-warning">
                {userStat.total_points}
              </span>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-between mt-2 text-xs">
            <div className="flex items-center space-x-4">
              {/* Exact Scores */}
              <div className="flex items-center space-x-1">
                <Target className="w-3 h-3 text-success" />
                <span className="text-muted-foreground">{userStat.exact_scores}</span>
              </div>

              {/* Rounds Won - Mobile - Apenas visível em 'todas as rodadas' */}
              {selectedRound === 'all' && (
                <div className="flex items-center space-x-1">
                  <Crown className="w-3 h-3 text-secondary-foreground" />
                  <span className="text-muted-foreground">{userStat.rounds_won || 0}</span>
                  <span className="text-muted-foreground">/ {userStat.rounds_tied || 0}</span>
                </div>
              )}

              {/* Accuracy */}
              <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${getAccuracyColor(accuracy)}`}>
                {accuracy.toFixed(0)}%
              </div>
            </div>

            {/* Expand Button - Mobile - Apenas visível e funcional em 'todas as rodadas' */}
            {selectedRound === 'all' && userStat.rounds_won > 0 && (
              <button
                onClick={() => toggleRowExpansion(userStat.user_id)}
                className="flex items-center space-x-1 text-secondary-foreground hover:text-secondary-foreground/80 transition-colors p-1"
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

          {/* Expanded Details - Mobile - Apenas visível em 'todas as rodadas' */}
          {selectedRound === 'all' && expandedRows.has(userStat.user_id) && (userStat.rounds_won > 0 || userStat.rounds_tied > 0) && (
            <div className="mt-3 p-3 bg-secondary/10 rounded-lg">
              <div className="text-xs font-medium text-secondary-foreground mb-2">
                Melhores Rodadas:
              </div>
              <div className="grid grid-cols-6 gap-1">
                {userStat.round_results &&
                  userStat.round_results.slice(0, 12).map((result) => (
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
  };

  // Desktop Table Row Component
  const DesktopRow = ({ userStat, position }: { userStat: UserStats, position: number }) => {
    const accuracy = userStat.total_bets > 0
      ? ((userStat.correct_results / userStat.total_bets) * 100)
      : 0;

    return (
      <React.Fragment key={userStat.user_id}>
        <tr className={`border dark:border-border transition-all duration-200 ${getRowClass(userStat.user_id, position)}`}>
          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
            <div className="flex items-center">
              {getMedalIcon(position)}
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
          {/* Rodadas Vencidas - Desktop - Apenas visível em 'todas as rodadas' */}
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
        {/* Expanded Details Row - Desktop - Apenas visível em 'todas as rodadas' */}
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
                  {userStat.round_results &&
                    userStat.round_results.map((result) => (
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
  };

  // Calculate podium positions before return
  let podiumPositions: {
    medal: 'gold' | 'silver' | 'bronze',
    players: UserStats[],
    medalClass: string
  }[] = [];

  if (!isMobile && sortedRanking.length >= 1 && !sortedRanking.every(player => player.total_points === 0)) {
    const goldPlayers = sortedRanking.filter(p => p.rank === 1);
    const silverRank = goldPlayers.length > 0 ? goldPlayers[goldPlayers.length - 1].rank + 1 : 2;
    const silverPlayers = sortedRanking.filter(p => p.rank === silverRank);
    const bronzeRank = silverPlayers.length > 0 ? silverPlayers[silverPlayers.length - 1].rank + 1 : silverRank + 1;
    const bronzePlayers = sortedRanking.filter(p => p.rank === bronzeRank);

    podiumPositions = [
      {
        medal: 'gold',
        players: goldPlayers,
        medalClass: 'bg-yellow-400'
      },
      {
        medal: 'silver',
        players: silverPlayers,
        medalClass: 'bg-gray-400'
      },
      {
        medal: 'bronze',
        players: bronzePlayers,
        medalClass: 'bg-yellow-600'
      }
    ];
  }

  return (
    <div className="bg-card rounded-xl shadow-lg">
      {/* Header */}
      <div className={`bg-primary px-4 md:px-6 py-4 ${isMobile ? 'sticky top-0 z-10' : ''}`}>
        <div className="flex flex-col space-y-4">
          <h2 className="text-xl md:text-2xl font-bold text-primary-foreground flex items-center space-x-2">
            <Trophy className="w-5 h-5 md:w-6 md:h-6" />
            <span>Ranking de Jogadores</span>
          </h2>

          {/* Controls - Stacked on mobile for better responsiveness */}
          <div className="flex flex-col space-y-3">
            {/* Search Bar - Full width on mobile */}
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

            {/* Filter and Round Selector - Side by side */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Top 10 Filter */}
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

              {/* Round Selector - More space on mobile */}
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

              {/* Top 3 Podium - Desktop only */}
      {sortedRanking.length >= 1 && !isMobile && !sortedRanking.every(p => p.total_points === 0) && (
        <div className="bg-gradient-to-br from-muted to-background px-4 py-6 sm:px-6">
          {sortedRanking.every(player => player.total_points === 0) ? (
            // All zero points: neutral podium - show first 3 players
            <div className="flex justify-center items-end space-x-4 sm:space-x-8">
              {/* 2nd Place (Left) */}
              {sortedRanking[1] && (
                <div key={sortedRanking[1].user_id} className="flex flex-col items-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-muted rounded-full flex items-center justify-center mb-2 shadow-lg">
                    <span className="text-base sm:text-lg font-bold text-muted-foreground">
                      {sortedRanking[1].user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-xs sm:text-sm text-foreground truncate max-w-[80px]">{sortedRanking[1].user.name}</p>
                    <p className="text-xs text-muted-foreground">{sortedRanking[1].total_points} pts</p>
                  </div>
                  <div className="w-10 h-6 sm:w-12 sm:h-8 bg-muted rounded-t-lg mt-2 flex items-center justify-center">
                    <span className="text-muted-foreground font-bold text-xs sm:text-sm">{sortedRanking[1].rank}°</span>
                  </div>
                </div>
              )}
              {/* 1st Place (Center, Larger) */}
              {sortedRanking[0] && (
                <div key={sortedRanking[0].user_id} className="flex flex-col items-center">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-muted rounded-full flex items-center justify-center mb-3 shadow-xl border-2 border-border">
                    <span className="text-xl sm:text-2xl font-bold text-muted-foreground">
                      {sortedRanking[0].user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-base sm:text-lg text-foreground truncate max-w-[100px]">{sortedRanking[0].user.name}</p>
                    <p className="text-sm text-muted-foreground">{sortedRanking[0].total_points} pts</p>
                  </div>
                  <div className="w-12 h-8 sm:w-16 sm:h-10 bg-muted rounded-t-lg mt-3 flex items-center justify-center border border-border">
                    <span className="text-muted-foreground font-bold text-sm sm:text-base">{sortedRanking[0].rank}°</span>
                  </div>
                </div>
              )}
              {/* 3rd Place (Right) */}
              {sortedRanking[2] && (
                <div key={sortedRanking[2].user_id} className="flex flex-col items-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-muted rounded-full flex items-center justify-center mb-2 shadow-lg">
                    <span className="text-base sm:text-lg font-bold text-muted-foreground">
                      {sortedRanking[2].user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-xs sm:text-sm text-foreground truncate max-w-[80px]">{sortedRanking[2].user.name}</p>
                    <p className="text-xs text-muted-foreground">{sortedRanking[2].total_points} pts</p>
                  </div>
                  <div className="w-10 h-6 sm:w-12 sm:h-8 bg-muted rounded-t-lg mt-2 flex items-center justify-center">
                    <span className="text-muted-foreground font-bold text-xs sm:text-sm">{sortedRanking[2].rank}°</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Podium with medals for medal positions (1st, 2nd, 3rd place)
            <div className="flex justify-center items-end space-x-4 sm:space-x-8">
              {/* --- Calculate Podium Positions --- */}
              {(() => {
                // 1. Get players for Gold (1st place rank)
                const firstRank = sortedRanking.length > 0 ? sortedRanking[0].rank : null; // This should always be 1
                const goldPlayers = sortedRanking.filter(p => p.rank === firstRank);

                // 2. Find the *next* distinct rank for Silver
                let silverRank: number | null = null;
                if (goldPlayers.length > 0 && goldPlayers.length < sortedRanking.length) {
                  // Find the first player whose rank is different from the firstRank
                  const nextPlayer = sortedRanking.find(p => p.rank !== firstRank);
                  if (nextPlayer) {
                    silverRank = nextPlayer.rank; // This is the correct silver rank
                  }
                }
                const silverPlayers = silverRank ? sortedRanking.filter(p => p.rank === silverRank) : [];

                // 3. Find the *next* distinct rank for Bronze (after Silver)
                let bronzeRank: number | null = null;
                if (silverPlayers.length > 0) {
                  // Find the first player whose rank is different from both firstRank and silverRank
                  const nextPlayerAfterSilver = sortedRanking.find(p => p.rank !== firstRank && p.rank !== silverRank);
                  if (nextPlayerAfterSilver) {
                    bronzeRank = nextPlayerAfterSilver.rank; // This is the correct bronze rank
                  }
                }
                const bronzePlayers = bronzeRank ? sortedRanking.filter(p => p.rank === bronzeRank) : [];

                // 4. Create podium structure in the correct visual order: Silver (Left), Gold (Center), Bronze (Right)
                const podiumStructure = (() => {
                // 1. Get players for Gold (1st place rank)
                const firstRank = sortedRanking.length > 0 ? sortedRanking[0].rank : null;
                const goldPlayers = sortedRanking.filter(p => p.rank === firstRank);

                // 2. Find the next distinct rank for Silver (2nd place)
                let silverRank: number | null = null;
                let silverPlayers: UserStats[] = [];

                if (goldPlayers.length > 0) {
                  // Find the first player after gold players
                  const nextPlayer = sortedRanking.find(p => p.rank > firstRank!);
                  if (nextPlayer) {
                    silverRank = nextPlayer.rank;
                    silverPlayers = sortedRanking.filter(p => p.rank === silverRank);
                  }
                }

                // 3. Find the next distinct rank for Bronze (3rd place)
                let bronzeRank: number | null = null;
                let bronzePlayers: UserStats[] = [];

                if (silverPlayers.length > 0) {
                  // Find the first player after silver players
                  const nextPlayer = sortedRanking.find(p => p.rank > silverRank!);
                  if (nextPlayer) {
                    bronzeRank = nextPlayer.rank;
                    bronzePlayers = sortedRanking.filter(p => p.rank === bronzeRank);
                  }
                }

                // Return in visual order: Silver (Left), Gold (Center), Bronze (Right)
                return [
                  { players: silverPlayers, type: 'left', label: '2º', medalClass: "bg-gray-400" },
                  { players: goldPlayers, type: 'center', label: '1º', medalClass: "bg-yellow-400" },
                  { players: bronzePlayers, type: 'right', label: '3º', medalClass: "bg-yellow-600" }
                ];
              })();

                return (
                  <>
                    {podiumStructure.map((positionData) => {
                      const { players, type, label } = positionData;
                      if (players.length === 0) {
                        // Render empty placeholder if no players for this position
                        return (
                          <div key={label} className="flex flex-col items-center opacity-50">
                            {type === 'center' ? (
                              // Placeholder for 1st Place (Larger)
                              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-muted rounded-full flex items-center justify-center mb-3 shadow-xl border border-dashed border-border">
                                <span className="text-xl sm:text-2xl font-bold text-muted-foreground">-</span>
                              </div>
                            ) : (
                              // Placeholder for 2nd/3rd Place (Smaller)
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
                        // Single player in this position
                        const player = players[0];
                        let medalClass, medalSizeClass, textSizeClass;
                        if (type === 'center') { // 1st Place
                          medalClass = "bg-yellow-400";
                          medalSizeClass = "w-20 h-20 sm:w-24 sm:h-24";
                          textSizeClass = "text-xl sm:text-2xl";
                        } else if (type === 'left') { // 2nd Place
                          medalClass = "bg-gray-400";
                          medalSizeClass = "w-14 h-14 sm:w-16 sm:h-16";
                          textSizeClass = "text-base sm:text-lg";
                        } else { // 3rd Place
                          medalClass = "bg-yellow-600";
                          medalSizeClass = "w-14 h-14 sm:w-16 sm:h-16";
                          textSizeClass = "text-base sm:text-lg";
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
                            <div className={`${medalClass} ${type === 'center' ? 'w-12 h-8 sm:w-16 sm:h-10 mt-3' : 'w-10 h-6 sm:w-12 sm:h-8 mt-2'} rounded-t-lg flex items-center justify-center`}>
                              <span className="text-black font-bold text-xs sm:text-sm">
                                {label}
                              </span>
                            </div>
                          </div>
                        );
                      } else {
                        // Multiple players tied in this position
                        // Display stacked avatars for ties
                        let medalClass, medalSizeClass, textSizeClass, baseSizeClass;
                        if (type === 'center') { // 1st Place
                          medalClass = "bg-yellow-400";
                          medalSizeClass = "w-16 h-16 sm:w-20 sm:h-20";
                          textSizeClass = "text-lg sm:text-xl";
                          baseSizeClass = "w-12 h-8 sm:w-16 sm:h-10";
                        } else if (type === 'left') { // 2nd Place
                          medalClass = "bg-gray-400";
                          medalSizeClass = "w-14 h-14 sm:w-16 sm:h-16";
                          textSizeClass = "text-base sm:text-lg";
                          baseSizeClass = "w-10 h-6 sm:w-12 sm:h-8";
                        } else { // 3rd Place
                          medalClass = "bg-yellow-600";
                          medalSizeClass = "w-14 h-14 sm:w-16 sm:h-16";
                          textSizeClass = "text-base sm:text-lg";
                          baseSizeClass = "w-10 h-6 sm:w-12 sm:h-8";
                        }

                        return (
                          <div key={`${label}-tie`} className="flex flex-col items-center space-y-2">
                            <div className="relative">
                              {players.slice(0, 3).map((player, playerIndex) => (
                                <div
                                  key={player.user_id}
                                  className={`${medalClass} ${medalSizeClass} rounded-full flex items-center justify-center shadow-lg border-2 border-card`}
                                  style={{
                                    position: playerIndex === 0 ? 'relative' : 'absolute',
                                    left: playerIndex === 0 ? 0 : `${playerIndex * 12}px`,
                                    top: playerIndex === 0 ? 0 : `${playerIndex * -8}px`,
                                    zIndex: 10 - playerIndex
                                  }}
                                  title={player.user.name}
                                >
                                  <span className={`font-bold text-black ${textSizeClass}`}>
                                    {player.user.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              ))}
                              {type === 'center' && (
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-300 rounded-full flex items-center justify-center z-20">
                                  <Crown className="w-4 h-4 text-yellow-600" />
                                </div>
                              )}
                              {players.length > 3 && (
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-muted rounded-full flex items-center justify-center text-xs text-muted-foreground font-bold z-20">
                                  +{players.length - 3}
                                </div>
                              )}
                            </div>
                            <div className="text-center">
                              <p className={`font-${type === 'center' ? 'bold' : 'semibold'} text-xs sm:text-sm text-foreground`}>
                                {players.length} empat{players.length > 1 ? 'ados' : 'ado'}
                              </p>
                              <p className={`text-xs ${type === 'center' ? 'text-sm' : 'text-xs'} text-muted-foreground`}>
                                {players[0].total_points} pts
                              </p>
                            </div>
                            <div className={`${medalClass} ${baseSizeClass} rounded-t-lg flex items-center justify-center`}>
                              <span className="text-black font-bold text-xs sm:text-sm">
                                {label}
                              </span>
                            </div>
                          </div>
                        );
                      }
                    })}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Mobile View - Compact List */}
      {isMobile ? (
        <div className="divide-y divide-border">
          {sortedRanking.map((userStat) => (
            <MobileCompactRow
              key={userStat.user_id}
              userStat={userStat}
              position={userStat.rank}
            />
          ))}
        </div>
      ) : (
        /* Desktop View */
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Posição
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Jogador
                </th>
                <th className="px-4 sm:px-6 py-4 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Pontos
                </th>
                <th className="px-4 sm:px-6 py-4 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Placares Exatos
                </th>
                {selectedRound === 'all' && (
                  <th className="px-4 sm:px-6 py-4 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                    Vitórias / Empates
                  </th>
                )}
                <th className="px-4 sm:px-6 py-4 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                  Apostas
                </th>
                <th className="px-4 sm:px-6 py-4 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                  Aproveitamento
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedRanking.map((userStat) => (
                <DesktopRow
                  key={userStat.user_id}
                  userStat={userStat}
                  position={userStat.rank}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {filteredRanking.length === 0 && (
        <div className="text-center py-16 px-4">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Nenhum ranking disponível
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Faça suas apostas para aparecer no ranking e competir com outros jogadores!
          </p>
        </div>
      )}

      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }

          .animate-pulse {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
        `}
      </style>
    </div>
  );
};
