import { useState, useEffect, useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Select from '@radix-ui/react-select';
import { ensureAdminSession, requestJson } from '../utils/apiClient';

interface DatabaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSongs: (payload: { genre: string; songs: Array<{ title: string; artist: string }> }) => void;
}

export function DatabaseDialog({ open, onOpenChange, onImportSongs }: DatabaseDialogProps) {
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [selectedSongs, setSelectedSongs] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [catalogData, setCatalogData] = useState<Record<string, Array<{ title: string; artist: string }>>>({});

  const genres = Object.keys(catalogData);
  const availableSongs = selectedGenre ? catalogData[selectedGenre] : [];

  // Filter songs based on search query
  const filteredSongs = useMemo(() => {
    if (!searchQuery.trim()) {
      return availableSongs;
    }
    const query = searchQuery.toLowerCase();
    return availableSongs.filter(song =>
      song.title.toLowerCase().includes(query) ||
      song.artist.toLowerCase().includes(query)
    );
  }, [availableSongs, searchQuery]);

  useEffect(() => {
    if (!open) {
      // Reset on close
      setSelectedGenre('');
      setSelectedSongs([]);
      setSearchQuery('');
      return;
    }
    const loadCatalog = async () => {
      try {
        await ensureAdminSession();
        const data = await requestJson<Record<string, Array<{ title: string; artist: string }>>>("/songs/database/raw");
        setCatalogData(data ?? {});
      } catch (error) {
        console.error('Failed to load song catalog:', error);
        setCatalogData({});
      }
    };
    loadCatalog();
  }, [open]);

  const handleGenreChange = (genre: string) => {
    setSelectedGenre(genre);
    setSelectedSongs([]);
    setSearchQuery('');
  };

  const toggleSongSelection = (songTitle: string) => {
    setSelectedSongs(prev =>
      prev.includes(songTitle)
        ? prev.filter(s => s !== songTitle)
        : [...prev, songTitle]
    );
  };

  const handleImport = () => {
    const songsToImport = availableSongs.filter(song => selectedSongs.includes(song.title));
    onImportSongs({ genre: selectedGenre, songs: songsToImport });
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSelectedGenre('');
    setSelectedSongs([]);
    setSearchQuery('');
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 bg-[rgba(0,0,0,0.75)] database-dialog-overlay" />
        <Dialog.Content
          className="fixed bg-[rgba(26,31,58,0.7)] border border-purple-500/30 rounded-xl p-6 w-[500px] max-h-[85vh] overflow-y-auto z-50 shadow-2xl database-dialog-content"
        >
          <Dialog.Title className="text-2xl font-bold mb-2 text-white">
            Database Filter
          </Dialog.Title>
          <Dialog.Description className="text-gray-400 mb-6">
            Select a genre and import songs from the database
          </Dialog.Description>

          <div className="space-y-6">
            {/* Genre Filter */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">
                Genre Filter
              </label>
              <div className="relative">
                <Select.Root
                  value={selectedGenre}
                  onValueChange={handleGenreChange}
                >
                  <Select.Trigger className="w-full px-4 py-3 bg-[#0a0e27] border border-purple-500/30 rounded-lg text-white flex items-center justify-between hover:border-purple-500/50 transition-colors database-select-trigger">
                    <Select.Value placeholder="Select a genre..." />
                    <Select.Icon>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </Select.Icon>
                  </Select.Trigger>

                  <Select.Portal>
                    <Select.Content
                      className="bg-[#1a1f3a] border border-purple-500/30 rounded-lg shadow-2xl z-[100] overflow-hidden dropdown-panel database-select-content"
                      position="popper"
                      sideOffset={5}
                    >
                      <Select.Viewport className="p-2 max-h-[250px] overflow-y-auto scrollable-list database-select-viewport">
                        {genres.map((genre) => (
                          <Select.Item
                            key={genre}
                            value={genre}
                            className="px-4 py-2.5 text-white rounded-lg hover:bg-purple-500/20 cursor-pointer outline-none transition-colors relative select-none database-select-item flex items-center justify-between"
                          >
                            <Select.ItemText>{genre}</Select.ItemText>
                            <Select.ItemIndicator>
                              <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                              </svg>
                            </Select.ItemIndicator>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>
            </div>

            {/* Songs Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Songs Filter {selectedGenre ? `(${availableSongs.length} songs available)` : ''}
              </label>

              {/* Search Input */}
              {selectedGenre && (
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search songs or artists..."
                    className="w-full pl-10 pr-4 py-2.5 bg-[#0a0e27] border border-purple-500/30 rounded-lg text-white placeholder:text-gray-500 focus:border-purple-500/50 focus:outline-none transition-colors database-search-input"
                    style={{ paddingLeft: '38px' }}
                  />
                  <svg
                    className="w-4 h-4 absolute left-3 text-gray-500"
                    style={{ top: '50%', transform: 'translateY(-50%)' }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              )}

              <div className={`bg-[#0a0e27] border border-purple-500/30 rounded-lg max-h-[200px] overflow-y-auto scrollable-list database-songs-list ${!selectedGenre ? 'opacity-50' : ''}`}>
                {!selectedGenre ? (
                  <div className="px-4 py-8 text-center text-gray-500">
                    Please select a genre first
                  </div>
                ) : filteredSongs.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500">
                    {searchQuery ? 'No songs match your search' : 'No songs available'}
                  </div>
                ) : (
                  filteredSongs.map((song, index) => (
                    <div
                      key={index}
                      onClick={() => selectedGenre && toggleSongSelection(song.title)}
                      className={`px-4 py-3 border-b border-purple-500/10 last:border-b-0 ${selectedGenre ? 'cursor-pointer' : 'cursor-not-allowed'} transition-colors database-song-item ${selectedSongs.includes(song.title)
                        ? 'bg-purple-500/20 hover:bg-purple-500/25'
                        : 'hover:bg-purple-500/10'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${selectedSongs.includes(song.title)
                          ? 'border-purple-400 bg-purple-500'
                          : 'border-purple-500/30'
                          }`}>
                          {selectedSongs.includes(song.title) && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-white font-medium">{song.title}</div>
                          <div className="text-gray-400 text-sm">{song.artist}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div
                className="text-sm mt-[0px] mr-[0px] mb-[9px] ml-[5px]"
                style={{
                  color: selectedSongs.length > 0 ? '#10b981' : '#ef4444'
                }}
              >
                {selectedSongs.length} song{selectedSongs.length !== 1 ? 's' : ''} selected
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-500/20 text-[rgb(249,249,249)] rounded-lg hover:bg-gray-500/30 transition-colors bg-[rgba(225,47,47,0.88)] database-cancel-button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={selectedSongs.length === 0 || !selectedGenre}
                  className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 database-import-button"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Import
                </button>
              </div>
            </div>
          </div>

          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors bg-[rgba(225,47,47,0.88)] rounded-[5px] database-close-button"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
