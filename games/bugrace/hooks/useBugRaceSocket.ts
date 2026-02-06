
import { useEffect, useRef } from 'react';
import { supabase } from '../../../services/supabase';
import { PlayerBet, NpcBet, GameConfig, RacerState, RacePhase } from '../types';

export const useBugRaceSocket = (
    roomCode: string,
    isHost: boolean,
    isOffline: boolean,
    callbacks: {
        onPlayerJoin: (player: PlayerBet) => void;
        onSyncState: (payload: any) => void;
        onUpdateConfig: (config: GameConfig) => void;
        onUpdateBet: (player: PlayerBet) => void;
        onStartBetting: (npcBets: NpcBet[]) => void;
        onStartRace: () => void;
        onRaceTick: (payload: { racers: RacerState[], comment: string }) => void;
        onRaceFinish: (payload: { winnerId: string }) => void;
        onRaceResults: (payload: { players: PlayerBet[] }) => void;
        onDisconnect: () => void;
    },
    joinLobby: () => void
) => {
    const channelRef = useRef<any>(null);
    const hasJoinedRef = useRef(false);

    // Crucial: Use a ref for callbacks to avoid stale closures in listeners
    const callbacksRef = useRef(callbacks);
    useEffect(() => {
        callbacksRef.current = callbacks;
    });

    useEffect(() => {
        console.log(`🔌 [SOCKET] Connecting to room: ${roomCode}`);
        const channel = supabase.channel(`bugrace_${roomCode}`);
        channelRef.current = channel;

        if (!isOffline) {
            channel
                .on('broadcast', { event: 'player_join' }, ({ payload }: { payload: PlayerBet }) => {
                    callbacksRef.current.onPlayerJoin(payload);
                })
                .on('broadcast', { event: 'sync_state' }, ({ payload }: { payload: any }) => {
                    callbacksRef.current.onSyncState(payload);
                })
                .on('broadcast', { event: 'update_config' }, ({ payload }: { payload: GameConfig }) => {
                    callbacksRef.current.onUpdateConfig(payload);
                })
                .on('broadcast', { event: 'update_bet' }, ({ payload }: { payload: PlayerBet }) => {
                    callbacksRef.current.onUpdateBet(payload);
                })
                .on('broadcast', { event: 'start_betting' }, ({ payload }: { payload: { npcBets?: NpcBet[] } }) => {
                    callbacksRef.current.onStartBetting(payload?.npcBets || []);
                })
                .on('broadcast', { event: 'start_race' }, () => {
                    callbacksRef.current.onStartRace();
                })
                .on('broadcast', { event: 'race_tick' }, ({ payload }: { payload: { racers: RacerState[], comment: string } }) => {
                    callbacksRef.current.onRaceTick(payload);
                })
                .on('broadcast', { event: 'race_finish' }, ({ payload }: { payload: { winnerId: string } }) => {
                    callbacksRef.current.onRaceFinish(payload);
                })
                .on('broadcast', { event: 'race_results' }, ({ payload }: { payload: { players: PlayerBet[] } }) => {
                    callbacksRef.current.onRaceResults(payload);
                })
                .on('broadcast', { event: 'disconnect' }, () => {
                    callbacksRef.current.onDisconnect();
                })
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        if (!hasJoinedRef.current) {
                            joinLobby();
                            hasJoinedRef.current = true;
                        }
                    }
                });
        } else {
            joinLobby();
        }

        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, [roomCode]);

    // Send methods
    const broadcast = (event: string, payload?: any) => {
        if (channelRef.current) {
            channelRef.current.send({ type: 'broadcast', event, payload });
        }
    };

    return {
        broadcast
    };
};
