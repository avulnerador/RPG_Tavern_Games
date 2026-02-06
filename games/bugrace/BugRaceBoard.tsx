import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, Rat, Shell, Coins, Trophy, Play, RefreshCw, LogOut, Skull, Zap, Users, Crown, CircleDollarSign, PlusCircle, Scroll } from 'lucide-react';
import confetti from 'canvas-confetti';
import { supabase } from '../../services/supabase';

interface BugRaceBoardProps {
  roomCode: string;
  isHost: boolean;
  playerName: string;
  avatarSeed: string;
  onLeave: () => void;
}

// --- CONFIGURAÇÃO E DADOS DOS CORREDORES ---

interface BugData {
  id: string;
  name: string;
  color: string;
  icon: React.ReactNode;
  baseSpeed: number;    
  volatility: number;   
  description: string;
}

const BUG_ROSTER: BugData[] = [
  { 
    id: 'tank', 
    name: 'Tanque', 
    color: 'text-emerald-500', 
    icon: <Shell size={28} />, 
    baseSpeed: 0.38, 
    volatility: 0.05, 
    description: 'Lento e constante.'
  },
  { 
    id: 'speedster', 
    name: 'Barata Turbo', 
    color: 'text-amber-600', 
    icon: <Bug size={28} />, 
    baseSpeed: 0.55, 
    volatility: 0.8, 
    description: 'Rápida e caótica.'
  },
  { 
    id: 'void', 
    name: 'Vazio', 
    color: 'text-purple-500', 
    icon: <Rat size={28} />, 
    baseSpeed: 0.42, 
    volatility: 0.3, 
    description: 'Sombrio e imprevisível.'
  },
  { 
    id: 'golden', 
    name: 'Realeza', 
    color: 'text-yellow-400', 
    icon: <Bug size={28} className="rotate-90" />, 
    baseSpeed: 0.45, 
    volatility: 0.2, 
    description: 'Equilibrado.'
  }
];

type BugStatus = 'running' | 'sleeping' | 'boosting';

interface RacerState {
  id: string;
  position: number; // 0 a 100
  status: BugStatus;
}

interface PlayerBet {
  playerId: string;
  name: string;
  avatarSeed: string;
  coins: number;
  betAmount: number;
  betBugId: string | null;
  isHost: boolean;
  lastResult?: number; // Para mostrar na tela de resultados (+20, -10)
}

// Apostas simuladas (NPCs)
interface NpcBet {
    bugId: string;
    amount: number;
}

type RacePhase = 'betting' | 'racing' | 'results';

export const BugRaceBoard: React.FC<BugRaceBoardProps> = ({ roomCode, isHost, playerName, avatarSeed, onLeave }) => {
  // --- STATE ---
  const [phase, setPhase] = useState<RacePhase>('betting');
  const [myId] = useState(isHost ? 'host' : `guest_${Math.random().toString(36).substr(2, 5)}`);
  
  // Estado Local
  const [myCoins, setMyCoins] = useState(100);
  const [myBetAmount, setMyBetAmount] = useState(10);
  const [mySelectedBug, setMySelectedBug] = useState<string | null>(null);

  // Estado Compartilhado
  const [players, setPlayers] = useState<PlayerBet[]>([]);
  const [npcBets, setNpcBets] = useState<NpcBet[]>([]); // Apostas da casa

  // Estado da Corrida
  const [racers, setRacers] = useState<RacerState[]>(
    BUG_ROSTER.map(b => ({ id: b.id, position: 0, status: 'running' }))
  );
  
  const [commentary, setCommentary] = useState("Apostas abertas!");
  const [winnerId, setWinnerId] = useState<string | null>(null);

  const channelRef = useRef<any>(null);
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // --- SUPABASE & NETWORK ---

  useEffect(() => {
    const channel = supabase.channel(`bugrace_${roomCode}`);
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'player_join' }, ({ payload }: { payload: PlayerBet }) => {
        setPlayers(prev => {
          if (prev.find(p => p.playerId === payload.playerId)) return prev;
          const newPlayers = [...prev, payload];
          if (isHost) {
            setTimeout(() => {
                channel.send({ 
                    type: 'broadcast', 
                    event: 'sync_lobby', 
                    payload: { players: newPlayers, phase, racers, npcBets } 
                });
            }, 500);
          }
          return newPlayers;
        });
      })
      .on('broadcast', { event: 'sync_lobby' }, ({ payload }: { payload: any }) => {
        setPlayers(payload.players);
        setPhase(payload.phase);
        setNpcBets(payload.npcBets || []);
        if (payload.phase === 'racing') {
            setRacers(payload.racers);
        }
      })
      .on('broadcast', { event: 'update_bet' }, ({ payload }: { payload: { playerId: string, betBugId: string, betAmount: number, coins: number } }) => {
        setPlayers(prev => prev.map(p => 
            p.playerId === payload.playerId 
            ? { ...p, betBugId: payload.betBugId, betAmount: payload.betAmount, coins: payload.coins } 
            : p
        ));
      })
      .on('broadcast', { event: 'update_npc_bets' }, ({ payload }: { payload: NpcBet[] }) => {
        setNpcBets(payload);
      })
      .on('broadcast', { event: 'start_race' }, () => {
        setPhase('racing');
        setCommentary("PORTÕES ABERTOS! ELES CORREM!");
      })
      .on('broadcast', { event: 'race_tick' }, ({ payload }: { payload: { racers: RacerState[], comment: string } }) => {
        if (!isHost) {
            setRacers(payload.racers);
            setCommentary(payload.comment);
        }
      })
      .on('broadcast', { event: 'race_finish' }, ({ payload }: { payload: { winnerId: string } }) => {
        setPhase('results');
        setWinnerId(payload.winnerId);
        handleEndGame(payload.winnerId);
      })
      .on('broadcast', { event: 'reset_game' }, () => {
          handleResetLocal();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
           const myProfile: PlayerBet = {
             playerId: myId,
             name: playerName,
             avatarSeed,
             coins: myCoins,
             betAmount: 10,
             betBugId: null,
             isHost
           };
           channel.send({ type: 'broadcast', event: 'player_join', payload: myProfile });
           
           setPlayers(prev => {
             if (prev.find(p => p.playerId === myId)) return prev;
             return [...prev, myProfile];
           });
        }
      });

    return () => {
        if (channel) supabase.removeChannel(channel);
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // --- LÓGICA DO JOGADOR ---

  const handleBetChange = (bugId: string) => {
    if (phase !== 'betting') return;
    setMySelectedBug(bugId);
    broadcastBet(bugId, myBetAmount);
  };

  const handleAmountChange = (amount: number) => {
    if (phase !== 'betting') return;
    setMyBetAmount(amount);
    if (mySelectedBug) {
        broadcastBet(mySelectedBug, amount);
    }
  };

  const broadcastBet = (bugId: string, amount: number) => {
    if (channelRef.current) {
        channelRef.current.send({
            type: 'broadcast',
            event: 'update_bet',
            payload: { playerId: myId, betBugId: bugId, betAmount: amount, coins: myCoins }
        });
        setPlayers(prev => prev.map(p => 
            p.playerId === myId ? { ...p, betBugId: bugId, betAmount: amount } : p
        ));
    }
  };

  const handleEndGame = (wId: string) => {
     // Cálculo de resultado local
     let resultDelta = 0;
     const winData = BUG_ROSTER.find(b => b.id === wId);

     if (mySelectedBug === wId) {
        const winnings = myBetAmount * 2;
        resultDelta = winnings;
        setMyCoins(prev => prev + winnings);
        setCommentary(`VITÓRIA! ${winData?.name} venceu!`);
        confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
     } else {
        resultDelta = -myBetAmount;
        setMyCoins(prev => prev - myBetAmount);
        setCommentary(`${winData?.name} venceu.`);
     }
     
     // Atualiza lista localmente e remotamente com o resultado da última rodada para exibir na tabela
     if (channelRef.current) {
         const newCoins = mySelectedBug === wId ? myCoins + (myBetAmount * 2) : myCoins - myBetAmount;
         
         // Atualizamos 'players' localmente primeiro para mostrar o resultado imediato na UI
         setPlayers(prev => prev.map(p => 
            p.playerId === myId 
            ? { ...p, coins: newCoins, lastResult: resultDelta } 
            : p
         ));

         channelRef.current.send({
            type: 'broadcast',
            event: 'update_bet', // Reusando update_bet para sync final
            payload: { playerId: myId, betBugId: mySelectedBug, betAmount: myBetAmount, coins: newCoins }
         });
     }
  };

  const handleResetLocal = () => {
      setPhase('betting');
      setWinnerId(null);
      setMySelectedBug(null);
      setRacers(BUG_ROSTER.map(b => ({ id: b.id, position: 0, status: 'running' })));
      setNpcBets([]);
      setCommentary("Novas apostas! Quem tem coragem?");
      // Resetar lastResult visual
      setPlayers(prev => prev.map(p => ({ ...p, betBugId: null, lastResult: undefined })));
  };

  // --- LÓGICA DO MESTRE ---

  const handleAddNpcBets = () => {
      if (!isHost) return;
      // Adiciona apostas aleatórias (1 a 3 apostas de 10 a 50 moedas)
      const newNpcBets = [...npcBets];
      const numBets = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < numBets; i++) {
          const randomBug = BUG_ROSTER[Math.floor(Math.random() * BUG_ROSTER.length)];
          const amount = Math.floor(Math.random() * 5 + 1) * 10;
          newNpcBets.push({ bugId: randomBug.id, amount });
      }
      
      setNpcBets(newNpcBets);
      channelRef.current?.send({ type: 'broadcast', event: 'update_npc_bets', payload: newNpcBets });
  };

  const startRaceHost = () => {
    if (!isHost) return;
    setPhase('racing');
    setWinnerId(null);
    setRacers(BUG_ROSTER.map(b => ({ id: b.id, position: 0, status: 'running' })));
    channelRef.current.send({ type: 'broadcast', event: 'start_race' });
  };

  const resetGameHost = () => {
      if (!isHost) return;
      channelRef.current.send({ type: 'broadcast', event: 'reset_game' });
      handleResetLocal();
  };

  // --- FÍSICA DA CORRIDA (HOST) ---
  const racersRef = useRef(BUG_ROSTER.map(b => ({ id: b.id, position: 0, status: 'running' as BugStatus })));
  const isRacingRef = useRef(false);

  useEffect(() => {
      isRacingRef.current = (phase === 'racing');
      if (phase === 'racing' && isHost) {
           racersRef.current = BUG_ROSTER.map(b => ({ id: b.id, position: 0, status: 'running' }));
           requestRef.current = requestAnimationFrame(hostGameLoopRef);
      }
  }, [phase, isHost]);

  const hostGameLoopRef = (time: number) => {
      if (!isRacingRef.current) return;

      const updatedRacers = racersRef.current.map(racer => {
        const stats = BUG_ROSTER.find(b => b.id === racer.id)!;
        let newStatus = racer.status;
        const eventRoll = Math.random();

        // Lógica de Estado
        if (racer.status === 'running') {
            const sleepChance = 0.005 + (0.02 * stats.volatility); 
            if (eventRoll < sleepChance) newStatus = 'sleeping';
            else if (eventRoll > (1 - (0.005 + (0.01 * stats.volatility)))) newStatus = 'boosting';
        } else if (racer.status === 'sleeping') {
            if (Math.random() < 0.03) newStatus = 'running';
        } else if (racer.status === 'boosting') {
            if (Math.random() < 0.08) newStatus = 'running';
        }

        // Movimento
        let move = 0;
        const GLOBAL_SPEED = 0.35; 
        if (newStatus === 'running') {
            const variance = 0.8 + (Math.random() * 0.4); 
            move = stats.baseSpeed * variance * GLOBAL_SPEED;
        } else if (newStatus === 'boosting') {
            move = stats.baseSpeed * 2.5 * GLOBAL_SPEED;
        }

        // Catch-up
        const leaderPos = Math.max(...racersRef.current.map(r => r.position));
        if (leaderPos - racer.position > 25 && newStatus !== 'sleeping') {
             move *= 1.2;
        }

        return { ...racer, position: racer.position + move, status: newStatus };
      });

      racersRef.current = updatedRacers;
      
      channelRef.current?.send({ 
          type: 'broadcast', 
          event: 'race_tick', 
          payload: { 
              racers: updatedRacers,
              comment: generateHostCommentary(updatedRacers)
          } 
      });

      setRacers(updatedRacers);

      const winner = updatedRacers.find(r => r.position >= 100);
      if (winner) {
          isRacingRef.current = false;
          channelRef.current?.send({ type: 'broadcast', event: 'race_finish', payload: { winnerId: winner.id } });
          setPhase('results');
          setWinnerId(winner.id);
          handleEndGame(winner.id);
      } else {
          requestRef.current = requestAnimationFrame(hostGameLoopRef);
      }
  };

  const generateHostCommentary = (currentRacers: RacerState[]) => {
      const leader = currentRacers.reduce((prev, current) => (prev.position > current.position) ? prev : current);
      const leaderName = BUG_ROSTER.find(b => b.id === leader.id)?.name;
      const sleeping = currentRacers.find(r => r.status === 'sleeping');
      if (sleeping) return `${BUG_ROSTER.find(b => b.id === sleeping.id)?.name} dormiu no ponto!`;
      const boosting = currentRacers.find(r => r.status === 'boosting');
      if (boosting) return `OLHA A VELOCIDADE DO ${BUG_ROSTER.find(b => b.id === boosting.id)?.name.toUpperCase()}!`;
      return `${leaderName} lidera a disputa!`;
  };

  // --- UI HELPERS ---

  const getTotalBetsForBug = (bugId: string) => {
      const playerBets = players
        .filter(p => p.betBugId === bugId)
        .reduce((sum, p) => sum + p.betAmount, 0);
      const houseBets = npcBets
        .filter(n => n.bugId === bugId)
        .reduce((sum, n) => sum + n.amount, 0);
      return playerBets + houseBets;
  };

  // --- RENDER ---

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 font-serif flex flex-col md:flex-row overflow-hidden">
      
      {/* LEFT: Game Area (70%) */}
      <div className="flex-grow flex flex-col h-screen overflow-y-auto p-4 md:p-6 relative">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6 bg-tavern-900/80 p-4 rounded-2xl border border-tavern-accent/30 shadow-lg shrink-0">
           <div className="flex items-center gap-4">
             <div className="p-3 bg-tavern-800 rounded-full border border-tavern-gold text-tavern-gold shadow-inner">
               <Trophy size={24} />
             </div>
             <div>
               <h2 className="text-xl md:text-2xl font-bold uppercase tracking-widest text-tavern-parchment drop-shadow-md">Derby da Carapaça</h2>
               
               <div className="flex items-center gap-3 mt-1">
                 {/* Room Code Button */}
                 <button 
                    onClick={() => navigator.clipboard.writeText(roomCode)}
                    className="flex items-center gap-2 bg-black/40 hover:bg-black/60 px-3 py-1 rounded-lg border border-white/10 transition-all group"
                    title="Copiar Código da Sala"
                 >
                    <span className="text-[10px] text-stone-500 uppercase font-bold tracking-widest group-hover:text-stone-400">Sala:</span>
                    <span className="text-tavern-gold font-mono font-bold tracking-widest">{roomCode}</span>
                    <Scroll size={12} className="text-stone-600 group-hover:text-tavern-gold transition-colors" />
                 </button>

                 {isHost && (
                    <span className="bg-tavern-gold/20 text-tavern-gold border border-tavern-gold/50 px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider flex items-center gap-1">
                        <Crown size={10} /> Mestre
                    </span>
                 )}
               </div>
             </div>
           </div>
           <button onClick={onLeave} className="text-stone-500 hover:text-red-400 transition-colors p-2 hover:bg-red-900/20 rounded-lg">
             <LogOut size={20} />
           </button>
        </div>

        {/* Pista de Corrida */}
        <div className="flex-grow flex flex-col justify-center gap-4 mb-6 px-2 relative">
            <div className="absolute top-0 bottom-0 right-12 w-1 border-r-2 border-dashed border-white/10 z-0 h-full"></div>

            {BUG_ROSTER.map((bug) => {
                const racer = racers.find(r => r.id === bug.id) || { position: 0, status: 'running' };
                const isWinner = winnerId === bug.id;
                
                return (
                    // CORREÇÃO VISUAL: Usar Flex Row para garantir alinhamento perfeito
                    <div key={bug.id} className="relative w-full h-20 md:h-24 flex items-stretch shadow-lg group">
                        
                        {/* 1. Start Box (Nome) - Largura Fixa, Esquerda */}
                        <div className="w-28 md:w-36 bg-tavern-800 rounded-l-lg border-r-4 border-tavern-accent/20 flex items-center justify-center z-20 shadow-lg relative shrink-0">
                           <div className={`p-2 rounded-full bg-stone-900/50 ${bug.color} shadow-inner`}>
                             {bug.icon}
                           </div>
                           <span className="ml-2 font-bold text-xs md:text-sm text-stone-400 uppercase tracking-wider w-12 leading-tight">
                             {bug.name}
                           </span>
                           {/* Highlight para vencedor */}
                           {isWinner && <div className="absolute inset-0 border-2 border-tavern-gold rounded-l-lg animate-pulse"></div>}
                        </div>

                        {/* 2. Track Lane (Pista) - Flex Grow */}
                        <div className="flex-grow bg-[#2a1d15] relative rounded-r-lg border-y border-stone-800/50 overflow-hidden">
                            {/* Textura */}
                            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] pointer-events-none"></div>
                            
                            {/* O Inseto (Posicionado Absoluto dentro da Pista) */}
                            <motion.div 
                                className="absolute top-1/2 -translate-y-1/2 z-10"
                                style={{ left: `${racer.position}%`, x: '-50%' }} // x: -50% centraliza o inseto na posição exata
                                animate={{ 
                                   y: racer.status === 'running' || racer.status === 'boosting' ? ['-50%', '-55%', '-50%'] : '-50%',
                                }}
                                transition={{ repeat: Infinity, duration: 0.15 }}
                            >
                                <div className={`relative transition-all duration-300 ${bug.color} ${racer.status === 'boosting' ? 'scale-125 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]' : ''} ${racer.status === 'sleeping' ? 'opacity-40 grayscale' : ''}`}>
                                    {/* Icone um pouco maior para visibilidade */}
                                    {React.cloneElement(bug.icon as React.ReactElement<any>, { size: 32 })}
                                    
                                    <AnimatePresence>
                                        {racer.status === 'sleeping' && (
                                            <motion.div initial={{opacity:0, y:0}} animate={{opacity:1, y:-10}} exit={{opacity:0}} className="absolute -top-6 right-0 text-white text-xs font-bold">Zzz</motion.div>
                                        )}
                                        {racer.status === 'boosting' && (
                                            <motion.div initial={{scale:0}} animate={{scale:1}} className="absolute -bottom-1 -right-1 text-yellow-300"><Zap size={14} fill="currentColor"/></motion.div>
                                        )}
                                        {isWinner && (
                                            <motion.div initial={{scale:0}} animate={{scale:1.5}} className="absolute -top-8 left-1 text-tavern-gold"><Trophy size={24} fill="currentColor"/></motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>

                            {/* Checkered Flag Pattern at end */}
                            <div className="absolute right-0 top-0 bottom-0 w-8 bg-[url('https://www.transparenttextures.com/patterns/checkered-pattern.png')] opacity-20"></div>
                        </div>
                    </div>
                );
            })}
        </div>

        {/* Narrador e Controles */}
        <div className="bg-tavern-800/90 p-4 rounded-xl border border-tavern-gold/20 backdrop-blur-sm z-30 shrink-0">
            <div className="text-center font-mono text-tavern-gold font-bold uppercase tracking-widest text-sm mb-4 min-h-[1.5rem]">
                {commentary}
            </div>

            {/* Fase de Aposta */}
            {phase === 'betting' && (
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between animate-in slide-in-from-bottom duration-500">
                    <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 items-center no-scrollbar px-1">
                        {BUG_ROSTER.map(bug => {
                            const totalBets = getTotalBetsForBug(bug.id);
                            return (
                                <button
                                    key={bug.id}
                                    onClick={() => handleBetChange(bug.id)}
                                    // CORREÇÃO: Tamanho fixo e borda interna para não causar shift
                                    className={`
                                        flex flex-col md:flex-row items-center gap-2 px-3 py-2 rounded-xl transition-all min-w-[130px] flex-shrink-0 relative border-2
                                        ${mySelectedBug === bug.id 
                                            ? 'bg-tavern-accent border-tavern-gold shadow-lg' 
                                            : 'bg-stone-900/50 border-stone-700 hover:border-stone-500 opacity-80 hover:opacity-100'
                                        }
                                    `}
                                >
                                    <div className={bug.color}>{React.cloneElement(bug.icon as React.ReactElement<any>, { size: 20 })}</div>
                                    <div className="text-center md:text-left flex-grow">
                                        <div className="text-xs font-bold text-stone-300 uppercase truncate max-w-[80px]">{bug.name}</div>
                                        <div className="flex items-center justify-center md:justify-start gap-1 text-[10px] text-stone-400 mt-0.5">
                                            <CircleDollarSign size={10} />
                                            <span className="text-tavern-gold font-bold">{totalBets}</span>
                                        </div>
                                    </div>
                                    {mySelectedBug === bug.id && (
                                        <div className="absolute -top-2 -right-2 bg-tavern-gold rounded-full p-0.5 border border-black shadow-sm">
                                            <CircleDollarSign size={12} className="text-black" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-4 bg-stone-900 p-2 rounded-xl border border-stone-700 flex-shrink-0">
                        <button onClick={() => handleAmountChange(Math.max(10, myBetAmount - 10))} className="w-8 h-8 flex items-center justify-center bg-stone-800 rounded hover:bg-stone-700 font-bold">-</button>
                        <div className="flex flex-col items-center w-16">
                            <span className="text-tavern-gold font-bold">{myBetAmount}</span>
                            <span className="text-[9px] text-stone-500 uppercase">Aposta</span>
                        </div>
                        <button onClick={() => handleAmountChange(Math.min(myCoins, myBetAmount + 10))} className="w-8 h-8 flex items-center justify-center bg-stone-800 rounded hover:bg-stone-700 font-bold">+</button>
                    </div>
                </div>
            )}

            {/* Fase de Resultados */}
            {phase === 'results' && winnerId && (
                <motion.div 
                    initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}}
                    className="flex flex-col items-center w-full"
                >
                    <div className="w-full max-w-2xl bg-stone-900/80 rounded-lg border border-tavern-accent/30 overflow-hidden mb-4">
                        <div className="bg-tavern-accent/20 p-2 text-center text-xs font-bold uppercase tracking-widest text-tavern-gold">Resultados da Rodada</div>
                        <div className="p-2 max-h-40 overflow-y-auto custom-scrollbar">
                            {players.map(p => {
                                const won = (p.betBugId === winnerId);
                                const val = p.lastResult || 0;
                                return (
                                    <div key={p.playerId} className="flex justify-between items-center py-2 px-3 border-b border-white/5 last:border-0">
                                        <div className="flex items-center gap-2">
                                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.avatarSeed}&backgroundColor=c0aede`} className="w-6 h-6 rounded-full" />
                                            <span className={p.playerId === myId ? 'text-white font-bold' : 'text-stone-400'}>{p.name}</span>
                                        </div>
                                        <div className={`font-mono font-bold ${val > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {val > 0 ? `+${val}` : val}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Ações do Mestre/Jogador */}
            <div className="mt-4 border-t border-white/5 pt-4 flex justify-center gap-4">
                {phase === 'betting' && isHost && (
                    <>
                        <button 
                            onClick={handleAddNpcBets}
                            className="bg-tavern-800 hover:bg-tavern-700 text-stone-400 hover:text-white font-bold py-3 px-4 rounded-full flex items-center gap-2 uppercase text-xs tracking-widest transition-all border border-stone-600"
                            title="Simular movimento na taverna"
                        >
                            <PlusCircle size={16} /> Add NPCs
                        </button>
                        <button 
                            onClick={startRaceHost}
                            className="bg-tavern-gold hover:bg-yellow-500 text-tavern-900 font-bold py-3 px-8 rounded-full flex items-center gap-2 uppercase tracking-widest shadow-lg hover:scale-105 transition-all"
                        >
                            <Play size={18} fill="currentColor" /> Iniciar
                        </button>
                    </>
                )}
                {phase === 'betting' && !isHost && (
                    <div className="flex items-center gap-2 text-stone-500 uppercase text-xs font-bold tracking-widest">
                        {mySelectedBug ? <span className="text-green-500">Aposta Confirmada</span> : <span className="text-red-400">Faça sua aposta</span>}
                        <span className="mx-2">|</span>
                        Aguardando Mestre...
                    </div>
                )}
                {phase === 'results' && (
                     <button 
                        onClick={isHost ? resetGameHost : () => {}}
                        className={`font-bold py-3 px-8 rounded-full flex items-center gap-2 uppercase tracking-widest shadow-lg transition-all ${isHost ? 'bg-tavern-accent hover:bg-amber-800 text-white cursor-pointer' : 'bg-stone-800 text-stone-500 cursor-default'}`}
                    >
                        <RefreshCw size={18} /> {isHost ? 'Nova Rodada' : 'Aguardando Mestre...'}
                    </button>
                )}
            </div>
        </div>

      </div>

      {/* RIGHT: Sidebar (30%) - Player List & Bets */}
      <div className="w-full md:w-80 bg-tavern-900 border-t md:border-t-0 md:border-l border-tavern-accent/30 p-4 flex flex-col shadow-2xl z-40">
        <div className="flex items-center gap-2 mb-6 text-tavern-gold/80 uppercase tracking-widest text-xs font-bold pb-4 border-b border-white/10">
            <Users size={14} /> Apostadores ({players.length})
        </div>

        <div className="flex-grow space-y-3 overflow-y-auto pr-2 custom-scrollbar">
            {players.map((p) => {
                const betBug = BUG_ROSTER.find(b => b.id === p.betBugId);
                const isWinner = winnerId && winnerId === p.betBugId;
                
                return (
                    <motion.div 
                        key={p.playerId}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-3 rounded-xl border flex items-center gap-3 relative overflow-hidden ${
                            p.playerId === myId ? 'bg-tavern-800/80 border-tavern-accent/50' : 'bg-stone-900/40 border-stone-800'
                        } ${isWinner ? 'ring-2 ring-tavern-gold bg-tavern-gold/10' : ''}`}
                    >
                        {isWinner && <div className="absolute top-0 right-0 p-1 bg-tavern-gold"><Trophy size={10} className="text-tavern-900"/></div>}
                        
                        <div className="relative">
                            <img 
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.avatarSeed}&backgroundColor=c0aede`} 
                                className="w-10 h-10 rounded-full border border-stone-600 bg-stone-800"
                            />
                            {p.isHost && <div className="absolute -bottom-1 -right-1 bg-tavern-gold rounded-full p-0.5 border border-black"><Crown size={8} className="text-black"/></div>}
                        </div>

                        <div className="flex-grow min-w-0">
                            <div className="flex justify-between items-center">
                                <span className={`font-bold text-sm truncate ${p.playerId === myId ? 'text-tavern-parchment' : 'text-stone-400'}`}>
                                    {p.name} {p.playerId === myId && '(Você)'}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-stone-500">
                                <CircleDollarSign size={10} /> {p.coins}
                            </div>
                        </div>

                        <div className="flex flex-col items-end min-w-[50px]">
                            {p.betBugId ? (
                                <>
                                   <div className={`p-1 rounded-full ${betBug?.color} bg-black/30 mb-1`}>
                                      {React.cloneElement(betBug?.icon as React.ReactElement<any>, { size: 14 })}
                                   </div>
                                   <span className="text-[10px] font-bold text-tavern-gold">{p.betAmount}</span>
                                </>
                            ) : (
                                <span className="text-[10px] italic text-stone-600">...</span>
                            )}
                        </div>
                    </motion.div>
                );
            })}
        </div>
      </div>

    </div>
  );
};