import { VenueProvider, useVenue } from './context/VenueContext';

import { useState, useMemo, useCallback, lazy, Suspense, useEffect } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Users, Music, AlertCircle } from 'lucide-react';
import { io } from 'socket.io-client';
import { Header } from './components/Header';
import { BackgroundAnimation } from './components/BackgroundAnimation';
import { FloatingNotes } from './components/FloatingNotes';
import { ParticleField } from './components/ParticleField';
import { MobileOptimizer } from './components/MobileOptimizer';
import { Footer } from './components/Footer';
import { PulsingRings } from './components/PulsingRings';
import { GenreChart } from './components/GenreChart';
import { VotesChart } from './components/VotesChart';
import { DJQueue } from './components/DJQueue';
import { AddSongButton } from './components/AddSongButton';
import { DJLogin } from './pages/DJLogin';
import { UserProfilePopup } from './components/UserProfilePopup';
import { clearTokens, ensureDjSession, getAccessToken, getLiveSessionId, getSocketUrl, requestJson, getApiBaseUrl } from './utils/apiClient';

// Lazy load less critical components
const RequestHistory = lazy(() => import('./components/RequestHistory'));
const InsertSongModal = lazy(() => import('./components/InsertSongModal'));

export interface Song {
  id: string;
  title: string;
  artist: string;
  genre: string;
  votes: number;
  timestamp: number;
}

type HistorySong = {
  id: string;
  title: string;
  artist: string;
  timestamp: number;
  originalVotes?: number;
  originalGenre?: string;
};

const addUniqueById = <T extends { id: string }>(items: T[], next: T) => {
  if (items.some((item) => item.id === next.id)) {
    return items;
  }
  return [...items, next];
};

const addUniqueByKey = function <T>(items: T[], next: T, keyFn: (item: T) => string) {
  const key = keyFn(next);
  if (items.some((item) => keyFn(item) === key)) {
    return items;
  }
  return [...items, next];
};

const songKey = (title: string, artist: string) => `${title.trim().toLowerCase()}::${artist.trim().toLowerCase()}`;

const normalizeQueue = (items: Song[]) => {
  const byKey = new Map<string, Song>();
  items.forEach((item) => {
    const key = songKey(item.title, item.artist);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, item);
      return;
    }
    if (item.votes > existing.votes || (item.votes === existing.votes && item.timestamp > existing.timestamp)) {
      byKey.set(key, item);
    }
  });
  return Array.from(byKey.values());
};

const toTimestamp = (value?: string | number | null) => {
  if (typeof value === 'number') return value;
  if (!value) return Date.now();
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Date.now() : parsed;
};

const mapQueueItemToSong = (item: any): Song => ({
  id: String(item.id ?? ''),
  title: String(item.songTitle ?? item.title ?? ''),
  artist: String(item.artist ?? ''),
  genre: String(item.genre ?? ''),
  votes: Number(item.votes ?? 0),
  timestamp: toTimestamp(item.timestamp ?? item.created_at)
});

// Separate component for the authenticated DJ dashboard
function DJDashboard({ onLogout }: { onLogout: () => void }) {
  const { activeVenueId, activeVenue, liveSessionId } = useVenue();
  const [queue, setQueue] = useState<Song[]>([]);
  const [acceptedSongs, setAcceptedSongs] = useState<HistorySong[]>([]);
  const [rejectedSongs, setRejectedSongs] = useState<HistorySong[]>([]);
  const [isInsertModalOpen, setIsInsertModalOpen] = useState(false);
  const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false);
  const [systemMode, setSystemMode] = useState<any>({ isLive: false, isMaintenance: false, isOverrideEnabled: false });
  const [catalogSongs, setCatalogSongs] = useState<Array<{ id: string; title: string; artist: string; genre: string }>>([]);
  const [catalogGenres, setCatalogGenres] = useState<string[]>([]);

  // Get username from per-tab session storage
  const username = sessionStorage.getItem('dj_username') || 'DJ';

  const filteredQueue = useMemo(() => {
    if (acceptedSongs.length === 0 && rejectedSongs.length === 0) {
      return queue;
    }
    const blocked = new Set<string>([
      ...acceptedSongs.map((song) => songKey(song.title, song.artist)),
      ...rejectedSongs.map((song) => songKey(song.title, song.artist))
    ]);
    return queue.filter((song) => !blocked.has(songKey(song.title, song.artist)));
  }, [queue, acceptedSongs, rejectedSongs]);

  const loadQueue = useCallback(async () => {
    if (!activeVenueId) return;
    const sessionParam = liveSessionId ? `&live_session_id=${liveSessionId}` : '';
    const data = await requestJson<{ items: any[] }>(`/queue?venue_id=${activeVenueId}${sessionParam}`);
    const pending = (data.items ?? []).filter((item) => item.status === 'pending');
    setQueue(normalizeQueue(pending.map(mapQueueItemToSong)));
  }, [activeVenueId, liveSessionId]);

  const loadSystemMode = useCallback(async () => {
    try {
      const data = await requestJson<{ systemMode: any }>("/system-mode");
      if (data.systemMode) {
        setSystemMode(data.systemMode);
      }
    } catch (error) {
      console.error('Load system mode failed', error);
    }
  }, []);

  const loadCatalogSongs = useCallback(async () => {
    if (!activeVenueId) {
      setCatalogSongs([]);
      setCatalogGenres([]);
      return;
    }
    try {
      const data = await requestJson<{ items: any[] }>(`/songs/catalog?venue_id=${activeVenueId}`);
      const items = (data.items ?? []).map((item) => ({
        id: String(item.id ?? ''),
        title: String(item.title ?? ''),
        artist: String(item.artist ?? ''),
        genre: String(item.genre ?? '')
      }));
      setCatalogSongs(items);
      setCatalogGenres(Array.from(new Set(items.map((item) => item.genre))).sort());
    } catch (error) {
      console.error('Load catalog songs failed', error);
    }
  }, [activeVenueId]);

  const loadHistory = useCallback(async () => {
    if (!activeVenueId) return;
    const sessionParam = liveSessionId ? `&live_session_id=${liveSessionId}` : '';
    const [accepted, rejected] = await Promise.all([
      requestJson<{ items: any[] }>(`/history/accepted?venue_id=${activeVenueId}${sessionParam}`),
      requestJson<{ items: any[] }>(`/history/rejected?venue_id=${activeVenueId}${sessionParam}`)
    ]);

    setAcceptedSongs(() =>
      (accepted.items ?? []).reduce<HistorySong[]>((acc, item) =>
        addUniqueByKey(
          acc,
          {
            id: String(item.id ?? ''),
            title: String(item.songTitle ?? item.title ?? ''),
            artist: String(item.artist ?? ''),
            timestamp: toTimestamp(item.updated_at ?? item.timestamp),
            originalVotes: Number(item.votes ?? 0),
            originalGenre: String(item.genre ?? '')
          },
          (song) => songKey(song.title, song.artist)
        ),
        []
      )
    );

    setRejectedSongs(() =>
      (rejected.items ?? []).reduce<HistorySong[]>((acc, item) =>
        addUniqueByKey(
          acc,
          {
            id: String(item.id ?? ''),
            title: String(item.songTitle ?? item.title ?? ''),
            artist: String(item.artist ?? ''),
            timestamp: toTimestamp(item.updated_at ?? item.timestamp),
            originalVotes: Number(item.votes ?? 0),
            originalGenre: String(item.genre ?? '')
          },
          (song) => songKey(song.title, song.artist)
        ),
        []
      )
    );
  }, [activeVenueId, liveSessionId]);

  useEffect(() => {
    let isMounted = true;
    const bootstrap = async () => {
      try {
        await ensureDjSession();
        if (!isMounted) return;
        await Promise.all([loadQueue(), loadHistory(), loadSystemMode(), loadCatalogSongs()]);
      } catch (error) {
        console.error('DJ bootstrap failed', error);
        const message = error instanceof Error ? error.message : String(error);
        if (message === 'no_session' || message === 'unauthorized') {
          onLogout();
        }
      }
    };

    if (activeVenueId) {
      setQueue([]);
      setAcceptedSongs([]);
      setRejectedSongs([]);
      bootstrap();
    }

    return () => {
      isMounted = false;
    };
  }, [activeVenueId, loadQueue, loadHistory, loadSystemMode, loadCatalogSongs]);

  useEffect(() => {
    if (!activeVenueId) return undefined;
    const intervalId = window.setInterval(() => {
      loadCatalogSongs().catch((error) => console.error('Reload catalog songs failed', error));
    }, 10000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeVenueId, loadCatalogSongs]);

  // Handle browser close / navigation confirmation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // If session is active, prompt confirmation
      if (liveSessionId) {
        e.preventDefault();
        e.returnValue = ''; // Required for Chrome/Firefox to show dialog
      }
    };

    const handleUnload = () => {
      // If user confirms leave (page is hiding/unloading), suspend the session
      if (liveSessionId) {
        const token = getAccessToken();
        if (token) {
          // Use fetch with keepalive as it reliably runs after page unload
          fetch(`${getApiBaseUrl()}/live-sessions/${liveSessionId}/suspend`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            keepalive: true
          }).catch(err => console.error('Suspend on exit failed', err));
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleUnload);
    };
  }, [liveSessionId]);

  useEffect(() => {
    const socket = io(getSocketUrl(), { reconnection: true });
    socket.on('connect', () => {
      if (activeVenueId) {
        socket.emit('join_venue', { venueId: activeVenueId });
      }
    });

    if (activeVenueId) {
      socket.emit('join_venue', { venueId: activeVenueId });
    }

    socket.on('queue.request.created', ({ queueItem, venueId }) => {
      if (!queueItem || queueItem.status !== 'pending') return;
      if (activeVenueId && venueId && venueId !== activeVenueId) return;
      const mapped = mapQueueItemToSong(queueItem);
      setQueue((prev) => normalizeQueue([mapped, ...prev]));
    });

    socket.on('queue.vote.updated', ({ queueItemId, votes, venueId }) => {
      if (!queueItemId) return;
      if (activeVenueId && venueId && venueId !== activeVenueId) return;
      setQueue((prev) => normalizeQueue(prev.map((song) => (song.id === queueItemId ? { ...song, votes: Number(votes ?? song.votes) } : song))));
    });

    socket.on('dj.queue.inserted', ({ queueItem, venueId }) => {
      if (!queueItem || queueItem.status !== 'pending') return;
      if (activeVenueId && venueId && venueId !== activeVenueId) return;
      const mapped = mapQueueItemToSong(queueItem);
      setQueue((prev) => normalizeQueue([mapped, ...prev]));
    });

    socket.on('dj.queue.accepted', ({ queueItemId, queueItem, venueId }) => {
      if (!queueItemId) return;
      if (activeVenueId && venueId && venueId !== activeVenueId) return;
      setQueue((prev) => {
        const existing = prev.find((song) => song.id === queueItemId);
        if (!existing && queueItem) {
          const mapped = mapQueueItemToSong(queueItem);
          setAcceptedSongs((acceptedPrev) =>
            addUniqueByKey(
              acceptedPrev,
              {
                id: mapped.id,
                title: mapped.title,
                artist: mapped.artist,
                timestamp: Date.now(),
                originalVotes: mapped.votes,
                originalGenre: mapped.genre
              },
              (song) => songKey(song.title, song.artist)
            )
          );
          const key = songKey(mapped.title, mapped.artist);
          return prev.filter((song) => songKey(song.title, song.artist) !== key);
        }
        if (!existing) return prev;
        setAcceptedSongs((acceptedPrev) =>
          addUniqueByKey(
            acceptedPrev,
            {
              id: existing.id,
              title: existing.title,
              artist: existing.artist,
              timestamp: Date.now(),
              originalVotes: existing.votes,
              originalGenre: existing.genre
            },
            (song) => songKey(song.title, song.artist)
          )
        );
        const key = songKey(existing.title, existing.artist);
        return prev.filter((song) => songKey(song.title, song.artist) !== key);
      });
    });

    socket.on('dj.queue.rejected', ({ queueItemId, queueItem, venueId }) => {
      if (!queueItemId) return;
      if (activeVenueId && venueId && venueId !== activeVenueId) return;
      setQueue((prev) => {
        const existing = prev.find((song) => song.id === queueItemId);
        if (!existing && queueItem) {
          const mapped = mapQueueItemToSong(queueItem);
          setRejectedSongs((rejectedPrev) =>
            addUniqueByKey(
              rejectedPrev,
              {
                id: mapped.id,
                title: mapped.title,
                artist: mapped.artist,
                timestamp: Date.now(),
                originalVotes: mapped.votes,
                originalGenre: mapped.genre
              },
              (song) => songKey(song.title, song.artist)
            )
          );
          const key = songKey(mapped.title, mapped.artist);
          return prev.filter((song) => songKey(song.title, song.artist) !== key);
        }
        if (!existing) return prev;
        setRejectedSongs((rejectedPrev) =>
          addUniqueByKey(
            rejectedPrev,
            {
              id: existing.id,
              title: existing.title,
              artist: existing.artist,
              timestamp: Date.now(),
              originalVotes: existing.votes,
              originalGenre: existing.genre
            },
            (song) => songKey(song.title, song.artist)
          )
        );
        const key = songKey(existing.title, existing.artist);
        return prev.filter((song) => songKey(song.title, song.artist) !== key);
      });
    });

    socket.on('dj.queue.reverted', ({ queueItemId, venueId }) => {
      if (!queueItemId) return;
      if (activeVenueId && venueId && venueId !== activeVenueId) return;
      setAcceptedSongs((prev) => {
        const match = prev.find((song) => song.id === queueItemId);
        if (match) {
          setQueue((queuePrev) =>
            normalizeQueue([
              {
                id: match.id,
                title: match.title,
                artist: match.artist,
                genre: match.originalGenre ?? 'Pop',
                votes: match.originalVotes ?? 0,
                timestamp: Date.now()
              },
              ...queuePrev
            ])
          );
        }
        return prev.filter((song) => song.id !== queueItemId);
      });

      setRejectedSongs((prev) => {
        const match = prev.find((song) => song.id === queueItemId);
        if (match) {
          setQueue((queuePrev) =>
            normalizeQueue([
              {
                id: match.id,
                title: match.title,
                artist: match.artist,
                genre: match.originalGenre ?? 'Pop',
                votes: match.originalVotes ?? 0,
                timestamp: Date.now()
              },
              ...queuePrev
            ])
          );
        }
        return prev.filter((song) => song.id !== queueItemId);
      });
    });

    socket.on('system.mode.updated', ({ systemMode: updatedMode }) => {
      if (updatedMode) {
        setSystemMode(updatedMode);
      }
    });

    socket.on('queue.item.updated', ({ queueItemId, status, venueId }) => {
      if (!queueItemId || status !== 'pending') return;
      if (activeVenueId && venueId && venueId !== activeVenueId) return;
      loadQueue().catch((error) => console.error('Reload queue failed', error));
    });

    socket.on('dj.account.deleted', ({ djUsername }) => {
      // Check if the deleted DJ is the currently logged-in user
      const currentUsername = sessionStorage.getItem('dj_username');
      if (currentUsername && currentUsername === djUsername) {
        // Force logout the current user
        console.log('Your DJ account has been deleted by an admin. Logging out...');
        onLogout();
      }
    });

    socket.on('venue.songs.updated', () => {
      if (!activeVenueId) return;
      loadCatalogSongs().catch((error) => console.error('Reload catalog songs failed', error));
    });

    socket.on('admin.song.catalog.updated', () => {
      if (!activeVenueId) return;
      loadCatalogSongs().catch((error) => console.error('Reload catalog songs failed', error));
    });

    socket.on('live_session.ended', ({ live_session }: { live_session: any }) => {
      if (!live_session || !liveSessionId) return;
      if (live_session.id === liveSessionId) {
        console.log('Session ended by admin. Logging out...');
        onLogout();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [activeVenueId, liveSessionId, loadQueue, loadHistory, loadCatalogSongs, onLogout]);

  const removeSongFromQueue = useCallback((id: string) => {
    setQueue((prev) => prev.filter((song) => song.id !== id));
  }, []);

  const acceptSong = useCallback(async (id: string) => {
    if (!systemMode?.isLive || systemMode?.isMaintenance) return;
    if (!activeVenueId) return;
    try {
      await ensureDjSession();
      const updated = await requestJson<any>("/queue/accept", {
        method: "PATCH",
        body: JSON.stringify({ queueItemId: id, venue_id: activeVenueId })
      });
      removeSongFromQueue(id);
      setAcceptedSongs((prev) =>
        addUniqueByKey(
          prev,
          {
            id: String(updated.id ?? id),
            title: String(updated.songTitle ?? updated.title ?? ''),
            artist: String(updated.artist ?? ''),
            timestamp: Date.now(),
            originalVotes: Number(updated.votes ?? 0),
            originalGenre: String(updated.genre ?? '')
          },
          (song) => songKey(song.title, song.artist)
        )
      );
      const key = songKey(String(updated.songTitle ?? updated.title ?? ''), String(updated.artist ?? ''));
      setQueue((prev) => prev.filter((song) => songKey(song.title, song.artist) !== key));
    } catch (error) {
      console.error('Accept song failed', error);
    }
  }, [activeVenueId, removeSongFromQueue, systemMode]);

  const rejectSong = useCallback(async (id: string) => {
    if (!systemMode?.isLive || systemMode?.isMaintenance) return;
    if (!activeVenueId) return;
    try {
      await ensureDjSession();
      const updated = await requestJson<any>("/queue/reject", {
        method: "PATCH",
        body: JSON.stringify({ queueItemId: id, venue_id: activeVenueId })
      });
      removeSongFromQueue(id);
      setRejectedSongs((prev) =>
        addUniqueByKey(
          prev,
          {
            id: String(updated.id ?? id),
            title: String(updated.songTitle ?? updated.title ?? ''),
            artist: String(updated.artist ?? ''),
            timestamp: Date.now(),
            originalVotes: Number(updated.votes ?? 0),
            originalGenre: String(updated.genre ?? '')
          },
          (song) => songKey(song.title, song.artist)
        )
      );
      const key = songKey(String(updated.songTitle ?? updated.title ?? ''), String(updated.artist ?? ''));
      setQueue((prev) => prev.filter((song) => songKey(song.title, song.artist) !== key));
    } catch (error) {
      console.error('Reject song failed', error);
    }
  }, [activeVenueId, removeSongFromQueue, systemMode]);

  const revertAcceptedSong = useCallback(async (id: string) => {
    if (!activeVenueId) return;
    try {
      await ensureDjSession();
      const updated = await requestJson<any>("/queue/revert", {
        method: "PATCH",
        body: JSON.stringify({ queueItemId: id, venue_id: activeVenueId })
      });
      setAcceptedSongs((prev) => prev.filter((song) => song.id !== id));
      setQueue((prev) => normalizeQueue([mapQueueItemToSong(updated), ...prev]));
    } catch (error) {
      console.error('Revert accepted failed', error);
    }
  }, [activeVenueId]);

  const revertRejectedSong = useCallback(async (id: string) => {
    if (!activeVenueId) return;
    try {
      await ensureDjSession();
      const updated = await requestJson<any>("/queue/revert", {
        method: "PATCH",
        body: JSON.stringify({ queueItemId: id, venue_id: activeVenueId })
      });
      setRejectedSongs((prev) => prev.filter((song) => song.id !== id));
      setQueue((prev) => normalizeQueue([mapQueueItemToSong(updated), ...prev]));
    } catch (error) {
      console.error('Revert rejected failed', error);
    }
  }, [activeVenueId]);

  const insertSong = useCallback(async (title: string, artist: string, genre: string) => {
    if (!systemMode?.isLive || systemMode?.isMaintenance) return;
    if (!activeVenueId) return;
    try {
      await ensureDjSession();
      const created = await requestJson<any>("/queue/insert", {
        method: "POST",
        body: JSON.stringify({ songId: null, songTitle: title, artist, genre, venue_id: activeVenueId, live_session_id: liveSessionId ?? undefined })
      });
      setQueue((prev) => normalizeQueue([mapQueueItemToSong(created), ...prev]));
    } catch (error) {
      console.error('Insert song failed', error);
    }
  }, [activeVenueId, systemMode, liveSessionId]);

  const voteForSong = useCallback(async (id: string) => {
    if (!systemMode?.isLive || systemMode?.isMaintenance) return;
    if (!activeVenueId) return;
    try {
      const updated = await requestJson<any>("/queue/vote", {
        method: "PATCH",
        body: JSON.stringify({ queueItemId: id, venue_id: activeVenueId })
      }, false);
      setQueue((prev) => normalizeQueue(prev.map((song) => (song.id === id ? { ...song, votes: Number(updated.votes ?? song.votes) } : song))));
    } catch (error) {
      console.error('Vote failed', error);
    }
  }, [activeVenueId, systemMode]);

  const { sortedQueue, top5Songs, remainingQueue, totalRequests, totalVotes, activeGenres } = useMemo(() => {
    const sorted = [...filteredQueue].sort((a, b) => b.votes - a.votes);
    const top5 = sorted.slice(0, 5);
    const remaining = sorted.slice(5);
    const requests = filteredQueue.length + acceptedSongs.length + rejectedSongs.length;
    const votes = filteredQueue.reduce((sum, song) => sum + song.votes, 0);
    const genres = new Set(filteredQueue.map((s) => s.genre)).size;

    return {
      sortedQueue: sorted,
      top5Songs: top5,
      remainingQueue: remaining,
      totalRequests: requests,
      totalVotes: votes,
      activeGenres: genres
    };
  }, [filteredQueue, acceptedSongs.length, rejectedSongs.length]);

  const analyticsCards = [
    {
      icon: Music,
      title: 'Requests',
      value: totalRequests,
      color: 'from-cyan-500 to-blue-500',
      shadowColor: 'rgba(6, 182, 212, 0.4)',
      iconColor: 'text-cyan-400'
    },
    {
      icon: TrendingUp,
      title: 'Votes',
      value: totalVotes,
      color: 'from-purple-500 to-pink-500',
      shadowColor: 'rgba(168, 85, 247, 0.4)',
      iconColor: 'text-purple-400'
    },
    {
      icon: Users,
      title: 'Genres',
      value: activeGenres,
      color: 'from-pink-500 to-rose-500',
      shadowColor: 'rgba(236, 72, 153, 0.4)',
      iconColor: 'text-pink-400'
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-900 via-indigo-900 to-pink-900">
      <BackgroundAnimation />
      <PulsingRings />
      <FloatingNotes />
      <ParticleField />
      <MobileOptimizer />

      <div className="relative z-10">
        <Header
          venue={activeVenue ?? { name: 'Loading...' }}
          systemMode={systemMode}
          onUserClick={() => setIsProfilePopupOpen((prev) => !prev)}
          profilePopup={(buttonRef) => (
            <UserProfilePopup
              isOpen={isProfilePopupOpen}
              onClose={() => setIsProfilePopupOpen(false)}
              username={username}
              onLogout={onLogout}
              onEndSession={async () => {
                try {
                  if (liveSessionId) {
                    await requestJson(`/live-sessions/${liveSessionId}/end`, { method: 'PATCH' });
                  }
                } catch (error) {
                  console.error('End session failed', error);
                }
                onLogout();
              }}
              buttonRef={buttonRef}
            />
          )}
        />

        {(!systemMode.isLive || systemMode.isMaintenance) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/20 border border-red-500/50 backdrop-blur-md"
          >
            <div className="container mx-auto px-4 py-4 flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
              <div>
                <h3 className="text-red-300 font-bold">
                  {systemMode.isMaintenance ? 'System under maintanance, see you later !' : 'System is not live yet !'}
                </h3>
                <p className="text-red-400 text-sm mt-1">
                  {systemMode.isMaintenance ? 'The system is temporarily unavailable for maintenance.' : 'The DJ Command Center is not active. Please try again later.'}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <main className="container mx-auto px-4 py-4 md:py-8">
          <div className="max-w-7xl mx-auto space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {analyticsCards.map((card, index) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.08
                  }}
                >
                  <motion.div
                    className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-xl p-3 border border-white/20"
                    whileHover={{
                      scale: 1.03,
                      boxShadow: `0 15px 30px ${card.shadowColor}`,
                      transition: { duration: 0.2 }
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${card.color}`}>
                        <card.icon className={`w-4 h-4 ${card.iconColor}`} />
                      </div>
                    </div>
                    <div className="text-xs text-gray-300 mb-1">{card.title}</div>
                    <div className="text-2xl font-black text-white">{card.value}</div>
                  </motion.div>
                </motion.div>
              ))}

              <AddSongButton onClick={() => setIsInsertModalOpen(true)} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <GenreChart queue={filteredQueue} />
              <VotesChart songs={top5Songs} onAcceptSong={acceptSong} />
            </div>

            {remainingQueue.length > 0 && (
              <DJQueue
                queue={remainingQueue}
                startRank={6}
                onAcceptSong={acceptSong}
                onRejectSong={rejectSong}
              />
            )}

            <Suspense fallback={<div className="h-32 bg-white/5 backdrop-blur-xl rounded-xl animate-pulse" />}>
              <RequestHistory
                acceptedSongs={acceptedSongs}
                rejectedSongs={rejectedSongs}
                onRevertAccepted={(id, _title, _artist) => revertAcceptedSong(id)}
                onRevertRejected={(id, _title, _artist) => revertRejectedSong(id)}
              />
            </Suspense>
          </div>
        </main>

        <Footer />
      </div>

      <Suspense fallback={null}>
        <InsertSongModal
          isOpen={isInsertModalOpen}
          onClose={() => setIsInsertModalOpen(false)}
          onInsertSong={insertSong}
          songs={catalogSongs}
          genres={catalogGenres}
        />
      </Suspense>

    </div>
  );
}

// Main App component that handles authentication
export default function App() {
  return (
    <VenueProvider>
      <AppInner />
    </VenueProvider>
  );
}

function AppInner() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    const authenticated = sessionStorage.getItem('dj_authenticated') === 'true';
    const username = sessionStorage.getItem('dj_username');
    const authKey = sessionStorage.getItem('dj_authKey');
    const accessToken = getAccessToken();

    if (authenticated && username && authKey && accessToken) {
      setIsAuthenticated(true);
    } else {
      sessionStorage.removeItem('dj_authenticated');
      sessionStorage.removeItem('dj_username');
      sessionStorage.removeItem('dj_authKey');
      clearTokens();
    }
    setIsCheckingAuth(false);
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    // Suspend the live session (preserves data for later resume)
    try {
      const sessionId = getLiveSessionId();
      if (sessionId) {
        await requestJson(`/live-sessions/${sessionId}/suspend`, { method: 'PATCH' });
      }
    } catch (error) {
      // Non-blocking: proceed with logout even if suspend fails
      console.error('Suspend session on logout failed', error);
    }
    sessionStorage.removeItem('dj_authenticated');
    sessionStorage.removeItem('dj_username');
    sessionStorage.removeItem('dj_authKey');
    clearTokens();
    setIsAuthenticated(false);
  };

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex items-center justify-center">
        <div className="text-purple-400 text-xl font-bold">Loading...</div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <DJLogin onLoginSuccess={handleLoginSuccess} />;
  }

  // Show the dashboard when authenticated
  return <DJDashboard onLogout={handleLogout} />;
}
