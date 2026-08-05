import { motion } from 'motion/react';
import { Music, Music2, Music3, Music4 } from 'lucide-react';

const musicIcons = [Music, Music2, Music3, Music4];

export function FloatingNotes() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" style={{ perspective: '1500px' }}>
      {/* Reduced from 10 to 6 for better performance */}
      {[...Array(6)].map((_, i) => {
        const Icon = musicIcons[i % musicIcons.length];
        const startX = Math.random() * 100;
        const endX = startX + (Math.random() * 30 - 15);
        
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${startX}%`,
              bottom: '-50px',
              willChange: 'transform, opacity',
              transformStyle: 'preserve-3d',
            }}
            initial={{ y: 0, opacity: 0, rotateZ: 0, rotateX: 0 }}
            animate={{
              y: typeof window !== 'undefined' ? -window.innerHeight - 100 : -1000,
              opacity: [0, 0.7, 0.5, 0],
              rotateZ: [0, 180, 360],
              rotateX: [0, 360],
              rotateY: [0, 180, 360],
              x: [`0%`, `${endX - startX}%`],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: Math.random() * 6 + 8,
              repeat: Infinity,
              delay: i * 0.8,
              ease: 'linear',
            }}
          >
            <Icon
              className="text-cyan-400/40"
              style={{
                width: `${Math.random() * 12 + 14}px`,
                height: `${Math.random() * 12 + 14}px`,
                filter: 'drop-shadow(0 0 6px rgba(34, 211, 238, 0.5))',
              }}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
