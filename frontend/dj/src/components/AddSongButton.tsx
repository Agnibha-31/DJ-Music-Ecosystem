import { motion } from 'motion/react';
import { Plus } from 'lucide-react';
import { memo } from 'react';

interface AddSongButtonProps {
  onClick: () => void;
}

export const AddSongButton = memo(function AddSongButton({ onClick }: AddSongButtonProps) {
  return (
    <motion.div
      className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-xl p-3 border border-white/20 cursor-pointer"
      onClick={onClick}
      whileHover={{
        scale: 1.05,
        boxShadow: '0 20px 40px -10px rgba(139, 92, 246, 0.5)',
      }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
          <Plus className="w-4 h-4 text-white" />
        </div>
      </div>
      <div className="text-xs text-gray-300 mb-1">Add Song</div>
      <div className="text-lg font-black text-white">Insert New</div>
    </motion.div>
  );
});
