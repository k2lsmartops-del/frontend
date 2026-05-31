import { create } from 'zustand';
import type { AuthTokens, User } from '@/common/types';
import api from '@/common/services/api';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  setAuth: (user: User, tokens: AuthTokens) => void;
  setUser: (user: User) => void;
  refreshProfile: () => Promise<void>;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  tokens: null,
  isAuthenticated: false,

  setAuth: (user, tokens) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('tokens', JSON.stringify(tokens));
    set({ user, tokens, isAuthenticated: true });
  },

  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },

  /**
   * Recharge le profil depuis /auth/me (zone, secteur, superviseur à jour).
   * Utile au démarrage : les sessions existantes récupèrent les infos de
   * hiérarchie même si elles avaient été stockées avant cet ajout côté serveur.
   */
  refreshProfile: async () => {
    if (!get().isAuthenticated) return;
    try {
      const { data } = await api.get<User>('/auth/me');
      localStorage.setItem('user', JSON.stringify(data));
      set({ user: data });
    } catch {
      /* silencieux : hors ligne ou token invalide (géré par l'intercepteur) */
    }
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
