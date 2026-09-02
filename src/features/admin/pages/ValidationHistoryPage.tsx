import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  RiLoader4Line,
  RiUserLine,
  RiStore2Line,
  RiCloseLine,
  RiMapPin2Line,
  RiCalendarLine,
  RiUserHeartLine,
  RiIdCardLine,
  RiCheckLine,
  RiDownloadLine,
} from 'react-icons/ri';
import { useToastStore } from '@/common/stores/toast.store';
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
  commercial?: { fullName: string; matricule: string };
}

export default function ValidationHistoryPage() {
  const showToast = useToastStore((s) => s.show);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [appStatusFilter, setAppStatusFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [exporting, setExporting] = useState(false);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const params: Record<string, string> = { status: 'VALIDATED' };
      if (startDate) params.dateFrom = startDate;
      if (endDate) params.dateTo = endDate;
      
      const response = await api.get('/export/submissions/csv', {
        params,
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `validations_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      showToast('Export CSV téléchargé', 'success');
    } catch {
      showToast('Erreur lors de l\'export', 'error');
    } finally {
      setExporting(false);
    }
  };

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
              <option value="INSTALLED_TRANSACTIONS">Installée + Transactions</option>
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
          <div className="ml-auto">
            <button
              onClick={handleExportCsv}
              disabled={exporting}
              className="flex items-center gap-1.5 rounded-lg bg-k2l-success px-4 py-2 text-xs font-medium text-white hover:bg-k2l-success/90 transition-colors disabled:opacity-50"
            >
              <RiDownloadLine className="text-sm" />
              {exporting ? 'Export...' : 'Exporter CSV'}
            </button>
          </div>
        </div>
      </div>
      {filteredSubmissions.length === 0 ? (
        <div className="rounded-xl border border-k2l-gray-200 bg-white p-12 text-center text-k2l-gray-400">
          Aucune validation effectuée
        </div>
      ) : (
        <div className="rounded-xl border border-k2l-gray-200 bg-white overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-k2l-gray-200 bg-k2l-gray-50">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-k2l-gray-400">Nom</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-k2l-gray-400">Type</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-k2l-gray-400">Commune</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-k2l-gray-400">Commercial</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-k2l-gray-400">App</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-k2l-gray-400">Statut</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-k2l-gray-400">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.map((s) => {
                const name = s.prospectFullName || s.merchantName || '—';
                return (
                  <tr
                    key={s.id}
                    className="border-b border-k2l-gray-100 last:border-0 hover:bg-k2l-gray-50 cursor-pointer"
                    onClick={() => {
                      setSelectedSubmission(s);
                      setShowModal(true);
                    }}
                  >
                    <td className="px-4 py-3 font-medium text-k2l-gray-900">{name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        s.type === 'PROSPECT' ? 'bg-k2l-primary/10 text-k2l-primary' : 'bg-k2l-amber/10 text-k2l-amber'
                      }`}>
                        {s.type === 'PROSPECT' ? <RiUserLine /> : <RiStore2Line />}
                        {s.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-k2l-gray-600">{s.commune || '—'}</td>
                    <td className="px-4 py-3 text-k2l-gray-600">{s.commercial?.fullName || '—'}</td>
                    <td className="px-4 py-3">
                      {s.appStatus ? (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          s.appStatus === 'INSTALLED_TRANSACTIONS' ? 'bg-k2l-success/10 text-k2l-success' : 'bg-k2l-amber/10 text-k2l-amber'
                        }`}>
                          {s.appStatus === 'INSTALLED_TRANSACTIONS' ? (
                            <>
                              <RiCheckLine />
                              Installée + Transactions
                            </>
                          ) : (
                            <>
                              <RiUserLine />
                              Installée
                            </>
                          )}
                        </span>
                      ) : (
                        <span className="text-xs text-k2l-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-k2l-success-light px-2.5 py-0.5 text-[10px] font-semibold text-k2l-success">
                        Validé
                      </span>
                    </td>
                    <td className="px-4 py-3 text-k2l-gray-400 text-[12px]">
                      {s.submittedAt ? new Date(s.submittedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date(s.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de détails de soumission */}
      {showModal && selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-head text-lg font-semibold text-k2l-gray-900">
                Détails de la soumission
              </h3>
              <button 
                onClick={() => {
                  setShowModal(false);
                  setSelectedSubmission(null);
                }}
                className="text-k2l-gray-400 hover:text-k2l-gray-600"
              >
                <RiCloseLine className="text-2xl" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Type et statut */}
              <div className="flex items-center gap-4 rounded-lg bg-k2l-gray-50 p-4">
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${
                  selectedSubmission.type === 'PROSPECT' ? 'bg-k2l-primary/10 text-k2l-primary' : 'bg-k2l-amber/10 text-k2l-amber'
                }`}>
                  {selectedSubmission.type === 'PROSPECT' ? <RiUserLine /> : <RiStore2Line />}
                  {selectedSubmission.type === 'PROSPECT' ? 'Prospect' : 'Marchand'}
                </span>
                <span className="rounded-full bg-k2l-success-light px-3 py-1.5 text-sm font-semibold text-k2l-success flex items-center gap-1">
                  <RiCheckLine />
                  Validé
                </span>
              </div>

              {/* Informations prospect */}
              {selectedSubmission.type === 'PROSPECT' && (
                <div className="rounded-lg border border-k2l-gray-200 p-4">
                  <h4 className="mb-3 font-semibold text-k2l-gray-900 flex items-center gap-2">
                    <RiUserHeartLine className="text-k2l-primary" />
                    Informations du prospect
                  </h4>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <div className="text-xs text-k2l-gray-500">Nom complet</div>
                      <div className="font-medium text-k2l-gray-900">{selectedSubmission.prospectFullName || '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-k2l-gray-500">Téléphone</div>
                      <div className="font-medium text-k2l-gray-900">{selectedSubmission.prospectPhone || '—'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Informations marchand */}
              {selectedSubmission.type === 'MARCHAND' && (
                <div className="rounded-lg border border-k2l-gray-200 p-4">
                  <h4 className="mb-3 font-semibold text-k2l-gray-900 flex items-center gap-2">
                    <RiStore2Line className="text-k2l-amber" />
                    Informations du marchand
                  </h4>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <div className="text-xs text-k2l-gray-500">Nom du commerce</div>
                      <div className="font-medium text-k2l-gray-900">{selectedSubmission.merchantName || '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-k2l-gray-500">Propriétaire</div>
                      <div className="font-medium text-k2l-gray-900">{selectedSubmission.merchantOwner || '—'}</div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-xs text-k2l-gray-500">Activité</div>
                      <div className="font-medium text-k2l-gray-900">{selectedSubmission.merchantActivity || '—'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Localisation */}
              <div className="rounded-lg border border-k2l-gray-200 p-4">
                <h4 className="mb-3 font-semibold text-k2l-gray-900 flex items-center gap-2">
                  <RiMapPin2Line className="text-k2l-primary" />
                  Localisation
                </h4>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <div className="text-xs text-k2l-gray-500">Commune</div>
                    <div className="font-medium text-k2l-gray-900">{selectedSubmission.commune || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-k2l-gray-500">Quartier</div>
                    <div className="font-medium text-k2l-gray-900">{selectedSubmission.quartier || '—'}</div>
                  </div>
                </div>
              </div>

              {/* Commercial */}
              <div className="rounded-lg border border-k2l-gray-200 p-4">
                <h4 className="mb-3 font-semibold text-k2l-gray-900 flex items-center gap-2">
                  <RiIdCardLine className="text-k2l-primary" />
                  Commercial
                </h4>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <div className="text-xs text-k2l-gray-500">Nom</div>
                    <div className="font-medium text-k2l-gray-900">{selectedSubmission.commercial?.fullName || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-k2l-gray-500">Matricule</div>
                    <div className="font-medium text-k2l-gray-900">{selectedSubmission.commercial?.matricule || '—'}</div>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="rounded-lg border border-k2l-gray-200 p-4">
                <h4 className="mb-3 font-semibold text-k2l-gray-900 flex items-center gap-2">
                  <RiCalendarLine className="text-k2l-primary" />
                  Dates
                </h4>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <div className="text-xs text-k2l-gray-500">Création</div>
                    <div className="font-medium text-k2l-gray-900">
                      {selectedSubmission.createdAt 
                        ? new Date(selectedSubmission.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-k2l-gray-500">Soumission</div>
                    <div className="font-medium text-k2l-gray-900">
                      {selectedSubmission.submittedAt 
                        ? new Date(selectedSubmission.submittedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-xs text-k2l-gray-500">Validation</div>
                    <div className="font-medium text-k2l-gray-900">
                      {selectedSubmission.level2At 
                        ? new Date(selectedSubmission.level2At).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Statut de l'application */}
            <div className="rounded-lg border border-k2l-gray-200 p-4">
              <h4 className="mb-3 font-semibold text-k2l-gray-900 flex items-center gap-2">
                <RiCheckLine className="text-k2l-primary" />
                Statut de l'application
              </h4>
              <div>
                {selectedSubmission.appStatus ? (
                  <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${
                    selectedSubmission.appStatus === 'INSTALLED_TRANSACTIONS' 
                      ? 'bg-k2l-success/10 text-k2l-success' 
                      : 'bg-k2l-amber/10 text-k2l-amber'
                  }`}>
                    {selectedSubmission.appStatus === 'INSTALLED_TRANSACTIONS' ? (
                      <>
                        <RiCheckLine />
                        Installée + Transactions
                      </>
                    ) : (
                      <>
                        <RiUserLine />
                        Installée
                      </>
                    )}
                  </span>
                ) : (
                  <span className="text-sm text-k2l-gray-500">Non renseigné</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
