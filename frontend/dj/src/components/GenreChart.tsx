import { motion } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Music2, TrendingUp } from 'lucide-react';
import { useMemo, memo } from 'react';
import type { Song } from '../App';

interface GenreChartProps {
  queue: Song[];
}

export const GenreChart = memo(function GenreChart({ queue }: GenreChartProps) {
  
  // Calculate genre data from queue - auto-updates on queue changes
  const genreData = useMemo(() => {
    const data = queue.reduce((acc, song) => {
      const existing = acc.find((item) => item.name === song.genre);
      if (existing) {
        existing.songCount += 1;
        existing.votes += song.votes;
      } else {
        acc.push({ name: song.genre, songCount: 1, votes: song.votes });
      }
      return acc;
    }, [] as { name: string; songCount: number; votes: number }[]);

    // Sort by votes for better visual distribution
    data.sort((a, b) => b.votes - a.votes);
    return data;
  }, [queue]);

  const totalSongs = genreData.reduce((sum, g) => sum + g.songCount, 0);
  const totalVotes = genreData.reduce((sum, g) => sum + g.votes, 0);

  // Clean color palette
  const COLORS = ['#3b82f6', '#f97316', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#a3a3a3'];

  // Simple auto-adjusting label renderer - uses Recharts' built-in positioning
  const renderLabel = (props: any) => {
    const { cx, cy, midAngle, outerRadius, innerRadius, percent, name, index } = props;
    
    const RADIAN = Math.PI / 180;
    
    // Point on the outer edge of the pie slice
    const startX = cx + outerRadius * Math.cos(-midAngle * RADIAN);
    const startY = cy + outerRadius * Math.sin(-midAngle * RADIAN);
    
    // Label position
    const radius = outerRadius + 20; // Label distance from pie
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    const color = COLORS[index % COLORS.length];
    
    return (
      <g>
        {/* Connecting line from slice to label */}
        <line
          x1={startX}
          y1={startY}
          x2={x}
          y2={y}
          stroke={color}
          strokeWidth={2}
          strokeOpacity={0.6}
        />
        
        {/* Small dot at the connection point on the slice */}
        <circle
          cx={startX}
          cy={startY}
          r={3}
          fill={color}
          stroke="white"
          strokeWidth={1}
        />
        
        {/* Label text */}
        <text
          x={x}
          y={y}
          fill="white"
          textAnchor={x > cx ? 'start' : 'end'}
          dominantBaseline="central"
          style={{ fontSize: '11px', fontWeight: 'bold' }}
        >
          {name} ({(percent * 100).toFixed(1)}%)
        </text>
      </g>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="bg-gradient-to-br from-purple-500/15 to-pink-500/15 backdrop-blur-xl rounded-2xl p-2 border-2 border-purple-400/40 shadow-lg shadow-purple-500/20"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/20 border border-purple-400/30">
            <Music2 className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Genre Distribution</h3>
            <p className="text-[10px] text-purple-300/70">Real-time • Auto-adjusting</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-purple-500/20 border border-purple-400/40">
          <TrendingUp className="w-3 h-3 text-cyan-400" />
          <span className="text-xs font-bold text-white">{genreData.length} genres</span>
        </div>
      </div>

      {genreData.length > 0 ? (
        <ResponsiveContainer width="100%" height={320}>
          <PieChart margin={{ top: 15, right: 15, bottom: 15, left: 15 }}>
            <Pie
              data={genreData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderLabel}
              outerRadius={85}
              innerRadius={50}
              fill="#8884d8"
              dataKey="votes"
              paddingAngle={0}
              animationBegin={0}
              animationDuration={800}
            >
              {genreData.map((entry, index) => (
                <Cell 
                  key={`cell-${entry.name}-${index}`} 
                  fill={COLORS[index % COLORS.length]}
                  stroke="#ffffff"
                  strokeWidth={3}
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
                  }}
                />
              ))}
            </Pie>
            
            {/* Center text display */}
            <g>
              <circle
                cx="50%"
                cy="50%"
                r={48}
                fill="rgba(26, 26, 160, 0.47)"
                stroke="rgba(168, 85, 247, 0.6)"
                strokeWidth={2}
              />
            </g>
            <text
              x="50%"
              y="48%"
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ fontSize: '24px', fontWeight: 'bold', fill: 'white' }}
            >
              {totalSongs}
            </text>
            <text
              x="50%"
              y="56%"
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ fontSize: '10px', fill: 'rgba(168, 85, 247, 0.8)' }}
            >
              Total Songs
            </text>
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-96 flex flex-col items-center justify-center text-gray-400">
          <Music2 className="w-16 h-16 mb-4 opacity-20" />
          <p className="text-sm font-semibold">No genre data available</p>
          <p className="text-xs text-gray-500 mt-2">Add songs to see distribution</p>
        </div>
      )}
    </motion.div>
  );
});
