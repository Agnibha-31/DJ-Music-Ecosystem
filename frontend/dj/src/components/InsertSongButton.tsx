import { motion } from 'motion/react';
import { Plus } from 'lucide-react';

interface InsertSongButtonProps {
  onClick: () => void;
}

export function InsertSongButton({ onClick }: InsertSongButtonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: 0.24, // Matches the 4th card timing (index 3 * 0.08)
      }}
    >
      <motion.button
        onClick={onClick}
        className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-xl p-3 border border-white/20 w-full h-full"
        whileHover={{
          scale: 1.03,
          boxShadow: '0 15px 30px rgba(52, 211, 153, 0.4)',
          transition: { duration: 0.2 },
        }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500">
            <Plus className="w-4 h-4 text-white" />
          </div>
        </div>
        <div className="text-xs text-gray-300 mb-1">Insert Song</div>
        <div className="text-2xl font-black text-white">+</div>
      </motion.button>
    </motion.div>
  );
}
