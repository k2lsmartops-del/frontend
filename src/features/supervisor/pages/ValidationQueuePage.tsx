import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RiArrowLeftLine, RiLoader4Line, RiUserLine, RiStore2Line,
  RiCheckboxCircleLine, RiCloseLine,
} from '@/common/icons';
import { useToastStore } from '@/common/stores/toast.store';
import api from '@/common/services/api';

interface Submission {
  id: string;
  type: string;
  status: string;
  prospectFullName?: string;
  prospectPhone?: string;
  prospectAge?: number;
  merchantName?: string;
  merchantOwner?: string;
  merchantPhone?: string;
  commune?: string;
  quartier?: string;
  createdAt: string;
  commercial?: { fullName: string; matricule: string };
  photos?: { id: string; url: string; category: string }[];
}

export default function ValidationQueuePage() {
  const navigate = useNavigate();
  const showToast = useToastStore((s) => s.show);

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [processing, setProcessing] = useState(false);

  const loadSubmissions = useCallback(async () => {
    try {
      const { data } = await api.get('/submissions', {
        params: { status: 'SUBMITTED', limit: 50 },
      });
      setSubmissions(data.data || []);
    } catch {
      showToast('Erreur de chargement', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const current = submissions[currentIndex];
  const total = submissions.length;

  const handleValidate = async () => {
    if (!current) return;
    setProcessing(true);
    try {
      await api.patch(`/submissions/${current.id}/approve-l1`);
      showToast('Fiche validée', 'success');
      // Retirer de la liste et passer à la suivante
      setSubmissions((prev) => prev.filter((s) => s.id !== current.id));
      if (currentIndex >= submissions.length - 1) {
        setCurrentIndex(Math.max(0, currentIndex - 1));
      }
    } catch {
      showToast('Erreur lors de la validation', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!current) return;
    const comment = prompt('Motif du rejet :');
    if (!comment) return;

    setProcessing(true);
    try {
      await api.patch(`/submissions/${current.id}/reject-l1`, { comment });
      showToast('Fiche rejetée', 'success');
      setSubmissions((prev) => prev.filter((s) => s.id !== current.id));
      if (currentIndex >= submissions.length - 1) {
        setCurrentIndex(Math.max(0, currentIndex - 1));
      }
    } catch {
      showToast('Erreur lors du rejet', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const goNext = () => {
    if (currentIndex < total - 1) setCurrentIndex(currentIndex + 1);
  };

  // Formatage date relative
  const formatTimeAgo = (dateStr: string) => {
    const now = new Date();
    const diff = now.getTime() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `il y a ${hours}h`;
    return `il y a ${Math.floor(hours / 24)}j`;
  };

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-k2l-gray-100">
        <RiLoader4Line className="animate-spin text-3xl text-k2l-primary" />
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="flex min-h-full flex-col bg-k2l-gray-100">
        <div className="bg-k2l-navy px-5 py-3.5">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-[13px] text-white/80">
              <RiArrowLeftLine /> Retour
            </button>
            <span className="font-head text-[15px] font-semibold text-white">Validation</span>
            <div className="w-16" />
          </div>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-k2l-success-light">
            <RiCheckboxCircleLine className="text-3xl text-k2l-success" />
          </div>
          <h2 className="font-head text-lg font-bold text-k2l-gray-900">Tout est validé !</h2>
          <p className="mt-2 text-sm text-k2l-gray-500">Aucune fiche en attente de validation.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 rounded-lg bg-k2l-navy px-6 py-2.5 text-sm font-medium text-white"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  const name = current?.prospectFullName || current?.merchantName || '—';
  const phone = current?.prospectPhone || current?.merchantPhone || '—';
  const age = current?.prospectAge ? `${current.prospectAge} ans` : '';
  const location = [current?.commune, current?.quartier].filter(Boolean).join(', ');
  const photo = current?.photos?.[0]?.url;

  return (
    <div className="flex min-h-full flex-col bg-k2l-gray-100">
      {/* Header */}
      <div className="bg-k2l-navy px-5 py-3.5">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-[13px] text-white/80">
            <RiArrowLeftLine /> Retour
          </button>
          <span className="font-head text-[15px] font-semibold text-white">
            Fiche {currentIndex + 1} / {total}
          </span>
          <button onClick={goNext} disabled={currentIndex >= total - 1} className="text-[13px] text-white/80 disabled:opacity-40">
            Suivant →
          </button>
        </div>
      </div>

      {/* Photo / Placeholder */}
      <div className="relative flex h-40 items-center justify-center bg-k2l-success-light">
        {photo ? (
          <img src={photo} alt="Document" className="h-full w-full object-cover" />
        ) : (
          <span className="text-5xl">🪪</span>
        )}
        {/* Navigation photos (dots) */}
        {current?.photos && current.photos.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {current.photos.map((_, i) => (
              <span
                key={i}
                className={`h-2 w-2 rounded-full ${i === 0 ? 'bg-k2l-navy' : 'bg-k2l-success'}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Infos */}
      <div className="flex-1 px-4 py-4">
        <div className="font-head text-lg font-semibold text-k2l-gray-900">
          {name} {age && <span className="text-sm font-normal text-k2l-gray-400">· {age}</span>}
        </div>
        <div className="mt-2 space-y-1 text-[13px] text-k2l-gray-600 leading-relaxed">
          <div>📞 {phone}</div>
          {location && <div>📍 {location}</div>}
          <div>
            {current?.type === 'PROSPECT' ? <RiUserLine className="inline" /> : <RiStore2Line className="inline" />}
            {' '}{current?.type === 'PROSPECT' ? 'Prospect' : 'Marchand'}
          </div>
        </div>

        <div className="mt-4 border-t border-k2l-gray-200 pt-3 text-[11px] text-k2l-gray-400">
          Soumis {formatTimeAgo(current?.createdAt || '')} par {current?.commercial?.fullName || '—'}
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-6">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleReject}
            disabled={processing}
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-k2l-red bg-k2l-red-light py-3.5 font-head text-sm font-semibold text-k2l-red transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <RiCloseLine className="text-lg" /> Rejeter
          </button>
          <button
            onClick={handleValidate}
            disabled={processing}
            className="flex items-center justify-center gap-2 rounded-xl bg-k2l-success py-3.5 font-head text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {processing ? <RiLoader4Line className="animate-spin" /> : <RiCheckboxCircleLine className="text-lg" />}
            Valider
          </button>
        </div>
        <div className="mt-3 text-center text-[11px] text-k2l-gray-400">
          ← swipe rejeter · valider swipe →
        </div>
      </div>
    </div>
  );
}
