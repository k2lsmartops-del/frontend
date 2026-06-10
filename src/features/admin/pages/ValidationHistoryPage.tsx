import { useState, useEffect } from 'react';
import {
  RiLoader4Line,
  RiUserLine,
  RiStore2Line,
} from 'react-icons/ri';
import api from '@/common/services/api';

interface Submission {
  id: string;
  type: string;
  status: string;
  prospectFullName?: string;
  prospectPhone?: string;
  merchantName?: string;
  merchantOwner?: string;
  merchantActivity?: string;
  commune?: string;
  quartier?: string;
  createdAt: string;
  submittedAt?: string;
  level2At?: string;
  commercial?: { fullName: string; matricule: string };
}

export default function ValidationHistoryPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/submissions', { params: { status: 'VALIDATED', limit: 100 } });
        setSubmissions(res.data.data || []);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RiLoader4Line className="animate-spin text-3xl text-k2l-primary" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4 font-head text-lg font-semibold text-k2l-gray-800">
        Historique des validations
      </h2>
      {submissions.length === 0 ? (
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
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-k2l-gray-400">Statut</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-k2l-gray-400">Date</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => {
                const name = s.prospectFullName || s.merchantName || '—';
                return (
                  <tr key={s.id} className="border-b border-k2l-gray-100 last:border-0 hover:bg-k2l-gray-50">
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
                      <span className="rounded-full bg-k2l-success-light px-2.5 py-0.5 text-[10px] font-semibold text-k2l-success">
                        Validé
                      </span>
                    </td>
                    <td className="px-4 py-3 text-k2l-gray-400 text-[12px]">
                      {s.level2At ? new Date(s.level2At).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
