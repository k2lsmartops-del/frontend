import { useState, useEffect } from 'react';
import { db } from '@/lib/offlineDb';

export interface SyncStats {
  total: number;
  pending: number; // pending + syncing
  syncing: number;
  failed: number;
  synced: number;
  /** Fiches pending/failed créées il y a plus de 5 jours (risque de purge iOS). */
  stale: number;
  isOnline: boolean;
}

const EMPTY: SyncStats = {
  total: 0,
  pending: 0,
  syncing: 0,
  failed: 0,
  synced: 0,
  stale: 0,
  isOnline: navigator.onLine,
};

const STALE_THRESHOLD_MS = 5 * 24 * 60 * 60 * 1000; // 5 jours
const POLL_MS = 3000;

/**
 * Hook qui interroge IndexedDB toutes les 3 secondes pour fournir les
 * statistiques de synchronisation en temps réel. Réagit aussi aux événements
 * `online`/`offline` et `k2l-sync` (émis par le syncService) pour un refresh
 * immédiat.
 */
export function useSyncStats(): SyncStats {
  const [stats, setStats] = useState<SyncStats>(EMPTY);

  useEffect(() => {
    let cancelled = false;

    const compute = async () => {
      try {
        const all = await db.submissions.toArray();
        const now = Date.now();
        let pending = 0;
        let syncing = 0;
        let failed = 0;
        let synced = 0;
        let stale = 0;

        for (const s of all) {
          if (s.syncStatus === 'pending') pending++;
          else if (s.syncStatus === 'syncing') syncing++;
          else if (s.syncStatus === 'failed') failed++;
          else if (s.syncStatus === 'synced') synced++;

          if (
            (s.syncStatus === 'pending' || s.syncStatus === 'failed') &&
            now - new Date(s.createdAt).getTime() > STALE_THRESHOLD_MS
          ) {
            stale++;
          }
        }

        if (!cancelled) {
          setStats({
            total: all.length,
            pending: pending + syncing,
            syncing,
            failed,
            synced,
            stale,
            isOnline: navigator.onLine,
          });
        }
      } catch {
        /* ignore */
      }
    };

    compute();
    const interval = setInterval(compute, POLL_MS);

    const onNet = () => compute();
    const onSync = () => compute();
    window.addEventListener('online', onNet);
    window.addEventListener('offline', onNet);
    window.addEventListener('k2l-sync', onSync as EventListener);

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener('online', onNet);
      window.removeEventListener('offline', onNet);
      window.removeEventListener('k2l-sync', onSync as EventListener);
    };
  }, []);

  return stats;
}
