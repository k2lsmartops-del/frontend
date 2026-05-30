import axios from 'axios';
import { db, type OfflineSubmission } from './offlineDb';
import api from '@/common/services/api';
import { uploadToCloudinary } from './uploadService';

// ── Constantes ──

// Délais de retry exponentiel en ms : 5s, 15s, 45s, 2min, 5min (puis 5min répétés)
const RETRY_DELAYS = [5000, 15000, 45000, 120000, 300000];
const MAX_RETRIES = 10;
const POLL_INTERVAL = 30000; // 30s

// ── État interne ──

let pollTimer: ReturnType<typeof setInterval> | null = null;
let isSyncing = false;

// ── Résultat d'un cycle de sync ──

export type SyncOutcome =
  | 'synced'
  | 'pending'
  | 'failed'
  | 'locked'
  | 'not_found'
  | 'already';

// ── Système d'événements (pour toasts + stats temps réel) ──

export type SyncEventType = 'synced' | 'failed' | 'progress';

export interface SyncEventDetail {
  type: SyncEventType;
  clientUuid: string;
  submissionType: OfflineSubmission['type'];
  label?: string;
}

/** Émet un événement global de synchronisation (écouté par l'UI). */
function emitSyncEvent(detail: SyncEventDetail): void {
  window.dispatchEvent(new CustomEvent<SyncEventDetail>('k2l-sync', { detail }));
}

/** Extrait un libellé lisible de la soumission (nom prospect / commerce). */
function getSubmissionLabel(sub: OfflineSubmission): string {
  const f = sub.formData as Record<string, unknown>;
  return (
    (f.prospectFullName as string) ||
    (f.merchantName as string) ||
    (sub.type === 'PROSPECT' ? 'Prospect' : 'Marchand')
  );
}

/** Récupère le code HTTP d'une erreur (axios ou non). */
function getHttpStatus(err: unknown): number | undefined {
  if (axios.isAxiosError(err)) return err.response?.status;
  return undefined;
}

function errorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return (
      (err.response?.data as { message?: string })?.message ||
      err.message ||
      'Erreur réseau'
    );
  }
  return err instanceof Error ? err.message : 'Erreur inconnue';
}

// ──────────────────────────────────────────────────────────────
//  SYNC ATOMIQUE D'UNE SOUMISSION (tout-ou-rien)
// ──────────────────────────────────────────────────────────────

/**
 * Synchronise UNE soumission de manière atomique.
 *
 * Cycle strict :
 *  1. Verrouiller (syncStatus = 'syncing'). Abandonner si déjà 'syncing'.
 *  2. Uploader séquentiellement chaque photo non encore uploadée vers Cloudinary,
 *     en persistant l'URL IMMÉDIATEMENT après chaque succès (reprise sans perte).
 *  3. Construire le payload final (formData + photos avec URLs).
 *  4. POST /submissions :
 *     - 2xx          → synced
 *     - 409          → synced (idempotence serveur)
 *     - 4xx          → failed (données invalides, pas de retry auto)
 *     - 5xx / réseau → pending (retry plus tard)
 *
 * Règle d'or : 'synced' UNIQUEMENT si TOUTES les photos sont sur Cloudinary
 * ET que le serveur a accepté le payload final. Aucun état intermédiaire.
 */
export async function syncSubmission(clientUuid: string): Promise<SyncOutcome> {
  const sub = await db.submissions.where('clientUuid').equals(clientUuid).first();
  if (!sub || sub.id == null) return 'not_found';
  if (sub.syncStatus === 'synced') return 'already';
  if (sub.syncStatus === 'syncing') return 'locked';

  // 1. Verrouiller
  await db.submissions.update(sub.id, { syncStatus: 'syncing' });

  let madeProgress = false;

  try {
    // 2. Uploader les photos liées, séquentiellement
    const photos = await db.photos.where('clientUuid').equals(clientUuid).toArray();

    for (const photo of photos) {
      // Idempotence : ne jamais réuploader une photo déjà sur Cloudinary
      if (photo.uploaded && photo.cloudinaryUrl) continue;

      console.info(`[sync] Upload photo ${photo.category} (${clientUuid})`);
      const result = await uploadToCloudinary(photo.blob);

      // Persister IMMÉDIATEMENT (avant la photo suivante)
      await db.photos.update(photo.id!, {
        uploaded: true,
        cloudinaryUrl: result.url,
        cloudinaryPublicId: result.publicId,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
      });
      madeProgress = true;
    }

    // 3. Construire le payload final avec les URLs Cloudinary
    const finalPhotos = await db.photos.where('clientUuid').equals(clientUuid).toArray();
    const photoPayload = finalPhotos
      .filter((p) => p.uploaded && p.cloudinaryUrl)
      .map((p) => ({
        cloudinaryPublicId: p.cloudinaryPublicId!,
        url: p.cloudinaryUrl!,
        category: p.category,
        width: p.width,
        height: p.height,
        bytes: p.bytes,
      }));

    const payload = {
      ...sub.formData,
      clientUuid: sub.clientUuid,
      type: sub.type,
      createdOffline: true,
      ...(photoPayload.length ? { photos: photoPayload } : {}),
    };

    // 4. Envoyer au serveur
    console.info(`[sync] POST /submissions (${clientUuid})`);
    await api.post('/submissions', payload);

    await db.submissions.update(sub.id, {
      syncStatus: 'synced',
      syncedAt: new Date().toISOString(),
      lastError: undefined,
    });
    console.info(`[sync] ✓ synced (${clientUuid})`);
    emitSyncEvent({
      type: 'synced',
      clientUuid,
      submissionType: sub.type,
      label: getSubmissionLabel(sub),
    });
    return 'synced';
  } catch (err) {
    const status = getHttpStatus(err);
    const message = errorMessage(err);

    // 409 : le serveur l'a déjà reçue (idempotence) → succès
    if (status === 409) {
      await db.submissions.update(sub.id, {
        syncStatus: 'synced',
        syncedAt: new Date().toISOString(),
        lastError: undefined,
      });
      console.info(`[sync] ✓ synced via 409 idempotent (${clientUuid})`);
      emitSyncEvent({
        type: 'synced',
        clientUuid,
        submissionType: sub.type,
        label: getSubmissionLabel(sub),
      });
      return 'synced';
    }

    // 4xx (validation) : données mauvaises, le retry ne corrigera rien → failed
    if (status !== undefined && status >= 400 && status < 500) {
      await db.submissions.update(sub.id, { syncStatus: 'failed', lastError: message });
      console.error(`[sync] ✗ failed (validation ${status}) (${clientUuid}): ${message}`);
      emitSyncEvent({
        type: 'failed',
        clientUuid,
        submissionType: sub.type,
        label: getSubmissionLabel(sub),
      });
      return 'failed';
    }

    // 5xx ou erreur réseau → pending (retry plus tard)
    // Un succès partiel (au moins une photo uploadée) NE compte PAS comme un échec :
    // on ne touche pas au retryCount tant que le cycle progresse.
    const newRetryCount = madeProgress ? sub.retryCount : (sub.retryCount || 0) + 1;
    const reachedMax = !madeProgress && newRetryCount >= MAX_RETRIES;
    const newStatus = reachedMax ? 'failed' : 'pending';

    await db.submissions.update(sub.id, {
      syncStatus: newStatus,
      retryCount: newRetryCount,
      lastError: message,
    });

    if (reachedMax) {
      console.error(`[sync] ✗ failed (max retries) (${clientUuid}): ${message}`);
      emitSyncEvent({
        type: 'failed',
        clientUuid,
        submissionType: sub.type,
        label: getSubmissionLabel(sub),
      });
    } else {
      console.warn(
        `[sync] ⟳ pending (retry ${newRetryCount}/${MAX_RETRIES}${madeProgress ? ', progress' : ''}) (${clientUuid}): ${message}`,
      );
      if (madeProgress) {
        emitSyncEvent({ type: 'progress', clientUuid, submissionType: sub.type });
      }
    }
    return newStatus;
  }
}

// ──────────────────────────────────────────────────────────────
//  SYNC DE TOUTES LES SOUMISSIONS EN ATTENTE
// ──────────────────────────────────────────────────────────────

/**
 * Synchronise toutes les soumissions 'pending'.
 * Les 'failed' ne sont PAS retentées automatiquement (action manuelle requise).
 * Retry exponentiel appliqué par soumission selon son retryCount.
 */
export async function syncAllPending(): Promise<void> {
  if (isSyncing || !navigator.onLine) return;
  isSyncing = true;

  try {
    const pending = await db.submissions
      .where('syncStatus')
      .equals('pending')
      .toArray();

    for (const sub of pending) {
      // Délai exponentiel avant un retry (pas avant la 1ère tentative)
      if (sub.retryCount > 0) {
        const delay = RETRY_DELAYS[Math.min(sub.retryCount - 1, RETRY_DELAYS.length - 1)];
        await sleep(delay);
      }
      if (!navigator.onLine) break;
      await syncSubmission(sub.clientUuid);
    }
  } finally {
    isSyncing = false;
  }
}

/**
 * Réinitialise les soumissions bloquées en 'syncing' (cycle interrompu : crash,
 * fermeture d'onglet, kill iOS) en 'pending' pour qu'elles soient retentées.
 */
export async function recoverStuckSyncing(): Promise<void> {
  const stuck = await db.submissions.where('syncStatus').equals('syncing').toArray();
  for (const sub of stuck) {
    if (sub.id != null) {
      await db.submissions.update(sub.id, { syncStatus: 'pending' });
    }
  }
  if (stuck.length) {
    console.warn(`[sync] ${stuck.length} soumission(s) 'syncing' bloquée(s) → remises en 'pending'`);
  }
}

// ──────────────────────────────────────────────────────────────
//  CYCLE DE VIE DU SERVICE
// ──────────────────────────────────────────────────────────────

/**
 * Démarre le service de sync :
 * - Réveil sur `online`
 * - Polling toutes les 30s (fallback iOS — pas de Background Sync API)
 * - Sync immédiate au démarrage si en ligne
 */
export function startSyncService(): void {
  // Réveil sur retour en ligne
  window.addEventListener('online', () => {
    syncAllPending();
  });

  // Polling régulier
  if (!pollTimer) {
    pollTimer = setInterval(() => {
      if (navigator.onLine) syncAllPending();
    }, POLL_INTERVAL);
  }

  // Récupérer les cycles interrompus puis sync immédiate
  recoverStuckSyncing().then(() => {
    if (navigator.onLine) syncAllPending();
  });
}

/** Arrête le polling de sync. */
export function stopSyncService(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
