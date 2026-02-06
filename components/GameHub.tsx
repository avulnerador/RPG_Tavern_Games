import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dices, Swords, Trophy, User, LogOut, Sparkles, Shield, Crown, Search, Beer, MonitorPlay, Scroll } from 'lucide-react';
import { UserProfile } from '../types';

interface GameHubProps {
  profile: UserProfile;
  onCreateSession: (gameId: string, isOffline: boolean) => void;
  onJoinSession: (code: string) => void;
  onLogout: () => void;
}

const GAMES = [
  {
    id: 'knucklebones',
    title: 'Ossos da Taverna',
    description: 'Um jogo ancestral de dados. Combine valores para multiplicar pontos e destrua os dados do oponente.',
    icon: <Dices className="text-tavern-gold" size={32} />,
    difficulty: 'Fácil',
    players: '1-2 Jogadores',
    active: true
  },
  {
    id: 'duel_grimoire',
    title: 'Duelo de Grimórios',
    description: 'Aposte seus feitiços em um duelo de cartas para decidir quem paga a próxima rodada de hidromel.',
    icon: <Sparkles className="text-stone-600" size={32} />,
    difficulty: 'Médio',
    players: '2 Jogadores',
    active: false
  }
];

export const GameHub: React.FC<GameHubProps> = ({ profile, onCreateSession, onJoinSession, onLogout }) => {
  const [joinCode, setJoinCode] = useState('');
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    onJoinSession(joinCode);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 animate-in fade-in duration-500">
      {/* Top Bar / Header */}
      <header className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-tavern-800/60 p-5 rounded-2xl border border-tavern-accent/20 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <img 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.avatarSeed}&backgroundColor=c0aede`} 
              className="w-14 h-14 rounded-full border-2 border-tavern-gold shadow-lg transition-transform group-hover:scale-110"
              alt="Avatar"
            />
            <div className="absolute -bottom-1 -right-1 bg-tavern-accent p-1 rounded-full border border-tavern-gold">
               <Crown size={10} className="text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold text-tavern-parchment leading-tight">{profile.name}</h2>
            <div className="flex items-center gap-2 text-tavern-gold/70 text-[10px] uppercase tracking-widest font-bold">
               <Trophy size={10} /> <span>Mestre de Mesa</span>
            </div>
          </div>
        </div>

        {/* Global Join Input */}
        <form onSubmit={handleJoin} className="flex bg-tavern-900 border border-tavern-700 rounded-xl overflow-hidden focus-within:border-tavern-gold transition-all shadow-inner w-full md:w-auto">
          <div className="flex items-center px-3 text-stone-500">
            <Search size={16} />
          </div>
          <input 
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="CÓDIGO DA MESA"
            className="bg-transparent py-3 px-2 outline-none text-tavern-gold font-mono w-full md:w-40 text-sm tracking-widest"
          />
          <button type="submit" className="bg-tavern-accent hover:bg-amber-900 text-white px-5 text-xs font-bold uppercase transition-colors">
            Entrar
          </button>
        </form>

        <button 
          onClick={onLogout}
          className="p-3 text-stone-500 hover:text-tavern-red transition-colors"
          title="Sair"
        >
          <LogOut size={20} />
        </button>
      </header>

      <main className="max-w-6xl mx-auto">
        {/* Banner de Boas-vindas */}
        <div className="mb-12 relative p-8 rounded-3xl overflow-hidden bg-tavern-800 border-2 border-tavern-accent/20 shadow-xl">
           <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
              <Shield size={160} className="text-tavern-gold" />
           </div>
           <div className="relative z-10">
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-tavern-parchment mb-2">Salão de Jogos</h1>
              <p className="text-tavern-gold/60 max-w-xl italic text-lg">
                "Onde heróis descansam e fortunas são decididas nos dados."
              </p>
           </div>
        </div>

        {/* Mural de Jogos */}
        <div className="flex items-center gap-3 mb-8">
           <Scroll size={24} className="text-tavern-accent" />
           <h2 className="text-2xl font-serif font-bold text-tavern-parchment uppercase tracking-tighter">Escolha o seu Desafio</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {GAMES.map((game) => (
            <motion.div
              key={game.id}
              layoutId={game.id}
              onClick={() => game.active && setSelectedGame(game.id)}
              whileHover={game.active ? { y: -5 } : {}}
              className={`flex flex-col p-6 rounded-2xl border-2 transition-all cursor-pointer ${
                selectedGame === game.id 
                  ? 'border-tavern-gold bg-tavern-800 shadow-[0_0_30px_rgba(251,191,36,0.1)]' 
                  : game.active 
                    ? 'border-tavern-accent/20 bg-tavern-800/40 hover:bg-tavern-800/80 hover:border-tavern-accent/50 shadow-lg'
                    : 'border-stone-800 bg-stone-900/40 opacity-50 grayscale'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl border ${game.active ? 'bg-tavern-900 border-tavern-700' : 'bg-stone-900 border-stone-800'}`}>
                  {game.icon}
                </div>
                {!game.active && <span className="text-[10px] bg-stone-800 px-2 py-1 rounded text-stone-500 font-bold uppercase">Em Breve</span>}
              </div>

              <h3 className="text-xl font-serif font-bold text-tavern-gold mb-2">{game.title}</h3>
              <p className="text-stone-400 text-xs mb-6 flex-grow leading-relaxed">
                {game.description}
              </p>

              <div className="flex justify-between items-center text-[10px] font-bold text-stone-500 uppercase tracking-widest border-t border-tavern-700/30 pt-4">
                 <div className="flex items-center gap-1"><User size={12}/> {game.players}</div>
                 <div className={game.active ? 'text-green-600' : ''}>{game.difficulty}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Modal de Configuração de Mesa */}
      <AnimatePresence>
        {selectedGame && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-tavern-800 border-2 border-tavern-gold rounded-3xl p-8 shadow-2xl relative"
            >
              <div className="flex flex-col items-center text-center">
                <div className="p-4 bg-tavern-900 rounded-full border-2 border-tavern-gold mb-4">
                  <Beer size={32} className="text-tavern-gold" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-tavern-parchment mb-1">Área do Mestre</h3>
                <p className="text-stone-400 text-sm mb-8 italic">Como deseja iniciar esta partida de <span className="text-tavern-gold font-bold">{GAMES.find(g => g.id === selectedGame)?.title}</span>?</p>
                
                <div className="w-full space-y-4">
                  <button 
                    onClick={() => onCreateSession(selectedGame, true)}
                    className="w-full py-4 bg-tavern-accent hover:bg-amber-900 text-white rounded-xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 border border-tavern-accent"
                  >
                    <MonitorPlay size={20} /> Jogar Local (Na Mesa)
                  </button>

                  <button 
                    onClick={() => onCreateSession(selectedGame, false)}
                    className="w-full py-4 bg-tavern-gold hover:bg-yellow-600 text-tavern-900 rounded-xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 border border-yellow-700 shadow-lg"
                  >
                    <Scroll size={20} /> Convocar Aventureiros (Online)
                  </button>

                  <button 
                    onClick={() => setSelectedGame(null)}
                    className="w-full py-2 text-stone-500 hover:text-white transition-colors text-sm"
                  >
                    Voltar ao Mural
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};