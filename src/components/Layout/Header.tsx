import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, User, LogOut, Sun, Moon } from 'lucide-react';
import { extendSession, getRememberMe } from '../../lib/storage';

interface HeaderProps {
  userName: string;
  onSignOut: () => void;
  onNavigateToProfile: () => void;
  onGoHome: () => void;
}

export const Header: React.FC<HeaderProps> = ({ userName, onSignOut, onNavigateToProfile, onGoHome }) => {
  const [isDarkMode, setIsDarkMode] = useState(
    () => localStorage.getItem('theme') === 'dark'
  );

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };
  // Extend session on user activity if remember me is enabled
  React.useEffect(() => {
    const handleUserActivity = () => {
      const rememberMe = getRememberMe();
      if (rememberMe) {
        extendSession();
      }
    };

    // Listen for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    // Throttle the activity handler to avoid excessive calls
    let lastActivity = 0;
    const throttledHandler = () => {
      const now = Date.now();
      if (now - lastActivity > 5 * 60 * 1000) { // Only extend every 5 minutes
        handleUserActivity();
        lastActivity = now;
      }
    };

    events.forEach(event => {
      document.addEventListener(event, throttledHandler, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, throttledHandler, true);
      });
    };
  }, []);

  return (
    <header className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-gray-800 dark:to-gray-900 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <button onClick={onGoHome} className="flex items-center space-x-2 cursor-pointer">
            <Trophy className="w-8 h-8" />
            <h1 className="text-2xl font-bold">AnalfaBet</h1>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={onNavigateToProfile}
              className="flex items-center space-x-2 p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <User className="w-5 h-5" />
              <span className="font-medium hidden sm:inline">{userName}</span>
            </button>
            <button
              onClick={onSignOut}
              className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};