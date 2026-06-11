import { useState, useEffect } from 'react';
import {
  RiUserLine,
  RiStore2Line,
  RiSmartphoneLine,
  RiBarChartLine,
  RiArrowUpLine,
  RiArrowRightLine,
  RiMapPinLine,
  RiLoader4Line,
} from 'react-icons/ri';
import api from '@/common/services/api';

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

  useEffect(() => {
    loadData();
  }, []);

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

      {/* Graphique + Carte */}
      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3 rounded-xl border border-k2l-gray-200 bg-white p-5">
          <div className="mb-4">
            <h3 className="font-head text-sm font-semibold">Evolution sur 30 jours</h3>
          </div>
          <div className="flex h-[200px] items-end gap-1.5">
            {Array.from({ length: 30 }).map((_, i) => {
              const h1 = 40 + Math.random() * 120;
              const h2 = 10 + Math.random() * 50;
              return (
                <div key={i} className="flex flex-1 flex-col justify-end gap-0.5">
                  <div className="rounded-t bg-k2l-amber" style={{ height: h2 }} />
                  <div className="rounded-t bg-k2l-success" style={{ height: h1 }} />
                </div>
              );
            })}
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

        <div className="col-span-2 rounded-xl border border-k2l-gray-200 bg-white p-5">
          <h3 className="mb-4 font-head text-sm font-semibold">Couverture geographique</h3>
          <div className="relative h-[200px] overflow-hidden rounded-lg border border-k2l-gray-200 bg-gradient-to-br from-k2l-gray-100 to-k2l-gray-200">
            <div className="absolute bottom-0 left-0 right-0 h-[38%] bg-gradient-to-t from-k2l-blue/20 to-transparent" />
            <RiMapPinLine className="absolute left-[22%] top-[25%] text-lg text-k2l-success" />
            <RiMapPinLine className="absolute left-[30%] top-[30%] text-lg text-k2l-success" />
            <RiStore2Line className="absolute left-[50%] top-[38%] text-lg text-k2l-amber" />
            <RiMapPinLine className="absolute left-[58%] top-[44%] text-lg text-k2l-success" />
            <RiMapPinLine className="absolute left-[62%] top-[33%] text-lg text-k2l-success" />
            <RiStore2Line className="absolute left-[40%] top-[50%] text-lg text-k2l-amber" />
          </div>
          <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-k2l-gray-400">
            <RiMapPinLine className="text-sm" />
            12 communes couvertes - 4 clusters actifs
          </div>
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
