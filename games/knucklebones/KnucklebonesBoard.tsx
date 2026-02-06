import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Beer, LogOut, RefreshCw, Scroll, Trophy } from 'lucide-react';

import { useKnucklebonesGame } from './hooks/useKnucklebonesGame';
import { PlayerSidebar } from './components/PlayerSidebar';
import { GameGrid } from './components/GameGrid';
import { LobbyOverlay } from './components/LobbyOverlay';
import { CoinFlipOverlay } from './components/CoinFlipOverlay';
import { DisconnectOverlay } from './components/DisconnectOverlay';

interface GameBoardProps {
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

export const KnucklebonesBoard: React.FC<GameBoardProps> = ({
  roomCode,
  playerName,
  avatarSeed,
  isHost,
  isOffline = false,
  stake = 0,
  myCoins,
  onUpdateCoins,
  onLeave
}) => {
  const {
    gameState,
    myPlayerId,
    currentDiceValue,
    opponentDiceValue,
    shakingColumns,
    onColumnClick,
    resetGame,

    startGame
  } = useKnucklebonesGame(roomCode, playerName, avatarSeed, isHost, isOffline, stake, myCoins, onUpdateCoins);

  // Confetti effect on win
  useEffect(() => {
    if (gameState.winner) {
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 }, colors: ['#fbbf24', '#92400e', '#f5f5f4'] });
    }
  }, [gameState.winner]);

  // Derived helpers
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
              {!isOffline && <button onClick={() => navigator.clipboard.writeText(roomCode)} className="text-tavern-accent hover:text-white"><Scroll size={14} /></button>}
            </div>
          </div>
          {stake > 0 && (
            <div className="pl-3 border-l border-tavern-gold/20 flex flex-col items-center">
              <span className="text-[10px] uppercase text-stone-500 font-bold">Aposta</span>
              <span className="text-lg font-bold text-tavern-gold flex items-center gap-1"><span className="text-xs">💰</span> {stake}</span>
            </div>
          )}
          <div className="pl-3 border-l border-tavern-gold/20 flex flex-col items-center">
            <span className="text-[10px] uppercase text-stone-500 font-bold">Sua Bolsa</span>
            <span className="text-lg font-bold text-tavern-parchment flex items-center gap-1"><span className="text-xs">💰</span> {myCoins}</span>
          </div>
        </div>
        <button onClick={onLeave} className="bg-tavern-900/90 backdrop-blur border border-red-900/30 px-4 py-2 rounded-xl shadow-xl pointer-events-auto text-stone-500 hover:text-red-400 flex items-center gap-2 transition-colors">
          <LogOut size={18} /> <span className="text-xs font-bold uppercase hidden md:inline">Sair</span>
        </button>
      </div>

      {/* MAIN GAME LAYOUT */}
      <div className="flex-grow flex items-center justify-center w-full relative">

        {/* Status Overlays */}
        <AnimatePresence>
          {gameState.gameStatus === 'waiting' && (
            <LobbyOverlay roomCode={roomCode} onLeave={onLeave} />
          )}

          {(gameState.gameStatus === 'ready_to_start' || gameState.gameStatus === 'deciding') && (
            <CoinFlipOverlay
              isHost={isHost}
              onStartGame={startGame}
              winnerName={gameState.gameStatus === 'deciding' ? (gameState.turn === 'host' ? gameState.host.name : gameState.guest?.name) : undefined}
            />
          )}

          {gameState.gameStatus === 'disconnected' && (
            <DisconnectOverlay
              opponentName={gameState.guest?.name === playerName ? gameState.host.name : gameState.guest?.name}
              onReturnToHub={onLeave}
            />
          )}

          {gameState.isGameOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            >
              <div className="bg-tavern-800 border-4 border-tavern-gold p-8 rounded-3xl text-center shadow-2xl max-w-sm w-full relative overflow-hidden">
                {/* Background FX */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-20 pointer-events-none"></div>

                <div className="relative z-10">
                  <Trophy size={56} className="text-tavern-gold mx-auto mb-4 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />

                  <h2 className="text-3xl font-serif font-bold text-tavern-parchment mb-1 uppercase tracking-wider">
                    {gameState.winner === 'draw' ? 'Empate!' : (gameState.winner === myPlayerId ? 'Vitória!' : 'Derrota!')}
                  </h2>

                  <p className="text-stone-400 italic mb-6 text-sm">
                    {gameState.winner === 'draw'
                      ? 'Os deuses não favoreceram ninguém hoje.'
                      : (gameState.winner === myPlayerId
                        ? 'Sua astúcia superou a sorte.'
                        : 'A sorte virou as costas para você.')}
                  </p>

                  <div className="text-2xl font-serif text-tavern-gold mb-6 border-b border-white/10 pb-4">
                    {gameState.host.score} - {gameState.guest?.score}
                  </div>

                  {/* Financial Result */}
                  {stake > 0 && (
                    <div className="mb-8 bg-black/40 p-4 rounded-xl border border-tavern-gold/20">
                      <span className="text-[10px] uppercase font-bold text-stone-500 block mb-1">Resultado da Aposta</span>
                      <div className={`text-2xl font-bold flex items-center justify-center gap-2 ${gameState.winner === myPlayerId ? 'text-green-400' : (gameState.winner === 'draw' ? 'text-stone-300' : 'text-red-400')
                        }`}>
                        {gameState.winner === myPlayerId && '+'}{gameState.winner === 'draw' ? '0' : (gameState.winner === myPlayerId ? stake : -stake)} <span className="text-xs text-tavern-gold">MOEDAS</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <button
                      onClick={() => resetGame(true)}
                      className="w-full py-4 bg-tavern-accent hover:bg-amber-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all uppercase tracking-widest border border-tavern-accent shadow-lg active:scale-95"
                    >
                      <RefreshCw size={20} /> Jogar Novamente
                    </button>

                    <button
                      onClick={onLeave}
                      className="w-full py-3 bg-transparent hover:bg-white/5 text-stone-500 hover:text-tavern-parchment rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-xs uppercase tracking-widest border border-transparent hover:border-white/10"
                    >
                      <LogOut size={16} /> Voltar para a Taverna
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
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
              onColumnClick={() => { }}
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
            diceValue={opponentDiceValue}
            isGameOver={gameState.isGameOver}
          />

        </div>
      </div>

      <AnimatePresence>
        {gameState.isGameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <div className="bg-tavern-800 border-4 border-tavern-gold p-8 rounded-3xl text-center shadow-2xl max-w-sm w-full relative overflow-hidden">
              {/* Background FX */}
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-20 pointer-events-none"></div>

              <div className="relative z-10">
                <Trophy size={56} className="text-tavern-gold mx-auto mb-4 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />

                <h2 className="text-3xl font-serif font-bold text-tavern-parchment mb-1 uppercase tracking-wider">
                  {gameState.winner === 'draw' ? 'Empate!' : (gameState.winner === myPlayerId ? 'Vitória!' : 'Derrota!')}
                </h2>

                <p className="text-stone-400 italic mb-6 text-sm">
                  {gameState.winner === 'draw'
                    ? 'Os deuses não favoreceram ninguém hoje.'
                    : (gameState.winner === myPlayerId
                      ? 'Sua astúcia superou a sorte.'
                      : 'A sorte virou as costas para você.')}
                </p>

                {/* Financial Result */}
                {stake > 0 && (
                  <div className="mb-8 bg-black/40 p-4 rounded-xl border border-tavern-gold/20">
                    <span className="text-[10px] uppercase font-bold text-stone-500 block mb-1">Resultado da Aposta</span>
                    <div className={`text-2xl font-bold flex items-center justify-center gap-2 ${gameState.winner === myPlayerId ? 'text-green-400' : (gameState.winner === 'draw' ? 'text-stone-300' : 'text-red-400')
                      }`}>
                      {gameState.winner === myPlayerId && '+'}{gameState.winner === 'draw' ? '0' : (gameState.winner === myPlayerId ? stake : -stake)} <span className="text-xs text-tavern-gold">MOEDAS</span>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    onClick={() => resetGame(true)}
                    className="w-full py-4 bg-tavern-accent hover:bg-amber-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all uppercase tracking-widest border border-tavern-accent shadow-lg active:scale-95"
                  >
                    <RefreshCw size={20} /> Jogar Novamente
                  </button>

                  <button
                    onClick={onLeave}
                    className="w-full py-3 bg-transparent hover:bg-white/5 text-stone-500 hover:text-tavern-parchment rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-xs uppercase tracking-widest border border-transparent hover:border-white/10"
                  >
                    <LogOut size={16} /> Voltar para a Taverna
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};