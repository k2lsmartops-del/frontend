import { useEffect } from 'react';
import { useToastStore } from '@/common/stores/toast.store';
import type { SyncEventDetail } from '@/lib/syncService';

/**
 * Composant invisible qui écoute les événements globaux `k2l-sync` émis par le
 * service de synchronisation et affiche les toasts correspondants :
 *  - synced : toast vert discret (auto-hide)
 *  - failed : toast rouge persistant (fermeture manuelle)
 */
export default function SyncToastListener() {
  const show = useToastStore((s) => s.show);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<SyncEventDetail>).detail;
      if (!detail) return;

      if (detail.type === 'synced') {
        show('Fiche synchronisée', 'success');
      } else if (detail.type === 'failed') {
        const name = detail.label ? ` pour ${detail.label}` : '';
        show(
          `Échec de synchronisation${name}. Voir "Mes soumissions".`,
          'error',
          true, // persistant
        );
      }
    };

    window.addEventListener('k2l-sync', handler as EventListener);
    return () => window.removeEventListener('k2l-sync', handler as EventListener);
  }, [show]);

  return null;
}
