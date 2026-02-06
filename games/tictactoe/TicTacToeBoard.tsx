import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Snowflake, RefreshCw, LogOut, Shield, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTicTacToeGame } from './hooks/useTicTacToeGame';
import { LobbyOverlay } from '../knucklebones/components/LobbyOverlay'; // Reusing components
import { DisconnectOverlay } from '../knucklebones/components/DisconnectOverlay';

interface TicTacToeBoardProps {
  roomCode: string;
  playerName: string;
  avatarSeed: string;
  isHost: boolean;
  isOffline?: boolean;

  stake?: number;
  myCoins: number;
  onUpdateCoins: (amount: number) => void;
  onLeave: () => void;
}

export const TicTacToeBoard: React.FC<TicTacToeBoardProps> = ({ roomCode, playerName, avatarSeed, isHost, isOffline, stake = 0, myCoins, onUpdateCoins, onLeave }) => {
  const {
    gameState,
    myPlayerId,
    onCellClick,
    resetGame
  } = useTicTacToeGame(roomCode, playerName, avatarSeed, isHost, !!isOffline, stake, myCoins, onUpdateCoins);

  // Confetti effect on win
  useEffect(() => {
    if (gameState.winner) {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: gameState.winner === 'host' ? ['#f59e0b', '#dc2626'] : ['#3b82f6', '#06b6d4'] });
    }
  }, [gameState.winner]);

  const renderCell = (i: number) => {
    const value = gameState.board[i];
    return (
      <motion.button
        whileHover={!value && !gameState.isGameOver && (isOffline || gameState.turn === myPlayerId) ? { scale: 0.95, backgroundColor: 'rgba(41, 37, 36, 0.8)' } : {}}
        whileTap={!value && !gameState.isGameOver ? { scale: 0.9 } : {}}
        onClick={() => onCellClick(i)}
        disabled={gameState.gameStatus !== 'playing'}
        className={`h-24 w-24 md:h-32 md:w-32 bg-tavern-900 border-4 rounded-xl flex items-center justify-center relative overflow-hidden shadow-inner group transition-colors ${!value && gameState.turn === myPlayerId && !gameState.isGameOver ? 'border-tavern-gold/50 cursor-pointer' : 'border-tavern-700 cursor-default'
          }`}
      >
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stone.png')]"></div>
        <AnimatePresence>
          {value === 'X' && (
            <motion.div
              initial={{ scale: 0, opacity: 0, rotate: -45 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              className="text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.8)]"
            >
              <Flame size={64} strokeWidth={2.5} />
            </motion.div>
          )}
          {value === 'O' && (
            <motion.div
              initial={{ scale: 0, opacity: 0, rotate: 45 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              className="text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]"
            >
              <Snowflake size={64} strokeWidth={2.5} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-stone-950 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-wood.png')] opacity-20 pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 pointer-events-none"></div>

      {/* Overlays */}
      <AnimatePresence>
        {gameState.gameStatus === 'waiting' && (
          <LobbyOverlay roomCode={roomCode} />
        )}

        {gameState.gameStatus === 'disconnected' && (
          <DisconnectOverlay
            opponentName={gameState.guest?.name === playerName ? gameState.host.name : gameState.guest?.name}
            onReturnToHub={onLeave}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="w-full max-w-lg flex justify-between items-center mb-8 bg-tavern-800/80 p-4 rounded-2xl border border-tavern-accent/30 backdrop-blur-md relative z-10">
        <div className="flex items-center gap-2">
          <Shield className="text-tavern-gold" />
          <span className="text-tavern-parchment font-bold uppercase tracking-widest text-sm">Duelo de Grimórios</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-stone-500">
          <span>{gameState.host.score}</span> x <span>{gameState.guest?.score || 0}</span>
          {stake > 0 && (
            <div className="flex items-center gap-1 text-tavern-gold border-l border-white/10 pl-4">
              <span className="text-[10px] uppercase font-bold">Aposta:</span>
              <span className="font-bold">{stake}</span>
            </div>
          )}
        </div>
        <button onClick={onLeave} className="text-xs font-bold text-stone-500 hover:text-tavern-gold flex items-center gap-2 transition-colors">
          <LogOut size={16} /> Sair
        </button>
      </div>

      <div className="relative z-10">
        {/* Game Board */}
        <div className="grid grid-cols-3 gap-3 bg-tavern-800 p-4 rounded-2xl border-2 border-tavern-accent shadow-[0_0_40px_rgba(0,0,0,0.5)]">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i}>{renderCell(i)}</div>
          ))}
        </div>

        {/* Turn Indicator */}
        {!gameState.isGameOver && gameState.gameStatus === 'playing' && (
          <div className="mt-8 flex justify-center items-center gap-4">
            {/* Host / X Indicator */}
            <div className={`flex items-center gap-2 px-6 py-3 rounded-full border-2 transition-all duration-300 ${gameState.turn === 'host' ? 'bg-orange-900/40 border-orange-500 text-orange-200 shadow-[0_0_15px_rgba(249,115,22,0.3)] scale-110' : 'bg-tavern-900 border-tavern-700 text-stone-600 opacity-50 scale-90'}`}>
              <Flame size={18} />
              <span className="font-bold uppercase tracking-widest text-xs">{gameState.host.name} (Fogo)</span>
            </div>

            <div className="text-stone-600 font-serif italic">vs</div>

            {/* Guest / O Indicator */}
            <div className={`flex items-center gap-2 px-6 py-3 rounded-full border-2 transition-all duration-300 ${gameState.turn === 'guest' ? 'bg-cyan-900/40 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.3)] scale-110' : 'bg-tavern-900 border-tavern-700 text-stone-600 opacity-50 scale-90'}`}>
              <span className="font-bold uppercase tracking-widest text-xs">{gameState.guest?.name || 'Oponente'} (Gelo)</span>
              <Snowflake size={18} />
            </div>
          </div>
        )}
      </div>

      {/* Winner Overlay (Custom for TicTacToe visual style) */}
      <AnimatePresence>
        {gameState.isGameOver && gameState.gameStatus !== 'disconnected' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <div className="bg-tavern-800 border-4 border-tavern-gold p-8 rounded-3xl text-center shadow-2xl max-w-sm w-full mx-4">
              <Trophy size={48} className="text-tavern-gold mx-auto mb-4" />
              <h2 className="text-3xl font-serif font-bold text-tavern-gold mb-2 uppercase">
                {gameState.winner === 'draw' ? 'Empate Místico!' : `${gameState.winner === 'host' ? gameState.host.name : gameState.guest?.name} Venceu!`}
              </h2>
              <p className="text-stone-400 italic mb-6">As runas decidiram o destino.</p>

              {/* Financial Result */}
              {stake > 0 && (
                <div className="mb-6 bg-black/40 p-3 rounded-xl border border-tavern-gold/20">
                  <span className="text-[10px] uppercase font-bold text-stone-500 block mb-1">Resultado da Aposta</span>
                  <div className={`text-xl font-bold flex items-center justify-center gap-2 ${gameState.winner === myPlayerId ? 'text-green-400' : (gameState.winner === 'draw' ? 'text-stone-300' : 'text-red-400')
                    }`}>
                    {gameState.winner === myPlayerId && '+'}{gameState.winner === 'draw' ? '0' : (gameState.winner === myPlayerId ? stake : -stake)} <span className="text-xs text-tavern-gold">MOEDAS</span>
                  </div>
                </div>
              )}

              <button
                onClick={() => resetGame(true)}
                className="w-full py-4 bg-tavern-accent hover:bg-amber-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all uppercase tracking-widest"
              >
                <RefreshCw size={20} /> Jogar Novamente
              </button>
              <button
                onClick={onLeave}
                className="w-full mt-4 py-2 text-stone-500 hover:text-tavern-parchment text-sm"
              >
                Voltar para a Taverna
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};