import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../../services/supabase';
import { GameState, JoinPayload, PlayerId } from '../../../types';

// We can extend the types or define local ones if strictly specific
type CellValue = 'X' | 'O' | null;

interface TicTacToeState {
    board: CellValue[];
    turn: PlayerId; // 'host' (X) or 'guest' (O)
    winner: 'host' | 'guest' | 'draw' | null;
    isGameOver: boolean;
    gameStatus: 'waiting' | 'playing' | 'finished' | 'disconnected';
    host: { name: string; avatarSeed: string; score: number };
    guest: { name: string; avatarSeed: string; score: number } | null;
}

export const useTicTacToeGame = (
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
    const hasPaidRef = useRef(false);

    // Initial State
    const [gameState, setGameState] = useState<TicTacToeState>({
        board: Array(9).fill(null),
        turn: 'host', // X starts usually, or we can random
        winner: null,
        isGameOver: false,
        gameStatus: isOffline ? 'playing' : (isHost ? 'waiting' : 'playing'),
        host: { name: playerName, avatarSeed: avatarSeed, score: 0 },
        guest: isOffline ? { name: 'Oponente', avatarSeed: 'Gimli', score: 0 } : null
    });

    const myCoinsRef = useRef(myCoins);

    useEffect(() => {
        myCoinsRef.current = myCoins;
    }, [myCoins]);

    const channelRef = useRef<any>(null);

    const hasReceivedPayoutRef = useRef(false);

    // Betting Logic
    useEffect(() => {
        if (gameState.gameStatus === 'playing' && !hasPaidRef.current && stake > 0) {
            hasPaidRef.current = true;
            // Reset payout flag when new game starts
            hasReceivedPayoutRef.current = false;

            const currentCoins = myCoinsRef.current;
            onUpdateCoins(currentCoins - stake);
            console.log(`💰 [BET] Stake deducted: ${stake}. New Balance: ${currentCoins - stake}`);
        }
    }, [gameState.gameStatus, stake, onUpdateCoins]);

    useEffect(() => {
        if (gameState.isGameOver && hasPaidRef.current && stake > 0 && !hasReceivedPayoutRef.current) {
            hasReceivedPayoutRef.current = true; // Mark as paid immediately to prevent circles

            const currentCoins = myCoinsRef.current;
            const isWinner = gameState.winner === myPlayerId;
            const isDraw = (!gameState.winner && gameState.isGameOver) || gameState.winner === 'draw';

            if (isWinner) {
                onUpdateCoins(currentCoins + stake * 2);
                console.log(`💰 [PAYOUT] Winner! +${stake * 2}`);
            } else if (isDraw) {
                onUpdateCoins(currentCoins + stake);
                console.log(`💰 [PAYOUT] Draw! Refunding +${stake}`);
            }
        }
    }, [gameState.isGameOver, gameState.winner, myPlayerId, stake, onUpdateCoins]);

    // Network Subscription
    useEffect(() => {
        const channel = supabase.channel(`room_${roomCode}`);
        channelRef.current = channel;

        if (!isOffline) {
            channel
                .on('broadcast', { event: 'player_join' }, ({ payload }: { payload: JoinPayload & { avatarSeed: string } }) => {
                    if (isHost && !gameState.guest) {
                        setGameState(prev => ({
                            ...prev,
                            guest: { name: payload.name, avatarSeed: payload.avatarSeed, score: 0 },
                            gameStatus: 'playing' // Or 'deciding' if we want coin flip
                        }));

                        // Sync initial state
                        setTimeout(() => {
                            channel.send({
                                type: 'broadcast',
                                event: 'sync_state',
                                payload: {
                                    hostName: playerName,
                                    hostAvatarSeed: avatarSeed,
                                    currentTurn: 'host',
                                    board: gameState.board
                                }
                            });
                        }, 500);
                    }
                })
                .on('broadcast', { event: 'sync_state' }, ({ payload }: { payload: any }) => {
                    if (!isHost && !gameState.guest) {
                        setGameState(prev => ({
                            ...prev,
                            host: { ...prev.host, name: payload.hostName, avatarSeed: payload.hostAvatarSeed },
                            guest: { name: playerName, avatarSeed: avatarSeed, score: 0 },
                            turn: payload.currentTurn,
                            board: payload.board,
                            gameStatus: 'playing'
                        }));
                    }
                })
                .on('broadcast', { event: 'make_move' }, ({ payload }: { payload: { index: number, symbol: CellValue } }) => {
                    handleRemoteMove(payload.index, payload.symbol);
                })
                .on('broadcast', { event: 'restart_game' }, () => {
                    resetGame(false);
                })
                .on('broadcast', { event: 'player_left' }, () => {
                    setGameState(prev => ({ ...prev, gameStatus: 'disconnected', winner: null }));
                })
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        if (!isHost) {
                            channel.send({ type: 'broadcast', event: 'player_join', payload: { name: playerName, avatarSeed: avatarSeed } });
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

    const handleRemoteMove = (index: number, symbol: CellValue) => {
        applyMove(index, symbol);
    };

    const applyMove = (index: number, symbol: CellValue) => {
        setGameState(prev => {
            if (prev.board[index] || prev.winner) return prev;

            const newBoard = [...prev.board];
            newBoard[index] = symbol;

            const winner = checkWinner(newBoard);
            const isDraw = !newBoard.includes(null);

            // Update scores
            let newHostScore = prev.host.score;
            let newGuestScore = prev.guest ? prev.guest.score : 0;

            if (winner === 'host') newHostScore++;
            if (winner === 'guest') newGuestScore++;

            const nextTurn = prev.turn === 'host' ? 'guest' : 'host';

            return {
                ...prev,
                board: newBoard,
                turn: nextTurn,
                winner: winner as any,
                isGameOver: !!winner || isDraw,
                gameStatus: (winner || isDraw) ? 'finished' : prev.gameStatus,
                host: { ...prev.host, score: newHostScore },
                guest: prev.guest ? { ...prev.guest, score: newGuestScore } : null
            };
        });
    };

    const checkWinner = (board: CellValue[]) => {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        for (let [a, b, c] of lines) {
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                // Return 'host' if X, 'guest' if O
                return board[a] === 'X' ? 'host' : 'guest';
            }
        }
        return null; // or 'draw' handling outside
    };

    const onCellClick = (index: number) => {
        if (gameState.isGameOver || gameState.gameStatus !== 'playing') return;

        // Permission check
        const activePlayerId = gameState.turn;
        if (!isOffline && activePlayerId !== myPlayerId) return;
        if (gameState.board[index]) return;

        const symbol = activePlayerId === 'host' ? 'X' : 'O';

        if (!isOffline && channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'make_move',
                payload: { index, symbol }
            });
        }

        applyMove(index, symbol);
    };

    const resetGame = (shouldBroadcast: boolean) => {
        hasPaidRef.current = false; // Reset bet tracking
        hasReceivedPayoutRef.current = false; // Reset payout helper
        if (shouldBroadcast && channelRef.current && !isOffline) {
            channelRef.current.send({ type: 'broadcast', event: 'restart_game' });
        }
        setGameState(prev => ({
            ...prev,
            board: Array(9).fill(null),
            turn: 'host', // maybe rotate starter
            winner: null,
            isGameOver: false,
            gameStatus: 'playing'
        }));
    };

    return {
        gameState,
        myPlayerId,
        onCellClick,
        resetGame
    };
};
