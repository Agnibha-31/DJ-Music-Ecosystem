import { motion } from 'motion/react';
import { Music2 } from 'lucide-react';
import { memo } from 'react';

export const BackgroundAnimation = memo(function BackgroundAnimation() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ perspective: '1500px' }}>
      {/* Musical note particles floating in 3D space - optimized count */}
      {[...Array(8)].map((_, i) => {
        const startX = Math.random() * 100;
        const startY = Math.random() * 100;
        const colors = ['#06b6d4', '#a855f7', '#ec4899', '#fbbf24', '#34d399'];
        const color = colors[i % colors.length];
        
        return (
          <motion.div
            key={`music-${i}`}
            className="absolute"
            style={{
              left: `${startX}%`,
              top: `${startY}%`,
              willChange: 'transform, opacity',
              transformStyle: 'preserve-3d',
            }}
            animate={{
              x: [0, Math.random() * 100 - 50, 0],
              y: [0, Math.random() * 100 - 50, 0],
              rotateX: [0, 360],
              rotateY: [0, 360],
              rotateZ: [0, 180, 360],
              scale: [0.8, 1.2, 0.8],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: Math.random() * 8 + 10,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.5,
            }}
          >
            <Music2 
              className="w-6 h-6 md:w-8 md:h-8"
              style={{
                color: color,
                filter: `drop-shadow(0 0 8px ${color})`,
              }}
            />
          </motion.div>
        );
      })}

      {/* Sound wave rings pulsing outward */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={`wave-${i}`}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
          style={{
            borderColor: i % 2 === 0 ? 'rgba(6, 182, 212, 0.3)' : 'rgba(168, 85, 247, 0.3)',
            willChange: 'transform, opacity',
          }}
          animate={{
            width: ['100px', '800px'],
            height: ['100px', '800px'],
            opacity: [0.6, 0],
            rotateZ: [0, 180],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeOut',
            delay: i * 1.5,
          }}
        />
      ))}

      {/* 3D rotating geometric shapes */}
      {[...Array(5)].map((_, i) => {
        const shapeSize = Math.random() * 80 + 60;
        const isCircle = i % 2 === 0;
        
        return (
          <motion.div
            key={`shape-${i}`}
            className="absolute"
            style={{
              width: `${shapeSize}px`,
              height: `${shapeSize}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              border: '2px solid',
              borderColor: ['rgba(34, 211, 238, 0.25)', 'rgba(168, 85, 247, 0.25)', 'rgba(236, 72, 153, 0.25)'][i % 3],
              borderRadius: isCircle ? '50%' : '20%',
              willChange: 'transform',
              transformStyle: 'preserve-3d',
            }}
            animate={{
              rotateX: [0, 360],
              rotateY: [0, isCircle ? 360 : -360],
              rotateZ: [0, 180],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: Math.random() * 12 + 10,
              repeat: Infinity,
              ease: 'linear',
              delay: i * 0.3,
            }}
          />
        );
      })}

      {/* Animated equalizer bars in background */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`eq-${i}`}
          className="absolute bottom-0 rounded-t-lg"
          style={{
            left: `${(i * 12) + 10}%`,
            width: '4px',
            background: `linear-gradient(to top, 
              ${['#06b6d4', '#a855f7', '#ec4899'][i % 3]}40, 
              ${['#06b6d4', '#a855f7', '#ec4899'][i % 3]}10
            )`,
            willChange: 'transform',
          }}
          animate={{
            height: [
              `${Math.random() * 30 + 20}px`,
              `${Math.random() * 120 + 80}px`,
              `${Math.random() * 50 + 30}px`,
              `${Math.random() * 100 + 60}px`,
              `${Math.random() * 30 + 20}px`,
            ],
            opacity: [0.3, 0.6, 0.4, 0.5, 0.3],
          }}
          transition={{
            duration: 1.5 + i * 0.1,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.1,
          }}
        />
      ))}

      {/* Glowing particle trails */}
      {[...Array(6)].map((_, i) => {
        const pathY = Math.random() * 100;
        
        return (
          <motion.div
            key={`particle-${i}`}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: '-20px',
              top: `${pathY}%`,
              background: ['#06b6d4', '#a855f7', '#ec4899', '#fbbf24'][i % 4],
              boxShadow: `0 0 15px ${['#06b6d4', '#a855f7', '#ec4899', '#fbbf24'][i % 4]}`,
              willChange: 'transform, opacity',
            }}
            animate={{
              x: ['0vw', '110vw'],
              y: [0, Math.sin(i) * 50, 0],
              scale: [0.5, 1.5, 0.5],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 8 + 8,
              repeat: Infinity,
              ease: 'linear',
              delay: i * 1.2,
            }}
          />
        );
      })}

      {/* Radial gradient pulses */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={`radial-${i}`}
          className="absolute rounded-full blur-3xl"
          style={{
            width: '400px',
            height: '400px',
            left: `${[20, 60, 80][i]}%`,
            top: `${[30, 70, 50][i]}%`,
            background: `radial-gradient(circle, ${
              ['rgba(6, 182, 212, 0.15)', 'rgba(168, 85, 247, 0.15)', 'rgba(236, 72, 153, 0.15)'][i]
            }, transparent)`,
            willChange: 'transform, opacity',
          }}
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.3, 0.6, 0.3],
            x: [0, 30, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 1,
          }}
        />
      ))}

      {/* Spiraling lines */}
      {[...Array(4)].map((_, i) => {
        const angle = (i * 360) / 4;
        
        return (
          <motion.div
            key={`spiral-${i}`}
            className="absolute top-1/2 left-1/2 origin-left h-1 rounded-full"
            style={{
              width: '300px',
              transform: `rotate(${angle}deg)`,
              background: `linear-gradient(to right, ${
                ['rgba(6, 182, 212, 0.4)', 'rgba(168, 85, 247, 0.4)'][i % 2]
              }, transparent)`,
              willChange: 'transform, opacity',
            }}
            animate={{
              rotate: [angle, angle + 360],
              opacity: [0.3, 0.6, 0.3],
              scaleX: [1, 1.2, 1],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        );
      })}
    </div>
  );
});
