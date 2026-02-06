import React from 'react';
import { motion } from 'framer-motion';
import { Copy, Loader2, Users } from 'lucide-react';

interface LobbyOverlayProps {
    roomCode: string;
    onLeave?: () => void;
}

export const LobbyOverlay: React.FC<LobbyOverlayProps> = ({ roomCode, onLeave }) => {
    const copyCode = () => {
        navigator.clipboard.writeText(roomCode);
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-stone-950/90 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-8 p-8 max-w-md w-full"
            >
                <div className="w-24 h-24 bg-tavern-800 rounded-full flex items-center justify-center border-4 border-tavern-gold/20 relative">
                    <Users size={48} className="text-tavern-gold/50" />
                    <div className="absolute -bottom-2 -right-2 bg-tavern-accent p-2 rounded-full border-4 border-stone-950">
                        <Loader2 size={20} className="text-white animate-spin" />
                    </div>
                </div>

                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-serif font-bold text-tavern-parchment">Aguardando Oponente</h2>
                    <p className="text-stone-400">Compartilhe o código abaixo para jogar</p>
                </div>

                <div className="flex flex-col gap-4 w-full">
                    <button
                        onClick={copyCode}
                        className="group relative bg-stone-900 border-2 border-dashed border-stone-700 hover:border-tavern-gold p-6 rounded-xl w-full flex flex-col items-center gap-2 transition-all cursor-pointer overflow-hidden"
                    >
                        <div className="text-xs uppercase tracking-widest text-stone-500 font-bold group-hover:text-tavern-gold transition-colors">Código da Sala</div>
                        <div className="text-4xl font-mono font-bold text-white tracking-wider">{roomCode}</div>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-tavern-gold">
                            <Copy size={24} />
                        </div>
                    </button>

                    <div className="flex flex-col items-center gap-2">
                        <div className="flex gap-2 text-stone-500 text-sm">
                            <span className="animate-pulse">●</span> Aguardando conexão...
                        </div>
                        {onLeave && (
                            <button onClick={onLeave} className="text-stone-600 hover:text-red-400 text-sm font-bold uppercase tracking-widest transition-colors mt-2">
                                Cancelar e Sair
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
