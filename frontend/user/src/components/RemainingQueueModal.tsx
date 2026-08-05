import { motion, AnimatePresence } from 'motion/react';
import { X, Music, TrendingUp } from 'lucide-react';
import { memo } from 'react';
import type { Song } from '../App';

interface RemainingQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  remainingSongs: Song[];
  onVote: (id: string) => void;
}

function RemainingQueueModalComponent({ isOpen, onClose, remainingSongs, onVote }: RemainingQueueModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 100, rotateX: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 100, rotateX: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-2xl z-[60]"
            style={{ perspective: '1000px' }}
          >
            <motion.div
              className="backdrop-blur-2xl rounded-3xl p-6 md:p-8 border border-white/30 shadow-2xl"
              style={{
                transformStyle: 'preserve-3d',
                willChange: 'transform',
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.3), rgba(168, 85, 247, 0.3))',
              }}
              whileHover={{
                rotateX: 2,
                rotateY: 2,
                transition: { duration: 0.2 },
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <motion.div
                  className="flex items-center gap-3"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <TrendingUp className="w-8 h-8 text-pink-400" />
                  </motion.div>
                  <h2 className="text-2xl md:text-3xl font-black text-white">
                    Remaining Queue
                  </h2>
                </motion.div>

                <motion.button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-6 h-6 text-white" />
                </motion.button>
              </div>

              {/* Song List */}
              <div className="max-h-96 overflow-y-auto space-y-3 custom-scrollbar">
                {remainingSongs.length === 0 ? (
                  <motion.div
                    className="text-center py-12 text-purple-300/70"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Music className="w-12 h-12 mx-auto mb-3 text-purple-300/30" />
                    <p>All songs are in the top 5!</p>
                  </motion.div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {remainingSongs.map((song, index) => (
                      <motion.div
                        key={song.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => {
                          onVote(song.id);
                        }}
                        className="p-4 bg-black/30 hover:bg-black/50 rounded-xl border border-white/10 hover:border-cyan-400/50 cursor-pointer transition-all group"
                        style={{
                          transformStyle: 'preserve-3d',
                        }}
                        whileHover={{
                          scale: 1.02,
                          x: 5,
                          rotateY: 2,
                          transition: { duration: 0.2 },
                        }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-bold group-hover:text-cyan-400 transition-colors truncate">
                              {song.title}
                            </div>
                            <div className="text-sm text-purple-300/70 truncate">
                              {song.artist}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border border-cyan-400/30">
                              {song.genre}
                            </div>
                            
                            {/* Vote count */}
                            <motion.div
                              className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-pink-500/30 to-purple-500/30 border border-pink-400/30"
                              whileHover={{ scale: 1.1 }}
                            >
                              <TrendingUp className="w-3 h-3 text-pink-400" />
                              <span className="text-white font-black text-sm">
                                {song.votes}
                              </span>
                            </motion.div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>

              <motion.div
                className="mt-4 text-center text-xs text-purple-300/60"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Click on a song to vote and move it up the chart!
              </motion.div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export const RemainingQueueModal = memo(RemainingQueueModalComponent);