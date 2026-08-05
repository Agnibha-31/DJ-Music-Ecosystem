import { motion } from 'motion/react';
import { 
  Music2, 
  TrendingUp, 
  Users, 
  Play, 
  ListMusic, 
  PieChart,
  Activity,
  Radio,
  Award,
  Zap
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { requestJson } from '../utils/apiClient';
import { BarChart, Bar, PieChart as RePieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useEffect, useMemo, useState } from 'react';

export function Dashboard() {
  const { analytics, songs, activityLogs, polls } = useAdmin();
  const [queuePolls, setQueuePolls] = useState<Array<{ id: string; status: string }>>([]);

  useEffect(() => {
    const loadQueuePolls = async () => {
      try {
        const data = await requestJson<{ items: any[] }>("/queue/all");
        const items = (data.items ?? []).map((item) => ({
          id: String(item.id ?? ''),
          status: String(item.status ?? 'pending')
        }));
        setQueuePolls(items);
      } catch (error) {
        console.error('Load queue polls failed', error);
      }
    };

    loadQueuePolls();
  }, []);

  const totalPollCount = useMemo(() => {
    const activeQueuePolls = queuePolls.filter((item) => item.status === 'pending');
    return polls.length + activeQueuePolls.length;
  }, [polls.length, queuePolls]);

  const kpiCards = [
    { icon: Music2, label: 'Songs', value: analytics.totalSongs, sub: `${analytics.activeSongs} active`, color: 'cyan' },
    { icon: ListMusic, label: 'Requests', value: analytics.activeRequests, sub: 'In queue', color: 'purple' },
    { icon: TrendingUp, label: 'Votes', value: analytics.totalVotes, sub: 'Total', color: 'orange' },
    { icon: Users, label: 'Users', value: analytics.activeUsers, sub: 'Online', color: 'pink' },
    { icon: PieChart, label: 'Polls', value: totalPollCount, sub: `${analytics.totalPolls} total`, color: 'yellow' },
  ];

  const genreData = songs.reduce((acc, song) => {
    const existing = acc.find(g => g.name === song.genre);
    if (existing) existing.value += 1;
    else acc.push({ name: song.genre, value: 1 });
    return acc;
  }, [] as { name: string; value: number }[]);

  const topSongs = [...songs].sort((a, b) => b.playCount - a.playCount).slice(0, 5);

  // Use real activity data from recent activity logs (last 12 hours by hour)
  const activityData = Array.from({ length: 12 }, (_, i) => {
    const hourAgo = Date.now() - (11 - i) * 2 * 60 * 60 * 1000;
    const nextHourAgo = hourAgo + 2 * 60 * 60 * 1000;
    const logsInHour = activityLogs.filter(
      log => log.timestamp >= hourAgo && log.timestamp < nextHourAgo
    ).length;
    return {
      hour: `${i * 2}:00`,
      activity: logsInHour,
    };
  });

  const COLORS = ['#06b6d4', '#f97316', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6'];

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Dashboard</h1>
          <p className="text-purple-400 text-sm font-semibold">Real-time analytics</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpiCards.map((card, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <div className={`bg-gradient-to-br from-${card.color}-500/15 to-${card.color}-600/10 backdrop-blur-xl rounded-xl p-3 border border-${card.color}-500/20`}>
              <div className={`p-2 rounded-lg bg-${card.color}-500/20 w-fit mb-2`}>
                <card.icon className={`w-4 h-4 text-${card.color}-400`} />
              </div>
              <div className="text-[10px] text-gray-400 font-bold uppercase">{card.label}</div>
              <div className="text-2xl font-black text-white">{card.value}</div>
              <div className="text-[9px] text-gray-500 font-semibold">{card.sub}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="xl:col-span-2 bg-slate-900/80 backdrop-blur-xl rounded-xl p-4 border border-purple-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-black text-white">Activity (12h)</h3>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={activityData}>
              <defs>
                <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="hour" stroke="#666" tick={{ fill: '#999', fontSize: 10 }} />
              <YAxis stroke="#666" tick={{ fill: '#999', fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#1e1e2e', border: '1px solid #a855f7', borderRadius: '8px', fontSize: '12px', color: '#fff' }} labelStyle={{ color: '#fff' }} itemStyle={{ color: '#fff' }} />
              <Area type="monotone" dataKey="activity" stroke="#a855f7" strokeWidth={2} fill="url(#colorActivity)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-900/80 backdrop-blur-xl rounded-xl p-4 border border-cyan-500/20">
          <div className="flex items-center gap-2 mb-3">
            <PieChart className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-black text-white">Genres</h3>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <RePieChart>
              <Pie data={genreData} cx="50%" cy="50%" outerRadius={60} dataKey="value" label={({ name }) => name}>
                {genreData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1e1e2e', border: '1px solid #06b6d4', borderRadius: '8px', fontSize: '12px', color: '#fff' }} labelStyle={{ color: '#fff' }} itemStyle={{ color: '#fff' }} />
            </RePieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-900/80 backdrop-blur-xl rounded-xl p-4 border border-pink-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5 text-pink-400" />
            <h3 className="text-sm font-black text-white">Top Songs</h3>
          </div>
          <div className="space-y-2">
            {topSongs.map((song, i) => (
              <div key={song.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5">
                <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-black ${i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-600' : 'bg-slate-700'} text-white`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-xs font-bold truncate">{song.title}</div>
                  <div className="text-gray-500 text-[10px] truncate">{song.artist}</div>
                </div>
                <div className="text-white font-black text-sm">{song.playCount}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-900/80 backdrop-blur-xl rounded-xl p-4 border border-purple-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Radio className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-black text-white">Live Activity</h3>
          </div>
          <div className="space-y-2">
            {activityLogs.slice(0, 5).map(log => (
              <div key={log.id} className="p-2 rounded-lg bg-white/5 border border-white/5">
                <div className="text-white text-xs font-semibold">{log.description}</div>
                <div className="text-gray-500 text-[10px] mt-1">{new Date(log.timestamp).toLocaleTimeString()}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
