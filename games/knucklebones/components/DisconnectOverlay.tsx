import React from 'react';
import { motion } from 'framer-motion';
import { LogOut, Home } from 'lucide-react';

interface DisconnectOverlayProps {
    opponentName?: string;
    onReturnToHub: () => void;
}

export const DisconnectOverlay: React.FC<DisconnectOverlayProps> = ({ opponentName, onReturnToHub }) => {
    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-stone-950/90 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-8 p-8 max-w-md w-full bg-tavern-900 border-2 border-red-900/50 rounded-2xl shadow-2xl"
            >
                <div className="w-24 h-24 bg-red-950 rounded-full flex items-center justify-center border-4 border-red-900/30">
                    <LogOut size={40} className="text-red-500" />
                </div>

                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-serif font-bold text-tavern-parchment">Oponente Saiu</h2>
                    <p className="text-stone-400">
                        <span className="text-tavern-gold font-bold">{opponentName || 'O outro jogador'}</span> desconectou da partida.
                    </p>
                </div>

                <button
                    onClick={onReturnToHub}
                    className="bg-tavern-800 hover:bg-tavern-700 text-tavern-parchment border border-tavern-gold/20 px-6 py-4 rounded-xl w-full flex items-center justify-center gap-3 transition-colors font-bold uppercase tracking-wider"
                >
                    <Home size={20} /> Voltar para o Hub
                </button>
            </motion.div>
        </div>
    );
};
