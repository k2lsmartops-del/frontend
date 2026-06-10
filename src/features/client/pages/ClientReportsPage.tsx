import { useState } from 'react';
import {
  RiBarChart2Line,
  RiCalendarLine,
  RiSettings3Line,
  RiDownloadLine,
  RiLightbulbLine,
} from 'react-icons/ri';

interface Report {
  id: string;
  name: string;
  period: string;
  format: string;
  date: string;
}

export default function ClientReportsPage() {
  const [reports] = useState<Report[]>([
    { id: '1', name: 'Rapport mensuel - Avril 2026', period: '01/04 - 30/04', format: 'PDF', date: '05/05/2026' },
    { id: '2', name: 'Rapport hebdo - S18', period: '22/04 - 28/04', format: 'PDF', date: '29/04/2026' },
    { id: '3', name: 'Export prospects Yopougon', period: '01/04 - 30/04', format: 'Excel', date: '02/05/2026' },
  ]);

  return (
    <div className="space-y-5">
      <p className="text-sm text-k2l-gray-500">
        Telechargez les rapports d'activite au format PDF ou Excel.
      </p>

      {/* Report Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="cursor-pointer rounded-xl border border-k2l-gray-200 bg-white p-5 text-center transition-all hover:-translate-y-0.5 hover:border-k2l-success hover:shadow-lg">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-k2l-success-light">
            <RiBarChart2Line className="text-2xl text-k2l-success" />
          </div>
          <div className="font-head text-sm font-semibold">Rapport mensuel</div>
          <div className="mt-1 text-[11px] text-k2l-gray-400">
            Synthese complete du mois<br />graphiques + chiffres cles
          </div>
        </div>

        <div className="cursor-pointer rounded-xl border border-k2l-gray-200 bg-white p-5 text-center transition-all hover:-translate-y-0.5 hover:border-k2l-success hover:shadow-lg">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-k2l-blue-light">
            <RiCalendarLine className="text-2xl text-k2l-blue" />
          </div>
          <div className="font-head text-sm font-semibold">Rapport hebdomadaire</div>
          <div className="mt-1 text-[11px] text-k2l-gray-400">
            Activite de la semaine<br />evolution jour par jour
          </div>
        </div>

        <div className="cursor-pointer rounded-xl border border-k2l-gray-200 bg-white p-5 text-center transition-all hover:-translate-y-0.5 hover:border-k2l-success hover:shadow-lg">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-k2l-amber-light">
            <RiSettings3Line className="text-2xl text-k2l-amber" />
          </div>
          <div className="font-head text-sm font-semibold">Rapport personnalise</div>
          <div className="mt-1 text-[11px] text-k2l-gray-400">
            Choisissez periode,<br />communes et types
          </div>
        </div>
      </div>

      {/* Historique */}
      <div className="rounded-xl border border-k2l-gray-200 bg-white p-5">
        <h3 className="mb-4 font-head text-sm font-semibold">Historique des rapports generes</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-k2l-gray-200">
              <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-400">Nom</th>
              <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-400">Periode</th>
              <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-400">Format</th>
              <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-400">Date</th>
              <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-400"></th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id} className="border-b border-k2l-gray-100 last:border-0">
                <td className="py-3">{report.name}</td>
                <td className="py-3 text-k2l-gray-500">{report.period}</td>
                <td className="py-3 text-k2l-gray-500">{report.format}</td>
                <td className="py-3 text-k2l-gray-500">{report.date}</td>
                <td className="py-3">
                  <button className="flex items-center gap-1.5 rounded-lg border border-k2l-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-k2l-gray-600 hover:border-k2l-success hover:text-k2l-success">
                    <RiDownloadLine className="text-sm" />
                    Telecharger
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Hint */}
      <div className="flex items-start gap-3 rounded-xl border border-dashed border-k2l-gray-300 bg-white p-4">
        <RiLightbulbLine className="mt-0.5 flex-shrink-0 text-lg text-k2l-amber" />
        <p className="text-xs text-k2l-gray-500">
          L'export des donnees detaillees (fiches individuelles) sera disponible selon les accords contractuels. 
          Les KPIs et syntheses statistiques sont toujours exportables.
        </p>
      </div>
    </div>
  );
}
