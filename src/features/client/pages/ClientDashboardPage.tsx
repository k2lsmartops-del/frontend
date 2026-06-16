import { useState, useEffect, useMemo } from 'react';
import {
  RiUserLine,
  RiStore2Line,
  RiSmartphoneLine,
  RiBarChartLine,
  RiArrowUpLine,
  RiLoader4Line,
} from 'react-icons/ri';
import api from '@/common/services/api';
import { useFilterStore } from '@/common/stores/filter.store';

interface Stats {
  prospectsValidated: number;
  merchantsEnrolled: number;
  appActivated: number;
  totalCumulated: number;
  prospectsChange: number;
  merchantsChange: number;
  appActivatedPercent: number;
}

interface TopCommune {
  name: string;
  prospects: number;
  merchants: number;
}

interface ProfessionStat {
  profession: string;
  prospects: number;
  activatedPercent: number;
}

export default function ClientDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [topCommunes, setTopCommunes] = useState<TopCommune[]>([]);
  const [professionStats, setProfessionStats] = useState<ProfessionStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const { period } = useFilterStore();

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
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      const statsRes = await api.get('/submissions/stats');
      
      const data = statsRes.data;
      const prospectsValidated = data.byStatus?.validated || 0;
      const merchantsEnrolled = data.byType?.marchands || 0;
      const appActivatedCount = data.appActivated || 0;
      
      setStats({
        prospectsValidated,
        merchantsEnrolled,
        appActivated: appActivatedCount,
        totalCumulated: data.total || 0,
        prospectsChange: data.week?.total > 0 ? Math.round((data.week.validated / data.week.total) * 100) : 0,
        merchantsChange: data.validationRate || 0,
        appActivatedPercent: prospectsValidated > 0 ? Math.round((appActivatedCount / prospectsValidated) * 100) : 0,
      });

      // Utiliser les donnees du backend pour les communes
      if (data.topCommunes && data.topCommunes.length > 0) {
        setTopCommunes(data.topCommunes);
      } else {
        setTopCommunes([]);
      }

      // Utiliser les donnees du backend pour les professions
      if (data.professionStats && data.professionStats.length > 0) {
        setProfessionStats(data.professionStats);
      } else {
        setProfessionStats([]);
      }
    } catch (error) {
      console.error('Erreur de chargement des donnees', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <RiLoader4Line className="animate-spin text-4xl text-k2l-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <div className="relative overflow-hidden rounded-xl border border-k2l-gray-200 bg-white p-5">
          <div className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg bg-k2l-success-light">
            <RiUserLine className="text-lg text-k2l-success" />
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-400">Prospects valides</div>
          <div className="mt-2 font-head text-3xl font-bold text-k2l-gray-900">
            {stats?.prospectsValidated.toLocaleString('fr-FR')}
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-k2l-success">
            <RiArrowUpLine className="text-sm" />
            {stats?.prospectsChange}% vs mois dernier
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-k2l-gray-200 bg-white p-5">
          <div className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg bg-k2l-amber-light">
            <RiStore2Line className="text-lg text-k2l-amber" />
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-400">Marchands enroles</div>
          <div className="mt-2 font-head text-3xl font-bold text-k2l-gray-900">
            {stats?.merchantsEnrolled.toLocaleString('fr-FR')}
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-k2l-success">
            <RiArrowUpLine className="text-sm" />
            {stats?.merchantsChange}% vs mois dernier
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-k2l-gray-200 bg-white p-5">
          <div className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg bg-k2l-blue-light">
            <RiSmartphoneLine className="text-lg text-k2l-blue" />
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-400">App activee</div>
          <div className="mt-2 font-head text-3xl font-bold text-k2l-gray-900">
            {stats?.appActivated.toLocaleString('fr-FR')}
          </div>
          <div className="mt-1 text-xs font-semibold text-k2l-gray-400">
            {stats?.appActivatedPercent}% des prospects
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-k2l-gray-200 bg-white p-5">
          <div className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg bg-k2l-success-light">
            <RiBarChartLine className="text-lg text-k2l-success" />
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-400">Total cumule</div>
          <div className="mt-2 font-head text-3xl font-bold text-k2l-gray-900">
            {stats?.totalCumulated.toLocaleString('fr-FR')}
          </div>
          <div className="mt-1 text-xs font-semibold text-k2l-gray-400">
            depuis le 1er janvier
          </div>
        </div>
      </div>

      {/* Graphique */}
      <div className="rounded-xl border border-k2l-gray-200 bg-white p-5">
        <div className="mb-4">
          <h3 className="font-head text-sm font-semibold">Evolution sur 30 jours</h3>
        </div>
        <div className="flex h-[200px] items-end gap-1.5 relative">
          {chartData.map((data, i) => (
            <div 
              key={i} 
              className="flex flex-1 flex-col justify-end gap-0.5 relative group"
              onMouseEnter={() => setHoveredBar(i)}
              onMouseLeave={() => setHoveredBar(null)}
            >
              <div className="rounded-t bg-k2l-amber transition-opacity hover:opacity-80" style={{ height: data.merchantHeight }} />
              <div className="rounded-t bg-k2l-success transition-opacity hover:opacity-80" style={{ height: data.prospectHeight }} />
              {hoveredBar === i && (
                <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
                  <div>Jour {data.day}</div>
                  <div>Prospects: {data.prospectValue}</div>
                  <div>Marchands: {data.merchantValue}</div>
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

      {/* Tableaux */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-k2l-gray-200 bg-white p-5">
          <h3 className="mb-4 font-head text-sm font-semibold">Top 5 communes</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-k2l-gray-200">
                <th className="pb-2 text-left text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-400">Commune</th>
                <th className="pb-2 text-left text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-400">Prospects</th>
                <th className="pb-2 text-left text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-400">Marchands</th>
              </tr>
            </thead>
            <tbody>
              {topCommunes.map((commune) => (
                <tr key={commune.name} className="border-b border-k2l-gray-100 last:border-0">
                  <td className="py-2.5 font-medium">{commune.name}</td>
                  <td className="py-2.5">{commune.prospects}</td>
                  <td className="py-2.5">{commune.merchants}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-k2l-gray-200 bg-white p-5">
          <h3 className="mb-4 font-head text-sm font-semibold">Activite par profession</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-k2l-gray-200">
                <th className="pb-2 text-left text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-400">Profession</th>
                <th className="pb-2 text-left text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-400">Prospects</th>
                <th className="pb-2 text-left text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-400">% actives</th>
              </tr>
            </thead>
            <tbody>
              {professionStats.map((stat) => (
                <tr key={stat.profession} className="border-b border-k2l-gray-100 last:border-0">
                  <td className="py-2.5">{stat.profession}</td>
                  <td className="py-2.5">{stat.prospects}</td>
                  <td className="py-2.5">
                    <span className={`font-semibold ${stat.activatedPercent >= 60 ? 'text-k2l-success' : 'text-k2l-amber'}`}>
                      {stat.activatedPercent}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
