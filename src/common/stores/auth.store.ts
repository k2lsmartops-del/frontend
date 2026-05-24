import { create } from 'zustand';
import type { AuthTokens, User } from '@/common/types';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  setAuth: (user: User, tokens: AuthTokens) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tokens: null,
  isAuthenticated: false,

  setAuth: (user, tokens) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('tokens', JSON.stringify(tokens));
    set({ user, tokens, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('tokens');
    set({ user: null, tokens: null, isAuthenticated: false });
  },

  hydrate: () => {
    try {
      const userStr = localStorage.getItem('user');
      const tokensStr = localStorage.getItem('tokens');
      if (userStr && tokensStr) {
        set({
          user: JSON.parse(userStr) as User,
          tokens: JSON.parse(tokensStr) as AuthTokens,
          isAuthenticated: true,
        });
      }
    } catch {
      localStorage.removeItem('user');
      localStorage.removeItem('tokens');
    }
  },
}));
