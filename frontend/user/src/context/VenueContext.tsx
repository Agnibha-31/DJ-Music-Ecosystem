import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';
import { ensureGuestSession, getSocketUrl, requestJson } from '../utils/apiClient';

// ==================== TYPES ====================
export interface VenueInfo {
  id: string;
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

// ==================== CONTEXT ====================
interface VenueContextType {
  // Current active venue
  activeVenueId: string | null;
  activeVenue: VenueInfo | null;
  setActiveVenue: (venueId: string) => void;

  // Live session
  liveSessionId: string | null;

  // All available venues
  venues: VenueInfo[];
  loadVenues: () => Promise<void>;

  // Venue metadata
  isLoadingVenues: boolean;
  isLoadingActiveVenue: boolean;
}

const VenueContext = createContext<VenueContextType | undefined>(undefined);

// ==================== PROVIDER ====================
export function VenueProvider({ children }: { children: ReactNode }) {
  const [activeVenueId, setActiveVenueId] = useState<string | null>(null);
  const [activeVenue, setActiveVenue] = useState<VenueInfo | null>(null);
  const [venues, setVenues] = useState<VenueInfo[]>([]);
  const [isLoadingVenues, setIsLoadingVenues] = useState(false);
  const [isLoadingActiveVenue, setIsLoadingActiveVenue] = useState(true);
  const [liveSessionId, setLiveSessionId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const isUrlVenueRef = useRef(false);

  const getVenueIdFromUrl = () => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const venueId = params.get('venue');
    return venueId ? String(venueId).trim() : null;
  };

  const loadVenueByUrl = async (venueId: string) => {
    const data = await requestJson<{ venue: VenueInfo | null }>(`/venues/public/${encodeURIComponent(venueId)}`, {}, false);
    if (data?.venue) {
      setActiveVenue(data.venue);
      setActiveVenueId(data.venue.id ?? venueId);
      return;
    }
    setActiveVenue(null);
    setActiveVenueId(venueId);
  };

  const loadActiveVenue = async () => {
    try {
      setIsLoadingActiveVenue(true);
      await ensureGuestSession();
      const urlVenueId = getVenueIdFromUrl();
      if (urlVenueId) {
        isUrlVenueRef.current = true;
        await loadVenueByUrl(urlVenueId);

        // check for live_session_id in URL
        const params = new URLSearchParams(window.location.search);
        const urlSessionId = params.get('live_session_id');

        if (urlSessionId) {
          setLiveSessionId(urlSessionId);
        } else {
          // Fetch active live session for this venue
          try {
            const sessionData = await requestJson<{ session: any | null }>(`/live-sessions/active?venue_id=${urlVenueId}`, {}, false);
            setLiveSessionId(sessionData?.session?.id ?? null);
          } catch {
            setLiveSessionId(null);
          }
        }
        return;
      }
      isUrlVenueRef.current = false;
      setActiveVenue(null);
      setActiveVenueId(null);
      setLiveSessionId(null);
    } catch (error) {
      console.error('Failed to load active venue:', error);
    } finally {
      setIsLoadingActiveVenue(false);
    }
  };

  // Load venues from backend (may be restricted for guests)
  const loadVenues = async () => {
    try {
      await ensureGuestSession();
      setIsLoadingVenues(true);
      setVenues([]);

      const urlVenueId = getVenueIdFromUrl();
      if (urlVenueId) {
        isUrlVenueRef.current = true;
        await loadVenueByUrl(urlVenueId);
      } else {
        setActiveVenue(null);
        setActiveVenueId(null);
      }
    } catch (error) {
      console.error('Failed to load venues:', error);
    } finally {
      setIsLoadingVenues(false);
    }
  };

  // Initialize on mount
  useEffect(() => {
    loadActiveVenue();
    loadVenues();
  }, []);

  // Setup WebSocket for venue updates
  useEffect(() => {
    try {
      const socket = io(getSocketUrl(), { reconnection: true });
      socketRef.current = socket;
      socket.on('connect', () => {
        if (activeVenueId) {
          socket.emit('join_venue', { venueId: activeVenueId });
        }
      });

      socket.on('venue.created', () => loadVenues());
      socket.on('venue.updated', () => loadVenues());
      socket.on('venue.deleted', () => loadVenues());
      socket.on('venue.active.updated', () => {
        if (isUrlVenueRef.current) return;
      });

      // Live session events
      // Live session events
      socket.on('live_session.ended', ({ live_session }: { live_session: any }) => {
        if (!live_session) return;
        if (activeVenueId && live_session.venueId === activeVenueId) {
          setLiveSessionId(null);
        }
      });

      socket.on('live_session.suspended', ({ live_session }: { live_session: any }) => {
        if (!live_session) return;
        if (activeVenueId && live_session.venueId === activeVenueId) {
          setLiveSessionId(null);
        }
      });

      socket.on('live_session.started', ({ live_session }) => {
        if (!live_session) return;
        if (activeVenueId && live_session.venueId === activeVenueId) {
          setLiveSessionId(live_session.id ?? null);
        }
      });

      return () => {
        socket.disconnect();
      };
    } catch (error) {
      console.error('Failed to setup socket:', error);
    }
  }, [activeVenueId]);

  // Handle venue change
  const handleSetActiveVenue = async (venueId: string) => {
    try {
      const urlVenueId = getVenueIdFromUrl();
      if (!urlVenueId || venueId !== urlVenueId) {
        return;
      }

      const selected = venues.find((venue) => venue.id === urlVenueId) ?? null;
      setActiveVenueId(urlVenueId);
      if (selected) {
        setActiveVenue(selected);
      }
    } catch (error) {
      console.error('Failed to set active venue:', error);
    }
  };

  return (
    <VenueContext.Provider value={{
      activeVenueId,
      activeVenue,
      setActiveVenue: handleSetActiveVenue,
      liveSessionId,
      venues,
      loadVenues,
      isLoadingVenues,
      isLoadingActiveVenue
    }}>
      {children}
    </VenueContext.Provider>
  );
}

// ==================== HOOK ====================
export function useVenue() {
  const context = useContext(VenueContext);
  if (!context) {
    throw new Error('useVenue must be used within VenueProvider');
  }
  return context;
}
