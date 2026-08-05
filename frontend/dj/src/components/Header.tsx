import { motion } from 'motion/react';
import { Radio, Disc3, MapPin, AlertCircle, Shield, User } from 'lucide-react';
import { memo, type ReactNode, useRef } from 'react';

interface HeaderProps {
  venue?: { name?: string; address?: string; city?: string; state?: string };
  systemMode?: { isLive?: boolean; isMaintenance?: boolean; isOverrideEnabled?: boolean };
  onUserClick?: () => void;
  profilePopup?: (buttonRef: React.RefObject<HTMLButtonElement>) => ReactNode;
}

export const Header = memo(function Header({ venue, systemMode, onUserClick, profilePopup }: HeaderProps) {
  const venueName = venue?.name || 'The Groove Lounge';
  const venueLocation = venue?.city && venue?.state ? `${venue.city}, ${venue.state}` : 'Downtown Manhattan, NY';
  const profileButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <motion.header
      className="relative z-40 py-4 md:py-5 px-4 border-b border-white/10 backdrop-blur-md"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="container mx-auto max-w-7xl">
        <motion.div
          className="flex items-center justify-between flex-wrap gap-4"
        >
          {/* Left: Logo & Title */}
          <motion.div
            className="flex items-center gap-3"
            whileHover={{ 
              scale: 1.03,
              transition: { duration: 0.3 }
            }}
          >
            <motion.div
              animate={{ 
                rotate: 360,
              }}
              transition={{ 
                rotate: { duration: 4, repeat: Infinity, ease: 'linear' },
              }}
              whileHover={{ scale: 1.2 }}
            >
              <Disc3 className="w-7 h-7 md:w-9 md:h-9 text-cyan-400" />
            </motion.div>
            
            <div>
              <motion.h1
                className="text-xl md:text-3xl lg:text-4xl font-black tracking-tight bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
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
                DJ COMMAND CENTER
              </motion.h1>
              <motion.p
                className="text-[10px] md:text-xs text-cyan-300/80 mt-0.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Real-Time Analytics • Live Control
              </motion.p>
            </div>
          </motion.div>

          {/* Center: Pub Name & Location */}
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="text-center">
              <div className="text-xl md:text-2xl lg:text-3xl font-black text-white">
                {venueName}
              </div>
              <div className="flex items-center gap-1.5 justify-center text-sm md:text-base text-gray-300">
                <MapPin className="w-5 h-5 text-pink-400" />
                <span>{venueLocation}</span>
              </div>
            </div>
          </motion.div>

          {/* Right: Status Indicators */}
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            {systemMode?.isOverrideEnabled && (
              <motion.div
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/20 border border-red-500/30"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Shield className="w-4 h-4 text-red-400" />
                <span className="text-xs font-bold text-red-400">OVERRIDE</span>
              </motion.div>
            )}
            <motion.div
              className="flex items-center gap-2"
              animate={{ y: [0, -5, 0], rotateZ: [0, 8, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              whileHover={{ scale: 1.2 }}
            >
              <Radio className="w-7 h-7 md:w-8 md:h-8 text-purple-400" />
              <motion.span
                className="text-sm md:text-base font-bold text-purple-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Let's Groove!
              </motion.span>
            </motion.div>
            {onUserClick && (
              <div className="relative">
                <motion.button
                  ref={profileButtonRef}
                  onClick={onUserClick}
                  className="p-2.5 rounded-full bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-400 hover:via-purple-400 hover:to-pink-400 transition-all cursor-pointer"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  animate={{
                    boxShadow: [
                      '0 0 15px rgba(168, 85, 247, 0.5)',
                      '0 0 25px rgba(236, 72, 153, 0.5)',
                      '0 0 15px rgba(168, 85, 247, 0.5)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  title="User Profile"
                >
                  <User className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </motion.button>
                {profilePopup?.(profileButtonRef)}
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </motion.header>
  );
});
