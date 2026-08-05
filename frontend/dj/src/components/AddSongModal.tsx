import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Music, Plus, Check } from 'lucide-react';

interface AddSongModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSong: (title: string, artist: string, genre: string) => void;
  songs: Array<{ title: string; artist: string; genre: string }>;
  genres?: string[];
}
export function AddSongModal({ isOpen, onClose, onAddSong, songs, genres }: AddSongModalProps) {
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [selectedSong, setSelectedSong] = useState<string>('');
  const [manualTitle, setManualTitle] = useState('');
  const [manualArtist, setManualArtist] = useState('');
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
        onAddSong(song.title, song.artist, selectedGenre);
        showSuccessAnimation();
        resetForm();
      }
    }
  };

  const handleInsertManual = () => {
    if (manualTitle.trim() && manualArtist.trim()) {
      // Use selected genre or default to 'Pop'
      const genre = selectedGenre || 'Pop';
      onAddSong(manualTitle.trim(), manualArtist.trim(), genre);
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
              className="bg-gradient-to-br from-slate-900/98 via-indigo-950/98 to-purple-950/98 backdrop-blur-xl rounded-3xl border-2 border-purple-500/40 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
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
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-black text-sm">
                      1
                    </div>
                    <h3 className="text-lg font-bold text-white">Select from Database</h3>
                  </div>

                  {/* Genre Dropdown */}
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-semibold text-purple-300 min-w-[80px]">Genre</label>
                    <select
                      value={selectedGenre}
                      onChange={(e) => {
                        setSelectedGenre(e.target.value);
                        setSelectedSong('');
                      }}
                      className="dj-simple-select w-full px-4 py-3 bg-slate-800/30 border border-purple-500/30 rounded-xl text-white focus:outline-none focus:border-purple-400/50 transition-colors"
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
                      className={`dj-simple-select w-full px-4 py-3 bg-slate-800/30 border border-purple-500/30 rounded-xl text-white focus:outline-none focus:border-purple-400/50 transition-colors ${
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

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleInsertFromDropdown}
                    disabled={!selectedGenre || !selectedSong}
                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                      selectedGenre && selectedSong
                        ? 'bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white'
                        : 'bg-slate-700/50 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Plus className="w-5 h-5" />
                    Insert Song
                  </motion.button>
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-purple-500/20"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-purple-300 font-bold">
                      OR
                    </span>
                  </div>
                </div>

                {/* Method 2: Manual Entry */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center text-white font-black text-sm">
                      2
                    </div>
                    <h3 className="text-lg font-bold text-white">Manual Entry</h3>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-purple-300">Song Title</label>
                    <input
                      type="text"
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                      placeholder="Enter song title..."
                      className="w-full px-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400/50 transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-purple-300">Artist Name</label>
                    <input
                      type="text"
                      value={manualArtist}
                      onChange={(e) => setManualArtist(e.target.value)}
                      placeholder="Enter artist name..."
                      className="w-full px-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400/50 transition-colors"
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleInsertManual}
                    disabled={!manualTitle.trim() || !manualArtist.trim()}
                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                      manualTitle.trim() && manualArtist.trim()
                        ? 'bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white'
                        : 'bg-slate-700/50 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Plus className="w-5 h-5" />
                    Insert Song
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
