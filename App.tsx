import React, { useState, useEffect } from 'react';
import { ProfileSetup } from './components/ProfileSetup';
import { GameHub } from './components/GameHub';
import { KnucklebonesBoard } from './games/knucklebones/KnucklebonesBoard';
import { TicTacToeBoard } from './games/tictactoe/TicTacToeBoard';
import { BugRaceBoard } from './games/bugrace/BugRaceBoard';
import { UserProfile, AppScreen, TableSession } from './types';

function App() {
  const [screen, setScreen] = useState<AppScreen>('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentSession, setCurrentSession] = useState<TableSession | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('tavern_profile');
    if (saved) {
      setProfile(JSON.parse(saved));
      setScreen('hub');
    }
  }, []);

  const handleProfileComplete = (newProfile: UserProfile) => {
    setProfile(newProfile);
    localStorage.setItem('tavern_profile', JSON.stringify(newProfile));
    setScreen('hub');
  };

  const handleLogout = () => {
    localStorage.removeItem('tavern_profile');
    setProfile(null);
    setScreen('profile');
  };

  // O Mestre cria a mesa para um jogo específico
  const handleCreateSession = (gameId: string, isOffline: boolean) => {
    const code = isOffline ? 'LOCAL' : Math.random().toString(36).substring(2, 6).toUpperCase();
    setCurrentSession({
      code,
      gameId,
      isHost: true,
      isOffline
    });
    setScreen('game');
  };

  // O Jogador entra em uma mesa existente via código
  const handleJoinSession = (code: string) => {
    if (!code) return alert("Insira o código da mesa!");
    
    // NOTE: In a real app with Supabase, we would fetch the game type associated with this room code here.
    // For now, we will default to Knucklebones for generic codes, or check a prefix/mock.
    setCurrentSession({
      code: code.toUpperCase(),
      gameId: 'knucklebones', 
      isHost: false,
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