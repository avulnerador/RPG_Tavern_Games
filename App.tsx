import React, { useState, useEffect } from 'react';
import { ProfileSetup } from './components/ProfileSetup';
import { GameHub } from './components/GameHub';
import { KnucklebonesBoard } from './games/knucklebones/KnucklebonesBoard';
import { TicTacToeBoard } from './games/tictactoe/TicTacToeBoard';
import { BugRaceBoard } from './games/bugrace/BugRaceBoard';
import { UserProfile, AppScreen, TableSession } from './types';
import { GameService } from './services/gameService';

function App() {
  const [screen, setScreen] = useState<AppScreen>('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentSession, setCurrentSession] = useState<TableSession | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('tavern_profile');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Se tiver perfil salvo mas sem ID (versão antiga), tenta registrar
      if (!parsed.id) {
        GameService.createProfile(parsed.name, parsed.avatarSeed).then(({ profile }) => {
          if (profile) {
            const updated = { ...parsed, id: profile.id };
            localStorage.setItem('tavern_profile', JSON.stringify(updated));
            setProfile(updated);
            setScreen('hub');
          }
        });
      } else {
        setProfile(parsed);
        setScreen('hub');
      }
    }
  }, []);

  const handleProfileComplete = async (newProfile: UserProfile) => {
    // 1. Tenta criar perfil no Supabase
    const { profile: serverProfile, error } = await GameService.createProfile(newProfile.name, newProfile.avatarSeed);

    // 2. Mescla o profile local com o retornado (que tem ID)
    const finalProfile = serverProfile || newProfile;

    setProfile(finalProfile);
    localStorage.setItem('tavern_profile', JSON.stringify(finalProfile));
    setScreen('hub');
  };

  const handleLogout = () => {
    localStorage.removeItem('tavern_profile');
    setProfile(null);
    setScreen('profile');
  };

  // O Mestre cria a mesa para um jogo específico
  const handleCreateSession = async (gameId: string, isOffline: boolean) => {
    if (isOffline) {
      setCurrentSession({
        code: 'LOCAL',
        gameId,
        isHost: true,
        isOffline: true
      });
      setScreen('game');
      return;
    }

    // Online: Cria sala no Supabase
    if (!profile?.id) return alert("Erro de Perfil: Sem ID.");

    const { code, error } = await GameService.createRoom(gameId as any, profile.id);
    if (error) {
      alert("Erro ao criar sala: " + error.message);
      return;
    }

    setCurrentSession({
      code,
      gameId,
      isHost: true,
      isOffline: false
    });
    setScreen('game');
  };

  // O Jogador entra em uma mesa existente via código
  const handleJoinSession = async (code: string) => {
    if (!code) return alert("Insira o código da mesa!");

    // Busca sala no Supabase
    const { room, error } = await GameService.getRoom(code);

    if (error || !room) {
      alert("Sala não encontrada!");
      return;
    }

    if (room.status === 'finished') {
      alert("Esta partida já acabou.");
      return;
    }

    setCurrentSession({
      code: room.code,
      gameId: room.game_type,
      isHost: false, // Quem entra nunca é host
      isOffline: false
    });
    setScreen('game');
  };

  const handleLeaveGame = () => {
    setScreen('hub');
    setCurrentSession(null);
  };

  return (
    <div className="min-h-screen bg-tavern-900 text-stone-200 font-serif selection:bg-tavern-accent selection:text-white">
      {screen === 'profile' && (
        <ProfileSetup onComplete={handleProfileComplete} />
      )}

      {screen === 'hub' && profile && (
        <GameHub
          profile={profile}
          onCreateSession={handleCreateSession}
          onJoinSession={handleJoinSession}
          onLogout={handleLogout}
        />
      )}

      {screen === 'game' && currentSession && profile && (
        <>
          {currentSession.gameId === 'knucklebones' && (
            <KnucklebonesBoard
              roomCode={currentSession.code}
              playerName={profile.name}
              avatarSeed={profile.avatarSeed}
              isHost={currentSession.isHost}
              isOffline={currentSession.isOffline}
              onLeave={handleLeaveGame}
            />
          )}

          {currentSession.gameId === 'duel_grimoire' && (
            <TicTacToeBoard
              roomCode={currentSession.code}
              playerName={profile.name}
              avatarSeed={profile.avatarSeed}
              isHost={currentSession.isHost}
              isOffline={currentSession.isOffline}
              onLeave={handleLeaveGame}
            />
          )}

          {currentSession.gameId === 'bug_derby' && (
            <BugRaceBoard
              roomCode={currentSession.code}
              isHost={currentSession.isHost}
              playerName={profile.name}
              avatarSeed={profile.avatarSeed}
              onLeave={handleLeaveGame}
            />
          )}

          {currentSession.gameId !== 'knucklebones' && currentSession.gameId !== 'duel_grimoire' && currentSession.gameId !== 'bug_derby' && (
            <div className="flex flex-col items-center justify-center min-h-screen">
              <h2 className="text-2xl text-tavern-gold">Jogo não encontrado...</h2>
              <button onClick={handleLeaveGame} className="mt-4 text-tavern-parchment underline">Voltar</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;