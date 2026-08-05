import { motion } from 'motion/react';
import { Shield, Zap, Ban, Play, SkipForward, Trash2, AlertTriangle, CheckCircle, XCircle, StopCircle, Activity, PauseCircle } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { useState } from 'react';

export function ControlPanel() {
  const { queue, songs, forcePlaySong, blockSong, updateQueueItemStatus, updateQueuePriority, clearQueue, systemMode, toggleLiveMode, toggleMaintenance, toggleOverride, liveSessions, endSession, djs, venues } = useAdmin();
  const [selectedSongId, setSelectedSongId] = useState('');
  const [selectedVenueFilter, setSelectedVenueFilter] = useState('');
  const [selectedDjFilter, setSelectedDjFilter] = useState('');

  // Sessions that are active or suspended (not ended)
  const manageableSessions = liveSessions.filter((s) => s.status === 'active' || s.status === 'suspended');

  // Unique DJs who have manageable sessions (optionally filtered by venue)
  const djsWithSessions = djs.filter((d) =>
    manageableSessions.some((s) => s.djId === d.id && (!selectedVenueFilter || s.venueId === selectedVenueFilter))
  );

  // Apply venue + DJ filters
  const filteredSessions = manageableSessions.filter((s) => {
    if (selectedVenueFilter && s.venueId !== selectedVenueFilter) return false;
    if (selectedDjFilter && s.djId !== selectedDjFilter) return false;
    return true;
  });

  const getDjName = (djId: string) => djs.find((d) => d.id === djId)?.name ?? djId;
  const getVenueName = (venueId: string) => venues.find((v) => v.id === venueId)?.name ?? venueId;

  const sortedQueue = [...queue].sort((a, b) => {
    if (a.priority === 'override') return -1;
    if (b.priority === 'override') return 1;
    if (a.priority === 'high') return -1;
    if (b.priority === 'high') return 1;
    return b.votes - a.votes;
  });

  const handleForcePlay = () => {
    if (selectedSongId) {
      forcePlaySong(selectedSongId);
      setSelectedSongId('');
    }
  };

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-black text-white tracking-tight">Control & Override Panel</h1>
        <p className="text-purple-400 text-sm font-semibold">Emergency controls and priority management</p>
      </motion.div>

      {/* System Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`p-4 rounded-xl border ${systemMode.isLive ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-black text-white">Live Mode</h3>
              <p className="text-xs text-gray-400">System status</p>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${systemMode.isLive ? 'bg-emerald-500' : 'bg-red-500'}`}>
              <Play className="w-6 h-6 text-white" />
            </div>
          </div>
          <button
            onClick={toggleLiveMode}
            className={`w-full px-4 py-2 rounded-lg font-bold text-sm ${systemMode.isLive ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'
              }`}
          >
            {systemMode.isLive ? 'Deactivate' : 'Activate'}
          </button>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`p-4 rounded-xl border ${systemMode.isMaintenance ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-slate-800/50 border-slate-700'}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-black text-white">Maintenance Mode</h3>
              <p className="text-xs text-gray-400">Block new requests</p>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${systemMode.isMaintenance ? 'bg-yellow-500' : 'bg-slate-700'}`}>
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
          <button
            onClick={toggleMaintenance}
            className={`w-full px-4 py-2 rounded-lg font-bold text-sm ${systemMode.isMaintenance ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-yellow-500 hover:bg-yellow-600 text-white'
              }`}
          >
            {systemMode.isMaintenance ? 'Disable' : 'Enable'}
          </button>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`p-4 rounded-xl border ${systemMode.isOverrideEnabled ? 'bg-orange-500/10 border-orange-500/30' : 'bg-slate-800/50 border-slate-700'}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-black text-white">Override Mode</h3>
              <p className="text-xs text-gray-400">Admin priority</p>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${systemMode.isOverrideEnabled ? 'bg-orange-500' : 'bg-slate-700'}`}>
              <Shield className="w-6 h-6 text-white" />
            </div>
          </div>
          <button
            onClick={toggleOverride}
            className={`w-full px-4 py-2 rounded-lg font-bold text-sm ${systemMode.isOverrideEnabled ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-orange-500 hover:bg-orange-600 text-white'
              }`}
          >
            {systemMode.isOverrideEnabled ? 'Disable' : 'Enable'}
          </button>
        </motion.div>
      </div>

      {/* Master End Session Panel */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-900/80 backdrop-blur-xl rounded-xl p-4 border border-amber-500/20">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5" color="#10b981" />
          <h3 className="text-base font-black text-white">DJ Session Manager</h3>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs text-gray-400 font-semibold mb-1 block">Venue</label>
            <select
              value={selectedVenueFilter}
              onChange={(e) => { setSelectedVenueFilter(e.target.value); setSelectedDjFilter(''); }}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm font-medium"
            >
              <option value="">All Venues</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 font-semibold mb-1 block">DJ</label>
            <select
              value={selectedDjFilter}
              onChange={(e) => setSelectedDjFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm font-medium"
            >
              <option value="">All DJs</option>
              {djsWithSessions.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Session List */}
        {filteredSessions.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <p className="text-sm font-semibold">No active or suspended sessions</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredSessions.map((session) => (
              <div key={session.id} className={`p-3 rounded-lg border flex items-center justify-between ${session.status === 'active'
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-yellow-500/10 border-yellow-500/30'
                }`}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${session.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-yellow-400'
                    }`} />
                  <div className="min-w-0">
                    <div className="text-white font-bold text-sm truncate">{getDjName(session.djId)}</div>
                    <div className="text-gray-400 text-xs truncate">{getVenueName(session.venueId)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs border ${session.status === 'active'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                    }`}>
                    {session.status === 'active' ? 'LIVE' : (
                      <>
                        <PauseCircle className="w-3 h-3" />
                        PAUSED
                      </>
                    )}
                  </span>
                  <button
                    onClick={() => endSession(session.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-bold text-xs"
                  >
                    <StopCircle className="w-4 h-4" />
                    End
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Force Play & Block Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-900/80 backdrop-blur-xl rounded-xl p-4 border border-purple-500/20">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-black text-white">Force Play Song</h3>
          </div>
          <div className="space-y-3">
            <select
              value={selectedSongId}
              onChange={(e) => setSelectedSongId(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white font-medium"
            >
              <option value="">Select a song...</option>
              {songs.filter(s => s.status === 'active').map(song => (
                <option key={song.id} value={song.id}>{song.title} - {song.artist}</option>
              ))}
            </select>
            <button
              onClick={handleForcePlay}
              disabled={!selectedSongId}
              className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Force Play Now
            </button>
            <p className="text-xs text-gray-400">Immediately adds song to queue with override priority</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-900/80 backdrop-blur-xl rounded-xl p-4 border border-red-500/20">
          <div className="flex items-center gap-2 mb-4">
            <Ban className="w-5 h-5 text-red-400" />
            <h3 className="text-base font-black text-white">Emergency Stop</h3>
          </div>
          <div className="space-y-3">
            <button
              onClick={clearQueue}
              disabled={queue.length === 0}
              className="w-full px-4 py-3 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-bold disabled:opacity-50"
            >
              <Trash2 className="w-5 h-5 inline mr-2" />
              Clear Entire Queue
            </button>
            <p className="text-xs text-gray-400">Removes all pending requests ({queue.length} items)</p>
          </div>
        </motion.div>
      </div>

      {/* Priority Queue */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-900/80 backdrop-blur-xl rounded-xl p-4 border border-purple-500/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-black text-white">Priority Queue ({sortedQueue.length})</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-bold">Override</span>
            <span className="px-2 py-1 rounded bg-purple-500/20 border border-purple-500/30 text-purple-400 text-xs font-bold">High</span>
            <span className="px-2 py-1 rounded bg-slate-700 text-gray-400 text-xs font-bold">Normal</span>
          </div>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {sortedQueue.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm font-semibold">No items in queue</p>
            </div>
          ) : (
            sortedQueue.map((item, i) => (
              <div
                key={item.id}
                className={`p-3 rounded-lg border ${item.priority === 'override' ? 'bg-orange-500/10 border-orange-500/30' :
                  item.priority === 'high' ? 'bg-purple-500/10 border-purple-500/30' :
                    'bg-white/5 border-white/10'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded flex items-center justify-center font-black text-sm ${item.priority === 'override' ? 'bg-orange-500 text-white' :
                    item.priority === 'high' ? 'bg-purple-500 text-white' :
                      'bg-slate-700 text-gray-300'
                    }`}>
                    {i + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-white font-bold text-sm truncate">{item.songTitle}</div>
                    <div className="text-gray-400 text-xs truncate">{item.artist} • {item.requestedBy}</div>
                  </div>

                  <div className="text-right">
                    <div className="text-white font-black text-base">{item.votes}</div>
                    <div className="text-gray-500 text-[10px]">votes</div>
                  </div>

                  <div className={`px-2 py-1 rounded text-xs font-bold ${item.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                    item.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      item.status === 'playing' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                        item.status === 'forced' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                          'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}>
                    {item.status}
                  </div>

                  <div className="flex gap-1">
                    {item.priority !== 'override' && (
                      <button
                        onClick={() => updateQueuePriority(item.id, item.priority === 'high' ? 'normal' : 'high')}
                        className={`p-2 rounded-lg ${item.priority === 'high' ? 'bg-purple-500/20 border border-purple-500/30 text-purple-400' : 'bg-slate-700 text-gray-400'
                          }`}
                        title="Toggle Priority"
                      >
                        <Zap className="w-4 h-4" />
                      </button>
                    )}

                    {item.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateQueueItemStatus(item.id, 'accepted')}
                          className="p-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400"
                          title="Accept"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateQueueItemStatus(item.id, 'rejected')}
                          className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400"
                          title="Reject"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {item.status === 'accepted' && (
                      <button
                        onClick={() => updateQueueItemStatus(item.id, 'playing')}
                        className="p-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-400"
                        title="Play Now"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    )}

                    {item.status === 'playing' && (
                      <button
                        onClick={() => updateQueueItemStatus(item.id, 'played')}
                        className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-400"
                        title="Mark Played"
                      >
                        <SkipForward className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
