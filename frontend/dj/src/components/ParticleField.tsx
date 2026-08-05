import { motion } from 'motion/react';
import { memo } from 'react';

export const ParticleField = memo(function ParticleField() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0" style={{ perspective: '1000px' }}>
      {/* Reduced from 30 to 12 for better performance */}
      {[...Array(12)].map((_, i) => {
        const size = Math.random() * 3 + 1;
        const duration = Math.random() * 2 + 1.5;
        
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: `radial-gradient(circle, ${
                ['#06b6d4', '#a855f7', '#ec4899', '#fbbf24'][i % 4]
              }, transparent)`,
              boxShadow: `0 0 ${size * 2}px ${
                ['#06b6d4', '#a855f7', '#ec4899', '#fbbf24'][i % 4]
              }`,
              willChange: 'transform, opacity',
              transformStyle: 'preserve-3d',
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.4, 0.8, 0.4],
              x: [0, Math.random() * 60 - 30],
              y: [0, Math.random() * 60 - 30],
              rotateZ: [0, 360],
            }}
            transition={{
              duration,
              repeat: Infinity,
              delay: Math.random() * 1.5,
              ease: 'easeInOut',
            }}
          />
        );
      })}
    </div>
  );
});
