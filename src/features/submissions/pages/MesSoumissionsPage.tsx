import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RiArrowLeftLine,
  RiRefreshLine,
  RiDeleteBinLine,
  RiLoader4Line,
  RiCheckDoubleLine,
  RiErrorWarningLine,
  RiTimeLine,
  RiUserLine,
  RiStore2Line,
  RiImageLine,
} from '@/common/icons';
import { useToastStore } from '@/common/stores/toast.store';
import type { OfflineSubmission } from '@/lib/offlineDb';
import {
  getLocalSubmissions,
  getPhotoCounts,
  retrySubmission,
  deleteSubmission,
} from '@/lib/submissionService';
import { syncAllPending } from '@/lib/syncService';

type Filter = 'all' | 'pending' | 'failed' | 'synced';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'pending', label: 'En attente' },
  { value: 'failed', label: 'Échouées' },
  { value: 'synced', label: 'Synchronisées' },
];

const STATUS_META: Record<
  string,
  { label: string; badge: string; border: string }
> = {
  pending: {
    label: 'En attente',
    badge: 'bg-k2l-amber-light text-[#854F0B]',
    border: 'border-l-[#EF9F27]',
  },
  syncing: {
    label: 'Synchronisation…',
    badge: 'bg-[#E6F1FB] text-[#1F5C99]',
    border: 'border-l-[#1F5C99]',
  },
  synced: {
    label: 'Synchronisée',
    badge: 'bg-k2l-success-light text-[#0F6E56]',
    border: 'border-l-[#1D9E75]',
  },
  failed: {
    label: 'Échec',
    badge: 'bg-k2l-red-light text-k2l-red',
    border: 'border-l-k2l-red',
  },
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function MesSoumissionsPage() {
  const navigate = useNavigate();
  const showToast = useToastStore((s) => s.show);

  const [submissions, setSubmissions] = useState<OfflineSubmission[]>([]);
  const [photoCounts, setPhotoCounts] = useState<Map<string, number>>(new Map());
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [syncingAll, setSyncingAll] = useState(false);

  const load = useCallback(async () => {
    const list = await getLocalSubmissions();
    const counts = await getPhotoCounts(list.map((s) => s.clientUuid));
    setSubmissions(list);
    setPhotoCounts(counts);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const onSync = () => load();
    window.addEventListener('k2l-sync', onSync as EventListener);
    const interval = setInterval(load, 4000);
    return () => {
      window.removeEventListener('k2l-sync', onSync as EventListener);
      clearInterval(interval);
    };
  }, [load]);

  const handleSyncAll = async () => {
    if (!navigator.onLine) {
      showToast('Vous êtes hors ligne', 'offline');
      return;
    }
    setSyncingAll(true);
    try {
      await syncAllPending();
      await load();
    } finally {
      setSyncingAll(false);
    }
  };

  const handleRetry = async (clientUuid: string) => {
    await retrySubmission(clientUuid);
    showToast('Nouvelle tentative lancée', 'info');
    await load();
  };

  const handleDelete = async (clientUuid: string) => {
    const ok = window.confirm(
      'Êtes-vous sûr ? Les données de cette fiche seront définitivement perdues.',
    );
    if (!ok) return;
    await deleteSubmission(clientUuid);
    showToast('Fiche supprimée', 'success');
    await load();
  };

  const filtered = submissions.filter((s) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return s.syncStatus === 'pending' || s.syncStatus === 'syncing';
    return s.syncStatus === filter;
  });

  const pendingCount = submissions.filter(
    (s) => s.syncStatus === 'pending' || s.syncStatus === 'syncing',
  ).length;

  return (
    <div className="flex min-h-full flex-col bg-k2l-gray-100">
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between bg-k2l-navy px-5 py-3.5">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-[13px] text-white/80">
          <RiArrowLeftLine className="text-base" /> Retour
        </button>
        <span className="font-head text-[17px] font-semibold text-white">Mes soumissions</span>
        <div className="w-16" />
      </div>

      <div className="flex-1 space-y-3 p-4">
        {/* Bouton tout synchroniser */}
        <button
          onClick={handleSyncAll}
          disabled={syncingAll || pendingCount === 0}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-k2l-primary py-3 font-head text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {syncingAll ? (
            <RiLoader4Line className="animate-spin text-base" />
          ) : (
            <RiRefreshLine className="text-base" />
          )}
          {syncingAll
            ? 'Synchronisation en cours…'
            : pendingCount > 0
              ? `Tout synchroniser maintenant (${pendingCount})`
              : 'Tout est synchronisé'}
        </button>

        {/* Filtres */}
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === f.value
                  ? 'bg-k2l-navy text-white'
                  : 'border border-k2l-gray-200 bg-white text-k2l-gray-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Liste */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RiLoader4Line className="animate-spin text-2xl text-k2l-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-k2l-gray-400">
            Aucune soumission
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((sub) => {
              const meta = STATUS_META[sub.syncStatus] ?? STATUS_META.pending;
              const f = sub.formData as Record<string, unknown>;
              const name =
                (f.prospectFullName as string) ||
                (f.merchantName as string) ||
                (sub.type === 'PROSPECT' ? 'Prospect sans nom' : 'Marchand sans nom');
              const TypeIcon = sub.type === 'PROSPECT' ? RiUserLine : RiStore2Line;
              const nbPhotos = photoCounts.get(sub.clientUuid) ?? 0;
              const canRetry = sub.syncStatus === 'failed';
              const canDelete = sub.syncStatus === 'pending' || sub.syncStatus === 'failed';

              return (
                <div
                  key={sub.clientUuid}
                  className={`rounded-lg border-l-4 ${meta.border} border-y border-r border-k2l-gray-200 bg-white p-3`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-start gap-2">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-k2l-gray-100">
                        <TypeIcon className="text-base text-k2l-gray-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-head text-sm font-bold text-k2l-gray-900">
                          {name}
                        </p>
                        <p className="text-[11px] text-k2l-gray-400">
                          {sub.type === 'PROSPECT' ? 'Prospect' : 'Marchand'}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.badge}`}
                    >
                      {meta.label}
                    </span>
                  </div>

                  {/* Méta */}
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-k2l-gray-400">
                    <span className="flex items-center gap-1">
                      <RiTimeLine /> {formatDate(sub.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <RiImageLine /> {nbPhotos} photo{nbPhotos > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Erreur */}
                  {sub.syncStatus === 'failed' && sub.lastError && (
                    <p className="mt-2 flex items-start gap-1 rounded bg-k2l-red-light px-2 py-1 text-[11px] text-k2l-red">
                      <RiErrorWarningLine className="mt-0.5 shrink-0" />
                      <span className="break-words">{sub.lastError}</span>
                    </p>
                  )}

                  {/* Actions */}
                  {(canRetry || canDelete) && (
                    <div className="mt-2.5 flex gap-2">
                      {canRetry && (
                        <button
                          onClick={() => handleRetry(sub.clientUuid)}
                          className="flex flex-1 items-center justify-center gap-1 rounded-md bg-k2l-primary px-2 py-1.5 text-[11px] font-semibold text-white"
                        >
                          <RiRefreshLine /> Réessayer
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(sub.clientUuid)}
                          className="flex flex-1 items-center justify-center gap-1 rounded-md border border-k2l-red px-2 py-1.5 text-[11px] font-semibold text-k2l-red"
                        >
                          <RiDeleteBinLine /> Supprimer
                        </button>
                      )}
                    </div>
                  )}

                  {sub.syncStatus === 'synced' && (
                    <div className="mt-2 flex items-center gap-1 text-[11px] font-medium text-[#0F6E56]">
                      <RiCheckDoubleLine /> Envoyée au serveur
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
