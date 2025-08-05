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
    <nav className="bg-card shadow-sm border-b border-border">
      <div className="container mx-auto px-2 sm:px-4">
        {/* Desktop/Tablet Navigation */}
        <div className="hidden sm:flex space-x-8">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
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
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
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