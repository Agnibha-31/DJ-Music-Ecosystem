import { motion } from 'motion/react';
import { memo } from 'react';

export const PulsingRings = memo(function PulsingRings() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center" style={{ perspective: '2000px' }}>
      {/* Optimized to 2 rings for better performance */}
      {[...Array(2)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border-2"
          style={{
            width: `${300 + i * 200}px`,
            height: `${300 + i * 200}px`,
            borderColor: `rgba(${i % 2 === 0 ? '34, 211, 238' : '168, 85, 247'}, ${0.1 - i * 0.02})`,
            transformStyle: 'preserve-3d',
            willChange: 'transform, opacity',
          }}
          animate={{
            scale: [1, 1.1, 1],
            rotateX: [0, 10, 0],
            rotateY: [0, 10, 0],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.3,
          }}
        />
      ))}
    </div>
  );
});
