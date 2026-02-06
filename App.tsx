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

      // Se for um ID offline, tenta conectar e transformar em online
      if (!parsed.id || parsed.id === 'offline-id' || parsed.id.startsWith('offline-')) {
        GameService.createProfile(parsed.name, parsed.avatarSeed).then(({ profile }) => {
          if (profile) {
            const updated = { ...parsed, id: profile.id, coins: parsed.coins || 100 };
            localStorage.setItem('tavern_profile', JSON.stringify(updated));
            setProfile(updated);
            setScreen('hub');
          }
        });
      } else {
        // Se já tem um ID que parece online, VERIFICA se ele é válido no banco
        GameService.verifyProfile(parsed.id).then(({ profile: verified, error }) => {
          if (verified) {
            // ID é válido, mantém
            const finalProfile = { ...parsed, coins: parsed.coins ?? 100 };
            setProfile(finalProfile);
            setScreen('hub');
          } else {
            // ID era inválido (stale do antigo ou deletado), tenta RE-REGISTRAR pelo nome
            console.log("⚠️ ID de perfil inválido detectado. Tentando recuperar pelo nome...");
            GameService.createProfile(parsed.name, parsed.avatarSeed).then(({ profile: recovered }) => {
              const updated = recovered || { ...parsed, id: 'offline-' + Math.random().toString(36).substring(7) };
              localStorage.setItem('tavern_profile', JSON.stringify(updated));
              setProfile(updated);
              setScreen('hub');
            });
          }
        });
      }
    }
  }, []);

  const handleProfileComplete = async (newProfile: UserProfile) => {
    // 1. Tenta criar perfil no Supabase
    const { profile: serverProfile, error } = await GameService.createProfile(newProfile.name, newProfile.avatarSeed);

    // 2. Mescla o profile local com o retornado (que tem ID)

    const baseProfile = serverProfile || newProfile;
    const finalProfile = { ...baseProfile, coins: baseProfile.coins ?? 100 };
    setProfile(finalProfile);
    localStorage.setItem('tavern_profile', JSON.stringify(finalProfile));
    setScreen('hub');
  };

  const handleLogout = () => {
    localStorage.removeItem('tavern_profile');
    setProfile(null);
    setScreen('profile');
  };

  const handleUpdateCoins = React.useCallback((newAmount: number) => {
    if (!profile) return;
    const updated = { ...profile, coins: newAmount };
    // Only update if changed to avoid loop (though profile object change causes re-render anyway)
    // Actually, we must rely on ref stability in hooks, but useCallback here helps.
    setProfile(prev => {
      if (!prev) return prev;
      if (prev.coins === newAmount) return prev;
      const up = { ...prev, coins: newAmount };
      localStorage.setItem('tavern_profile', JSON.stringify(up));
      return up;
    });
  }, [profile?.id]); // Depend on ID or just empty if we use functional update for setProfile, but we need profile for other fields.
  // Wait, if we use setProfile(prev => ...), we don't need profile in dependency?
  // But we need the REST of the profile.
  // Correct implementation:

  /*
  const handleUpdateCoins = React.useCallback((newAmount: number) => {
    setProfile(prev => {
        if (!prev) return null;
        if (prev.coins === newAmount) return prev;
        const updated = { ...prev, coins: newAmount };
        localStorage.setItem('tavern_profile', JSON.stringify(updated));
        return updated;
    });
  }, []);
  */
  // I will use this better implementation.

  // O Mestre cria a mesa para um jogo específico
  const handleCreateSession = async (gameId: string, isOffline: boolean, stake: number = 0) => {
    if (isOffline) {
      setCurrentSession({
        code: 'LOCAL',
        gameId,
        isHost: true,
        isOffline: true,
        stake
      });

      setScreen('game');
      return;
    }

    // Online: Cria sala no Supabase
    if (!profile?.id) return alert("Erro de Perfil: Sem ID.");
    if (profile.id.startsWith('offline-')) {
      alert("⚠️ Você está em modo offline. Verifique sua conexão ou as chaves do Supabase para jogar online.");
      return;
    }

    // Pass stake to createRoom
    const { code, error } = await GameService.createRoom(gameId as any, profile.id, stake);
    if (error) {
      alert("Erro ao criar sala: " + error.message);
      return;
    }

    setCurrentSession({
      code,
      gameId,
      isHost: true,
      isOffline: false,
      stake
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
      isOffline: false,
      stake: room.stake || 0 // Retrieve stake from room
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
          onUpdateCoins={handleUpdateCoins}
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
              myCoins={profile.coins}
              onUpdateCoins={handleUpdateCoins}
              stake={currentSession.stake}
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
              myCoins={profile.coins}
              onUpdateCoins={handleUpdateCoins}
              stake={currentSession.stake}
              onLeave={handleLeaveGame}
            />
          )}

          {currentSession.gameId === 'bug_derby' && (
            <BugRaceBoard
              roomCode={currentSession.code}
              isHost={currentSession.isHost}
              playerName={profile.name}
              avatarSeed={profile.avatarSeed}
              isOffline={currentSession.isOffline}
              myCoins={profile.coins}
              onUpdateCoins={handleUpdateCoins}
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