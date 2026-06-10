import { useState, useEffect, useMemo } from 'react';
import api from '@/common/services/api';
import {
  RiUserStarLine,
  RiTeamLine,
  RiCheckboxCircleLine,
  RiLoader4Line,
} from 'react-icons/ri';

/* ─── Types ─── */
interface ValidationStats {
  total: number;
  byStatus: {
    draft: number;
    submitted: number;
    supervisorApproved: number;
    validated: number;
    rejectedL1: number;
    rejectedL2: number;
  };
  byType: { prospects: number; marchands: number };
  today: { total: number; validated: number };
  week: { total: number; validated: number };
  validationRate: number;
  pending: { level1: number; level2: number };
}

interface UserItem {
  id: string;
  fullName: string;
  matricule: string;
  role: string;
  isActive: boolean;
  status: string;
  supervisor?: { id: string; fullName: string } | null;
}
export default function DashboardCoordinateur() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [validationStats, setValidationStats] = useState<ValidationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [usersRes, statsRes] = await Promise.all([
          api.get('/users?limit=100'),
          api.get('/submissions/stats').catch(() => ({ data: null })),
        ]);
        setUsers(usersRes.data?.data || []);
        if (statsRes.data) setValidationStats(statsRes.data);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const superviseurs = useMemo(
    () => users.filter((u) => u.role === 'SUPERVISEUR'),
    [users],
  );

  const commerciaux = useMemo(() => {
    let result = users.filter((u) => u.role === 'COMMERCIAL');
    if (selectedSupervisorId) {
      result = result.filter((u) => u.supervisor?.id === selectedSupervisorId);
    }
    return result;
  }, [users, selectedSupervisorId]);

  const stats = useMemo(() => {
    const allCommerciaux = users.filter((u) => u.role === 'COMMERCIAL');
    return {
      superviseurs: superviseurs.filter((s) => s.isActive).length,
      totalSuperviseurs: superviseurs.length,
      commerciauxActifs: allCommerciaux.filter((c) => c.isActive).length,
      totalCommerciaux: allCommerciaux.length,
    };
  }, [superviseurs, users]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#1D9E75] border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      {/* KPIs - Validation */}
      {validationStats && (
        <>
          <div className="mb-2 font-head text-[13px] font-semibold uppercase tracking-wider text-k2l-gray-600">
            Validations
          </div>
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard
              label="Total soumissions"
              value={validationStats.total}
              icon={<RiCheckboxCircleLine />}
              bg="bg-k2l-primary-light"
            />
            <KpiCard
              label="Validées"
              value={validationStats.byStatus.validated}
              icon={<RiCheckboxCircleLine />}
              bg="bg-k2l-success-light"
            />
            <KpiCard
              label="En attente"
              value={validationStats.byStatus.submitted}
              icon={<RiLoader4Line />}
              bg="bg-k2l-amber-light"
            />
            <KpiCard
              label="Rejetées"
              value={validationStats.byStatus.rejectedL1 + validationStats.byStatus.rejectedL2}
              icon={<RiCheckboxCircleLine />}
              bg="bg-k2l-red-light"
            />
          </div>

          {/* Taux de validation + Aujourd'hui + Cette semaine */}
          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-k2l-gray-200 bg-white p-5">
              <p className="text-xs font-medium text-k2l-gray-400 uppercase tracking-wider">Taux de validation</p>
              <p className="mt-2 font-head text-4xl font-bold text-k2l-success">{validationStats.validationRate}%</p>
              <div className="mt-2 h-2 rounded-full bg-k2l-gray-100">
                <div
                  className="h-2 rounded-full bg-k2l-success transition-all"
                  style={{ width: `${validationStats.validationRate}%` }}
                />
              </div>
            </div>
            <div className="rounded-xl border border-k2l-gray-200 bg-white p-5">
              <p className="text-xs font-medium text-k2l-gray-400 uppercase tracking-wider">Aujourd'hui</p>
              <p className="mt-2 font-head text-3xl font-bold text-k2l-gray-900">{validationStats.today.total}</p>
              <p className="text-[12px] text-k2l-success font-semibold">{validationStats.today.validated} validées</p>
            </div>
            <div className="rounded-xl border border-k2l-gray-200 bg-white p-5">
              <p className="text-xs font-medium text-k2l-gray-400 uppercase tracking-wider">Cette semaine</p>
              <p className="mt-2 font-head text-3xl font-bold text-k2l-gray-900">{validationStats.week.total}</p>
              <p className="text-[12px] text-k2l-success font-semibold">{validationStats.week.validated} validées</p>
            </div>
          </div>

          {/* Par type et par statut */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-k2l-gray-200 bg-white p-5">
              <p className="text-xs font-medium text-k2l-gray-400 uppercase tracking-wider mb-3">Par type</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-k2l-gray-700">
                    <RiUserStarLine className="text-k2l-primary" /> Prospects
                  </span>
                  <span className="font-head text-lg font-bold text-k2l-gray-900">{validationStats.byType.prospects}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-k2l-gray-700">
                    <RiTeamLine className="text-k2l-amber" /> Marchands
                  </span>
                  <span className="font-head text-lg font-bold text-k2l-gray-900">{validationStats.byType.marchands}</span>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-k2l-gray-200 bg-white p-5">
              <p className="text-xs font-medium text-k2l-gray-400 uppercase tracking-wider mb-3">Par statut</p>
              <div className="space-y-2">
                <StatusRow label="Brouillons" value={validationStats.byStatus.draft} color="bg-k2l-gray-300" />
                <StatusRow label="En attente" value={validationStats.byStatus.submitted} color="bg-k2l-amber" />
                <StatusRow label="Validées" value={validationStats.byStatus.validated} color="bg-k2l-success" />
                <StatusRow label="Rejetées" value={validationStats.byStatus.rejectedL1 + validationStats.byStatus.rejectedL2} color="bg-k2l-red" />
              </div>
            </div>
          </div>
        </>
      )}

      {/* KPIs - Équipe */}
      <div className="mb-2 font-head text-[13px] font-semibold uppercase tracking-wider text-k2l-gray-600">
        Équipe
      </div>
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KpiCard
          label="Superviseurs"
          value={stats.superviseurs}
          icon={<RiUserStarLine />}
          bg="bg-k2l-amber-light"
          valueSub={`/${stats.totalSuperviseurs}`}
        />
        <KpiCard
          label="Commerciaux actifs"
          value={stats.commerciauxActifs}
          icon={<RiTeamLine />}
          bg="bg-k2l-success-light"
          valueSub={`/${stats.totalCommerciaux}`}
          sub={stats.totalCommerciaux > 0 ? `${Math.round((stats.commerciauxActifs / stats.totalCommerciaux) * 100)}%` : undefined}
          subGreen
        />
      </div>

      {/* Supervisor filter chips */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedSupervisorId('')}
          className={`rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-colors ${
            !selectedSupervisorId
              ? 'border-k2l-primary bg-k2l-primary text-white'
              : 'border-k2l-gray-200 bg-white text-k2l-gray-600 hover:bg-k2l-gray-100'
          }`}
        >
          Tous les superviseurs
        </button>
        {superviseurs.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedSupervisorId(s.id)}
            className={`rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-colors ${
              selectedSupervisorId === s.id
                ? 'border-k2l-primary bg-k2l-primary text-white'
                : 'border-k2l-gray-200 bg-white text-k2l-gray-600 hover:bg-k2l-gray-100'
            }`}
          >
            {s.fullName}
          </button>
        ))}
      </div>

      {/* Superviseurs table */}
      <div className="mb-2 font-head text-[13px] font-semibold uppercase tracking-wider text-k2l-gray-600">
        Superviseurs
      </div>
      <div className="mb-6 rounded-xl border border-k2l-gray-200 bg-white">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-k2l-gray-200">
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-k2l-gray-400">Superviseur</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-k2l-gray-400">Commerciaux</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-k2l-gray-400">Statut</th>
            </tr>
          </thead>
          <tbody>
            {superviseurs.map((sup) => {
              const nbComm = users.filter((u) => u.role === 'COMMERCIAL' && u.supervisor?.id === sup.id).length;
              return (
                <tr key={sup.id} className="border-b border-k2l-gray-100 last:border-0">
                  <td className="px-4 py-3">
                    <Initials name={sup.fullName} />
                    {sup.fullName}
                  </td>
                  <td className="px-4 py-3">{nbComm}</td>
                  <td className="px-4 py-3">
                    <StatusBadge isActive={sup.isActive} status={sup.status} />
                  </td>
                </tr>
              );
            })}
            {superviseurs.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-k2l-gray-400">Aucun superviseur</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Commerciaux filtered list */}
      {selectedSupervisorId && (
        <>
          <div className="mb-2 font-head text-[13px] font-semibold uppercase tracking-wider text-k2l-gray-600">
            Commerciaux — {superviseurs.find((s) => s.id === selectedSupervisorId)?.fullName}
          </div>
          <div className="rounded-xl border border-k2l-gray-200 bg-white">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-k2l-gray-200">
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-k2l-gray-400">Commercial</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-k2l-gray-400">Matricule</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-k2l-gray-400">Superviseur</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-k2l-gray-400">Statut</th>
                </tr>
              </thead>
              <tbody>
                {commerciaux.map((com) => (
                  <tr key={com.id} className="border-b border-k2l-gray-100 last:border-0">
                    <td className="px-4 py-3">
                      <Initials name={com.fullName} />
                      {com.fullName}
                    </td>
                    <td className="px-4 py-3 text-k2l-gray-400">{com.matricule}</td>
                    <td className="px-4 py-3 text-k2l-gray-600">{com.supervisor?.fullName || '—'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge isActive={com.isActive} status={com.status} />
                    </td>
                  </tr>
                ))}
                {commerciaux.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-k2l-gray-400">Aucun commercial</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Components ─── */
function KpiCard({
  label, value, icon, bg, sub, valueSub, subGreen,
}: {
  label: string; value: number | string; icon: React.ReactNode; bg: string; sub?: string; valueSub?: string; subGreen?: boolean;
}) {
  return (
    <div className="relative rounded-xl border border-k2l-gray-200 bg-white p-5">
      <div className={`absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg ${bg} text-[17px] text-k2l-primary`}>
        {icon}
      </div>
      <p className="text-xs font-medium text-k2l-gray-400">{label}</p>
      <p className="mt-1.5 font-head text-3xl font-bold text-k2l-gray-900">
        {value}
        {valueSub && <span className="text-base text-k2l-gray-400">{valueSub}</span>}
      </p>
      {sub && (
        <p className={`text-[12px] font-semibold ${subGreen ? 'text-k2l-success' : 'text-k2l-gray-400'}`}>
          {sub}
        </p>
      )}
    </div>
  );
}

function Initials({ name }: { name: string }) {
  const init = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-k2l-primary-light font-head text-[11px] font-bold text-k2l-primary">
      {init}
    </span>
  );
}

function StatusBadge({ isActive, status }: { isActive: boolean; status: string }) {
  if (status === 'SUSPENDU') {
    return <span className="rounded-full bg-k2l-amber-light px-2.5 py-0.5 text-[10px] font-semibold text-k2l-amber">Suspendu</span>;
  }
  if (isActive) {
    return <span className="rounded-full bg-k2l-success-light px-2.5 py-0.5 text-[10px] font-semibold text-k2l-success">Actif</span>;
  }
  return <span className="rounded-full bg-k2l-red-light px-2.5 py-0.5 text-[10px] font-semibold text-k2l-red">Inactif</span>;
}

function StatusRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
      <span className="flex-1 text-sm text-k2l-gray-700">{label}</span>
      <span className="font-head text-sm font-bold text-k2l-gray-900">{value}</span>
    </div>
  );
}
