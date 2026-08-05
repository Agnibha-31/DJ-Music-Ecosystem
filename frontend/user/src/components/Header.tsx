import { motion } from 'motion/react';
import { Music, Disc3, MapPin, AlertCircle } from 'lucide-react';
import { memo } from 'react';

interface HeaderProps {
  venue?: { name?: string; address?: string; city?: string; state?: string };
  systemMode?: { isLive?: boolean; isMaintenance?: boolean; isOverrideEnabled?: boolean };
}

function HeaderComponent({ venue, systemMode }: HeaderProps) {
  const venueName = venue?.name || 'The Groove Lounge';
  const venueLocation = venue?.city && venue?.state ? `${venue.city}, ${venue.state}` : 'Downtown Manhattan, NY';
  return (
    <motion.header
      className="relative py-2 md:py-8 px-2 md:px-4 border-b border-white/10 backdrop-blur-md"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      style={{ perspective: '2000px' }}
    >
      <div className="container mx-auto max-w-7xl">
        <motion.div
          className="flex items-center justify-between gap-4 flex-wrap"
          style={{
            transformStyle: 'preserve-3d',
            willChange: 'transform',
          }}
        >
          {/* Left: Rotating Disc Icon */}
          <motion.div
            style={{
              transformStyle: 'preserve-3d',
            }}
            animate={{ 
              rotate: 360,
              z: [0, 20, 0],
            }}
            transition={{ 
              rotate: { duration: 4, repeat: Infinity, ease: 'linear' },
              z: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
            }}
            whileHover={{ scale: 1.2, z: 40 }}
          >
            <Disc3 className="w-8 h-8 md:w-12 md:h-12 text-cyan-400" />
          </motion.div>

          {/* Center: Title */}
          <motion.div
            className="text-center flex-1"
            whileHover={{ 
              scale: 1.05,
              rotateX: 5,
              transition: { duration: 0.3 }
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <motion.h1
              className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: 'linear',
              }}
              style={{
                backgroundSize: '200% 200%',
              }}
            >
              GROOVE QUEUE
            </motion.h1>
            <motion.p
              className="text-sm md:text-base text-cyan-300/80 mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Request Your Jam • Keep The Vibe Alive
            </motion.p>

            {/* Club/Pub Name and Address */}
            <motion.div
              className="mt-4 inline-block px-6 py-3 rounded-xl border-2 border-purple-400/50 shadow-xl shadow-purple-500/30 relative overflow-hidden backdrop-blur-xl"
              initial={{ opacity: 0, y: 10 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                borderColor: [
                  'rgba(168, 85, 247, 0.5)',
                  'rgba(236, 72, 153, 0.5)',
                  'rgba(168, 85, 247, 0.5)'
                ],
                boxShadow: [
                  '0 10px 30px rgba(168, 85, 247, 0.3)',
                  '0 10px 30px rgba(236, 72, 153, 0.3)',
                  '0 10px 30px rgba(168, 85, 247, 0.3)'
                ]
              }}
              transition={{ 
                delay: 0.7,
                borderColor: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
                boxShadow: { duration: 4, repeat: Infinity, ease: 'easeInOut' }
              }}
              whileHover={{
                scale: 1.03,
                borderColor: 'rgba(168, 85, 247, 0.7)',
                boxShadow: '0 15px 40px rgba(168, 85, 247, 0.5)',
                transition: { duration: 0.2 }
              }}
            >
              {/* Animated gradient background */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-purple-600/50 via-pink-500/40 to-cyan-500/50"
                animate={{
                  backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                style={{
                  backgroundSize: '200% 200%',
                }}
              />
              
              {/* Overlay gradient for depth */}
              <div className="absolute inset-0 bg-gradient-to-tl from-indigo-600/30 via-transparent to-pink-600/30" />
              
              {/* Content */}
              <div className="relative z-10">
                <div className="text-xl md:text-2xl font-black text-white mb-1.5 drop-shadow-lg">
                  {venueName}
                </div>
                <div className="flex items-center justify-center gap-2 text-sm md:text-base text-white font-semibold">
                  <MapPin className="w-4 h-4 text-red-500" />
                  <span className="drop-shadow">{venueLocation}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right: Music Icon */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              transformStyle: 'preserve-3d',
            }}
            whileHover={{ scale: 1.2, z: 40, rotateZ: 15 }}
          >
            <Music className="w-8 h-8 md:w-12 md:h-12 text-pink-400" />
          </motion.div>
        </motion.div>
      </div>
    </motion.header>
  );
}

export const Header = memo(HeaderComponent);