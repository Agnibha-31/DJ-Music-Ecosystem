import { useState, useCallback, memo, lazy, Suspense, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle } from 'lucide-react';
import { io } from 'socket.io-client';
import { useVenue } from './context/VenueContext';
import { VenueProvider } from './context/VenueContext';
import { Header } from './components/Header';
import { BackgroundAnimation } from './components/BackgroundAnimation';
import { FloatingMusicalNotes } from './components/FloatingMusicalNotes';
import { ParticleField } from './components/ParticleField';
import { MobileOptimizer } from './components/MobileOptimizer';
import { Footer } from './components/Footer';
import { PulsingRings } from './components/PulsingRings';
import { ensureGuestSession, getSocketUrl, requestJson } from './utils/apiClient';

// Lazy load heavy components
const SongQueue = lazy(() => import('./components/SongQueue'));
const SongRequestForm = lazy(() => import('./components/SongRequestForm'));

export interface Song {
  id: string;
  title: string;
  artist: string;
  genre: string;
  votes: number;
  timestamp: number;
}

const MemoizedBackgroundAnimation = memo(BackgroundAnimation);
const MemoizedFloatingMusicalNotes = memo(FloatingMusicalNotes);
const MemoizedParticleField = memo(ParticleField);
const MemoizedPulsingRings = memo(PulsingRings);
const MemoizedMobileOptimizer = memo(MobileOptimizer);
const MemoizedHeader = memo(Header);
const MemoizedFooter = memo(Footer);

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

export default function App() {
  return (
    <VenueProvider>
      <AppInner />
    </VenueProvider>
  );
}

function AppInner() {
  const { activeVenueId, activeVenue, liveSessionId, isLoadingActiveVenue } = useVenue();
  const hasVenueParam = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const venue = new URLSearchParams(window.location.search).get('venue');
    return Boolean(venue && String(venue).trim());
  }, []);
  const [queue, setQueue] = useState<Song[]>([]);
  const [systemMode, setSystemMode] = useState<any>({ isLive: false, isMaintenance: false, isOverrideEnabled: false });
  const [catalogSongs, setCatalogSongs] = useState<Array<{ id: string; title: string; artist: string; genre: string }>>([]);
  const [catalogGenres, setCatalogGenres] = useState<string[]>([]);

  const loadQueue = useCallback(async () => {
    if (!activeVenueId) return;
    const sessionParam = liveSessionId ? `&live_session_id=${liveSessionId}` : '';
    const data = await requestJson<{ items: any[] }>(`/queue?venue_id=${activeVenueId}${sessionParam}`);
    const pending = (data.items ?? []).filter((item) => item.status === 'pending');
    setQueue(normalizeQueue(pending.map(mapQueueItemToSong)));
  }, [activeVenueId, liveSessionId]);

  const toBool = (value: any) =>
    value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true';

  const normalizeSystemMode = (mode: any) => ({
    isLive: toBool(mode?.isLive),
    isMaintenance: toBool(mode?.isMaintenance),
    isOverrideEnabled: toBool(mode?.isOverrideEnabled)
  });

  const loadSystemMode = useCallback(async () => {
    try {
      const data = await requestJson<{ systemMode: any }>("/system-mode", {}, true);
      if (data.systemMode) {
        setSystemMode(normalizeSystemMode(data.systemMode));
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
      const data = await requestJson<{ items: any[] }>(`/songs/catalog?venue_id=${activeVenueId}`, {}, true);
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

  if (!hasVenueParam) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-900 via-indigo-900 to-pink-900" style={{ willChange: 'contents' }}>
        <MemoizedBackgroundAnimation />
        <MemoizedPulsingRings />
        <MemoizedFloatingMusicalNotes count={3} />
        <MemoizedParticleField />
        <MemoizedMobileOptimizer />
        <div className="relative z-10 min-h-screen flex items-center justify-center px-4 text-center">
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 max-w-md">
            <p className="text-white text-lg font-bold">Invalid QR link</p>
            <p className="text-purple-200 text-sm mt-2">Missing venue parameter.</p>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    let isMounted = true;
    const bootstrap = async () => {
      try {
        await ensureGuestSession();
        if (!isMounted) return;
        await Promise.all([loadQueue(), loadSystemMode(), loadCatalogSongs()]);
      } catch (error) {
        console.error('Queue bootstrap failed', error);
      }
    };

    if (activeVenueId) {
      setQueue([]);
      bootstrap();
    }

    return () => {
      isMounted = false;
    };
  }, [activeVenueId, loadQueue, loadSystemMode, loadCatalogSongs]);

  useEffect(() => {
    if (!activeVenueId) return undefined;
    const intervalId = window.setInterval(() => {
      loadCatalogSongs().catch((error) => console.error('Reload catalog songs failed', error));
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeVenueId, loadCatalogSongs]);

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
      if (queueItem?.songTitle || queueItem?.artist) {
        const key = songKey(String(queueItem.songTitle ?? ''), String(queueItem.artist ?? ''));
        setQueue((prev) => prev.filter((song) => songKey(song.title, song.artist) !== key));
      } else {
        setQueue((prev) => prev.filter((song) => song.id !== queueItemId));
      }
    });

    socket.on('dj.queue.rejected', ({ queueItemId, queueItem, venueId }) => {
      if (!queueItemId) return;
      if (activeVenueId && venueId && venueId !== activeVenueId) return;
      if (queueItem?.songTitle || queueItem?.artist) {
        const key = songKey(String(queueItem.songTitle ?? ''), String(queueItem.artist ?? ''));
        setQueue((prev) => prev.filter((song) => songKey(song.title, song.artist) !== key));
      } else {
        setQueue((prev) => prev.filter((song) => song.id !== queueItemId));
      }
    });

    socket.on('dj.queue.reverted', ({ queueItemId, queueItem, venueId }) => {
      if (!queueItemId) return;
      if (activeVenueId && venueId && venueId !== activeVenueId) return;
      if (queueItem?.status === 'pending') {
        const mapped = mapQueueItemToSong(queueItem);
        setQueue((prev) => normalizeQueue([mapped, ...prev]));
      } else {
        loadQueue().catch((error) => console.error('Reload queue failed', error));
      }
    });

    socket.on('queue.item.updated', ({ queueItemId, status, venueId }) => {
      if (!queueItemId) return;
      if (activeVenueId && venueId && venueId !== activeVenueId) return;
      if (status !== 'pending') {
        setQueue((prev) => prev.filter((song) => song.id !== queueItemId));
      }
    });

    socket.on('system.mode.updated', ({ systemMode: updatedMode }) => {
      if (updatedMode) {
        setSystemMode(normalizeSystemMode(updatedMode));
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

    return () => {
      socket.disconnect();
    };
  }, [activeVenueId, loadQueue, loadSystemMode, loadCatalogSongs]);

  const addSongToQueue = useCallback(async (song: Omit<Song, 'id' | 'timestamp' | 'votes'> & { songId?: string }) => {
    try {
      if (!activeVenueId) return;
      await ensureGuestSession();
      const created = await requestJson<any>("/queue/request", {
        method: "POST",
        body: JSON.stringify({ songId: song.songId ?? null, songTitle: song.title, artist: song.artist, genre: song.genre, venue_id: activeVenueId, live_session_id: liveSessionId ?? undefined })
      });
      setQueue((prev) => normalizeQueue([mapQueueItemToSong(created), ...prev]));
    } catch (error) {
      console.error('Request song failed', error);
    }
  }, [activeVenueId, systemMode, liveSessionId]);

  const removeSongFromQueue = useCallback((id: string) => {
    setQueue((prev) => prev.filter((song) => song.id !== id));
  }, []);

  const voteForSong = useCallback(async (id: string) => {
    try {
      if (!activeVenueId) return;
      const updated = await requestJson<any>("/queue/vote", {
        method: "PATCH",
        body: JSON.stringify({ queueItemId: id, venue_id: activeVenueId })
      });
      setQueue((prev) => normalizeQueue(prev.map((song) => (song.id === id ? { ...song, votes: Number(updated.votes ?? song.votes) } : song))));
    } catch (error) {
      console.error('Vote failed', error);
    }
  }, [activeVenueId, systemMode]);

  const showSystemOverlay = !systemMode.isLive || systemMode.isMaintenance || (!liveSessionId && !isLoadingActiveVenue);
  const systemOverlay = showSystemOverlay && typeof document !== 'undefined'
    ? createPortal(
      <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 2147483647 }}>
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
        <div className="relative w-[90%] max-w-lg bg-gradient-to-br from-[#3b2a7a]/95 to-[#7a2457]/95 border border-[#c4a5ff]/40 rounded-2xl shadow-2xl px-4 py-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <AlertCircle className="w-9 h-9 flex-shrink-0" style={{ color: '#fe5353' }} />
            <p className="text-base md:text-lg font-black" style={{ color: '#fe5353' }}>
              {systemMode.isMaintenance
                ? 'System under maintanance, see you later !'
                : 'System is not live yet !'}
            </p>
          </div>
          <p className="text-sm md:text-base font-bold text-white">Please check back soon.</p>
        </div>
      </div>,
      document.body
    )
    : null;

  return (
    <>
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-900 via-indigo-900 to-pink-900" style={{ willChange: 'contents' }}>
        <MemoizedBackgroundAnimation />
        <MemoizedPulsingRings />
        <MemoizedFloatingMusicalNotes count={3} />
        <MemoizedParticleField />
        <MemoizedMobileOptimizer />

        <div className="relative z-10 app-shell">
          <MemoizedHeader venue={activeVenue ?? { name: 'Loading...' }} systemMode={systemMode} />

          <main className={`container mx-auto px-2 ${showSystemOverlay ? 'pt-14 md:pt-24 pb-2' : 'py-2'} md:px-4 md:py-8 lg:py-12`}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-14 lg:gap-24 max-w-7xl mx-auto desktop-main-grid">
              <Suspense fallback={<div className="animate-pulse bg-white/10 rounded-xl h-96" />}>
                <SongRequestForm onAddSong={addSongToQueue} systemMode={systemMode} songs={catalogSongs} genres={catalogGenres} />
              </Suspense>
              <Suspense fallback={<div className="animate-pulse bg-white/10 rounded-xl h-96" />}>
                <SongQueue queue={queue} onRemoveSong={removeSongFromQueue} onVote={voteForSong} systemMode={systemMode} />
              </Suspense>
            </div>
          </main>

          <MemoizedFooter />
        </div>
      </div>
      {systemOverlay}
    </>
  );
}
