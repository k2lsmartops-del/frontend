import { useState, useEffect, useMemo } from 'react';
import api from '@/common/services/api';
import { useAuthStore } from '@/common/stores/auth.store';
import {
  RiMap2Line,
  RiUserStarLine,
  RiTeamLine,
  RiMapPinLine,
} from 'react-icons/ri';

/* ─── Types ─── */
interface SecteurSummary {
  id: string;
  name: string;
  supervisor?: { id: string; fullName: string; matricule: string } | null;
  _count: { quartiers: number; members: number };
}

interface UserItem {
  id: string;
  fullName: string;
  matricule: string;
  role: string;
  isActive: boolean;
  status: string;
  secteur?: { id: string; name: string } | null;
  supervisor?: { id: string; fullName: string } | null;
}

/* ─── Page principale ─── */
export default function DashboardCoordinateur() {
  const user = useAuthStore((s) => s.user);
  const [secteurs, setSecteurs] = useState<SecteurSummary[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSecteurId, setSelectedSecteurId] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [secteursRes, usersRes] = await Promise.all([
          api.get('/secteurs'),
          api.get('/users?limit=100'),
        ]);
        setSecteurs(Array.isArray(secteursRes.data) ? secteursRes.data : []);
        setUsers(usersRes.data?.data || []);
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
    if (selectedSecteurId) {
      result = result.filter((u) => u.secteur?.id === selectedSecteurId);
    }
    return result;
  }, [users, selectedSecteurId]);

  const stats = useMemo(() => {
    const allCommerciaux = users.filter((u) => u.role === 'COMMERCIAL');
    return {
      secteurs: secteurs.length,
      superviseurs: superviseurs.filter((s) => s.isActive).length,
      totalSuperviseurs: secteurs.length,
      commerciauxActifs: allCommerciaux.filter((c) => c.isActive).length,
      totalCommerciaux: allCommerciaux.length,
      quartiers: secteurs.reduce((a, s) => a + s._count.quartiers, 0),
    };
  }, [secteurs, superviseurs, users]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#1D9E75] border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <p className="mb-5 text-xs text-k2l-gray-400">
        Zone : {user?.zone?.name || 'Non assignée'}
      </p>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Mes secteurs" value={stats.secteurs} icon={<RiMap2Line />} bg="bg-k2l-primary-light" sub="dans ma zone" />
        <KpiCard
          label="Mes superviseurs"
          value={stats.superviseurs}
          icon={<RiUserStarLine />}
          bg="bg-k2l-amber-light"
          sub={stats.superviseurs < stats.totalSuperviseurs ? `${stats.totalSuperviseurs - stats.superviseurs} secteur(s) sans sup.` : undefined}
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
        <KpiCard label="Quartiers couverts" value={stats.quartiers} icon={<RiMapPinLine />} bg="bg-k2l-primary-light" />
      </div>

      {/* Secteur filter chips */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedSecteurId('')}
          className={`rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-colors ${
            !selectedSecteurId
              ? 'border-k2l-primary bg-k2l-primary text-white'
              : 'border-k2l-gray-200 bg-white text-k2l-gray-600 hover:bg-k2l-gray-100'
          }`}
        >
          Tous les secteurs
        </button>
        {secteurs.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedSecteurId(s.id)}
            className={`rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-colors ${
              selectedSecteurId === s.id
                ? 'border-k2l-primary bg-k2l-primary text-white'
                : 'border-k2l-gray-200 bg-white text-k2l-gray-600 hover:bg-k2l-gray-100'
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Secteurs cards */}
      <div className="mb-2 font-head text-[13px] font-semibold uppercase tracking-wider text-k2l-gray-600">
        Mes secteurs
      </div>
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {secteurs.map((secteur) => {
          const nbComm = users.filter((u) => u.role === 'COMMERCIAL' && u.secteur?.id === secteur.id).length;
          const hasSup = !!secteur.supervisor;
          return (
            <div
              key={secteur.id}
              className={`rounded-xl border-l-4 bg-white p-4 shadow-sm ${hasSup ? 'border-k2l-success' : 'border-k2l-red'}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-head text-[15px] font-semibold text-k2l-gray-900">{secteur.name}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                    hasSup ? 'bg-k2l-success-light text-k2l-success' : 'bg-k2l-red-light text-k2l-red'
                  }`}
                >
                  {hasSup ? secteur.supervisor!.fullName : 'Non assigné'}
                </span>
              </div>
              <div className="mt-2 text-[12px] text-k2l-gray-400">
                {secteur._count.quartiers} quartiers · {nbComm} commerciaux
              </div>
            </div>
          );
        })}
      </div>

      {/* Superviseurs table */}
      <div className="mb-2 font-head text-[13px] font-semibold uppercase tracking-wider text-k2l-gray-600">
        Mes superviseurs
      </div>
      <div className="mb-6 rounded-xl border border-k2l-gray-200 bg-white">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-k2l-gray-200">
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-k2l-gray-400">Superviseur</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-k2l-gray-400">Secteur</th>
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
                  <td className="px-4 py-3 text-k2l-gray-600">{sup.secteur?.name || '—'}</td>
                  <td className="px-4 py-3">{nbComm}</td>
                  <td className="px-4 py-3">
                    <StatusBadge isActive={sup.isActive} status={sup.status} />
                  </td>
                </tr>
              );
            })}
            {superviseurs.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-k2l-gray-400">Aucun superviseur</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Commerciaux filtered list */}
      {selectedSecteurId && (
        <>
          <div className="mb-2 font-head text-[13px] font-semibold uppercase tracking-wider text-k2l-gray-600">
            Commerciaux — {secteurs.find((s) => s.id === selectedSecteurId)?.name}
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
  label: string; value: number; icon: React.ReactNode; bg: string; sub?: string; valueSub?: string; subGreen?: boolean;
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
