import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dices, Swords, Trophy, User, LogOut, Sparkles, Shield, Crown, Search, Beer, MonitorPlay, Scroll, Bug, CircleDollarSign, Pencil, Coins } from 'lucide-react';
import { UserProfile } from '../types';

interface GameHubProps {
  profile: UserProfile;
  onCreateSession: (gameId: string, isOffline: boolean, stake?: number) => void;
  onJoinSession: (code: string) => void;
  onLogout: () => void;
  onUpdateCoins: (amount: number) => void;
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
    description: 'Aposte seus feitiços em um duelo de runas (Fogo vs Gelo) para decidir quem paga a próxima rodada.',
    icon: <Sparkles className="text-purple-400" size={32} />,
    difficulty: 'Fácil',
    players: '2 Jogadores',
    active: true
  },
  {
    id: 'bug_derby',
    title: 'Derby da Carapaça',
    description: 'Aposte em corridas de insetos do submundo. Sorte, velocidade e caos em cada frame.',
    icon: <Bug className="text-emerald-500" size={32} />,
    difficulty: 'Sorte',
    players: 'Solo',
    active: true
  }
];

export const GameHub: React.FC<GameHubProps> = ({ profile, onCreateSession, onJoinSession, onLogout, onUpdateCoins }) => {
  const [joinCode, setJoinCode] = useState('');
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [stakeAmount, setStakeAmount] = useState<number>(0);

  const [isEditingWallet, setIsEditingWallet] = useState(false);
  const [newWalletValue, setNewWalletValue] = useState<number>(0);

  const handleOpenWalletEditor = () => {
    setNewWalletValue(profile.coins);
    setIsEditingWallet(true);
  };

  const handleSaveWallet = () => {
    onUpdateCoins(newWalletValue);
    setIsEditingWallet(false);
  };

  const handleCreate = (isOffline: boolean) => {
    if (!selectedGame) return;
    const gameId = selectedGame;

    // Bug Derby doesn't use stake at creation (it's betting based)
    // But Knucklebones and Duel Grimoire do
    if (gameId !== 'bug_derby' && stakeAmount > profile.coins) {
      alert("Saldo insuficiente para essa aposta!");
      return;
    }

    onCreateSession(gameId, isOffline, gameId !== 'bug_derby' ? stakeAmount : undefined);
  };

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

        {/* Wallet Display & Edit */}
        <div className="flex items-center gap-4 bg-black/40 px-4 py-2 rounded-xl border border-tavern-gold/30">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-stone-500 uppercase font-bold tracking-widest">Sua Fortuna</span>
            <div className="flex items-center gap-2 text-tavern-gold font-bold text-xl">
              <Coins size={18} /> {profile.coins}
            </div>
          </div>
          <button
            onClick={handleOpenWalletEditor}
            className="p-2 hover:bg-white/10 rounded-lg text-tavern-accent transition-colors"
            title="Editar Saldo"
          >
            <Pencil size={14} />
          </button>
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
              "Onde heróis descansam e fortunas são decididas nos dados e runas."
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
              className={`flex flex-col p-6 rounded-2xl border-2 transition-all cursor-pointer ${selectedGame === game.id
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
                <div className="flex items-center gap-1"><User size={12} /> {game.players}</div>
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
                  {/* STAKE INPUT FOR 1x1 GAMES */}
                  {selectedGame !== 'bug_derby' && (
                    <div className="w-full mb-4">
                      <label className="text-xs text-stone-500 uppercase font-bold block mb-2">Valor da Aposta (Mesa)</label>
                      <div className="flex items-center bg-black/40 border border-white/10 rounded-xl px-3 py-2">
                        <CircleDollarSign size={16} className="text-tavern-gold mr-2" />
                        <input
                          type="number"
                          min="0"
                          value={stakeAmount}
                          onChange={(e) => setStakeAmount(Number(e.target.value))}
                          className="bg-transparent w-full outline-none text-tavern-parchment font-bold"
                          placeholder="0"
                        />
                      </div>
                      <p className="text-[10px] text-stone-500 mt-1 italic">*O vencedor leva o pote total. Empate devolve.</p>
                    </div>
                  )}

                  <div className="w-full space-y-4">
                    <button
                      onClick={() => handleCreate(true)}
                      className="w-full py-4 bg-tavern-accent hover:bg-amber-900 text-white rounded-xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 border border-tavern-accent"
                    >
                      <MonitorPlay size={20} /> Jogar Local (Na Mesa)
                    </button>

                    <button
                      onClick={() => handleCreate(false)}
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
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Editar Carteira */}
      <AnimatePresence>
        {isEditingWallet && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-tavern-800 border-2 border-tavern-gold rounded-3xl p-6 shadow-2xl relative"
            >
              <h3 className="text-xl font-serif font-bold text-tavern-parchment mb-4 text-center">Tesouro do Jogador</h3>

              <div className="mb-6">
                <label className="text-xs text-stone-500 uppercase font-bold block mb-2">Saldo de Moedas</label>
                <div className="flex items-center bg-black/40 border border-white/10 rounded-xl px-3 py-3">
                  <Coins size={20} className="text-tavern-gold mr-3" />
                  <input
                    type="number"
                    min="0"
                    value={newWalletValue}
                    onChange={(e) => setNewWalletValue(Number(e.target.value))}
                    className="bg-transparent w-full outline-none text-tavern-parchment font-bold text-lg"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsEditingWallet(false)}
                  className="flex-1 py-3 bg-stone-800 hover:bg-stone-700 text-stone-400 rounded-xl font-bold text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveWallet}
                  className="flex-1 py-3 bg-tavern-accent hover:bg-amber-900 text-white rounded-xl font-bold text-sm border border-tavern-accent"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};