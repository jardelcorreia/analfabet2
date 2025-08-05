import React from 'react';
import { Users, ShieldAlert } from 'lucide-react';
import { League } from '../../types';
import { useLeagueMembers } from '../../hooks/useLeagueMembers';

interface LeagueMembersProps {
  league: League;
  // userId: string; // May not be needed if just displaying members
}

export const LeagueMembers: React.FC<LeagueMembersProps> = ({ league }) => {
  const { members, loading, error } = useLeagueMembers(league?.id);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-destructive/10 border border-destructive/20 rounded-lg p-6">
        <ShieldAlert className="w-12 h-12 text-destructive mx-auto mb-4" />
        <p className="text-destructive font-semibold">Erro ao carregar membros da liga:</p>
        <p className="text-destructive text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-card shadow-md rounded-lg p-6 border border-border">
      <div className="flex items-center mb-6">
        <Users className="w-6 h-6 text-primary mr-3" />
        <h2 className="text-xl font-bold text-card-foreground">Membros da Liga: {league.name}</h2>
      </div>

      {members.length === 0 ? (
        <p className="text-muted-foreground text-center py-4">Nenhum membro encontrado para esta liga.</p>
      ) : (
        <ul className="space-y-4">
          {members.map((member) => (
            <li key={member.id} className="flex items-center p-3 bg-muted rounded-md hover:bg-muted/80 transition-colors">
              {member.avatar ? (
                <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full mr-4 object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-muted-foreground flex items-center justify-center text-muted font-semibold mr-4">
                  {member.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-semibold text-foreground">{member.name}</p>
                <p className="text-sm text-muted-foreground">{member.email}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
