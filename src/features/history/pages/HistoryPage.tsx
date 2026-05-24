import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RiArrowLeftLine, RiUserLine, RiStore2Line, RiDownloadLine } from '@/common/icons';
import { submissionService } from '@/features/submissions/services/submission.service';
import type { Submission } from '@/common/types';

type Filter = 'all' | 'prospect' | 'marchand' | 'pending' | 'validated';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Tout' },
  { key: 'prospect', label: 'Prospects' },
  { key: 'marchand', label: 'Marchands' },
  { key: 'pending', label: 'En attente' },
  { key: 'validated', label: 'Valides' },
];

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  SUBMITTED: 'En attente',
  SUPERVISOR_APPROVED: 'Valide N1',
  VALIDATED: 'Valide',
  REJECTED_L1: 'Rejete N1',
  REJECTED_L2: 'Rejete N2',
};

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-k2l-gray-100 text-k2l-gray-600',
  SUBMITTED: 'bg-k2l-amber-light text-[#854F0B]',
  SUPERVISOR_APPROVED: 'bg-k2l-primary-light text-k2l-primary',
  VALIDATED: 'bg-k2l-success-light text-k2l-success',
  REJECTED_L1: 'bg-k2l-red-light text-k2l-red',
  REJECTED_L2: 'bg-k2l-red-light text-k2l-red',
};

export default function HistoryPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>('all');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params: Record<string, string | number | undefined> = { limit: 50 };
        if (filter === 'prospect') params.type = 'PROSPECT';
        if (filter === 'marchand') params.type = 'MARCHAND';
        if (filter === 'pending') params.status = 'SUBMITTED';
        if (filter === 'validated') params.status = 'VALIDATED';
        const res = await submissionService.list(params);
        setSubmissions(res.data);
      } catch {
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filter]);

  return (
    <div className="flex min-h-full flex-col bg-k2l-gray-100">
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between bg-k2l-navy px-5 py-3.5">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-[13px] text-white/80">
          <RiArrowLeftLine className="text-base" /> Retour
        </button>
        <span className="font-head text-[17px] font-semibold text-white">Historique</span>
        <button className="rounded-sm bg-white/15 px-3 py-1.5 text-xs font-medium text-white flex items-center gap-1">
          <RiDownloadLine /> Exporter
        </button>
      </div>

      {/* Filters */}
      <div className="sticky top-[52px] z-10 flex gap-2 overflow-x-auto bg-k2l-gray-100 px-4 py-3">
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`whitespace-nowrap rounded-full border-[1.5px] px-3.5 py-1.5 font-body text-xs font-medium transition-all ${
              filter === f.key ? 'border-k2l-primary bg-k2l-primary text-white' : 'border-k2l-gray-200 bg-white text-k2l-gray-600'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 space-y-2.5 px-4 pb-4">
        {loading ? (
          <div className="py-10 text-center text-sm text-k2l-gray-400">Chargement...</div>
        ) : submissions.length === 0 ? (
          <div className="py-10 text-center text-sm text-k2l-gray-400">Aucune soumission pour ce filtre</div>
        ) : (
          submissions.map((s) => (
            <div key={s.id} className="flex cursor-pointer items-start gap-3 rounded-md bg-white p-3.5 shadow-[0_1px_6px_rgba(0,0,0,0.05)]">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-sm text-xl ${
                s.type === 'PROSPECT' ? 'bg-k2l-primary-light' : 'bg-k2l-amber-light'
              }`}>
                {s.type === 'PROSPECT'
                  ? <RiUserLine className="text-lg text-k2l-navy" />
                  : <RiStore2Line className="text-lg text-[#854F0B]" />}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-k2l-gray-900">
                  {s.type === 'PROSPECT' ? s.prospectFullName : s.merchantName}
                </div>
                <div className="mt-0.5 text-[11px] text-k2l-gray-400">
                  {s.type === 'PROSPECT' ? 'Prospect' : 'Marchand'} · {s.commune} · {s.type === 'PROSPECT' ? s.prospectPhone : s.merchantPhone}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className="text-[11px] text-k2l-gray-400">
                  {new Date(s.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[s.status] ?? ''}`}>
                  {STATUS_LABELS[s.status] ?? s.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
