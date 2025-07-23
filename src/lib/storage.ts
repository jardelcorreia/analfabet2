const TOKEN_KEY = 'analfa_bet_token';
const USER_KEY = 'analfa_bet_user';
const REMEMBER_ME_KEY = 'analfa_bet_remember_me';
const SESSION_EXPIRY_KEY = 'analfa_bet_session_expiry';

export const setAuthToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const removeAuthToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(REMEMBER_ME_KEY);
  localStorage.removeItem(SESSION_EXPIRY_KEY);
};

export const setUser = (user: any): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getUser = (): any | null => {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const setRememberMe = (remember: boolean): void => {
  localStorage.setItem(REMEMBER_ME_KEY, remember.toString());
};

export const getRememberMe = (): boolean => {
  const remember = localStorage.getItem(REMEMBER_ME_KEY);
  return remember === 'true';
};

export const setSessionExpiry = (expiryTime: number): void => {
  localStorage.setItem(SESSION_EXPIRY_KEY, expiryTime.toString());
};

export const getSessionExpiry = (): number | null => {
  const expiry = localStorage.getItem(SESSION_EXPIRY_KEY);
  return expiry ? parseInt(expiry, 10) : null;
};

export const isSessionExpired = (): boolean => {
  const expiry = getSessionExpiry();
  if (!expiry) return false;
  
  return Date.now() > expiry;
};

export const extendSession = (additionalTime: number = 7 * 24 * 60 * 60 * 1000): void => {
  // Extend session by 7 days by default
  const newExpiry = Date.now() + additionalTime;
  setSessionExpiry(newExpiry);
};