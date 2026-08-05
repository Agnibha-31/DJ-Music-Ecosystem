import { motion } from 'motion/react';
import { Music, Music2 } from 'lucide-react';
import { memo, useMemo } from 'react';

const musicIcons = [Music, Music2];

function FloatingNotesComponent() {
  // Detect reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const noteCount = prefersReducedMotion ? 0 : 2; // Reduced from 4 to 2

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" style={{ perspective: '1500px' }}>
      {/* Reduced from 4 to 2 for better performance */}
      {[...Array(noteCount)].map((_, i) => {
        const Icon = musicIcons[i % musicIcons.length];
        const startX = Math.random() * 100;
        const endX = startX + (Math.random() * 20 - 10);
        
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${startX}%`,
              bottom: '-50px',
              willChange: 'transform, opacity',
              transformStyle: 'preserve-3d',
              contain: 'paint',
            }}
            initial={{ y: 0, opacity: 0, rotateZ: 0 }}
            animate={{
              y: typeof window !== 'undefined' ? -window.innerHeight - 100 : -1000,
              opacity: [0, 0.6, 0.4, 0],
              rotateZ: [0, 180, 360],
              x: [`0%`, `${endX - startX}%`],
              scale: [0.8, 1.1, 0.8],
            }}
            transition={{
              duration: Math.random() * 5 + 10,
              repeat: Infinity,
              delay: i * 1.2,
              ease: 'linear',
            }}
          >
            <Icon
              className="text-cyan-400/30"
              style={{
                width: `${Math.random() * 8 + 14}px`,
                height: `${Math.random() * 8 + 14}px`,
                filter: 'drop-shadow(0 0 3px rgba(34, 211, 238, 0.3))',
              }}
            />
          </motion.div>
        );
      })}
    </div>
  );
}

export const FloatingNotes = memo(FloatingNotesComponent);
