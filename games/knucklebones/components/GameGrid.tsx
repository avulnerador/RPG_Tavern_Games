import React from 'react';
import { motion } from 'framer-motion';
import { PlayerState } from '../../../types';
import { calculateColumnScore, MAX_DICE_PER_COLUMN } from '../logic';
import { Dice } from '../../../components/Dice';

interface GameGridProps {
    player: PlayerState | null;
    isTop: boolean;
    isActive: boolean;
    canInteract: boolean;
    onColumnClick: (idx: number) => void;
    shakingColIndex: number | null;
}

export const GameGrid: React.FC<GameGridProps> = ({
    player,
    isTop,
    isActive,
    canInteract,
    onColumnClick,
    shakingColIndex
}) => {
    if (!player) return <div className="w-[300px] h-[260px] opacity-0 bg-black/20 rounded-xl" />;

    return (
        <div className={`
      grid grid-cols-3 gap-2 md:gap-4 p-3 md:p-4 rounded-xl border-4 transition-all duration-300 relative
      ${isActive ? 'border-tavern-accent/40 bg-tavern-900/90 shadow-[0_0_50px_rgba(0,0,0,0.5)]' : 'border-stone-800 bg-black/60 grayscale opacity-80'}
    `}>
            {player.grid.map((col, i) => {
                const colScore = calculateColumnScore(col);
                const colFull = col.length >= MAX_DICE_PER_COLUMN;
                const isInteractive = canInteract && !colFull;
                const isShaking = shakingColIndex === i;

                return (
                    <div key={i} className={`flex flex-col items-center gap-2 ${isTop ? 'flex-col-reverse' : 'flex-col'}`}>
                        {/* The Column Track */}
                        <motion.button
                            onClick={() => isInteractive ? onColumnClick(i) : null}
                            animate={isShaking ? { x: [-5, 5, -5, 5, 0], backgroundColor: ['#451a03', '#1c1917'] } : {}}
                            className={`
                w-20 md:w-24 h-[240px] rounded-lg border-2 flex flex-col items-center p-2 gap-2 relative transition-colors
                ${isTop ? 'justify-end' : 'justify-start'} 
                ${isInteractive
                                    ? 'border-tavern-gold/20 bg-tavern-800 hover:bg-tavern-700 hover:border-tavern-gold/50 cursor-pointer'
                                    : 'border-stone-800 bg-stone-900/50 cursor-default'}
              `}
                        >
                            {/* Inner Texture */}
                            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/dark-wood.png')] pointer-events-none"></div>

                            {/* Dice Stack */}
                            {col.map((die) => (
                                <div key={die.id} className="z-10 relative">
                                    <Dice value={die.value} isDestroyed={die.isDestroyed} isNew={die.isNew} size="md" />
                                </div>
                            ))}

                            {/* Ghost Slots for empty spaces */}
                            {Array.from({ length: Math.max(0, MAX_DICE_PER_COLUMN - col.length) }).map((_, idx) => (
                                <div key={`empty-${idx}`} className="w-14 h-14 md:w-16 md:h-16 rounded border border-white/5 opacity-10" />
                            ))}

                            {/* Hover Indicator */}
                            {isInteractive && (
                                <div className="absolute inset-0 bg-tavern-accent/10 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                    <div className="w-full h-full border-2 border-tavern-gold/50 rounded-lg animate-pulse" />
                                </div>
                            )}
                        </motion.button>

                        {/* Column Score */}
                        <span className={`font-mono font-bold text-lg ${colScore > 0 ? 'text-tavern-gold' : 'text-stone-600'}`}>
                            {colScore > 0 ? colScore : '-'}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};
