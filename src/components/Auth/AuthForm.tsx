import React, { useState } from 'react';
import { User, Lock, Mail, Trophy, AtSign, Eye, EyeOff } from 'lucide-react';

interface AuthFormProps {
  onSignIn: (identifier: string, password: string, rememberMe: boolean) => Promise<void>;
  onSignUp: (email: string, password: string, name: string) => Promise<void>;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onSignIn, onSignUp }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const isEmailFormat = (input: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(input);
  };

  const isValidUsername = (username: string): boolean => {
    return username.length >= 2 && !username.includes('@') && !username.includes(' ');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        if (!identifier.trim()) {
          setError('Email ou nome de usuário é obrigatório');
          return;
        }

        if (isEmailFormat(identifier) && !isEmailFormat(identifier)) {
          setError('Formato de email inválido');
          return;
        }

        if (!isEmailFormat(identifier) && !isValidUsername(identifier)) {
          setError('Nome de usuário deve ter pelo menos 2 caracteres e não conter @ ou espaços');
          return;
        }

        await onSignIn(identifier.trim(), password, rememberMe);
      } else {
        if (!email.trim()) {
          setError('Email é obrigatório');
          return;
        }

        if (!isEmailFormat(email)) {
          setError('Formato de email inválido');
          return;
        }

        if (!name.trim()) {
          setError('Nome é obrigatório');
          return;
        }

        if (!isValidUsername(name)) {
          setError('Nome de usuário deve ter pelo menos 2 caracteres e não conter @ ou espaços');
          return;
        }

        if (password.length < 6) {
          setError('Senha deve ter pelo menos 6 caracteres');
          return;
        }

        await onSignUp(email.trim(), password, name.trim());
      }
      
      const { setRememberMe: setRememberMeStorage } = await import('../../lib/storage');
      setRememberMeStorage(rememberMe);
    } catch (err: any) {
      console.error("AuthForm caught error:", err);
      let displayMessage = 'Erro desconhecido.';
      if (typeof err === 'string') {
        displayMessage = err;
      } else if (err && typeof err === 'object' && typeof (err as Error).message === 'string') {
        displayMessage = (err as Error).message;
      }
      setError(displayMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleModeSwitch = () => {
    setIsLogin(!isLogin);
    setError(null);
    setIdentifier('');
    setEmail('');
    setName('');
    setPassword('');
    setShowPassword(false);
  };

  const getLoginIcon = () => {
    if (!identifier) return AtSign;
    return isEmailFormat(identifier) ? Mail : User;
  };

  const LoginIcon = getLoginIcon();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-yellow-400 dark:from-gray-800 dark:via-gray-900 dark:to-black flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-4">
            <Trophy className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">AnalfaBet</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {isLogin ? 'Entre na sua conta' : 'Crie sua conta'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-6 text-sm text-center">
            {error}
          </div>
        )}

        {/* Form Fields */}
        <div className="space-y-4 mb-6">
          {isLogin ? (
            <div>
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                Email ou Nome
              </label>
              <div className="relative">
                <LoginIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                  Nome de Usuário
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                    required
                    minLength={2}
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Remember Me */}
        <div className="flex items-center mb-6">
          <input
            id="remember"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded"
          />
          <label htmlFor="remember" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            Manter-me conectado
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          onClick={handleSubmit}
          className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 mb-6"
        >
          {loading ? 'Carregando...' : isLogin ? 'Entrar' : 'Criar Conta'}
        </button>

        {/* Mode Switch */}
        <div className="text-center">
          <button
            onClick={handleModeSwitch}
            className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 text-sm font-medium transition-colors"
          >
            {isLogin ? 'Não tem conta? Criar uma' : 'Já tem conta? Entrar'}
          </button>
        </div>
      </div>
    </div>
  );
};
