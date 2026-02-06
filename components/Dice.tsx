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
    sm: 'w-10 h-10',
    md: 'w-16 h-16 md:w-20 md:h-20',
    lg: 'w-24 h-24 md:w-28 md:h-28',
  };

  const dotSize = size === 'sm' ? 4 : 8;

  return (
    <div className="relative">
      <AnimatePresence mode="popLayout">
        {!isDestroyed && (
          <motion.div
            layout
            initial={{ scale: 0, rotate: -180, opacity: 0 }}
            animate={{ 
              scale: 1, 
              rotate: 0, 
              opacity: 1,
              y: [0, -20, 0],
            }}
            exit={{ 
              scale: [1, 1.4, 0], 
              rotate: [0, 15, -45], 
              opacity: 0,
              filter: 'brightness(3)',
              transition: { duration: 0.4 } 
            }}
            transition={{ 
              type: 'spring', 
              stiffness: 300, 
              damping: 20,
              layout: { duration: 0.3, type: "spring" }
            }}
            className={`${sizeClasses[size]} bg-[#f5f5f4] rounded-2xl shadow-[0_5px_0_#d4d4d4] flex relative border-2 border-stone-300 overflow-hidden z-10`}
          >
            {/* Bone/Ivory Texture Effect */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/granite.png')]"></div>
            <div className="absolute inset-0 bg-gradient-to-tr from-stone-200/50 to-transparent"></div>
            
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
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(10)].map((_, i) => (
              <Particle key={i} index={i} color={i % 2 === 0 ? "bg-tavern-accent" : "bg-tavern-parchment"} />
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};