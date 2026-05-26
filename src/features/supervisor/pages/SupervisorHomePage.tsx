import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RiCheckboxCircleLine, RiLoader4Line, RiWifiLine, RiWifiOffLine,
  RiUserLine, RiStore2Line,
} from '@/common/icons';
import { useAuthStore } from '@/common/stores/auth.store';
import { useOnlineStatus } from '@/common/hooks/useOnlineStatus';
import api from '@/common/services/api';

interface SubmissionSummary {
  id: string;
  type: string;
  status: string;
  prospectFullName?: string;
  merchantName?: string;
  createdAt: string;
  commercial?: { fullName: string };
}

interface Stats {
  pending: number;
  validated: number;
  activeAgents: number;
  totalAgents: number;
}

export default function SupervisorHomePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isOnline = useOnlineStatus();

  const [stats, setStats] = useState<Stats>({ pending: 0, validated: 0, activeAgents: 0, totalAgents: 0 });
  const [recent, setRecent] = useState<SubmissionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      // Charger les soumissions en attente de validation (SUBMITTED)
      const { data: pendingData } = await api.get('/submissions', {
        params: { status: 'SUBMITTED', limit: 100 },
      });
      const pendingCount = pendingData.meta?.total || pendingData.data?.length || 0;

      // Charger les soumissions validées par ce superviseur
      const { data: validatedData } = await api.get('/submissions', {
        params: { status: 'SUPERVISOR_APPROVED', limit: 100 },
      });
      const validatedCount = validatedData.meta?.total || validatedData.data?.length || 0;

      // Charger l'équipe
      let activeAgents = 0;
      let totalAgents = 0;
      try {
        const { data: teamData } = await api.get('/users/team');
        totalAgents = teamData.length || 0;
        activeAgents = teamData.filter((u: { status: string }) => u.status === 'ACTIF').length;
      } catch {
        // Endpoint peut ne pas exister encore
      }

      setStats({
        pending: pendingCount,
        validated: validatedCount,
        activeAgents,
        totalAgents,
      });

      // Activité récente (dernières validations)
      setRecent((pendingData.data || []).slice(0, 3));
    } catch (err) {
      console.error('Erreur chargement données superviseur:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const initials = user?.fullName
    ?.split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? 'SV';

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `il y a ${hours}h`;
    return `il y a ${Math.floor(hours / 24)}j`;
  };

  return (
    <div className="min-h-full bg-k2l-gray-100 pb-4">
      {/* Header */}
      <div className="bg-k2l-navy px-5 pb-7 pt-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-white/40 bg-white/20 font-head text-base font-bold text-white">
            {initials}
          </div>
          <div className="flex-1">
            <div className="font-head text-base font-semibold text-white">{user?.fullName ?? 'Superviseur'}</div>
            <div className="mt-0.5 text-xs text-white/70">Superviseur · {user?.zone?.name ?? 'Zone non assignée'}</div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-2.5 py-1">
            {isOnline
              ? <><RiWifiLine className="text-sm text-k2l-success" /><span className="text-[11px] text-white">En ligne</span></>
              : <><RiWifiOffLine className="text-sm text-k2l-amber" /><span className="text-[11px] text-white">Hors-ligne</span></>}
          </div>
        </div>
      </div>

      {/* Alerte fiches en attente */}
      {stats.pending > 0 && (
        <div className="mx-4 -mt-4">
          <div className="flex items-center gap-3 rounded-xl bg-k2l-amber-light p-3 shadow-[0_2px_12px_rgba(0,0,0,0.07)]">
            <span className="text-2xl">⏳</span>
            <div>
              <div className="font-head text-sm font-semibold text-[#854F0B]">{stats.pending} fiche{stats.pending > 1 ? 's' : ''} à valider</div>
              <div className="text-[11px] text-[#854F0B]/80">En attente de votre validation</div>
            </div>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-2 px-4 py-4">
        <div className="rounded-xl bg-white p-3 text-center shadow-sm">
          <div className="font-head text-xl font-bold text-k2l-amber">{loading ? '—' : stats.pending}</div>
          <div className="mt-0.5 text-[9px] uppercase tracking-wider text-k2l-gray-400">À valider</div>
        </div>
        <div className="rounded-xl bg-white p-3 text-center shadow-sm">
          <div className="font-head text-xl font-bold text-k2l-success">{loading ? '—' : stats.validated}</div>
          <div className="mt-0.5 text-[9px] uppercase tracking-wider text-k2l-gray-400">Validées</div>
        </div>
        <div className="rounded-xl bg-white p-3 text-center shadow-sm">
          <div className="font-head text-xl font-bold text-k2l-primary">{loading ? '—' : `${stats.activeAgents}/${stats.totalAgents}`}</div>
          <div className="mt-0.5 text-[9px] uppercase tracking-wider text-k2l-gray-400">Actifs</div>
        </div>
      </div>

      {/* Bouton validation */}
      <div className="px-4 pb-4">
        <button
          onClick={() => navigate('/validation')}
          disabled={stats.pending === 0}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-k2l-success py-4 font-head text-[15px] font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50"
        >
          <RiCheckboxCircleLine className="text-lg" />
          Valider les fiches →
        </button>
      </div>

      {/* Activité récente */}
      <div className="px-4">
        <div className="mb-2 font-head text-[11px] font-semibold uppercase tracking-wider text-k2l-gray-600">
          Activité récente
        </div>
        <div className="space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RiLoader4Line className="animate-spin text-2xl text-k2l-primary" />
            </div>
          ) : recent.length === 0 ? (
            <div className="rounded-xl bg-white p-6 text-center text-sm text-k2l-gray-400 shadow-sm">
              Aucune soumission en attente
            </div>
          ) : (
            recent.map((s) => {
              const name = s.prospectFullName || s.merchantName || '—';
              const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
              const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
                SUBMITTED: { label: 'En attente', bg: 'bg-k2l-amber-light', text: 'text-[#854F0B]' },
                SUPERVISOR_APPROVED: { label: 'Validé L1', bg: 'bg-k2l-success-light', text: 'text-k2l-success' },
                VALIDATED: { label: 'Validé', bg: 'bg-k2l-success-light', text: 'text-k2l-success' },
                REJECTED_L1: { label: 'Rejeté', bg: 'bg-k2l-red-light', text: 'text-k2l-red' },
                REJECTED_L2: { label: 'Rejeté L2', bg: 'bg-k2l-red-light', text: 'text-k2l-red' },
              };
              const status = statusConfig[s.status] || { label: s.status, bg: 'bg-k2l-gray-100', text: 'text-k2l-gray-500' };
              return (
                <div
                  key={s.id}
                  onClick={() => navigate(`/validation/${s.id}`)}
                  className="flex cursor-pointer items-center gap-3 rounded-xl bg-white p-3 shadow-sm active:bg-k2l-gray-100"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-k2l-success-light font-head text-sm font-bold text-k2l-navy">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[13px] font-medium text-k2l-gray-900">{name}</span>
                      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold ${status.bg} ${status.text}`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="text-[11px] text-k2l-gray-400">
                      {s.type === 'PROSPECT' ? 'Prospect' : 'Marchand'} · {formatTimeAgo(s.createdAt)}
                    </div>
                  </div>
                  {s.type === 'PROSPECT' 
                    ? <RiUserLine className="text-lg text-k2l-gray-400" />
                    : <RiStore2Line className="text-lg text-k2l-gray-400" />
                  }
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
