import { useEffect, useMemo, useRef, useState, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Music2, ListMusic } from 'lucide-react';
import type { Song } from '../App';
import { SearchModal } from './SearchModal';

interface SongRequestFormProps {
  onAddSong: (song: Omit<Song, 'id' | 'timestamp' | 'votes'> & { songId?: string }) => void;
  systemMode?: any;
  songs: Array<{ id: string; title: string; artist: string; genre: string }>;
  genres: string[];
}

type MobileSelectProps = {
  value: string;
  placeholder: string;
  options: string[];
  disabled?: boolean;
  onChange: (value: string) => void;
};

function MobileSelect({ value, placeholder, options, disabled, onChange }: MobileSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutside = (event: MouseEvent | TouchEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, []);

  const selectedLabel = value || placeholder;

  return (
    <div ref={containerRef} className="queue-mobile-select md:hidden">
      <button
        type="button"
        className="queue-mobile-trigger"
        onClick={() => {
          if (disabled) return;
          setIsOpen((prev) => !prev);
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
      >
        <span className="queue-mobile-value">{selectedLabel}</span>
        <span className="queue-mobile-caret" aria-hidden style={{ fontSize: '18px', lineHeight: 1 }}>
          v
        </span>
      </button>
      {isOpen && (
        <ul className="queue-mobile-menu" role="listbox">
          {options.map((option) => (
            <li key={option}>
              <button
                type="button"
                className={`queue-mobile-option${option === value ? ' is-selected' : ''}`}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SongRequestFormComponent({ onAddSong, systemMode, songs, genres }: SongRequestFormProps) {
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedSong, setSelectedSong] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showFlyingPlane, setShowFlyingPlane] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const handler = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    setIsMobile(media.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!systemMode?.isLive || systemMode?.isMaintenance) return;
    if (!selectedGenre || !selectedSong) return;

    setIsSubmitting(true);
    setShowFlyingPlane(true);
    
    const songData = songs.find((song) => song.genre === selectedGenre && song.title === selectedSong);
    if (!songData) return;

    setTimeout(() => {
      onAddSong({ 
        title: songData.title, 
        artist: songData.artist,
        genre: selectedGenre,
        songId: songData.id
      });
      setSelectedGenre('');
      setSelectedSong('');
      setIsSubmitting(false);
      setTimeout(() => setShowFlyingPlane(false), 2000);
    }, 500);
  };

  // Memoize available songs to prevent unnecessary recalculations
  const availableSongs = useMemo(
    () => (selectedGenre ? songs.filter((song) => song.genre === selectedGenre) : []),
    [selectedGenre, songs]
  );

  return (
    <motion.div
      initial={{ x: -100, opacity: 0, rotateY: -15 }}
      animate={{ x: 0, opacity: 1, rotateY: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="h-full card-shell queue-request-card"
      style={{ perspective: '1000px' }}
    >
      <motion.div
        className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-3xl p-3 md:p-8 border border-white/20 shadow-2xl h-full"
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
          className="flex items-center gap-2 mb-2 md:mb-6"
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

        <form onSubmit={handleSubmit} className="space-y-2 md:space-y-5">
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
            {isMobile && (
              <MobileSelect
                value={selectedGenre}
                placeholder="Choose a genre..."
                options={genres}
                onChange={(value) => {
                  setSelectedGenre(value);
                  setSelectedSong('');
                }}
              />
            )}
            <select
              value={selectedGenre}
              onChange={(e) => {
                setSelectedGenre(e.target.value);
                setSelectedSong(''); // Reset song selection when genre changes
              }}
              className="queue-select hidden md:block w-full px-4 py-3 bg-black/30 border-2 border-purple-400/50 rounded-xl text-white placeholder-purple-300/50 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/30 transition-all duration-300 outline-none cursor-pointer hover:border-cyan-400/70 hover:bg-black/40"
              required
            >
              <option value="" disabled>Choose a genre...</option>
              {genres.map((genre) => (
                <option key={genre} value={genre} className="queue-select-option bg-purple-900 text-white">
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
            {isMobile && (
              <MobileSelect
                value={selectedSong}
                placeholder={selectedGenre ? 'Choose a song...' : 'Select a genre first...'}
                options={availableSongs.map((song) => song.title)}
                disabled={!selectedGenre}
                onChange={(value) => setSelectedSong(value)}
              />
            )}
            <select
              value={selectedSong}
              onChange={(e) => setSelectedSong(e.target.value)}
              disabled={!selectedGenre}
              className="queue-select hidden md:block w-full px-4 py-3 bg-black/30 border-2 border-purple-400/50 rounded-xl text-white placeholder-purple-300/50 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/30 transition-all duration-300 outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:border-cyan-400/70 hover:bg-black/40"
              required
            >
              <option value="" disabled>
                {selectedGenre ? 'Choose a song...' : 'Select a genre first...'}
              </option>
              {availableSongs.map((song) => (
                <option key={`${song.title}-${song.artist}`} value={song.title} className="queue-select-option bg-purple-900 text-white">
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

        {/* Flying Paper Plane Animation - Smooth Circular Floating Path */}
        <AnimatePresence>
          {showFlyingPlane && (
            <>
              {/* Main Paper Plane with Smooth Circular Motion */}
              <motion.div
                className="fixed pointer-events-none"
                style={{
                  filter: 'drop-shadow(0 0 25px rgba(34, 211, 238, 1)) drop-shadow(0 0 50px rgba(168, 85, 247, 0.7))',
                  zIndex: 9999,
                  willChange: 'transform',
                  contain: 'layout style paint',
                }}
                initial={{
                  left: '50%',
                  top: '50%',
                  scale: 1,
                  opacity: 1,
                }}
                animate={{
                  // Smooth circular floating path all over the screen
                  x: [
                    0,
                    window.innerWidth * 0.3,
                    window.innerWidth * 0.35,
                    window.innerWidth * 0.3,
                    0,
                    -window.innerWidth * 0.3,
                    -window.innerWidth * 0.35,
                    -window.innerWidth * 0.3,
                    0,
                  ],
                  y: [
                    0,
                    -window.innerHeight * 0.2,
                    -window.innerHeight * 0.4,
                    -window.innerHeight * 0.5,
                    -window.innerHeight * 0.4,
                    -window.innerHeight * 0.25,
                    -window.innerHeight * 0.1,
                    0,
                    0,
                  ],
                  rotate: [0, 20, 45, 60, 75, 90, 45, 0, 0],
                  rotateY: [0, 15, 30, 35, 30, 15, 0, -15, 0],
                  rotateX: [0, 10, 15, 10, 0, -10, -15, -10, 0],
                  scale: [1, 1.25, 1.35, 1.25, 1.1, 1, 1.05, 1.1, 1],
                  opacity: [1, 1, 1, 1, 1, 1, 1, 0.7, 0],
                }}
                exit={{
                  opacity: 0,
                  scale: 0,
                  y: -window.innerHeight,
                }}
                transition={{
                  duration: 5,
                  ease: 'easeInOut',
                  times: [0, 0.1, 0.25, 0.4, 0.5, 0.65, 0.8, 0.9, 1],
                }}
              >
                <Send className="w-12 h-12 text-cyan-400" style={{ filter: 'drop-shadow(0 0 10px rgba(34, 211, 238, 0.9))' }} />
              </motion.div>

              {/* Glowing Trail Following the Circular Path */}
              {[...Array(40)].map((_, i) => {
                const totalFrames = 9;
                const frameOffset = i / 40;
                const currentFrame = frameOffset * (totalFrames - 1);
                const frame = Math.floor(currentFrame);
                const nextFrame = Math.min(frame + 1, totalFrames - 1);
                const progress = currentFrame - frame;

                const pathPoints = [
                  { x: 0, y: 0 },
                  { x: window.innerWidth * 0.3, y: -window.innerHeight * 0.2 },
                  { x: window.innerWidth * 0.35, y: -window.innerHeight * 0.4 },
                  { x: window.innerWidth * 0.3, y: -window.innerHeight * 0.5 },
                  { x: 0, y: -window.innerHeight * 0.4 },
                  { x: -window.innerWidth * 0.3, y: -window.innerHeight * 0.25 },
                  { x: -window.innerWidth * 0.35, y: -window.innerHeight * 0.1 },
                  { x: -window.innerWidth * 0.3, y: 0 },
                  { x: 0, y: 0 },
                ];

                const current = pathPoints[frame];
                const next = pathPoints[nextFrame];
                const x = current.x + (next.x - current.x) * progress;
                const y = current.y + (next.y - current.y) * progress;

                return (
                  <motion.div
                    key={`glow-trail-${i}`}
                    className="fixed rounded-full pointer-events-none"
                    style={{
                      width: '3px',
                      height: '3px',
                      background: `radial-gradient(circle, ${
                        i % 4 === 0 ? 'rgba(34, 211, 238, 1)' : i % 4 === 1 ? 'rgba(168, 85, 247, 1)' : i % 4 === 2 ? 'rgba(236, 72, 153, 1)' : 'rgba(34, 211, 238, 0.8)'
                      }, transparent)`,
                      boxShadow: `0 0 12px ${
                        i % 4 === 0 ? 'rgba(34, 211, 238, 0.9)' : i % 4 === 1 ? 'rgba(168, 85, 247, 0.9)' : i % 4 === 2 ? 'rgba(236, 72, 153, 0.9)' : 'rgba(34, 211, 238, 0.8)'
                      }`,
                      zIndex: 9998,
                      willChange: 'transform',
                      contain: 'paint',
                    }}
                    initial={{
                      left: '50%',
                      top: '50%',
                      opacity: 0,
                      scale: 0,
                    }}
                    animate={{
                      x: x,
                      y: y,
                      opacity: [0, 0.95, 0.6, 0],
                      scale: [0, 1.2, 1, 0],
                    }}
                    transition={{
                      duration: 5,
                      delay: i * 0.015,
                      ease: 'easeInOut',
                    }}
                  />
                );
              })}

              {/* Radiant Burst Particles */}
              {[...Array(25)].map((_, i) => {
                const angle = (i / 25) * Math.PI * 2;
                const distance = 250 + Math.random() * 100;
                const x = Math.cos(angle) * distance;
                const y = Math.sin(angle) * distance;

                return (
                  <motion.div
                    key={`burst-${i}`}
                    className="fixed rounded-full pointer-events-none"
                    style={{
                      width: '2px',
                      height: '2px',
                      background: `radial-gradient(circle, rgba(255, 255, 255, 1), transparent)`,
                      boxShadow: `0 0 6px rgba(255, 255, 255, 0.9)`,
                      zIndex: 9998,
                      willChange: 'transform',
                      contain: 'paint',
                    }}
                    initial={{
                      left: '50%',
                      top: '50%',
                      opacity: 0,
                      scale: 0,
                    }}
                    animate={{
                      x: [0, x],
                      y: [0, y],
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0],
                    }}
                    transition={{
                      duration: 2,
                      delay: i * 0.04,
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
          songs={songs}
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

export const SongRequestForm = memo(SongRequestFormComponent);

// Ensure default export for lazy loading
export default SongRequestForm;