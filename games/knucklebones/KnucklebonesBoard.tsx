import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { supabase } from '../../services/supabase';
import { PlayerId, GameState, PlayerState, Die, MovePayload, JoinPayload, Grid } from '../../types';
import { calculateTotalScore, calculateColumnScore, isBoardFull, MAX_DICE_PER_COLUMN, generateDieValue } from './logic';
import { Dice } from '../../components/Dice';
import { RefreshCw, Beer, Scroll, LogOut, Trophy, Swords, Crown, HelpCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// --- COMPONENTES VISUAIS ---

const PlayerSidebar = ({ 
    player, 
    isLeft, 
    isActive, 
    isWinner, 
    diceValue,
    isGameOver 
}: { 
    player: PlayerState | null, 
    isLeft: boolean, 
    isActive: boolean, 
    isWinner: boolean, 
    diceValue: number,
    isGameOver: boolean
}) => {
    if (!player) return (
      <div className="w-48 h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-tavern-700/30 rounded-3xl opacity-30">
        <p className="animate-pulse text-tavern-parchment text-center">Esperando...</p>
      </div>
    );

    // Esquerda: Avatar embaixo, Dado em cima (alinhado com Grid de Baixo)
    // Direita: Avatar em cima, Dado embaixo (alinhado com Grid de Cima)
    // Mas no design pedido: Esquerda (Eu) = Perfil Baixo / Direita (Inimigo) = Perfil Baixo também? 
    // O pedido foi: "eu da esquerda e o outro na direita, eu em baixo ele em cima"
    // Esquerda: Alinha Base. Direita: Alinha Topo.
    
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
                 <div className="absolute -top-6 -right-2 text-tavern-gold drop-shadow-lg"><Crown size={40} fill="currentColor"/></div>
              )}
            </div>
            <h2 className={`text-xl font-bold font-serif leading-none text-center ${isWinner ? 'text-tavern-gold' : 'text-tavern-parchment'}`}>{player.name}</h2>
            <div className="text-5xl font-bold font-serif mt-1 text-white drop-shadow-md">{player.score}</div>
        </div>
    );

    // Área do Dado
    const showDice = isActive && !isGameOver;
    // Se for oponente (Right), mostramos um icone de "Pensando" ou dado misterioso se for a vez dele
    const isOpponentThinking = !isLeft && isActive && !isGameOver;
    const myDiceVisible = isLeft && isActive && diceValue > 0 && !isGameOver;

    const DiceSection = (
         <div className={`h-32 w-32 flex flex-col items-center justify-center relative ${isLeft ? 'order-1 mb-8' : 'order-2 mt-8'}`}>
            {showDice ? (
                <>
                    <div className="absolute inset-0 bg-tavern-gold/5 blur-xl rounded-full animate-pulse-slow"></div>
                    
                    {/* MEU DADO (Esquerda) */}
                    {isLeft && (
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
                                <RefreshCw size={40} className="text-tavern-gold animate-spin-slow opacity-50" />
                            )}
                        </AnimatePresence>
                    )}

                    {/* DADO OPONENTE (Direita - Simulado) */}
                    {isOpponentThinking && (
                         <motion.div 
                            animate={{ y: [0, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="w-24 h-24 bg-tavern-800/80 rounded-2xl border-4 border-tavern-gold/30 flex items-center justify-center"
                         >
                            <HelpCircle size={32} className="text-tavern-gold animate-pulse" />
                         </motion.div>
                    )}
                    
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

const GameGrid = ({ 
    player, 
    isTop, 
    isActive, 
    canInteract, 
    onColumnClick, 
    shakingColIndex 
}: { 
    player: PlayerState | null, 
    isTop: boolean, 
    isActive: boolean, 
    canInteract: boolean, 
    onColumnClick: (idx: number) => void, 
    shakingColIndex: number | null 
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

                            {/* Dice Stack - Renderização Direta sem AnimatePresence de Layout para evitar pulos */}
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

// --- COMPONENTE PRINCIPAL ---

interface GameBoardProps {
  roomCode: string;
  playerName: string;
  avatarSeed: string;
  isHost: boolean;
  isOffline?: boolean;
  onLeave: () => void;
}

export const KnucklebonesBoard: React.FC<GameBoardProps> = ({ roomCode, playerName, avatarSeed, isHost, isOffline = false, onLeave }) => {
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
    
    // Check local permission
    if (!isOffline && activePlayerId !== myPlayerId) return;

    // Check full column
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
         confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 }, colors: ['#fbbf24', '#92400e', '#f5f5f4'] });
    }
  }, [gameState.winner]);

  // --- PREPARAÇÃO PARA RENDERIZAÇÃO ---
  
  // Define quem é "Local" e quem é "Oponente" baseado no ID do jogador
  const localPlayer = gameState[myPlayerId];
  const opponentId = myPlayerId === 'host' ? 'guest' : 'host';
  const opponentPlayer = gameState[opponentId];

  return (
    <div className="h-screen w-full bg-stone-950 flex flex-col overflow-hidden relative">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-wood.png')] opacity-20 pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 pointer-events-none"></div>
      
      {/* HEADER ABSOLUTE TOP */}
      <div className="absolute top-0 left-0 right-0 p-4 z-50 pointer-events-none flex justify-between items-start">
         <div className="bg-tavern-900/90 backdrop-blur border border-tavern-gold/20 px-4 py-2 rounded-xl shadow-xl pointer-events-auto flex items-center gap-3">
             <Beer size={18} className="text-tavern-gold" />
             <div>
                <h1 className="text-xs uppercase tracking-widest text-stone-400 font-bold leading-none">Mesa</h1>
                <div className="flex items-center gap-2">
                    <span className="text-lg font-serif font-bold text-tavern-parchment">{roomCode}</span>
                    {!isOffline && <button onClick={() => navigator.clipboard.writeText(roomCode)} className="text-tavern-accent hover:text-white"><Scroll size={14}/></button>}
                </div>
             </div>
         </div>
         <button onClick={onLeave} className="bg-tavern-900/90 backdrop-blur border border-red-900/30 px-4 py-2 rounded-xl shadow-xl pointer-events-auto text-stone-500 hover:text-red-400 flex items-center gap-2 transition-colors">
            <LogOut size={18} /> <span className="text-xs font-bold uppercase hidden md:inline">Sair</span>
         </button>
      </div>

      {/* MAIN GAME LAYOUT */}
      <div className="flex-grow flex items-center justify-center w-full relative">
        
        {/* Game Over Overlay */}
        <AnimatePresence>
            {gameState.isGameOver && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-tavern-800 border-4 border-tavern-gold p-12 rounded-3xl flex flex-col items-center text-center shadow-2xl max-w-2xl"
                    >
                        <Trophy size={64} className="text-tavern-gold mb-6" />
                        <h2 className="text-4xl font-serif font-bold text-white mb-2 tracking-wide uppercase">
                            {gameState.winner === 'draw' ? 'Empate!' : `${gameState.winner === 'host' ? gameState.host.name : gameState.guest?.name} Venceu!`}
                        </h2>
                        <div className="text-2xl font-serif text-tavern-gold mb-8">
                            {gameState.host.score} - {gameState.guest?.score}
                        </div>
                        <button 
                            onClick={() => resetGame(true)}
                            className="bg-tavern-accent hover:bg-amber-800 text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest flex items-center gap-3 shadow-lg transition-transform hover:scale-105"
                        >
                            <RefreshCw size={20}/> Jogar Novamente
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

        {/* The Layout Container */}
        <div className="flex flex-row items-center justify-center gap-2 md:gap-8 h-full max-h-[800px] w-full px-2">
            
            {/* ESQUERDA: JOGADOR LOCAL */}
            <PlayerSidebar 
                player={localPlayer} 
                isLeft={true} 
                isActive={gameState.turn === myPlayerId}
                isWinner={gameState.winner === myPlayerId}
                diceValue={currentDiceValue}
                isGameOver={gameState.isGameOver}
            />

            {/* CENTRO: TABULEIROS */}
            <div className="flex flex-col items-center justify-center gap-4 relative">
                
                {/* Grid Oponente (Topo) */}
                <GameGrid 
                    player={opponentPlayer} 
                    isTop={true} 
                    isActive={gameState.turn === opponentId}
                    canInteract={false}
                    onColumnClick={() => {}} 
                    shakingColIndex={shakingColumns?.playerId === opponentId ? shakingColumns.colIndex : null}
                />

                {/* Divisor */}
                <div className="w-full h-1 bg-white/10 relative flex justify-center items-center my-1">
                    <div className="bg-stone-900 px-4 py-1 border border-white/10 rounded-full flex items-center gap-2 shadow-lg z-10">
                        <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">vs</span>
                    </div>
                </div>

                {/* Grid Local (Baixo) */}
                <GameGrid 
                    player={localPlayer} 
                    isTop={false} 
                    isActive={gameState.turn === myPlayerId}
                    canInteract={!gameState.isGameOver && (isOffline || myPlayerId === gameState.turn)}
                    onColumnClick={onColumnClick} 
                    shakingColIndex={shakingColumns?.playerId === myPlayerId ? shakingColumns.colIndex : null}
                />

            </div>

            {/* DIREITA: OPONENTE */}
            <PlayerSidebar 
                player={opponentPlayer} 
                isLeft={false} 
                isActive={gameState.turn === opponentId}
                isWinner={gameState.winner === opponentId}
                diceValue={0} 
                isGameOver={gameState.isGameOver}
            />

        </div>
      </div>

    </div>
  );
};