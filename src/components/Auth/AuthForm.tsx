import React, { useState } from 'react';
import { User, Lock, Mail, Trophy, AtSign, Eye, EyeOff } from 'lucide-react';

interface AuthFormProps {
  onSignIn: (identifier: string, password: string, rememberMe: boolean) => Promise<void>;
  onSignUp: (email: string, password: string, name: string) => Promise<boolean>;
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
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  const heroImageUrl = 'https://images.unsplash.com/photo-1473976345543-9ffc928e648d';

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

        const success = await onSignUp(email.trim(), password, name.trim());
        if (success) {
          setSignUpSuccess(true);
        }
      }
      if (isLogin) {
        const { setRememberMe: setRememberMeStorage } = await import('../../lib/storage');
        setRememberMeStorage(rememberMe);
      }
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

  if (signUpSuccess) {
    return (
      <div className="min-h-screen bg-cover bg-center flex items-center justify-center p-4" style={{ backgroundImage: `url(${heroImageUrl})` }}>
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative bg-card text-card-foreground rounded-3xl shadow-xl p-8 w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-card-foreground mb-2">Confirme seu email</h1>
          <p className="text-muted-foreground">
            Enviamos um email de confirmação para <strong>{email}</strong>. Por favor, verifique sua caixa de entrada e siga as instruções para ativar sua conta.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cover bg-center flex items-center justify-center p-4" style={{ backgroundImage: `url(${heroImageUrl})` }}>
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div className="relative bg-card text-card-foreground rounded-3xl shadow-xl p-8 w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Trophy className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-card-foreground mb-1">AnalfaBet</h1>
          <p className="text-muted-foreground text-sm">
            {isLogin ? 'Entre na sua conta' : 'Crie sua conta'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-xl mb-6 text-sm text-center">
            {error}
          </div>
        )}

        {/* Form Fields */}
        <div className="space-y-4 mb-6">
          {isLogin ? (
            <div>
              <label className="block text-muted-foreground text-sm font-medium mb-2">
                Email ou Nome
              </label>
              <div className="relative">
                <LoginIcon className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-background text-foreground border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-muted-foreground text-sm font-medium mb-2">
                  Nome de Usuário
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-background text-foreground border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all"
                    required
                    minLength={2}
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground text-sm font-medium mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-background text-foreground border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all"
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-muted-foreground text-sm font-medium mb-2">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 bg-background text-foreground border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 h-5 w-5 text-muted-foreground hover:text-foreground transition-colors"
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
            className="h-4 w-4 text-primary focus:ring-ring border-input rounded"
          />
          <label htmlFor="remember" className="ml-2 text-sm text-muted-foreground">
            Manter-me conectado
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          onClick={handleSubmit}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3 px-4 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 mb-6"
        >
          {loading ? 'Carregando...' : isLogin ? 'Entrar' : 'Criar Conta'}
        </button>

        {/* Mode Switch */}
        <div className="text-center">
          <button
            onClick={handleModeSwitch}
            className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors"
          >
            {isLogin ? 'Não tem conta? Criar uma' : 'Já tem conta? Entrar'}
          </button>
        </div>
      </div>
    </div>
  );
};
