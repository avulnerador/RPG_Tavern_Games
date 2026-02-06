import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DiceProps {
  value: number;
  isNew?: boolean;
  isDestroyed?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const dotPositions: Record<number, number[][]> = {
  1: [[50, 50]],
  2: [[20, 20], [80, 80]],
  3: [[20, 20], [50, 50], [80, 80]],
  4: [[20, 20], [20, 80], [80, 20], [80, 80]],
  5: [[20, 20], [20, 80], [50, 50], [80, 20], [80, 80]],
  6: [[20, 20], [20, 50], [20, 80], [80, 20], [80, 50], [80, 80]],
};

const Particle = ({ color, index }: { color: string, index: number }) => {
  const angle = (index * 45) * (Math.PI / 180);
  const distance = 50 + Math.random() * 50;
  return (
    <motion.div
      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
      animate={{ 
        x: Math.cos(angle) * distance, 
        y: Math.sin(angle) * distance, 
        opacity: 0,
        scale: 0,
        rotate: Math.random() * 360
      }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`absolute w-3 h-3 rounded-sm ${color} z-50 shadow-sm`}
      style={{ left: '50%', top: '50%' }}
    />
  );
};

export const Dice: React.FC<DiceProps> = ({ value, isDestroyed, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-14 h-14 md:w-16 md:h-16', // Ajustado para caber melhor na coluna
    lg: 'w-24 h-24 md:w-28 md:h-28',
  };

  const dotSize = size === 'sm' ? 4 : 8;

  return (
    <div className={`relative ${sizeClasses[size]} flex-shrink-0`}>
      <AnimatePresence mode="popLayout">
        {!isDestroyed && (
          <motion.div
            initial={{ scale: 0, rotate: -180, opacity: 0, y: -50 }}
            animate={{ 
              scale: 1, 
              rotate: 0, 
              opacity: 1,
              y: 0, 
            }}
            exit={{ 
              scale: [1, 1.2, 0], 
              rotate: [0, 10, -10], 
              opacity: 0,
              filter: 'brightness(2)',
              transition: { duration: 0.3 } 
            }}
            transition={{ 
              type: 'spring', 
              stiffness: 260, 
              damping: 20
            }}
            className={`w-full h-full bg-[#f5f5f4] rounded-xl shadow-[0_4px_0_#d4d4d4] flex relative border-2 border-stone-300 overflow-hidden z-10`}
          >
            {/* Texture */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/granite.png')]"></div>
            
            <div className="relative w-full h-full">
               {dotPositions[value]?.map((pos, i) => (
                  <div
                    key={i}
                    className="absolute rounded-full bg-stone-900 shadow-inner"
                    style={{
                      width: `${dotSize}px`,
                      height: `${dotSize}px`,
                      left: `${pos[0]}%`,
                      top: `${pos[1]}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
               ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDestroyed && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {[...Array(8)].map((_, i) => (
              <Particle key={i} index={i} color={i % 2 === 0 ? "bg-tavern-accent" : "bg-tavern-parchment"} />
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};