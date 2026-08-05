import { motion } from 'motion/react';
import { PieChart as PieIcon, TrendingUp, Users, CheckCircle, Plus } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useEffect, useMemo, useState } from 'react';
import { requestJson } from '../utils/apiClient';

export function PollAnalytics() {
  const { polls, songs, createPoll, closePoll, venues } = useAdmin();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPoll, setNewPoll] = useState({ title: '', songIds: [] as string[] });
  const [queuePolls, setQueuePolls] = useState<Array<{ id: string; title: string; artist: string; votes: number; timestamp: number; status: string; venueId: string }>>([]);
  const [lockedTooltip, setLockedTooltip] = useState<{ index: number; x : number; y: number; placeAbove: boolean } | null>(null);

  useEffect(() => {
    const loadQueuePolls = async () => {
      try {
        const data = await requestJson<{ items: any[] }>("/queue/all");
        const items = (data.items ?? []).map((item) => ({
          id: String(item.id ?? ''),
          title: String(item.songTitle ?? item.title ?? ''),
          artist: String(item.artist ?? ''),
          votes: Number(item.votes ?? 0),
          timestamp: Number(Date.parse(item.timestamp ?? item.created_at) || Date.now()),
          status: String(item.status ?? 'pending'),
          venueId: String(item.venue_id ?? '')
        }));
        setQueuePolls(items);
      } catch (error) {
        console.error('Load queue polls failed', error);
      }
    };

    loadQueuePolls();

    const intervalId = window.setInterval(loadQueuePolls, 5000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const activeQueuePolls = useMemo(
    () => queuePolls.filter((item) => item.status === 'pending' && item.title),
    [queuePolls]
  );

  const groupedActiveQueuePolls = useMemo(() => {
    const map = new Map<string, { id: string; title: string; artist: string; votes: number; timestamp: number; status: string; venueId: string }>();
    activeQueuePolls.forEach((item) => {
      const key = `${item.venueId}::${item.title.trim().toLowerCase()}::${item.artist.trim().toLowerCase()}`;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, { ...item });
        return;
      }

      const merged = {
        ...existing,
        votes: existing.votes + item.votes,
        timestamp: Math.max(existing.timestamp, item.timestamp)
      };
      map.set(key, merged);
    });

    return Array.from(map.values()).sort((a, b) => b.votes - a.votes || b.timestamp - a.timestamp);
  }, [activeQueuePolls]);

  const queueVotesTotal = groupedActiveQueuePolls.reduce((sum, item) => sum + item.votes, 0);
  const closedQueuePolls = queuePolls.filter((item) => item.status !== 'pending').length;
  const totalVotes = queueVotesTotal;
  const totalPollCount = groupedActiveQueuePolls.length;
  const avgVotesPerPoll = totalPollCount > 0 ? Math.round(totalVotes / totalPollCount) : 0;

  const pollStatusData = [
    { name: 'Active', value: groupedActiveQueuePolls.length },
    { name: 'Closed', value: closedQueuePolls },
  ];

  const COLORS = ['#10b981', '#6b7280'];

  const voteDistribution = groupedActiveQueuePolls.map((item) => ({
    name: `${item.title} — ${item.artist || 'Unknown Artist'}${item.venueId ? ` (${item.venueId})` : ''}`,
    votes: item.votes,
  }));

  const voteChartHeight = Math.max(250, voteDistribution.length * 50);

  const venueNameById = useMemo(() => {
    const map = new Map<string, string>();
    venues.forEach((venue) => {
      if (venue.id) {
        map.set(venue.id, venue.name || venue.id);
      }
    });
    return map;
  }, [venues]);

  const getVenueLabel = (venueId: string) => venueNameById.get(venueId) ?? venueId;

  const truncate = (value: string, max = 34) => (value.length > max ? `${value.slice(0, max - 1)}…` : value);

  const WrappedAxisTick = ({ x, y, payload }: any) => {
    const raw = String(payload?.value ?? '');
    const text = truncate(raw, 34);

    return (
      <text x={x} y={y} textAnchor="end" fill="#fff" fontSize={12}>
        <tspan x={x} dy={4}>{text}</tspan>
      </text>
    );
  };

  const handleCreatePoll = () => {
    if (newPoll.title && newPoll.songIds.length >= 2) {
      createPoll(newPoll.title, newPoll.songIds);
      setNewPoll({ title: '', songIds: [] });
      setIsCreateModalOpen(false);
    }
  };

  const toggleSongSelection = (songId: string) => {
    setNewPoll(prev => ({
      ...prev,
      songIds: prev.songIds.includes(songId)
        ? prev.songIds.filter(id => id !== songId)
        : [...prev.songIds, songId]
    }));
  };

  const isEmpty = groupedActiveQueuePolls.length === 0;
  const maxLiveQueueVotes = groupedActiveQueuePolls.reduce((max, item) => Math.max(max, item.votes), 0);

  const handleVoteChartMouseMove = (state: any) => {
    const rawIndex = state?.activeTooltipIndex;
    if (rawIndex === undefined || rawIndex === null) return;

    const index = Number(rawIndex);
    if (!Number.isFinite(index)) return;

    if (lockedTooltip?.index === index) return;

    const coordX = Number(state?.activeCoordinate?.x);
    const coordY = Number(state?.activeCoordinate?.y);
    if (!Number.isFinite(coordX) || !Number.isFinite(coordY)) return;

    const estimatedTooltipHeight = 92;
    const bottomGap = 14;
    const nearBottomByY = coordY + estimatedTooltipHeight + bottomGap > voteChartHeight;
    const nearBottomByIndex = index >= Math.max(0, voteDistribution.length - 2);
    const placeAbove = nearBottomByY || nearBottomByIndex;

    setLockedTooltip({ index, x: coordX, y: coordY, placeAbove });
  };

  const handleVoteChartMouseLeave = () => {
    setLockedTooltip(null);
  };

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Poll Analytics</h1>
          <p className="text-purple-400 text-sm font-semibold">Vote tracking and poll performance</p>
        </div>
        <motion.button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold text-sm"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-4 h-4" />
          Create Poll
        </motion.button>
      </motion.div>

      {isEmpty && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6 text-center"
        >
          <PieIcon className="w-12 h-12 text-purple-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-2">No Polls Yet</h3>
          <p className="text-purple-300 text-sm mb-4">Create your first poll to get started tracking votes and engagement.</p>
          <motion.button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold text-sm inline-block"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Create First Poll
          </motion.button>
        </motion.div>
      )}

      {!isEmpty && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Polls', value: totalPollCount, icon: PieIcon, color: 'purple' },
          { label: 'Active Polls', value: groupedActiveQueuePolls.length, icon: CheckCircle, color: 'emerald' },
          { label: 'Total Votes', value: totalVotes, icon: TrendingUp, color: 'cyan' },
          { label: 'Avg Votes/Poll', value: avgVotesPerPoll, icon: Users, color: 'pink' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className={`bg-${stat.color}-500/10 rounded-xl p-4 border border-${stat.color}-500/20`}>
              <stat.icon className={`w-5 h-5 text-${stat.color}-400 mb-2`} />
              <div className="text-xs text-gray-400 font-bold uppercase">{stat.label}</div>
              <div className="text-3xl font-black text-white">{stat.value}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-900/80 backdrop-blur-xl rounded-xl p-4 border border-purple-500/20">
          <div className="flex items-center gap-2 mb-4">
            <PieIcon className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-black text-white">Poll Status Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie 
                data={pollStatusData} 
                dataKey="value" 
                nameKey="name" 
                cx="50%" 
                cy="50%" 
                outerRadius={80}
                label={({ cx, cy, midAngle, outerRadius, name, value, index }) => {
                  const RADIAN = Math.PI / 180;
                  const nudge = value === 0 ? (index % 2 === 0 ? 6 : -6) : 0;
                  const angle = midAngle + nudge;
                  const radius = outerRadius + 18 + (value === 0 ? (index % 3) * 6 : 0);
                  const sx = cx + (outerRadius + 4) * Math.cos(-angle * RADIAN);
                  const sy = cy + (outerRadius + 4) * Math.sin(-angle * RADIAN);
                  const mx = cx + (radius - 6) * Math.cos(-angle * RADIAN);
                  const my = cy + (radius - 6) * Math.sin(-angle * RADIAN);
                  const ex = cx + radius * Math.cos(-angle * RADIAN);
                  const ey = cy + radius * Math.sin(-angle * RADIAN);
                  const textAnchor = ex > cx ? 'start' : 'end';
                  return (
                    <g>
                      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke="#666" fill="none" />
                      <text
                        x={ex + (ex > cx ? 6 : -6)}
                        y={ey}
                        textAnchor={textAnchor}
                        dominantBaseline="central"
                        fill="#fff"
                        fontSize={14}
                      >
                        {`${name}: ${value}`}
                      </text>
                    </g>
                  );
                }}
                labelLine={false}
              >
                {pollStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e1e2e', 
                  border: '1px solid #a855f7', 
                  borderRadius: '8px',
                  padding: '8px',
                  color: '#fff'
                }}
                labelStyle={{ color: '#fff' }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-900/80 backdrop-blur-xl rounded-xl p-4 border border-cyan-500/20">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-black text-white">Vote Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={voteChartHeight}>
            <BarChart
              data={voteDistribution}
              layout="vertical"
              margin={{ top: 8, right: 1, bottom: 8, left: 180 }}
              barCategoryGap="12%"
              onMouseMove={handleVoteChartMouseMove}
              onMouseLeave={handleVoteChartMouseLeave}
            >
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={60} interval={0} tick={<WrappedAxisTick />} />
              <Tooltip 
                allowEscapeViewBox={{ x: false, y: false }}
                reverseDirection={{ x: true, y: false }}
                offset={12}
                wrapperStyle={{ maxWidth: '280px', width: '280px', whiteSpace: 'normal' }}
                position={lockedTooltip ? { x: lockedTooltip.placeAbove ? lockedTooltip.x - 7 : lockedTooltip.x - 20, y: lockedTooltip.placeAbove ? lockedTooltip.y - 84 : lockedTooltip.y + 16 } : undefined}
                contentStyle={{ 
                  backgroundColor: '#1e1e2e', 
                  border: '1px solid #06b6d4', 
                  borderRadius: '8px',
                  padding: '8px',
                  color: '#fff',
                  maxWidth: '280px',
                  width: '280px',
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                  overflowWrap: 'anywhere'
                }}
                labelStyle={{ color: '#fff', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                itemStyle={{ color: '#fff', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                cursor={false}
              />
              <Bar dataKey="votes" radius={[0, 8, 8, 0]} barSize={26}>
                {voteDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill="#06b6d4" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-900/80 backdrop-blur-xl rounded-xl p-4 border border-cyan-500/20">
        <h3 className="text-lg font-black text-white mb-4">Live Queue Polls</h3>
        {activeQueuePolls.length === 0 ? (
          <p className="text-gray-400 text-sm">No live queue polls yet.</p>
        ) : (
          <div className="space-y-3">
            {groupedActiveQueuePolls.map((item) => (
              <div key={item.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-white font-bold text-base break-words">{item.title}</h4>
                    <p className="text-gray-400 text-xs mt-1">{item.artist || 'Unknown Artist'}</p>
                    <p className="text-gray-500 text-[10px] mt-1 break-words">{getVenueLabel(item.venueId)}</p>
                  </div>
                  <span className="px-3 py-1 rounded-lg text-xs font-bold text-emerald-100 border border-emerald-500/40" style={{ backgroundColor: '#1eec88' }}>
                    Live
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-full transition-all duration-300" style={{ width: `${maxLiveQueueVotes > 0 ? Math.max((item.votes / maxLiveQueueVotes) * 100, 4) : 0}%` }} />
                  </div>
                  <span className="font-black text-xs" style={{ color: '#ffffff' }}>{item.votes}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

        </>
      )}

      {/* Create Poll Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setIsCreateModalOpen(false)}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900/98 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          >
            <h3 className="text-2xl font-black text-white mb-4">Create New Poll</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-white mb-2 block">Poll Title *</label>
                <input
                  type="text"
                  value={newPoll.title}
                  onChange={(e) => setNewPoll({ ...newPoll, title: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white"
                  placeholder="e.g., Friday Night Favorites"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-white mb-2 block">Select Songs (min 2) *</label>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 bg-white/5 rounded-lg">
                  {songs.slice(0, 20).map(song => (
                    <button
                      key={song.id}
                      onClick={() => toggleSongSelection(song.id)}
                      className={`p-3 rounded-lg text-left transition-colors ${
                        newPoll.songIds.includes(song.id)
                          ? 'bg-purple-500/30 border-2 border-purple-500'
                          : 'bg-white/5 border-2 border-transparent hover:border-purple-500/30'
                      }`}
                    >
                      <div className="text-white font-bold text-sm truncate">{song.title}</div>
                      <div className="text-gray-400 text-xs truncate">{song.artist}</div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">{newPoll.songIds.length} songs selected</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePoll}
                  disabled={!newPoll.title || newPoll.songIds.length < 2}
                  className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold disabled:opacity-50"
                >
                  Create Poll
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
