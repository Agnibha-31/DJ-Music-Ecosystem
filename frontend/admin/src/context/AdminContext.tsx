import { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';
import { ensureAdminSession, getAccessToken, getSocketUrl, requestJson } from '../utils/apiClient';
import { VenueProvider, useVenue } from './VenueContext';
import { venueApiClient } from '../utils/venueApiClient';

// ==================== TYPES ====================
export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: string;
  genre: string;
  language?: string;
  explicit: boolean;
  addedDate: number;
  status: 'active' | 'disabled' | 'blocked';
  playCount: number;
  voteCount: number;
}

export interface Poll {
  id: string;
  title: string;
  songs: string[];
  status: 'active' | 'closed';
  totalVotes: number;
  createdAt: number;
  closedAt?: number;
  votes: Record<string, number>;
}

export interface QueueItem {
  id: string;
  songId: string;
  songTitle: string;
  artist: string;
  genre: string;
  votes: number;
  requestedBy: string;
  timestamp: number;
  status: 'pending' | 'accepted' | 'rejected' | 'playing' | 'played' | 'forced';
  priority: 'normal' | 'high' | 'override';
}

export interface VenueConfig {
  id?: string;
  name: string;
  logo?: string;
  accentColor: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
}

export interface SystemMode {
  isLive: boolean;
  isMaintenance: boolean;
  isOverrideEnabled: boolean;
}

export interface ActivityLog {
  id: string;
  type: 'song_added' | 'song_deleted' | 'poll_created' | 'song_played' | 'admin_action' | 'import' | 'override';
  description: string;
  timestamp: number;
  user: string;
  metadata?: any;
}

export interface UserActivity {
  userId: string;
  username: string;
  requestCount: number;
  voteCount: number;
  lastActive: number;
  isActive: boolean;
  flaggedForSpam: boolean;
}

export interface VenueInfo extends VenueConfig {
  id: string;
}

export interface DJInfo {
  id: string;
  name: string;
  username: string;
  phone: string;
  email: string;
  bio: string;
  authKey?: string;
  authenticated: boolean;
}

export interface DJAccessRequest {
  id: string;
  djId: string;
  djName: string;
  djUsername: string;
  status: 'pending' | 'approved' | 'denied';
  requestedAt: string;
  approvedAt?: string;
  deniedAt?: string;
}

export interface LiveSession {
  id: string;
  djId: string;
  venueId: string;
  status: 'active' | 'suspended' | 'ended';
  startedAt: string;
  endedAt?: string;
  djName?: string;
  venueName?: string;
}

export interface SystemConfig {
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  autoAcceptRequests: boolean;
  maxRequestsPerUser: number;
  maxVotesPerUser: number;
  requestCooldown: number;
  backupEnabled: boolean;
  backupFrequency: string;
  waitTimeMinutes?: number;
}

// ==================== CONTEXT ====================
interface AdminContextType {
  venue: VenueConfig;
  updateVenue: (config: Partial<VenueConfig>) => void;
  venues: VenueInfo[];
  addVenue: (venue: VenueConfig) => void;
  deleteVenue: (venueId: string) => void;

  systemMode: SystemMode;
  toggleLiveMode: () => void;
  toggleMaintenance: () => void;
  toggleOverride: () => void;
  systemConfig: SystemConfig;
  updateSystemConfig: (updates: Partial<SystemConfig>) => void;
  downloadBackup: () => void;

  songs: Song[];
  addSong: (song: Omit<Song, 'id' | 'addedDate' | 'playCount' | 'voteCount'>) => void;
  updateSong: (id: string, updates: Partial<Song>) => void;
  deleteSong: (id: string) => void;
  bulkImportSongs: (songs: Omit<Song, 'id' | 'addedDate' | 'playCount' | 'voteCount'>[]) => void;
  bulkUpdateSongStatus: (ids: string[], status: Song['status']) => void;
  saveVenueSongSelection: (selection: { genre: string; songs: Array<{ title: string; artist: string }> }) => void;

  polls: Poll[];
  createPoll: (title: string, songIds: string[]) => void;
  closePoll: (id: string) => void;
  votePoll: (pollId: string, songId: string) => void;

  queue: QueueItem[];
  addToQueue: (item: Omit<QueueItem, 'id' | 'timestamp'>) => void;
  updateQueueItemStatus: (id: string, status: QueueItem['status']) => void;
  updateQueuePriority: (id: string, priority: QueueItem['priority']) => void;
  forcePlaySong: (songId: string) => void;
  blockSong: (songId: string) => void;
  clearQueue: () => void;

  activityLogs: ActivityLog[];
  addLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  removeActivityLog: (id: string) => void;

  activeUsers: UserActivity[];
  flagUserForSpam: (userId: string) => void;
  unflagUserForSpam: (userId: string) => void;

  djs: DJInfo[];
  addDj: (dj: Omit<DJInfo, 'id' | 'authKey' | 'authenticated'>) => void;
  deleteDj: (djId: string) => void;
  updateDjAuthKey: (djId: string, authKey: string) => void;
  authenticateDj: (djId: string, authKey?: string) => void;

  djAccessRequests: DJAccessRequest[];
  approveDjAccess: (requestId: string, venueId: string) => void;
  denyDjAccess: (requestId: string) => void;

  liveSessions: LiveSession[];
  endSession: (sessionId: string) => void;

  analytics: {
    totalSongs: number;
    activeSongs: number;
    totalPlays: number;
    totalVotes: number;
    totalPolls: number;
    activePolls: number;
    activeRequests: number;
    activeUsers: number;
  };
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const toTimestamp = (value?: string | number | null) => {
  if (typeof value === 'number') return value;
  if (!value) return Date.now();
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Date.now() : parsed;
};

const mapSongStatusFromApi = (status?: string): Song['status'] => {
  if (status === 'disabled' || status === 'blocked') return status;
  return 'active';
};

const mapSongStatusToApi = (status: Song['status']) => (status === 'active' ? 'enabled' : status);

const mapPollStatusFromApi = (status?: string): Poll['status'] => (status === 'closed' ? 'closed' : 'active');

const mapQueuePriorityFromApi = (priority?: number): QueueItem['priority'] => {
  if (priority === 2) return 'override';
  if (priority === 1) return 'high';
  return 'normal';
};

const mapQueuePriorityToApi = (priority: QueueItem['priority']) => {
  if (priority === 'override') return 2;
  if (priority === 'high') return 1;
  return 0;
};

const mapQueueStatusFromApi = (status?: string): QueueItem['status'] => {
  if (status === 'accepted' || status === 'rejected' || status === 'playing' || status === 'played' || status === 'pending') {
    return status;
  }
  return 'pending';
};

const mapSongFromApi = (song: any): Song => ({
  id: String(song.id ?? ''),
  title: String(song.title ?? ''),
  artist: String(song.artist ?? ''),
  album: song.album ?? '',
  duration: song.duration != null ? String(song.duration) : '',
  genre: String(song.genre ?? ''),
  language: song.language ?? '',
  explicit: Boolean(song.explicit ?? false),
  addedDate: toTimestamp(song.addedDate ?? song.created_at),
  status: mapSongStatusFromApi(song.status),
  playCount: Number(song.playCount ?? 0),
  voteCount: Number(song.voteCount ?? 0)
});

const mapPollFromApi = (poll: any): Poll => ({
  id: String(poll.id ?? ''),
  title: String(poll.title ?? ''),
  songs: Array.isArray(poll.songs) ? poll.songs.map(String) : [],
  status: mapPollStatusFromApi(poll.status),
  totalVotes: Number(poll.totalVotes ?? 0),
  createdAt: toTimestamp(poll.created_at ?? poll.createdAt),
  closedAt: poll.closedAt ? toTimestamp(poll.closedAt) : undefined,
  votes: poll.votes ?? {}
});

const mapQueueItemFromApi = (item: any): QueueItem => ({
  id: String(item.id ?? ''),
  songId: String(item.songId ?? ''),
  songTitle: String(item.songTitle ?? item.title ?? ''),
  artist: String(item.artist ?? ''),
  genre: String(item.genre ?? ''),
  votes: Number(item.votes ?? 0),
  requestedBy: String(item.requestedBy ?? 'anonymous'),
  timestamp: toTimestamp(item.timestamp ?? item.created_at),
  status: mapQueueStatusFromApi(item.status),
  priority: mapQueuePriorityFromApi(Number(item.priority ?? 0))
});

const mapActivityLogFromApi = (log: any): ActivityLog => ({
  id: String(log.id ?? ''),
  type: (log.type ?? 'admin_action') as ActivityLog['type'],
  description: String(log.description ?? ''),
  timestamp: toTimestamp(log.timestamp ?? log.created_at),
  user: String(log.user ?? 'system'),
  metadata: log.metadata ?? {}
});

const mapUserActivityFromApi = (user: any): UserActivity => ({
  userId: String(user.id ?? user.userId ?? ''),
  username: String(user.username ?? user.displayName ?? 'User'),
  requestCount: Number(user.requestCount ?? 0),
  voteCount: Number(user.voteCount ?? 0),
  lastActive: toTimestamp(user.lastActive ?? user.updated_at),
  isActive: Boolean(user.isActive ?? true),
  flaggedForSpam: Boolean(user.flaggedForSpam ?? false)
});

const mapVenueFromApi = (venue: any): VenueInfo => ({
  id: String(venue.id ?? ''),
  name: String(venue.name ?? ''),
  logo: venue.logo ?? '',
  accentColor: venue.accentColor ?? '#a855f7',
  address: venue.address ?? '',
  city: venue.city ?? '',
  state: venue.state ?? '',
  zipCode: venue.zipCode ?? '',
  phone: venue.phone ?? '',
  email: venue.email ?? ''
});

const mapDjFromApi = (dj: any): DJInfo => ({
  id: String(dj.id ?? ''),
  name: String(dj.name ?? ''),
  username: String(dj.username ?? ''),
  phone: dj.phone ?? '',
  email: dj.email ?? '',
  bio: dj.bio ?? '',
  authKey: dj.authKey ?? '',
  authenticated: Boolean(dj.authenticated)
});

const mapDjAccessRequestFromApi = (req: any): DJAccessRequest => ({
  id: String(req.id ?? ''),
  djId: String(req.djId ?? ''),
  djName: String(req.djName ?? ''),
  djUsername: String(req.djUsername ?? ''),
  status: req.status ?? 'pending',
  requestedAt: String(req.requestedAt ?? req.created_at ?? ''),
  approvedAt: req.approvedAt ?? undefined,
  deniedAt: req.deniedAt ?? undefined
});

const mapLiveSessionFromApi = (session: any): LiveSession => ({
  id: String(session.id ?? ''),
  djId: String(session.djId ?? ''),
  venueId: String(session.venueId ?? ''),
  status: session.status ?? 'active',
  startedAt: String(session.startedAt ?? session.created_at ?? ''),
  endedAt: session.endedAt ?? undefined,
  djName: session.djName,
  venueName: session.venueName
});

const mapSystemConfigFromApi = (config: any): SystemConfig => ({
  notificationsEnabled: Boolean(config?.notificationsEnabled ?? false),
  emailNotifications: Boolean(config?.emailNotifications ?? false),
  pushNotifications: Boolean(config?.pushNotifications ?? false),
  autoAcceptRequests: Boolean(config?.autoAcceptRequests ?? false),
  maxRequestsPerUser: Number(config?.maxRequestsPerUser ?? 0),
  maxVotesPerUser: Number(config?.maxVotesPerUser ?? 0),
  requestCooldown: Number(config?.requestCooldown ?? 0),
  backupEnabled: Boolean(config?.backupEnabled ?? false),
  backupFrequency: String(config?.backupFrequency ?? 'daily'),
  waitTimeMinutes: config?.waitTimeMinutes != null ? Number(config.waitTimeMinutes) : undefined
});

// ==================== PROVIDER ====================
export function AdminProvider({ children }: { children: ReactNode }) {
  return (
    <VenueProvider>
      <AdminProviderInner>{children}</AdminProviderInner>
    </VenueProvider>
  );
}

function AdminProviderInner({ children }: { children: ReactNode }) {
  const { activeVenueId } = useVenue();
  const [venue, setVenue] = useState<VenueConfig>({
    name: '',
    accentColor: '#a855f7',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    email: ''
  });

  const [venues, setVenues] = useState<VenueInfo[]>([]);
  const [djs, setDjs] = useState<DJInfo[]>([]);
  const [djAccessRequests, setDjAccessRequests] = useState<DJAccessRequest[]>([]);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    notificationsEnabled: false,
    emailNotifications: false,
    pushNotifications: false,
    autoAcceptRequests: false,
    maxRequestsPerUser: 0,
    maxVotesPerUser: 0,
    requestCooldown: 0,
    backupEnabled: false,
    backupFrequency: 'daily'
  });

  const [systemMode, setSystemMode] = useState<SystemMode>({
    isLive: false,
    isMaintenance: false,
    isOverrideEnabled: false
  });

  const [songs, setSongs] = useState<Song[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [activeUsers, setActiveUsers] = useState<UserActivity[]>([]);
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const activeVenueRef = useRef<string | null>(null);

  useEffect(() => {
    activeVenueRef.current = activeVenueId ?? null;
  }, [activeVenueId]);

  const loadSongs = async () => {
    if (!activeVenueId) return;
    try {
      const loaded = await venueApiClient.loadSongsByVenue(activeVenueId);
      setSongs(loaded);
    } catch (error) {
      console.error('Load songs failed', error);
    }
  };

  const loadPolls = async () => {
    if (!getAccessToken()) return;
    const url = activeVenueId ? `/polls?venue_id=${activeVenueId}` : '/polls';
    console.log('[AdminContext] loadPolls called:', { url, activeVenueId });
    const data = await requestJson<{ items: any[] }>(url);
    console.log('[AdminContext] loadPolls response:', { pollCount: data.items?.length ?? 0, polls: data.items });
    setPolls((data.items ?? []).map(mapPollFromApi));
  };

  const loadQueue = async () => {
    if (!activeVenueId) return;
    const data = await requestJson<{ items: any[] }>(`/queue?venue_id=${activeVenueId}`);
    setQueue((data.items ?? []).map(mapQueueItemFromApi));
  };

  const loadActivityLogs = async () => {
    const data = await requestJson<{ items: any[] }>("/activity-logs");
    setActivityLogs((data.items ?? []).map(mapActivityLogFromApi));
  };

  const loadUsers = async () => {
    const data = await requestJson<{ items: any[] }>("/users/activity");
    setActiveUsers((data.items ?? []).map(mapUserActivityFromApi));
  };

  const loadVenue = async () => {
    const data = await requestJson<{ venue: any }>("/venue");
    if (data.venue) {
      setVenue({
        id: data.venue.id ?? undefined,
        name: data.venue.name ?? '',
        logo: data.venue.logo ?? '',
        accentColor: data.venue.accentColor ?? '#a855f7',
        address: data.venue.address ?? '',
        city: data.venue.city ?? '',
        state: data.venue.state ?? '',
        zipCode: data.venue.zipCode ?? '',
        phone: data.venue.phone ?? '',
        email: data.venue.email ?? ''
      });
    }
  };

  const loadVenues = async () => {
    const data = await requestJson<{ items: any[] }>("/venues");
    const mappedVenues = (data.items ?? []).map(mapVenueFromApi);
    // Deduplicate venues by ID and by name+address combination
    const uniqueVenues = Array.from(
      mappedVenues.reduce((map, venue) => {
        const key = `${venue.name}::${venue.address}`;
        if (!map.has(key) && !map.has(venue.id)) {
          map.set(key, venue);
        }
        return map;
      }, new Map<string, VenueInfo>()).values()
    );
    setVenues(uniqueVenues);
  };

  const loadDjs = async () => {
    const data = await requestJson<{ items: any[] }>("/djs");
    setDjs((data.items ?? []).map(mapDjFromApi));
  };

  const loadDjAccessRequests = async () => {
    const data = await requestJson<{ items: any[] }>("/dj-access-requests");
    setDjAccessRequests((data.items ?? []).map(mapDjAccessRequestFromApi));
  };

  const loadLiveSessions = async () => {
    try {
      const data = await requestJson<{ items: any[] }>("/live-sessions");
      const items: LiveSession[] = (data.items ?? []).map((s: any) => ({
        id: String(s.id ?? ''),
        djId: String(s.djId ?? ''),
        venueId: String(s.venueId ?? ''),
        status: (s.status === 'active' || s.status === 'suspended') ? s.status : 'ended' as const,
        startedAt: String(s.created_at ?? s.startedAt ?? ''),
        endedAt: s.endedAt ?? undefined,
        djName: String(s.djName ?? s.djId ?? ''),
        venueName: String(s.venueName ?? s.venueId ?? ''),
      }));
      setLiveSessions(items);
    } catch (error) {
      console.error('Load live sessions failed', error);
    }
  };

  const loadSystemConfig = async () => {
    const data = await requestJson<{ config: any }>("/system-config");
    setSystemConfig(mapSystemConfigFromApi(data.config ?? {}));
  };

  const loadSystemMode = async () => {
    const data = await requestJson<{ systemMode: any }>("/system-mode");
    if (data.systemMode) {
      setSystemMode({
        isLive: Boolean(data.systemMode.isLive),
        isMaintenance: Boolean(data.systemMode.isMaintenance),
        isOverrideEnabled: Boolean(data.systemMode.isOverrideEnabled)
      });
    }
  };

  useEffect(() => {
    if (!getAccessToken()) {
      return;
    }
    if (!activeVenueId) {
      setSongs([]);
      setQueue([]);
      // Still load polls even without venue - admin should see all polls
      loadPolls().catch((error) => console.error('Load polls on venue change failed', error));
      return;
    }
    loadSongs().catch((error) => console.error('Load songs on venue change failed', error));
    loadPolls().catch((error) => console.error('Load polls on venue change failed', error));
    loadQueue().catch((error) => console.error('Load queue on venue change failed', error));
  }, [activeVenueId]);



  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      if (!getAccessToken()) {
        return;
      }
      try {
        await ensureAdminSession();
        if (!isMounted) return;

        await Promise.all([
          activeVenueId ? loadSongs() : Promise.resolve(),
          loadPolls(), // Always load polls for admin - shows all venues if no venue selected
          activeVenueId ? loadQueue() : Promise.resolve(),
          loadActivityLogs(),
          loadUsers(),
          loadVenue(),
          loadVenues(),
          loadDjAccessRequests(),
          loadDjs(),
          loadSystemConfig(),
          loadSystemMode(),
          loadLiveSessions()
        ]);
      } catch (error) {
        console.error('Admin bootstrap failed', error);
      }
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const socket = io(getSocketUrl(), { transports: ['websocket'] });
    socketRef.current = socket;
    socket.emit('join_admin');

    socket.on('queue.request.created', ({ queueItem, venueId }) => {
      if (!queueItem) return;
      if (activeVenueRef.current && venueId && venueId !== activeVenueRef.current) return;
      const mapped = mapQueueItemFromApi(queueItem);
      setQueue((prev) => (prev.some((item) => item.id === mapped.id) ? prev : [mapped, ...prev]));
    });

    socket.on('queue.vote.updated', ({ queueItemId, votes, venueId }) => {
      if (!queueItemId) return;
      if (activeVenueRef.current && venueId && venueId !== activeVenueRef.current) return;
      setQueue((prev) => prev.map((item) => (item.id === queueItemId ? { ...item, votes: Number(votes ?? item.votes) } : item)));
    });

    socket.on('dj.queue.accepted', ({ queueItemId, status, venueId }) => {
      if (!queueItemId) return;
      if (activeVenueRef.current && venueId && venueId !== activeVenueRef.current) return;
      setQueue((prev) => prev.map((item) => (item.id === queueItemId ? { ...item, status: mapQueueStatusFromApi(status) } : item)));
    });

    socket.on('dj.queue.rejected', ({ queueItemId, status, venueId }) => {
      if (!queueItemId) return;
      if (activeVenueRef.current && venueId && venueId !== activeVenueRef.current) return;
      setQueue((prev) => prev.map((item) => (item.id === queueItemId ? { ...item, status: mapQueueStatusFromApi(status) } : item)));
    });

    socket.on('dj.queue.reverted', ({ queueItemId, status, venueId }) => {
      if (!queueItemId) return;
      if (activeVenueRef.current && venueId && venueId !== activeVenueRef.current) return;
      setQueue((prev) => prev.map((item) => (item.id === queueItemId ? { ...item, status: mapQueueStatusFromApi(status) } : item)));
    });

    socket.on('queue.item.updated', ({ queueItemId, status, venueId }) => {
      if (!queueItemId) return;
      if (activeVenueRef.current && venueId && venueId !== activeVenueRef.current) return;
      setQueue((prev) => prev.map((item) => (item.id === queueItemId ? { ...item, status: mapQueueStatusFromApi(status) } : item)));
    });

    socket.on('admin.queue.priority.updated', ({ queueItemId, priority, status, venueId }) => {
      if (!queueItemId) return;
      if (activeVenueRef.current && venueId && venueId !== activeVenueRef.current) return;
      setQueue((prev) => prev.map((item) => (item.id === queueItemId
        ? { ...item, priority: mapQueuePriorityFromApi(Number(priority)), status: mapQueueStatusFromApi(status) }
        : item
      )));
    });

    socket.on('admin.queue.cleared', ({ venueId }) => {
      if (activeVenueRef.current && venueId && venueId !== activeVenueRef.current) return;
      setQueue([]);
    });

    socket.on('admin.system_mode.updated', ({ systemMode: updated }) => {
      if (!updated) return;
      setSystemMode({
        isLive: Boolean(updated.isLive),
        isMaintenance: Boolean(updated.isMaintenance),
        isOverrideEnabled: Boolean(updated.isOverrideEnabled)
      });
    });

    socket.on('admin.settings.updated', ({ systemConfig: updatedConfig, settings }) => {
      setSystemConfig((prev) => {
        const base = updatedConfig ? mapSystemConfigFromApi(updatedConfig) : prev;
        if (settings?.waitTimeMinutes != null) {
          return { ...base, waitTimeMinutes: Number(settings.waitTimeMinutes) };
        }
        return base;
      });
    });

    socket.on('admin.song.catalog.updated', () => {
      loadSongs().catch((error) => console.error('Reload songs failed', error));
    });

    socket.on('venue.songs.updated', ({ venueId }) => {
      if (activeVenueRef.current && venueId === activeVenueRef.current) {
        loadSongs().catch((error) => console.error('Reload songs for venue failed', error));
      }
    });

    socket.on('polls.updated', ({ venueId }) => {
      console.log('[AdminContext] polls.updated event received:', { venueId, activeVenue: activeVenueRef.current });
      // Only skip reload if venueId is for a different venue than currently selected
      if (activeVenueRef.current && venueId && venueId !== activeVenueRef.current) {
        console.log('[AdminContext] Skipping poll reload - different venue');
        return;
      }
      console.log('[AdminContext] Reloading polls...');
      loadPolls().catch((error) => console.error('Reload polls failed', error));
    });

    socket.on('activity_logs.updated', ({ log }) => {
      if (!log) return;
      const mapped = mapActivityLogFromApi(log);
      setActivityLogs((prev) => (prev.some((item) => item.id === mapped.id) ? prev : [mapped, ...prev]));
    });

    socket.on('venue.created', ({ venue: createdVenue }) => {
      if (!createdVenue) return;
      const newVenue = mapVenueFromApi(createdVenue);
      setVenues((prev) => {
        const isDuplicate = prev.some((v) => v.id === newVenue.id || (v.name === newVenue.name && v.address === newVenue.address));
        return isDuplicate ? prev : [...prev, newVenue];
      });
    });

    socket.on('venue.updated', ({ venue: updatedVenue }) => {
      if (!updatedVenue) return;
      setVenues((prev) => prev.map((item) => (item.id === updatedVenue.id ? mapVenueFromApi(updatedVenue) : item)));
    });

    socket.on('venue.active.updated', () => {
      loadVenue().catch((error) => console.error('Reload active venue failed', error));
    });

    socket.on('venue.deleted', ({ venueId }) => {
      if (!venueId) return;
      setVenues((prev) => prev.filter((item) => item.id !== venueId));
    });

    socket.on('dj.access.requested', ({ request }) => {
      if (!request) return;
      const mapped = mapDjAccessRequestFromApi(request);
      setDjAccessRequests((prev) => (prev.some((item) => item.id === mapped.id) ? prev : [mapped, ...prev]));
    });

    socket.on('live_session.started', ({ live_session }) => {
      if (!live_session) return;
      const mapped = mapLiveSessionFromApi(live_session);
      setLiveSessions((prev) => {
        const userId = mapped.djId;
        // Remove any existing active/suspended session for this user first to avoid duplicates if any
        // But actually we might want to just prepend.
        // A single DJ can have multiple sessions in history, but only one active.
        // Let's just prepend and let the filter handle unique active ones if needed.
        // But cleaner to replace if id exists.
        return prev.some(s => s.id === mapped.id) ? prev.map(s => s.id === mapped.id ? mapped : s) : [mapped, ...prev];
      });
    });

    socket.on('live_session.suspended', ({ live_session }) => {
      if (!live_session) return;
      const mapped = mapLiveSessionFromApi(live_session);
      setLiveSessions((prev) => prev.map((item) => (item.id === mapped.id ? mapped : item)));
    });

    socket.on('live_session.ended', ({ live_session }) => {
      if (!live_session) return;
      const mapped = mapLiveSessionFromApi(live_session);
      setLiveSessions((prev) => prev.map((item) => (item.id === mapped.id ? mapped : item)));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // ==================== FUNCTIONS ====================
  const updateVenue = async (config: Partial<VenueConfig>) => {
    try {
      await ensureAdminSession();
      const venueId = config.id ?? venue.id;
      if (!venueId) {
        console.error('Missing venue id for update');
        return;
      }
      const updated = await requestJson<any>(`/venues/${venueId}`, {
        method: "PATCH",
        body: JSON.stringify(config)
      });
      setVenue({
        id: updated.id ?? venue.id,
        name: updated.name ?? venue.name,
        logo: updated.logo ?? venue.logo,
        accentColor: updated.accentColor ?? venue.accentColor,
        address: updated.address ?? venue.address,
        city: updated.city ?? venue.city,
        state: updated.state ?? venue.state,
        zipCode: updated.zipCode ?? venue.zipCode,
        phone: updated.phone ?? venue.phone,
        email: updated.email ?? venue.email
      });
      setVenues((prev) => prev.map((item) => (item.id === updated.id ? mapVenueFromApi(updated) : item)));
      addLog({
        type: 'admin_action',
        description: 'Venue configuration updated',
        user: 'Admin'
      });
    } catch (error) {
      console.error('Update venue failed', error);
    }
  };

  const toggleLiveMode = async () => {
    try {
      await ensureAdminSession();
      const updated = await requestJson<any>("/system-mode", {
        method: "PATCH",
        body: JSON.stringify({ isLive: !systemMode.isLive })
      });
      setSystemMode({
        isLive: Boolean(updated.isLive),
        isMaintenance: Boolean(updated.isMaintenance),
        isOverrideEnabled: Boolean(updated.isOverrideEnabled)
      });
    } catch (error) {
      console.error('Toggle live mode failed', error);
    }
  };

  const toggleMaintenance = async () => {
    try {
      await ensureAdminSession();
      const updated = await requestJson<any>("/system-mode", {
        method: "PATCH",
        body: JSON.stringify({ isMaintenance: !systemMode.isMaintenance })
      });
      setSystemMode({
        isLive: Boolean(updated.isLive),
        isMaintenance: Boolean(updated.isMaintenance),
        isOverrideEnabled: Boolean(updated.isOverrideEnabled)
      });
    } catch (error) {
      console.error('Toggle maintenance failed', error);
    }
  };

  const toggleOverride = async () => {
    try {
      await ensureAdminSession();
      const updated = await requestJson<any>("/system-mode", {
        method: "PATCH",
        body: JSON.stringify({ isOverrideEnabled: !systemMode.isOverrideEnabled })
      });
      setSystemMode({
        isLive: Boolean(updated.isLive),
        isMaintenance: Boolean(updated.isMaintenance),
        isOverrideEnabled: Boolean(updated.isOverrideEnabled)
      });
    } catch (error) {
      console.error('Toggle override failed', error);
    }
  };

  const updateSystemConfig = async (updates: Partial<SystemConfig>) => {
    try {
      await ensureAdminSession();
      const updated = await requestJson<any>("/system-config", {
        method: "PATCH",
        body: JSON.stringify(updates)
      });
      setSystemConfig(mapSystemConfigFromApi(updated));
    } catch (error) {
      console.error('Update system config failed', error);
    }
  };

  const addVenue = async (venuePayload: VenueConfig) => {
    try {
      await ensureAdminSession();
      const created = await requestJson<any>("/venues", {
        method: "POST",
        body: JSON.stringify(venuePayload)
      });
      const newVenue = mapVenueFromApi(created);
      setVenues((prev) => {
        const isDuplicate = prev.some((v) => v.id === newVenue.id || (v.name === newVenue.name && v.address === newVenue.address));
        return isDuplicate ? prev : [...prev, newVenue];
      });
    } catch (error) {
      console.error('Add venue failed', error);
    }
  };

  const deleteVenue = async (venueId: string) => {
    try {
      await ensureAdminSession();
      await requestJson(`/venues/${venueId}`, { method: "DELETE" });
      setVenues((prev) => prev.filter((item) => item.id !== venueId));
      if (venue.id === venueId) {
        await loadVenue();
      }
    } catch (error) {
      console.error('Delete venue failed', error);
    }
  };

  const addDj = async (djPayload: Omit<DJInfo, 'id' | 'authKey' | 'authenticated'>) => {
    try {
      await ensureAdminSession();
      const created = await requestJson<any>("/djs", {
        method: "POST",
        body: JSON.stringify(djPayload)
      });
      setDjs((prev) => [...prev, mapDjFromApi(created)]);
    } catch (error) {
      console.error('Add DJ failed', error);
    }
  };

  const deleteDj = async (djId: string) => {
    try {
      await ensureAdminSession();
      await requestJson(`/djs/${djId}`, { method: "DELETE" });
      setDjs((prev) => prev.filter((dj) => dj.id !== djId));
    } catch (error) {
      console.error('Delete DJ failed', error);
    }
  };

  const updateDjAuthKey = async (djId: string, authKey: string) => {
    try {
      await ensureAdminSession();
      const updated = await requestJson<any>(`/djs/${djId}/auth-key`, {
        method: "PATCH",
        body: JSON.stringify({ authKey })
      });
      setDjs((prev) => prev.map((dj) => (dj.id === djId ? mapDjFromApi(updated) : dj)));
    } catch (error) {
      console.error('Update DJ auth key failed', error);
    }
  };

  const authenticateDj = async (djId: string, authKey?: string) => {
    try {
      await ensureAdminSession();
      const body = authKey ? { authKey } : undefined;
      const updated = await requestJson<any>(`/djs/${djId}/authenticate`, {
        method: "PATCH",
        body: body ? JSON.stringify(body) : undefined
      });
      setDjs((prev) => prev.map((dj) => (dj.id === djId ? mapDjFromApi(updated) : dj)));
    } catch (error) {
      console.error('Authenticate DJ failed', error);
    }
  };

  const approveDjAccess = async (requestId: string, venueId: string) => {
    try {
      await ensureAdminSession();
      const result = await requestJson<any>(`/dj-access-requests/${requestId}/approve`, {
        method: "PATCH",
        body: JSON.stringify({ venueId, venue_id: venueId })
      });
      const updatedRequest = mapDjAccessRequestFromApi(result?.request ?? result);
      setDjAccessRequests((prev) => prev.map((req) => (req.id === requestId ? updatedRequest : req)));
      await loadDjAccessRequests();
      // Reload DJs to update authenticated status
      await loadDjs();
    } catch (error) {
      console.error('Approve DJ access failed', error);
      throw error;
    }
  };

  const denyDjAccess = async (requestId: string) => {
    try {
      await ensureAdminSession();
      const result = await requestJson<any>(`/dj-access-requests/${requestId}/deny`, {
        method: "PATCH",
        body: JSON.stringify({})
      });
      const updatedRequest = mapDjAccessRequestFromApi(result?.request ?? result);
      setDjAccessRequests((prev) => prev.map((req) => (req.id === requestId ? updatedRequest : req)));
      await loadDjAccessRequests();
    } catch (error) {
      console.error('Deny DJ access failed', error);
    }
  };

  const downloadBackup = async () => {
    try {
      await ensureAdminSession();
      const data = await requestJson<{ backup: any }>("/backup/download");
      const payload = JSON.stringify(data.backup ?? {}, null, 2);
      const blob = new Blob([payload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download backup failed', error);
    }
  };

  const addSong = async (song: Omit<Song, 'id' | 'addedDate' | 'playCount' | 'voteCount'>) => {
    try {
      if (!activeVenueId) {
        console.error('No active venue selected');
        return;
      }
      await ensureAdminSession();
      const created = await venueApiClient.addSongToVenue(activeVenueId, song);
      setSongs((prev) => [created, ...prev]);
      addLog({
        type: 'song_added',
        description: `Song "${song.title}" by ${song.artist} added`,
        user: 'Admin'
      });
    } catch (error) {
      console.error('Add song failed', error);
    }
  };

  const updateSong = async (id: string, updates: Partial<Song>) => {
    try {
      if (!activeVenueId) {
        console.error('No active venue selected');
        return;
      }
      await ensureAdminSession();
      const updated = await venueApiClient.updateSongInVenue(id, updates);
      setSongs((prev) => prev.map((song) => (song.id === id ? updated : song)));
    } catch (error) {
      console.error('Update song failed', error);
    }
  };

  const deleteSong = async (id: string) => {
    try {
      if (!activeVenueId) {
        console.error('No active venue selected');
        return;
      }
      await ensureAdminSession();
      await venueApiClient.deleteSongFromVenue(id);
      setSongs((prev) => prev.filter((song) => song.id !== id));
      addLog({
        type: 'song_deleted',
        description: `Song deleted`,
        user: 'Admin'
      });
    } catch (error) {
      console.error('Delete song failed', error);
    }
  };

  const bulkImportSongs = async (importedSongs: Omit<Song, 'id' | 'addedDate' | 'playCount' | 'voteCount'>[]) => {
    try {
      if (!activeVenueId) {
        console.error('No active venue selected');
        return;
      }
      await ensureAdminSession();
      const created = await venueApiClient.bulkImportSongsToVenue(activeVenueId, importedSongs);
      setSongs((prev) => [...created, ...prev]);
      addLog({
        type: 'import',
        description: `Bulk imported ${importedSongs.length} songs`,
        user: 'Admin'
      });
    } catch (error) {
      console.error('Bulk import failed', error);
    }
  };

  const saveVenueSongSelection = async (selection: { genre: string; songs: Array<{ title: string; artist: string }> }) => {
    try {
      if (!activeVenueId) {
        console.error('No active venue selected');
        return;
      }
      if (!selection.genre || selection.songs.length === 0) {
        return;
      }
      await ensureAdminSession();
      await requestJson<{ ok: boolean }>("/songs/selection", {
        method: "POST",
        body: JSON.stringify({
          venue_id: activeVenueId,
          selectedGenres: [selection.genre],
          selectedSongs: selection.songs.map((song) => ({
            title: song.title,
            artist: song.artist,
            genre: selection.genre
          }))
        })
      });
      await loadSongs();
      addLog({
        type: 'import',
        description: `Database selection imported (${selection.songs.length} songs)`,
        user: 'Admin'
      });
    } catch (error) {
      console.error('Save venue song selection failed', error);
    }
  };

  const bulkUpdateSongStatus = async (ids: string[], status: Song['status']) => {
    try {
      if (!activeVenueId) {
        console.error('No active venue selected');
        return;
      }
      await ensureAdminSession();
      await venueApiClient.bulkUpdateSongStatusInVenue(activeVenueId, ids, status);
      setSongs((prev) => prev.map((song) => (ids.includes(song.id) ? { ...song, status } : song)));
    } catch (error) {
      console.error('Bulk update status failed', error);
    }
  };

  const createPoll = async (title: string, songIds: string[]) => {
    try {
      if (!activeVenueId) {
        console.error('No active venue selected');
        return;
      }
      await ensureAdminSession();
      const created = await requestJson<any>("/polls", {
        method: "POST",
        body: JSON.stringify({ title, songs: songIds, venue_id: activeVenueId })
      });
      setPolls((prev) => [mapPollFromApi({ ...created, songs: songIds, votes: {} }), ...prev]);
      addLog({
        type: 'poll_created',
        description: `Poll "${title}" created`,
        user: 'Admin'
      });
    } catch (error) {
      console.error('Create poll failed', error);
    }
  };

  const closePoll = async (id: string) => {
    try {
      if (!activeVenueId) {
        console.error('No active venue selected');
        return;
      }
      await ensureAdminSession();
      const updated = await requestJson<any>(`/polls/${id}/close`, {
        method: "PATCH",
        body: JSON.stringify({ venue_id: activeVenueId })
      });
      setPolls((prev) => prev.map((poll) => (poll.id === id ? mapPollFromApi(updated) : poll)));
    } catch (error) {
      console.error('Close poll failed', error);
    }
  };

  const votePoll = async (pollId: string, songId: string) => {
    try {
      if (!activeVenueId) {
        console.error('No active venue selected');
        return;
      }
      await ensureAdminSession();
      const updated = await requestJson<any>(`/polls/${pollId}/vote`, {
        method: "PATCH",
        body: JSON.stringify({ songId, venue_id: activeVenueId })
      });
      setPolls((prev) => prev.map((poll) => (poll.id === pollId ? mapPollFromApi({ ...updated, songs: poll.songs, votes: poll.votes }) : poll)));
    } catch (error) {
      console.error('Vote poll failed', error);
    }
  };

  const addToQueue = async (item: Omit<QueueItem, 'id' | 'timestamp'>) => {
    try {
      if (!activeVenueId) {
        console.error('No active venue selected');
        return;
      }
      await ensureAdminSession();
      const payload = {
        songId: item.songId || null,
        songTitle: item.songTitle,
        artist: item.artist,
        genre: item.genre,
        venue_id: activeVenueId
      };
      const created = await requestJson<any>("/queue/insert", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setQueue((prev) => [mapQueueItemFromApi(created), ...prev]);
    } catch (error) {
      console.error('Add to queue failed', error);
    }
  };

  const updateQueueItemStatus = async (id: string, status: QueueItem['status']) => {
    try {
      if (!activeVenueId) {
        console.error('No active venue selected');
        return;
      }
      await ensureAdminSession();
      const payload = { status: status === 'forced' ? 'playing' : status };
      const updated = await requestJson<any>(`/queue/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ ...payload, venue_id: activeVenueId })
      });
      setQueue((prev) => prev.map((item) => (item.id === id ? mapQueueItemFromApi(updated) : item)));
    } catch (error) {
      console.error('Update queue status failed', error);
    }
  };

  const updateQueuePriority = async (id: string, priority: QueueItem['priority']) => {
    try {
      if (!activeVenueId) {
        console.error('No active venue selected');
        return;
      }
      await ensureAdminSession();
      const updated = await requestJson<any>(`/queue/${id}/priority`, {
        method: "PATCH",
        body: JSON.stringify({ priority: mapQueuePriorityToApi(priority), venue_id: activeVenueId })
      });
      setQueue((prev) => prev.map((item) => (item.id === id ? mapQueueItemFromApi(updated) : item)));
    } catch (error) {
      console.error('Update queue priority failed', error);
    }
  };

  const forcePlaySong = async (songId: string) => {
    try {
      if (!activeVenueId) {
        console.error('No active venue selected');
        return;
      }
      await ensureAdminSession();
      const song = songs.find((s) => s.id === songId);
      if (!song) return;
      const created = await requestJson<any>("/queue/insert", {
        method: "POST",
        body: JSON.stringify({
          songId: song.id,
          songTitle: song.title,
          artist: song.artist,
          genre: song.genre,
          venue_id: activeVenueId
        })
      });
      const forced = await requestJson<any>("/queue/force-play", {
        method: "POST",
        body: JSON.stringify({ queueItemId: created.id, venue_id: activeVenueId })
      });
      setQueue((prev) => [mapQueueItemFromApi(forced), ...prev.filter((item) => item.id !== forced.id)]);
      addLog({
        type: 'override',
        description: `Force played "${song.title}"`,
        user: 'Admin'
      });
    } catch (error) {
      console.error('Force play failed', error);
    }
  };

  const blockSong = async (songId: string) => {
    await updateSong(songId, { status: 'blocked' });
  };

  const clearQueue = async () => {
    try {
      if (!activeVenueId) {
        console.error('No active venue selected');
        return;
      }
      await ensureAdminSession();
      await requestJson(`/queue?venue_id=${activeVenueId}`, { method: "DELETE" });
      setQueue([]);
      addLog({
        type: 'admin_action',
        description: 'Queue cleared',
        user: 'Admin'
      });
    } catch (error) {
      console.error('Clear queue failed', error);
    }
  };

  const addLog = async (log: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    try {
      await ensureAdminSession();
      const created = await requestJson<any>("/activity-logs", {
        method: "POST",
        body: JSON.stringify(log)
      });
      setActivityLogs((prev) => [mapActivityLogFromApi(created), ...prev]);
    } catch (error) {
      console.error('Add log failed', error);
    }
  };

  const removeActivityLog = async (id: string) => {
    try {
      await ensureAdminSession();
      await requestJson(`/activity-logs/${id}`, { method: "DELETE" });
      setActivityLogs((prev) => prev.filter((log) => log.id !== id));
    } catch (error) {
      console.error('Remove log failed', error);
    }
  };

  const flagUserForSpam = async (userId: string) => {
    try {
      await ensureAdminSession();
      const updated = await requestJson<any>(`/users/${userId}/flag-spam`, { method: "PATCH" });
      setActiveUsers((prev) => prev.map((user) => (user.userId === userId ? mapUserActivityFromApi(updated) : user)));
    } catch (error) {
      console.error('Flag user failed', error);
    }
  };

  const unflagUserForSpam = async (userId: string) => {
    try {
      await ensureAdminSession();
      const updated = await requestJson<any>(`/users/${userId}/unflag-spam`, { method: "PATCH" });
      setActiveUsers((prev) => prev.map((user) => (user.userId === userId ? mapUserActivityFromApi(updated) : user)));
    } catch (error) {
      console.error('Unflag user failed', error);
    }
  };

  const analytics = useMemo(() => {
    return {
      totalSongs: songs.length,
      activeSongs: songs.filter((s) => s.status === 'active').length,
      totalPlays: songs.reduce((sum, s) => sum + s.playCount, 0),
      totalVotes: songs.reduce((sum, s) => sum + s.voteCount, 0),
      totalPolls: polls.length,
      activePolls: polls.filter((p) => p.status === 'active').length,
      activeRequests: queue.filter((q) => q.status === 'pending').length,
      activeUsers: activeUsers.filter((u) => u.isActive).length
    };
  }, [songs, polls, queue, activeUsers]);

  return (
    <AdminContext.Provider
      value={{
        venue,
        updateVenue,
        venues,
        addVenue,
        deleteVenue,
        systemMode,
        toggleLiveMode,
        toggleMaintenance,
        toggleOverride,
        systemConfig,
        updateSystemConfig,
        downloadBackup,
        songs,
        addSong,
        updateSong,
        deleteSong,
        bulkImportSongs,
        bulkUpdateSongStatus,
        saveVenueSongSelection,
        polls,
        createPoll,
        closePoll,
        votePoll,
        queue,
        addToQueue,
        updateQueueItemStatus,
        updateQueuePriority,
        forcePlaySong,
        blockSong,
        clearQueue,
        activityLogs,
        addLog,
        removeActivityLog,
        activeUsers,
        flagUserForSpam,
        unflagUserForSpam,
        djs,
        addDj,
        deleteDj,
        updateDjAuthKey,
        authenticateDj,
        djAccessRequests,
        approveDjAccess,
        denyDjAccess,
        liveSessions,
        endSession: async (sessionId: string) => {
          try {
            await requestJson(`/live-sessions/${sessionId}/end`, { method: 'PATCH' });
            await loadLiveSessions();
          } catch (error) {
            console.error('End session failed', error);
          }
        },
        analytics
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
}
