import { motion } from 'motion/react';
import { Users, Activity, AlertTriangle, Ban, CheckCircle, TrendingUp } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export function UserMonitoring() {
  const { activeUsers, flagUserForSpam, unflagUserForSpam, analytics } = useAdmin();

  const activeUsersList = activeUsers.filter(u => u.isActive);
  const flaggedUsers = activeUsers.filter(u => u.flaggedForSpam);
  const totalRequests = activeUsers.reduce((sum, u) => sum + u.requestCount, 0);
  const totalVotes = activeUsers.reduce((sum, u) => sum + u.voteCount, 0);

  const topUsers = [...activeUsers].sort((a, b) => b.requestCount - a.requestCount).slice(0, 10);

  const userActivityData = topUsers.map(user => ({
    name: user.username.length > 10 ? user.username.substring(0, 10) + '...' : user.username,
    requests: user.requestCount,
  }));

  const activityStatusData = [
    { name: 'Active', value: activeUsersList.length },
    { name: 'Flagged', value: flaggedUsers.length },
    { name: 'Inactive', value: activeUsers.filter(u => !u.isActive).length },
  ];

  const COLORS = ['#10b981', '#ef4444', '#6b7280'];

  const getActivityLevel = (user: typeof activeUsers[0]) => {
    if (user.requestCount > 10) return 'high';
    if (user.requestCount > 5) return 'medium';
    return 'low';
  };

  const getLastActiveTime = (timestamp: number) => {
    const mins = Math.floor((Date.now() - timestamp) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-black text-white tracking-tight">User Monitoring</h1>
        <p className="text-purple-400 text-sm font-semibold">Real-time user activity and abuse detection</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {[
          { label: 'Active Users', value: analytics.activeUsers, icon: Users, color: 'emerald' },
          { label: 'Total Requests', value: totalRequests, icon: TrendingUp, color: 'cyan' },
          { label: 'Total Votes', value: totalVotes, icon: Activity, color: 'purple' },
          { label: 'Flagged Users', value: flaggedUsers.length, icon: AlertTriangle, color: 'red' },
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
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-black text-white">Top Users by Activity</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={userActivityData} layout="vertical">
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={80} tick={{ fill: '#fff', fontSize: 11 }} />
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
                cursor={false}
              />
              <Bar dataKey="requests" radius={[0, 8, 8, 0]}>
                {userActivityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill="#a855f7" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-900/80 backdrop-blur-xl rounded-xl p-4 border border-cyan-500/20">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-black text-white">User Status Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie 
                data={activityStatusData} 
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
                {activityStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
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
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-900/80 backdrop-blur-xl rounded-xl p-4 border border-purple-500/20">
        <h3 className="text-lg font-black text-white mb-4">All Users ({activeUsers.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-black text-purple-300 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-black text-purple-300 uppercase">Requests</th>
                <th className="px-4 py-3 text-left text-xs font-black text-purple-300 uppercase">Votes</th>
                <th className="px-4 py-3 text-left text-xs font-black text-purple-300 uppercase">Last Active</th>
                <th className="px-4 py-3 text-left text-xs font-black text-purple-300 uppercase">Activity</th>
                <th className="px-4 py-3 text-left text-xs font-black text-purple-300 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-black text-purple-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {activeUsers.map((user, i) => (
                <motion.tr
                  key={user.userId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                        user.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-white font-bold text-sm">{user.username}</div>
                        <div className="text-gray-500 text-xs">{user.userId.substring(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-white font-bold text-sm">{user.requestCount}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-cyan-400 font-bold text-sm">{user.voteCount}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-400 text-xs">{getLastActiveTime(user.lastActive)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      getActivityLevel(user) === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      getActivityLevel(user) === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                      'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {getActivityLevel(user)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {user.isActive && <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                      {user.flaggedForSpam && (
                        <span className="px-2 py-1 rounded text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                          Flagged
                        </span>
                      )}
                      {!user.isActive && !user.flaggedForSpam && (
                        <span className="text-gray-500 text-xs">Inactive</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {!user.flaggedForSpam ? (
                        <button
                          onClick={() => flagUserForSpam(user.userId)}
                          className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400"
                          title="Flag for Spam"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => unflagUserForSpam(user.userId)}
                          className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                          title="Unflag User"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
