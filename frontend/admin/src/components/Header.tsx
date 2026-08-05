import { motion } from 'motion/react';
import { Radio, Disc3, MapPin } from 'lucide-react';

export function Header() {
  return (
    <motion.header
      className="relative py-4 md:py-5 px-4 border-b border-white/10 backdrop-blur-md"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="container mx-auto max-w-7xl">
        <motion.div
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
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

          {/* Right: Venue Info + Icon */}
          <div className="flex items-center gap-4">
            {/* Venue Information */}
            <motion.div
              className="flex items-start gap-2 bg-white/5 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                transition: { duration: 0.2 }
              }}
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              >
                <MapPin className="w-4 h-4 md:w-5 md:h-5 text-pink-400 flex-shrink-0 mt-0.5" />
              </motion.div>
              <div className="text-left">
                <div className="text-xs md:text-sm font-black text-white">The Groove Lounge</div>
                <div className="text-[9px] md:text-[10px] text-purple-300/70">
                  123 Rhythm Street, Downtown, NY 10001
                </div>
              </div>
            </motion.div>

            {/* Radio Icon */}
            <motion.div
              className="hidden md:flex items-center gap-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <motion.div
                className="text-right mr-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <motion.p
                  className="text-lg font-black bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent"
                  animate={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  style={{
                    backgroundSize: '200% 200%',
                  }}
                >
                  Let's Groove!
                </motion.p>
              </motion.div>
              <motion.div
                animate={{ y: [0, -5, 0], rotateZ: [0, 8, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                whileHover={{ scale: 1.2 }}
              >
                <Radio className="w-7 h-7 md:w-8 md:h-8 text-purple-400" />
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.header>
  );
}