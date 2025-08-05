import React, { useState } from 'react';
import { AuthUser } from '../../lib/auth';
import { getAuthToken, removeAuthToken } from '../../lib/storage';
import { User, Mail, Key, ShieldAlert, CheckCircle, AlertCircle } from 'lucide-react';

interface ProfileProps {
  user: AuthUser;
}

export const Profile: React.FC<ProfileProps> = ({ user }) => {
  // Username form state
  const [username, setUsername] = useState(user.name);
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameMessage, setUsernameMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameLoading(true);
    setUsernameMessage(null);

    try {
      const response = await fetch('/.netlify/functions/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': getAuthToken() || '',
        },
        body: JSON.stringify({ name: username }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao atualizar o nome de usuário.');
      }

      setUsernameMessage({ type: 'success', text: 'Nome de usuário atualizado com sucesso! A alteração será totalmente refletida no próximo login.' });
    } catch (error: any) {
      setUsernameMessage({ type: 'error', text: error.message });
    } finally {
      setUsernameLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setPasswordMessage({ type: 'error', text: 'As novas senhas não coincidem.' });
      return;
    }
    setPasswordLoading(true);
    setPasswordMessage(null);

    try {
      const response = await fetch('/.netlify/functions/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': getAuthToken() || '',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao alterar a senha.');
      }

      setPasswordMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      setPasswordMessage({ type: 'error', text: error.message });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setDeleteMessage(null);

    try {
      const response = await fetch('/.netlify/functions/delete-account', {
        method: 'POST',
        headers: {
          'token': getAuthToken() || '',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao excluir a conta.');
      }

      setDeleteMessage({ type: 'success', text: 'Conta excluída com sucesso. Você será desconectado.' });
      setTimeout(() => {
        removeAuthToken();
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      setDeleteMessage({ type: 'error', text: error.message });
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Perfil do Usuário</h1>
        <p className="text-muted-foreground mt-1">Gerencie suas informações de perfil e segurança.</p>
      </div>

      {/* User Information */}
      <div className="bg-card rounded-xl shadow-md border border-border p-6">
        <h2 className="text-xl font-semibold mb-4">Informações da Conta</h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <User className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium">{username}</span>
          </div>
          <div className="flex items-center space-x-3">
            <Mail className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium">{user.email}</span>
          </div>
        </div>
      </div>

      {/* Change Username */}
      <div className="bg-card rounded-xl shadow-md border border-border p-6">
        <h2 className="text-xl font-semibold mb-4">Alterar Nome de Usuário</h2>
        <form onSubmit={handleUpdateUsername} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-muted-foreground mb-1">
              Novo nome de usuário
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring"
              required
            />
          </div>
          {usernameMessage && (
            <div className={`flex items-center space-x-2 text-sm ${usernameMessage.type === 'success' ? 'text-success' : 'text-destructive'}`}>
              {usernameMessage.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span>{usernameMessage.text}</span>
            </div>
          )}
          <button
            type="submit"
            disabled={usernameLoading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {usernameLoading ? 'Salvando...' : 'Salvar Nome'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-card rounded-xl shadow-md border border-border p-6">
        <h2 className="text-xl font-semibold mb-4">Alterar Senha</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label
              htmlFor="currentPassword"
              className="block text-sm font-medium text-muted-foreground mb-1"
            >
              Senha Atual
            </label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring"
              required
            />
          </div>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-muted-foreground mb-1">
              Nova Senha
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring"
              required
            />
          </div>
          <div>
            <label
              htmlFor="confirmNewPassword"
              className="block text-sm font-medium text-muted-foreground mb-1"
            >
              Confirmar Nova Senha
            </label>
            <input
              id="confirmNewPassword"
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring"
              required
            />
          </div>
          {passwordMessage && (
            <div className={`flex items-center space-x-2 text-sm ${passwordMessage.type === 'success' ? 'text-success' : 'text-destructive'}`}>
              {passwordMessage.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span>{passwordMessage.text}</span>
            </div>
          )}
          <button
            type="submit"
            disabled={passwordLoading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {passwordLoading ? 'Alterando...' : 'Alterar Senha'}
          </button>
        </form>
      </div>

      {/* Close Account */}
      <div className="bg-destructive/10 rounded-xl shadow-md border border-destructive/20 p-6">
        <h2 className="text-xl font-semibold mb-2 text-destructive">Zona de Perigo</h2>
        <p className="text-destructive mb-4">
          A exclusão da sua conta é uma ação permanente e não pode ser desfeita.
        </p>
        {!showDeleteConfirm && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
          >
            Fechar Conta
          </button>
        )}
        {showDeleteConfirm && (
          <div className="bg-destructive/20 p-4 rounded-lg">
            <p className="font-semibold mb-3 text-destructive">Tem certeza que deseja continuar?</p>
            {deleteMessage && (
              <div className={`flex items-center space-x-2 text-sm mb-2 ${deleteMessage.type === 'success' ? 'text-success' : 'text-destructive'}`}>
                {deleteMessage.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                <span>{deleteMessage.text}</span>
              </div>
            )}
            <div className="flex space-x-4">
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 disabled:opacity-50"
              >
                {deleteLoading ? 'Excluindo...' : 'Sim, excluir minha conta'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
