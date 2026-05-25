import { type ReactNode, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RiUserLine, RiStore2Line, RiFileList3Line, RiRefreshLine,
  RiWifiLine, RiWifiOffLine, RiLoader4Line,
} from '@/common/icons';
import { useAuthStore } from '@/common/stores/auth.store';
import { useToastStore } from '@/common/stores/toast.store';
import { useOnlineStatus } from '@/common/hooks/useOnlineStatus';
import api from '@/common/services/api';
import { db } from '@/lib/offlineDb';
import { syncAllPending } from '@/lib/syncService';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  SUBMITTED: 'En attente',
  SUPERVISOR_APPROVED: 'Valide N1',
  VALIDATED: 'Valide',
  REJECTED_L1: 'Rejete N1',
  REJECTED_L2: 'Rejete N2',
};

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-k2l-gray-100 text-k2l-gray-600',
  SUBMITTED: 'bg-k2l-amber-light text-[#854F0B]',
  SUPERVISOR_APPROVED: 'bg-k2l-primary-light text-k2l-primary',
  VALIDATED: 'bg-k2l-success-light text-k2l-success',
  REJECTED_L1: 'bg-k2l-red-light text-k2l-red',
  REJECTED_L2: 'bg-k2l-red-light text-k2l-red',
};

interface Submission {
  id: string;
  type: string;
  status: string;
  prospectFullName?: string;
  merchantName?: string;
  createdAt: string;
}

export default function HomePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const showToast = useToastStore((s) => s.show);
  const isOnline = useOnlineStatus();

  const [prospects, setProspects] = useState(0);
  const [marchands, setMarchands] = useState(0);
  const [valides, setValides] = useState(0);
  const [recent, setRecent] = useState<Submission[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const { data } = await api.get('/submissions', { params: { limit: 10 } });
      const items: Submission[] = data.data || [];
      setRecent(items.slice(0, 5));
      setProspects(data.meta?.total ? items.filter((s) => s.type === 'PROSPECT').length : 0);
      setMarchands(items.filter((s) => s.type === 'MARCHAND').length);
      setValides(items.filter((s) => s.status === 'VALIDATED').length);

      // Compteurs complets via des requêtes séparées
      const [pRes, mRes] = await Promise.all([
        api.get('/submissions', { params: { type: 'PROSPECT', limit: 1 } }),
        api.get('/submissions', { params: { type: 'MARCHAND', limit: 1 } }),
      ]);
      setProspects(pRes.data.meta?.total ?? 0);
      setMarchands(mRes.data.meta?.total ?? 0);
      setValides(items.filter((s) => s.status === 'VALIDATED').length);
    } catch {
      // Silencieux si offline
    }

    // Pending local
    const pending = await db.submissions.where('syncStatus').equals('pending').count();
    setPendingCount(pending);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncAllPending();
      showToast('Synchronisation terminee', 'success');
      await loadData();
    } catch {
      showToast('Erreur de synchronisation', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const initials = user?.fullName
    ?.split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? 'AG';

  return (
    <div className="min-h-full bg-k2l-gray-100 pb-4">
      {/* Header */}
      <div className="bg-k2l-navy px-5 pb-7 pt-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-white/40 bg-white/20 font-head text-base font-bold text-white">
            {initials}
          </div>
          <div className="flex-1">
            <div className="font-head text-base font-semibold text-white">{user?.fullName ?? 'Agent K2L'}</div>
            <div className="mt-0.5 text-xs text-white/70">{user?.zone?.name ?? 'Zone non assignee'}</div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-2.5 py-1">
            {isOnline
              ? <><RiWifiLine className="text-sm text-k2l-primary-mid" /><span className="text-[11px] text-white">En ligne</span></>
              : <><RiWifiOffLine className="text-sm text-k2l-amber" /><span className="text-[11px] text-white">Hors-ligne</span></>}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="-mt-5 mb-4 grid grid-cols-3 gap-2.5 px-4">
        {[
          { label: 'Prospects', value: String(prospects), color: 'text-k2l-primary' },
          { label: 'Marchands', value: String(marchands), color: 'text-k2l-amber' },
          { label: 'Valides', value: String(valides), color: 'text-k2l-success' },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-md bg-white px-2.5 py-3 text-center shadow-[0_2px_12px_rgba(0,0,0,0.07)]">
            <div className={`font-head text-[22px] font-bold ${kpi.color}`}>{kpi.value}</div>
            <div className="mt-0.5 text-[10px] uppercase tracking-wider text-k2l-gray-400">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="mb-2.5 px-4 font-head text-[13px] font-semibold uppercase tracking-wider text-k2l-gray-600">Actions terrain</div>
      <div className="mb-6 grid grid-cols-2 gap-3 px-4">
        <ActionCard icon={<RiUserLine className="text-xl text-k2l-navy" />} bgIcon="bg-k2l-primary-light" label="Nouveau Prospect" sub="Client banque" onClick={() => navigate('/prospect')} />
        <ActionCard icon={<RiStore2Line className="text-xl text-[#854F0B]" />} bgIcon="bg-k2l-amber-light" label="Enroler Marchand" sub="Commerce partenaire" onClick={() => navigate('/marchand')} />
        <ActionCard icon={<RiFileList3Line className="text-xl text-k2l-primary" />} bgIcon="bg-k2l-primary-light" label="Historique" sub="Mes soumissions" onClick={() => navigate('/history')} />
        <ActionCard
          icon={syncing ? <RiLoader4Line className="animate-spin text-xl text-k2l-red" /> : <RiRefreshLine className="text-xl text-k2l-red" />}
          bgIcon="bg-k2l-red-light"
          label="Synchroniser"
          sub={`${pendingCount} en attente`}
          onClick={handleSync}
        />
      </div>

      {/* Recent */}
      <div className="mb-2.5 px-4 font-head text-[13px] font-semibold uppercase tracking-wider text-k2l-gray-600">Activite recente</div>
      <div className="space-y-2 px-4 pb-6">
        {recent.length === 0 ? (
          <div className="rounded-md bg-white p-8 text-center text-sm text-k2l-gray-400 shadow-sm">
            Les dernieres soumissions apparaitront ici
          </div>
        ) : (
          recent.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-md bg-white px-3.5 py-3 shadow-sm">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${s.type === 'PROSPECT' ? 'bg-k2l-primary-light' : 'bg-k2l-amber-light'}`}>
                {s.type === 'PROSPECT'
                  ? <RiUserLine className="text-sm text-k2l-navy" />
                  : <RiStore2Line className="text-sm text-[#854F0B]" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="truncate text-[13px] font-medium text-k2l-gray-900">
                  {s.prospectFullName || s.merchantName || '—'}
                </div>
                <div className="text-[11px] text-k2l-gray-400">{s.type === 'PROSPECT' ? 'Prospect' : 'Marchand'}</div>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[s.status] ?? ''}`}>
                {STATUS_LABELS[s.status] ?? s.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ActionCard({ icon, bgIcon, label, sub, onClick }: {
  icon: ReactNode; bgIcon: string; label: string; sub: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className="flex flex-col items-start rounded-lg border-[1.5px] border-transparent bg-white p-4 text-left shadow-[0_2px_10px_rgba(0,0,0,0.06)] transition-all active:scale-[0.97] hover:border-k2l-primary">
      <div className={`mb-2.5 flex h-[42px] w-[42px] items-center justify-center rounded-sm ${bgIcon}`}>{icon}</div>
      <div className="font-head text-[13px] font-semibold text-k2l-gray-900">{label}</div>
      <div className="mt-0.5 text-[11px] text-k2l-gray-400">{sub}</div>
    </button>
  );
}
