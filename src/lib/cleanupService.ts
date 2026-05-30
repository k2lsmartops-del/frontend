import { db } from './offlineDb';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Nettoyage léger des données locales obsolètes.
 *
 * Supprime les soumissions 'synced' dont `syncedAt` remonte à plus de 7 jours,
 * ainsi que leurs photos liées. Les soumissions 'failed' ne sont JAMAIS
 * supprimées automatiquement : l'utilisateur doit pouvoir les consulter et
 * décider (réessayer ou supprimer manuellement).
 *
 * À appeler au démarrage de l'application.
 */
export async function cleanupOldData(): Promise<void> {
  try {
    const cutoff = Date.now() - SEVEN_DAYS_MS;
    const synced = await db.submissions.where('syncStatus').equals('synced').toArray();

    const toDelete = synced.filter((s) => {
      if (!s.syncedAt) return false;
      return new Date(s.syncedAt).getTime() < cutoff;
    });

    if (toDelete.length === 0) return;

    const clientUuids = toDelete.map((s) => s.clientUuid);

    // Supprimer les photos liées
    const photos = await db.photos.where('clientUuid').anyOf(clientUuids).toArray();
    if (photos.length) {
      await db.photos.bulkDelete(photos.map((p) => p.id!).filter((id) => id != null));
    }

    // Supprimer les soumissions
    await db.submissions.bulkDelete(
      toDelete.map((s) => s.id!).filter((id) => id != null),
    );

    console.info(
      `[cleanup] ${toDelete.length} fiche(s) synced + ${photos.length} photo(s) supprimées (> 7 jours)`,
    );
  } catch (err) {
    console.warn('[cleanup] échec du nettoyage', err);
  }
}
