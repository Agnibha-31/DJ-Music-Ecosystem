import { motion, AnimatePresence } from 'motion/react';
import { Music, Music2, Music3, Music4 } from 'lucide-react';

interface MusicNoteExplosionProps {
  isActive: boolean;
}

export function MusicNoteExplosion({ isActive }: MusicNoteExplosionProps) {
  const musicIcons = [Music, Music2, Music3, Music4];

  return (
    <AnimatePresence>
      {isActive && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 9999 }}>
          {/* Optimized to 18 musical notes for better performance */}
          {[...Array(18)].map((_, i) => {
            const MusicIcon = musicIcons[i % musicIcons.length];
            const startX = Math.random() * 100;
            const startY = Math.random() * 100;
            const endX = Math.random() * 100;
            const endY = Math.random() * 100 - 50;
            const colors = [
              '#06b6d4', '#22d3ee', '#a855f7', '#c084fc',
              '#ec4899', '#f472b6', '#fbbf24', '#34d399',
            ];
            const color = colors[i % colors.length];

            return (
              <motion.div
                key={`note-${i}`}
                className="absolute"
                style={{
                  willChange: 'transform, opacity',
                }}
                initial={{
                  left: `${startX}%`,
                  top: `${startY}%`,
                  opacity: 0,
                  scale: 0,
                }}
                animate={{
                  left: `${endX}%`,
                  top: `${endY}%`,
                  opacity: [0, 1, 0.8, 0],
                  scale: [0, 1.5, 1.2, 0.5],
                  rotate: [0, Math.random() > 0.5 ? 360 : -360],
                }}
                exit={{
                  opacity: 0,
                  scale: 0,
                }}
                transition={{
                  duration: 1.8,
                  delay: i * 0.05,
                  ease: 'easeOut',
                }}
                style={{
                  filter: `drop-shadow(0 0 8px ${color})`,
                }}
              >
                <MusicIcon 
                  className="w-7 h-7 md:w-9 md:h-9" 
                  style={{ color }}
                  strokeWidth={2.5}
                />
              </motion.div>
            );
          })}

          {/* Circular wave effect - reduced to 3 */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={`wave-${i}`}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-4"
              style={{
                borderColor: i % 2 === 0 ? 'rgba(34, 211, 238, 0.5)' : 'rgba(236, 72, 153, 0.5)',
                willChange: 'transform, opacity',
              }}
              initial={{
                width: 0,
                height: 0,
                opacity: 0.8,
              }}
              animate={{
                width: ['0px', '500px'],
                height: ['0px', '500px'],
                opacity: [0.8, 0],
              }}
              transition={{
                duration: 1.3,
                delay: i * 0.25,
                ease: 'easeOut',
              }}
            />
          ))}

          {/* Starburst lines - optimized */}
          {[...Array(8)].map((_, i) => {
            const angle = (i * 360) / 8;
            return (
              <motion.div
                key={`star-${i}`}
                className="absolute top-1/2 left-1/2 origin-left"
                style={{
                  transform: `rotate(${angle}deg)`,
                  willChange: 'transform, opacity',
                }}
                initial={{
                  width: 0,
                  opacity: 0,
                }}
                animate={{
                  width: ['0px', '450px'],
                  opacity: [0, 0.6, 0],
                }}
                transition={{
                  duration: 1.1,
                  delay: i * 0.04,
                  ease: 'easeOut',
                }}
              >
                <div 
                  className="h-1 rounded-full"
                  style={{
                    background: `linear-gradient(to right, ${
                      i % 2 === 0 ? 'rgba(34, 211, 238, 0.8)' : 'rgba(236, 72, 153, 0.8)'
                    }, transparent)`,
                  }}
                />
              </motion.div>
            );
          })}

          {/* Sparkle particles - reduced to 15 */}
          {[...Array(15)].map((_, i) => {
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            return (
              <motion.div
                key={`sparkle-${i}`}
                className="absolute w-2 h-2 rounded-full bg-white"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  boxShadow: '0 0 8px rgba(255, 255, 255, 0.8)',
                  willChange: 'transform, opacity',
                }}
                initial={{
                  opacity: 0,
                  scale: 0,
                }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  scale: [0, 1.3, 1, 0],
                }}
                transition={{
                  duration: 1.1,
                  delay: i * 0.03,
                  ease: 'easeOut',
                }}
              />
            );
          })}
        </div>
      )}
    </AnimatePresence>
  );
}
