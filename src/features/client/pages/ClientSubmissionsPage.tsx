import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  RiLoader4Line,
  RiUserLine,
  RiCloseLine,
  RiMapPin2Line,
  RiCalendarLine,
  RiIdCardLine,
  RiSmartphoneLine,
  RiFileList3Line,
  RiFileExcel2Line,
} from 'react-icons/ri';
import * as XLSX from 'xlsx';
import api from '@/common/services/api';

interface Submission {
  id: string;
  type: string;
  status: string;
  prospectFullName?: string;
  prospectPhone?: string;
  prospectGender?: string;
  prospectAge?: number;
  merchantName?: string;
  merchantOwner?: string;
  merchantPhone?: string;
  merchantActivity?: string;
  merchantRccm?: string;
  commune?: string;
  quartier?: string;
  appStatus?: string;
  createdAt: string;
  submittedAt?: string;
  level2At?: string;
  commercial?: { fullName: string; matricule: string; sponsorCode?: string };
}

export default function ClientSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [appStatusFilter, setAppStatusFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const loadSubmissions = useCallback(async () => {
    try {
      const params: any = { status: 'VALIDATED', limit: 100 };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await api.get('/submissions', { params });
      setSubmissions(res.data.data || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const filteredSubmissions = useMemo(() => {
    if (!appStatusFilter) return submissions;
    return submissions.filter(s => s.appStatus === appStatusFilter);
  }, [submissions, appStatusFilter]);

  const handleExport = useCallback(() => {
    const data = filteredSubmissions.map((s) => ({
      ID: s.id,
      Type: s.type === 'PROSPECT' ? 'Prospect' : 'Marchand',
      Statut: s.status,
      'Statut App': s.appStatus === 'INSTALLED_ACTIVATED' ? 'Installée + Activée' : s.appStatus === 'INSTALLED' ? 'Installée' : 'N/A',
      'Nom prospect / commerce': s.type === 'PROSPECT' ? s.prospectFullName : s.merchantName,
      'Téléphone prospect / commerce': s.type === 'PROSPECT' ? s.prospectPhone : s.merchantPhone,
      'Propriétaire / Genre': s.type === 'PROSPECT' ? s.prospectGender : s.merchantOwner,
      'Âge / Activité / RCCM': s.type === 'PROSPECT'
        ? (s.prospectAge ? `${s.prospectAge} ans` : '-')
        : `Activité: ${s.merchantActivity || '-'} / RCCM: ${s.merchantRccm || '-'}`,
      Commune: s.commune || '-',
      Quartier: s.quartier || '-',
      'Commercial': s.commercial?.fullName || '-',
      'Matricule commercial': s.commercial?.matricule || '-',
      'Code parrain commercial': s.commercial?.sponsorCode || '-',
      'Date de soumission': s.submittedAt
        ? new Date(s.submittedAt).toLocaleDateString('fr-FR')
        : new Date(s.createdAt).toLocaleDateString('fr-FR'),
      'Heure de soumission': s.submittedAt
        ? new Date(s.submittedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        : new Date(s.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      'Date de création': new Date(s.createdAt).toLocaleDateString('fr-FR'),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Soumissions');
    const today = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `soumissions_${today}.xlsx`);
  }, [filteredSubmissions]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RiLoader4Line className="animate-spin text-3xl text-k2l-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-head text-lg font-semibold text-k2l-gray-800 mb-4">
          Historique des validations
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-k2l-gray-200 bg-white px-3 py-2">
            <span className="text-xs font-medium text-k2l-gray-500">Statut App:</span>
            <select
              value={appStatusFilter}
              onChange={(e) => setAppStatusFilter(e.target.value)}
              className="rounded-md border-0 bg-transparent text-xs font-semibold text-k2l-gray-700 outline-none focus:ring-0 cursor-pointer"
            >
              <option value="">Tous</option>
              <option value="INSTALLED">Installée</option>
              <option value="INSTALLED_ACTIVATED">Installée + Activée</option>
            </select>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-k2l-gray-200 bg-white px-3 py-2">
            <span className="text-xs font-medium text-k2l-gray-500">Du:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-md border-0 bg-transparent text-xs font-semibold text-k2l-gray-700 outline-none focus:ring-0 cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-k2l-gray-200 bg-white px-3 py-2">
            <span className="text-xs font-medium text-k2l-gray-500">Au:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-md border-0 bg-transparent text-xs font-semibold text-k2l-gray-700 outline-none focus:ring-0 cursor-pointer"
            />
          </div>
          <button
            onClick={loadSubmissions}
            className="flex items-center gap-1.5 rounded-lg bg-k2l-primary px-3 py-2 text-xs font-medium text-white hover:bg-k2l-primary/90 transition-colors"
          >
            <RiCalendarLine className="text-sm" />
            Filtrer
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded-lg bg-k2l-success px-3 py-2 text-xs font-medium text-white hover:bg-k2l-success/90 transition-colors"
          >
            <RiFileExcel2Line className="text-sm" />
            Exporter Excel
          </button>
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                loadSubmissions();
              }}
              className="flex items-center gap-1.5 rounded-lg bg-k2l-gray-100 px-3 py-2 text-xs font-medium text-k2l-gray-600 hover:bg-k2l-gray-200 transition-colors"
            >
              <RiCloseLine className="text-sm" />
              Effacer
            </button>
          )}
        </div>
      </div>

      {filteredSubmissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-k2l-gray-400">
          <RiFileList3Line className="mb-2 text-4xl" />
          <p className="text-sm">Aucune soumission trouvée</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-k2l-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-k2l-gray-200 bg-k2l-gray-50">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-400">Type</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-400">Nom</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-400">Commune</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-400">Commercial</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-400">Code parrain</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-400">App Status</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-400">Date</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-400">Heure</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => {
                    setSelectedSubmission(s);
                    setShowModal(true);
                  }}
                  className="cursor-pointer border-b border-k2l-gray-100 transition-colors hover:bg-k2l-success-light/30 last:border-0"
                >
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                      s.type === 'PROSPECT'
                        ? 'bg-k2l-success-light text-k2l-success'
                        : 'bg-k2l-amber-light text-k2l-amber'
                    }`}>
                      {s.type === 'PROSPECT' ? 'Prospect' : 'Marchand'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">
                      {s.type === 'PROSPECT' ? s.prospectFullName : s.merchantName}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-k2l-gray-600">{s.commune || '-'}</td>
                  <td className="px-4 py-3 text-k2l-gray-600">{s.commercial?.fullName || '-'}</td>
                  <td className="px-4 py-3 text-k2l-gray-600">{s.commercial?.sponsorCode || '-'}</td>
                  <td className="px-4 py-3">
                    {s.appStatus === 'INSTALLED_ACTIVATED' ? (
                      <span className="rounded-full bg-k2l-success-light px-2.5 py-1 text-[10px] font-semibold text-k2l-success">Installée + Activée</span>
                    ) : s.appStatus === 'INSTALLED' ? (
                      <span className="rounded-full bg-k2l-amber-light px-2.5 py-1 text-[10px] font-semibold text-k2l-amber">Installée</span>
                    ) : (
                      <span className="rounded-full bg-k2l-blue-light px-2.5 py-1 text-[10px] font-semibold text-k2l-blue">N/A</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-k2l-gray-400 text-[12px]">
                    {s.submittedAt ? new Date(s.submittedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date(s.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-k2l-gray-400 text-[12px]">
                    {s.submittedAt ? new Date(s.submittedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : new Date(s.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Detail */}
      {showModal && selectedSubmission && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => {
            setShowModal(false);
            setSelectedSubmission(null);
          }}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-k2l-gray-200 px-6 py-4">
              <div>
                <h2 className="font-head text-lg font-semibold">
                  {selectedSubmission.type === 'PROSPECT'
                    ? selectedSubmission.prospectFullName
                    : selectedSubmission.merchantName}
                  {' '} - {selectedSubmission.type === 'PROSPECT' ? 'Prospect' : 'Marchand'}
                </h2>
                <p className="mt-1 text-xs text-k2l-gray-400">
                  Soumis le {new Date(selectedSubmission.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedSubmission(null);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-k2l-gray-100 text-k2l-gray-500 hover:bg-k2l-gray-200"
              >
                <RiCloseLine className="text-lg" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              {/* Identite */}
              <div>
                <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-500">
                  <RiUserLine className="text-sm text-k2l-success" />
                  {selectedSubmission.type === 'PROSPECT' ? 'Identité du prospect' : 'Informations du marchand'}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between border-b border-k2l-gray-100 py-2 text-sm">
                    <span className="text-k2l-gray-400">Nom complet</span>
                    <span className="font-medium">
                      {selectedSubmission.type === 'PROSPECT'
                        ? selectedSubmission.prospectFullName
                        : selectedSubmission.merchantName}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-k2l-gray-100 py-2 text-sm">
                    <span className="text-k2l-gray-400">Téléphone</span>
                    <span className="font-medium">
                      {selectedSubmission.type === 'PROSPECT'
                        ? selectedSubmission.prospectPhone
                        : selectedSubmission.merchantPhone}
                    </span>
                  </div>
                  {selectedSubmission.type === 'PROSPECT' && (
                    <div className="flex justify-between py-2 text-sm">
                      <span className="text-k2l-gray-400">Genre / Âge</span>
                      <span className="font-medium">
                        {selectedSubmission.prospectGender || '-'} - {selectedSubmission.prospectAge || '-'} ans
                      </span>
                    </div>
                  )}
                  {selectedSubmission.type === 'MERCHANT' && (
                    <>
                      <div className="flex justify-between border-b border-k2l-gray-100 py-2 text-sm">
                        <span className="text-k2l-gray-400">Propriétaire</span>
                        <span className="font-medium">{selectedSubmission.merchantOwner || '-'}</span>
                      </div>
                      <div className="flex justify-between border-b border-k2l-gray-100 py-2 text-sm">
                        <span className="text-k2l-gray-400">Activité</span>
                        <span className="font-medium">{selectedSubmission.merchantActivity || '-'}</span>
                      </div>
                      <div className="flex justify-between py-2 text-sm">
                        <span className="text-k2l-gray-400">RCCM</span>
                        <span className="font-medium">{selectedSubmission.merchantRccm || '-'}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Localisation */}
              <div>
                <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-500">
                  <RiMapPin2Line className="text-sm text-k2l-success" />
                  Localisation
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between border-b border-k2l-gray-100 py-2 text-sm">
                    <span className="text-k2l-gray-400">Commune</span>
                    <span className="font-medium">{selectedSubmission.commune || '-'}</span>
                  </div>
                  <div className="flex justify-between py-2 text-sm">
                    <span className="text-k2l-gray-400">Quartier</span>
                    <span className="font-medium">{selectedSubmission.quartier || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Application */}
              <div>
                <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-500">
                  <RiSmartphoneLine className="text-sm text-k2l-success" />
                  Application
                </div>
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-k2l-gray-400">Statut</span>
                  {selectedSubmission.appStatus === 'INSTALLED_ACTIVATED' ? (
                    <span className="rounded-full bg-k2l-success-light px-2.5 py-1 text-[10px] font-semibold text-k2l-success">Installée + Activée</span>
                  ) : selectedSubmission.appStatus === 'INSTALLED' ? (
                    <span className="rounded-full bg-k2l-amber-light px-2.5 py-1 text-[10px] font-semibold text-k2l-amber">Installée</span>
                  ) : (
                    <span className="rounded-full bg-k2l-blue-light px-2.5 py-1 text-[10px] font-semibold text-k2l-blue">N/A</span>
                  )}
                </div>
              </div>

              {/* Metadonnees */}
              <div>
                <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-500">
                  <RiIdCardLine className="text-sm text-k2l-success" />
                  Métadonnées
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between border-b border-k2l-gray-100 py-2 text-sm">
                    <span className="text-k2l-gray-400">Soumis par</span>
                    <span className="font-medium">
                      {selectedSubmission.commercial?.fullName || '-'} ({selectedSubmission.commercial?.matricule || '-'})
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-k2l-gray-100 py-2 text-sm">
                    <span className="text-k2l-gray-400">Code parrain</span>
                    <span className="font-medium">{selectedSubmission.commercial?.sponsorCode || '-'}</span>
                  </div>
                  <div className="flex justify-between border-b border-k2l-gray-100 py-2 text-sm">
                    <span className="text-k2l-gray-400">Date de soumission</span>
                    <span className="font-medium">
                      {selectedSubmission.submittedAt ? new Date(selectedSubmission.submittedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date(selectedSubmission.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 text-sm">
                    <span className="text-k2l-gray-400">Heure de soumission</span>
                    <span className="font-medium">
                      {selectedSubmission.submittedAt ? new Date(selectedSubmission.submittedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : new Date(selectedSubmission.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
