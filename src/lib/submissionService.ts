import { v4 as uuidv4 } from 'uuid';
import { db, type OfflineSubmission, type SubmissionType } from './offlineDb';
import { syncSubmission } from './syncService';

/**
 * Crée une soumission en local (IndexedDB) puis tente la sync immédiate.
 * Optimistic UI : retourne dès l'écriture locale réussie.
 *
 * IMPORTANT : `formData` ne contient PAS les photos. Les photos sont stockées
 * séparément en Blob (table `photos`) et liées par `clientUuid`. L'upload des
 * photos + l'envoi de la soumission sont gérés atomiquement par `syncService`.
 */
export async function createSubmission(
  type: SubmissionType,
  formData: Record<string, unknown>,
): Promise<{ clientUuid: string; localId: number }> {
  // Le clientUuid peut déjà être présent dans formData (généré par le formulaire
  // pour lier les photos). On le réutilise pour garantir la cohérence photo/fiche.
  const clientUuid = (formData.clientUuid as string) || uuidv4();
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

  // Tentative de sync immédiate (non bloquante) — le syncService reprendra sinon
  syncSubmission(clientUuid).catch(() => {
    /* le polling du syncService s'en chargera */
  });

  return { clientUuid, localId: localId as number };
}

/**
 * Récupère les soumissions locales par statut de sync (toutes si non précisé),
 * triées par date de création décroissante.
 */
export async function getLocalSubmissions(status?: string): Promise<OfflineSubmission[]> {
  const list = status
    ? await db.submissions.where('syncStatus').equals(status).toArray()
    : await db.submissions.toArray();
  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Nombre de soumissions en attente (pending uniquement). */
export async function getPendingCount(): Promise<number> {
  return db.submissions.where('syncStatus').anyOf('pending', 'syncing').count();
}

/** Nombre de soumissions en échec définitif. */
export async function getFailedCount(): Promise<number> {
  return db.submissions.where('syncStatus').equals('failed').count();
}

/**
 * Compte les photos par clientUuid pour un ensemble de soumissions.
 * Retourne une Map clientUuid → nombre de photos.
 */
export async function getPhotoCounts(clientUuids: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (clientUuids.length === 0) return counts;
  const photos = await db.photos.where('clientUuid').anyOf(clientUuids).toArray();
  for (const p of photos) {
    counts.set(p.clientUuid, (counts.get(p.clientUuid) || 0) + 1);
  }
  return counts;
}

/**
 * Réessaie manuellement une soumission en échec :
 * remet retryCount à 0, repasse en 'pending', et déclenche la sync immédiatement.
 */
export async function retrySubmission(clientUuid: string): Promise<void> {
  const sub = await db.submissions.where('clientUuid').equals(clientUuid).first();
  if (!sub || sub.id == null) return;
  await db.submissions.update(sub.id, {
    syncStatus: 'pending',
    retryCount: 0,
    lastError: undefined,
  });
  syncSubmission(clientUuid).catch(() => {
    /* le polling s'en chargera */
  });
}

/**
 * Supprime définitivement une soumission locale et ses photos.
 * À utiliser avec confirmation forte côté UI.
 */
export async function deleteSubmission(clientUuid: string): Promise<void> {
  const photos = await db.photos.where('clientUuid').equals(clientUuid).toArray();
  if (photos.length) {
    await db.photos.bulkDelete(photos.map((p) => p.id!).filter((id) => id != null));
  }
  const sub = await db.submissions.where('clientUuid').equals(clientUuid).first();
  if (sub?.id != null) {
    await db.submissions.delete(sub.id);
  }
}
