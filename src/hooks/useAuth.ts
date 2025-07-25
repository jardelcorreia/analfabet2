import { useState, useEffect } from 'react';
import { signIn as authSignIn, signUp as authSignUp, decodeToken, AuthUser } from '../lib/auth';
import { 
  setAuthToken, 
  getAuthToken, 
  removeAuthToken, 
  setUser, 
  getUser,
  getRememberMe,
  setRememberMe,
  setSessionExpiry,
  isSessionExpired,
  extendSession
} from '../lib/storage';

export const useAuth = () => {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[useAuth] Initial auth check starting...');
    
    // Check if session is expired first
    if (isSessionExpired()) {
      console.log('[useAuth] Session expired, clearing auth data');
      removeAuthToken();
      setLoading(false);
      return;
    }

    const token = getAuthToken();
    console.log('[useAuth] Token found:', !!token);
    
    if (token) {
      const decodedTokenUser = decodeToken(token);
      console.log('[useAuth] Token verification:', !!decodedTokenUser);
      
      if (decodedTokenUser) {
        const rememberMe = getRememberMe();
        console.log('[useAuth] Remember me preference:', rememberMe);
        
        // Se o usuário escolheu "lembrar-me", estender a sessão
        if (rememberMe) {
          console.log('[useAuth] Extending session due to remember me preference');
          extendSession();
        }
        
        // Get user data from localStorage
        const fullUserData = getUser();
        console.log('[useAuth] Full user data found:', !!fullUserData);
        
        if (fullUserData && fullUserData.id === decodedTokenUser.id) {
          console.log('[useAuth] User data consistent with token, setting user state');
          setUserState(fullUserData);
        } else if (fullUserData && fullUserData.id !== decodedTokenUser.id) {
          console.log('[useAuth] Critical inconsistency: token/user mismatch, clearing session');
          removeAuthToken();
        } else if (!fullUserData && decodedTokenUser) {
          console.log('[useAuth] Token valid but no user data in storage, clearing session');
          removeAuthToken();
        } else {
          console.log('[useAuth] Unexpected case, clearing session');
          removeAuthToken();
        }
      } else {
        console.log('[useAuth] Token is invalid or expired, clearing session');
        removeAuthToken();
      }
    } else {
      console.log('[useAuth] No token found, user not authenticated');
    }
    
    setLoading(false);
  }, []);

  const signIn = async (identifier: string, password: string, rememberMe: boolean) => {
    console.log('[useAuth.signIn] Attempting sign-in for:', identifier, 'Remember me:', rememberMe);
    try {
      console.log('[useAuth.signIn] Calling Netlify function /api/login for:', identifier);
      const response = await fetch('/.netlify/functions/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier, password }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('[useAuth.signIn] Login failed via Netlify function:', responseData.error || response.statusText);
        throw new Error(responseData.error || 'Falha no login. Verifique suas credenciais.');
      }

      console.log('[useAuth.signIn] Login successful via Netlify function. Response data:', responseData);
      const { token, user: userData } = responseData;

      if (!token || !userData) {
        console.error('[useAuth.signIn] Invalid response from login function - missing token or user data.');
        throw new Error('Resposta inválida do servidor de login.');
      }

      // Salvar tudo no localStorage
      setAuthToken(token);
      setUser(userData);
      setUserState(userData);
      
      // IMPORTANTE: Salvar a preferência do "lembrar-me" ANTES de definir o expiry
      setRememberMe(rememberMe);
      console.log('[useAuth.signIn] Remember me preference saved:', rememberMe);
      
      // Set session expiry based on remember me preference
      if (rememberMe) {
        console.log('[useAuth.signIn] Setting long session (30 days)');
        setSessionExpiry(Date.now() + (30 * 24 * 60 * 60 * 1000));
      } else {
        console.log('[useAuth.signIn] Setting short session (24 hours)');
        setSessionExpiry(Date.now() + (24 * 60 * 60 * 1000));
      }
      
      console.log('[useAuth.signIn] Client state updated with token and user data.');

    } catch (error: any) {
      console.error('[useAuth.signIn] Error during sign-in fetch process:', error.message || error);
      throw new Error(error.message || 'Erro ao tentar fazer login.');
    }
  };

  const signUp = async (email: string, password: string, name: string): Promise<boolean> => {
    console.log('[useAuth.signUp] Attempting sign-up for:', email);
    try {
      console.log('[useAuth.signUp] Calling Netlify function /api/signup for:', email);
      const response = await fetch('/.netlify/functions/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('[useAuth.signUp] SignUp failed via Netlify function:', responseData.error || response.statusText);
        throw new Error(responseData.error || 'Falha no cadastro. Verifique os dados inseridos.');
      }

      console.log('[useAuth.signUp] SignUp successful via Netlify function. Response data:', responseData);
      const { token, user: userData } = responseData;

      if (!token || !userData) {
        console.error('[useAuth.signUp] Invalid response from signup function - missing token or user data.');
        throw new Error('Resposta inválida do servidor de cadastro.');
      }

      // Don't log the user in automatically. They need to confirm their email first.
      console.log('[useAuth.signUp] User created successfully. They need to confirm their email.');
      return true;

    } catch (error: any) {
      console.error('[useAuth.signUp] Error during sign-up fetch process:', error.message || error);
      throw new Error(error.message || 'Erro ao tentar fazer o cadastro.');
    }
  };

  const signOut = async () => {
    console.log('[useAuth.signOut] Signing out user');
    removeAuthToken(); // Isso já limpa tudo incluindo REMEMBER_ME_KEY
    setUserState(null);
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut
  };
};
