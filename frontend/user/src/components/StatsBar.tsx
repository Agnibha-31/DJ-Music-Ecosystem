import { motion } from 'motion/react';
import { Zap, TrendingUp, Users } from 'lucide-react';

interface StatsBarProps {
  totalSongs: number;
}

export function StatsBar({ totalSongs }: StatsBarProps) {
  const stats = [
    {
      icon: Zap,
      label: 'Energy',
      value: '100%',
      color: 'from-yellow-400 to-orange-500',
      textColor: 'text-yellow-400',
    },
    {
      icon: TrendingUp,
      label: 'Vibe Level',
      value: 'MAX',
      color: 'from-green-400 to-emerald-500',
      textColor: 'text-green-400',
    },
    {
      icon: Users,
      label: 'Queue',
      value: totalSongs.toString(),
      color: 'from-cyan-400 to-blue-500',
      textColor: 'text-cyan-400',
    },
  ];

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="max-w-7xl mx-auto px-4 mt-8"
      style={{ perspective: '1500px' }}
    >
      <div className="grid grid-cols-3 gap-3 md:gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            className="bg-black/30 backdrop-blur-lg rounded-2xl p-3 md:p-6 border border-white/10 relative overflow-hidden group"
            initial={{ scale: 0, rotate: -180, rotateY: -90 }}
            animate={{ scale: 1, rotate: 0, rotateY: 0 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 25,
              delay: 0.7 + index * 0.1,
            }}
            style={{
              transformStyle: 'preserve-3d',
              willChange: 'transform',
            }}
            whileHover={{
              scale: 1.08,
              y: -8,
              rotateX: 5,
              rotateY: 5,
              z: 30,
              transition: { duration: 0.2 },
            }}
          >
            <motion.div
              className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}
            />
            
            <div className="relative z-10 text-center">
              <motion.div
                className="flex justify-center mb-2"
                style={{
                  transformStyle: 'preserve-3d',
                }}
                animate={{
                  rotateZ: [0, 10, -10, 0],
                  scale: [1, 1.1, 1],
                  z: [0, 15, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: index * 0.3,
                }}
                whileHover={{ scale: 1.3, z: 30, rotateZ: 360 }}
              >
                <stat.icon className={`w-6 h-6 md:w-8 md:h-8 ${stat.textColor}`} />
              </motion.div>
              
              <motion.div
                className={`text-xl md:text-3xl font-black ${stat.textColor} mb-1`}
                animate={{
                  scale: stat.label === 'Queue' ? [1, 1.2, 1] : 1,
                }}
                transition={{
                  duration: 0.5,
                  repeat: stat.label === 'Queue' ? Infinity : 0,
                  repeatDelay: 2,
                }}
              >
                {stat.value}
              </motion.div>
              
              <div className="text-xs md:text-sm text-white/60 uppercase tracking-wider">
                {stat.label}
              </div>
            </div>

            {/* Animated border effect */}
            <motion.div
              className="absolute inset-0 opacity-0 group-hover:opacity-100"
              style={{
                background: `linear-gradient(90deg, transparent, ${stat.textColor.replace('text-', 'rgba(')}, transparent)`,
                filter: 'blur(20px)',
              }}
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}