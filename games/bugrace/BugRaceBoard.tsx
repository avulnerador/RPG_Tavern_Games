import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, Rat, Shell, Trophy, Play, RefreshCw, LogOut, Zap, Users, Crown, CircleDollarSign, PlusCircle, Scroll, ShieldCheck, DoorOpen, Settings, Coins, TrendingUp } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useBugRaceGame } from './hooks/useBugRaceGame';
import { LobbyOverlay } from '../knucklebones/components/LobbyOverlay';
import { DisconnectOverlay } from '../knucklebones/components/DisconnectOverlay';

interface BugRaceBoardProps {
    roomCode: string;
    isHost: boolean;
    playerName: string;
    avatarSeed: string;
    isOffline?: boolean;
    myCoins: number;
    onUpdateCoins: (amount: number) => void;
    onLeave: () => void;
}

// --- VISUAL CONSTANTS ---
interface VisualBugData {
    id: string;
    name: string;
    color: string;
    icon: React.ReactNode;
    description: string;
}

const BUG_VISUALS: VisualBugData[] = [
    {
        id: 'tank',
        name: 'Tanque',
        color: 'text-emerald-500',
        icon: <Shell size={28} />,
        description: 'Lento e constante.'
    },
    {
        id: 'speedster',
        name: 'Barata Turbo',
        color: 'text-amber-600',
        icon: <Bug size={28} />,
        description: 'Rápida e caótica.'
    },
    {
        id: 'void',
        name: 'Vazio',
        color: 'text-purple-500',
        icon: <Rat size={28} />,
        description: 'Sombrio e imprevisível.'
    },
    {
        id: 'golden',
        name: 'Realeza',
        color: 'text-yellow-400',
        icon: <Bug size={28} className="rotate-90" />,
        description: 'Equilibrado.'
    }
];

export const BugRaceBoard: React.FC<BugRaceBoardProps> = ({ roomCode, isHost, playerName, avatarSeed, isOffline, onLeave, myCoins: globalCoins, onUpdateCoins }) => {
    const {
        phase,
        players,
        myId,
        myCoins,
        myBetAmount,
        mySelectedBug,
        racers,
        commentary,
        winnerId,
        npcBets,
        placeBet,
        startBettingPhase,
        startRace,
        TRACK_LENGTH,
        gameConfig,
        updateHostConfig,
        calculateOdds
    } = useBugRaceGame(roomCode, playerName, avatarSeed, isHost, !!isOffline, globalCoins, onUpdateCoins);

    // Confetti on win
    useEffect(() => {
        if (phase === 'results' && winnerId) {
            confetti({ particleCount: 200, spread: 120, origin: { y: 0.6 } });
        }
    }, [phase, winnerId]);


    const getTotalBetsForBug = (bugId: string) => {
        const playerBets = players
            .filter(p => p.betBugId === bugId)
            .reduce((sum, p) => sum + p.betAmount, 0);
        const houseBets = npcBets
            .filter(n => n.bugId === bugId)
            .reduce((sum, n) => sum + n.amount, 0);
        return playerBets + houseBets;
    };

    return (
        <div className="min-h-screen bg-stone-950 text-stone-200 font-serif flex flex-col md:flex-row overflow-hidden relative">

            {/* Background */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-wood.png')] opacity-20 pointer-events-none"></div>

            {/* OVERLAYS */}
            <AnimatePresence>
                {phase === 'disconnected' && (
                    <DisconnectOverlay
                        opponentName="O Mestre da Taverna"
                        onReturnToHub={onLeave}
                    />
                )}
            </AnimatePresence>

            {/* LEFT: Game Area (75%) */}
            <div className="flex-grow flex flex-col h-screen overflow-y-auto p-4 md:p-6 relative z-10">

                {/* Header */}
                <div className="flex justify-between items-center mb-6 bg-tavern-900/80 p-4 rounded-2xl border border-tavern-accent/30 shadow-lg shrink-0 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-tavern-800 rounded-full border border-tavern-gold text-tavern-gold shadow-inner">
                            <Trophy size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold uppercase tracking-widest text-tavern-parchment drop-shadow-md">Derby da Carapaça</h2>
                            {isHost && (phase === 'racing' || phase === 'betting') && (
                                <div className="text-xs text-stone-500 mt-1 uppercase tracking-widest">{phase === 'racing' ? 'Corrida em andamento' : 'Fase de Apostas'}</div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                            <span className="text-xs text-stone-500 uppercase">Suas Moedas</span>
                            <div className="flex items-center gap-1 text-tavern-gold font-bold text-xl">
                                <CircleDollarSign size={20} /> {myCoins}
                            </div>
                        </div>
                        <button onClick={onLeave} className="text-stone-500 hover:text-red-400 transition-colors p-2 hover:bg-red-900/20 rounded-lg">
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>

                {/* LOBBY PHASE UI - INLINE */}
                {phase === 'lobby' && (
                    <div className="flex-grow flex flex-col items-center justify-center animate-in fade-in duration-500">
                        <div className="w-full max-w-lg bg-tavern-900/90 border-2 border-dashed border-tavern-gold/30 rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl backdrop-blur-sm">
                            <div className="mb-6 p-4 bg-tavern-800 rounded-full shadow-inner">
                                <Users size={48} className="text-tavern-gold" />
                            </div>

                            <h3 className="text-2xl font-serif font-bold text-tavern-parchment mb-2">Salão de Apostas Aberto</h3>
                            <p className="text-stone-400 mb-8 max-w-xs mx-auto">Compartilhe o código abaixo para que outros apostadores entrem na taverna.</p>

                            <div className="bg-black/40 border border-tavern-accent/20 rounded-xl p-6 mb-8 w-full relative group cursor-pointer hover:border-tavern-gold transition-colors"
                                onClick={() => navigator.clipboard.writeText(roomCode)}>
                                <div className="text-xs uppercase tracking-widest text-stone-500 font-bold mb-1">Código da Mesa</div>
                                <div className="text-5xl font-mono font-bold text-tavern-gold tracking-wider">{roomCode}</div>
                                <div className="text-[10px] text-stone-600 mt-2 uppercase flex items-center justify-center gap-1 group-hover:text-tavern-gold/70">
                                    <span className="group-hover:block hidden">Clique para copiar</span>
                                </div>
                            </div>

                            <div className="w-full space-y-4">
                                {isHost ? (
                                    <>
                                        {/* HOST CONTROLS */}
                                        <div className="bg-black/20 p-4 rounded-xl border border-white/10 text-left space-y-3">
                                            <div className="flex items-center gap-2 text-tavern-gold text-xs font-bold uppercase tracking-widest mb-2 border-b border-white/10 pb-2">
                                                <Settings size={14} /> Configuração da Mesa
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                {/* Initial Coins Removed - Global Wallet Used */}
                                                <div>
                                                    <label className="text-[10px] text-stone-500 uppercase font-bold block mb-1">Aposta Min.</label>
                                                    <div className="flex items-center gap-2 bg-black/40 rounded-lg p-1 border border-white/10">
                                                        <CircleDollarSign size={12} className="text-tavern-gold ml-1" />
                                                        <select
                                                            className="bg-transparent text-sm font-bold text-tavern-parchment w-full outline-none [&>option]:bg-tavern-900 [&>option]:text-tavern-parchment"
                                                            value={gameConfig.minBet}
                                                            onChange={(e) => updateHostConfig({ minBet: Number(e.target.value) })}
                                                        >
                                                            <option value="10">10</option>
                                                            <option value="25">25</option>
                                                            <option value="50">50</option>
                                                            <option value="100">100</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-stone-500 uppercase font-bold block mb-1">Movimento (NPCs)</label>
                                                    <div className="flex items-center gap-2 bg-black/40 rounded-lg p-1 border border-white/10">
                                                        <Users size={12} className="text-tavern-gold ml-1" />
                                                        <select
                                                            className="bg-transparent text-sm font-bold text-tavern-parchment w-full outline-none [&>option]:bg-tavern-900 [&>option]:text-tavern-parchment"
                                                            value={gameConfig.npcDensity}
                                                            onChange={(e) => updateHostConfig({ npcDensity: e.target.value as any })}
                                                        >
                                                            <option value="none">Vazio</option>
                                                            <option value="low">Calmo</option>
                                                            <option value="medium">Movimentado</option>
                                                            <option value="high">Lotado</option>
                                                        </select>
                                                    </div>
                                                </div>

                                            </div>
                                        </div>


                                        <button
                                            onClick={startBettingPhase}
                                            className="w-full bg-tavern-gold hover:bg-yellow-500 text-tavern-900 font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-2 uppercase tracking-widest shadow-[0_0_20px_rgba(251,191,36,0.2)] hover:scale-105 transition-all"
                                        >
                                            <DoorOpen size={20} /> Abrir Apostas
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center gap-2 text-stone-500 bg-black/20 py-3 px-6 rounded-lg">
                                        <div className="w-2 h-2 bg-tavern-gold rounded-full animate-pulse"></div>
                                        <span className="text-xs font-bold uppercase tracking-wider">Aguardando o Mestre iniciar...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* RACE TRACK & CONTROLS - Hidden in Lobby */}
                {phase !== 'lobby' && (
                    <div className="flex-grow flex flex-col min-h-0 animate-in fade-in duration-500">
                        {/* RACE TRACK */}
                        <div className="flex-grow flex flex-col justify-center gap-4 mb-6 px-2 relative min-h-[400px]">
                            {/* Finish Line logic visual (90% of track) */}
                            <div className="absolute top-0 bottom-0 left-[90%] w-2 border-r-4 border-dashed border-white/20 z-0 h-full"></div>

                            {BUG_VISUALS.map((bug) => {
                                const racer = racers.find(r => r.id === bug.id) || { position: 0, status: 'running' };
                                const isWinner = winnerId === bug.id;
                                // Calculate progress % based on TRACK_LENGTH
                                // Assume TRACK_LENGTH is 1000. Display is 0-100%
                                const progress = Math.min(100, (racer.position / TRACK_LENGTH) * 100);

                                return (
                                    <div key={bug.id} className="relative w-full h-24 md:h-28 flex items-center shadow-lg group">

                                        {/* Start Gate Info */}
                                        <div className="w-32 md:w-40 bg-tavern-800 rounded-l-lg border-r-4 border-tavern-accent/20 flex flex-col items-center justify-center z-20 shadow-lg relative shrink-0 h-full p-2">
                                            <div className={`p-2 rounded-full bg-stone-900/50 ${bug.color} shadow-inner mb-1`}>
                                                {bug.icon}
                                            </div>
                                            <span className="font-bold text-xs md:text-sm text-stone-400 uppercase tracking-wider leading-tight text-center">
                                                {bug.name}
                                            </span>
                                            <span className="text-[10px] text-tavern-gold font-mono mt-1">Odds: {calculateOdds(bug.id, players, npcBets)}x</span>
                                            {isWinner && <div className="absolute inset-0 border-2 border-tavern-gold rounded-l-lg animate-pulse bg-tavern-gold/10"></div>}
                                        </div>

                                        {/* Track */}
                                        <div className="flex-grow bg-[#2a1d15] relative rounded-r-lg border-y border-stone-800/50 h-full"> {/* Remove overflow-hidden here */}
                                            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] pointer-events-none overflow-hidden rounded-r-lg"></div>

                                            {/* Bug Character */}
                                            <motion.div
                                                className="absolute top-1/2 -translate-y-1/2 z-10"
                                                style={{ left: `${progress}%`, x: '-50%' }}
                                                animate={{
                                                    y: racer.status === 'running' || racer.status === 'boosting' ? ['-50%', '-55%', '-50%'] : '-50%',
                                                }}
                                                transition={{ repeat: Infinity, duration: 0.15 }}
                                            >
                                                <div className={`relative transition-all duration-300 ${bug.color} ${racer.status === 'boosting' ? 'scale-125 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]' : ''} ${racer.status === 'sleeping' ? 'opacity-40 grayscale' : ''}`}>
                                                    {React.cloneElement(bug.icon as React.ReactElement<any>, { size: 40 })}

                                                    <AnimatePresence>
                                                        {racer.status === 'sleeping' && (
                                                            <motion.div initial={{ opacity: 0, y: 0 }} animate={{ opacity: 1, y: -10 }} exit={{ opacity: 0 }} className="absolute -top-6 right-0 text-white text-xs font-bold">Zzz</motion.div>
                                                        )}
                                                        {racer.status === 'boosting' && (
                                                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -bottom-1 -right-1 text-yellow-300"><Zap size={18} fill="currentColor" /></motion.div>
                                                        )}
                                                        {isWinner && (
                                                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1.5 }} className="absolute -top-8 left-1 text-tavern-gold"><Trophy size={28} fill="currentColor" /></motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </motion.div>

                                            {/* Finishing Flag Pattern */}
                                            <div className="absolute right-0 top-0 bottom-0 w-12 bg-[url('https://www.transparenttextures.com/patterns/checkered-pattern.png')] opacity-30 mix-blend-overlay"></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* BOTTOM PANEL: Controls & Commentary */}
                        <div className="bg-tavern-800/90 p-4 rounded-xl border border-tavern-gold/20 backdrop-blur-sm z-30 shrink-0 shadow-2xl">
                            <div className="text-center font-mono text-tavern-gold font-bold uppercase tracking-widest text-sm mb-4 min-h-[1.5rem]">
                                {commentary}
                            </div>

                            {/* BETTING CONTROLS */}
                            {phase === 'betting' && (
                                <div className="flex flex-col gap-6 animate-in slide-in-from-bottom duration-500">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {BUG_VISUALS.map(bug => {
                                            const totalBets = getTotalBetsForBug(bug.id);

                                            const isSelected = mySelectedBug === bug.id;

                                            return (
                                                <button
                                                    key={bug.id}
                                                    onClick={() => placeBet(bug.id, myBetAmount)} // Re-places bet if amount changed
                                                    className={`
                                        flex flex-col items-center p-3 rounded-xl border-2 transition-all relative overflow-hidden group
                                        ${isSelected
                                                            ? 'bg-tavern-accent border-tavern-gold shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                                                            : 'bg-stone-900/60 border-stone-700 hover:border-stone-500 hover:bg-stone-800'
                                                        }
                                    `}
                                                >
                                                    <div className={`mb-2 ${bug.color} group-hover:scale-110 transition-transform`}>{bug.icon}</div>
                                                    <div className="text-sm font-bold uppercase tracking-wider">{bug.name}</div>
                                                    <div className="text-xs text-tavern-gold font-mono mt-1">Pagamento: {calculateOdds(bug.id, players, npcBets)}x</div>

                                                    <div className="mt-2 w-full bg-black/20 rounded p-1 flex justify-between items-center text-[10px] text-stone-400">
                                                        <span>Total:</span>
                                                        <div className="flex items-center gap-1 text-stone-300 font-bold"><CircleDollarSign size={10} /> {totalBets}</div>
                                                    </div>

                                                    {isSelected && (
                                                        <div className="absolute top-2 right-2 text-tavern-gold"><ShieldCheck size={16} /></div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className="flex justify-center items-center gap-6 border-t border-white/5 pt-4">
                                        <div className="flex flex-col items-center">
                                            <label className="text-[10px] uppercase tracking-widest text-stone-500 mb-2">Sua Aposta</label>
                                            <div className="flex items-center gap-4 bg-stone-900 p-2 rounded-xl border border-stone-700">
                                                <button onClick={() => placeBet(mySelectedBug || '', Math.max(10, myBetAmount - 10))} className="w-10 h-10 flex items-center justify-center bg-stone-800 rounded hover:bg-stone-700 font-bold text-xl">-</button>
                                                <div className="flex flex-col items-center w-20">
                                                    <span className="text-2xl text-tavern-gold font-bold">{myBetAmount}</span>
                                                </div>
                                                <button onClick={() => placeBet(mySelectedBug || '', Math.min(myCoins, myBetAmount + 10))} className="w-10 h-10 flex items-center justify-center bg-stone-800 rounded hover:bg-stone-700 font-bold text-xl">+</button>
                                            </div>
                                        </div>

                                        {isHost && (
                                            <div className="flex flex-col items-center pl-6 border-l border-white/10">
                                                <label className="text-[10px] uppercase tracking-widest text-tavern-gold mb-2">Controle do Mestre</label>
                                                <button
                                                    onClick={startRace}
                                                    className="bg-tavern-gold hover:bg-yellow-500 text-tavern-900 font-bold py-3 px-8 rounded-full flex items-center gap-2 uppercase tracking-widest shadow-lg hover:scale-105 transition-all"
                                                >
                                                    <Play size={20} fill="currentColor" /> Iniciar Corrida
                                                </button>
                                            </div>
                                        )}

                                        {!isHost && (
                                            <div className="flex items-center gap-2 text-stone-500 uppercase text-xs font-bold tracking-widest pl-4">
                                                {mySelectedBug ? <span className="text-green-500 flex items-center gap-2"><ShieldCheck size={16} /> Aposta Confirmada</span> : <span className="text-red-400">Escolha um inseto</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* RESULTS UI / SCOREBOARD */}
                            {phase === 'results' && winnerId && (
                                <div className="flex flex-col items-center w-full animate-in fade-in zoom-in duration-500 max-w-2xl mx-auto">
                                    <div className="flex items-center gap-4 mb-6">
                                        <Trophy size={48} className="text-tavern-gold animate-bounce" />
                                        <h3 className="text-3xl font-serif font-bold text-tavern-parchment uppercase tracking-tighter">
                                            Resultados da Corrida
                                        </h3>
                                    </div>

                                    {/* Ranking Table */}
                                    <div className="w-full bg-black/40 border border-tavern-gold/30 rounded-2xl overflow-hidden shadow-2xl mb-8">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-tavern-900/80 border-b border-tavern-gold/20">
                                                    <th className="p-4 text-[10px] uppercase tracking-widest text-stone-500 font-bold">Pos</th>
                                                    <th className="p-4 text-[10px] uppercase tracking-widest text-stone-500 font-bold">Bug</th>
                                                    <th className="p-4 text-[10px] uppercase tracking-widest text-stone-500 font-bold">Apostador</th>
                                                    <th className="p-4 text-[10px] uppercase tracking-widest text-stone-500 font-bold">Aposta</th>
                                                    <th className="p-4 text-[10px] uppercase tracking-widest text-stone-500 font-bold">Odd</th>
                                                    <th className="p-4 text-[10px] uppercase tracking-widest text-stone-500 font-bold text-right">Resultado</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {/* Winners Row First */}
                                                {players.sort((a, b) => (b.lastResult || 0) - (a.lastResult || 0)).map((p, idx) => {
                                                    const betBug = BUG_VISUALS.find(b => b.id === p.betBugId);
                                                    const isWinner = p.betBugId === winnerId;
                                                    const res = p.lastResult || 0;

                                                    return (
                                                        <tr key={p.playerId} className={`hover:bg-white/5 transition-colors ${p.playerId === myId ? 'bg-tavern-800/20' : ''}`}>
                                                            <td className="p-4 font-mono font-bold text-tavern-gold">{idx + 1}º</td>
                                                            <td className="p-4">
                                                                {betBug ? (
                                                                    <div className={`flex items-center gap-2 ${betBug.color}`}>
                                                                        {React.cloneElement(betBug.icon as React.ReactElement, { size: 16 })}
                                                                        <span className="text-xs font-bold truncate hidden sm:inline">{betBug.name}</span>
                                                                    </div>
                                                                ) : '-'}
                                                            </td>
                                                            <td className="p-4">
                                                                <div className="flex items-center gap-2">
                                                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.avatarSeed}`} className="w-5 h-5 rounded-full bg-stone-800" />
                                                                    <span className="text-xs font-bold truncate max-w-[80px]">{p.name}</span>
                                                                </div>
                                                            </td>
                                                            <td className="p-4 text-xs font-mono">{p.betAmount || 0}</td>
                                                            <td className="p-4 text-xs font-mono text-stone-500">
                                                                {isWinner ? `${calculateOdds(winnerId, players, npcBets)}x` : '-'}
                                                            </td>
                                                            <td className={`p-4 text-sm font-bold text-right font-mono ${res > 0 ? 'text-green-400' : res < 0 ? 'text-red-400' : 'text-stone-500'}`}>
                                                                {res > 0 ? `+${res}` : res === 0 ? '0' : res}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {isHost ? (
                                        <button
                                            onClick={startBettingPhase}
                                            className="bg-tavern-gold hover:bg-yellow-500 text-tavern-900 font-bold py-4 px-12 rounded-xl flex items-center gap-2 uppercase tracking-widest shadow-[0_0_30px_rgba(251,191,36,0.3)] transition-all hover:scale-105 active:scale-95"
                                        >
                                            <RefreshCw size={20} /> Iniciar Nova Rodada
                                        </button>
                                    ) : (
                                        <div className="bg-tavern-900/60 p-4 rounded-xl border border-tavern-accent/20 flex items-center gap-3">
                                            <div className="w-2 h-2 bg-tavern-gold rounded-full animate-pulse"></div>
                                            <span className="text-sm italic text-stone-400 font-serif">Aguardando o Mestre da Taverna expulsar os perdedores e iniciar outra...</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>

            {/* RIGHT: Sidebar (25%) - Player List */}
            <div className="w-full md:w-80 bg-tavern-900 border-l border-tavern-accent/30 p-4 flex flex-col shadow-2xl z-40">
                <div className="flex items-center gap-2 mb-6 text-tavern-gold/80 uppercase tracking-widest text-xs font-bold pb-4 border-b border-white/10">
                    <Users size={14} /> Apostadores ({players.length})
                </div>

                <div className="flex-grow space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                    {players.map((p) => {
                        const betBug = BUG_VISUALS.find(b => b.id === p.betBugId);
                        const isWinner = winnerId && winnerId === p.betBugId;
                        const resultVal = p.lastResult || 0;

                        return (
                            <motion.div
                                key={p.playerId}
                                layout
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`p-3 rounded-xl border flex items-center gap-3 relative overflow-hidden ${p.playerId === myId ? 'bg-tavern-800/80 border-tavern-accent/50' : 'bg-stone-900/40 border-stone-800'
                                    } ${isWinner && phase === 'results' ? 'ring-2 ring-tavern-gold bg-tavern-gold/10' : ''}`}
                            >
                                {isWinner && phase === 'results' && <div className="absolute top-0 right-0 p-1 bg-tavern-gold"><Trophy size={10} className="text-tavern-900" /></div>}

                                <div className="relative">
                                    <img
                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.avatarSeed}&backgroundColor=c0aede`}
                                        className="w-10 h-10 rounded-full border border-stone-600 bg-stone-800"
                                    />
                                    {p.isHost && <div className="absolute -bottom-1 -right-1 bg-tavern-gold rounded-full p-0.5 border border-black"><Crown size={8} className="text-black" /></div>}
                                </div>

                                <div className="flex-grow min-w-0">
                                    <div className="flex justify-between items-center">
                                        <span className={`font-bold text-sm truncate ${p.playerId === myId ? 'text-tavern-parchment' : 'text-stone-400'}`}>
                                            {p.name} {p.playerId === myId && '(Você)'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-stone-500">
                                        <CircleDollarSign size={10} /> {p.coins}
                                        {phase === 'results' && resultVal !== 0 && (
                                            <span className={`ml-2 font-bold ${resultVal > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {resultVal > 0 ? `+${resultVal}` : resultVal}
                                            </span>
                                        )}
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
        </div >
    );
};