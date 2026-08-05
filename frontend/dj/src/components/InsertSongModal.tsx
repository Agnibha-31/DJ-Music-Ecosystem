import { useState, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Music, Plus, Check } from 'lucide-react';

interface InsertSongModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertSong: (title: string, artist: string, genre: string) => void;
  songs: Array<{ title: string; artist: string; genre: string }>;
  genres?: string[];
}
const InsertSongModal = memo(function InsertSongModal({ isOpen, onClose, onInsertSong, songs, genres }: InsertSongModalProps) {
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [selectedSong, setSelectedSong] = useState<string>('');
  const [manualTitle, setManualTitle] = useState('');
  const [manualArtist, setManualArtist] = useState('');
  const [manualGenre, setManualGenre] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const genreOptions = useMemo(() => {
    if (genres && genres.length > 0) return genres;
    return Array.from(new Set(songs.map((song) => song.genre))).sort();
  }, [genres, songs]);

  const songsByGenre = useMemo(() => {
    return genreOptions.reduce<Record<string, Array<{ title: string; artist: string }>>>((acc, genre) => {
      acc[genre] = songs
        .filter((song) => song.genre === genre)
        .map((song) => ({ title: song.title, artist: song.artist }));
      return acc;
    }, {});
  }, [genreOptions, songs]);

  const availableSongs = selectedGenre ? songsByGenre[selectedGenre] || [] : [];

  const handleInsertFromDropdown = () => {
    if (selectedGenre && selectedSong) {
      const song = availableSongs.find(s => s.title === selectedSong);
      if (song) {
        onInsertSong(song.title, song.artist, selectedGenre);
        showSuccessAnimation();
        resetForm();
      }
    }
  };

  const handleInsertManual = () => {
    if (manualTitle.trim() && manualArtist.trim() && manualGenre.trim()) {
      onInsertSong(manualTitle.trim(), manualArtist.trim(), manualGenre.trim());
      showSuccessAnimation();
      resetForm();
    }
  };

  const showSuccessAnimation = () => {
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 1500);
  };

  const resetForm = () => {
    setSelectedGenre('');
    setSelectedSong('');
    setManualTitle('');
    setManualArtist('');
    setManualGenre('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-40"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="rounded-3xl border-2 border-purple-500/40 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
              style={{ 
                backgroundColor: '#141422bb',
                backdropFilter: 'blur(40px)'
              }}
            >
              {/* Success Animation Overlay */}
              <AnimatePresence>
                {showSuccess && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 backdrop-blur-sm rounded-3xl flex items-center justify-center z-10"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                      className="bg-emerald-500 rounded-full p-6"
                    >
                      <Check className="w-16 h-16 text-white" strokeWidth={3} />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Header */}
              <div className="p-6 border-b border-purple-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-400/30"
                      animate={{
                        boxShadow: [
                          '0 0 20px rgba(168, 85, 247, 0.3)',
                          '0 0 30px rgba(6, 182, 212, 0.3)',
                          '0 0 20px rgba(168, 85, 247, 0.3)',
                        ],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Music className="w-6 h-6 text-purple-400" />
                    </motion.div>
                    <div>
                      <h2 className="text-2xl font-black text-white">Insert New Song</h2>
                      <p className="text-xs text-purple-300/70">Add to queue instantly</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleClose}
                    className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition-colors"
                  >
                    <X className="w-5 h-5 text-red-400" />
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Method 1: Dropdown Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">Select from Database</h3>

                  {/* Genre Dropdown */}
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-semibold text-purple-300 min-w-[80px]">Genre</label>
                    <select
                      value={selectedGenre}
                      onChange={(e) => {
                        setSelectedGenre(e.target.value);
                        setSelectedSong('');
                      }}
                      className="dj-simple-select w-full px-4 py-3 bg-slate-800/10 border border-purple-500/30 rounded-xl text-white focus:outline-none focus:border-purple-400/50 transition-colors"
                    >
                      <option value="">Choose a genre...</option>
                      {genreOptions.map((genre) => (
                        <option key={genre} value={genre}>
                          {genre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Song Dropdown */}
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-semibold text-purple-300 min-w-[80px]">Song</label>
                    <select
                      value={selectedSong}
                      onChange={(e) => setSelectedSong(e.target.value)}
                      disabled={!selectedGenre}
                      className={`dj-simple-select w-full px-4 py-3 bg-slate-800/10 border border-purple-500/30 rounded-xl text-white focus:outline-none focus:border-purple-400/50 transition-colors ${
                        selectedGenre ? '' : 'opacity-50 cursor-not-allowed'
                      }`}
                    >
                      {!selectedGenre && <option value="">Select a genre first</option>}
                      {selectedGenre && <option value="">Choose a song...</option>}
                      {selectedGenre && availableSongs.length === 0 && (
                        <option value="" disabled>
                          No songs available
                        </option>
                      )}
                      {selectedGenre && availableSongs.map((song) => (
                        <option key={song.title} value={song.title}>
                          {song.title} - {song.artist}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Divider */}
                <div className="relative mt-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-purple-500/20"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 text-purple-300 font-bold">
                      OR
                    </span>
                  </div>
                </div>

                {/* Method 2: Manual Entry */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">Manual Entry</h3>

                  <div className="grid grid-cols-[140px_1fr] gap-6 items-center">
                    <label className="text-sm font-semibold text-purple-300 whitespace-nowrap">Song Title</label>
                    <input
                      type="text"
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                      placeholder="Enter song title..."
                      className="px-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400/50 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-[140px_1fr] gap-6 items-center">
                    <label className="text-sm font-semibold text-purple-300 whitespace-nowrap">Artist Name</label>
                    <input
                      type="text"
                      value={manualArtist}
                      onChange={(e) => setManualArtist(e.target.value)}
                      placeholder="Enter artist name..."
                      className="px-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400/50 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-[140px_1fr] gap-6 items-center">
                    <label className="text-sm font-semibold text-purple-300 whitespace-nowrap">Song Genre</label>
                    <input
                      type="text"
                      value={manualGenre}
                      onChange={(e) => setManualGenre(e.target.value)}
                      placeholder="Enter genre..."
                      className="px-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400/50 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Footer with Insert Button */}
              <div className="p-6 border-t border-purple-500/20">
                <div className="flex justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (selectedGenre && selectedSong) {
                        handleInsertFromDropdown();
                      } else if (manualTitle.trim() && manualArtist.trim() && manualGenre.trim()) {
                        handleInsertManual();
                      }
                    }}
                    disabled={!(selectedGenre && selectedSong) && !(manualTitle.trim() && manualArtist.trim() && manualGenre.trim())}
                    className="py-3 rounded-xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white border-2 border-purple-400/30 hover:border-cyan-400/50 hover:shadow-purple-500/50 disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ paddingLeft: '12px', paddingRight: '18px', minWidth: '120px', whiteSpace: 'nowrap' }}
                  >
                    <Plus className="w-5 h-5 flex-shrink-0" />
                    <span>Insert Song</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
});

export default InsertSongModal;
