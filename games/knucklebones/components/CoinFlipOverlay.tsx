import React from 'react';
import { motion } from 'framer-motion';
import { Coins } from 'lucide-react';

interface CoinFlipOverlayProps {
    winnerName?: string;
}

export const CoinFlipOverlay: React.FC<CoinFlipOverlayProps> = ({ winnerName }) => {
    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-6">
                <motion.div
                    animate={{ rotateY: 1800 }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                    className="w-32 h-32 rounded-full bg-tavern-gold border-4 border-yellow-600 flex items-center justify-center shadow-[0_0_50px_rgba(251,191,36,0.4)]"
                >
                    <Coins size={64} className="text-yellow-900" />
                </motion.div>

                <div className="text-center space-y-2">
                    <h3 className="text-xl font-serif text-tavern-parchment animate-pulse">
                        {winnerName ? `Sorteando quem começa...` : 'Sorteando...'}
                    </h3>
                    {winnerName && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 2.1 }}
                            className="text-3xl font-bold text-white mt-4"
                        >
                            <span className="text-tavern-gold">{winnerName}</span> começa!
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};
