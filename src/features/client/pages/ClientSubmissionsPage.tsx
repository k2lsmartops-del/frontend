import { useState, useEffect, useCallback } from 'react';
import {
  RiSearchLine,
  RiMapPinLine,
  RiStackLine,
  RiDownloadLine,
  RiLoader4Line,
  RiUserLine,
  RiCloseLine,
  RiSmartphoneLine,
  RiInformationLine,
} from 'react-icons/ri';
import api from '@/common/services/api';
import { useFilterStore } from '@/common/stores/filter.store';

interface Submission {
  id: string;
  type: string;
  prospectFullName?: string;
  prospectPhone?: string;
  prospectProfession?: string;
  prospectGender?: string;
  prospectAge?: number;
  merchantName?: string;
  merchantPhone?: string;
  merchantOwner?: string;
  commune?: string;
  quartier?: string;
  latitude?: number;
  longitude?: number;
  appStatus?: string;
  sponsorCode?: string;
  validatedAt?: string;
  commercial?: { fullName: string; matricule: string };
  validator?: { fullName: string; matricule: string };
  cluster?: { name: string };
}

type FilterType = 'ALL' | 'PROSPECT' | 'MERCHANT';

export default function ClientSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [total, setTotal] = useState(0);
  const [prospectCount, setProspectCount] = useState(0);
  const [merchantCount, setMerchantCount] = useState(0);
  const [showCommuneFilter, setShowCommuneFilter] = useState(false);
  const [showClusterFilter, setShowClusterFilter] = useState(false);
  const { period } = useFilterStore();

  const loadSubmissions = useCallback(async () => {
    try {
      const params: Record<string, string> = { status: 'VALIDATED', limit: '50' };
      if (filter !== 'ALL') {
        params.type = filter;
      }
      const res = await api.get('/submissions', { params });
      const data = res.data.data || [];
      setSubmissions(data);
      setTotal(res.data.total || data.length);
      
      const prospects = data.filter((s: Submission) => s.type === 'PROSPECT').length;
      const merchants = data.filter((s: Submission) => s.type === 'MERCHANT').length;
      setProspectCount(prospects);
      setMerchantCount(merchants);
    } catch (error) {
      console.error('Erreur de chargement des soumissions', error);
    } finally {
      setLoading(false);
    }
  }, [filter, period]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const filteredSubmissions = submissions.filter((s) => {
    const name = s.type === 'PROSPECT' ? s.prospectFullName : s.merchantName;
    const phone = s.type === 'PROSPECT' ? s.prospectPhone : s.merchantPhone;
    const searchLower = search.toLowerCase();
    return (
      name?.toLowerCase().includes(searchLower) ||
      phone?.includes(search)
    );
  });

  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return `Aujourd'hui ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (days === 1) {
      return `Hier ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getAppStatusBadge = (status?: string) => {
    switch (status) {
      case 'INSTALLED_ACTIVATED':
        return <span className="rounded-full bg-k2l-success-light px-2.5 py-1 text-[10px] font-semibold text-k2l-success">Activee</span>;
      case 'INSTALLED':
        return <span className="rounded-full bg-k2l-amber-light px-2.5 py-1 text-[10px] font-semibold text-k2l-amber">Installee</span>;
      default:
        return <span className="rounded-full bg-k2l-blue-light px-2.5 py-1 text-[10px] font-semibold text-k2l-blue">N/A</span>;
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
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-k2l-gray-200 bg-white px-3 py-2">
          <RiSearchLine className="text-sm text-k2l-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom ou telephone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 bg-transparent text-sm outline-none placeholder:text-k2l-gray-400"
          />
        </div>

        <button
          onClick={() => setFilter('ALL')}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            filter === 'ALL'
              ? 'border-k2l-success bg-k2l-success text-white'
              : 'border-k2l-gray-200 bg-white text-k2l-gray-600 hover:border-k2l-success'
          }`}
        >
          Toutes ({total})
        </button>
        <button
          onClick={() => setFilter('PROSPECT')}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            filter === 'PROSPECT'
              ? 'border-k2l-success bg-k2l-success text-white'
              : 'border-k2l-gray-200 bg-white text-k2l-gray-600 hover:border-k2l-success'
          }`}
        >
          Prospects ({prospectCount})
        </button>
        <button
          onClick={() => setFilter('MERCHANT')}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            filter === 'MERCHANT'
              ? 'border-k2l-success bg-k2l-success text-white'
              : 'border-k2l-gray-200 bg-white text-k2l-gray-600 hover:border-k2l-success'
          }`}
        >
          Marchands ({merchantCount})
        </button>

        <div className="ml-auto flex items-center gap-2">
          <button 
            onClick={() => setShowCommuneFilter(!showCommuneFilter)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
              showCommuneFilter 
                ? 'border-k2l-success bg-k2l-success text-white' 
                : 'border-k2l-gray-200 bg-white text-k2l-gray-600 hover:border-k2l-success'
            }`}
          >
            <RiMapPinLine className="text-sm" />
            Commune
          </button>
          <button 
            onClick={() => setShowClusterFilter(!showClusterFilter)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
              showClusterFilter 
                ? 'border-k2l-success bg-k2l-success text-white' 
                : 'border-k2l-gray-200 bg-white text-k2l-gray-600 hover:border-k2l-success'
            }`}
          >
            <RiStackLine className="text-sm" />
            Cluster
          </button>
          <button 
            onClick={() => alert('Export des donnees en cours de developpement')}
            className="flex items-center gap-1.5 rounded-lg border border-k2l-gray-200 bg-white px-3 py-2 text-xs font-semibold text-k2l-gray-600 hover:border-k2l-success hover:text-k2l-success"
          >
            <RiDownloadLine className="text-sm" />
            Exporter
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-k2l-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-k2l-gray-200 bg-k2l-gray-50">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-400">Type</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-400">Nom</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-400">Telephone</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-400">Commune</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-400">Cluster</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-400">Date validation</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-400">Statut app</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubmissions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-k2l-gray-400">
                  Aucune soumission trouvee
                </td>
              </tr>
            ) : (
              filteredSubmissions.map((submission) => {
                const name = submission.type === 'PROSPECT' ? submission.prospectFullName : submission.merchantName;
                const phone = submission.type === 'PROSPECT' ? submission.prospectPhone : submission.merchantPhone;
                return (
                  <tr
                    key={submission.id}
                    onClick={() => setSelectedSubmission(submission)}
                    className="cursor-pointer border-b border-k2l-gray-100 transition-colors hover:bg-k2l-success-light/30 last:border-0"
                  >
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                        submission.type === 'PROSPECT'
                          ? 'bg-k2l-success-light text-k2l-success'
                          : 'bg-k2l-amber-light text-k2l-amber'
                      }`}>
                        {submission.type === 'PROSPECT' ? 'Prospect' : 'Marchand'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-k2l-success-light text-[10px] font-bold text-k2l-success">
                          {getInitials(name)}
                        </div>
                        <span className="font-medium">{name || '-'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-k2l-gray-600">{phone || '-'}</td>
                    <td className="px-4 py-3 text-k2l-gray-600">{submission.commune || '-'}</td>
                    <td className="px-4 py-3 text-k2l-gray-600">{submission.cluster?.name || '-'}</td>
                    <td className="px-4 py-3 text-k2l-gray-600">{formatDate(submission.validatedAt)}</td>
                    <td className="px-4 py-3">{getAppStatusBadge(submission.appStatus)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="text-center text-xs text-k2l-gray-400">
        Affichage 1-{filteredSubmissions.length} sur {total}
      </div>

      {/* Modal Detail */}
      {selectedSubmission && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setSelectedSubmission(null)}
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
                  Valide le {formatDate(selectedSubmission.validatedAt)} - Fiche #{selectedSubmission.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
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
                  {selectedSubmission.type === 'PROSPECT' ? 'Identite du prospect' : 'Informations du marchand'}
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
                    <span className="text-k2l-gray-400">Telephone</span>
                    <span className="font-medium">
                      {selectedSubmission.type === 'PROSPECT'
                        ? selectedSubmission.prospectPhone
                        : selectedSubmission.merchantPhone}
                    </span>
                  </div>
                  {selectedSubmission.type === 'PROSPECT' && (
                    <>
                      <div className="flex justify-between border-b border-k2l-gray-100 py-2 text-sm">
                        <span className="text-k2l-gray-400">Profession</span>
                        <span className="font-medium">{selectedSubmission.prospectProfession || '-'}</span>
                      </div>
                      <div className="flex justify-between border-b border-k2l-gray-100 py-2 text-sm">
                        <span className="text-k2l-gray-400">Genre / Age</span>
                        <span className="font-medium">
                          {selectedSubmission.prospectGender || '-'} - {selectedSubmission.prospectAge || '-'} ans
                        </span>
                      </div>
                      <div className="flex justify-between py-2 text-sm">
                        <span className="text-k2l-gray-400">Code parrain</span>
                        <span className="font-medium">{selectedSubmission.sponsorCode || '-'}</span>
                      </div>
                    </>
                  )}
                  {selectedSubmission.type === 'MERCHANT' && (
                    <div className="flex justify-between py-2 text-sm">
                      <span className="text-k2l-gray-400">Proprietaire</span>
                      <span className="font-medium">{selectedSubmission.merchantOwner || '-'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Localisation */}
              <div>
                <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-500">
                  <RiMapPinLine className="text-sm text-k2l-success" />
                  Localisation
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between border-b border-k2l-gray-100 py-2 text-sm">
                    <span className="text-k2l-gray-400">Commune</span>
                    <span className="font-medium">{selectedSubmission.commune || '-'}</span>
                  </div>
                  <div className="flex justify-between border-b border-k2l-gray-100 py-2 text-sm">
                    <span className="text-k2l-gray-400">Quartier</span>
                    <span className="font-medium">{selectedSubmission.quartier || '-'}</span>
                  </div>
                  <div className="flex justify-between border-b border-k2l-gray-100 py-2 text-sm">
                    <span className="text-k2l-gray-400">GPS</span>
                    <span className="font-medium">
                      {selectedSubmission.latitude && selectedSubmission.longitude
                        ? `${selectedSubmission.latitude.toFixed(4)}, ${selectedSubmission.longitude.toFixed(4)}`
                        : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 text-sm">
                    <span className="text-k2l-gray-400">Cluster</span>
                    <span className="font-medium">{selectedSubmission.cluster?.name || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Application */}
              {selectedSubmission.type === 'PROSPECT' && (
                <div>
                  <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-500">
                    <RiSmartphoneLine className="text-sm text-k2l-success" />
                    Application
                  </div>
                  <div className="flex justify-between py-2 text-sm">
                    <span className="text-k2l-gray-400">Statut</span>
                    {getAppStatusBadge(selectedSubmission.appStatus)}
                  </div>
                </div>
              )}

              {/* Metadonnees */}
              <div>
                <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-500">
                  <RiInformationLine className="text-sm text-k2l-success" />
                  Metadonnees
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between border-b border-k2l-gray-100 py-2 text-sm">
                    <span className="text-k2l-gray-400">Soumis par</span>
                    <span className="font-medium">
                      {selectedSubmission.commercial?.fullName || '-'} ({selectedSubmission.commercial?.matricule || '-'})
                    </span>
                  </div>
                  <div className="flex justify-between py-2 text-sm">
                    <span className="text-k2l-gray-400">Valide par</span>
                    <span className="font-medium">
                      {selectedSubmission.validator?.fullName || '-'} ({selectedSubmission.validator?.matricule || '-'})
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
