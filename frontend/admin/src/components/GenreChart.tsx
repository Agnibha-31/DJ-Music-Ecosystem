import { motion } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Music2 } from 'lucide-react';
import type { Song } from '../App';

interface GenreChartProps {
  queue: Song[];
}

export function GenreChart({ queue }: GenreChartProps) {
  // Calculate genre distribution based on VOTES (proportional calculation)
  const genreData = queue.reduce((acc, song) => {
    const existing = acc.find((item) => item.name === song.genre);
    if (existing) {
      existing.songCount += 1;
      existing.votes += song.votes;
    } else {
      acc.push({ name: song.genre, songCount: 1, votes: song.votes });
    }
    return acc;
  }, [] as { name: string; songCount: number; votes: number }[]);

  // Sort by votes descending for better visualization
  genreData.sort((a, b) => b.votes - a.votes);

  // Calculate total votes for percentage (always sums to 100%)
  const totalVotes = genreData.reduce((sum, g) => sum + g.votes, 0);
  const totalSongs = genreData.reduce((sum, g) => sum + g.songCount, 0);

  // Prepare chart data with accurate percentages
  const chartData = genreData.map((g) => ({
    ...g,
    value: g.votes, // Use votes as the proportional value
    percentage: totalVotes > 0 ? ((g.votes / totalVotes) * 100).toFixed(1) : '0.0',
  }));

  // Color palette matching the screenshot
  const COLORS = [
    '#3b82f6', // Blue
    '#f97316', // Orange
    '#ec4899', // Pink/Magenta
    '#f59e0b', // Yellow/Amber
    '#6b7280', // Gray
    '#10b981', // Emerald
    '#8b5cf6', // Purple
    '#14b8a6', // Teal
    '#ef4444', // Red
    '#06b6d4', // Cyan
    '#f472b6', // Rose
    '#84cc16', // Lime
    '#a855f7', // Violet
    '#f59e0b', // Amber
    '#3b82f6', // Sky Blue
  ];

  // Custom label component with dotted lines and outside positioning
  const renderLabel = (props: any) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, outerRadius, index, name, percentage, songCount, votes } = props;
    
    // Calculate positions
    const radius = outerRadius + 60; // Distance from center for label
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    // Line start position (on pie edge)
    const lineStartRadius = outerRadius + 2;
    const lineStartX = cx + lineStartRadius * Math.cos(-midAngle * RADIAN);
    const lineStartY = cy + lineStartRadius * Math.sin(-midAngle * RADIAN);
    
    // Line end position (near label)
    const lineEndRadius = outerRadius + 50;
    const lineEndX = cx + lineEndRadius * Math.cos(-midAngle * RADIAN);
    const lineEndY = cy + lineEndRadius * Math.sin(-midAngle * RADIAN);
    
    const textAnchor = x > cx ? 'start' : 'end';

    return (
      <g>
        {/* Dotted line from pie to label */}
        <line
          x1={lineStartX}
          y1={lineStartY}
          x2={lineEndX}
          y2={lineEndY}
          stroke={COLORS[index % COLORS.length]}
          strokeWidth={1.5}
          strokeDasharray="3 3"
        />
        
        {/* Small circle at the end of line */}
        <circle
          cx={lineEndX}
          cy={lineEndY}
          r={3}
          fill={COLORS[index % COLORS.length]}
          stroke="rgba(255, 255, 255, 0.8)"
          strokeWidth={1}
        />
        
        {/* Genre name */}
        <text
          x={x}
          y={y - 10}
          textAnchor={textAnchor}
          fill={COLORS[index % COLORS.length]}
          className="font-bold text-sm"
        >
          {name}
        </text>
        
        {/* Percentage */}
        <text
          x={x}
          y={y + 5}
          textAnchor={textAnchor}
          fill="white"
          className="font-black text-lg"
        >
          {percentage}%
        </text>
        
        {/* Song count and votes */}
        <text
          x={x}
          y={y + 18}
          textAnchor={textAnchor}
          fill="rgba(255, 255, 255, 0.6)"
          className="text-xs"
        >
          {songCount} {songCount === 1 ? 'song' : 'songs'} • {votes} votes
        </text>
      </g>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      key={`genre-distribution-${totalVotes}-${genreData.length}`}
    >
      <motion.div
        className="bg-gradient-to-br from-purple-600/40 via-purple-700/40 to-purple-800/40 backdrop-blur-xl rounded-3xl p-6 border border-purple-500/30 relative overflow-hidden"
        whileHover={{
          boxShadow: '0 25px 50px -12px rgba(139, 92, 246, 0.4)',
          transition: { duration: 0.3 },
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <motion.div
              className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-400/30"
              animate={{
                boxShadow: [
                  '0 0 20px rgba(168, 85, 247, 0.3)',
                  '0 0 30px rgba(6, 182, 212, 0.3)',
                  '0 0 20px rgba(168, 85, 247, 0.3)',
                ],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Music2 className="w-5 h-5 text-purple-300" />
            </motion.div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight">Genre Analytics</h3>
              <p className="text-[10px] text-purple-200/70 font-medium">Vote-based • Real-time</p>
            </div>
          </div>
          <motion.div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/30 border border-purple-400/40"
          >
            <span className="text-xs font-bold text-white">{genreData.length}</span>
          </motion.div>
        </div>

        {chartData.length > 0 ? (
          <div className="relative z-10">
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  dataKey="value"
                  stroke="rgba(15, 15, 25, 0.9)"
                  strokeWidth={2}
                  paddingAngle={0}
                  animationBegin={0}
                  animationDuration={1000}
                  animationEasing="ease-out"
                  label={renderLabel}
                  labelLine={false}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                
                {/* Center display */}
                <g>
                  <circle
                    cx="50%"
                    cy="50%"
                    r={67}
                    fill="rgba(30, 20, 50, 0.95)"
                    stroke="rgba(147, 51, 234, 0.5)"
                    strokeWidth={2}
                  />
                  <text
                    x="50%"
                    y="47%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="font-black"
                    style={{
                      fontSize: '42px',
                      fill: 'white',
                    }}
                  >
                    {totalSongs}
                  </text>
                  <text
                    x="50%"
                    y="57%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="font-bold"
                    style={{
                      fontSize: '11px',
                      fill: 'rgba(200, 180, 255, 0.8)',
                    }}
                  >
                    Songs
                  </text>
                </g>
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-96 flex flex-col items-center justify-center text-gray-400 relative z-10">
            <motion.div
              animate={{
                rotate: 360,
                scale: [1, 1.1, 1],
              }}
              transition={{
                rotate: { duration: 3, repeat: Infinity, ease: 'linear' },
                scale: { duration: 2, repeat: Infinity },
              }}
            >
              <Music2 className="w-16 h-16 mb-4 opacity-20" />
            </motion.div>
            <p className="text-sm font-semibold">No genre data available</p>
            <p className="text-xs text-gray-500 mt-2">Queue songs to see distribution analytics</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}