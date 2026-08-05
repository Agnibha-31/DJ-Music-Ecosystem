import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { useState, useMemo, useCallback, memo } from 'react';
import type { Song } from '../App';

interface VotesChartProps {
  songs: Song[];
  onAcceptSong: (id: string) => void;
}

export const VotesChart = memo(function VotesChart({ songs, onAcceptSong }: VotesChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [clickedIndex, setClickedIndex] = useState<number | null>(null);

  // Memoize chart data transformation
  const chartData = useMemo(() => 
    songs.map((song, index) => ({
      name: song.title.length > 20 ? song.title.substring(0, 20) + '...' : song.title,
      votes: song.votes,
      fullName: song.title,
      artist: song.artist,
      genre: song.genre,
      id: song.id,
      rank: index + 1,
    })),
    [songs]
  );

  const COLORS = [
    '#10b981', // Emerald for #1
    '#06b6d4', // Cyan for #2
    '#a855f7', // Purple for #3
    '#ec4899', // Pink for #4
    '#fbbf24', // Yellow for #5
  ];

  const handleBarClick = useCallback((data: any, index: number) => {
    if (data && data.id) {
      setClickedIndex(index);
      setTimeout(() => setClickedIndex(null), 600);
      onAcceptSong(data.id);
    }
  }, [onAcceptSong]);

  // Custom label to show rank on bars
  const renderCustomLabel = (props: any) => {
    const { x, y, width, height, value, index } = props;
    const isHovered = hoveredIndex === index;
    const isClicked = clickedIndex === index;
    const isHighlighted = isHovered || isClicked;
    const minBarWidth = 22;
    const voteX = x + Math.max(width, minBarWidth) + 6;
    const rankX = x + 8;
    
    return (
      <g pointerEvents="none">
        <text
          x={voteX}
          y={y + height / 2}
          fill="#fff"
          textAnchor="start"
          dominantBaseline="middle"
          className="font-black"
          style={{
            filter: isHighlighted ? 'drop-shadow(0 0 4px rgba(255,255,255,0.8))' : 'none',
            fontSize: isHighlighted ? '15px' : '14px',
            fontWeight: 900,
            pointerEvents: 'none',
          }}
        >
          {value} votes
        </text>
        <text
          x={rankX}
          y={y + height / 2}
          fill="#fff"
          textAnchor="start"
          dominantBaseline="middle"
          className="font-black"
          style={{
            filter: isHighlighted ? 'drop-shadow(0 0 4px rgba(255,255,255,0.8))' : 'none',
            fontSize: isHighlighted ? '13px' : '12px',
            fontWeight: 900,
            pointerEvents: 'none',
          }}
        >
          #{index + 1}
        </text>
      </g>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <motion.div
        className="bg-gradient-to-br from-purple-500/15 to-pink-500/15 backdrop-blur-xl rounded-2xl p-4 border border-white/20"
        whileHover={{
          scale: 1.01,
          boxShadow: '0 20px 40px rgba(168, 85, 247, 0.3)',
          transition: { duration: 0.2 },
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="text-base font-black text-white">Top 5 Trending</h3>
              <p className="text-[10px] text-gray-400">Click bars to accept</p>
            </div>
          </div>
        </div>
        
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 80, left: 5, bottom: 5 }}>
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                stroke="#fff" 
                width={120}
                style={{ fontSize: '11px', fontWeight: 'bold' }}
                tick={{ fill: '#fff' }}
              />
              <Bar 
                dataKey="votes" 
                radius={[0, 8, 8, 0]}
                onClick={(data: any, index: number) => {
                  if (data && index >= 0 && index < chartData.length) {
                    handleBarClick(chartData[index], index);
                  }
                }}
                onMouseEnter={(data: any, index: number) => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ cursor: 'pointer' }}
                animationDuration={800}
                isAnimationActive={false}
              >
                {chartData.map((entry, index) => {
                  const isHovered = hoveredIndex === index;
                  const isClicked = clickedIndex === index;
                  
                  return (
                    <Cell 
                      key={`cell-${entry.id}`}
                      fill={COLORS[index]}
                      fillOpacity={isHovered || isClicked ? 1 : 0.85}
                      stroke={isHovered ? COLORS[index] : isClicked ? '#fff' : 'none'}
                      strokeWidth={isHovered ? 3 : isClicked ? 4 : 0}
                      filter={isHovered 
                        ? `drop-shadow(0 0 15px ${COLORS[index]}) brightness(1.2)` 
                        : isClicked 
                        ? `drop-shadow(0 0 20px ${COLORS[index]}) brightness(1.3) saturate(1.5)`
                        : undefined}
                      style={{ cursor: 'pointer' }}
                    />
                  );
                })}
                <LabelList 
                  dataKey="votes" 
                  content={renderCustomLabel}
                  position="insideLeft"
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-gray-400">
            <TrendingUp className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">No songs</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
});
