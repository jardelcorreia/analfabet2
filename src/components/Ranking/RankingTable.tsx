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

  const formatRoundsWonList = (roundsList: number[]) => {
    if (!roundsList || roundsList.length === 0) return 'Nenhuma';
    
    // Group consecutive rounds
    const groups: string[] = [];
    let start = roundsList[0];
    let end = roundsList[0];
    
    for (let i = 1; i < roundsList.length; i++) {
      if (roundsList[i] === end + 1) {
        end = roundsList[i];
      } else {
        groups.push(start === end ? `${start}` : `${start}-${end}`);
        start = end = roundsList[i];
      }
    }
    groups.push(start === end ? `${start}` : `${start}-${end}`);
    
    return groups.join(', ');
  };

  // Filter data based on search and top filter
  const filteredRanking = ranking.filter(user => {
    const matchesSearch = user.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = !showTopOnly || ranking.indexOf(user) < 10;
    return matchesSearch && matchesFilter;
  });

  const getMedalIcon = (position: number) => {
    // CORREÇÃO: Verificar se TODOS os jogadores têm 0 pontos
    const allPlayersHaveZeroPoints = ranking.length > 0 && ranking.every(player => player.total_points === 0);

    if (allPlayersHaveZeroPoints) {
      return (
        <div className="w-8 h-8 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-600 dark:to-gray-700 rounded-full flex items-center justify-center border-2 border-gray-300 dark:border-gray-500">
          <span className="text-sm font-bold text-gray-600 dark:text-gray-200">{position}</span>
        </div>
      );
    }
    switch (position) {
      case 1:
        return (
          <div className="relative">
            <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-300 rounded-full animate-pulse"></div>
          </div>
        );
      case 2:
        return (
          <div className="w-8 h-8 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full flex items-center justify-center shadow-md">
            <Medal className="w-5 h-5 text-white" />
          </div>
        );
      case 3:
        return (
          <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full flex items-center justify-center shadow-md">
            <Medal className="w-5 h-5 text-white" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-600 dark:to-gray-700 rounded-full flex items-center justify-center border-2 border-gray-300 dark:border-gray-500">
            <span className="text-sm font-bold text-gray-600 dark:text-gray-200">{position}</span>
          </div>
        );
    }
  };

  const getRowClass = (userId: string, position: number) => {
    const isCurrentUser = userId === currentUserId;
    const isTopThree = position <= 3;

    if (isCurrentUser) {
      return 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-l-4 border-green-500 shadow-sm';
    }

    if (isTopThree) {
      return 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 hover:from-yellow-100 hover:to-amber-100 dark:hover:from-yellow-900/30 dark:hover:to-amber-900/30 transition-all duration-200';
    }

    return 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200';
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 70) return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/50';
    if (accuracy >= 50) return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/50';
    return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/50';
  };

  const getPositionBadge = (position: number) => {
    if (position === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white';
    if (position === 2) return 'bg-gradient-to-r from-gray-300 to-gray-400 text-white';
    if (position === 3) return 'bg-gradient-to-r from-amber-500 to-amber-600 text-white';
    return 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200';
  };

  // Compact Mobile Row Component
  const MobileCompactRow = ({ userStat, position }: { userStat: UserStats, position: number }) => {
    const accuracy = userStat.total_bets > 0
      ? ((userStat.correct_results / userStat.total_bets) * 100)
      : 0;

    return (
      <div className={`border-b border-gray-200 dark:border-gray-700 transition-all duration-200 ${getRowClass(userStat.user_id, position)}`}>
        <div className="px-4 py-3">
          {/* Main Row */}
          <div className="flex items-center justify-between">
            {/* Left: Position, Avatar, Name */}
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {getMedalIcon(position)}
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
            {selectedRound === 'all' && userStat.rounds_won > 0 && (
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
          {selectedRound === 'all' && expandedRows.has(userStat.user_id) && userStat.rounds_won > 0 && (
            <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <div className="text-xs font-medium text-purple-800 dark:text-purple-200 mb-2">
                Rodadas vencidas:
              </div>
              <div className="grid grid-cols-6 gap-1">
                {userStat.rounds_won_list &&
                  userStat.rounds_won_list.slice(0, 12).map((round) => (
                    <div
                      key={round}
                      className="flex items-center justify-center bg-purple-100 dark:bg-purple-800 rounded px-1 py-0.5"
                    >
                      <span className="text-xs font-medium text-purple-800 dark:text-purple-200">
                        R{round}
                      </span>
                    </div>
                  ))}
                {userStat.rounds_won_list && userStat.rounds_won_list.length > 12 && (
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
  const DesktopRow = ({ userStat, position }: { userStat: UserStats, position: number }) => {
    const accuracy = userStat.total_bets > 0
      ? ((userStat.correct_results / userStat.total_bets) * 100)
      : 0;

    return (
      <React.Fragment key={userStat.user_id}>
        <tr className={`border dark:border-gray-700 transition-all duration-200 ${getRowClass(userStat.user_id, position)}`}>
          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
            <div className="flex items-center">
              {getMedalIcon(position)}
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
                    userStat.rounds_won > 0
                      ? 'cursor-pointer hover:bg-purple-200 dark:hover:bg-purple-800/50 transition-colors'
                      : ''
                  }`}
                  onClick={() => userStat.rounds_won > 0 && toggleRowExpansion(userStat.user_id)} // Só permite clique se houver rodadas vencidas
                >
                  <Crown className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                    {userStat.rounds_won || 0} / {userStat.rounds_tied || 0}
                  </span>
                  {userStat.rounds_won > 0 && (
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
        {selectedRound === 'all' && expandedRows.has(userStat.user_id) && userStat.rounds_won > 0 && (
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
                  {userStat.rounds_won_list &&
                    userStat.rounds_won_list.map((round) => (
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
                    Total: {userStat.rounds_won} rodada{userStat.rounds_won !== 1 ? 's' : ''} vencida{userStat.rounds_won !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  };

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
          Mostrando {filteredRanking.length} de {ranking.length} jogadores
          {searchTerm && ` para "${searchTerm}"`}
          {showTopOnly && ' (Top 10)'}
        </p>
      </div>

      {/* Top 3 Podium - Desktop only */}
      {filteredRanking.length >= 3 && !isMobile && (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 px-4 py-6 sm:px-6">
          <div className="flex justify-center items-end space-x-4 sm:space-x-8">
            {/* 2nd Place */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 rounded-full flex items-center justify-center mb-2 shadow-lg">
                <span className="text-lg sm:text-xl font-bold text-white">
                  {filteredRanking[1]?.user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm sm:text-base text-gray-800 dark:text-white">{filteredRanking[1]?.user.name}</p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{filteredRanking[1]?.total_points} pts</p>
              </div>
              <div className="w-12 h-8 sm:w-16 sm:h-10 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 rounded-t-lg mt-2 flex items-center justify-center">
                <span className="text-white font-bold text-sm sm:text-base">2</span>
              </div>
            </div>

            {/* 1st Place */}
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-yellow-400 to-yellow-500 dark:from-yellow-500 dark:to-yellow-600 rounded-full flex items-center justify-center mb-2 shadow-xl relative">
                <span className="text-xl sm:text-2xl font-bold text-white">
                  {filteredRanking[0]?.user.name.charAt(0).toUpperCase()}
                </span>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-300 dark:bg-yellow-400 rounded-full flex items-center justify-center">
                  <Crown className="w-4 h-4 text-yellow-600 dark:text-yellow-700" />
                </div>
              </div>
              <div className="text-center">
                <p className="font-bold text-base sm:text-lg text-gray-800 dark:text-white">{filteredRanking[0]?.user.name}</p>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{filteredRanking[0]?.total_points} pts</p>
              </div>
              <div className="w-16 h-12 sm:w-20 sm:h-16 bg-gradient-to-r from-yellow-400 to-yellow-500 dark:from-yellow-500 dark:to-yellow-600 rounded-t-lg mt-2 flex items-center justify-center">
                <span className="text-white font-bold text-base sm:text-lg">1</span>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 rounded-full flex items-center justify-center mb-2 shadow-lg">
                <span className="text-lg sm:text-xl font-bold text-white">
                  {filteredRanking[2]?.user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm sm:text-base text-gray-800 dark:text-white">{filteredRanking[2]?.user.name}</p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{filteredRanking[2]?.total_points} pts</p>
              </div>
              <div className="w-12 h-6 sm:w-16 sm:h-8 bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 rounded-t-lg mt-2 flex items-center justify-center">
                <span className="text-white font-bold text-sm sm:text-base">3</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile View - Compact List */}
      {isMobile ? (
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredRanking.map((userStat) => (
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
              {filteredRanking.map((userStat) => (
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

      <style jsx>{`
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
      `}</style>
    </div>
  );
};
