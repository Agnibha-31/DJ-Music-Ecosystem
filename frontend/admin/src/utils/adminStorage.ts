import { getAccessToken } from './apiClient';

export type AdminProfile = {
  firstName?: string;
  lastName?: string;
  email: string;
  username: string;
  id?: string;
};

const PROFILE_KEY = 'admin_profile';
const AUTH_KEY = 'admin_auth';

export const setCurrentAdminProfile = (profile: AdminProfile) => {
  sessionStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  localStorage.removeItem(PROFILE_KEY);
};

export const getCurrentAdminProfile = (): AdminProfile | null => {
  const raw = sessionStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminProfile;
  } catch {
    return null;
  }
};

export const setAdminAuth = (isAuthed: boolean) => {
  sessionStorage.setItem(AUTH_KEY, isAuthed ? 'true' : 'false');
  localStorage.removeItem(AUTH_KEY);
};

export const isAdminAuthed = (): boolean =>
  sessionStorage.getItem(AUTH_KEY) === 'true' && Boolean(getAccessToken());

export const clearAdminAuth = () => {
  sessionStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(PROFILE_KEY);
};
