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
      default: 'text-muted-foreground',
      onGradient: 'text-primary-foreground/90',
    },
  },
});

const selectStyles = cva(
  'block w-full sm:w-auto min-w-[120px] pl-3 pr-10 py-2.5 text-sm rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-all duration-200 appearance-none cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-card text-card-foreground border border-input focus:ring-ring focus:border-transparent hover:border-input/80 [color-scheme:light] dark:[color-scheme:dark]',
        onGradient:
          'bg-primary-foreground/10 text-primary-foreground border border-primary-foreground/30 backdrop-blur-sm focus:ring-primary-foreground/50 focus:border-primary-foreground/50 hover:border-primary-foreground/50',
      },
    },
  }
);

const arrowStyles = cva('w-4 h-4', {
  variants: {
    variant: {
      default: 'text-muted-foreground',
      onGradient: 'text-primary-foreground/70',
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
          <option value="all" className="bg-card text-card-foreground">
            🏆 Todas as rodadas
          </option>
          {rounds.map((round) => (
            <option key={round} value={round} className="bg-card text-card-foreground">
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
          <p className="text-xs text-muted-foreground mt-1">
            {selectedRound === 'all' ? 'Visualizando todas as rodadas' : 
             selectedRound ? `Visualizando rodada ${selectedRound}` : 'Visualizando rodada atual'}
          </p>
        </div>
      )}
    </div>
  );
};
