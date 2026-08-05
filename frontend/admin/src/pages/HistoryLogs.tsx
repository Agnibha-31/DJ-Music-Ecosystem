import { motion } from 'motion/react';
import { Clock, Download, Filter, FileText, Music2, PieChart, Shield, Activity, Trash2 } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { useState } from 'react';

export function HistoryLogs() {
  const { activityLogs, queue, songs } = useAdmin();
  const [filterType, setFilterType] = useState<'all' | 'song_added' | 'song_deleted' | 'poll_created' | 'song_played' | 'admin_action' | 'import' | 'override'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = activityLogs.filter(log => {
    const matchesType = filterType === 'all' || log.type === filterType;
    const matchesSearch = log.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const logStats = {
    total: activityLogs.length,
    songActions: activityLogs.filter(l => l.type === 'song_added' || l.type === 'song_deleted' || l.type === 'song_played').length,
    polls: activityLogs.filter(l => l.type === 'poll_created').length,
    overrides: activityLogs.filter(l => l.type === 'override').length,
    imports: activityLogs.filter(l => l.type === 'import').length,
  };

  const exportLogs = () => {
    const headers = ['Type', 'Description', 'User', 'Timestamp'];
    const rows = filteredLogs.map(log => [
      log.type,
      log.description,
      log.user,
      new Date(log.timestamp).toISOString()
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'song_added': return <Music2 className="w-4 h-4 text-cyan-400" />;
      case 'song_deleted': return <Trash2 className="w-4 h-4 text-red-400" />;
      case 'poll_created': return <PieChart className="w-4 h-4 text-purple-400" />;
      case 'song_played': return <Activity className="w-4 h-4 text-emerald-400" />;
      case 'admin_action': return <Shield className="w-4 h-4 text-orange-400" />;
      case 'import': return <FileText className="w-4 h-4 text-pink-400" />;
      case 'override': return <Shield className="w-4 h-4 text-yellow-400" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'song_added': return 'bg-cyan-500/10 border-cyan-500/20';
      case 'song_deleted': return 'bg-red-500/10 border-red-500/20';
      case 'poll_created': return 'bg-purple-500/10 border-purple-500/20';
      case 'song_played': return 'bg-emerald-500/10 border-emerald-500/20';
      case 'admin_action': return 'bg-orange-500/10 border-orange-500/20';
      case 'import': return 'bg-pink-500/10 border-pink-500/20';
      case 'override': return 'bg-yellow-500/10 border-yellow-500/20';
      default: return 'bg-white/5 border-white/10';
    }
  };

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">History & Logs</h1>
          <p className="text-purple-400 text-sm font-semibold">Complete activity audit trail</p>
        </div>
        <motion.button
          onClick={exportLogs}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-400 font-bold text-sm"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Download className="w-4 h-4" />
          Export Logs
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total Logs', value: logStats.total, icon: Clock, color: 'purple' },
          { label: 'Song Actions', value: logStats.songActions, icon: Music2, color: 'cyan' },
          { label: 'Polls Created', value: logStats.polls, icon: PieChart, color: 'pink' },
          { label: 'Overrides', value: logStats.overrides, icon: Shield, color: 'orange' },
          { label: 'Imports', value: logStats.imports, icon: FileText, color: 'emerald' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className={`bg-${stat.color}-500/10 rounded-xl p-3 border border-${stat.color}-500/20`}>
              <stat.icon className={`w-4 h-4 text-${stat.color}-400 mb-2`} />
              <div className="text-[10px] text-gray-400 font-bold uppercase">{stat.label}</div>
              <div className="text-2xl font-black text-white">{stat.value}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-900/80 backdrop-blur-xl rounded-xl p-4 border border-purple-500/20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm font-medium"
          >
            <option value="all">All Types</option>
            <option value="song_added">Song Added</option>
            <option value="song_deleted">Song Deleted</option>
            <option value="poll_created">Poll Created</option>
            <option value="song_played">Song Played</option>
            <option value="admin_action">Admin Action</option>
            <option value="import">Import</option>
            <option value="override">Override</option>
          </select>
        </div>

        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm font-semibold">No logs found</p>
            </div>
          ) : (
            filteredLogs.map((log, i) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.01 }}
                className={`p-3 rounded-lg border ${getLogColor(log.type)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-white/5">
                    {getLogIcon(log.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-bold text-sm">{log.description}</div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-gray-400 text-xs">{log.user}</span>
                      <span className="text-gray-600">•</span>
                      <span className="text-gray-400 text-xs">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                    log.type === 'song_added' ? 'bg-cyan-500/20 text-cyan-400' :
                    log.type === 'song_deleted' ? 'bg-red-500/20 text-red-400' :
                    log.type === 'poll_created' ? 'bg-purple-500/20 text-purple-400' :
                    log.type === 'song_played' ? 'bg-emerald-500/20 text-emerald-400' :
                    log.type === 'override' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {log.type.replace('_', ' ')}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
