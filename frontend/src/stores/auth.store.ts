import { create } from 'zustand';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  logout: () => void;
  setLoading: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('ff_token'),
  isLoading: true,
  setAuth: (user, token) => {
    localStorage.setItem('ff_token', token);
    set({ user, token, isLoading: false });
  },
  logout: () => {
    localStorage.removeItem('ff_token');
    set({ user: null, token: null, isLoading: false });
  },
  setLoading: (v) => set({ isLoading: v }),
}));
