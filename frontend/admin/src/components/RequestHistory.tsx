import { motion } from 'motion/react';
import { CheckCircle, XCircle, Clock, RotateCcw } from 'lucide-react';

interface RequestHistoryProps {
  acceptedSongs: { id: string; title: string; artist: string; timestamp: number }[];
  rejectedSongs: { id: string; title: string; artist: string; timestamp: number }[];
  onRevertAccepted: (id: string, title: string, artist: string) => void;
  onRevertRejected: (id: string, title: string, artist: string) => void;
}

export function RequestHistory({ acceptedSongs, rejectedSongs, onRevertAccepted, onRevertRejected }: RequestHistoryProps) {
  const allHistory = [
    ...acceptedSongs.map(s => ({ ...s, status: 'accepted' as const })),
    ...rejectedSongs.map(s => ({ ...s, status: 'rejected' as const })),
  ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 8);

  const getTimeAgo = (timestamp: number) => {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <motion.div
        className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20"
        whileHover={{
          scale: 1.005,
          boxShadow: '0 20px 40px rgba(168, 85, 247, 0.2)',
          transition: { duration: 0.2 },
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-black text-white">Recent Activity</h3>
          </div>
          <div className="px-2 py-1 rounded-lg bg-purple-500/20 border border-purple-400/30">
            <span className="text-xs font-bold text-white">{allHistory.length}</span>
          </div>
        </div>

        {allHistory.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-gray-400 text-sm">
            No activity yet
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[280px] overflow-y-auto custom-scrollbar">
            {allHistory.map((item, index) => (
              <motion.div
                key={`${item.id}-${item.timestamp}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
                className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
              >
                {item.status === 'accepted' ? (
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="text-white font-bold text-xs truncate">{item.title}</div>
                  <div className="text-gray-400 text-[10px] truncate">{item.artist}</div>
                </div>
                
                <div className="text-[10px] text-gray-500 flex-shrink-0">
                  {getTimeAgo(item.timestamp)}
                </div>

                {/* Revert button - for both accepted and rejected songs */}
                <motion.button
                  onClick={() => item.status === 'accepted' ? onRevertAccepted(item.id, item.title, item.artist) : onRevertRejected(item.id, item.title, item.artist)}
                  className={`p-1 rounded-md ${item.status === 'accepted' ? 'bg-red-500/20 hover:bg-red-500/30 border-red-500/40' : 'bg-yellow-500/20 hover:bg-yellow-500/30 border-yellow-500/40'} border opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title={item.status === 'accepted' ? 'Revert acceptance' : 'Revert rejection'}
                >
                  <RotateCcw className={`w-3 h-3 ${item.status === 'accepted' ? 'text-red-400' : 'text-yellow-400'}`} />
                </motion.button>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
