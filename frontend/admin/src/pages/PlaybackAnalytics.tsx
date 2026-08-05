import { motion } from 'motion/react';
import { BarChart3, Play, TrendingUp, Clock, Calendar, Music2 } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { useState } from 'react';

export function PlaybackAnalytics() {
  const { songs, analytics, activityLogs } = useAdmin();
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'all'>('week');

  const mostPlayed = [...songs].sort((a, b) => b.playCount - a.playCount).slice(0, 10);
  const leastPlayed = [...songs].filter(s => s.playCount > 0).sort((a, b) => a.playCount - b.playCount).slice(0, 10);

  // Use real play data from activity logs (last 24 hours)
  const hourlyPlayData = Array.from({ length: 24 }, (_, i) => {
    const hourAgo = Date.now() - (23 - i) * 60 * 60 * 1000;
    const nextHourAgo = hourAgo + 60 * 60 * 1000;
    const playsInHour = activityLogs.filter(
      log => log.type === 'song_played' && log.timestamp >= hourAgo && log.timestamp < nextHourAgo
    ).length;
    return {
      hour: `${i}:00`,
      plays: playsInHour,
    };
  });

  // Use real play data from activity logs (last 7 days)
  const weeklyPlayData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
    const daysAgo = 6 - index;
    const dayStart = Date.now() - daysAgo * 24 * 60 * 60 * 1000;
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;
    const playsInDay = activityLogs.filter(
      log => log.type === 'song_played' && log.timestamp >= dayStart && log.timestamp < dayEnd
    ).length;
    return {
      day,
      plays: playsInDay,
    };
  });

  const genrePlayData = songs.reduce((acc, song) => {
    const existing = acc.find(g => g.name === song.genre);
    if (existing) existing.value += song.playCount;
    else acc.push({ name: song.genre, value: song.playCount });
    return acc;
  }, [] as { name: string; value: number }[]).sort((a, b) => b.value - a.value);

  const COLORS = ['#a855f7', '#06b6d4', '#ec4899', '#f97316', '#10b981', '#f59e0b'];

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Playback Analytics</h1>
          <p className="text-purple-400 text-sm font-semibold">Song play history and trends</p>
        </div>
        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value as any)}
          className="px-4 py-2 bg-slate-800 border border-purple-500/30 rounded-lg text-white text-sm font-bold"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="all">All Time</option>
        </select>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Plays', value: analytics.totalPlays, icon: Play, color: 'emerald' },
          { label: 'Avg Plays/Song', value: Math.round(analytics.totalPlays / analytics.totalSongs), icon: BarChart3, color: 'cyan' },
          { label: 'Most Played', value: mostPlayed[0]?.playCount || 0, icon: TrendingUp, color: 'purple' },
          { label: 'Active Songs', value: analytics.activeSongs, icon: Music2, color: 'pink' },
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
            <Clock className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-black text-white">Hourly Play Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={hourlyPlayData}>
              <XAxis dataKey="hour" stroke="#666" tick={{ fill: '#999', fontSize: 10 }} />
              <YAxis stroke="#666" tick={{ fill: '#999', fontSize: 10 }} />
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
                cursor={{ stroke: '#a855f7', strokeWidth: 1 }}
              />
              <Line type="monotone" dataKey="plays" stroke="#a855f7" strokeWidth={3} dot={{ fill: '#a855f7', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-900/80 backdrop-blur-xl rounded-xl p-4 border border-cyan-500/20">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-black text-white">Weekly Trend</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyPlayData}>
              <XAxis dataKey="day" stroke="#666" tick={{ fill: '#999', fontSize: 11 }} />
              <YAxis stroke="#666" tick={{ fill: '#999', fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e1e2e', 
                  border: '1px solid #06b6d4', 
                  borderRadius: '8px',
                  padding: '8px',
                  color: '#fff'
                }}
                labelStyle={{ color: '#fff' }}
                itemStyle={{ color: '#fff' }}
                cursor={false}
              />
              <Bar dataKey="plays" radius={[8, 8, 0, 0]}>
                {weeklyPlayData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill="#06b6d4" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-900/80 backdrop-blur-xl rounded-xl p-4 border border-pink-500/20">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-pink-400" />
            <h3 className="text-base font-black text-white">Genre Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie 
                data={genrePlayData} 
                dataKey="value" 
                nameKey="name" 
                cx="50%" 
                cy="50%" 
                outerRadius={70}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={true}
              >
                {genrePlayData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e1e2e', 
                  border: '1px solid #ec4899', 
                  borderRadius: '8px',
                  padding: '8px',
                  color: '#fff'
                }}
                labelStyle={{ color: '#fff' }}
                itemStyle={{ color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-900/80 backdrop-blur-xl rounded-xl p-4 border border-emerald-500/20">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-black text-white">Most Played (Top 10)</h3>
          </div>
          <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
            {mostPlayed.map((song, i) => (
              <div key={song.id} className="flex items-center gap-2 p-2 rounded bg-white/5">
                <div className="w-6 h-6 rounded bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-black">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-xs font-bold truncate">{song.title}</div>
                  <div className="text-gray-500 text-[10px] truncate">{song.artist}</div>
                </div>
                <div className="text-emerald-400 font-black text-sm">{song.playCount}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-900/80 backdrop-blur-xl rounded-xl p-4 border border-orange-500/20">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-orange-400" />
            <h3 className="text-base font-black text-white">Least Played</h3>
          </div>
          <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
            {leastPlayed.map((song, i) => (
              <div key={song.id} className="flex items-center gap-2 p-2 rounded bg-white/5">
                <div className="w-6 h-6 rounded bg-orange-500/20 flex items-center justify-center text-orange-400 text-xs font-black">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-xs font-bold truncate">{song.title}</div>
                  <div className="text-gray-500 text-[10px] truncate">{song.artist}</div>
                </div>
                <div className="text-orange-400 font-black text-sm">{song.playCount}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
