import React from 'react';
import { useEffect } from 'react';
import { AuthForm } from './components/Auth/AuthForm';
import { Dashboard } from './components/Dashboard/Dashboard';
import { useAuth } from './hooks/useAuth';
import { isSessionExpired, removeAuthToken } from './lib/storage';

function App() {
  const { user, loading, signIn, signUp, signOut } = useAuth();

  // Check for session expiry periodically
  useEffect(() => {
    const checkSessionExpiry = () => {
      if (user && isSessionExpired()) {
        console.log('[App] Session expired, signing out user');
        signOut();
      }
    };

    // Check every 5 minutes
    const interval = setInterval(checkSessionExpiry, 5 * 60 * 1000);
    
    // Also check on window focus
    const handleFocus = () => {
      checkSessionExpiry();
    };
    
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, signOut]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-yellow-400 flex items-center justify-center dark:from-gray-800 dark:via-gray-900 dark:to-black">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 dark:border-green-400 mx-auto"></div>
          <p className="text-center mt-4 text-gray-600 dark:text-gray-300">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthForm
        onSignIn={signIn}
        onSignUp={signUp}
      />
    );
  }

  return (
    <Dashboard
      user={user}
      onSignOut={signOut}
    />
  );
}

export default App;