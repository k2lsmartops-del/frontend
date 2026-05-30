import { useNavigate } from 'react-router-dom';
import {
  RiCheckDoubleLine,
  RiLoader4Line,
  RiErrorWarningLine,
  RiWifiOffLine,
} from '@/common/icons';
import { useSyncStats } from '@/common/hooks/useSyncStats';

/**
 * Badge global de synchronisation, visible en permanence en haut de la PWA.
 *
 * Priorité d'affichage :
 *  📵 Hors ligne   (si !navigator.onLine)
 *  🔴 X en échec   (si failed > 0) — priorité absolue
 *  🟡 X en attente (si pending/syncing > 0)
 *  🟢 Tout synchronisé (sinon)
 *
 * Cliquable → page "Mes soumissions".
 */
export default function SyncBadge() {
  const navigate = useNavigate();
  const { pending, failed, isOnline, syncing } = useSyncStats();

  let bg = 'bg-k2l-success-light';
  let text = 'text-[#0F6E56]';
  let Icon = RiCheckDoubleLine;
  let label = 'Tout synchronisé';
  let spin = false;

  if (!isOnline) {
    bg = 'bg-k2l-gray-200';
    text = 'text-k2l-gray-600';
    Icon = RiWifiOffLine;
    label = 'Hors ligne';
    if (pending > 0) label = `Hors ligne — ${pending} en attente`;
  } else if (failed > 0) {
    bg = 'bg-k2l-red-light';
    text = 'text-k2l-red';
    Icon = RiErrorWarningLine;
    label = `${failed} en échec`;
  } else if (pending > 0) {
    bg = 'bg-k2l-amber-light';
    text = 'text-[#854F0B]';
    Icon = RiLoader4Line;
    label = syncing > 0 ? `Synchronisation… (${pending})` : `${pending} en attente`;
    spin = syncing > 0;
  }

  return (
    <button
      type="button"
      onClick={() => navigate('/mes-soumissions')}
      aria-label={`Statut de synchronisation : ${label}`}
      className={`flex w-full items-center justify-center gap-2 px-4 py-1.5 text-[12px] font-semibold transition-colors ${bg} ${text}`}
    >
      <Icon className={`text-sm ${spin ? 'animate-spin' : ''}`} />
      <span>{label}</span>
    </button>
  );
}
