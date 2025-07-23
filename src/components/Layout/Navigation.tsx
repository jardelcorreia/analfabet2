import React from 'react';
import { Trophy, Calendar, Users, BarChart3 } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'leagues', label: 'Ligas', icon: Trophy },
    { id: 'matches', label: 'Jogos', icon: Calendar },
    { id: 'ranking', label: 'Ranking', icon: BarChart3 },
    { id: 'bets', label: 'Apostas', icon: Users }
  ];

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-2 sm:px-4">
        {/* Desktop/Tablet Navigation */}
        <div className="hidden sm:flex space-x-8">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === id
                  ? 'border-green-500 text-green-600 dark:text-green-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Mobile Navigation */}
        <div className="sm:hidden flex justify-between">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex flex-col items-center py-3 px-2 flex-1 border-b-2 font-medium text-xs transition-colors ${
                activeTab === id
                  ? 'border-green-500 text-green-600 dark:text-green-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};