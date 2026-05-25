import { v4 as uuidv4 } from 'uuid';
import { db, type OfflineSubmission, type SubmissionType } from './offlineDb';
import api from '@/common/services/api';

/**
 * Crée une soumission en local (IndexedDB) puis tente la sync immédiate.
 * Optimistic UI : retourne dès l'écriture locale réussie.
 */
export async function createSubmission(
  type: SubmissionType,
  formData: Record<string, unknown>,
): Promise<{ clientUuid: string; localId: number }> {
  const clientUuid = uuidv4();
  const now = new Date().toISOString();

  const submission: OfflineSubmission = {
    clientUuid,
    type,
    syncStatus: 'pending',
    retryCount: 0,
    createdAt: now,
    formData: { ...formData, clientUuid, type },
  };

  const localId = await db.submissions.add(submission);

  // Tentative de sync immédiate (non bloquante)
  trySyncOne(clientUuid).catch(() => {
    /* sync service s'en chargera */
  });

  return { clientUuid, localId: localId as number };
}

/**
 * Tente de synchroniser une seule soumission.
 */
export async function trySyncOne(clientUuid: string): Promise<boolean> {
  const sub = await db.submissions.where('clientUuid').equals(clientUuid).first();
  if (!sub || sub.syncStatus === 'synced' || sub.syncStatus === 'syncing') {
    return false;
  }

  await db.submissions.where('clientUuid').equals(clientUuid).modify({
    syncStatus: 'syncing',
  });

  try {
    await api.post('/submissions', sub.formData);

    await db.submissions.where('clientUuid').equals(clientUuid).modify({
      syncStatus: 'synced',
    });

    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';

    await db.submissions.where('clientUuid').equals(clientUuid).modify({
      syncStatus: 'failed',
      retryCount: (sub.retryCount || 0) + 1,
      lastError: message,
    });

    return false;
  }
}

/**
 * Récupère les soumissions locales par statut de sync.
 */
export async function getLocalSubmissions(status?: string) {
  if (status) {
    return db.submissions.where('syncStatus').equals(status).toArray();
  }
  return db.submissions.toArray();
}

/**
 * Nombre de soumissions en attente de synchronisation.
 */
export async function getPendingCount(): Promise<number> {
  return db.submissions.where('syncStatus').anyOf('pending', 'failed').count();
}
