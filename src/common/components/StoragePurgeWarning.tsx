import { useNavigate } from 'react-router-dom';
import { RiErrorWarningLine } from '@/common/icons';
import { useSyncStats } from '@/common/hooks/useSyncStats';

/**
 * Bandeau rouge persistant d'avertissement anti-purge.
 *
 * Affiché dès qu'au moins une fiche pending/failed date de plus de 5 jours :
 * iOS Safari peut purger IndexedDB après ~7 jours d'inactivité. On incite donc
 * l'utilisateur à se reconnecter rapidement. Cliquable → "Mes soumissions".
 */
export default function StoragePurgeWarning() {
  const navigate = useNavigate();
  const { stale } = useSyncStats();

  if (stale <= 0) return null;

  return (
    <button
      type="button"
      onClick={() => navigate('/mes-soumissions')}
      className="flex w-full items-start gap-2 bg-k2l-red px-4 py-2 text-left text-[12px] font-medium text-white"
    >
      <RiErrorWarningLine className="mt-0.5 shrink-0 text-base" />
      <span>
        Vous avez {stale} fiche{stale > 1 ? 's' : ''} non synchronisée
        {stale > 1 ? 's' : ''} depuis plus de 5 jours. Connectez-vous à internet
        rapidement, sinon elles pourraient être supprimées par votre téléphone.
      </span>
    </button>
  );
}
