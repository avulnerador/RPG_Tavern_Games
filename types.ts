export type PlayerId = 'host' | 'guest';

export interface UserProfile {
  name: string;
  avatarSeed: string;
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
}

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
}