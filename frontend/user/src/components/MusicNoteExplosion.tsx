import { motion, AnimatePresence } from 'motion/react';
import { Music, Music2 } from 'lucide-react';
import { memo } from 'react';

interface MusicNoteExplosionProps {
  isActive: boolean;
}

function MusicNoteExplosionComponent({ isActive }: MusicNoteExplosionProps) {
  const musicIcons = [Music, Music2];

  return (
    <AnimatePresence>
      {isActive && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 9999 }}>
          {/* Optimized to 8 musical notes - reduced from 12 */}
          {[...Array(8)].map((_, i) => {
            const MusicIcon = musicIcons[i % musicIcons.length];
            const startX = Math.random() * 100;
            const startY = Math.random() * 100;
            const endX = Math.random() * 100;
            const endY = Math.random() * 100 - 50;
            const colors = [
              '#06b6d4', '#22d3ee', '#a855f7',
              '#ec4899', '#f472b6', '#fbbf24',
            ];
            const color = colors[i % colors.length];

            return (
              <motion.div
                key={`note-${i}`}
                className="absolute"
                initial={{
                  left: `${startX}%`,
                  top: `${startY}%`,
                  opacity: 0,
                  scale: 0,
                }}
                animate={{
                  left: `${endX}%`,
                  top: `${endY}%`,
                  opacity: [0, 1, 0.7, 0],
                  scale: [0, 1.3, 1, 0.4],
                  rotate: [0, Math.random() > 0.5 ? 360 : -360],
                }}
                exit={{
                  opacity: 0,
                  scale: 0,
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.04,
                  ease: 'easeOut',
                }}
                style={{
                  willChange: 'transform, opacity',
                  filter: `drop-shadow(0 0 4px ${color})`,
                  contain: 'paint',
                }}
              >
                <MusicIcon 
                  className="w-6 h-6 md:w-7 md:h-7" 
                  style={{ color }}
                  strokeWidth={2}
                />
              </motion.div>
            );
          })}

          {/* Circular wave effect - optimized to 1 */}
          {[...Array(1)].map((_, i) => (
            <motion.div
              key={`wave-${i}`}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
              style={{
                borderColor: 'rgba(34, 211, 238, 0.4)',
                willChange: 'transform, opacity',
                contain: 'paint',
              }}
              initial={{
                width: 0,
                height: 0,
                opacity: 0.6,
              }}
              animate={{
                width: ['0px', '400px'],
                height: ['0px', '400px'],
                opacity: [0.6, 0],
              }}
              transition={{
                duration: 1.2,
                ease: 'easeOut',
              }}
            />
          ))}

          {/* Starburst lines - reduced to 4 */}
          {[...Array(4)].map((_, i) => {
            const angle = (i * 360) / 4;
            return (
              <motion.div
                key={`star-${i}`}
                className="absolute top-1/2 left-1/2 origin-left"
                style={{
                  transform: `rotate(${angle}deg)`,
                  willChange: 'transform, opacity',
                  contain: 'paint',
                }}
                initial={{
                  width: 0,
                  opacity: 0,
                }}
                animate={{
                  width: ['0px', '350px'],
                  opacity: [0, 0.5, 0],
                }}
                transition={{
                  duration: 1,
                  delay: i * 0.04,
                  ease: 'easeOut',
                }}
              >
                <div 
                  className="h-0.5 rounded-full"
                  style={{
                    background: `linear-gradient(to right, ${
                      i % 2 === 0 ? 'rgba(34, 211, 238, 0.6)' : 'rgba(236, 72, 153, 0.6)'
                    }, transparent)`,
                  }}
                />
              </motion.div>
            );
          })}

          {/* Sparkle particles - reduced to 6 */}
          {[...Array(6)].map((_, i) => {
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            return (
              <motion.div
                key={`sparkle-${i}`}
                className="absolute w-1.5 h-1.5 rounded-full bg-white"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  boxShadow: '0 0 4px rgba(255, 255, 255, 0.6)',
                  willChange: 'transform, opacity',
                  contain: 'paint',
                }}
                initial={{
                  opacity: 0,
                  scale: 0,
                }}
                animate={{
                  opacity: [0, 0.8, 0.6, 0],
                  scale: [0, 1.2, 0.8, 0],
                }}
                transition={{
                  duration: 1,
                  delay: i * 0.025,
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

export const MusicNoteExplosion = memo(MusicNoteExplosionComponent);
