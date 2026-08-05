import { motion } from 'motion/react';
import { Music, Music2, Music3, Music4 } from 'lucide-react';
import { memo, useMemo } from 'react';

const musicIcons = [Music, Music2, Music3, Music4];

interface FloatingMusicalNotesProps {
  count?: number;
}

function FloatingMusicalNotesComponent({ count = 3 }: FloatingMusicalNotesProps) {
  // Detect reduced motion
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const displayCount = prefersReducedMotion ? 0 : count;

  // Pre-calculate note positions for consistency
  const noteConfigs = useMemo(() => {
    return Array(displayCount).fill(0).map((_, i) => ({
      startX: (i * (100 / displayCount)) + Math.random() * 20,
      duration: 8 + Math.random() * 4,
      delay: i * 0.8,
      color: ['#06b6d4', '#a855f7', '#ec4899', '#fbbf24'][i % 4],
      icon: musicIcons[i % musicIcons.length],
    }));
  }, [displayCount]);

  return (
    <div className="fixed inset-0 pointer-events-none z-5 overflow-hidden" style={{ perspective: '1200px' }}>
      {noteConfigs.map((config, i) => {
        const Icon = config.icon;
        
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${config.startX}%`,
              bottom: '-40px',
              willChange: 'transform',
              transformStyle: 'preserve-3d',
              contain: 'layout style paint',
            }}
            initial={{ 
              y: 0, 
              opacity: 0, 
              rotateZ: 0,
              scale: 0.5,
            }}
            animate={{
              y: typeof window !== 'undefined' ? -window.innerHeight - 100 : -1000,
              opacity: [0, 0.7, 0.5, 0],
              rotateZ: [0, 180, 360],
              x: [0, Math.sin(config.delay) * 25, 0],
              scale: [0.5, 1, 0.8],
              rotateX: [0, 360],
            }}
            transition={{
              duration: config.duration,
              repeat: Infinity,
              delay: config.delay,
              ease: 'linear',
              times: [0, 0.15, 0.85, 1],
            }}
          >
            <Icon
              className="w-5 h-5 md:w-6 md:h-6"
              style={{
                color: config.color,
                filter: `drop-shadow(0 0 4px ${config.color})`,
              }}
            />
          </motion.div>
        );
      })}
    </div>
  );
}

export const FloatingMusicalNotes = memo(FloatingMusicalNotesComponent);
