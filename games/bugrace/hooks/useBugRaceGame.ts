import { useState, useEffect, useCallback } from 'react';
import { useBugRaceBetting } from './useBugRaceBetting';
import { useBugRaceEngine } from './useBugRaceEngine';
import { useBugRaceSocket } from './useBugRaceSocket';
import {
    GameConfig,
    RacePhase,
    PlayerBet,
    NpcBet,
    RacerState
} from '../types';

export const DEFAULT_CONFIG: GameConfig = {
    initialCoins: 100,
    minBet: 10,
    npcDensity: 'medium',
    oddsPreset: 'standard'
};

export const useBugRaceGame = (
    roomCode: string,
    playerName: string,
    avatarSeed: string,
    isHost: boolean,
    isOffline: boolean,
    myCoinsProfile: number,
    onUpdateCoins: (amount: number) => void
) => {
    // --- STATE ---
    const [phase, setPhase] = useState<RacePhase>(isHost ? 'lobby' : 'lobby');
    const [myId] = useState(isHost ? 'host' : `guest_${Math.random().toString(36).substr(2, 5)}`);
    const [gameConfig, setGameConfig] = useState<GameConfig>(DEFAULT_CONFIG);
    const [commentary, setCommentary] = useState("Aguardando corrida...");

    // --- SUB-HOOKS ---

    // 1. Betting & Wallet Logic
    const {
        players, setPlayers,
        npcBets, setNpcBets,
        myBetAmount, setMyBetAmount,
        mySelectedBug, setMySelectedBug,
        myCoins,
        calculateOdds,
        placeBet,
        generateNPCBets,
        processBetDeduction,
        processPayout,
        resetBettingState,
        syncWalletRef
    } = useBugRaceBetting(gameConfig.minBet, myId, myCoinsProfile, onUpdateCoins);

    // Sync wallet state when prop changes
    useEffect(() => {
        // Only sync if in lobby, or if parent profile changed significantly
        if (phase === 'lobby' || Math.abs(myCoinsProfile - myCoins) > 500) {
            syncWalletRef(myCoinsProfile);
        }
    }, [myCoinsProfile, phase, myCoins, syncWalletRef]);

    // 2. Race Engine Logic
    const {
        racers, setRacers,
        winnerId, setWinnerId,
        initializeRacers,
        stopRace,
        runGameLoop,
        TRACK_LENGTH
    } = useBugRaceEngine();

    // --- ACTIONS ---

    // Define joinLobby first so it can be passed to Socket
    const joinLobby = useCallback(() => {
        const myProfile: PlayerBet = {
            playerId: myId,
            name: playerName,
            avatarSeed,
            coins: myCoinsProfile,
            betAmount: gameConfig.minBet,
            betBugId: null,
            lastResult: 0,
            isHost
        };

        setPlayers(prev => {
            if (prev.find(p => p.playerId === myId)) return prev;
            return [...prev, myProfile];
        });

        // Forced real-time broadcast on join
        socket.broadcast('player_join', myProfile);

        return myProfile;
    }, [myId, playerName, avatarSeed, myCoinsProfile, gameConfig.minBet, isHost]);

    // --- EVENT HANDLERS (SOCKET CALLBACKS) ---

    // Wrapped in ref or stable callback to pass to socket hook? 
    // Actually, we can define them here.

    const handlePlayerJoin = (newPlayer: PlayerBet) => {
        setPlayers(prev => {
            if (prev.find(p => p.playerId === newPlayer.playerId)) return prev;
            const updated = [...prev, newPlayer];
            // Host Sync Logic
            if (isHost && socketRef.current) {
                setTimeout(() => {
                    socketRef.current.broadcast('sync_state', {
                        players: updated,
                        phase,
                        npcBets,
                        config: gameConfig,
                        racers: racers.length > 0 ? racers : undefined
                    });
                }, 500);
            }
            return updated;
        });
    };

    const handleSyncState = (payload: any) => {
        if (payload.players) setPlayers(payload.players);
        if (payload.phase) setPhase(payload.phase);
        if (payload.npcBets) setNpcBets(payload.npcBets);
        if (payload.racers) setRacers(payload.racers);
        if (payload.config) {
            setGameConfig(payload.config);
            if (phase === 'lobby') setMyBetAmount(payload.config.minBet);
        }
    };

    const handleStartBetting = (newNpcBets: NpcBet[]) => {
        setPhase('betting');
        setWinnerId(null);
        setRacers([]);
        setCommentary("Façam suas apostas!");
        setNpcBets(newNpcBets);
        resetBettingState();

        // Reset players bet status visually
        setPlayers(prev => prev.map(p => ({ ...p, betBugId: null, betAmount: gameConfig.minBet, lastResult: 0 })));
    };

    const handleStartRace = () => {
        setPhase('racing');
        setCommentary("A CORRIDA COMEÇOU!");

        // Try deduction (safeguarded inside hook)
        processBetDeduction();

        initializeRacers();
        // Start Loop - ONLY THE HOST (or offline play) runs the physics
        if (isHost || isOffline) {
            runGameLoop(
                (updatedRacers, comment) => {
                    // On Local Tick (Host broadcasts every tick for perfect sync)
                    if (isHost && socketRef.current) {
                        socketRef.current.broadcast('race_tick', { racers: updatedRacers, comment });
                        setCommentary(comment); // Host also sees narration
                    }
                },
                (wId) => {
                    // On Finish Local (Host handles finish event broadcast)
                    if (isHost && socketRef.current) {
                        socketRef.current.broadcast('race_finish', { winnerId: wId });
                        handleRaceFinish(wId);
                    } else if (isOffline) {
                        handleRaceFinish(wId);
                    }
                }
            );
        }
    };

    const handleRaceTick = (remoteRacers: RacerState[], remoteComment: string) => {
        if (isHost) return; // Host uses local loop
        setRacers(remoteRacers);
        setCommentary(remoteComment);
    };

    const handleRaceFinish = (wId: string) => {
        setPhase('results');
        setWinnerId(wId);
        stopRace();

        // 1. Process local payout (wallet internal)
        const payout = processPayout(wId);

        // 2. Host calculates and broadcasts results for EVERYONE (for the scoreboard)
        if (isHost && socketRef.current) {
            // Compute results for all connected players
            const results = players.map(p => {
                let res = 0;
                if (p.betBugId === wId) {
                    const finalOdds = calculateOdds(wId, players, npcBets);
                    res = Math.floor((p.betAmount || 0) * finalOdds);
                } else if (p.betBugId) {
                    res = -(p.betAmount || 0);
                }
                return { ...p, lastResult: res };
            });

            // Update local state first
            setPlayers(results);
            // Broadcast to all clients
            socketRef.current.broadcast('race_results', { players: results });
            setCommentary(payout > 0 ? `VITÓRIA! Ganhou ${payout} moedas!` : (mySelectedBug ? `Derrota! Sorte na próxima.` : `Vencedor: ${wId}`));
        } else {
            // Guest updates local player immediately for fast feedback
            setPlayers(prev => prev.map(p => {
                if (p.playerId === myId) {
                    const res = payout > 0 ? payout : (mySelectedBug ? -myBetAmount : 0);
                    return { ...p, lastResult: res };
                }
                return p;
            }));
            // Commentary for guests can be updated here based on their own payout
            setCommentary(payout > 0 ? `VITÓRIA! Ganhou ${payout} moedas!` : (mySelectedBug ? `Derrota! Sorte na próxima.` : `Vencedor: ${wId}`));
        }
    };

    const handleRaceResults = (payload: { players: PlayerBet[] }) => {
        if (isHost) return; // Host already updated its state
        setPlayers(payload.players);
        // Commentary for guests is already set in handleRaceFinish based on local payout
    };

    // 3. Socket Logic
    const socket = useBugRaceSocket(
        roomCode,
        isHost,
        isOffline,
        {
            onPlayerJoin: (p) => {
                setPlayers(prev => {
                    if (prev.find(x => x.playerId === p.playerId)) return prev;
                    const newList = [...prev, p];
                    // If Host, broadcast the absolute latest list AND NPCs/Phase to everyone for sync
                    if (isHost && socketRef.current) {
                        socketRef.current.broadcast('sync_state', {
                            players: newList,
                            npcBets: npcBets,
                            phase: phase
                        });
                    }
                    return newList;
                });
            },
            onSyncState: (payload) => {
                if (payload.players) setPlayers(payload.players);
                if (payload.npcBets) setNpcBets(payload.npcBets);
                if (payload.phase) setPhase(payload.phase);
            },
            onUpdateConfig: (config) => {
                // Host config logic handled internally if needed
            },
            onUpdateBet: (p) => setPlayers(prev => prev.map(old => old.playerId === p.playerId ? p : old)),
            onStartBetting: (npcBets) => {
                setPhase('betting');
                setNpcBets(npcBets);
                resetBettingState();
            },
            onStartRace: handleStartRace,
            onRaceTick: (data) => {
                if (!isHost) {
                    setRacers(data.racers);
                    setCommentary(data.comment);
                }
            },
            onRaceFinish: (data) => {
                if (!isHost) handleRaceFinish(data.winnerId);
            },
            onRaceResults: handleRaceResults,
            onDisconnect: () => setPhase('disconnected')
        },
        joinLobby
    );

    // Ref to access socket functions inside closures if needed (though we use socket directly usually)
    // Actually, `socket` variable from hook is updated on render. 
    // To use it safely in callbacks (like loop), we might need a ref or rely on closure capture.
    // Ideally, `socket` return methods are stable.
    const socketRef = { current: socket };

    // Host Config Update Wrapper
    const updateHostConfig = (partial: Partial<GameConfig>) => {
        if (!isHost) return;
        const newConfig = { ...gameConfig, ...partial };
        setGameConfig(newConfig);
        socket.broadcast('update_config', newConfig);
    };

    const startBettingPhase = () => {
        if (!isHost) return;

        // Host Action
        const generatedNpcBets = generateNPCBets(gameConfig.npcDensity, gameConfig.minBet);
        setNpcBets(generatedNpcBets);

        socket.broadcast('start_betting', { npcBets: generatedNpcBets });

        // Local state update matches event
        handleStartBetting(generatedNpcBets);
    };

    const triggerStartRace = () => {
        if (!isHost) return;
        socket.broadcast('start_race');
        handleStartRace();
    };

    const handlePlaceBet = (bugId: string, amount: number) => {
        if (!bugId || amount < gameConfig.minBet) return;

        // Use the internal betting hook to set state
        placeBet(bugId, amount);

        // Prepare the updated profile to broadcast
        const updatedProfile: PlayerBet = {
            playerId: myId,
            name: playerName,
            avatarSeed,
            coins: myCoinsProfile,
            betAmount: amount,
            betBugId: bugId,
            isHost,
            lastResult: 0
        };

        // Broadcast to others
        socket.broadcast('update_bet', {
            ...updatedProfile,
            coins: myCoins // Use the absolute latest local reactive balance
        });
    };

    return {
        phase,
        players,
        myId,
        myCoins, // Local reactive state
        myBetAmount,
        mySelectedBug,
        racers,
        commentary,
        winnerId,
        npcBets,
        calculateOdds,
        gameConfig,
        updateHostConfig,
        placeBet: handlePlaceBet,
        startBettingPhase,
        startRace: triggerStartRace,
        TRACK_LENGTH
    };
};
