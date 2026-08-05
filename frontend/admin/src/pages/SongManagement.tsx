import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Music2,
  Plus,
  Search,
  Edit,
  Trash2,
  Download,
  Upload,
  Filter,
  Check,
  X,
  AlertCircle,
  CheckCircle,
  Ban,
  PlayCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import type { Song } from '../context/AdminContext';
import { DatabaseDialog } from '../components/DatabaseDialog';

export function SongManagement() {
  const { songs, addSong, updateSong, deleteSong, bulkImportSongs, bulkUpdateSongStatus, saveVenueSongSelection } = useAdmin();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterGenre, setFilterGenre] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'disabled' | 'blocked'>('all');
  const [selectedSongs, setSelectedSongs] = useState<string[]>([]);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [newSong, setNewSong] = useState({
    title: '',
    artist: '',
    genre: 'Pop',
    album: '',
    duration: '',
    language: 'English',
    explicit: false,
    status: 'active' as Song['status'],
  });

  // CSV Import State
  const [dragActive, setDragActive] = useState(false);
  const [parsedSongs, setParsedSongs] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  const genres = Array.from(new Set(songs.map(s => s.genre)));

  // Filter songs
  const filteredSongs = songs.filter(song => {
    const matchesSearch = song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = filterGenre === 'all' || song.genre === filterGenre;
    const matchesStatus = filterStatus === 'all' || song.status === filterStatus;
    return matchesSearch && matchesGenre && matchesStatus;
  });

  // Handle Add Song
  const handleAddSong = () => {
    if (newSong.title && newSong.artist) {
      addSong(newSong);
      setNewSong({ title: '', artist: '', genre: 'Pop', album: '', duration: '', language: 'English', explicit: false, status: 'active' });
      setIsAddModalOpen(false);
    }
  };

  // Handle Edit Song
  const handleUpdateSong = () => {
    if (editingSong) {
      updateSong(editingSong.id, editingSong);
      setEditingSong(null);
      setIsEditModalOpen(false);
    }
  };

  // Handle Delete Song
  const handleDeleteSong = (id: string) => {
    if (confirm('Are you sure you want to delete this song?')) {
      deleteSong(id);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Title', 'Artist', 'Genre', 'Album', 'Duration', 'Language', 'Explicit', 'Status', 'Play Count', 'Vote Count'];
    const rows = filteredSongs.map(song => [
      song.title,
      song.artist,
      song.genre,
      song.album || '',
      song.duration || '',
      song.language || '',
      song.explicit ? 'Yes' : 'No',
      song.status,
      song.playCount,
      song.voteCount
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `song-library-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // CSV Import Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

    const titleIndex = headers.findIndex(h => h.includes('title') || h.includes('song'));
    const artistIndex = headers.findIndex(h => h.includes('artist'));
    const genreIndex = headers.findIndex(h => h.includes('genre'));
    const albumIndex = headers.findIndex(h => h.includes('album'));
    const durationIndex = headers.findIndex(h => h.includes('duration') || h.includes('length'));
    const languageIndex = headers.findIndex(h => h.includes('language'));
    const explicitIndex = headers.findIndex(h => h.includes('explicit'));

    if (titleIndex === -1 || artistIndex === -1) {
      throw new Error('CSV must contain Title and Artist columns');
    }

    const importedSongs: any[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());

      const title = values[titleIndex];
      const artist = values[artistIndex];

      if (!title || !artist) {
        errors.push(`Row ${i + 1}: Missing title or artist`);
        continue;
      }

      importedSongs.push({
        title,
        artist,
        genre: genreIndex !== -1 ? values[genreIndex] : 'Pop',
        album: albumIndex !== -1 ? values[albumIndex] : '',
        duration: durationIndex !== -1 ? values[durationIndex] : '',
        language: languageIndex !== -1 ? values[languageIndex] : 'English',
        explicit: explicitIndex !== -1 ? values[explicitIndex].toLowerCase() === 'yes' : false,
        status: 'active' as Song['status'],
      });
    }

    setImportErrors(errors);
    setParsedSongs(importedSongs);
  };

  const handleFile = async (file: File) => {
    try {
      const text = await file.text();
      parseCSV(text);
    } catch (error) {
      setImportErrors([error instanceof Error ? error.message : 'Failed to parse file']);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleImport = () => {
    bulkImportSongs(parsedSongs);
    setParsedSongs([]);
    setImportErrors([]);
    setIsImportModalOpen(false);
  };

  const handleDatabaseImport = (payload: { genre: string; songs: Array<{ title: string; artist: string }> }) => {
    if (!payload.genre || payload.songs.length === 0) return;
    saveVenueSongSelection(payload);
  };

  // Bulk Actions
  const handleBulkStatusChange = (status: Song['status']) => {
    bulkUpdateSongStatus(selectedSongs, status);
    setSelectedSongs([]);
  };

  // Toggle Selection
  const toggleSelection = (id: string) => {
    setSelectedSongs(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedSongs(selectedSongs.length === filteredSongs.length ? [] : filteredSongs.map(s => s.id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Song Management</h1>
          <p className="text-purple-400 font-semibold">{songs.length} total songs • {filteredSongs.length} filtered</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <motion.button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-400 font-bold text-sm transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Download className="w-4 h-4" />
            Export CSV
          </motion.button>
          <motion.button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-400 font-bold text-sm transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </motion.button>
          <button
            onClick={() => setIsDialogOpen(true)}
            className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
            Database
          </button>
          <DatabaseDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            onImportSongs={handleDatabaseImport}
          />
        </div>
      </motion.div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedSongs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 backdrop-blur-xl rounded-xl p-4 border border-purple-500/30"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-purple-400" />
                <span className="text-white font-bold">{selectedSongs.length} songs selected</span>
              </div>
              <div className="flex gap-2">
                <motion.button
                  onClick={() => handleBulkStatusChange('active')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 font-bold text-xs"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <PlayCircle className="w-4 h-4" />
                  Enable
                </motion.button>
                <motion.button
                  onClick={() => handleBulkStatusChange('disabled')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-400 font-bold text-xs"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <EyeOff className="w-4 h-4" />
                  Disable
                </motion.button>
                <motion.button
                  onClick={() => handleBulkStatusChange('blocked')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-bold text-xs"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Ban className="w-4 h-4" />
                  Block
                </motion.button>
                <motion.button
                  onClick={() => setSelectedSongs([])}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-500/20 hover:bg-gray-500/30 border border-gray-500/30 text-gray-400 font-bold text-xs"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-4 h-4" />
                  Clear
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-slate-900/90 to-purple-950/90 backdrop-blur-xl rounded-2xl p-5 border border-purple-500/30 shadow-xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search
            className="absolute left-3 w-5 h-5 text-gray-500" 
              style={{ top: '12px' }}
            />
            <input
              type="text"
              placeholder="Search songs or artists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors font-medium"
            />
          </div>

          {/* Genre Filter */}
          <div className="relative">
            <Filter className="absolute left-3 w-5 h-5 text-gray-500"
              style={{ top: '12px' }}
            />
            <select
              value={filterGenre}
              onChange={(e) => setFilterGenre(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-purple-500 appearance-none transition-colors font-medium"
            >
              <option value="all">All Genres</option>
              {genres.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Eye className="absolute left-3 w-5 h-5 text-gray-500"
              style={{ top: '12px' }}
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-purple-500 appearance-none transition-colors font-medium"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Songs Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-slate-900/90 to-purple-950/90 backdrop-blur-xl rounded-2xl border border-purple-500/30 shadow-2xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedSongs.length === filteredSongs.length && filteredSongs.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-white/20 bg-white/10"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-black text-purple-300 uppercase tracking-widest">Song</th>
                <th className="px-6 py-4 text-left text-xs font-black text-purple-300 uppercase tracking-widest">Artist</th>
                <th className="px-6 py-4 text-left text-xs font-black text-purple-300 uppercase tracking-widest">Genre</th>
                <th className="px-6 py-4 text-left text-xs font-black text-purple-300 uppercase tracking-widest">Album</th>
                <th className="px-6 py-4 text-center text-xs font-black text-purple-300 uppercase tracking-widest">Duration</th>
                <th className="px-6 py-4 text-left text-xs font-black text-purple-300 uppercase tracking-widest">Plays</th>
                <th className="px-6 py-4 text-left text-xs font-black text-purple-300 uppercase tracking-widest">Votes</th>
                <th className="px-6 py-4 text-left text-xs font-black text-purple-300 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-right text-xs font-black text-purple-300 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredSongs.map((song, index) => (
                <motion.tr
                  key={song.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedSongs.includes(song.id)}
                      onChange={() => toggleSelection(song.id)}
                      className="w-4 h-4 rounded border-white/20 bg-white/10"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center shadow-lg">
                        <Music2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-white font-bold text-sm">{song.title}</div>
                        {song.explicit && (
                          <span className="text-[10px] font-black text-red-400 uppercase">Explicit</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-300 text-sm font-medium">{song.artist}</td>
                  <td className="px-6 py-4 whitespace-nowrap" style={{ minWidth: '140px' }}>
                    <span
                      className="inline-flex items-center px-2 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-400/30"
                      style={{ whiteSpace: 'nowrap', minWidth: 'max-content' }}
                    >
                      {song.genre}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-xs">{song.album || '-'}</td>
                  <td className="px-6 py-4 text-center text-gray-400 text-xs font-mono">{song.duration || '-'}</td>
                  <td className="px-6 py-4 text-white font-bold text-sm">{song.playCount}</td>
                  <td className="px-6 py-4 text-cyan-400 font-bold text-sm">{song.voteCount}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${song.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                      song.status === 'disabled' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                        'bg-red-500/20 text-red-400 border-red-500/30'
                      }`}>
                      {song.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <motion.button
                        onClick={() => { setEditingSong(song); setIsEditModalOpen(true); }}
                        className="p-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-400"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Edit className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        onClick={() => handleDeleteSong(song.id)}
                        className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Add Song Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setIsAddModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-slate-900 to-purple-950 rounded-2xl p-6 max-w-2xl w-full border border-purple-500/30 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-white">Add New Song</h2>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-purple-300 mb-2">Title *</label>
                    <input
                      type="text"
                      value={newSong.title}
                      onChange={(e) => setNewSong({ ...newSong, title: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                      placeholder="Enter song title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-purple-300 mb-2">Artist *</label>
                    <input
                      type="text"
                      value={newSong.artist}
                      onChange={(e) => setNewSong({ ...newSong, artist: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                      placeholder="Enter artist name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-purple-300 mb-2">Genre</label>
                    <input
                      type="text"
                      value={newSong.genre}
                      onChange={(e) => setNewSong({ ...newSong, genre: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                      placeholder="e.g., Pop, Rock, Jazz"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-purple-300 mb-2">Album</label>
                    <input
                      type="text"
                      value={newSong.album}
                      onChange={(e) => setNewSong({ ...newSong, album: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                      placeholder="Album name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-purple-300 mb-2">Duration</label>
                    <input
                      type="text"
                      value={newSong.duration}
                      onChange={(e) => setNewSong({ ...newSong, duration: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                      placeholder="e.g., 3:45"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-purple-300 mb-2">Language</label>
                    <input
                      type="text"
                      value={newSong.language}
                      onChange={(e) => setNewSong({ ...newSong, language: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                      placeholder="e.g., English"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newSong.explicit}
                      onChange={(e) => setNewSong({ ...newSong, explicit: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm font-bold text-purple-300">Explicit Content</span>
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <motion.button
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/20 text-gray-300 font-bold text-sm"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={handleAddSong}
                    disabled={!newSong.title || !newSong.artist}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold text-sm shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Add Song
                    </div>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Song Modal */}
      <AnimatePresence>
        {isEditModalOpen && editingSong && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setIsEditModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-slate-900 to-purple-950 rounded-2xl p-6 max-w-2xl w-full border border-purple-500/30 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-white">Edit Song</h2>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-purple-300 mb-2">Title</label>
                    <input
                      type="text"
                      value={editingSong.title}
                      onChange={(e) => setEditingSong({ ...editingSong, title: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-purple-300 mb-2">Artist</label>
                    <input
                      type="text"
                      value={editingSong.artist}
                      onChange={(e) => setEditingSong({ ...editingSong, artist: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-purple-300 mb-2">Genre</label>
                    <input
                      type="text"
                      value={editingSong.genre}
                      onChange={(e) => setEditingSong({ ...editingSong, genre: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-purple-300 mb-2">Album</label>
                    <input
                      type="text"
                      value={editingSong.album || ''}
                      onChange={(e) => setEditingSong({ ...editingSong, album: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-purple-300 mb-2">Duration</label>
                    <input
                      type="text"
                      value={editingSong.duration || ''}
                      onChange={(e) => setEditingSong({ ...editingSong, duration: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-purple-300 mb-2">Language</label>
                    <input
                      type="text"
                      value={editingSong.language || ''}
                      onChange={(e) => setEditingSong({ ...editingSong, language: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-purple-300 mb-2">Status</label>
                    <select
                      value={editingSong.status}
                      onChange={(e) => setEditingSong({ ...editingSong, status: e.target.value as Song['status'] })}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white"
                    >
                      <option value="active">Active</option>
                      <option value="disabled">Disabled</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingSong.explicit}
                      onChange={(e) => setEditingSong({ ...editingSong, explicit: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm font-bold text-purple-300">Explicit Content</span>
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <motion.button
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/20 text-gray-300 font-bold text-sm"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={handleUpdateSong}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold text-sm shadow-lg"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      Update Song
                    </div>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Import CSV Modal */}
      <AnimatePresence>
        {isImportModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setIsImportModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-slate-900 to-purple-950 rounded-2xl p-6 max-w-3xl w-full border border-purple-500/30 shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-white">Import Songs from CSV</h2>
                <button
                  onClick={() => {
                    setIsImportModalOpen(false);
                    setParsedSongs([]);
                    setImportErrors([]);
                  }}
                  className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {parsedSongs.length === 0 ? (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${dragActive ? 'border-purple-500 bg-purple-500/10' : 'border-white/20 bg-white/5'
                    }`}
                >
                  <Upload className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Drop your CSV file here</h3>
                  <p className="text-gray-400 mb-4">or click to browse</p>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileInput}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label htmlFor="csv-upload">
                    <motion.div
                      className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold cursor-pointer"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      Select CSV File
                    </motion.div>
                  </label>
                  <div className="mt-6 text-left bg-white/5 rounded-lg p-4">
                    <p className="text-sm font-bold text-purple-300 mb-2">CSV Format Requirements:</p>
                    <ul className="text-xs text-gray-400 space-y-1">
                      <li>• Required columns: Title, Artist</li>
                      <li>• Optional columns: Genre, Album, Duration, Language, Explicit</li>
                      <li>• First row should contain column headers</li>
                      <li>• Explicit column should contain "Yes" or "No"</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {importErrors.length > 0 && (
                    <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-red-400 font-bold mb-2">Import Warnings</h4>
                          <ul className="text-sm text-red-300 space-y-1">
                            {importErrors.map((error, idx) => (
                              <li key={idx}>• {error}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      <p className="text-emerald-400 font-bold">
                        {parsedSongs.length} songs ready to import
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4 max-h-60 overflow-y-auto">
                    <h4 className="text-sm font-bold text-purple-300 mb-3">Preview:</h4>
                    <div className="space-y-2">
                      {parsedSongs.slice(0, 10).map((song, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-sm">
                          <Music2 className="w-4 h-4 text-purple-400" />
                          <span className="text-white font-medium">{song.title}</span>
                          <span className="text-gray-400">by {song.artist}</span>
                          <span className="text-purple-400 text-xs">({song.genre})</span>
                        </div>
                      ))}
                      {parsedSongs.length > 10 && (
                        <p className="text-gray-500 text-xs mt-2">
                          ...and {parsedSongs.length - 10} more songs
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <motion.button
                      onClick={() => {
                        setParsedSongs([]);
                        setImportErrors([]);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/20 text-gray-300 font-bold text-sm"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      onClick={handleImport}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold text-sm shadow-lg"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Import {parsedSongs.length} Songs
                      </div>
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
