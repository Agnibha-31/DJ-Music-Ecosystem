import { motion } from 'motion/react';

export function Footer() {
  return (
    <motion.footer
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 1 }}
      className="relative mt-12 md:mt-20 py-8 border-t border-white/10 backdrop-blur-md"
    >
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Bottom text */}
        <motion.div
          className="text-center text-xs text-white/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <p>© 2025 Groove Queue • All vibes reserved</p>
        </motion.div>
      </div>

      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-32 h-32 rounded-full blur-3xl opacity-20"
            style={{
              background: `radial-gradient(circle, ${
                ['#06b6d4', '#a855f7', '#ec4899'][i]
              }, transparent)`,
              left: `${i * 40}%`,
              bottom: '-20%',
            }}
            animate={{
              y: [0, -30, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.5,
            }}
          />
        ))}
      </div>
    </motion.footer>
  );
}
