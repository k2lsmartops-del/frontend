/**
 * Configuration des thèmes par entreprise/campagne
 * Chaque thème définit les couleurs de l'interface pour un client spécifique
 * 
 * Pour ajouter un nouveau thème :
 * 1. Ajouter une nouvelle entrée dans l'objet themes
 * 2. Définir les couleurs primary, accent, neutral, success, warning, danger
 */

export interface ThemeColors {
  // Couleurs principales
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primaryMid: string;
  
  // Couleurs d'accent
  accent: string;
  accentLight: string;
  
  // Couleurs neutres
  neutral: string;
  neutralDark: string;
  neutralLight: string;
  
  // Couleurs de statut
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  danger: string;
  dangerLight: string;
  
  // Couleurs de texte et fond
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
}

export interface Theme {
  id: string;
  name: string;
  logo?: string;
  colors: ThemeColors;
}

export const themes: Record<string, Theme> = {
  // Thème par défaut K2L
  k2l: {
    id: 'k2l',
    name: 'K2L SmartOps',
    logo: '/logo.jpeg',
    colors: {
      primary: '#2B7CD3',
      primaryDark: '#1C2E4F',
      primaryLight: '#E8F1FB',
      primaryMid: '#5A9DE0',
      accent: '#EF9F27',
      accentLight: '#FEF3DC',
      neutral: '#4B5563',
      neutralDark: '#1F2937',
      neutralLight: '#F3F4F6',
      success: '#22B573',
      successLight: '#E1F5EE',
      warning: '#EF9F27',
      warningLight: '#FEF3DC',
      danger: '#E24B4A',
      dangerLight: '#FCEBEB',
      background: '#F3F4F6',
      surface: '#FFFFFF',
      textPrimary: '#1F2937',
      textSecondary: '#4B5563',
      border: '#D1D5DB',
    },
  },
  
  // Thème Mansa Banque
  mansabanque: {
    id: 'mansabanque',
    name: 'Mansa Banque',
    logo: '/logo_code.jpg',
    colors: {
      primary: '#D99954',
      primaryDark: '#1A1714',
      primaryLight: '#F4BA77',
      primaryMid: '#E7A966',
      accent: '#B87734',
      accentLight: '#F4BA77',
      neutral: '#3B3633',
      neutralDark: '#1A1714',
      neutralLight: '#FDFDFB',
      success: '#22B573',
      successLight: '#E1F5EE',
      warning: '#CB8A47',
      warningLight: '#F4BA77',
      danger: '#E24B4A',
      dangerLight: '#FCEBEB',
      background: '#FDFDFB',
      surface: '#FFFFFF',
      textPrimary: '#1A1714',
      textSecondary: '#3B3633',
      border: '#5B5755',
    },
  },
};

// Thème par défaut pour les clients
export const DEFAULT_CLIENT_THEME = 'mansabanque';

// Thème par défaut pour l'admin
export const DEFAULT_ADMIN_THEME = 'k2l';

/**
 * Récupère un thème par son ID
 */
export function getTheme(themeId: string): Theme {
  return themes[themeId] || themes.k2l;
}

/**
 * Applique un thème en définissant les variables CSS
 */
export function applyTheme(themeId: string): void {
  const theme = getTheme(themeId);
  const root = document.documentElement;
  
  // Appliquer les couleurs comme variables CSS
  root.style.setProperty('--color-theme-primary', theme.colors.primary);
  root.style.setProperty('--color-theme-primary-dark', theme.colors.primaryDark);
  root.style.setProperty('--color-theme-primary-light', theme.colors.primaryLight);
  root.style.setProperty('--color-theme-primary-mid', theme.colors.primaryMid);
  root.style.setProperty('--color-theme-accent', theme.colors.accent);
  root.style.setProperty('--color-theme-accent-light', theme.colors.accentLight);
  root.style.setProperty('--color-theme-neutral', theme.colors.neutral);
  root.style.setProperty('--color-theme-neutral-dark', theme.colors.neutralDark);
  root.style.setProperty('--color-theme-neutral-light', theme.colors.neutralLight);
  root.style.setProperty('--color-theme-success', theme.colors.success);
  root.style.setProperty('--color-theme-success-light', theme.colors.successLight);
  root.style.setProperty('--color-theme-warning', theme.colors.warning);
  root.style.setProperty('--color-theme-warning-light', theme.colors.warningLight);
  root.style.setProperty('--color-theme-danger', theme.colors.danger);
  root.style.setProperty('--color-theme-danger-light', theme.colors.dangerLight);
  root.style.setProperty('--color-theme-background', theme.colors.background);
  root.style.setProperty('--color-theme-surface', theme.colors.surface);
  root.style.setProperty('--color-theme-text-primary', theme.colors.textPrimary);
  root.style.setProperty('--color-theme-text-secondary', theme.colors.textSecondary);
  root.style.setProperty('--color-theme-border', theme.colors.border);
  
  // Mettre à jour la meta theme-color pour la barre de statut mobile
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', theme.colors.primaryDark);
  }
}
