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
  RiEditLine,
  RiSmartphoneLine,
  RiCloudLine,
  RiCloseLine,
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
import { submissionService } from '@/features/submissions/services/submission.service';
import api from '@/common/services/api';
import type { Submission } from '@/common/types';

// Onglets principaux
type Tab = 'local' | 'server';

// Filtres pour les soumissions locales
type LocalFilter = 'all' | 'pending' | 'failed' | 'synced';

const LOCAL_FILTERS: { value: LocalFilter; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'pending', label: 'En attente' },
  { value: 'failed', label: 'Échouées' },
  { value: 'synced', label: 'Synchronisées' },
];

// Filtres pour les soumissions serveur (historique)
type ServerFilter = 'all' | 'prospect' | 'marchand' | 'pending' | 'validated' | 'rejected';

const SERVER_FILTERS: { key: ServerFilter; label: string }[] = [
  { key: 'all', label: 'Tout' },
  { key: 'prospect', label: 'Prospects' },
  { key: 'marchand', label: 'Marchands' },
  { key: 'pending', label: 'En attente' },
  { key: 'validated', label: 'Validés' },
  { key: 'rejected', label: 'Rejetés' },
];

const LOCAL_STATUS_META: Record<string, { label: string; badge: string; border: string }> = {
  pending: { label: 'En attente', badge: 'bg-k2l-amber-light text-[#854F0B]', border: 'border-l-[#EF9F27]' },
  syncing: { label: 'Synchronisation…', badge: 'bg-[#E6F1FB] text-[#1F5C99]', border: 'border-l-[#1F5C99]' },
  synced: { label: 'Synchronisée', badge: 'bg-k2l-success-light text-[#0F6E56]', border: 'border-l-[#1D9E75]' },
  failed: { label: 'Échec', badge: 'bg-k2l-red-light text-k2l-red', border: 'border-l-k2l-red' },
};

const SERVER_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  SUBMITTED: 'En attente',
  SUPERVISOR_APPROVED: 'Validé N1',
  VALIDATED: 'Validé',
  REJECTED: 'Rejeté',
  REJECTED_L1: 'Rejeté N1',
  REJECTED_L2: 'Rejeté N2',
};

const SERVER_STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-k2l-gray-100 text-k2l-gray-600',
  SUBMITTED: 'bg-k2l-amber-light text-[#854F0B]',
  SUPERVISOR_APPROVED: 'bg-k2l-primary-light text-k2l-primary',
  VALIDATED: 'bg-k2l-success-light text-k2l-success',
  REJECTED: 'bg-k2l-red-light text-k2l-red',
  REJECTED_L1: 'bg-k2l-red-light text-k2l-red',
  REJECTED_L2: 'bg-k2l-red-light text-k2l-red',
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

export default function MesSoumissionsPage() {
  const navigate = useNavigate();
  const showToast = useToastStore((s) => s.show);

  // Onglet actif
  const [tab, setTab] = useState<Tab>('local');

  // === État pour onglet LOCAL ===
  const [localSubmissions, setLocalSubmissions] = useState<OfflineSubmission[]>([]);
  const [photoCounts, setPhotoCounts] = useState<Map<string, number>>(new Map());
  const [localFilter, setLocalFilter] = useState<LocalFilter>('all');
  const [localLoading, setLocalLoading] = useState(true);
  const [syncingAll, setSyncingAll] = useState(false);

  // === État pour onglet SERVEUR (historique) ===
  const [serverSubmissions, setServerSubmissions] = useState<Submission[]>([]);
  const [serverFilter, setServerFilter] = useState<ServerFilter>('all');
  const [serverLoading, setServerLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Charger les soumissions locales
  const loadLocal = useCallback(async () => {
    const list = await getLocalSubmissions();
    const counts = await getPhotoCounts(list.map((s) => s.clientUuid));
    setLocalSubmissions(list);
    setPhotoCounts(counts);
    setLocalLoading(false);
  }, []);

  // Charger les soumissions serveur
  const loadServer = useCallback(async () => {
    setServerLoading(true);
    try {
      const params: Record<string, string | number | undefined> = { limit: 50 };
      if (serverFilter === 'prospect') params.type = 'PROSPECT';
      if (serverFilter === 'marchand') params.type = 'MARCHAND';
      if (serverFilter === 'pending') params.status = 'SUBMITTED';
      if (serverFilter === 'validated') params.status = 'VALIDATED';
      if (serverFilter === 'rejected') params.status = 'REJECTED';
      const res = await submissionService.list(params);
      setServerSubmissions(res.data);
    } catch {
      setServerSubmissions([]);
    } finally {
      setServerLoading(false);
    }
  }, [serverFilter]);

  // Effet pour charger les données locales
  useEffect(() => {
    loadLocal();
    const onSync = () => loadLocal();
    window.addEventListener('k2l-sync', onSync as EventListener);
    const interval = setInterval(loadLocal, 4000);
    return () => {
      window.removeEventListener('k2l-sync', onSync as EventListener);
      clearInterval(interval);
    };
  }, [loadLocal]);

  // Effet pour charger les données serveur quand on change d'onglet ou de filtre
  useEffect(() => {
    if (tab === 'server') {
      loadServer();
    }
  }, [tab, loadServer]);

  // === Actions LOCAL ===
  const handleSyncAll = async () => {
    if (!navigator.onLine) {
      showToast('Vous êtes hors ligne', 'offline');
      return;
    }
    setSyncingAll(true);
    try {
      await syncAllPending();
      await loadLocal();
    } finally {
      setSyncingAll(false);
    }
  };

  const handleRetry = async (clientUuid: string) => {
    await retrySubmission(clientUuid);
    showToast('Nouvelle tentative lancée', 'info');
    await loadLocal();
  };

  const handleDeleteLocal = async (clientUuid: string) => {
    if (!window.confirm('Êtes-vous sûr ? Les données seront définitivement perdues.')) return;
    await deleteSubmission(clientUuid);
    showToast('Fiche supprimée', 'success');
    await loadLocal();
  };

  // === Actions SERVEUR ===
  const handleDeleteServer = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Supprimer cette soumission ?')) return;
    setDeleting(id);
    try {
      await api.delete(`/submissions/${id}`);
      setServerSubmissions((prev) => prev.filter((s) => s.id !== id));
      showToast('Soumission supprimée', 'success');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur';
      showToast(msg, 'error');
    } finally {
      setDeleting(null);
    }
  };

  const handleResubmit = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Re-soumettre cette fiche pour validation ?')) return;
    try {
      await api.post(`/submissions/${id}/resubmit`);
      showToast('Fiche re-soumise', 'success');
      loadServer();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur';
      showToast(msg, 'error');
    }
  };

  // Filtrage local
  const filteredLocal = localSubmissions.filter((s) => {
    if (localFilter === 'all') return true;
    if (localFilter === 'pending') return s.syncStatus === 'pending' || s.syncStatus === 'syncing';
    return s.syncStatus === localFilter;
  });

  const pendingCount = localSubmissions.filter(
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

      {/* Onglets */}
      <div className="flex border-b border-k2l-gray-200 bg-white">
        <button
          onClick={() => setTab('local')}
          className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
            tab === 'local' ? 'border-b-2 border-k2l-primary text-k2l-primary' : 'text-k2l-gray-500'
          }`}
        >
          <RiSmartphoneLine /> Local {pendingCount > 0 && <span className="rounded-full bg-k2l-red px-1.5 text-[10px] text-white">{pendingCount}</span>}
        </button>
        <button
          onClick={() => setTab('server')}
          className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
            tab === 'server' ? 'border-b-2 border-k2l-primary text-k2l-primary' : 'text-k2l-gray-500'
          }`}
        >
          <RiCloudLine /> Historique
        </button>
      </div>

      <div className="flex-1 space-y-3 p-4">
        {/* ═══════════════════ ONGLET LOCAL ═══════════════════ */}
        {tab === 'local' && (
          <>
            {/* Bouton tout synchroniser */}
            <button
              onClick={handleSyncAll}
              disabled={syncingAll || pendingCount === 0}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-k2l-primary py-3 font-head text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {syncingAll ? <RiLoader4Line className="animate-spin text-base" /> : <RiRefreshLine className="text-base" />}
              {syncingAll ? 'Synchronisation en cours…' : pendingCount > 0 ? `Tout synchroniser (${pendingCount})` : 'Tout est synchronisé'}
            </button>

            {/* Filtres locaux */}
            <div className="flex flex-wrap gap-1.5">
              {LOCAL_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setLocalFilter(f.value)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    localFilter === f.value ? 'bg-k2l-navy text-white' : 'border border-k2l-gray-200 bg-white text-k2l-gray-600'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Liste locale */}
            {localLoading ? (
              <div className="flex items-center justify-center py-16">
                <RiLoader4Line className="animate-spin text-2xl text-k2l-primary" />
              </div>
            ) : filteredLocal.length === 0 ? (
              <div className="py-16 text-center text-sm text-k2l-gray-400">Aucune soumission locale</div>
            ) : (
              <div className="space-y-2.5">
                {filteredLocal.map((sub) => {
                  const meta = LOCAL_STATUS_META[sub.syncStatus] ?? LOCAL_STATUS_META.pending;
                  const f = sub.formData as Record<string, unknown>;
                  const name = (f.prospectFullName as string) || (f.merchantName as string) || (sub.type === 'PROSPECT' ? 'Prospect sans nom' : 'Marchand sans nom');
                  const TypeIcon = sub.type === 'PROSPECT' ? RiUserLine : RiStore2Line;
                  const nbPhotos = photoCounts.get(sub.clientUuid) ?? 0;
                  const canRetry = sub.syncStatus === 'failed';
                  const canDelete = sub.syncStatus === 'pending' || sub.syncStatus === 'failed';

                  return (
                    <div key={sub.clientUuid} className={`rounded-lg border-l-4 ${meta.border} border-y border-r border-k2l-gray-200 bg-white p-3`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-start gap-2">
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-k2l-gray-100">
                            <TypeIcon className="text-base text-k2l-gray-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-head text-sm font-bold text-k2l-gray-900">{name}</p>
                            <p className="text-[11px] text-k2l-gray-400">{sub.type === 'PROSPECT' ? 'Prospect' : 'Marchand'}</p>
                          </div>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.badge}`}>{meta.label}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-[11px] text-k2l-gray-400">
                        <span className="flex items-center gap-1"><RiTimeLine /> {formatDate(sub.createdAt)}</span>
                        <span className="flex items-center gap-1"><RiImageLine /> {nbPhotos} photo{nbPhotos > 1 ? 's' : ''}</span>
                      </div>
                      {sub.syncStatus === 'failed' && sub.lastError && (
                        <p className="mt-2 flex items-start gap-1 rounded bg-k2l-red-light px-2 py-1 text-[11px] text-k2l-red">
                          <RiErrorWarningLine className="mt-0.5 shrink-0" />
                          <span className="break-words">{sub.lastError}</span>
                        </p>
                      )}
                      {(canRetry || canDelete) && (
                        <div className="mt-2.5 flex gap-2">
                          {canRetry && (
                            <button onClick={() => handleRetry(sub.clientUuid)} className="flex flex-1 items-center justify-center gap-1 rounded-md bg-k2l-primary px-2 py-1.5 text-[11px] font-semibold text-white">
                              <RiRefreshLine /> Réessayer
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => handleDeleteLocal(sub.clientUuid)} className="flex flex-1 items-center justify-center gap-1 rounded-md border border-k2l-red px-2 py-1.5 text-[11px] font-semibold text-k2l-red">
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
          </>
        )}

        {/* ═══════════════════ ONGLET SERVEUR (HISTORIQUE) ═══════════════════ */}
        {tab === 'server' && (
          <>
            {/* Filtres serveur */}
            <div className="flex flex-wrap gap-1.5">
              {SERVER_FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setServerFilter(f.key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    serverFilter === f.key ? 'bg-k2l-navy text-white' : 'border border-k2l-gray-200 bg-white text-k2l-gray-600'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Liste serveur */}
            {serverLoading ? (
              <div className="flex items-center justify-center py-16">
                <RiLoader4Line className="animate-spin text-2xl text-k2l-primary" />
              </div>
            ) : serverSubmissions.length === 0 ? (
              <div className="py-16 text-center text-sm text-k2l-gray-400">Aucune soumission pour ce filtre</div>
            ) : (
              <div className="space-y-2.5">
                {serverSubmissions.map((s) => {
                  const canEdit = s.status === 'DRAFT' || s.status === 'SUBMITTED';
                  const isRejected = s.status === 'REJECTED';
                  return (
                    <div
                      key={s.id}
                      className={`rounded-md bg-white p-3.5 shadow-[0_1px_6px_rgba(0,0,0,0.05)] ${canEdit ? 'cursor-pointer' : ''}`}
                      onClick={() => canEdit && navigate(`/submissions/${s.id}/edit`)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-sm text-xl ${s.type === 'PROSPECT' ? 'bg-k2l-primary-light' : 'bg-k2l-amber-light'}`}>
                          {s.type === 'PROSPECT' ? <RiUserLine className="text-lg text-k2l-navy" /> : <RiStore2Line className="text-lg text-[#854F0B]" />}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-k2l-gray-900">
                            {s.type === 'PROSPECT' ? s.prospectFullName : s.merchantName}
                          </div>
                          <div className="mt-0.5 text-[11px] text-k2l-gray-400">
                            {s.type === 'PROSPECT' ? 'Prospect' : 'Marchand'} · {s.commune} · {s.type === 'PROSPECT' ? s.prospectPhone : s.merchantPhone}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <span className="text-[11px] text-k2l-gray-400">
                            {new Date(s.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${SERVER_STATUS_STYLES[s.status] ?? ''}`}>
                            {SERVER_STATUS_LABELS[s.status] ?? s.status}
                          </span>
                        </div>
                      </div>
                      {/* Motif de rejet */}
                      {isRejected && s.rejectionReason && (
                        <div className="mt-2 flex items-start gap-2 rounded-md bg-k2l-red-light p-2.5">
                          <RiCloseLine className="mt-0.5 shrink-0 text-sm text-k2l-red" />
                          <div>
                            <div className="text-[10px] font-semibold text-k2l-red">Motif du rejet</div>
                            <div className="text-[11px] text-k2l-gray-700">{s.rejectionReason}</div>
                          </div>
                        </div>
                      )}
                      {/* Actions */}
                      {canEdit && (
                        <div className="mt-2 flex items-center gap-3 border-t border-k2l-gray-100 pt-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/submissions/${s.id}/edit`); }}
                            className="flex items-center gap-0.5 text-[10px] font-medium text-k2l-primary"
                          >
                            <RiEditLine className="text-xs" /> Modifier
                          </button>
                          <button
                            onClick={(e) => handleDeleteServer(s.id, e)}
                            disabled={deleting === s.id}
                            className="flex items-center gap-0.5 text-[10px] font-medium text-k2l-red disabled:opacity-50"
                          >
                            <RiDeleteBinLine className="text-xs" /> Supprimer
                          </button>
                        </div>
                      )}
                      {/* Bouton re-soumettre pour les rejetées */}
                      {isRejected && (
                        <div className="mt-2 flex items-center gap-3 border-t border-k2l-gray-100 pt-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/submissions/${s.id}/edit`); }}
                            className="flex items-center gap-0.5 text-[10px] font-medium text-k2l-primary"
                          >
                            <RiEditLine className="text-xs" /> Modifier
                          </button>
                          <button
                            onClick={(e) => handleResubmit(s.id, e)}
                            className="flex items-center gap-0.5 text-[10px] font-medium text-k2l-success"
                          >
                            <RiRefreshLine className="text-xs" /> Re-soumettre
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
