/**
 * Logger utilitaire qui désactive les logs en production.
 * Utiliser à la place de console.log/warn/error dans toute l'application.
 */

const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },
  info: (...args: unknown[]) => {
    if (isDev) console.info(...args);
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    // Les erreurs sont toujours loggées mais sans détails sensibles en prod
    if (isDev) {
      console.error(...args);
    } else {
      // En production, on log juste le type d'erreur sans les détails
      console.error('[Error]', args[0] instanceof Error ? args[0].message : 'An error occurred');
    }
  },
};

export default logger;
