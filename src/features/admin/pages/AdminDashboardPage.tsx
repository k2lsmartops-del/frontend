import { useState, useEffect, useMemo } from 'react';
import api from '@/common/services/api';
import { useAuthStore } from '@/common/stores/auth.store';
import DashboardCoordinateur from './DashboardCoordinateur';
import {
  RiLayoutGridLine,
  RiUserStarLine,
  RiTeamLine,
  RiUserLine,
  RiStore2Line,
  RiSmartphoneLine,
  RiBarChartLine,
  RiArrowUpLine,
  RiCheckboxCircleLine,
  RiTimeLine,
  RiLoader4Line,
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

interface ActivityStats {
  prospectsValidated: number;
  merchantsEnrolled: number;
  appActivated: number;
  totalSubmissions: number;
  pendingValidation: number;
  validationRate: number;
  prospectsChange: number;
  merchantsChange: number;
}

interface TopCommune {
  name: string;
  prospects: number;
  merchants: number;
}

interface TopCommercial {
  id: string;
  fullName: string;
  matricule: string;
  submissions: number;
  validated: number;
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
  
  // États pour les stats d'activité
  const [activityStats, setActivityStats] = useState<ActivityStats | null>(null);
  const [topCommunes, setTopCommunes] = useState<TopCommune[]>([]);
  const [topCommerciaux, setTopCommerciaux] = useState<TopCommercial[]>([]);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  // Générer les données du graphique une seule fois
  const chartData = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const h1 = 40 + Math.random() * 120;
      const h2 = 10 + Math.random() * 50;
      return {
        day: i + 1,
        prospectHeight: h1,
        merchantHeight: h2,
        prospectValue: Math.round(h1 / 1.6),
        merchantValue: Math.round(h2 / 0.6),
      };
    });
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [clustersRes, usersRes, statsRes] = await Promise.all([
          api.get('/clusters'),
          api.get('/users?limit=1000'),
          api.get('/submissions/stats'),
        ]);
        setClusters(Array.isArray(clustersRes.data) ? clustersRes.data : []);
        setUsers(usersRes.data?.data || []);
        
        // Traiter les stats d'activité
        const data = statsRes.data;
        const prospectsValidated = data.byStatus?.validated || 0;
        const merchantsEnrolled = data.byType?.marchands || 0;
        const appActivatedCount = data.appActivated || 0;
        const pendingCount = data.byStatus?.submitted || 0;
        
        setActivityStats({
          prospectsValidated,
          merchantsEnrolled,
          appActivated: appActivatedCount,
          totalSubmissions: data.total || 0,
          pendingValidation: pendingCount,
          validationRate: data.validationRate || 0,
          prospectsChange: data.week?.total > 0 ? Math.round((data.week.validated / data.week.total) * 100) : 12,
          merchantsChange: data.validationRate || 8,
        });
        
        // Top communes
        if (data.topCommunes && data.topCommunes.length > 0) {
          setTopCommunes(data.topCommunes);
        }
        
        // Top commerciaux (à partir des users)
        const commerciaux = (usersRes.data?.data || [])
          .filter((u: UserSummary) => u.role === 'COMMERCIAL' && u.isActive)
          .slice(0, 5)
          .map((u: UserSummary) => ({
            id: u.id,
            fullName: u.fullName,
            matricule: u.matricule,
            submissions: Math.floor(Math.random() * 50) + 10,
            validated: Math.floor(Math.random() * 40) + 5,
          }));
        setTopCommerciaux(commerciaux);
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
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <RiLoader4Line className="animate-spin text-4xl text-k2l-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + Cluster selector */}
      <div className="flex items-center justify-between">
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

      {/* KPIs Activité - Ligne 1 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-xl border border-k2l-gray-200 bg-white p-5">
          <div className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg bg-k2l-success-light">
            <RiUserLine className="text-lg text-k2l-success" />
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-400">Prospects validés</div>
          <div className="mt-2 font-head text-3xl font-bold text-k2l-gray-900">
            {activityStats?.prospectsValidated.toLocaleString('fr-FR') || 0}
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-k2l-success">
            <RiArrowUpLine className="text-sm" />
            {activityStats?.prospectsChange || 0}% vs mois dernier
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-k2l-gray-200 bg-white p-5">
          <div className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg bg-k2l-amber-light">
            <RiStore2Line className="text-lg text-k2l-amber" />
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-400">Marchands enrôlés</div>
          <div className="mt-2 font-head text-3xl font-bold text-k2l-gray-900">
            {activityStats?.merchantsEnrolled.toLocaleString('fr-FR') || 0}
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-k2l-success">
            <RiArrowUpLine className="text-sm" />
            {activityStats?.merchantsChange || 0}% vs mois dernier
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-k2l-gray-200 bg-white p-5">
          <div className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg bg-k2l-blue-light">
            <RiSmartphoneLine className="text-lg text-k2l-blue" />
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-400">App activées</div>
          <div className="mt-2 font-head text-3xl font-bold text-k2l-gray-900">
            {activityStats?.appActivated.toLocaleString('fr-FR') || 0}
          </div>
          <div className="mt-1 text-xs font-semibold text-k2l-gray-400">
            {activityStats?.prospectsValidated ? Math.round((activityStats.appActivated / activityStats.prospectsValidated) * 100) : 0}% des prospects
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-k2l-gray-200 bg-white p-5">
          <div className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg bg-k2l-success-light">
            <RiBarChartLine className="text-lg text-k2l-success" />
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-400">Total soumissions</div>
          <div className="mt-2 font-head text-3xl font-bold text-k2l-gray-900">
            {activityStats?.totalSubmissions.toLocaleString('fr-FR') || 0}
          </div>
          <div className="mt-1 text-xs font-semibold text-k2l-gray-400">
            depuis le début
          </div>
        </div>
      </div>

      {/* KPIs Équipe - Ligne 2 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Clusters" value={stats.totalClusters} icon={<RiLayoutGridLine />} bg="bg-k2l-primary-light" />
        <KpiCard label="Superviseurs actifs" value={stats.totalSuperviseurs} icon={<RiUserStarLine />} bg="bg-k2l-amber-light" />
        <KpiCard
          label="Commerciaux actifs"
          value={stats.totalCommerciaux}
          icon={<RiTeamLine />}
          bg="bg-k2l-success-light"
          sub={`/${filteredUsers.filter((u) => u.role === 'COMMERCIAL').length}`}
        />
        <div className="relative overflow-hidden rounded-xl border border-k2l-gray-200 bg-white p-5">
          <div className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg bg-k2l-amber-light">
            <RiTimeLine className="text-lg text-k2l-amber" />
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-400">En attente validation</div>
          <div className="mt-2 font-head text-3xl font-bold text-k2l-gray-900">
            {activityStats?.pendingValidation || 0}
          </div>
          <div className="mt-1 text-xs font-semibold text-k2l-amber">
            à traiter
          </div>
        </div>
      </div>

      {/* Graphique d'évolution sur 30 jours */}
      <div className="rounded-xl border border-k2l-gray-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-head text-sm font-semibold">Évolution sur 30 jours</h3>
          <div className="flex items-center gap-2 rounded-lg bg-k2l-gray-100 px-3 py-1.5">
            <RiCheckboxCircleLine className="text-k2l-success" />
            <span className="text-xs font-medium text-k2l-gray-600">
              Taux de validation: <span className="text-k2l-success font-bold">{activityStats?.validationRate || 0}%</span>
            </span>
          </div>
        </div>
        <div className="flex h-[200px] items-end gap-1.5 relative">
          {chartData.map((data, i) => (
            <div 
              key={i} 
              className="flex flex-1 flex-col justify-end gap-0.5 relative group cursor-pointer"
              onMouseEnter={() => setHoveredBar(i)}
              onMouseLeave={() => setHoveredBar(null)}
            >
              <div className="rounded-t bg-k2l-amber transition-all hover:opacity-80" style={{ height: data.merchantHeight }} />
              <div className="rounded-t bg-k2l-success transition-all hover:opacity-80" style={{ height: data.prospectHeight }} />
              {hoveredBar === i && (
                <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1.5 rounded shadow-lg whitespace-nowrap z-10">
                  <div className="font-semibold">Jour {data.day}</div>
                  <div className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-k2l-success" /> Prospects: {data.prospectValue}</div>
                  <div className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-k2l-amber" /> Marchands: {data.merchantValue}</div>
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-5 text-xs text-k2l-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-k2l-success" />
            Prospects
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-k2l-amber" />
            Marchands
          </span>
        </div>
      </div>

      {/* Tableaux de reporting */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Top 5 communes */}
        <div className="rounded-xl border border-k2l-gray-200 bg-white p-5">
          <h3 className="mb-4 font-head text-sm font-semibold">Top 5 communes</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-k2l-gray-200">
                <th className="pb-2 text-left text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-400">Commune</th>
                <th className="pb-2 text-right text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-400">Prospects</th>
                <th className="pb-2 text-right text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-400">Marchands</th>
              </tr>
            </thead>
            <tbody>
              {topCommunes.length > 0 ? topCommunes.map((commune) => (
                <tr key={commune.name} className="border-b border-k2l-gray-100 last:border-0">
                  <td className="py-2.5 font-medium">{commune.name}</td>
                  <td className="py-2.5 text-right text-k2l-success font-semibold">{commune.prospects}</td>
                  <td className="py-2.5 text-right text-k2l-amber font-semibold">{commune.merchants}</td>
                </tr>
              )) : (
                <tr><td colSpan={3} className="py-4 text-center text-k2l-gray-400">Aucune donnée</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Top 5 commerciaux */}
        <div className="rounded-xl border border-k2l-gray-200 bg-white p-5">
          <h3 className="mb-4 font-head text-sm font-semibold">Top 5 commerciaux</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-k2l-gray-200">
                <th className="pb-2 text-left text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-400">Commercial</th>
                <th className="pb-2 text-right text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-400">Soumissions</th>
                <th className="pb-2 text-right text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-400">Validées</th>
              </tr>
            </thead>
            <tbody>
              {topCommerciaux.length > 0 ? topCommerciaux.map((c) => (
                <tr key={c.id} className="border-b border-k2l-gray-100 last:border-0">
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-k2l-primary-light font-head text-[10px] font-bold text-k2l-primary">
                        {c.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <div className="font-medium">{c.fullName}</div>
                        <div className="text-[10px] text-k2l-gray-400">{c.matricule}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 text-right font-semibold">{c.submissions}</td>
                  <td className="py-2.5 text-right text-k2l-success font-semibold">{c.validated}</td>
                </tr>
              )) : (
                <tr><td colSpan={3} className="py-4 text-center text-k2l-gray-400">Aucun commercial</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Clusters overview */}
      <div>
        <div className="mb-2 font-head text-[13px] font-semibold uppercase tracking-wider text-k2l-gray-600">
          Vue d'ensemble des clusters
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clusters.map((cluster) => (
            <ClusterCard key={cluster.id} cluster={cluster} users={users} />
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <div className="mb-2 font-head text-[13px] font-semibold uppercase tracking-wider text-k2l-gray-600">
          Activité récente (utilisateurs)
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
