import React, { useState } from 'react';
import { Plus, Users, Copy, Trophy, Calendar, Check, X, Pencil } from 'lucide-react';
import { League } from '../../types';
import { AuthUser } from '../../lib/auth';
import { EditLeagueModal } from './EditLeagueModal';

import { getAuthToken } from '../../lib/storage';

interface LeagueListProps {
  leagues: League[];
  user: AuthUser;
  onCreateLeague: (name: string, description?: string) => Promise<void>;
  onJoinLeague: (code: string) => Promise<void>;
  onSelectLeague: (league: League) => void;
  onShowLeagueMembers: (league: League) => void;
  onShowLeagueBets: (league: League) => void;
  onLeagueUpdate: () => void;
}

export const LeagueList: React.FC<LeagueListProps> = ({
  leagues,
  user,
  onCreateLeague,
  onJoinLeague,
  onSelectLeague,
  onShowLeagueMembers,
  onShowLeagueBets,
  onLeagueUpdate
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [editingLeague, setEditingLeague] = useState<League | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onCreateLeague(name, description);
      setName('');
      setDescription('');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating league:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onJoinLeague(code);
      setCode('');
      setShowJoinForm(false);
    } catch (error) {
      console.error('Error joining league:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = (leagueCode: string) => {
    navigator.clipboard.writeText(leagueCode);
    setCopiedCode(leagueCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleEditLeague = (league: League) => {
    setEditingLeague(league);
    setIsEditModalOpen(true);
  };

  const handleSaveLeague = async (leagueId: string, name: string, description: string) => {
    try {
      const response = await fetch('/.netlify/functions/update-league', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': getAuthToken() || '',
        },
        body: JSON.stringify({ leagueId, name, description }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update league');
      }

      // Refresh the leagues list
      onLeagueUpdate();
    } catch (error) {
      console.error('Error updating league:', error);
      // Here you could add some user-facing error message
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Minhas Ligas</h2>
          <p className="text-muted-foreground mt-1">Gerencie suas ligas de apostas</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setShowJoinForm(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-warning text-warning-foreground hover:bg-warning/90 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md font-medium"
          >
            <Users className="w-4 h-4" />
            <span>Entrar em Liga</span>
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Liga</span>
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="bg-card rounded-xl shadow-lg p-6 border border-border animate-slideDown">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-card-foreground">Criar Nova Liga</h3>
            <button
              onClick={() => setShowCreateForm(false)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          <form onSubmit={handleCreate} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Nome da Liga *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-background text-foreground border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                placeholder="Ex: Amigos do Futebol"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Descrição (opcional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-background text-foreground border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-colors resize-none"
                rows={3}
                placeholder="Descrição da liga..."
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
              >
                {loading ? 'Criando...' : 'Criar Liga'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="flex-1 sm:flex-none px-4 py-3 bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {showJoinForm && (
        <div className="bg-card rounded-xl shadow-lg p-6 border border-border animate-slideDown">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-card-foreground">Entrar em Liga</h3>
            <button
              onClick={() => setShowJoinForm(false)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          <form onSubmit={handleJoin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Código da Liga *
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 bg-background text-foreground border border-input rounded-lg focus:ring-2 focus:ring-warning focus:border-transparent transition-colors font-mono"
                placeholder="Ex: ABC123"
                required
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-warning text-warning-foreground hover:bg-warning/90 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
              >
                {loading ? 'Entrando...' : 'Entrar na Liga'}
              </button>
              <button
                type="button"
                onClick={() => setShowJoinForm(false)}
                className="flex-1 sm:flex-none px-4 py-3 bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {leagues.map((league) => (
          <div
            key={league.id}
            className="group bg-card rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-border hover:border-primary cursor-pointer transform hover:-translate-y-1"
            onClick={() => onSelectLeague(league)}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-lg flex items-center justify-center">
                  <Trophy className="w-6 h-6" />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-mono bg-muted px-3 py-1 rounded-full text-muted-foreground">
                    {league.code}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyCode(league.code);
                    }}
                    className="p-2 hover:bg-muted rounded-full transition-colors relative"
                  >
                    {copiedCode === league.code ? (
                      <Check className="w-4 h-4 text-success" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                  {league.created_by === user.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditLeague(league);
                      }}
                      className="p-2 hover:bg-muted rounded-full transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>

              <h3 className="text-lg font-semibold text-card-foreground mb-2 group-hover:text-primary transition-colors">
                {league.name}
              </h3>

              {league.description && (
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                  {league.description}
                </p>
              )}

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(league.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <button
                  className="flex items-center space-x-1 hover:text-primary hover:underline transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShowLeagueMembers(league);
                  }}
                >
                  <Users className="w-4 h-4" />
                  <span>Ver membros</span>
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-border flex justify-end">
                <button
                  className="text-sm font-medium text-primary hover:text-primary/90 hover:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShowLeagueBets(league);
                  }}
                >
                  Ver Apostas da Liga
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <EditLeagueModal
        league={editingLeague}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveLeague}
      />

      {leagues.length === 0 && (
        <div className="text-center py-16 bg-gradient-to-br from-muted to-background rounded-xl border-2 border-dashed border-border">
          <div className="w-20 h-20 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Nenhuma liga encontrada
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Crie sua primeira liga ou entre em uma existente para começar a apostar com seus amigos
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Criar Liga
            </button>
            <button
              onClick={() => setShowJoinForm(true)}
              className="px-6 py-3 bg-warning text-warning-foreground hover:bg-warning/90 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Entrar em Liga
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}