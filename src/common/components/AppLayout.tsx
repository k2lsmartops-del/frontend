import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import Toast from './Toast';
import SyncBadge from './SyncBadge';
import StoragePurgeWarning from './StoragePurgeWarning';
import SyncToastListener from './SyncToastListener';
import { useAuthStore } from '@/common/stores/auth.store';

export default function AppLayout() {
  const role = useAuthStore((s) => s.user?.role);
  // Le badge de sync ne concerne que le commercial (créateur de soumissions offline)
  const showSync = role === 'COMMERCIAL';

  return (
    <div
      className="mx-auto flex max-w-[430px] flex-col bg-k2l-gray-100 shadow-lg"
      style={{
        // Hauteur réelle de l'écran (fix iOS Safari)
        height: '100dvh',
        // Respecte l'encoche iPhone en haut
        paddingTop: 'env(safe-area-inset-top)',
        // Respecte les écrans courbes
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      {/* Écoute les événements de sync pour afficher les toasts */}
      <SyncToastListener />

      {/* Badge de synchronisation + bandeau anti-purge (commercial uniquement) */}
      {showSync && (
        <div className="shrink-0">
          <SyncBadge />
          <StoragePurgeWarning />
        </div>
      )}

      {/* Zone de contenu scrollable */}
      <div className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 overflow-y-auto overscroll-y-contain">
          <Outlet />
        </div>
      </div>
      {/* Navigation fixe en bas */}
      <BottomNav />
      <Toast />
    </div>
  );
}
