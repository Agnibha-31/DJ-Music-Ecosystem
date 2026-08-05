import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';
import { ensureDjSession, getAccessToken, getSessionVenueId, getLiveSessionId, setLiveSessionId, getSocketUrl, requestJson } from '../utils/apiClient';

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
}

const VenueContext = createContext<VenueContextType | undefined>(undefined);

// ==================== PROVIDER ====================
export function VenueProvider({ children }: { children: ReactNode }) {
  const [activeVenueId, setActiveVenueId] = useState<string | null>(null);
  const [activeVenue, setActiveVenue] = useState<VenueInfo | null>(null);
  const [venues, setVenues] = useState<VenueInfo[]>([]);
  const [isLoadingVenues, setIsLoadingVenues] = useState(false);
  const [liveSessionId, setLiveSessionIdState] = useState<string | null>(getLiveSessionId());
  const socketRef = useRef<Socket | null>(null);
  const isSessionVenueRef = useRef(false);

  const redirectToDjLogin = () => {
    if (window.location.pathname !== '/dj/login') {
      window.location.href = '/dj/login';
    }
  };

  const loadActiveVenue = async () => {
    try {
      if (!getAccessToken()) {
        setActiveVenue(null);
        setActiveVenueId(null);
        redirectToDjLogin();
        return;
      }

      await ensureDjSession();

      // ✅ ALWAYS validate from backend
      const assigned = await requestJson<{
        venueId: string;
        venue: VenueInfo;
        liveSessionId: string | null;
      }>("/djs/me/venue");

      if (assigned?.venue) {
        isSessionVenueRef.current = true;
        setActiveVenue(assigned.venue);
        setActiveVenueId(assigned.venueId);
        if (assigned.liveSessionId) {
          setLiveSessionId(assigned.liveSessionId);
          setLiveSessionIdState(assigned.liveSessionId);
        }
        return;
      }

      // No venue assigned
      isSessionVenueRef.current = false;
      setActiveVenue(null);
      setActiveVenueId(null);

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message !== 'no_session') {
        console.error('Failed to load active venue:', error);
      }
    }
  };


  // Load venues from backend (may be restricted for DJ)
  const loadVenues = async () => {
    try {
      if (!getAccessToken()) {
        setVenues([]);
        redirectToDjLogin();
        return;
      }
      setIsLoadingVenues(true);
      await ensureDjSession();
      const sessionVenueId = getSessionVenueId();
      if (sessionVenueId) {
        isSessionVenueRef.current = true;
        setActiveVenueId(sessionVenueId);
        setVenues([]);
        return;
      }

      isSessionVenueRef.current = false;
      setVenues([]);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message !== 'no_session') {
        console.error('Failed to load venues:', error);
      }
    } finally {
      setIsLoadingVenues(false);
    }
  };

  // Initialize on mount
  useEffect(() => {
    let cancelled = false;

    const loadVenueSafely = async () => {
      try {
        // 1️⃣ Wait until DJ authentication is fully ready
        await ensureDjSession();

        if (cancelled) return;

        // 2️⃣ Now it is SAFE to call protected APIs
        await loadActiveVenue();
        await loadVenues();

      } catch (error) {
        // 3️⃣ Auth failed → force DJ back to login
        redirectToDjLogin();
      }
    };

    loadVenueSafely();

    return () => {
      cancelled = true;
    };
  }, []);


  useEffect(() => {
    const refreshAfterLogin = () => {
      loadActiveVenue();
      loadVenues();
    };

    window.addEventListener('dj_session_ready', refreshAfterLogin);

    return () => {
      window.removeEventListener('dj_session_ready', refreshAfterLogin);
    };
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
      const sessionVenueId = getSessionVenueId();
      if (sessionVenueId) {
        if (venueId !== sessionVenueId) {
          return;
        }
        isSessionVenueRef.current = true;
        setActiveVenueId(sessionVenueId);
        return;
      }

      isSessionVenueRef.current = false;
      setActiveVenueId(null);
      setActiveVenue(null);
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
      isLoadingVenues
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
