import { motion, AnimatePresence } from 'motion/react';
import { BarChart3 } from 'lucide-react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Song } from '../App';
import { MusicNoteExplosion } from './MusicNoteExplosion';
import { RemainingQueueModal } from './RemainingQueueModal';
import { ItsHotCelebration } from './ItsHotCelebration';

interface SongQueueProps {
  queue: Song[];
  onRemoveSong: (id: string) => void;
  onVote: (id: string) => void;
}

export function SongQueue({ queue, onVote }: SongQueueProps) {
  const [votingId, setVotingId] = useState<string | null>(null);
  const [isRemainingOpen, setIsRemainingOpen] = useState(false);
  const [hotSongName, setHotSongName] = useState<string>('');
  const [showHotCelebration, setShowHotCelebration] = useState(false);

  // Memoize sorted queue for performance
  const sortedQueue = useMemo(() => 
    [...queue].sort((a, b) => b.votes - a.votes), 
    [queue]
  );

  // Top 5 songs for chart display - memoized
  const displayQueue = useMemo(() => sortedQueue.slice(0, 5), [sortedQueue]);
  
  // Remaining songs - memoized
  const remainingSongs = useMemo(() => sortedQueue.slice(5), [sortedQueue]);
  
  const maxVotes = useMemo(() => 
    Math.max(...displayQueue.map(s => s.votes), 1), 
    [displayQueue]
  );

  const handleVote = useCallback((id: string) => {
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
  }, [queue, onVote]);

  return (
    <>
      {/* Full-screen music note explosion */}
      <MusicNoteExplosion isActive={votingId !== null} />

      <motion.div
        initial={{ x: 100, opacity: 0, rotateY: 15 }}
        animate={{ x: 0, opacity: 1, rotateY: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="h-full"
        style={{ perspective: '1000px' }}
      >
        <motion.div
          className="bg-gradient-to-br from-cyan-500/20 to-purple-500/20 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/20 shadow-2xl h-full"
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
            className="flex items-center gap-3 mb-6"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <BarChart3 className="w-8 h-8 text-pink-400" />
            </motion.div>
            <h2 className="text-2xl md:text-3xl font-black text-white">Up Next - Poll Chart</h2>
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
            <div className="space-y-6">
              {/* Y-axis label with remaining songs link */}
              <div className="flex items-center gap-2 text-cyan-300 text-sm">
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
              <div className="relative">
                <AnimatePresence mode="popLayout">
                  <div className="grid gap-3" style={{ 
                    gridTemplateColumns: `repeat(${Math.min(displayQueue.length, 5)}, 1fr)`,
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
                          className="flex flex-col items-center cursor-pointer group relative"
                          onClick={() => handleVote(song.id)}
                        >
                          {/* Musical Impulse Bar Container */}
                          <div 
                            className="relative w-full"
                            style={{ 
                              height: '350px',
                              display: 'flex',
                              alignItems: 'flex-end',
                              justifyContent: 'center',
                            }}
                          >
                            {/* Main impulse bar with 7 animated segments */}
                            <div className="relative w-full h-full flex items-end justify-center">
                              <div className="flex items-end justify-center gap-[2px] w-full h-full">
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
                                className="absolute bottom-4 left-1/2 -translate-x-1/2 font-black text-2xl text-white pointer-events-none"
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

                              {/* VOTE text overlay on hover/click - with blur background */}
                              <div className="absolute inset-0 flex items-center justify-center rounded-t-2xl overflow-hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ zIndex: 15 }}>
                                <div 
                                  className="absolute inset-0"
                                  style={{
                                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                    backdropFilter: 'blur(10px)',
                                    WebkitBackdropFilter: 'blur(10px)',
                                  }}
                                />
                                <span className="relative text-white font-black text-lg md:text-2xl drop-shadow-lg z-10">
                                  VOTE
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Song label below bar */}
                          <motion.div
                            className="mt-3 text-center px-1 w-full"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.1 + 0.7 }}
                          >
                            <div className="text-xs md:text-sm font-bold text-white line-clamp-2 mb-1">
                              {song.title}
                            </div>
                            <div className="text-xs text-purple-300/70 line-clamp-1">
                              {song.artist}
                            </div>
                            <motion.div
                              className="mt-1 text-xs font-black px-2 py-1 rounded-full inline-block"
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