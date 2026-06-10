import { useState, useEffect, useMemo } from 'react';
import api from '@/common/services/api';
import { useAuthStore } from '@/common/stores/auth.store';
import DashboardCoordinateur from './DashboardCoordinateur';
import {
  RiLayoutGridLine,
  RiUserStarLine,
  RiTeamLine,
} from 'react-icons/ri';

/* ─── Types ─── */
interface ClusterSummary {
  id: string;
  name: string;
  supervisor?: { id: string; fullName: string; matricule: string } | null;
  communes: { id: string; name: string }[];
  _count: { members: number };
}

interface UserSummary {
  id: string;
  fullName: string;
  matricule: string;
  role: string;
  isActive: boolean;
  cluster?: { id: string; name: string } | null;
  createdAt: string;
}

/* ─── Main Router ─── */
export default function AdminDashboardPage() {
  const user = useAuthStore((s) => s.user);
  if (user?.role === 'COORDINATEUR') return <DashboardCoordinateur />;
  return <DashboardAdmin />;
}

/* ─── ADMIN Dashboard ─── */
function DashboardAdmin() {
  const [clusters, setClusters] = useState<ClusterSummary[]>([]);
  const [selectedClusterId, setSelectedClusterId] = useState('');
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [clustersRes, usersRes] = await Promise.all([
          api.get('/clusters'),
          api.get('/users?limit=1000'),
        ]);
        setClusters(Array.isArray(clustersRes.data) ? clustersRes.data : []);
        setUsers(usersRes.data?.data || []);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredUsers = useMemo(() => {
    if (!selectedClusterId) return users;
    return users.filter((u) => u.cluster?.id === selectedClusterId);
  }, [users, selectedClusterId]);

  const stats = useMemo(() => {
    const src = filteredUsers;
    return {
      totalClusters: clusters.length,
      totalSuperviseurs: src.filter((u) => u.role === 'SUPERVISEUR' && u.isActive).length,
      totalCommerciaux: src.filter((u) => u.role === 'COMMERCIAL' && u.isActive).length,
      totalUsers: src.length,
    };
  }, [clusters, filteredUsers]);

  const recentUsers = useMemo(() => {
    return [...filteredUsers]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [filteredUsers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#1D9E75] border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      {/* Header + Zone selector */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-k2l-gray-400">
            Vue globale {selectedClusterId ? `— ${clusters.find((z) => z.id === selectedClusterId)?.name}` : '— tous les clusters'}
          </p>
        </div>
        <select
          value={selectedClusterId}
          onChange={(e) => setSelectedClusterId(e.target.value)}
          className="rounded-lg border border-k2l-primary bg-k2l-primary-light px-4 py-2.5 text-[13px] font-semibold text-k2l-primary-dark outline-none"
        >
          <option value="">Tous les clusters</option>
          {clusters.map((z) => (
            <option key={z.id} value={z.id}>{z.name}</option>
          ))}
        </select>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Clusters" value={stats.totalClusters} icon={<RiLayoutGridLine />} bg="bg-k2l-primary-light" />
        <KpiCard label="Superviseurs actifs" value={stats.totalSuperviseurs} icon={<RiUserStarLine />} bg="bg-k2l-amber-light" />
        <KpiCard
          label="Commerciaux actifs"
          value={stats.totalCommerciaux}
          icon={<RiTeamLine />}
          bg="bg-k2l-success-light"
          sub={`/${filteredUsers.filter((u) => u.role === 'COMMERCIAL').length}`}
        />
      </div>

      {/* Clusters overview */}
      <div className="mb-2 font-head text-[13px] font-semibold uppercase tracking-wider text-k2l-gray-600">
        Vue d'ensemble des clusters
      </div>
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {clusters.map((cluster) => (
          <ClusterCard key={cluster.id} cluster={cluster} users={users} />
        ))}
      </div>

      {/* Recent activity */}
      <div className="mb-2 font-head text-[13px] font-semibold uppercase tracking-wider text-k2l-gray-600">
        Activité récente
      </div>
      <div className="rounded-xl border border-k2l-gray-200 bg-white">
        <table className="w-full text-[13px]">
          <tbody>
            {recentUsers.map((u) => (
              <tr key={u.id} className="border-b border-k2l-gray-100 last:border-0">
                <td className="px-4 py-3">
                  <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-k2l-primary-light font-head text-[11px] font-bold text-k2l-primary">
                    {u.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                  {u.fullName}
                </td>
                <td className="px-4 py-3">
                  <RoleBadge role={u.role} />
                </td>
                <td className="px-4 py-3 text-k2l-gray-400">
                  {u.cluster?.name || '—'}
                </td>
                <td className="px-4 py-3 text-k2l-gray-400 text-[12px]">
                  {timeAgo(u.createdAt)}
                </td>
              </tr>
            ))}
            {recentUsers.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-k2l-gray-400">Aucune activité</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Components ─── */
function KpiCard({ label, value, icon, bg, sub }: { label: string; value: number; icon: React.ReactNode; bg: string; sub?: string }) {
  return (
    <div className="relative rounded-xl border border-k2l-gray-200 bg-white p-5">
      <div className={`absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg ${bg} text-[17px] text-k2l-primary`}>
        {icon}
      </div>
      <p className="text-xs font-medium text-k2l-gray-400">{label}</p>
      <p className="mt-1.5 font-head text-3xl font-bold text-k2l-gray-900">
        {value}
        {sub && <span className="text-base text-k2l-gray-400">{sub}</span>}
      </p>
    </div>
  );
}

function ClusterCard({ cluster, users }: { cluster: ClusterSummary; users: UserSummary[] }) {
  const clusterUsers = users.filter((u) => u.cluster?.id === cluster.id);
  const commerciaux = clusterUsers.filter((u) => u.role === 'COMMERCIAL').length;
  const hasSupervisor = !!cluster.supervisor;

  return (
    <div className={`rounded-xl border-l-4 bg-white p-4 shadow-sm ${hasSupervisor ? 'border-k2l-success' : 'border-k2l-red'}`}>
      <div className="font-head text-[15px] font-semibold text-k2l-gray-900">{cluster.name}</div>
      <div className="mt-1 text-[12px] leading-relaxed text-k2l-gray-400">
        {hasSupervisor
          ? `Superviseur : ${cluster.supervisor!.fullName} · ${commerciaux} commerciaux`
          : `Aucun superviseur assigné · ${commerciaux} commerciaux`}
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const cfg: Record<string, string> = {
    COORDINATEUR: 'bg-k2l-amber-light text-k2l-amber',
    SUPERVISEUR: 'bg-k2l-primary-light text-k2l-primary',
    COMMERCIAL: 'bg-k2l-gray-100 text-k2l-gray-600',
    ADMIN: 'bg-k2l-success-light text-k2l-success',
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${cfg[role] || cfg.COMMERCIAL}`}>
      {role === 'COORDINATEUR' ? 'Coordinateur' : role === 'SUPERVISEUR' ? 'Superviseur' : role === 'COMMERCIAL' ? 'Commercial' : role}
    </span>
  );
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `il y a ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}
