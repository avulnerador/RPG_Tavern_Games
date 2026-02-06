import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { supabase } from '../services/supabase';
import { PlayerId, GameState, PlayerState, Die, MovePayload, JoinPayload, Grid } from '../types';
import { calculateTotalScore, calculateColumnScore, isBoardFull, MAX_DICE_PER_COLUMN, generateDieValue } from '../utils/gameLogic';
import { Dice } from './Dice';
import { Copy, RefreshCw, Beer, Scroll, LogOut } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface GameBoardProps {
  roomCode: string;
  playerName: string;
  avatarSeed: string;
  isHost: boolean;
  isOffline?: boolean;
  onLeave: () => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({ roomCode, playerName, avatarSeed, isHost, isOffline = false, onLeave }) => {
  const [myPlayerId] = useState<PlayerId>(isHost ? 'host' : 'guest');
  const [currentDiceValue, setCurrentDiceValue] = useState<number>(0);
  
  const [shakingColumns, setShakingColumns] = useState<{playerId: PlayerId, colIndex: number} | null>(null);

  const [gameState, setGameState] = useState<GameState>({
    roomCode,
    host: { id: 'host', name: playerName, grid: [[],[],[]], score: 0, avatarSeed: avatarSeed },
    guest: isOffline ? { id: 'guest', name: 'Oponente', grid: [[],[],[]], score: 0, avatarSeed: 'Gimli' } : null,
    turn: 'host',
    winner: null,
    isGameOver: false,
  });

  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (gameState.isGameOver) return;
    const isMyTurn = isOffline ? true : gameState.turn === myPlayerId;
    if (isMyTurn && currentDiceValue === 0) {
        const timer = setTimeout(() => {
            setCurrentDiceValue(generateDieValue());
        }, 800);
        return () => clearTimeout(timer);
    }
  }, [gameState.turn, myPlayerId, currentDiceValue, gameState.isGameOver, isOffline]);

  useEffect(() => {
    const channel = supabase.channel(`room_${roomCode}`);
    channelRef.current = channel;

    if (!isOffline) {
        channel
          .on('broadcast', { event: 'player_join' }, ({ payload }: { payload: JoinPayload & { avatarSeed: string } }) => {
            if (isHost && !gameState.guest) {
               setGameState(prev => ({
                 ...prev,
                 guest: { id: 'guest', name: payload.name, grid: [[],[],[]], score: 0, avatarSeed: payload.avatarSeed || payload.name }
               }));
               setTimeout(() => {
                  channel.send({
                    type: 'broadcast',
                    event: 'sync_state',
                    payload: { hostName: playerName, hostAvatarSeed: avatarSeed, currentTurn: 'host' }
                  });
               }, 500);
            }
          })
          .on('broadcast', { event: 'sync_state' }, ({ payload }: { payload: any }) => {
            if (!isHost && !gameState.guest) {
              setGameState(prev => ({
                ...prev,
                host: { ...prev.host, name: payload.hostName, avatarSeed: payload.hostAvatarSeed },
                guest: { id: 'guest', name: playerName, grid: [[],[],[]], score: 0, avatarSeed: avatarSeed },
                turn: payload.currentTurn
              }));
            }
          })
          .on('broadcast', { event: 'make_move' }, ({ payload }: { payload: MovePayload }) => {
            handleRemoteMove(payload);
          })
          .on('broadcast', { event: 'restart_game' }, () => {
            resetGame(false);
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED' && !isHost) {
                channel.send({ type: 'broadcast', event: 'player_join', payload: { name: playerName, avatarSeed: avatarSeed } });
            }
          });
    }

    return () => { supabase.removeChannel(channel); };
  }, [roomCode, isOffline, isHost, playerName, avatarSeed, gameState.guest]);

  const handleRemoteMove = (payload: MovePayload) => {
    executeMove(payload.playerId, payload.column, payload.value);
  };

  const executeMove = (playerId: PlayerId, colIndex: number, dieValue: number) => {
    const movingPlayerKey = playerId === 'host' ? 'host' : 'guest';
    const opponentPlayerKey = playerId === 'host' ? 'guest' : 'host';

    setGameState(prev => {
      const movingPlayer = prev[movingPlayerKey];
      const opponentPlayer = prev[opponentPlayerKey];
      if (!movingPlayer || !opponentPlayer) return prev; 

      const newGrid = [...movingPlayer.grid] as Grid;
      const newDie: Die = { id: uuidv4(), value: dieValue, isNew: true };
      newGrid[colIndex] = [...newGrid[colIndex], newDie];

      const opponentGrid = [...opponentPlayer.grid] as Grid;
      const opponentColumn = opponentGrid[colIndex];
      const matchingDice = opponentColumn.filter(d => d.value === dieValue);
      
      if (matchingDice.length > 0) {
        setShakingColumns({ playerId: opponentPlayerKey, colIndex });
        setTimeout(() => setShakingColumns(null), 500);
      }

      const survivingDice = opponentColumn.filter(d => d.value !== dieValue);
      opponentGrid[colIndex] = survivingDice;

      const newMovingScore = calculateTotalScore(newGrid);
      const newOpponentScore = calculateTotalScore(opponentGrid);
      const isGameOver = isBoardFull(newGrid);
      
      let winner = prev.winner;
      if (isGameOver) {
        if (newMovingScore > newOpponentScore) winner = movingPlayerKey;
        else if (newOpponentScore > newMovingScore) winner = opponentPlayerKey;
        else winner = 'draw';
      }

      return {
        ...prev,
        [movingPlayerKey]: { ...movingPlayer, grid: newGrid, score: newMovingScore },
        [opponentPlayerKey]: { ...opponentPlayer, grid: opponentGrid, score: newOpponentScore },
        turn: isGameOver ? prev.turn : opponentPlayerKey,
        isGameOver,
        winner
      };
    });

    if (isOffline || playerId === myPlayerId) {
        setCurrentDiceValue(0);
    }
  };

  const onColumnClick = (colIndex: number) => {
    if (gameState.isGameOver || currentDiceValue === 0) return;
    const activePlayerId = gameState.turn;
    if (!isOffline && activePlayerId !== myPlayerId) return;
    if (gameState[activePlayerId]?.grid[colIndex].length! >= MAX_DICE_PER_COLUMN) return;

    if (!isOffline) {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'make_move',
        payload: { column: colIndex, value: currentDiceValue, playerId: activePlayerId }
      });
    }

    executeMove(activePlayerId, colIndex, currentDiceValue);
  };

  const resetGame = (shouldBroadcast: boolean) => {
    if (shouldBroadcast && channelRef.current && !isOffline) {
      channelRef.current.send({ type: 'broadcast', event: 'restart_game' });
    }
    setGameState(prev => ({
      ...prev,
      host: { ...prev.host, grid: [[],[],[]], score: 0 },
      guest: prev.guest ? { ...prev.guest, grid: [[],[],[]], score: 0 } : null,
      turn: 'host',
      isGameOver: false,
      winner: null
    }));
    setCurrentDiceValue(0);
  };

  useEffect(() => {
    if (gameState.winner) {
         confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#fbbf24', '#92400e', '#f5f5f4'] });
    }
  }, [gameState.winner]);

  const renderPlayerSection = (player: PlayerState | null, isTop: boolean) => {
    if (!player) return (
      <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-tavern-700 rounded-2xl opacity-40 bg-tavern-800/20">
        <p className="animate-pulse text-xl text-tavern-parchment">Esperando desafiante...</p>
      </div>
    );

    const isTurn = gameState.turn === player.id;
    const isWinner = gameState.winner === player.id;
    const canInteract = isOffline ? isTurn : (!isTop && isTurn);

    return (
      <div className={`relative flex flex-col items-center p-6 rounded-2xl transition-all duration-500 ${isTurn ? 'bg-tavern-800 ring-2 ring-tavern-gold shadow-[0_0_30px_rgba(251,191,36,0.15)]' : 'bg-tavern-900/40 opacity-80'}`}>
        <div className="flex items-center gap-4 mb-4 w-full justify-between px-2">
           <div className="flex items-center gap-3">
              <motion.img 
                animate={isTurn ? { y: [0, -5, 0] } : {}}
                transition={{ repeat: Infinity, duration: 1.5 }}
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${player.avatarSeed}&backgroundColor=c0aede`} 
                alt="Avatar" 
                className={`w-14 h-14 rounded-full border-2 ${isWinner ? 'border-tavern-gold shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 'border-tavern-accent'}`}
              />
              <div className="flex flex-col">
                <span className={`font-bold text-xl leading-tight ${isWinner ? 'text-tavern-gold' : 'text-tavern-parchment'}`}>
                  {player.name}
                </span>
                <span className="text-[10px] text-stone-500 uppercase tracking-[0.2em] font-bold">{isWinner ? 'CAMPEÃO' : (isTurn ? 'SUA VEZ' : 'ESPERANDO')}</span>
              </div>
           </div>
           <motion.div 
             key={player.score}
             initial={{ scale: 1.4, color: '#fbbf24' }}
             animate={{ scale: 1, color: '#f5f5f4' }}
             className="text-5xl font-serif font-bold drop-shadow-lg"
           >
             {player.score}
           </motion.div>
        </div>

        <div className="grid grid-cols-3 gap-3 md:gap-6 bg-tavern-900/60 p-4 md:p-6 rounded-2xl border border-tavern-700 shadow-inner">
           {player.grid.map((col, i) => {
             const colScore = calculateColumnScore(col);
             const colFull = col.length >= MAX_DICE_PER_COLUMN;
             const isInteractive = canInteract && !colFull;
             const isShaking = shakingColumns?.playerId === player.id && shakingColumns?.colIndex === i;
             
             return (
               <motion.div 
                  key={i}
                  layout
                  onClick={() => isInteractive ? onColumnClick(i) : null}
                  animate={isShaking ? { x: [-5, 5, -5, 5, 0], backgroundColor: ['#451a03', '#1c1917'] } : {}}
                  transition={{ duration: 0.4 }}
                  className={`
                    w-20 md:w-28 min-h-[200px] md:min-h-[260px] 
                    flex flex-col justify-end items-center gap-4 pb-4 rounded-xl
                    transition-all duration-300 relative
                    ${isInteractive ? 'hover:bg-tavern-700/50 cursor-pointer group shadow-lg' : ''}
                    bg-tavern-800/30 border border-transparent hover:border-tavern-accent/30
                  `}
               >
                 <div className="absolute -top-1 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-tavern-gold uppercase font-bold tracking-widest">
                    {colFull ? 'CHEIO' : 'JOGAR'}
                 </div>

                 <AnimatePresence mode="popLayout">
                    {col.map((die) => (
                      <Dice key={die.id} value={die.value} isDestroyed={die.isDestroyed} isNew={die.isNew} />
                    ))}
                 </AnimatePresence>
                 
                 {Array.from({ length: Math.max(0, MAX_DICE_PER_COLUMN - col.length) }).map((_, idx) => (
                    <div key={`empty-${idx}`} className="w-14 h-14 md:w-20 md:h-20 rounded-xl border border-tavern-700/20 bg-black/5" />
                 ))}

                 <div className="mt-1 text-tavern-gold/80 text-sm font-bold border-t border-tavern-700/40 w-full text-center pt-3 font-mono">
                   {colScore > 0 ? colScore : '0'}
                 </div>
               </motion.div>
             );
           })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto p-4 md:p-10 min-h-screen">
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-10 bg-tavern-800/50 p-4 rounded-2xl border border-tavern-accent/20 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-4 text-tavern-gold">
          <Beer size={20} className="text-tavern-accent" />
          <span className="text-xs uppercase tracking-[0.2em] font-bold">{isOffline ? 'PARTIDA LOCAL' : `MESA: ${roomCode}`}</span>
          {!isOffline && (
            <button onClick={() => navigator.clipboard.writeText(roomCode)} className="hover:text-white transition-colors"><Scroll size={16} /></button>
          )}
        </div>
        <button onClick={onLeave} className="text-xs uppercase tracking-widest text-stone-500 hover:text-tavern-gold transition-colors font-bold flex items-center gap-2">
           <LogOut size={14} /> Sair da Mesa
        </button>
      </div>

      {/* Opponent View */}
      <div className="w-full mb-8 transform rotate-180 md:rotate-0">
         {renderPlayerSection(gameState.guest, true)}
      </div>

      {/* Central Area: The Roll */}
      <div className="my-8 flex items-center justify-center gap-16 relative h-28 w-full">
         {gameState.isGameOver ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute z-20 bg-tavern-800 border-4 border-tavern-gold p-8 rounded-3xl flex flex-col items-center text-center shadow-[0_0_60px_rgba(0,0,0,0.8)]"
            >
                <div className="text-4xl font-serif font-bold mb-1 text-tavern-gold tracking-tighter">
                  FIM DA APOSTA
                </div>
                <p className="mb-8 text-tavern-parchment font-serif italic text-xl">
                    Vencedor: <span className="text-white font-bold">{gameState.winner === 'host' ? gameState.host.name : (gameState.winner === 'guest' ? gameState.guest?.name : 'Empate de Sangue')}</span>
                </p>
                <button 
                  onClick={() => resetGame(true)}
                  className="flex items-center gap-3 bg-tavern-gold hover:bg-yellow-600 text-tavern-900 font-bold py-4 px-12 rounded-full transition-all hover:scale-110 active:scale-95 shadow-[0_10px_0_#92400e]"
                >
                  <RefreshCw size={22} /> Novo Jogo
                </button>
            </motion.div>
         ) : (
            <>
               <div className="flex flex-col items-center gap-3">
                 <span className="text-[11px] text-tavern-gold/60 uppercase tracking-[0.4em] font-bold">O Dado Atual</span>
                 <AnimatePresence mode="wait">
                    {currentDiceValue > 0 ? (
                      <motion.div 
                        key={currentDiceValue}
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="filter drop-shadow-[0_0_20px_rgba(251,191,36,0.4)]"
                      >
                        <Dice value={currentDiceValue} size="lg" />
                      </motion.div>
                    ) : (
                      <div className="w-28 h-28 border-4 border-dashed border-tavern-accent/30 rounded-3xl flex items-center justify-center">
                        <motion.div animate={{ opacity: [0.1, 0.4, 0.1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-6 h-6 bg-tavern-accent/20 rounded-full" />
                      </div>
                    )}
                 </AnimatePresence>
               </div>

               <div className="hidden md:flex flex-col items-center bg-tavern-900/40 p-6 rounded-2xl border border-tavern-accent/10">
                  <motion.div 
                    animate={{ scale: [1, 1.05, 1] }} 
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="text-3xl font-serif font-bold text-tavern-gold tracking-widest uppercase"
                  >
                    {gameState.turn === 'host' ? gameState.host.name : (gameState.guest?.name || '...')}
                  </motion.div>
                  <span className="text-[10px] text-stone-500 tracking-[0.6em] font-bold">ESTÁ JOGANDO</span>
               </div>
            </>
         )}
      </div>

      {/* Player View */}
      <div className="w-full">
         {renderPlayerSection(gameState.host, false)}
      </div>
    </div>
  );
};