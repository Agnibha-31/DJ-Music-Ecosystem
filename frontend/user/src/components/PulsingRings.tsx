import { motion } from 'motion/react';
import { memo, useMemo } from 'react';

function PulsingRingsComponent() {
  // Detect reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const ringCount = prefersReducedMotion ? 0 : 1; // Reduced from 2 to 1

  return (
    <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center" style={{ perspective: '2000px' }}>
      {/* Optimized to 1 ring - 50% reduction */}
      {[...Array(ringCount)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border"
          style={{
            width: '300px',
            height: '300px',
            borderColor: 'rgba(6, 182, 212, 0.08)',
            borderWidth: '1px',
            transformStyle: 'preserve-3d',
            willChange: 'transform, opacity',
            contain: 'paint',
          }}
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.5,
          }}
        />
      ))}
    </div>
  );
}

export const PulsingRings = memo(PulsingRingsComponent);
