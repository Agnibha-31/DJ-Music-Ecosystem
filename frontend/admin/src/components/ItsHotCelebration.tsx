import { motion, AnimatePresence } from 'motion/react';
import { Flame, Sparkles } from 'lucide-react';

interface ItsHotCelebrationProps {
  isActive: boolean;
  songName: string;
}

export function ItsHotCelebration({ isActive, songName }: ItsHotCelebrationProps) {
  return (
    <AnimatePresence>
      {isActive && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 9999 }}>
          {/* Main "It's Hot" text with 3D motion */}
          <motion.div
            className="absolute top-1/2 left-1/2"
            initial={{
              x: '-50%',
              y: '-50%',
              scale: 0,
              rotateX: -90,
              rotateY: 0,
              opacity: 0,
            }}
            animate={{
              x: '-50%',
              y: '-50%',
              scale: [0, 1.5, 1.2],
              rotateX: [90, 0, 5, -5, 0],
              rotateY: [0, 360],
              rotateZ: [0, 10, -10, 0],
              opacity: [0, 1, 1, 0],
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{
              duration: 3,
              ease: 'easeOut',
            }}
            style={{
              perspective: '1000px',
              transformStyle: 'preserve-3d',
              willChange: 'transform',
            }}
          >
            <div
              className="text-center px-6 md:px-8 py-4 md:py-6 rounded-3xl"
              style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(234, 179, 8, 0.95))',
                boxShadow: '0 0 60px rgba(239, 68, 68, 0.8), 0 0 100px rgba(234, 179, 8, 0.6)',
                border: '3px solid rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <motion.div
                className="flex items-center gap-3 justify-center mb-2"
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 0.5,
                  repeat: 5,
                }}
              >
                <Flame className="w-8 h-8 md:w-10 md:h-10 text-orange-300" />
                <div className="text-3xl md:text-6xl font-black text-white"
                  style={{
                    textShadow: '0 0 20px rgba(0, 0, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  IT'S HOT
                </div>
                <Flame className="w-8 h-8 md:w-10 md:h-10 text-orange-300" />
              </motion.div>
              <div
                className="text-lg md:text-3xl font-bold text-yellow-100"
                style={{
                  textShadow: '0 0 15px rgba(0, 0, 0, 0.6)',
                }}
              >
                {songName}
              </div>
            </div>
          </motion.div>

          {/* Floating flames - optimized count */}
          {[...Array(15)].map((_, i) => {
            const startX = Math.random() * 100;
            const startY = 100 + Math.random() * 20;
            const endX = startX + (Math.random() - 0.5) * 30;
            const endY = Math.random() * -20;

            return (
              <motion.div
                key={`flame-${i}`}
                className="absolute"
                style={{
                  willChange: 'transform, opacity',
                }}
                initial={{
                  left: `${startX}%`,
                  top: `${startY}%`,
                  scale: 0,
                  opacity: 0,
                }}
                animate={{
                  left: `${endX}%`,
                  top: `${endY}%`,
                  scale: [0, 1.5, 1, 0],
                  opacity: [0, 1, 0.8, 0],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 2.2,
                  delay: i * 0.08,
                  ease: 'easeOut',
                }}
              >
                <Flame
                  className="w-6 h-6 md:w-10 md:h-10"
                  style={{
                    color: i % 2 === 0 ? '#fb923c' : '#fbbf24',
                    filter: `drop-shadow(0 0 10px ${i % 2 === 0 ? '#fb923c' : '#fbbf24'})`,
                  }}
                />
              </motion.div>
            );
          })}

          {/* Heat wave distortion circles - optimized */}
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={`wave-${i}`}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                border: '3px solid',
                borderColor: i % 2 === 0 ? 'rgba(239, 68, 68, 0.6)' : 'rgba(234, 179, 8, 0.6)',
                willChange: 'transform, opacity',
              }}
              initial={{
                width: 0,
                height: 0,
                opacity: 0.8,
              }}
              animate={{
                width: ['0px', '700px'],
                height: ['0px', '700px'],
                opacity: [0.8, 0],
              }}
              transition={{
                duration: 1.8,
                delay: i * 0.2,
                ease: 'easeOut',
              }}
            />
          ))}

          {/* Sparkles - optimized */}
          {[...Array(18)].map((_, i) => {
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            const colors = ['#fbbf24', '#fb923c', '#ef4444', '#fef3c7'];
            const color = colors[i % colors.length];

            return (
              <motion.div
                key={`sparkle-${i}`}
                className="absolute"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  willChange: 'transform, opacity',
                }}
                initial={{
                  scale: 0,
                  opacity: 0,
                  rotateZ: 0,
                }}
                animate={{
                  scale: [0, 1.5, 0],
                  opacity: [0, 1, 0],
                  rotateZ: [0, 360],
                }}
                transition={{
                  duration: 1.3,
                  delay: i * 0.05,
                  ease: 'easeOut',
                }}
              >
                <Sparkles
                  className="w-5 h-5 md:w-6 md:h-6"
                  style={{
                    color: color,
                    filter: `drop-shadow(0 0 8px ${color})`,
                  }}
                />
              </motion.div>
            );
          })}

          {/* Radial burst lines - optimized */}
          {[...Array(10)].map((_, i) => {
            const angle = (i * 360) / 10;
            return (
              <motion.div
                key={`burst-${i}`}
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
                  width: ['0px', '500px'],
                  opacity: [0, 0.8, 0],
                }}
                transition={{
                  duration: 1.3,
                  delay: i * 0.04,
                  ease: 'easeOut',
                }}
              >
                <div
                  className="h-2 rounded-full"
                  style={{
                    background: `linear-gradient(to right, ${
                      i % 2 === 0 ? 'rgba(239, 68, 68, 0.9)' : 'rgba(234, 179, 8, 0.9)'
                    }, transparent)`,
                  }}
                />
              </motion.div>
            );
          })}
        </div>
      )}
    </AnimatePresence>
  );
}
