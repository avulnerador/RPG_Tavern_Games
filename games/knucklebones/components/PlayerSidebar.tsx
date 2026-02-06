import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, HelpCircle, RefreshCw, Swords } from 'lucide-react';
import { Dice } from '../../../components/Dice';
import { PlayerState } from '../../../types';

interface PlayerSidebarProps {
    player: PlayerState | null;
    isLeft: boolean;
    isActive: boolean;
    isWinner: boolean;
    diceValue: number;
    isGameOver: boolean;
}

export const PlayerSidebar: React.FC<PlayerSidebarProps> = ({
    player,
    isLeft,
    isActive,
    isWinner,
    diceValue,
    isGameOver
}) => {
    if (!player) return (
        <div className="w-48 h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-tavern-700/30 rounded-3xl opacity-30">
            <p className="animate-pulse text-tavern-parchment text-center">Esperando...</p>
        </div>
    );

    const alignClass = isLeft ? 'justify-end pb-8' : 'justify-start pt-8';

    // Perfil
    const ProfileSection = (
        <div className={`flex flex-col items-center z-20 ${isLeft ? 'order-2' : 'order-1'}`}>
            <div className="relative mb-2">
                <motion.img
                    animate={isActive ? { scale: 1.1, borderColor: '#fbbf24' } : { borderColor: '#44403c' }}
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${player.avatarSeed}&backgroundColor=c0aede`}
                    alt="Avatar"
                    className={`w-20 h-20 md:w-24 md:h-24 rounded-full border-4 bg-stone-900 shadow-xl transition-all`}
                />
                {isWinner && (
                    <div className="absolute -top-6 -right-2 text-tavern-gold drop-shadow-lg"><Crown size={40} fill="currentColor" /></div>
                )}
            </div>
            <h2 className={`text-xl font-bold font-serif leading-none text-center ${isWinner ? 'text-tavern-gold' : 'text-tavern-parchment'}`}>{player.name}</h2>
            <div className="text-5xl font-bold font-serif mt-1 text-white drop-shadow-md">{player.score}</div>
        </div>
    );

    // Área do Dado
    const showDice = isActive && !isGameOver;

    // FIXED LOGIC: Show "Thinking" ONLY if it's opponent, active, not game over, AND dice is NOT yet rolled (0)
    const isOpponentThinking = !isLeft && isActive && !isGameOver && diceValue === 0;

    // FIXED LOGIC: Dice is visible if active, not game over, and has a value > 0 (for BOTH local and opponent)
    const myDiceVisible = isActive && diceValue > 0 && !isGameOver;

    const DiceSection = (
        <div className={`h-32 w-32 flex flex-col items-center justify-center relative ${isLeft ? 'order-1 mb-8' : 'order-2 mt-8'}`}>
            {showDice ? (
                <>
                    <div className="absolute inset-0 bg-tavern-gold/5 blur-xl rounded-full animate-pulse-slow"></div>

                    {/* DADO (Local ou Oponente Revelado) */}
                    <AnimatePresence mode="wait">
                        {myDiceVisible ? (
                            <motion.div
                                key={diceValue}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="z-10 drop-shadow-2xl"
                            >
                                <Dice value={diceValue} size="lg" />
                            </motion.div>
                        ) : (
                            // Se não está visível (valor 0), mostra ou spinner ou "pensando"
                            isOpponentThinking ? (
                                <motion.div
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="w-24 h-24 bg-tavern-800/80 rounded-2xl border-4 border-tavern-gold/30 flex items-center justify-center"
                                >
                                    <HelpCircle size={32} className="text-tavern-gold animate-pulse" />
                                </motion.div>
                            ) : (
                                <RefreshCw size={40} className="text-tavern-gold animate-spin-slow opacity-50" />
                            )
                        )}
                    </AnimatePresence>

                    {myDiceVisible && <div className="mt-4 text-tavern-gold text-[10px] uppercase font-bold tracking-widest bg-black/40 px-2 py-1 rounded">Seu Turno</div>}
                    {isOpponentThinking && <div className="mt-4 text-stone-500 text-[10px] uppercase font-bold tracking-widest">Oponente...</div>}
                </>
            ) : (
                <div className={`w-24 h-24 rounded-2xl border-4 border-dashed border-white/5 flex items-center justify-center opacity-10 ${isLeft ? 'order-1' : 'order-2'}`}>
                    <Swords size={32} />
                </div>
            )}
        </div>
    );

    return (
        <div className={`w-48 h-full flex flex-col items-center ${alignClass}`}>
            {ProfileSection}
            {DiceSection}
        </div>
    );
};
