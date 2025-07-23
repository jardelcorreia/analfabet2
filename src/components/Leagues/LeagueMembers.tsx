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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <ShieldAlert className="w-12 h-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
        <p className="text-red-600 dark:text-red-300 font-semibold">Erro ao carregar membros da liga:</p>
        <p className="text-red-500 dark:text-red-400 text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center mb-6">
        <Users className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" />
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Membros da Liga: {league.name}</h2>
      </div>

      {members.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-4">Nenhum membro encontrado para esta liga.</p>
      ) : (
        <ul className="space-y-4">
          {members.map((member) => (
            <li key={member.id} className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
              {member.avatar ? (
                <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full mr-4 object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-white font-semibold mr-4">
                  {member.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-700 dark:text-gray-200">{member.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{member.email}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
