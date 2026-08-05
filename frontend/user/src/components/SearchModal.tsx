import { useState, memo, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Music } from 'lucide-react';
import type { Song } from '../App';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSong: (song: Omit<Song, 'id' | 'timestamp' | 'votes'> & { songId?: string }) => void;
  songs: Array<{ id: string; title: string; artist: string; genre: string }>;
}

function SearchModalComponent({ isOpen, onClose, onAddSong, songs }: SearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Memoize all songs to prevent recalculation on every render
  const allSongs = useMemo(() => songs, [songs]);

  // Case-insensitive search - memoize filtered results
  const filteredSongs = useMemo(() => 
    searchTerm
      ? allSongs.filter(song =>
          song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          song.artist.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : [],
    [searchTerm, allSongs]
  );

  const handleSelectSong = (song: { id: string; title: string; artist: string; genre: string }) => {
    onAddSong({ title: song.title, artist: song.artist, genre: song.genre, songId: song.id });
    setSearchTerm('');
    onClose();
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 search-modal-backdrop"
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
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(236, 72, 153, 0.3))',
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
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Music className="w-8 h-8 text-cyan-400" />
                  </motion.div>
                  <h2 className="text-2xl md:text-3xl font-black text-white">
                    Search Your Groove
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

              {/* Search Input */}
              <motion.div
                className="relative mb-6"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Type song or artist name..."
                  autoFocus
                  className="w-full pl-12 pr-4 py-4 bg-black/40 border-2 border-purple-400/50 rounded-xl text-white placeholder-purple-300/50 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/30 transition-all duration-300 outline-none"
                />
              </motion.div>

              {/* Results */}
              <div className="max-h-96 overflow-y-auto space-y-2 custom-scrollbar">
                {searchTerm === '' ? (
                  <motion.div
                    className="text-center py-12 text-purple-300/70"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Search className="w-12 h-12 mx-auto mb-3 text-purple-300/30" />
                    <p>Start typing to search songs...</p>
                  </motion.div>
                ) : filteredSongs.length === 0 ? (
                  <motion.div
                    className="text-center py-12 text-purple-300/70"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Music className="w-12 h-12 mx-auto mb-3 text-purple-300/30" />
                    <p>No songs found matching "{searchTerm}"</p>
                  </motion.div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {filteredSongs.map((song, index) => (
                      <motion.div
                        key={`${song.title}-${song.artist}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleSelectSong(song)}
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
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-white font-bold group-hover:text-cyan-400 transition-colors">
                              {song.title}
                            </div>
                            <div className="text-sm text-purple-300/70">
                              {song.artist}
                            </div>
                          </div>
                          <div className="px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border border-cyan-400/30">
                            {song.genre}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(modalContent, document.body);
}

export const SearchModal = memo(SearchModalComponent);