
export interface BugRaceConfig {
    initialCoins: number;
    minBet: number;
    npcDensity: 'none' | 'low' | 'medium' | 'high';
    oddsPreset: 'standard' | 'underdog' | 'stable';
}

export type RacePhase = 'lobby' | 'betting' | 'racing' | 'results' | 'disconnected';

export interface RacerState {
    id: string;
    position: number;
    status: 'running' | 'sleeping' | 'boosting' | 'stunned';
    rank?: number;
}

export interface PlayerBet {
    playerId: string;
    name: string;
    avatarSeed: string;
    coins: number;
    betAmount: number;
    betBugId: string | null;
    isHost: boolean;
    lastResult?: number;
}

export interface NpcBet {
    bugId: string;
    amount: number;
}

export interface RaceResult {
    winnerId: string;
    payouts: Record<string, number>;
}
