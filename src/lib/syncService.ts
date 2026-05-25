import { db } from './offlineDb';
import { trySyncOne } from './submissionService';

// Délais de retry exponentiel en ms : 5s, 15s, 45s, 2min, 5min
const RETRY_DELAYS = [5000, 15000, 45000, 120000, 300000];
const MAX_RETRIES = 10;
const POLL_INTERVAL = 30000; // 30s

let pollTimer: ReturnType<typeof setInterval> | null = null;
let isSyncing = false;

/**
 * Synchronise toutes les soumissions en attente.
 * Retry exponentiel par soumission.
 */
export async function syncAllPending(): Promise<void> {
  if (isSyncing) return;
  isSyncing = true;

  try {
    const pending = await db.submissions
      .where('syncStatus')
      .anyOf('pending', 'failed')
      .filter((s) => s.retryCount < MAX_RETRIES)
      .toArray();

    for (const sub of pending) {
      // Délai exponentiel
      const delay = RETRY_DELAYS[Math.min(sub.retryCount, RETRY_DELAYS.length - 1)];
      if (sub.retryCount > 0) {
        await sleep(delay);
      }

      await trySyncOne(sub.clientUuid);
    }
  } finally {
    isSyncing = false;
  }
}

/**
 * Démarre le service de sync :
 * - Sync sur événement `online`
 * - Polling toutes les 30s
 */
export function startSyncService(): void {
  // Écouter le retour en ligne
  window.addEventListener('online', () => {
    syncAllPending();
  });

  // Polling régulier
  if (!pollTimer) {
    pollTimer = setInterval(() => {
      if (navigator.onLine) {
        syncAllPending();
      }
    }, POLL_INTERVAL);
  }

  // Sync immédiate au démarrage si en ligne
  if (navigator.onLine) {
    syncAllPending();
  }
}

/**
 * Arrête le polling de sync.
 */
export function stopSyncService(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
