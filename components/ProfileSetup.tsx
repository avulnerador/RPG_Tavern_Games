import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserCircle, ShieldCheck, Beer } from 'lucide-react';
import { UserProfile } from '../types';

interface ProfileSetupProps {
  onComplete: (profile: UserProfile) => void;
}

const AVATAR_OPTIONS = [
  'Gimli', 'Legolas', 'Gandalf', 'Aragorn', 'Frodo', 'Galadriel', 'Boromir', 'Eowyn',
  'Taverneiro', 'Bardo', 'Ladino', 'Paladino', 'Clerigo', 'Druida', 'Mago', 'Guerreiro',
  'Orc', 'Goblin', 'Dragao', 'Tabaxi'
];

export const ProfileSetup: React.FC<ProfileSetupProps> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert('Diga-nos o seu nome, forasteiro!');
    onComplete({ name, avatarSeed: selectedAvatar });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 animate-in fade-in duration-700">
      <div className="w-full max-w-md p-8 rounded-3xl bg-tavern-800/95 border-2 border-tavern-accent shadow-2xl backdrop-blur-md">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="mb-4 p-4 bg-tavern-900 rounded-full border-2 border-tavern-gold shadow-[0_0_20px_rgba(251,191,36,0.2)]">
            <Beer size={40} className="text-tavern-gold" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-tavern-gold uppercase tracking-tighter">Quem és tu, Viajante?</h1>
          <p className="text-stone-400 italic">Identifique-se para entrar na Estalagem</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-tavern-gold/70 font-bold ml-1">Alcunha / Nome</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Kaelen, o Bravo"
              className="w-full bg-tavern-900 border border-tavern-700 rounded-xl px-4 py-3 focus:outline-none focus:border-tavern-gold text-tavern-parchment text-lg transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-tavern-gold/70 font-bold ml-1 flex items-center gap-2">
              <UserCircle size={14} /> Escolha sua Aparência
            </label>
            <div className="grid grid-cols-4 gap-3 bg-tavern-900/50 p-4 rounded-xl border border-tavern-700/30 max-h-48 overflow-y-auto custom-scrollbar">
              {AVATAR_OPTIONS.map((seed) => (
                <motion.button
                  key={seed}
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedAvatar(seed)}
                  className={`relative w-12 h-12 rounded-full border-2 overflow-hidden transition-all ${
                    selectedAvatar === seed ? 'border-tavern-gold ring-2 ring-tavern-gold/30' : 'border-stone-700 opacity-60 grayscale hover:grayscale-0'
                  }`}
                >
                  <img 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=c0aede`} 
                    alt={seed}
                    className="w-full h-full object-cover"
                  />
                </motion.button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-tavern-accent hover:bg-amber-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 group"
          >
            Entrar na Taverna <ShieldCheck size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  );
};