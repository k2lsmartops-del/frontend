import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Theme } from '../config/themes';
import { getTheme, applyTheme, DEFAULT_CLIENT_THEME, DEFAULT_ADMIN_THEME } from '../config/themes';

interface ThemeContextType {
  theme: Theme;
  themeId: string;
  setThemeId: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: string;
}

export function ThemeProvider({ children, defaultTheme }: ThemeProviderProps) {
  const [themeId, setThemeId] = useState<string>(() => {
    // Essayer de récupérer le thème sauvegardé
    const saved = localStorage.getItem('app-theme');
    return saved || defaultTheme || DEFAULT_CLIENT_THEME;
  });

  const theme = getTheme(themeId);

  useEffect(() => {
    // Appliquer le thème au chargement et à chaque changement
    applyTheme(themeId);
    localStorage.setItem('app-theme', themeId);
  }, [themeId]);

  return (
    <ThemeContext.Provider value={{ theme, themeId, setThemeId }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Hook pour appliquer le thème admin
export function useAdminTheme() {
  const { setThemeId } = useTheme();
  
  useEffect(() => {
    setThemeId(DEFAULT_ADMIN_THEME);
  }, [setThemeId]);
}

// Hook pour appliquer le thème client
export function useClientTheme(clientThemeId?: string) {
  const { setThemeId } = useTheme();
  
  useEffect(() => {
    setThemeId(clientThemeId || DEFAULT_CLIENT_THEME);
  }, [setThemeId, clientThemeId]);
}
