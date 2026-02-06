import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';
import { UserProfile } from '../types';

export type GameType = 'knucklebones' | 'duel_grimoire' | 'bug_derby';

export interface Room {
    code: string;
    host_id: string;
    game_type: GameType;
    status: 'waiting' | 'playing' | 'finished';
    created_at: string;
    stake: number;
}

export const GameService = {
    // Cria ou atualiza perfil do jogador
    async createProfile(name: string, avatarSeed: string): Promise<{ profile?: UserProfile; error?: any }> {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .insert({
                    username: name,
                    avatar_seed: avatarSeed
                })
                .select()
                .single();

            if (error) throw error;

            return {
                profile: {
                    id: data.id,
                    name: data.username,
                    avatarSeed: data.avatar_seed,
                    coins: data.coins || 0
                }
            };
        } catch (error) {
            console.error('Erro ao criar perfil:', error);
            // Fallback para offline: retorna sem ID ou gera um ID falso
            return {
                profile: {
                    id: uuidv4(),
                    name,
                    avatarSeed,
                    coins: 0
                }
            };
        }
    },

    // Cria uma nova sala
    async createRoom(gameType: GameType, hostId: string, stake: number = 0): Promise<{ code: string; error?: any }> {
        try {
            // Gera um código de 4 letras maiúsculas
            const code = Math.random().toString(36).substring(2, 6).toUpperCase();

            const { error } = await supabase
                .from('rooms')
                .insert({
                    code,
                    host_id: hostId,
                    game_type: gameType,
                    status: 'waiting',
                    stake // Add stake
                });

            if (error) throw error;

            return { code };
        } catch (error) {
            console.error('Erro ao criar sala:', error);
            return { code: '', error };
        }
    },

    // Busca sala por código
    async getRoom(code: string): Promise<{ room?: Room; error?: any }> {
        try {
            const { data, error } = await supabase
                .from('rooms')
                .select('*')
                .eq('code', code.toUpperCase())
                .single();

            if (error) throw error;
            return { room: data as Room };
        } catch (error) {
            // console.error('Erro ao buscar sala:', error);
            return { error };
        }
    },

    // (Opcional) Atualiza status da sala
    async updateRoomStatus(code: string, status: 'playing' | 'finished') {
        return await supabase.from('rooms').update({ status }).eq('code', code);
    }
};
