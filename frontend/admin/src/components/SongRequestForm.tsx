import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Music2, ListMusic } from 'lucide-react';
import type { Song } from '../App';
import { SONG_DATABASE, GENRES } from '../data/songDatabase';
import { SearchModal } from './SearchModal';

interface SongRequestFormProps {
  onAddSong: (song: Omit<Song, 'id' | 'timestamp' | 'votes'>) => void;
}

export function SongRequestForm({ onAddSong }: SongRequestFormProps) {
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedSong, setSelectedSong] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showFlyingPlane, setShowFlyingPlane] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGenre || !selectedSong) return;

    setIsSubmitting(true);
    setShowFlyingPlane(true);
    
    const songData = SONG_DATABASE[selectedGenre].find(s => s.title === selectedSong);
    if (!songData) return;

    setTimeout(() => {
      onAddSong({ 
        title: songData.title, 
        artist: songData.artist,
        genre: selectedGenre,
      });
      setSelectedGenre('');
      setSelectedSong('');
      setIsSubmitting(false);
      setTimeout(() => setShowFlyingPlane(false), 2000);
    }, 500);
  };

  const availableSongs = selectedGenre ? SONG_DATABASE[selectedGenre] : [];

  return (
    <motion.div
      initial={{ x: -100, opacity: 0, rotateY: -15 }}
      animate={{ x: 0, opacity: 1, rotateY: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="h-full"
      style={{ perspective: '1000px' }}
    >
      <motion.div
        className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/20 shadow-2xl h-full"
        style={{
          transformStyle: 'preserve-3d',
          willChange: 'transform',
        }}
        whileHover={{
          scale: 1.02,
          rotateX: 2,
          rotateY: 2,
          boxShadow: '0 30px 60px -12px rgba(236, 72, 153, 0.6)',
          transition: { duration: 0.2 },
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <motion.div
          className="flex items-center gap-3 mb-6"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Music2 className="w-8 h-8 text-cyan-400" />
          </motion.div>
          <h2 className="text-2xl md:text-3xl font-black text-white">Request a Song</h2>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Genre Dropdown */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
            whileHover={{ scale: 1.02 }}
            whileFocus={{ scale: 1.02 }}
          >
            <label className="block text-cyan-300 mb-2 flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              >
                <ListMusic className="w-4 h-4" />
              </motion.div>
              Select Genre
            </label>
            <select
              value={selectedGenre}
              onChange={(e) => {
                setSelectedGenre(e.target.value);
                setSelectedSong(''); // Reset song selection when genre changes
              }}
              className="w-full px-4 py-3 bg-black/30 border-2 border-purple-400/50 rounded-xl text-white placeholder-purple-300/50 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/30 transition-all duration-300 outline-none cursor-pointer hover:border-cyan-400/70 hover:bg-black/40"
              required
            >
              <option value="" disabled>Choose a genre...</option>
              {GENRES.map((genre) => (
                <option key={genre} value={genre} className="bg-purple-900 text-white">
                  {genre}
                </option>
              ))}
            </select>
          </motion.div>

          {/* Song Dropdown */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6, type: 'spring', stiffness: 300 }}
            whileHover={{ scale: 1.02 }}
            whileFocus={{ scale: 1.02 }}
          >
            <label className="block text-cyan-300 mb-2 flex items-center gap-2">
              <motion.div
                animate={{ 
                  y: [0, -3, 0],
                  rotate: [0, 10, -10, 0] 
                }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.7 }}
              >
                <Music2 className="w-4 h-4" />
              </motion.div>
              Select Song
            </label>
            <select
              value={selectedSong}
              onChange={(e) => setSelectedSong(e.target.value)}
              disabled={!selectedGenre}
              className="w-full px-4 py-3 bg-black/30 border-2 border-purple-400/50 rounded-xl text-white placeholder-purple-300/50 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/30 transition-all duration-300 outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:border-cyan-400/70 hover:bg-black/40"
              required
            >
              <option value="" disabled>
                {selectedGenre ? 'Choose a song...' : 'Select a genre first...'}
              </option>
              {availableSongs.map((song) => (
                <option key={song.title} value={song.title} className="bg-purple-900 text-white">
                  {song.title} - {song.artist}
                </option>
              ))}
            </select>
          </motion.div>

          <motion.button
            type="submit"
            disabled={isSubmitting || !selectedGenre || !selectedSong}
            className="w-full py-4 px-6 bg-gradient-to-r from-cyan-500 to-pink-500 rounded-xl font-black text-white text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden relative group"
            style={{
              transformStyle: 'preserve-3d',
              willChange: 'transform',
            }}
            whileHover={!isSubmitting && selectedGenre && selectedSong ? { 
              scale: 1.05, 
              y: -3,
              rotateX: 5,
              boxShadow: '0 20px 40px rgba(236, 72, 153, 0.5)',
              transition: { duration: 0.2 }
            } : {}}
            whileTap={{ scale: 0.95, y: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-pink-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            />
            <span className="relative flex items-center justify-center gap-2">
              {isSubmitting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Send className="w-5 h-5" />
                </motion.div>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Add to Queue
                </>
              )}
            </span>
          </motion.button>

          {/* Hyperlink to Search */}
          <motion.div
            className="text-center mt-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <motion.button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="text-cyan-300 hover:text-cyan-400 font-bold text-sm relative"
              style={{
                textShadow: '0 0 10px rgba(34, 211, 238, 0.5)',
              }}
              whileHover={{ 
                scale: 1.05, 
                y: -2,
                textShadow: '0 0 20px rgba(34, 211, 238, 0.9), 0 0 30px rgba(34, 211, 238, 0.6)',
              }}
              whileTap={{ scale: 0.95 }}
              animate={{
                textShadow: [
                  '0 0 10px rgba(34, 211, 238, 0.5)',
                  '0 0 20px rgba(34, 211, 238, 0.8)',
                  '0 0 10px rgba(34, 211, 238, 0.5)',
                ],
              }}
              transition={{
                textShadow: {
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
              }}
            >
              Couldn't find ? Groove here !
            </motion.button>
          </motion.div>
        </form>

        {/* Flying Paper Plane Animation */}
        <AnimatePresence>
          {showFlyingPlane && (
            <>
              {/* Smooth Circular Trail Effect */}
              {[...Array(30)].map((_, i) => {
                const progress = i / 30;
                const angle = progress * Math.PI * 2.5; // Spiral effect
                const radius = 35 + Math.sin(progress * Math.PI * 3) * 8; // Dynamic radius
                const centerX = 50;
                const centerY = 50;
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);
                
                return (
                  <motion.div
                    key={`trail-${i}`}
                    className="fixed w-2 h-2 rounded-full pointer-events-none"
                    style={{
                      background: `radial-gradient(circle, ${
                        i % 2 === 0 ? 'rgba(34, 211, 238, 0.9)' : 'rgba(236, 72, 153, 0.9)'
                      }, transparent)`,
                      boxShadow: `0 0 12px ${
                        i % 2 === 0 ? 'rgba(34, 211, 238, 0.6)' : 'rgba(236, 72, 153, 0.6)'
                      }`,
                      zIndex: 9999,
                      willChange: 'transform, opacity',
                    }}
                    initial={{
                      left: `${centerX}%`,
                      top: `${centerY}%`,
                      opacity: 0,
                    }}
                    animate={{
                      left: `${x}%`,
                      top: `${y}%`,
                      opacity: [0, 0.9, 0],
                      scale: [0.3, 1, 0],
                    }}
                    transition={{
                      duration: 3.5,
                      delay: i * 0.04,
                      ease: [0.43, 0.13, 0.23, 0.96], // Custom easing for smooth motion
                    }}
                  />
                );
              })}

              {/* Flying Paper Plane with Dynamic Realistic Path */}
              <motion.div
                className="fixed pointer-events-none"
                style={{
                  filter: 'drop-shadow(0 0 20px rgba(34, 211, 238, 0.9))',
                  zIndex: 9999,
                  willChange: 'transform',
                }}
                initial={{
                  left: '50%',
                  top: '50%',
                  rotate: -45,
                  scale: 0.8,
                }}
                animate={{
                  left: [
                    '50%', // Start center
                    '75%', // Right
                    '85%', // Further right with curve
                    '75%', // Back slight
                    '50%', // Top center
                    '25%', // Left
                    '15%', // Further left with curve
                    '25%', // Back slight
                    '50%', // Return center
                  ],
                  top: [
                    '50%', // Start center
                    '40%', // Up slightly
                    '25%', // Top right
                    '15%', // Higher
                    '10%', // Top
                    '15%', // Top left
                    '25%', // Down slight
                    '40%', // Middle left
                    '50%', // Return center
                  ],
                  rotate: [-45, 0, 45, 90, 135, 180, 225, 270, 315],
                  scale: [0.8, 1.2, 1.4, 1.3, 1.5, 1.3, 1.4, 1.2, 0.8],
                  rotateZ: [0, -5, 5, -3, 3, -5, 5, -3, 0], // Wobble for realism
                }}
                exit={{
                  opacity: 0,
                  scale: 0,
                }}
                transition={{
                  duration: 4,
                  ease: [0.45, 0.05, 0.55, 0.95], // Smooth bezier curve
                  times: [0, 0.125, 0.25, 0.325, 0.5, 0.625, 0.75, 0.875, 1],
                }}
              >
                <Send className="w-10 h-10 text-cyan-400" />
              </motion.div>

              {/* Light sparkles along path */}
              {[...Array(15)].map((_, i) => {
                const progress = i / 15;
                const angle = progress * Math.PI * 2.5;
                const radius = 35 + Math.sin(progress * Math.PI * 3) * 8;
                const x = 50 + radius * Math.cos(angle);
                const y = 50 + radius * Math.sin(angle);
                
                return (
                  <motion.div
                    key={`sparkle-${i}`}
                    className="fixed w-1 h-1 rounded-full bg-white pointer-events-none"
                    style={{
                      boxShadow: '0 0 8px rgba(255, 255, 255, 0.9)',
                      zIndex: 9999,
                      willChange: 'transform, opacity',
                    }}
                    initial={{
                      left: '50%',
                      top: '50%',
                      opacity: 0,
                    }}
                    animate={{
                      left: `${x}%`,
                      top: `${y}%`,
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      delay: i * 0.12,
                      ease: 'easeOut',
                    }}
                  />
                );
              })}
            </>
          )}
        </AnimatePresence>

        {/* Search Modal */}
        <SearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onAddSong={(song) => {
            setShowFlyingPlane(true);
            onAddSong(song);
            setTimeout(() => setShowFlyingPlane(false), 2000);
          }}
        />
      </motion.div>
    </motion.div>
  );
}