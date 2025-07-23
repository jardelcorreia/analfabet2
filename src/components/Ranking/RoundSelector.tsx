import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

const roundSelectorStyles = cva(
  'flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3 w-auto',
  {
    variants: {
      variant: {
        default: '',
        onGradient: '',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const labelStyles = cva('text-sm font-medium whitespace-nowrap', {
  variants: {
    variant: {
      default: 'text-gray-700 dark:text-gray-300',
      onGradient: 'text-white/90',
    },
  },
});

const selectStyles = cva(
  'block w-full sm:w-auto min-w-[120px] pl-3 pr-10 py-2.5 text-sm rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-all duration-200 appearance-none cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 dark:hover:border-gray-500 [color-scheme:light] dark:[color-scheme:dark]',
        onGradient:
          'bg-white/10 text-white border border-white/30 backdrop-blur-sm focus:ring-white/50 focus:border-white/50 hover:border-white/50',
      },
    },
  }
);

const arrowStyles = cva('w-4 h-4', {
  variants: {
    variant: {
      default: 'text-gray-400 dark:text-gray-300',
      onGradient: 'text-white/70',
    },
  },
});

interface RoundSelectorProps extends VariantProps<typeof roundSelectorStyles> {
  selectedRound: number | 'all' | undefined;
  onRoundChange: (round: number | 'all' | undefined) => void;
  totalRounds: number;
  className?: string;
}

export const RoundSelector: React.FC<RoundSelectorProps> = ({
  selectedRound,
  onRoundChange,
  totalRounds,
  variant,
  className,
}) => {
  const rounds = Array.from({ length: totalRounds }, (_, i) => i + 1);

  return (
    <div className={roundSelectorStyles({ variant, className })}>
      <label htmlFor="round-selector" className={labelStyles({ variant })}>
        Filtrar por rodada:
      </label>
      <div className="relative">
        <select
          id="round-selector"
          value={selectedRound === 'all' ? 'all' : selectedRound || ''}
          onChange={(e) => {
            const value = e.target.value;
            if (value === 'all') {
              onRoundChange('all');
            } else if (value === '') {
              onRoundChange(undefined);
            } else {
              onRoundChange(parseInt(value, 10));
            }
          }}
          className={selectStyles({ variant })}
        >
          <option value="all" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
            🏆 Todas as rodadas
          </option>
          {rounds.map((round) => (
            <option key={round} value={round} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
              ⚽ Rodada {round}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDown className={arrowStyles({ variant })} />
        </div>
      </div>
      {variant === 'default' && (
        <div className="sm:hidden">
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {selectedRound === 'all' ? 'Visualizando todas as rodadas' : 
             selectedRound ? `Visualizando rodada ${selectedRound}` : 'Visualizando rodada atual'}
          </p>
        </div>
      )}
    </div>
  );
};
