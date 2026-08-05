import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';
import { ensureAdminSession, getAccessToken, getSocketUrl, requestJson } from '../utils/apiClient';

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
  const socketRef = useRef<Socket | null>(null);

  const loadActiveVenue = async () => {
    try {
      if (!getAccessToken()) return;
      await ensureAdminSession();
      const data = await requestJson<{ venue: VenueInfo | null; activeVenueId?: string }>("/venue");
      if (data?.venue) {
        setActiveVenue(data.venue);
        setActiveVenueId(data.activeVenueId ?? data.venue.id ?? null);
      }
    } catch (error) {
      console.error('Failed to load active venue:', error);
    }
  };

  // Load venues from backend
  const loadVenues = async () => {
    try {
      if (!getAccessToken()) return;
      await ensureAdminSession();
      setIsLoadingVenues(true);
      const data = await requestJson<{ items: VenueInfo[] }>("/venues");
      const venuesList = (data.items || []).filter((v: any) => !v.deleted_at);
      setVenues(venuesList);
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
      
      socket.on('venue.created', () => loadVenues());
      socket.on('venue.updated', () => loadVenues());
      socket.on('venue.deleted', () => loadVenues());
      socket.on('venue.active.updated', ({ venue }) => {
        if (venue) {
          setActiveVenue(venue);
          setActiveVenueId(venue.id ?? null);
        }
      });
      
      return () => {
        socket.disconnect();
      };
    } catch (error) {
      console.error('Failed to setup socket:', error);
    }
  }, []);
  
  // Handle venue change
  const handleSetActiveVenue = async (venueId: string) => {
    try {
      if (!getAccessToken()) return;
      await ensureAdminSession();
      const response = await requestJson<{ venue: VenueInfo; activeVenueId?: string }>("/venue/active", {
        method: 'PATCH',
        body: JSON.stringify({ venueId })
      });
      if (response?.venue) {
        setActiveVenue(response.venue);
        setActiveVenueId(response.activeVenueId ?? response.venue.id ?? venueId);
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
