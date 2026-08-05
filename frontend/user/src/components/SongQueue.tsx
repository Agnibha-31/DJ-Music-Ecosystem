import { motion, AnimatePresence } from 'motion/react';
import { BarChart3 } from 'lucide-react';
import { useState, useEffect, memo, useMemo, useCallback } from 'react';
import type { Song } from '../App';
import { MusicNoteExplosion } from './MusicNoteExplosion';
import { RemainingQueueModal } from './RemainingQueueModal';
import { ItsHotCelebration } from './ItsHotCelebration';

interface SongQueueProps {
  queue: Song[];
  onRemoveSong: (id: string) => void;
  onVote: (id: string) => void;
  systemMode?: any;
}

function SongQueueComponent({ queue, onVote, systemMode }: SongQueueProps) {
  const [votingId, setVotingId] = useState<string | null>(null);
  const [isRemainingOpen, setIsRemainingOpen] = useState(false);
  const [hotSongName, setHotSongName] = useState<string>('');
  const [showHotCelebration, setShowHotCelebration] = useState(false);

  // Memoize sorted queue to prevent unnecessary re-renders
  const sortedQueue = useMemo(() => {
    return [...queue].sort((a, b) => b.votes - a.votes);
  }, [queue]);

  // Memoize top 5 songs and remaining songs calculations
  const { displayQueue, remainingSongs, maxVotes } = useMemo(() => {
    const display = sortedQueue.slice(0, 5);
    const remaining = sortedQueue.slice(5);
    const max = Math.max(...display.map(s => s.votes), 1);
    return { displayQueue: display, remainingSongs: remaining, maxVotes: max };
  }, [sortedQueue]);

  // Memoize handleVote to prevent recreating function on every render
  const handleVote = useCallback((id: string) => {
    if (!systemMode?.isLive || systemMode?.isMaintenance) return;
    
    setVotingId(id);
    onVote(id);
    
    // Check if the voted song crosses 10 votes
    const votedSong = queue.find(s => s.id === id);
    if (votedSong && votedSong.votes === 9) { // Will become 10 after vote
      setTimeout(() => {
        setHotSongName(votedSong.title);
        setShowHotCelebration(true);
        setTimeout(() => setShowHotCelebration(false), 3000);
      }, 500);
    }
    
    setTimeout(() => setVotingId(null), 2500);
  }, [queue, onVote, systemMode]);

  // Floating +1 voting feedback positions
  const floatingVotes = useMemo(() => {
    if (votingId === null) return [];
    const song = displayQueue.find(s => s.id === votingId);
    if (!song) return [];
    
    return Array(3).fill(0).map((_, i) => ({
      id: i,
      angle: (i * 120) * (Math.PI / 180),
      distance: 150 + i * 50,
    }));
  }, [votingId, displayQueue]);

  return (
    <>
      {/* Full-screen music note explosion */}
      <MusicNoteExplosion isActive={votingId !== null} />

      <motion.div
        initial={{ x: 100, opacity: 0, rotateY: 15 }}
        animate={{ x: 0, opacity: 1, rotateY: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="h-full card-shell"
        style={{ perspective: '1000px' }}
      >
        <motion.div
          className="bg-gradient-to-br from-cyan-500/20 to-purple-500/20 backdrop-blur-xl rounded-3xl p-5 md:p-6 lg:p-8 border border-white/20 shadow-2xl h-full overflow-hidden song-queue-card"
          style={{
            transformStyle: 'preserve-3d',
            willChange: 'transform',
          }}
          whileHover={{
            scale: 1.02,
            rotateX: -2,
            rotateY: -2,
            boxShadow: '0 30px 60px -12px rgba(34, 211, 238, 0.6)',
            transition: { duration: 0.2 },
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          <motion.div
            className="flex items-center gap-1.5 md:gap-3 mb-4 md:mb-5 px-3 md:px-2 mt-2 md:mt-0 flex-wrap md:flex-nowrap song-queue-heading"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <BarChart3 className="w-6 h-6 md:w-8 md:h-8 text-pink-400" />
            </motion.div>
            <h2 className="text-base md:text-2xl lg:text-3xl font-black text-white whitespace-nowrap song-queue-title">
              Up Next - Poll Chart
            </h2>
            <span className="text-[8px] md:text-[10px] text-white font-extralight whitespace-nowrap song-queue-instruction" style={{ marginLeft: '8px' }}>(Click on the bar to poll)</span>
          </motion.div>

          {queue.length === 0 ? (
            <motion.div
              className="flex flex-col items-center justify-center h-64 text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
            >
              <BarChart3 className="w-16 h-16 text-purple-300/30 mb-4" />
              <p className="text-purple-300/70 text-lg">No songs in the queue yet!</p>
              <p className="text-purple-300/50 text-sm mt-2">Request a song to get started</p>
            </motion.div>
          ) : (
            <div className="space-y-4 md:space-y-5 pt-1">
              {/* Y-axis label with remaining songs link */}
              <div className="flex items-center gap-2 text-cyan-300 text-sm md:text-base font-semibold px-3 md:px-2">
                <span className="font-bold">Votes</span>
                {remainingSongs.length > 0 && (
                  <motion.button
                    onClick={() => setIsRemainingOpen(true)}
                    className="ml-auto text-xs font-bold text-purple-300 hover:text-cyan-400 transition-colors"
                    style={{
                      textShadow: '0 0 10px rgba(168, 85, 247, 0.5)',
                    }}
                    whileHover={{
                      scale: 1.05,
                      textShadow: '0 0 20px rgba(34, 211, 238, 0.9)',
                    }}
                    animate={{
                      textShadow: [
                        '0 0 10px rgba(168, 85, 247, 0.5)',
                        '0 0 15px rgba(168, 85, 247, 0.8)',
                        '0 0 10px rgba(168, 85, 247, 0.5)',
                      ],
                    }}
                    transition={{
                      textShadow: {
                        duration: 2,
                        repeat: Infinity,
                      },
                    }}
                  >
                    ({displayQueue.length} of {queue.length} songs shown)
                  </motion.button>
                )}
              </div>

              {/* Musical Impulse Bar Chart */}
              <div className="relative overflow-hidden px-4 md:px-2 song-queue-wrapper">
                <AnimatePresence mode="popLayout">
                  <div className="grid gap-1 md:gap-2.5 song-queue-bars" style={{ 
                    gridTemplateColumns: `repeat(${Math.min(displayQueue.length, 5)}, minmax(0, 1fr))`,
                  }}>
                    {displayQueue.map((song, index) => {
                      const heightPercentage = (song.votes / maxVotes) * 100;
                      const isVoting = votingId === song.id;
                      const colors = [
                        { from: '#06b6d4', to: '#22d3ee', shadow: 'rgba(6, 182, 212, 0.5)' },
                        { from: '#a855f7', to: '#c084fc', shadow: 'rgba(168, 85, 247, 0.5)' },
                        { from: '#ec4899', to: '#f472b6', shadow: 'rgba(236, 72, 153, 0.5)' },
                      ];
                      const colorSet = colors[index % 3];
                      
                      return (
                        <motion.div
                          key={song.id}
                          layout
                          initial={{ opacity: 0, y: 100, scale: 0.5 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5, y: -50 }}
                          transition={{
                            type: 'spring',
                            stiffness: 400,
                            damping: 25,
                          }}
                          className="flex flex-col items-center cursor-pointer group relative min-w-0"
                          onClick={() => handleVote(song.id)}
                        >
                          {/* Musical Impulse Bar Container */}
                          <div 
                            className="relative w-full max-w-full"
                            style={{ 
                              height: 'var(--song-queue-bar-height, clamp(190px, 38vw, 240px))',
                              display: 'flex',
                              alignItems: 'flex-end',
                              justifyContent: 'center',
                            }}
                          >
                            {/* Main impulse bar with 7 animated segments */}
                            <div className="relative w-full max-w-full h-full flex items-end justify-center">
                              <div className="flex items-end justify-center gap-[2px] w-full max-w-full h-full">
                                {[...Array(7)].map((_, segIndex) => {
                                  // Each segment has unique height based on sine wave
                                  const baseHeight = heightPercentage * (0.7 + Math.sin(segIndex * 0.9) * 0.3);
                                  
                                  return (
                                    <motion.div
                                      key={segIndex}
                                      className="flex-1 rounded-t-lg overflow-hidden relative"
                                      style={{
                                        minHeight: '30px',
                                        background: `linear-gradient(to top, ${colorSet.from}, ${colorSet.to})`,
                                        boxShadow: `0 -2px 15px ${colorSet.shadow}`,
                                        willChange: 'transform',
                                        transformStyle: 'preserve-3d',
                                      }}
                                      initial={{ height: 0 }}
                                      animate={{
                                        height: isVoting 
                                          ? [
                                              `${baseHeight}%`, 
                                              `${Math.min(baseHeight * 1.4, 100)}%`, 
                                              `${baseHeight}%`
                                            ]
                                          : [
                                              `${baseHeight}%`,
                                              `${Math.min(baseHeight * (1 + Math.random() * 0.3), 100)}%`,
                                              `${Math.min(baseHeight * (1 - Math.random() * 0.2), 100)}%`,
                                              `${Math.min(baseHeight * (1 + Math.random() * 0.25), 100)}%`,
                                              `${baseHeight}%`,
                                            ],
                                        scaleY: [1, 1.05, 0.95, 1.03, 1],
                                        rotateX: [0, 2, -2, 1, 0],
                                        boxShadow: isVoting
                                          ? [
                                              `0 -2px 15px ${colorSet.shadow}`,
                                              `0 -8px 40px ${colorSet.shadow.replace('0.5', '1')}`,
                                              `0 -2px 15px ${colorSet.shadow}`,
                                            ]
                                          : [
                                              `0 -2px 15px ${colorSet.shadow}`,
                                              `0 -4px 25px ${colorSet.shadow.replace('0.5', '0.7')}`,
                                              `0 -2px 15px ${colorSet.shadow}`,
                                            ],
                                      }}
                                      transition={{
                                        height: {
                                          duration: isVoting ? 0.5 : 1.2 + segIndex * 0.1,
                                          repeat: isVoting ? 0 : Infinity,
                                          repeatType: 'reverse',
                                          ease: 'easeInOut',
                                          delay: index * 0.1 + segIndex * 0.15,
                                        },
                                        scaleY: {
                                          duration: 0.8 + segIndex * 0.1,
                                          repeat: Infinity,
                                          repeatType: 'reverse',
                                          ease: 'easeInOut',
                                          delay: segIndex * 0.12,
                                        },
                                        rotateX: {
                                          duration: 1 + segIndex * 0.08,
                                          repeat: Infinity,
                                          repeatType: 'reverse',
                                          ease: 'easeInOut',
                                          delay: segIndex * 0.1,
                                        },
                                        boxShadow: {
                                          duration: isVoting ? 0.5 : 1.2,
                                          repeat: isVoting ? 0 : Infinity,
                                          repeatType: 'reverse',
                                          ease: 'easeInOut',
                                        },
                                      }}
                                    >
                                      {/* Continuous pulse animation for real-time feel */}
                                      <motion.div
                                        className="w-full h-full absolute inset-0"
                                        style={{
                                          background: `linear-gradient(to top, transparent, ${colorSet.to}40, transparent)`,
                                        }}
                                        animate={{
                                          opacity: [0.3, 0.9, 0.3],
                                        }}
                                        transition={{
                                          duration: 0.7 + segIndex * 0.12,
                                          repeat: Infinity,
                                          ease: 'easeInOut',
                                          delay: segIndex * 0.15,
                                        }}
                                      />
                                      
                                      {/* Shimmer effect */}
                                      <motion.div
                                        className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent"
                                        animate={{
                                          y: ['-100%', '100%'],
                                        }}
                                        transition={{
                                          duration: 2,
                                          repeat: Infinity,
                                          repeatDelay: 1,
                                          delay: segIndex * 0.1,
                                          ease: 'linear',
                                        }}
                                      />
                                    </motion.div>
                                  );
                                })}
                              </div>

                              {/* Vote count inside the bar */}
                              <motion.div
                                className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 font-black text-xl md:text-2xl lg:text-3xl text-white pointer-events-none"
                                style={{
                                  textShadow: '0 0 10px rgba(0, 0, 0, 0.8), 0 2px 4px rgba(0, 0, 0, 0.5)',
                                  filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.3))',
                                  zIndex: 20,
                                }}
                                animate={{
                                  scale: isVoting ? [1, 1.5, 1] : 1,
                                  rotate: isVoting ? [0, 10, -10, 0] : 0,
                                }}
                                transition={{
                                  duration: 0.5,
                                }}
                              >
                                {song.votes}
                              </motion.div>

                              {/* Enhanced +1 Floating Text Feedback */}
                              <AnimatePresence>
                                {isVoting && (
                                  <>
                                    {floatingVotes.map((vote) => {
                                      const x = Math.cos(vote.angle) * vote.distance;
                                      const y = Math.sin(vote.angle) * vote.distance;
                                      return (
                                        <motion.div
                                          key={`plus-one-${vote.id}`}
                                          className="absolute bottom-4 left-1/2 -translate-x-1/2 font-black text-3xl pointer-events-none"
                                          initial={{
                                            x: 0,
                                            y: 0,
                                            opacity: 1,
                                            scale: 0.5,
                                          }}
                                          animate={{
                                            x: x,
                                            y: -y,
                                            opacity: [1, 0.8, 0],
                                            scale: [0.5, 1.4, 0],
                                          }}
                                          exit={{
                                            opacity: 0,
                                            scale: 0,
                                          }}
                                          transition={{
                                            duration: 0.9,
                                            delay: vote.id * 0.1,
                                            ease: 'easeOut',
                                          }}
                                          style={{
                                            zIndex: 25,
                                            color: colorSet.from,
                                            textShadow: `0 0 15px ${colorSet.from}, 0 0 30px ${colorSet.from}80`,
                                            filter: `drop-shadow(0 0 8px ${colorSet.from})`,
                                          }}
                                        >
                                          +1
                                        </motion.div>
                                      );
                                    })}

                                    {/* Burst Sparkles */}
                                    {[...Array(8)].map((_, i) => {
                                      const angle = (i * 360 / 8) * (Math.PI / 180);
                                      const x = Math.cos(angle) * 120;
                                      const y = Math.sin(angle) * 120;
                                      return (
                                        <motion.div
                                          key={`sparkle-${i}`}
                                          className="absolute bottom-4 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full pointer-events-none"
                                          initial={{
                                            x: 0,
                                            y: 0,
                                            opacity: 1,
                                            scale: 1,
                                          }}
                                          animate={{
                                            x: x,
                                            y: -y,
                                            opacity: [1, 0.6, 0],
                                            scale: [1, 1.5, 0],
                                          }}
                                          exit={{
                                            opacity: 0,
                                          }}
                                          transition={{
                                            duration: 0.8,
                                            delay: i * 0.05,
                                            ease: 'easeOut',
                                          }}
                                          style={{
                                            zIndex: 22,
                                            background: colorSet.from,
                                            boxShadow: `0 0 8px ${colorSet.from}`,
                                          }}
                                        />
                                      );
                                    })}
                                  </>
                                )}
                              </AnimatePresence>

                              {/* VOTE text overlay on hover/click - without background */}
                              <div className="absolute inset-0 flex items-center justify-center rounded-t-2xl overflow-hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ zIndex: 15 }}>
                                <span className="relative text-white font-black text-base md:text-xl lg:text-2xl z-10" style={{
                                  textShadow: '0 0 20px rgba(0, 0, 0, 0.9), 0 0 40px rgba(0, 0, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.7)',
                                }}>
                                  VOTE
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Song label below bar */}
                          <motion.div
                            className="mt-2 md:mt-3 text-center w-full flex flex-col items-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.1 + 0.7 }}
                          >
                            <div className="text-xs md:text-sm font-bold text-white line-clamp-2 mb-1 leading-tight w-full px-0.5 song-label song-title">
                              {song.title}
                            </div>
                            <div className="text-[10px] md:text-xs text-purple-300/70 line-clamp-1 mb-1 w-full px-0.5 song-label song-artist">
                              {song.artist}
                            </div>
                            <motion.div
                              className="text-[9px] md:text-xs font-black px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full inline-block truncate max-w-[90%] song-genre-chip"
                              style={{
                                background: `linear-gradient(to right, 
                                  ${index % 3 === 0 ? '#06b6d4' : index % 3 === 1 ? '#a855f7' : '#ec4899'}40, 
                                  ${index % 3 === 0 ? '#22d3ee' : index % 3 === 1 ? '#c084fc' : '#f472b6'}40
                                )`,
                                color: index % 3 === 0 ? '#06b6d4' : index % 3 === 1 ? '#a855f7' : '#ec4899',
                              }}
                            >
                              {song.genre}
                            </motion.div>
                          </motion.div>
                        </motion.div>
                      );
                    })}
                  </div>
                </AnimatePresence>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Remaining Queue Modal */}
      <RemainingQueueModal
        isOpen={isRemainingOpen}
        onClose={() => setIsRemainingOpen(false)}
        remainingSongs={remainingSongs}
        onVote={handleVote}
      />

      {/* Hot Song Celebration */}
      <ItsHotCelebration
        isActive={showHotCelebration}
        songName={hotSongName}
      />
    </>
  );
}

export const SongQueue = memo(SongQueueComponent);

// Ensure default export for lazy loading
export default SongQueue;