import React, { useLayoutEffect } from 'react';
import { Shield, BarChart3, Star, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { SportsDbTable } from '../../types';
import { timesInfo } from '../../lib/teams';

interface StandingsTableProps {
  standings: SportsDbTable[];
  loading: boolean;
  error: string | null;
}

export const StandingsTable: React.FC<StandingsTableProps> = ({ standings, loading, error }) => {
  const [isMobile, setIsMobile] = React.useState(false);

  useLayoutEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 px-4">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <BarChart3 className="w-10 h-10 text-destructive" />
        </div>
        <h3 className="text-xl font-semibold text-destructive mb-2">
          Erro ao carregar a classificação
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          {error}
        </p>
      </div>
    );
  }

  if (!standings || standings.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
          <BarChart3 className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Nenhuma classificação disponível
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          A classificação do campeonato ainda não está disponível.
        </p>
      </div>
    );
  }

  const getPromotionColor = (promotion: string) => {
    if (typeof promotion !== 'string') return 'border-l-4 border-transparent';
    if (promotion.toLowerCase().includes('libertadores')) return 'border-l-4 border-blue-500';
    if (promotion.toLowerCase().includes('sul-americana')) return 'border-l-4 border-green-500';
    if (promotion.toLowerCase().includes('relegation')) return 'border-l-4 border-red-500';
    return 'border-l-4 border-transparent';
  };

  const MobileCard = ({ team }: { team: SportsDbTable }) => {
    const teamInfo = timesInfo[team.strTeam as keyof typeof timesInfo];
    return (
      <div className={`bg-card rounded-lg shadow-md p-4 mb-4 ${getPromotionColor(team.strPromotion)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="font-bold text-lg w-8 text-center">{team.intRank}</span>
            <img src={teamInfo?.escudo || team.strTeamBadge} alt={team.strTeam} className="w-8 h-8" />
            <span className="font-semibold">{teamInfo?.nome || team.strTeam}</span>
          </div>
          <div className="text-right">
            <span className="font-bold text-lg">{team.intPoints}</span>
            <span className="text-muted-foreground text-sm"> pts</span>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-2 mt-4 text-center text-sm">
          <div>
            <p className="font-semibold">{team.intPlayed}</p>
            <p className="text-muted-foreground text-xs">J</p>
          </div>
          <div>
            <p className="font-semibold text-green-500">{team.intWin}</p>
            <p className="text-muted-foreground text-xs">V</p>
          </div>
          <div>
            <p className="font-semibold text-gray-500">{team.intDraw}</p>
            <p className="text-muted-foreground text-xs">E</p>
          </div>
          <div>
            <p className="font-semibold text-red-500">{team.intLoss}</p>
            <p className="text-muted-foreground text-xs">D</p>
          </div>
          <div>
            <p className="font-semibold">{team.intGoalDifference}</p>
            <p className="text-muted-foreground text-xs">SG</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-card rounded-xl shadow-lg overflow-hidden">
      <div className="bg-primary px-4 md:px-6 py-4">
        <h2 className="text-xl md:text-2xl font-bold text-primary-foreground flex items-center space-x-2">
          <Shield className="w-5 h-5 md:w-6 md:h-6" />
          <span>Classificação do Brasileirão</span>
        </h2>
      </div>

      {isMobile ? (
        <div className="p-4">
          {standings.map(team => (
            <MobileCard key={team.idTeam} team={team} />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-12">Pos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Clube</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">P</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">J</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">V</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">E</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">D</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">GP</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">GC</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">SG</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Últ. 5</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {standings.map(team => {
                const teamInfo = timesInfo[team.strTeam as keyof typeof timesInfo];
                return (
                  <tr key={team.idTeam} className={`hover:bg-muted ${getPromotionColor(team.strPromotion)}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-center font-bold">{team.intRank}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img src={teamInfo?.escudo || team.strTeamBadge} alt={team.strTeam} className="w-6 h-6 mr-3" />
                        <span className="font-semibold">{teamInfo?.nome || team.strTeam}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center font-bold">{team.intPoints}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">{team.intPlayed}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-green-500">{team.intWin}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-gray-500">{team.intDraw}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-red-500">{team.intLoss}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">{team.intGoalsFor}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">{team.intGoalsAgainst}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">{team.intGoalDifference}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-1">
                        {team.strForm.split('').map((result, index) => {
                          if (result === 'W') return <ArrowUp key={index} className="w-4 h-4 text-green-500" />;
                          if (result === 'L') return <ArrowDown key={index} className="w-4 h-4 text-red-500" />;
                          if (result === 'D') return <Minus key={index} className="w-4 h-4 text-gray-500" />;
                          return null;
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
