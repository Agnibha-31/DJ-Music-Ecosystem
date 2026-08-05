import { motion } from 'motion/react';
import { Music, Music2, Music3, Music4 } from 'lucide-react';
import { memo, useMemo } from 'react';

const musicIcons = [Music, Music2, Music3, Music4];

function BackgroundAnimationComponent() {
  // Detect if user prefers reduced motion
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Detect device capability - use stable values
  const deviceProfile = useMemo(() => {
    if (typeof window === 'undefined') return { isLowEnd: false, cores: 4 };
    const cores = navigator.hardwareConcurrency || 4;
    const memory = (navigator as any).deviceMemory || 8;
    return { isLowEnd: cores <= 2 || memory <= 2, cores };
  }, []);

  // Enhanced animation counts for stunning display
  const musicNoteCount = prefersReducedMotion ? 0 : deviceProfile.isLowEnd ? 3 : 6;
  const spiralNoteCount = prefersReducedMotion ? 0 : deviceProfile.isLowEnd ? 2 : 4;
  const floatingNoteCount = prefersReducedMotion ? 0 : deviceProfile.isLowEnd ? 2 : 5;
  const pulseCount = prefersReducedMotion ? 0 : 3;

  // Pre-calculated positions for consistency - Main orbiting notes
  const notePositions = useMemo(() => {
    return Array(musicNoteCount).fill(0).map((_, i) => ({
      angle: (i * 360 / musicNoteCount) * (Math.PI / 180),
      radius: 120 + i * 30,
      color: ['#06b6d4', '#a855f7', '#ec4899', '#fbbf24', '#10b981', '#f59e0b'][i % 6],
      duration: 15 + i * 2,
      delay: i * 0.6,
    }));
  }, [musicNoteCount]);

  // Spiral motion notes - rotating spiral pattern
  const spiralPositions = useMemo(() => {
    return Array(spiralNoteCount).fill(0).map((_, i) => ({
      angle: (i * 90) * (Math.PI / 180),
      startRadius: 80,
      endRadius: 200,
      color: ['#ec4899', '#a855f7', '#06b6d4', '#fbbf24'][i % 4],
      duration: 10 + i * 1,
      delay: i * 0.5,
    }));
  }, [spiralNoteCount]);

  // Floating vertical notes with wave motion
  const floatingNotePositions = useMemo(() => {
    return Array(floatingNoteCount).fill(0).map((_, i) => ({
      startX: (i * 100 / floatingNoteCount) + Math.random() * 10,
      color: ['#06b6d4', '#a855f7', '#ec4899', '#fbbf24', '#10b981'][i % 5],
      duration: 18 + Math.random() * 8,
      delay: i * 1.2,
      waveAmplitude: 40 + Math.random() * 20,
    }));
  }, [floatingNoteCount]);

  // Pulsing rings with different sizes and colors
  const pulsePositions = useMemo(() => {
    return Array(pulseCount).fill(0).map((_, i) => ({
      color: ['#06b6d4', '#a855f7', '#ec4899'][i % 3],
      startRadius: 40 + i * 60,
      endRadius: 150 + i * 80,
      duration: 3 + i * 0.8,
      delay: i * 0.4,
    }));
  }, [pulseCount]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ perspective: '1500px' }}>
      {/* Main Orbiting Musical Notes - Stunning 3D Motion */}
      {notePositions.map((pos, i) => {
        const Icon = musicIcons[i % musicIcons.length];
        const centerX = 50;
        const centerY = 50;
        
        return (
          <motion.div
            key={`orbiting-note-${i}`}
            className="absolute"
            style={{
              left: `${centerX}%`,
              top: `${centerY}%`,
              willChange: 'transform',
              transformStyle: 'preserve-3d',
              contain: 'layout style paint',
            }}
            animate={{
              // Smooth circular orbit with 3D rotation
              x: [0, Math.cos(pos.angle) * pos.radius, Math.cos(pos.angle + Math.PI) * pos.radius, 0],
              y: [0, Math.sin(pos.angle) * pos.radius, Math.sin(pos.angle + Math.PI) * pos.radius, 0],
              rotateZ: [0, 180, 360],
              rotateX: [0, 30, -30, 0],
              rotateY: [0, 45, -45, 0],
              scale: [0.6, 1.3, 1.1, 0.8],
              opacity: [0.2, 0.9, 0.8, 0.3],
            }}
            transition={{
              duration: pos.duration,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: pos.delay,
              times: [0, 0.33, 0.66, 1],
            }}
          >
            <Icon 
              className="w-6 h-6 md:w-8 md:h-8"
              style={{
                color: pos.color,
                filter: `drop-shadow(0 0 12px ${pos.color}) drop-shadow(0 0 24px ${pos.color}cc)`,
                textShadow: `0 0 8px ${pos.color}`,
              }}
            />
          </motion.div>
        );
      })}

      {/* Spiral Motion Notes - Dynamic Wave Pattern */}
      {spiralPositions.map((pos, i) => {
        const Icon = musicIcons[i % musicIcons.length];
        const centerX = 50;
        const centerY = 45;
        
        return (
          <motion.div
            key={`spiral-note-${i}`}
            className="absolute"
            style={{
              left: `${centerX}%`,
              top: `${centerY}%`,
              willChange: 'transform',
              transformStyle: 'preserve-3d',
              contain: 'layout style paint',
            }}
            animate={{
              // Spiraling motion expanding outward then contracting
              x: [
                Math.cos(pos.angle) * pos.startRadius,
                Math.cos(pos.angle + Math.PI / 4) * pos.endRadius,
                Math.cos(pos.angle) * pos.startRadius,
              ],
              y: [
                Math.sin(pos.angle) * pos.startRadius,
                Math.sin(pos.angle + Math.PI / 4) * pos.endRadius,
                Math.sin(pos.angle) * pos.startRadius,
              ],
              rotateZ: [0, 720],
              rotateY: [0, 180, 360],
              scale: [0.5, 1.4, 0.6],
              opacity: [0.1, 0.95, 0.2],
            }}
            transition={{
              duration: pos.duration,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: pos.delay,
              times: [0, 0.5, 1],
            }}
          >
            <Icon 
              className="w-5 h-5 md:w-7 md:h-7"
              style={{
                color: pos.color,
                filter: `drop-shadow(0 0 10px ${pos.color}) drop-shadow(0 0 20px ${pos.color}99)`,
              }}
            />
          </motion.div>
        );
      })}

      {/* Multiple Pulsing Rings - Stunning Wave Effect */}
      {pulsePositions.map((pos, i) => (
        <motion.div
          key={`pulse-ring-${i}`}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
          style={{
            borderColor: pos.color,
            borderWidth: '2px',
            willChange: 'transform',
            contain: 'paint',
          }}
          animate={{
            width: [`${pos.startRadius * 2}px`, `${pos.endRadius * 2}px`, `${pos.startRadius * 2}px`],
            height: [`${pos.startRadius * 2}px`, `${pos.endRadius * 2}px`, `${pos.startRadius * 2}px`],
            opacity: [0.1, 0.6, 0.05],
            boxShadow: [
              `0 0 0px ${pos.color}`,
              `0 0 20px ${pos.color}, inset 0 0 10px ${pos.color}99`,
              `0 0 0px ${pos.color}`,
            ],
          }}
          transition={{
            duration: pos.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: pos.delay,
          }}
        />
      ))}

      {/* Floating Musical Notes with Smooth Wave Motion */}
      {floatingNotePositions.map((pos, i) => {
        const Icon = musicIcons[i % musicIcons.length];
        
        return (
          <motion.div
            key={`floating-note-${i}`}
            className="absolute"
            style={{
              left: `${pos.startX}%`,
              bottom: '-40px',
              willChange: 'transform',
              transformStyle: 'preserve-3d',
              contain: 'layout style paint',
            }}
            initial={{ y: 0, opacity: 0 }}
            animate={{
              y: typeof window !== 'undefined' ? -window.innerHeight - 100 : -1000,
              opacity: [0, 0.7, 0.6, 0.3, 0],
              rotateZ: [0, 180, 360, 540],
              rotateX: [0, 45, 90, 45, 0],
              rotateY: [0, 90, 180, 90, 0],
              x: [0, Math.sin(pos.delay * 10) * pos.waveAmplitude, Math.sin(pos.delay * 15) * pos.waveAmplitude * 0.5, 0],
              scale: [0.4, 1.1, 0.9, 0.5, 0.2],
            }}
            transition={{
              duration: pos.duration,
              repeat: Infinity,
              delay: pos.delay,
              ease: 'easeInOut',
            }}
          >
            <Icon
              className="w-5 h-5 md:w-7 md:h-7"
              style={{
                color: pos.color,
                filter: `drop-shadow(0 0 8px ${pos.color}) drop-shadow(0 0 16px ${pos.color}cc)`,
              }}
            />
          </motion.div>
        );
      })}

      {/* Background Glow Orbs for Depth */}
      {!prefersReducedMotion && !deviceProfile.isLowEnd && (
        <>
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={`glow-orb-${i}`}
              className="absolute rounded-full blur-3xl"
              style={{
                width: `${200 + i * 100}px`,
                height: `${200 + i * 100}px`,
                left: `${20 + i * 30}%`,
                top: `${30 + i * 20}%`,
                background: `radial-gradient(circle, ${['#06b6d4', '#a855f7', '#ec4899'][i]}, transparent)`,
                opacity: 0.05,
                willChange: 'transform',
                contain: 'paint',
              }}
              animate={{
                x: [0, 30, -30, 0],
                y: [0, -40, 40, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 8 + i * 2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.5,
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}

export const BackgroundAnimation = memo(BackgroundAnimationComponent);
