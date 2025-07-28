import React, { useState, useEffect } from 'react';
import { AuthUser } from '../../lib/auth';
import { League } from '../../types';
import { Header } from '../Layout/Header';
import { Navigation } from '../Layout/Navigation';
import { LeagueList } from '../Leagues/LeagueList';
import { LeagueMembers } from '../Leagues/LeagueMembers';
import { MatchList } from '../Matches/MatchList';
import { RankingTable } from '../Ranking/RankingTable';
import { LeagueBets } from '../Bets/LeagueBets';
import { useLeagues } from '../../hooks/useLeagues';
import { useRanking } from '../../hooks/useRanking';
import { useMatches } from '../../hooks/useMatches';

interface DashboardProps {
  user: AuthUser;
  onSignOut: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onSignOut }) => {
  const [activeTab, setActiveTab] = useState('leagues');
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [selectedRound, setSelectedRound] = useState<number | 'all' | undefined>(undefined);
  
  const { leagues, loading: leaguesLoading, createLeague, joinLeague } = useLeagues(user.id);
  const { ranking, loading: rankingLoading, displayedRound: rankingDisplayedRound, refreshRanking } = useRanking(selectedLeague?.id || '', selectedRound);
  const { matches, loading: matchesLoading, error: matchesError, displayedRound: matchesDisplayedRound, refreshMatches } = useMatches(selectedRound);

  useEffect(() => {
    if (activeTab === 'matches' && matchesDisplayedRound !== undefined && selectedRound !== matchesDisplayedRound && selectedRound !== 'all') {
      if (selectedRound === undefined) {
        setSelectedRound(matchesDisplayedRound);
      }
    }
  }, [matchesDisplayedRound, selectedRound, activeTab]);

  useEffect(() => {
    if (activeTab === 'ranking' && rankingDisplayedRound !== undefined && selectedRound !== rankingDisplayedRound && selectedRound !== 'all') {
      if (selectedRound === undefined) {
        setSelectedRound(rankingDisplayedRound);
      }
    }
  }, [rankingDisplayedRound, selectedRound, activeTab]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'matches') {
      refreshMatches();
    }
    if (tab === 'ranking') {
      refreshRanking();
    }
  };

  const handleSelectLeague = (league: League) => {
    setSelectedLeague(league);
    setActiveTab('matches');
  };

  const handleShowLeagueMembers = (league: League) => {
    setSelectedLeague(league);
    setActiveTab('leagueMembers');
  };

  const handleShowLeagueBets = (league: League) => {
    setSelectedLeague(league);
    setActiveTab('leagueBets');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'leagues':
        return (
          <div className="animate-fadeIn">
            <LeagueList
              leagues={leagues}
              onCreateLeague={createLeague}
              onJoinLeague={joinLeague}
              onSelectLeague={handleSelectLeague}
              onShowLeagueMembers={handleShowLeagueMembers}
              onShowLeagueBets={handleShowLeagueBets}
            />
          </div>
        );
      case 'leagueMembers':
        return selectedLeague ? (
          <div className="animate-fadeIn">
            <LeagueMembers league={selectedLeague} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Nenhuma Liga Selecionada</h3>
              <p className="text-gray-500 max-w-sm">Selecione uma liga para ver os membros e suas informações</p>
            </div>
          </div>
        );
      case 'matches':
        return selectedLeague ? (
          <div className="animate-fadeIn">
            <MatchList
              league={selectedLeague}
              userId={user.id}
              matches={matches}
              loading={matchesLoading}
              error={matchesError}
              displayedRound={matchesDisplayedRound}
              selectedRound={selectedRound}
              onRoundChange={setSelectedRound}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Nenhuma Liga Selecionada</h3>
              <p className="text-gray-500 max-w-sm">Selecione uma liga para ver os jogos e fazer suas apostas</p>
            </div>
          </div>
        );
      case 'ranking':
        return selectedLeague ? (
          <div className="animate-fadeIn">
            <RankingTable
              ranking={ranking}
              currentUserId={user.id}
              selectedRound={selectedRound}
              onRoundChange={setSelectedRound}
              totalRounds={38} // Assuming a total of 38 rounds for the season
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Nenhuma Liga Selecionada</h3>
              <p className="text-gray-500 max-w-sm">Selecione uma liga para ver o ranking dos participantes</p>
            </div>
          </div>
        );
      case 'bets':
        return selectedLeague ? (
          <div className="animate-fadeIn">
            <LeagueBets league={selectedLeague} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Nenhuma Liga Selecionada</h3>
              <p className="text-gray-500 max-w-sm">Selecione uma liga para ver as apostas dos membros</p>
            </div>
          </div>
        );
      case 'leagueBets':
        return selectedLeague ? (
          <div className="animate-fadeIn">
            <LeagueBets league={selectedLeague} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Nenhuma Liga Selecionada</h3>
              <p className="text-gray-500 max-w-sm">Selecione uma liga para ver as apostas dos membros</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Header
        userName={user.name || user.email}
        onSignOut={onSignOut}
      />
      <Navigation activeTab={activeTab} onTabChange={handleTabChange} />
      
      {selectedLeague && activeTab !== 'leagues' && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                    {selectedLeague.name}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                    Liga selecionada
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLeague(null)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Trocar Liga
              </button>
            </div>
          </div>
        </div>
      )}
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};