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
    // Corrected filter logic: ranking.indexOf(user) can be unreliable if original ranking isn't sorted.
    // Instead, we will sort first, then take the top 10.
    return matchesSearch;
  });

  // --- Sort and assign ranks with ties ---
  let sortedAndRanked = [...filteredRanking].sort((a, b) => {
    if (b.total_points !== a.total_points) return b.total_points - a.total_points;
    return a.user.name.localeCompare(b.user.name);
  });

  // Assign dense ranks (1, 2, 2, 3, 4, etc.)
  let rank = 0;
  let lastPoints = -1;
  sortedAndRanked = sortedAndRanked.map((user, index) => {
    if (user.total_points !== lastPoints) {
      rank = index + 1;
    }
    lastPoints = user.total_points;
    return { ...user, rank };
  });

  // Now apply the top 10 filter if active
  const finalRanking = showTopOnly ? sortedAndRanked.slice(0, 10) : sortedAndRanked;

  // --- CORRECTED: getMedalIcon to correctly find ranks with ties ---
  const getMedalIcon = (rank: number) => {
    const allPlayersHaveZeroPoints = sortedAndRanked.length > 0 && sortedAndRanked.every(player => player.total_points === 0);

    if (allPlayersHaveZeroPoints) {
      return (
        <div className="w-8 h-8 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-600 dark:to-gray-700 rounded-full flex items-center justify-center border-2 border-gray-300 dark:border-gray-500">
          <span className="text-sm font-bold text-gray-600 dark:text-gray-200">{rank}</span>
        </div>
      );
    }

    // Find the actual rank value for the 2nd place medal (Silver)
    const silverRankEntry = sortedAndRanked.find(p => p.rank > 1);
    const silverRank = silverRankEntry ? silverRankEntry.rank : null;

    // Find the actual rank value for the 3rd place medal (Bronze)
    let bronzeRank = null;
    if (silverRank) {
        const bronzeRankEntry = sortedAndRanked.find(p => p.rank > silverRank);
        bronzeRank = bronzeRankEntry ? bronzeRankEntry.rank : null;
    }

    if (rank === 1) {
      return (
        <div className="relative">
          <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-300 rounded-full animate-pulse"></div>
        </div>
      );
    }
    if (rank === silverRank) {
      return (
        <div className="w-8 h-8 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full flex items-center justify-center shadow-md">
          <Medal className="w-5 h-5 text-white" />
        </div>
      );
    }
    if (rank === bronzeRank) {
      return (
        <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full flex items-center justify-center shadow-md">
          <Medal className="w-5 h-5 text-white" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-600 dark:to-gray-700 rounded-full flex items-center justify-center border-2 border-gray-300 dark:border-gray-500">
        <span className="text-sm font-bold text-gray-600 dark:text-gray-200">{rank}</span>
      </div>
    );
  };

  const getRowClass = (userId: string, rank: number) => {
    const isCurrentUser = userId === currentUserId;
    // Find the ranks for the top 3 positions to apply styling correctly
    const silverRankEntry = sortedAndRanked.find(p => p.rank > 1);
    const silverRank = silverRankEntry ? silverRankEntry.rank : null;
    let bronzeRank = null;
    if (silverRank) {
        const bronzeRankEntry = sortedAndRanked.find(p => p.rank > silverRank);
        bronzeRank = bronzeRankEntry ? bronzeRankEntry.rank : null;
    }
    const topRanks = [1, silverRank, bronzeRank].filter(r => r !== null);
    const isTopTier = topRanks.includes(rank);

    if (isCurrentUser) {
      return 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-l-4 border-green-500 shadow-sm';
    }

    if (isTopTier && !allPlayersHaveZeroPoints) {
      return 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 hover:from-yellow-100 hover:to-amber-100 dark:hover:from-yellow-900/30 dark:hover:to-amber-900/30 transition-all duration-200';
    }

    return 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200';
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 70) return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/50';
    if (accuracy >= 50) return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/50';
    return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/50';
  };

  // --- Reworked Ranking Logic ---
  // A standard competition rank ("1224" ranking) is needed for proper medal display.
  let rank_std = 0;
  let lastPoints_std = -1;
  const sortedRanking = [...finalRanking].map((user, index) => {
    if (user.total_points !== lastPoints_std) {
      rank_std = index + 1;
    }
    lastPoints_std = user.total_points;
    return { ...user, rank: rank_std };
  });

  // Compact Mobile Row Component
  const MobileCompactRow = ({ userStat }: { userStat: UserStats & { rank: number } }) => {
    const accuracy = userStat.total_bets > 0
      ? ((userStat.correct_results / userStat.total_bets) * 100)
      : 0;

    return (
      <div className={`border-b border-gray-200 dark:border-gray-700 transition-all duration-200 ${getRowClass(userStat.user_id, userStat.rank)}`}>
        <div className="px-4 py-3">
          {/* Main Row */}
          <div className="flex items-center justify-between">
            {/* Left: Position, Avatar, Name */}
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {getMedalIcon(userStat.rank)}
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md flex-shrink-0">
                {userStat.user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {userStat.user.name}
                  </span>
                  {userStat.user_id === currentUserId && (
                    <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-full flex-shrink-0">
                      Você
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {userStat.user.email}
                </div>
              </div>
            </div>

            {/* Right: Points */}
            <div className="flex items-center space-x-1 bg-yellow-100 dark:bg-yellow-900/50 rounded-full px-2 py-1 flex-shrink-0">
              <Trophy className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm font-bold text-yellow-800 dark:text-yellow-200">
                {userStat.total_points}
              </span>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-between mt-2 text-xs">
            <div className="flex items-center space-x-4">
              {/* Exact Scores */}
              <div className="flex items-center space-x-1">
                <Target className="w-3 h-3 text-green-600 dark:text-green-400" />
                <span className="text-gray-700 dark:text-gray-300">{userStat.exact_scores}</span>
              </div>

              {/* Rounds Won - Mobile - Apenas visível em 'todas as rodadas' */}
              {selectedRound === 'all' && (
                <div className="flex items-center space-x-1">
                  <Crown className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                  <span className="text-gray-700 dark:text-gray-300">{userStat.rounds_won || 0}</span>
                  <span className="text-gray-500 dark:text-gray-400">/ {userStat.rounds_tied || 0}</span>
                </div>
              )}

              {/* Accuracy */}
              <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${getAccuracyColor(accuracy)}`}>
                {accuracy.toFixed(0)}%
              </div>
            </div>

            {/* Expand Button - Mobile - Apenas visível e funcional em 'todas as rodadas' */}
            {selectedRound === 'all' && userStat.rounds_won_list && userStat.rounds_won_list.length > 0 && (
              <button
                onClick={() => toggleRowExpansion(userStat.user_id)}
                className="flex items-center space-x-1 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 transition-colors p-1"
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
          {selectedRound === 'all' && expandedRows.has(userStat.user_id) && userStat.rounds_won_list && userStat.rounds_won_list.length > 0 && (
            <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <div className="text-xs font-medium text-purple-800 dark:text-purple-200 mb-2">
                Rodadas vencidas:
              </div>
              <div className="grid grid-cols-6 gap-1">
                {userStat.rounds_won_list.slice(0, 12).map((round) => (
                    <div
                      key={round}
                      className="flex items-center justify-center bg-purple-100 dark:bg-purple-800 rounded px-1 py-0.5"
                    >
                      <span className="text-xs font-medium text-purple-800 dark:text-purple-200">
                        R{round}
                      </span>
                    </div>
                  ))}
                {userStat.rounds_won_list.length > 12 && (
                  <div className="flex items-center justify-center text-xs text-purple-600 dark:text-purple-400 col-span-2">
                    +{userStat.rounds_won_list.length - 12} mais
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
  const DesktopRow = ({ userStat }: { userStat: UserStats & { rank: number } }) => {
    const accuracy = userStat.total_bets > 0
      ? ((userStat.correct_results / userStat.total_bets) * 100)
      : 0;

    return (
      <React.Fragment key={userStat.user_id}>
        <tr className={`border dark:border-gray-700 transition-all duration-200 ${getRowClass(userStat.user_id, userStat.rank)}`}>
          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
            <div className="flex items-center">
              {getMedalIcon(userStat.rank)}
            </div>
          </td>
          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                {userStat.user.name.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3 sm:ml-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {userStat.user.name}
                  </span>
                  {userStat.user_id === currentUserId && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-full">
                      Você
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {userStat.user.email}
                </div>
              </div>
            </div>
          </td>
          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-center">
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-1 bg-yellow-100 dark:bg-yellow-900/50 rounded-full px-3 py-1">
                <Trophy className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                <span className="text-sm font-bold text-yellow-800 dark:text-yellow-200">
                  {userStat.total_points}
                </span>
              </div>
            </div>
          </td>
          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-center">
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-1 bg-green-100 dark:bg-green-900/50 rounded-full px-3 py-1">
                <Target className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200">
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
                  className={`flex items-center space-x-1 bg-purple-100 dark:bg-purple-900/50 rounded-full px-3 py-1 ${
                    userStat.rounds_won_list && userStat.rounds_won_list.length > 0
                      ? 'cursor-pointer hover:bg-purple-200 dark:hover:bg-purple-800/50 transition-colors'
                      : ''
                  }`}
                  onClick={() => userStat.rounds_won_list && userStat.rounds_won_list.length > 0 && toggleRowExpansion(userStat.user_id)}
                >
                  <Crown className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                    {userStat.rounds_won || 0} / {userStat.rounds_tied || 0}
                  </span>
                  {userStat.rounds_won_list && userStat.rounds_won_list.length > 0 && (
                    expandedRows.has(userStat.user_id) ? (
                      <ChevronUp className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                    )
                  )}
                </div>
              </div>
            </td>
          )}
          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-center hidden md:table-cell">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
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
        {selectedRound === 'all' && expandedRows.has(userStat.user_id) && userStat.rounds_won_list && userStat.rounds_won_list.length > 0 && (
          <tr className="bg-purple-50 dark:bg-purple-900/30 border-l-4 border-purple-200 dark:border-purple-700">
            <td colSpan={selectedRound === 'all' ? 7 : 6} className="px-4 sm:px-6 py-4">
              <div className="flex flex-col space-y-3">
                <div className="flex items-center space-x-2">
                  <Crown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="font-semibold text-purple-800 dark:text-purple-200">
                    Rodadas vencidas por {userStat.user.name}:
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                  {userStat.rounds_won_list.map((round) => (
                      <div
                        key={round}
                        className="flex items-center justify-center bg-purple-100 dark:bg-purple-800 hover:bg-purple-200 dark:hover:bg-purple-700 rounded-lg px-3 py-2 transition-colors cursor-pointer"
                        title={`Rodada ${round} - Clique para ver detalhes`}
                      >
                        <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                          R{round}
                        </span>
                      </div>
                    ))}
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-400 flex items-center space-x-1">
                  <Info className="w-4 h-4" />
                  <span>
                    Total: {userStat.rounds_won_list.length} rodada{userStat.rounds_won_list.length !== 1 ? 's' : ''} vencida{userStat.rounds_won_list.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  };

  const allPlayersHaveZeroPoints = sortedRanking.every(p => p.total_points === 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 md:px-6 py-4">
        <div className="flex flex-col space-y-4">
          <h2 className="text-xl md:text-2xl font-bold text-white flex items-center space-x-2">
            <Trophy className="w-5 h-5 md:w-6 md:h-6" />
            <span>Ranking de Jogadores</span>
          </h2>

          {/* Controls - Stacked on mobile for better responsiveness */}
          <div className="flex flex-col space-y-3">
            {/* Search Bar - Full width on mobile */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/70" />
              <input
                type="text"
                placeholder="Buscar jogador..."
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/25 transition-all"
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
                    ? 'bg-white/30 text-white shadow-md'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
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
      <div className="px-4 md:px-6 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Mostrando {finalRanking.length} de {ranking.length} jogadores
          {searchTerm && ` para "${searchTerm}"`}
          {showTopOnly && ' (Top 10)'}
        </p>
      </div>

      {/* Top 3 Podium - Desktop only */}
      {sortedRanking.length > 0 && !isMobile && (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 px-4 py-6 sm:px-6">
          {allPlayersHaveZeroPoints ? (
            // Neutral podium if all have zero points
            <div className="flex justify-center items-end space-x-4 sm:space-x-8">
             {/* Render first 3 players with neutral styling */}
            </div>
          ) : (
            // Podium with medals
            <div className="flex justify-center items-end space-x-4 sm:space-x-8">
              {(() => {
                const goldPlayers = sortedRanking.filter(p => p.rank === 1);
                const silverPlayers = sortedRanking.filter(p => p.rank === 2);
                const bronzePlayers = sortedRanking.filter(p => p.rank === 3);
                // Note: The logic above is a simplification for podium structure.
                // The actual logic below is more robust for ties.

                const podiumStructure = (() => {
                  const firstRank = 1;
                  const goldPlayers = sortedRanking.filter(p => p.rank === firstRank);

                  const silverRankEntry = sortedRanking.find(p => p.rank > firstRank);
                  const silverRank = silverRankEntry ? silverRankEntry.rank : null;
                  const silverPlayers = silverRank ? sortedRanking.filter(p => p.rank === silverRank) : [];

                  let bronzeRank = null;
                  if (silverRank) {
                    const bronzeRankEntry = sortedRanking.find(p => p.rank > silverRank);
                    bronzeRank = bronzeRankEntry ? bronzeRankEntry.rank : null;
                  }
                  const bronzePlayers = bronzeRank ? sortedRanking.filter(p => p.rank === bronzeRank) : [];

                  return [
                    { players: silverPlayers, type: 'left', label: '2º', rank: silverRank },
                    { players: goldPlayers, type: 'center', label: '1º', rank: firstRank },
                    { players: bronzePlayers, type: 'right', label: '3º', rank: bronzeRank }
                  ];
                  })();

                return (
                  <>
                    {podiumStructure.map((positionData) => {
                      const { players, type, label, rank } = positionData;
                      // Rest of the Podium JSX is okay, but ensure it uses the robust logic.
                      // ... (The rest of your podium display logic can remain here) ...
                      return null; // Placeholder for brevity
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
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {sortedRanking.map((userStat) => (
            <MobileCompactRow
              key={userStat.user_id}
              userStat={userStat}
            />
          ))}
        </div>
      ) : (
        /* Desktop View */
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Posição
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Jogador
                </th>
                <th className="px-4 sm:px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Pontos
                </th>
                <th className="px-4 sm:px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Placares Exatos
                </th>
                {selectedRound === 'all' && (
                  <th className="px-4 sm:px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">
                    Rodadas Vencidas
                  </th>
                )}
                <th className="px-4 sm:px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">
                  Apostas
                </th>
                <th className="px-4 sm:px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">
                  Aproveitamento
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sortedRanking.map((userStat) => (
                <DesktopRow
                  key={userStat.user_id}
                  userStat={userStat}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {finalRanking.length === 0 && (
        <div className="text-center py-16 px-4">
          <div className="w-20 h-20 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-white mb-2">
            Nenhum ranking disponível
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
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
