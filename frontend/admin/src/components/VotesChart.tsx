import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { TrendingUp, Check } from 'lucide-react';
import type { Song } from '../App';

interface VotesChartProps {
  songs: Song[];
  onAcceptSong: (id: string) => void;
}

export function VotesChart({ songs, onAcceptSong }: VotesChartProps) {
  const [clickedId, setClickedId] = useState<string | null>(null);

  const chartData = songs.map((song, index) => ({
    name: song.title.length > 20 ? song.title.substring(0, 20) + '...' : song.title,
    votes: song.votes,
    fullName: song.title,
    artist: song.artist,
    genre: song.genre,
    id: song.id,
    rank: index + 1,
  }));

  const COLORS = [
    '#10b981', // Emerald for #1
    '#06b6d4', // Cyan for #2
    '#a855f7', // Purple for #3
    '#ec4899', // Pink for #4
    '#fbbf24', // Yellow for #5
  ];

  const handleBarClick = (data: any) => {
    if (data && data.id) {
      setClickedId(data.id);
      // Show success animation for 1 second before accepting
      setTimeout(() => {
        onAcceptSong(data.id);
        setClickedId(null);
      }, 1000);
    }
  };

  // Custom label to show rank on bars
  const renderCustomLabel = (props: any) => {
    const { x, y, width, height, value, index } = props;
    return (
      <g>
        <text
          x={x + width + 5}
          y={y + height / 2}
          fill="#fff"
          textAnchor="start"
          dominantBaseline="middle"
          className="font-black text-sm"
        >
          {value} votes
        </text>
        <text
          x={x + 8}
          y={y + height / 2}
          fill="#fff"
          textAnchor="start"
          dominantBaseline="middle"
          className="font-black text-xs"
        >
          #{index + 1}
        </text>
      </g>
    );
  };

  // Custom Bar with hover glow effect
  const CustomBar = (props: any) => {
    const { fill, x, y, width, height, index } = props;
    return (
      <g>
        <motion.rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={fill}
          rx={8}
          ry={8}
          whileHover={{
            filter: `drop-shadow(0 0 20px ${fill})`,
          }}
          transition={{ duration: 0.2 }}
          style={{ cursor: 'pointer' }}
        />
      </g>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      key={`votes-chart-${songs.map(s => s.id).join('-')}`}
    >
      <motion.div
        className="bg-gradient-to-br from-slate-900/95 via-indigo-950/95 to-purple-950/95 backdrop-blur-xl rounded-3xl p-6 border border-purple-500/30 relative overflow-hidden"
        whileHover={{
          boxShadow: '0 25px 50px -12px rgba(139, 92, 246, 0.4)',
          transition: { duration: 0.3 },
        }}
      >
        {/* Success Animation Overlay */}
        <AnimatePresence>
          {clickedId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 backdrop-blur-sm rounded-3xl flex items-center justify-center z-20"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                className="bg-emerald-500 rounded-full p-6"
              >
                <Check className="w-16 h-16 text-white" strokeWidth={3} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Animated background orbs */}
        <motion.div
          className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />

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
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </motion.div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight">Top 5 Trending</h3>
              <p className="text-[10px] text-purple-300/70 font-medium">Click bar to accept</p>
            </div>
          </div>
          <motion.div
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-400/40"
          >
            <span className="text-xs font-bold text-white">{songs.length} Songs</span>
          </motion.div>
        </div>

        {chartData.length > 0 ? (
          <div className="relative z-10">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 10, right: 100, bottom: 10, left: 0 }}
                barCategoryGap="15%"
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={150}
                  tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Bar
                  dataKey="votes"
                  radius={[0, 8, 8, 0]}
                  cursor="pointer"
                  onClick={handleBarClick}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      className="hover:brightness-125 transition-all duration-300"
                      style={{
                        filter: 'drop-shadow(0 0 0px transparent)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.filter = `drop-shadow(0 0 20px ${COLORS[index % COLORS.length]})`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.filter = 'drop-shadow(0 0 0px transparent)';
                      }}
                    />
                  ))}
                  <LabelList content={renderCustomLabel} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="mt-4 grid grid-cols-1 gap-2">
              {chartData.map((song, index) => (
                <motion.div
                  key={song.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  whileHover={{ scale: 1.02 }}
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: COLORS[index % COLORS.length],
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-bold text-xs truncate">{song.fullName}</div>
                    <div className="text-gray-400 text-[10px] truncate">{song.artist} • {song.genre}</div>
                  </div>
                  <div className="text-xs font-bold text-white">#{song.rank}</div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-96 flex flex-col items-center justify-center text-gray-400">
            <TrendingUp className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-sm font-semibold">No songs in queue</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
