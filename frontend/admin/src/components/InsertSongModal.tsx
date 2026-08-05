import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Music, Plus, Check } from 'lucide-react';

interface InsertSongModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertSong: (title: string, artist: string, genre: string) => void;
}

const SONG_DATABASE: Record<string, Array<{ title: string; artist: string }>> = {
  'Rock': [
    { title: 'Sweet Child O\' Mine', artist: 'Guns N\' Roses' },
    { title: 'Bohemian Rhapsody', artist: 'Queen' },
    { title: 'Stairway to Heaven', artist: 'Led Zeppelin' },
    { title: 'Hotel California', artist: 'Eagles' },
    { title: 'Smells Like Teen Spirit', artist: 'Nirvana' },
    { title: 'Don\'t Stop Believin\'', artist: 'Journey' },
  ],
  'Pop': [
    { title: 'Uptown Funk', artist: 'Bruno Mars' },
    { title: 'Billie Jean', artist: 'Michael Jackson' },
    { title: 'Shake It Off', artist: 'Taylor Swift' },
    { title: 'Shape of You', artist: 'Ed Sheeran' },
    { title: 'Levitating', artist: 'Dua Lipa' },
    { title: 'Blinding Lights', artist: 'The Weeknd' },
  ],
  'Funk': [
    { title: 'Superstition', artist: 'Stevie Wonder' },
    { title: 'September', artist: 'Earth, Wind & Fire' },
    { title: 'Give It Away', artist: 'Red Hot Chili Peppers' },
    { title: 'Brick House', artist: 'Commodores' },
    { title: 'Get Down On It', artist: 'Kool & The Gang' },
  ],
  'Electronic': [
    { title: 'Get Lucky', artist: 'Daft Punk' },
    { title: 'One More Time', artist: 'Daft Punk' },
    { title: 'Wake Me Up', artist: 'Avicii' },
    { title: 'Titanium', artist: 'David Guetta' },
    { title: 'Animals', artist: 'Martin Garrix' },
  ],
  'Latin': [
    { title: 'Smooth', artist: 'Santana' },
    { title: 'Despacito', artist: 'Luis Fonsi' },
    { title: 'Bailando', artist: 'Enrique Iglesias' },
    { title: 'La Bamba', artist: 'Ritchie Valens' },
    { title: 'Macarena', artist: 'Los Del Rio' },
  ],
  'Hip Hop': [
    { title: 'Lose Yourself', artist: 'Eminem' },
    { title: 'Sicko Mode', artist: 'Travis Scott' },
    { title: 'HUMBLE.', artist: 'Kendrick Lamar' },
    { title: 'Hotline Bling', artist: 'Drake' },
    { title: 'In Da Club', artist: '50 Cent' },
    { title: 'Mo Money Mo Problems', artist: 'Biggie' },
  ],
  'Jazz': [
    { title: 'Take Five', artist: 'Dave Brubeck' },
    { title: 'So What', artist: 'Miles Davis' },
    { title: 'What a Wonderful World', artist: 'Louis Armstrong' },
    { title: 'Fly Me to the Moon', artist: 'Frank Sinatra' },
    { title: 'Kind of Blue', artist: 'Miles Davis' },
  ],
};

const GENRES = Object.keys(SONG_DATABASE);

export function InsertSongModal({ isOpen, onClose, onInsertSong }: InsertSongModalProps) {
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [selectedSong, setSelectedSong] = useState<string>('');
  const [genreOpen, setGenreOpen] = useState(false);
  const [songOpen, setSongOpen] = useState(false);
  const [genreFilter, setGenreFilter] = useState('');
  const [songFilter, setSongFilter] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const availableSongs = selectedGenre ? SONG_DATABASE[selectedGenre] || [] : [];
  const filteredGenres = GENRES.filter((genre) =>
    genre.toLowerCase().includes(genreFilter.trim().toLowerCase())
  );
  const filteredSongs = availableSongs.filter((song) => {
    const query = songFilter.trim().toLowerCase();
    if (!query) {
      return true;
    }

    return (
      song.title.toLowerCase().includes(query) ||
      song.artist.toLowerCase().includes(query)
    );
  });

  const resetForm = () => {
    setSelectedGenre('');
    setSelectedSong('');
    setGenreFilter('');
    setSongFilter('');
    setGenreOpen(false);
    setSongOpen(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const showSuccessAnimation = () => {
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 1500);
  };

  const handleImport = () => {
    if (!selectedGenre || !selectedSong) {
      return;
    }

    const songData = SONG_DATABASE[selectedGenre].find((entry) => entry.title === selectedSong);
    if (!songData) {
      return;
    }

    onInsertSong(songData.title, songData.artist, selectedGenre);
    showSuccessAnimation();
    resetForm();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-40"
            onClick={handleClose}
          />

          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-3xl bg-gradient-to-br from-slate-900/98 via-indigo-950/98 to-purple-950/98 backdrop-blur-xl rounded-2xl border border-purple-500/30 shadow-2xl flex flex-col max-h-[85vh]"
              onClick={(event) => event.stopPropagation()}
            >
              <AnimatePresence>
                {showSuccess && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 backdrop-blur-sm rounded-2xl flex items-center justify-center z-50"
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

              <div className="flex-shrink-0 px-6 py-5 border-b border-purple-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="p-2.5 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-400/30"
                      animate={{
                        boxShadow: [
                          '0 0 20px rgba(168, 85, 247, 0.3)',
                          '0 0 30px rgba(6, 182, 212, 0.3)',
                          '0 0 20px rgba(168, 85, 247, 0.3)',
                        ],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Music className="w-5 h-5 text-purple-400" />
                    </motion.div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Import from Database</h2>
                      <p className="text-xs text-purple-300/70">Choose a genre and song to add</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleClose}
                    className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition-colors flex-shrink-0"
                  >
                    <X className="w-5 h-5 text-red-400" />
                  </motion.button>
                </div>
              </div>

              <div className="flex-1 p-6 space-y-5 min-h-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-purple-300">Select Genre</label>
                    <button
                      type="button"
                      onClick={() => {
                        setGenreOpen((open) => !open);
                        setSongOpen(false);
                      }}
                      className="w-full px-4 py-3 bg-slate-800/60 border border-purple-500/20 rounded-xl text-left text-white flex items-center justify-between hover:border-purple-400/60 transition-colors"
                    >
                      <span className={selectedGenre ? 'text-white' : 'text-gray-400'}>
                        {selectedGenre || 'Choose a genre...'}
                      </span>
                      <span className={`transition-transform ${genreOpen ? 'rotate-180' : ''}`}>▼</span>
                    </button>
                    {genreOpen && (
                      <div className="dropdown-panel">
                        <div className="p-2 border-b border-purple-500/20">
                          <input
                            value={genreFilter}
                            onChange={(event) => setGenreFilter(event.target.value)}
                            placeholder="Filter genres..."
                            className="w-full px-3 py-2 text-sm bg-slate-900/60 border border-purple-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400/60"
                          />
                        </div>
                        <div className="scrollable-list max-h-56 overflow-y-auto">
                          {filteredGenres.map((genre) => (
                            <button
                              key={genre}
                              type="button"
                              onClick={() => {
                                setSelectedGenre(genre);
                                setSelectedSong('');
                                setSongFilter('');
                                setGenreOpen(false);
                              }}
                              className="w-full px-4 py-2.5 text-left text-white hover:bg-purple-500/10 border-b border-purple-500/10 last:border-b-0"
                            >
                              {genre}
                            </button>
                          ))}
                          {filteredGenres.length === 0 && (
                            <div className="px-4 py-3 text-sm text-gray-400">No genres found</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-purple-300">Select Song</label>
                    <button
                      type="button"
                      onClick={() => {
                        if (!selectedGenre) {
                          return;
                        }
                        setSongOpen((open) => !open);
                        setGenreOpen(false);
                      }}
                      disabled={!selectedGenre}
                      className="w-full px-4 py-3 bg-slate-800/60 border border-purple-500/20 rounded-xl text-left text-white flex items-center justify-between hover:border-purple-400/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className={selectedSong ? 'text-white' : 'text-gray-400'}>
                        {selectedSong || (selectedGenre ? 'Choose a song...' : 'Select a genre first')}
                      </span>
                      <span className={`transition-transform ${songOpen ? 'rotate-180' : ''}`}>▼</span>
                    </button>
                    {songOpen && (
                      <div className="dropdown-panel">
                        <div className="p-2 border-b border-purple-500/20">
                          <input
                            value={songFilter}
                            onChange={(event) => setSongFilter(event.target.value)}
                            placeholder="Filter songs or artists..."
                            className="w-full px-3 py-2 text-sm bg-slate-900/60 border border-purple-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400/60"
                          />
                        </div>
                        <div className="scrollable-list max-h-56 overflow-y-auto">
                          {filteredSongs.map((song) => (
                            <button
                              key={song.title}
                              type="button"
                              onClick={() => {
                                setSelectedSong(song.title);
                                setSongOpen(false);
                              }}
                              className={`w-full px-4 py-2.5 text-left border-b border-purple-500/10 last:border-b-0 hover:bg-purple-500/10 ${
                                selectedSong === song.title ? 'bg-purple-600/20 text-white' : 'text-gray-200'
                              }`}
                            >
                              <div className="text-sm font-semibold text-white truncate">{song.title}</div>
                              <div className="text-xs text-gray-400 truncate">{song.artist}</div>
                            </button>
                          ))}
                          {filteredSongs.length === 0 && (
                            <div className="px-4 py-3 text-sm text-gray-400">No songs found</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 flex flex-col sm:flex-row gap-3 px-6 py-4 border-t border-purple-500/20">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 rounded-lg font-semibold text-gray-300 bg-slate-700/30 border border-slate-600/50 hover:bg-slate-700/50 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleImport}
                  disabled={!selectedGenre || !selectedSong}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                    selectedGenre && selectedSong
                      ? 'bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white'
                      : 'bg-slate-700/50 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  Import Song
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
