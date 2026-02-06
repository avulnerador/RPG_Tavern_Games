import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../../../services/supabase';
import { GameState, JoinPayload, MovePayload, PlayerId, Die, Grid } from '../../../types';
import { calculateTotalScore, generateDieValue, isBoardFull, MAX_DICE_PER_COLUMN } from '../logic';

export const useKnucklebonesGame = (
    roomCode: string,
    playerName: string,
    avatarSeed: string,
    isHost: boolean,

    isOffline: boolean,
    stake: number = 0,
    myCoins: number,
    onUpdateCoins: (amount: number) => void
) => {
    const [myPlayerId] = useState<PlayerId>(isHost ? 'host' : 'guest');
    const [currentDiceValue, setCurrentDiceValue] = useState<number>(0);
    const [opponentDiceValue, setOpponentDiceValue] = useState<number>(0);
    const [shakingColumns, setShakingColumns] = useState<{ playerId: PlayerId, colIndex: number } | null>(null);
    const hasPaidRef = useRef(false); // Track if stake was paid for current round

    const [gameState, setGameState] = useState<GameState>({
        roomCode,
        host: { id: 'host', name: playerName, grid: [[], [], []], score: 0, avatarSeed: avatarSeed },
        guest: isOffline ? { id: 'guest', name: 'Oponente', grid: [[], [], []], score: 0, avatarSeed: 'Gimli' } : null,
        turn: 'host',
        winner: null,
        isGameOver: false,
        gameStatus: isOffline ? 'deciding' : (isHost ? 'waiting' : 'deciding') // Host waits, Guest joins deciding
    });

    const channelRef = useRef<any>(null);

    const myCoinsRef = useRef(myCoins);

    useEffect(() => {
        myCoinsRef.current = myCoins;
    }, [myCoins]);



    // Initial transition for Offline mode
    useEffect(() => {
        if (isOffline && gameState.gameStatus === 'deciding') {
            setTimeout(() => {
                setGameState(prev => ({ ...prev, gameStatus: 'playing' }));
            }, 2500); // Fake coin flip delay
        }
    }, [isOffline, gameState.gameStatus]);

    const hasReceivedPayoutRef = useRef(false);

    // Betting Logic: Deduction on Game Start
    useEffect(() => {
        if (gameState.gameStatus === 'playing' && !hasPaidRef.current && stake > 0) {
            hasPaidRef.current = true;
            hasReceivedPayoutRef.current = false; // Reset for new round
            const currentCoins = myCoinsRef.current;
            onUpdateCoins(currentCoins - stake);
            console.log(`💰 [BET] Stake deducted: ${stake}. New Balance: ${currentCoins - stake}`);
        }
    }, [gameState.gameStatus, stake, onUpdateCoins]);

    // Betting Logic: Payout on Game Over
    useEffect(() => {
        if (gameState.isGameOver && gameState.winner && hasPaidRef.current && stake > 0 && !hasReceivedPayoutRef.current) {
            hasReceivedPayoutRef.current = true;
            const currentCoins = myCoinsRef.current;
            let payout = 0;

            if (gameState.winner === myPlayerId) {
                payout = stake * 2; // Win Pot
                onUpdateCoins(currentCoins + payout);
            } else if (gameState.winner === 'draw') {
                payout = stake; // Refund
                onUpdateCoins(currentCoins + payout);
            }

            if (payout > 0) console.log(`💰 [PAYOUT] Winner/Draw! Payout: ${payout}. New Balance: ${currentCoins + payout}`);
        }
    }, [gameState.isGameOver, gameState.winner, myPlayerId, stake, onUpdateCoins]);

    // Auto-roll dice logic (ONLY when playing)
    useEffect(() => {
        if (gameState.isGameOver || gameState.gameStatus !== 'playing') return;
        const isMyTurn = isOffline ? true : gameState.turn === myPlayerId;

        if (isMyTurn && currentDiceValue === 0) {
            const timer = setTimeout(() => {
                const newValue = generateDieValue();
                setCurrentDiceValue(newValue);

                // Broadcast rolled value to opponent
                if (!isOffline && channelRef.current) {
                    channelRef.current.send({
                        type: 'broadcast',
                        event: 'dice_rolled',
                        payload: { value: newValue }
                    });
                }
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [gameState.turn, myPlayerId, currentDiceValue, gameState.isGameOver, isOffline, gameState.gameStatus]);

    // Network Subscription
    useEffect(() => {
        const channel = supabase.channel(`room_${roomCode}`);
        channelRef.current = channel;

        if (!isOffline) {
            channel
                .on('broadcast', { event: 'player_join' }, ({ payload }: { payload: JoinPayload & { avatarSeed: string } }) => {
                    console.log("📡 [EVENT] player_join recebido:", payload);
                    if (isHost && !gameState.guest) {
                        console.log("✅ [HOST] Novo jogador detectado! Iniciando sorteio...");

                        // Decide who starts
                        const startPlayer: PlayerId = Math.random() > 0.5 ? 'host' : 'guest';

                        setGameState(prev => ({
                            ...prev,
                            guest: { id: 'guest', name: payload.name, grid: [[], [], []], score: 0, avatarSeed: payload.avatarSeed || payload.name },
                            gameStatus: 'deciding',
                            turn: startPlayer
                        }));

                        // Send sync state AND Start Game event
                        setTimeout(() => {
                            console.log("📡 [HOST] Enviando game_start com starter:", startPlayer);
                            channel.send({
                                type: 'broadcast',
                                event: 'sync_state',
                                payload: {
                                    hostName: playerName,
                                    hostAvatarSeed: avatarSeed,
                                    currentTurn: startPlayer, // Send the decided turn
                                    gameStatus: 'deciding'
                                }
                            });

                            // Delay actual play start for animation
                            setTimeout(() => {
                                channel.send({ type: 'broadcast', event: 'game_start', payload: { startPlayer } });
                                setGameState(prev => ({ ...prev, gameStatus: 'playing' }));
                            }, 2500);

                        }, 500);
                    }
                })
                .on('broadcast', { event: 'sync_state' }, ({ payload }: { payload: any }) => {
                    console.log("📡 [EVENT] sync_state recebido:", payload);
                    if (!isHost && !gameState.guest) {
                        console.log("✅ [GUEST] Sincronizando com Host...");
                        setGameState(prev => ({
                            ...prev,
                            host: { ...prev.host, name: payload.hostName, avatarSeed: payload.hostAvatarSeed },
                            guest: { id: 'guest', name: playerName, grid: [[], [], []], score: 0, avatarSeed: avatarSeed },
                            turn: payload.currentTurn,
                            gameStatus: payload.gameStatus || 'playing' // Fallback
                        }));
                    }
                })
                .on('broadcast', { event: 'game_start' }, ({ payload }: { payload: { startPlayer: PlayerId } }) => {
                    console.log("🚀 [EVENT] game_start recebido. Começando!", payload);
                    setGameState(prev => ({
                        ...prev,
                        turn: payload.startPlayer,
                        gameStatus: 'playing'
                    }));
                })
                .on('broadcast', { event: 'dice_rolled' }, ({ payload }: { payload: { value: number } }) => {
                    console.log("🎲 [EVENT] dice_rolled recebido:", payload);
                    setOpponentDiceValue(payload.value);
                })
                .on('broadcast', { event: 'make_move' }, ({ payload }: { payload: MovePayload }) => {
                    console.log("📡 [EVENT] make_move recebido:", payload);
                    setOpponentDiceValue(0);
                    handleRemoteMove(payload);
                })
                .on('broadcast', { event: 'restart_game' }, () => {
                    console.log("📡 [EVENT] restart_game recebido");
                    resetGame(false);
                })
                .on('broadcast', { event: 'player_left' }, () => {
                    console.log("👋 [EVENT] Jogador saiu da sala");
                    setGameState(prev => ({
                        ...prev,
                        gameStatus: 'disconnected',
                        winner: null // Ensure no winner is declared
                    }));
                })
                .subscribe((status) => {
                    console.log("🔌 [STATUS] Canal Supabase:", status);
                    if (status === 'SUBSCRIBED') {
                        if (!isHost) {
                            console.log("👋 [GUEST] Enviando player_join...");
                            channel.send({ type: 'broadcast', event: 'player_join', payload: { name: playerName, avatarSeed: avatarSeed } });
                        } else {
                            console.log("👑 [HOST] Aguardando oponentes...");
                        }
                    }
                });
        }

        return () => {
            if (!isOffline) {
                channel.send({ type: 'broadcast', event: 'player_left' });
            }
            supabase.removeChannel(channel);
        };
    }, [roomCode, isOffline, isHost, playerName, avatarSeed]);

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
                winner,
                gameStatus: isGameOver ? 'finished' : 'playing'
            };
        });

        if (isOffline || playerId === myPlayerId) {
            setCurrentDiceValue(0);
        }
    };

    const onColumnClick = (colIndex: number) => {
        if (gameState.isGameOver || currentDiceValue === 0 || gameState.gameStatus !== 'playing') return;
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
        // When restarting, keep players but reset grid and do a quick "deciding" again?
        // For simplicity, just restart to playing with Host turn for now
        setGameState(prev => ({
            ...prev,
            host: { ...prev.host, grid: [[], [], []], score: 0 },
            guest: prev.guest ? { ...prev.guest, grid: [[], [], []], score: 0 } : null,
            turn: 'host', // maybe rotate starter?
            isGameOver: false,
            winner: null,
            gameStatus: 'playing'
        }));
        setCurrentDiceValue(0);
        setOpponentDiceValue(0);
        hasPaidRef.current = false; // Reset payment tracking for new round
        hasReceivedPayoutRef.current = false;
    };

    const startGame = () => {
        if (!isHost) return;
        const startPlayer: PlayerId = Math.random() > 0.5 ? 'host' : 'guest';

        // Update Local State
        setGameState(prev => ({
            ...prev,
            gameStatus: 'deciding',
            turn: startPlayer
        }));

        // Broadcast Decision
        if (channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'game_deciding',
                payload: { startPlayer }
            });
        }

        // Transition Local to Playing after animation
        setTimeout(() => {
            setGameState(prev => ({ ...prev, gameStatus: 'playing' }));
        }, 2500);
    };

    return {
        gameState,
        myPlayerId,
        currentDiceValue,
        opponentDiceValue,
        shakingColumns,
        onColumnClick,
        resetGame,
        startGame
    };
};
