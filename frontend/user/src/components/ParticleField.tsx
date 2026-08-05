import { motion } from 'motion/react';
import { memo, useMemo } from 'react';

function ParticleFieldComponent() {
  // Detect reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const particleCount = prefersReducedMotion ? 0 : 3; // Reduced from 10

  return (
    <div className="fixed inset-0 pointer-events-none z-0" style={{ perspective: '1000px' }}>
      {/* Optimized to 3 particles - 70% reduction */}
      {[...Array(particleCount)].map((_, i) => {
        const size = Math.random() * 2 + 1.5;
        const duration = Math.random() * 1.5 + 2;
        const color = ['#06b6d4', '#a855f7', '#ec4899'][i % 3];
        
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: color,
              boxShadow: `0 0 ${size}px ${color}`,
              willChange: 'transform, opacity',
              transformStyle: 'preserve-3d',
              contain: 'paint',
            }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.6, 0.3],
              x: [0, Math.random() * 40 - 20],
              y: [0, Math.random() * 40 - 20],
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
}

export const ParticleField = memo(ParticleFieldComponent);
