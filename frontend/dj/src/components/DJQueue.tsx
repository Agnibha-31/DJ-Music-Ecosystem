import { motion, AnimatePresence } from 'motion/react';
import { Check, X, Music, TrendingUp, Clock, ListOrdered } from 'lucide-react';
import { useState, useCallback, memo, useMemo } from 'react';
import type { Song } from '../App';

interface DJQueueProps {
  queue: Song[];
  startRank: number;
  onAcceptSong: (id: string) => void;
  onRejectSong: (id: string) => void;
}

export const DJQueue = memo(function DJQueue({ queue, startRank, onAcceptSong, onRejectSong }: DJQueueProps) {
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'accept' | 'reject' | null>(null);

  const handleAction = useCallback((id: string, type: 'accept' | 'reject') => {
    setActionId(id);
    setActionType(type);
    
    setTimeout(() => {
      if (type === 'accept') {
        onAcceptSong(id);
      } else {
        onRejectSong(id);
      }
      setActionId(null);
      setActionType(null);
    }, 500);
  }, [onAcceptSong, onRejectSong]);

  const getTimeAgo = useCallback((timestamp: number) => {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  }, []);

  const getVoteTrend = useCallback((votes: number) => {
    if (votes >= 10) return { color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/40' };
    if (votes >= 5) return { color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/40' };
    return { color: 'text-gray-400', bg: 'bg-gray-500/20', border: 'border-gray-500/40' };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <motion.div
        className="bg-gradient-to-br from-cyan-500/15 to-purple-500/15 backdrop-blur-xl rounded-2xl p-4 border border-white/20"
        whileHover={{
          scale: 1.005,
          boxShadow: '0 25px 50px rgba(34, 211, 238, 0.25)',
          transition: { duration: 0.2 },
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-base font-black text-white">Extended Queue</h3>
              <p className="text-[10px] text-gray-400">Rank #{startRank}+</p>
            </div>
          </div>
          <div className="px-2 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/30">
            <span className="text-xs font-bold text-white">{queue.length}</span>
          </div>
        </div>

        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <Music className="w-10 h-10 text-gray-500 mb-2 opacity-50" />
            <p className="text-gray-400 text-sm">All in top 5!</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {queue.map((song, index) => {
                const isActing = actionId === song.id;
                const isAccepting = isActing && actionType === 'accept';
                const isRejecting = isActing && actionType === 'reject';
                const trend = getVoteTrend(song.votes);
                const actualRank = startRank + index;

                return (
                  <motion.div
                    key={song.id}
                    layout
                    initial={{ opacity: 0, x: -30, scale: 0.95 }}
                    animate={{ 
                      opacity: 1, 
                      x: 0, 
                      scale: 1,
                      backgroundColor: isAccepting 
                        ? 'rgba(34, 197, 94, 0.2)' 
                        : isRejecting 
                        ? 'rgba(239, 68, 68, 0.2)' 
                        : 'rgba(255, 255, 255, 0.05)'
                    }}
                    exit={{ 
                      opacity: 0, 
                      x: isAccepting ? 80 : -80, 
                      scale: 0.9,
                      transition: { duration: 0.25 }
                    }}
                    transition={{ 
                      type: 'spring', 
                      stiffness: 300, 
                      damping: 25,
                      delay: index * 0.02 
                    }}
                  >
                    <motion.div
                      className="bg-gradient-to-r from-white/5 to-white/0 backdrop-blur-sm rounded-xl p-3 border border-white/10"
                      whileHover={{
                        scale: 1.01,
                        borderColor: 'rgba(6, 182, 212, 0.3)',
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        transition: { duration: 0.2 },
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {/* Rank Badge */}
                        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center font-black text-white text-xs border border-gray-500/50">
                          #{actualRank}
                        </div>

                        {/* Song Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white font-bold text-sm truncate">{song.title}</h4>
                              <p className="text-gray-400 text-xs truncate">{song.artist}</p>
                            </div>
                            
                            {/* Votes Badge */}
                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg ${trend.bg} border ${trend.border}`}>
                              <TrendingUp className={`w-3 h-3 ${trend.color}`} />
                              <span className="font-black text-white text-xs">{song.votes}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="px-1.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/30">
                              {song.genre}
                            </span>
                            <div className="flex items-center gap-0.5 text-gray-500">
                              <Clock className="w-2.5 h-2.5" />
                              <span>{getTimeAgo(song.timestamp)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-1.5">
                          <motion.button
                            onClick={() => handleAction(song.id, 'accept')}
                            disabled={isActing}
                            className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white disabled:opacity-50"
                            whileHover={{ 
                              scale: 1.1,
                              boxShadow: '0 8px 20px rgba(34, 197, 94, 0.5)',
                            }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Check className="w-4 h-4" />
                          </motion.button>
                          
                          <motion.button
                            onClick={() => handleAction(song.id, 'reject')}
                            disabled={isActing}
                            className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 text-white disabled:opacity-50"
                            whileHover={{ 
                              scale: 1.1,
                              boxShadow: '0 8px 20px rgba(239, 68, 68, 0.5)',
                            }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <X className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
});
