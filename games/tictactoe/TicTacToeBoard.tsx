import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Snowflake, RefreshCw, LogOut, Shield } from 'lucide-react';
import confetti from 'canvas-confetti';
import { PlayerId } from '../../types';

interface TicTacToeBoardProps {
  roomCode: string;
  playerName: string;
  avatarSeed: string;
  isHost: boolean;
  isOffline?: boolean;
  onLeave: () => void;
}

type CellValue = 'X' | 'O' | null;

export const TicTacToeBoard: React.FC<TicTacToeBoardProps> = ({ roomCode, playerName, avatarSeed, isHost, isOffline, onLeave }) => {
  const [board, setBoard] = useState<CellValue[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true); // Host is X (Fire), Guest is O (Ice)
  const [winner, setWinner] = useState<CellValue | 'Draw' | null>(null);

  // Simple Offline Logic for now
  const handleCellClick = (index: number) => {
    if (board[index] || winner) return;

    // Turn validation (only relevant if we add online logic later, for now local pass-and-play or simple AI)
    // For local play in this demo:
    const newBoard = [...board];
    newBoard[index] = isXNext ? 'X' : 'O';
    setBoard(newBoard);
    setIsXNext(!isXNext);
  };

  useEffect(() => {
    checkWinner(board);
  }, [board]);

  const checkWinner = (currentBoard: CellValue[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
      [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
        setWinner(currentBoard[a]);
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: currentBoard[a] === 'X' ? ['#f59e0b', '#dc2626'] : ['#3b82f6', '#06b6d4'] });
        return;
      }
    }

    if (!currentBoard.includes(null)) {
      setWinner('Draw');
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
  };

  const renderCell = (i: number) => {
    const value = board[i];
    return (
      <motion.button
        whileHover={!value && !winner ? { scale: 0.95, backgroundColor: 'rgba(41, 37, 36, 0.8)' } : {}}
        whileTap={!value && !winner ? { scale: 0.9 } : {}}
        onClick={() => handleCellClick(i)}
        className="h-24 w-24 md:h-32 md:w-32 bg-tavern-900 border-4 border-tavern-700 rounded-xl flex items-center justify-center relative overflow-hidden shadow-inner group"
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
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {/* Header */}
      <div className="w-full max-w-lg flex justify-between items-center mb-8 bg-tavern-800/80 p-4 rounded-2xl border border-tavern-accent/30 backdrop-blur-md">
        <div className="flex items-center gap-2">
            <Shield className="text-tavern-gold" />
            <span className="text-tavern-parchment font-bold uppercase tracking-widest text-sm">Duelo de Grimórios</span>
        </div>
        <button onClick={onLeave} className="text-xs font-bold text-stone-500 hover:text-tavern-gold flex items-center gap-2 transition-colors">
            <LogOut size={16} /> Sair
        </button>
      </div>

      <div className="relative">
        {/* Game Board */}
        <div className="grid grid-cols-3 gap-3 bg-tavern-800 p-4 rounded-2xl border-2 border-tavern-accent shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            {[0,1,2,3,4,5,6,7,8].map(i => (
                <div key={i}>{renderCell(i)}</div>
            ))}
        </div>

        {/* Turn Indicator */}
        {!winner && (
            <div className="mt-8 flex justify-center items-center gap-4">
                <div className={`flex items-center gap-2 px-6 py-3 rounded-full border-2 transition-all ${isXNext ? 'bg-orange-900/40 border-orange-500 text-orange-200 shadow-[0_0_15px_rgba(249,115,22,0.3)]' : 'bg-tavern-900 border-tavern-700 text-stone-600 opacity-50'}`}>
                    <Flame size={18} />
                    <span className="font-bold uppercase tracking-widest text-xs">Fogo</span>
                </div>
                <div className="text-stone-600 font-serif italic">vs</div>
                <div className={`flex items-center gap-2 px-6 py-3 rounded-full border-2 transition-all ${!isXNext ? 'bg-cyan-900/40 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'bg-tavern-900 border-tavern-700 text-stone-600 opacity-50'}`}>
                    <span className="font-bold uppercase tracking-widest text-xs">Gelo</span>
                    <Snowflake size={18} />
                </div>
            </div>
        )}
      </div>

      {/* Winner Overlay */}
      <AnimatePresence>
        {winner && (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            >
                <div className="bg-tavern-800 border-4 border-tavern-gold p-8 rounded-3xl text-center shadow-2xl max-w-sm w-full mx-4">
                    <h2 className="text-3xl font-serif font-bold text-tavern-gold mb-2 uppercase">
                        {winner === 'Draw' ? 'Empate Místico!' : `${winner === 'X' ? 'Fogo' : 'Gelo'} Venceu!`}
                    </h2>
                    <p className="text-stone-400 italic mb-8">As runas decidiram o destino.</p>
                    <button 
                        onClick={resetGame}
                        className="w-full py-4 bg-tavern-accent hover:bg-amber-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
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