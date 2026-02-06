export type PlayerId = 'host' | 'guest';

export interface UserProfile {
  id?: string;
  name: string;
  avatarSeed: string;
  coins: number;
}

export type AppScreen = 'profile' | 'hub' | 'game';

export interface Die {
  id: string;
  value: number;
  isDestroyed?: boolean;
  isNew?: boolean;
}

export type Grid = [Die[], Die[], Die[]];

export interface PlayerState {
  id: PlayerId;
  name: string;
  grid: Grid;
  score: number;
  avatarSeed: string;
}

export interface GameState {
  roomCode: string;
  host: PlayerState;
  guest: PlayerState | null;
  turn: PlayerId;
  winner: PlayerId | 'draw' | null;
  isGameOver: boolean;
  gameStatus: 'waiting' | 'ready_to_start' | 'deciding' | 'playing' | 'finished' | 'disconnected';
}

export type GameStatus = GameState['gameStatus'];

export interface MovePayload {
  column: number;
  value: number;
  playerId: PlayerId;
}

export interface JoinPayload {
  name: string;
  avatarSeed: string;
}

export interface TableSession {
  code: string;
  gameId: string;
  isHost: boolean;
  isOffline: boolean;
  stake?: number;
}