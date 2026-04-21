import { create } from 'zustand';
import type { UserProfile, AppMode } from '@/types';

const LS_USER = 'draftedge_user';
const LS_MODE = 'draftedge_mode';

interface UserState {
  currentUser: UserProfile | null;
  appMode: AppMode;
  setCurrentUser: (user: UserProfile | null) => void;
  setAppMode: (mode: AppMode) => void;
  logout: () => void;
}

function loadUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(LS_USER);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

function loadMode(): AppMode {
  return (localStorage.getItem(LS_MODE) as AppMode) ?? 'grownup';
}

export const useUserStore = create<UserState>()((set) => ({
  currentUser: loadUser(),
  appMode: loadMode(),

  setCurrentUser: (user) => {
    if (user) {
      localStorage.setItem(LS_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(LS_USER);
    }
    set({ currentUser: user });
  },

  setAppMode: (mode) => {
    localStorage.setItem(LS_MODE, mode);
    set({ appMode: mode });
  },

  logout: () => {
    localStorage.removeItem(LS_USER);
    set({ currentUser: null });
  },
}));
