import { useState, useEffect, useCallback } from 'react';
import {
  RiArrowLeftSLine, RiArrowRightSLine,
  RiLoader4Line, RiUserLine, RiStore2Line,
  RiCheckboxCircleLine, RiCloseLine, RiImageLine,
  RiMapPinLine, RiPhoneLine, RiCalendarLine,
} from 'react-icons/ri';
import { useToastStore } from '@/common/stores/toast.store';
import api from '@/common/services/api';

interface Submission {
  id: string;
  type: string;
  status: string;
  prospectFullName?: string;
  prospectPhone?: string;
  prospectAge?: number;
  prospectProfession?: string;
  merchantName?: string;
  merchantOwner?: string;
  merchantPhone?: string;
  merchantActivity?: string;
  commune?: string;
  quartier?: string;
  createdAt: string;
  submittedAt?: string;
  level1At?: string;
  level1Comment?: string;
  commercial?: { fullName: string; matricule: string };
  level1Validator?: { fullName: string; matricule: string };
  photos?: { id: string; url: string; category: string }[];
}

export default function ValidationCoordinateurPage() {
  const showToast = useToastStore((s) => s.show);

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [rejectComment, setRejectComment] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const loadSubmissions = useCallback(async () => {
    try {
      const { data } = await api.get('/submissions', {
        params: { status: 'SUPERVISOR_APPROVED', limit: 50 },
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
  const photos = current?.photos || [];

  const handleValidate = async () => {
    if (!current) return;
    setProcessing(true);
    try {
      await api.patch(`/submissions/${current.id}/approve-l2`, {});
      showToast('Fiche validée (N2)', 'success');
      setSubmissions((prev) => prev.filter((s) => s.id !== current.id));
      if (currentIndex >= submissions.length - 1) {
        setCurrentIndex(Math.max(0, currentIndex - 1));
      }
      setPhotoIndex(0);
    } catch {
      showToast('Erreur lors de la validation', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!current || !rejectComment.trim()) return;

    setProcessing(true);
    try {
      await api.patch(`/submissions/${current.id}/reject-l2`, { comment: rejectComment });
      showToast('Fiche rejetée (N2)', 'success');
      setSubmissions((prev) => prev.filter((s) => s.id !== current.id));
      if (currentIndex >= submissions.length - 1) {
        setCurrentIndex(Math.max(0, currentIndex - 1));
      }
      setPhotoIndex(0);
      setShowRejectModal(false);
      setRejectComment('');
    } catch {
      showToast('Erreur lors du rejet', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const goNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex(currentIndex + 1);
      setPhotoIndex(0);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setPhotoIndex(0);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RiLoader4Line className="animate-spin text-3xl text-k2l-primary" />
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-k2l-gray-400">
        <RiCheckboxCircleLine className="mb-2 text-4xl text-k2l-success" />
        <p className="font-medium">Aucune soumission en attente de validation N2</p>
        <p className="text-sm">Toutes les fiches approuvées par les superviseurs ont été traitées</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-head text-xl font-semibold text-k2l-gray-800">Validation Niveau 2</h1>
          <p className="text-sm text-k2l-gray-400">
            {total} fiche(s) en attente · Approuvées par les superviseurs
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-k2l-gray-100 px-3 py-1.5">
          <button onClick={goPrev} disabled={currentIndex === 0} className="p-1 disabled:opacity-30">
            <RiArrowLeftSLine className="text-lg" />
          </button>
          <span className="text-sm font-medium">{currentIndex + 1} / {total}</span>
          <button onClick={goNext} disabled={currentIndex === total - 1} className="p-1 disabled:opacity-30">
            <RiArrowRightSLine className="text-lg" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Photos */}
        <div className="rounded-xl bg-white border border-k2l-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-k2l-gray-700 flex items-center gap-2">
              <RiImageLine className="text-k2l-primary" />
              Photos ({photos.length})
            </h3>
            {photos.length > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPhotoIndex(Math.max(0, photoIndex - 1))}
                  disabled={photoIndex === 0}
                  className="p-1 rounded hover:bg-k2l-gray-100 disabled:opacity-30"
                >
                  <RiArrowLeftSLine />
                </button>
                <span className="text-xs text-k2l-gray-500">{photoIndex + 1}/{photos.length}</span>
                <button
                  onClick={() => setPhotoIndex(Math.min(photos.length - 1, photoIndex + 1))}
                  disabled={photoIndex === photos.length - 1}
                  className="p-1 rounded hover:bg-k2l-gray-100 disabled:opacity-30"
                >
                  <RiArrowRightSLine />
                </button>
              </div>
            )}
          </div>
          {photos.length > 0 ? (
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-k2l-gray-100">
              <img
                src={photos[photoIndex]?.url}
                alt={photos[photoIndex]?.category}
                className="w-full h-full object-contain"
              />
              <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
                {photos[photoIndex]?.category}
              </div>
            </div>
          ) : (
            <div className="aspect-[4/3] rounded-lg bg-k2l-gray-100 flex items-center justify-center text-k2l-gray-400">
              Aucune photo
            </div>
          )}
          {/* Thumbnails */}
          {photos.length > 1 && (
            <div className="mt-2 flex gap-2 overflow-x-auto">
              {photos.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => setPhotoIndex(i)}
                  className={`flex-shrink-0 w-16 h-12 rounded overflow-hidden border-2 ${
                    i === photoIndex ? 'border-k2l-primary' : 'border-transparent'
                  }`}
                >
                  <img src={p.url} alt={p.category} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Details */}
        <div className="rounded-xl bg-white border border-k2l-gray-200 p-4">
          {/* Type badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              current.type === 'PROSPECT'
                ? 'bg-k2l-primary/10 text-k2l-primary'
                : 'bg-k2l-amber/10 text-k2l-amber'
            }`}>
              {current.type === 'PROSPECT' ? <RiUserLine /> : <RiStore2Line />}
              {current.type}
            </span>
            <span className="rounded-full bg-k2l-success/10 text-k2l-success px-2 py-0.5 text-xs font-medium">
              Approuvé N1
            </span>
          </div>

          {/* Info principale */}
          <div className="space-y-3 text-sm">
            {current.type === 'PROSPECT' ? (
              <>
                <div>
                  <div className="text-k2l-gray-400 text-xs">Nom du prospect</div>
                  <div className="font-semibold text-k2l-gray-800">{current.prospectFullName || '—'}</div>
                </div>
                <div className="flex gap-4">
                  <div>
                    <div className="text-k2l-gray-400 text-xs flex items-center gap-1"><RiPhoneLine /> Téléphone</div>
                    <div className="font-medium">{current.prospectPhone || '—'}</div>
                  </div>
                  <div>
                    <div className="text-k2l-gray-400 text-xs">Âge</div>
                    <div className="font-medium">{current.prospectAge || '—'} ans</div>
                  </div>
                </div>
                <div>
                  <div className="text-k2l-gray-400 text-xs">Profession</div>
                  <div className="font-medium">{current.prospectProfession || '—'}</div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <div className="text-k2l-gray-400 text-xs">Nom du commerce</div>
                  <div className="font-semibold text-k2l-gray-800">{current.merchantName || '—'}</div>
                </div>
                <div>
                  <div className="text-k2l-gray-400 text-xs">Propriétaire</div>
                  <div className="font-medium">{current.merchantOwner || '—'}</div>
                </div>
                <div className="flex gap-4">
                  <div>
                    <div className="text-k2l-gray-400 text-xs flex items-center gap-1"><RiPhoneLine /> Téléphone</div>
                    <div className="font-medium">{current.merchantPhone || '—'}</div>
                  </div>
                  <div>
                    <div className="text-k2l-gray-400 text-xs">Activité</div>
                    <div className="font-medium">{current.merchantActivity || '—'}</div>
                  </div>
                </div>
              </>
            )}

            <div className="border-t border-k2l-gray-100 pt-3">
              <div className="text-k2l-gray-400 text-xs flex items-center gap-1"><RiMapPinLine /> Localisation</div>
              <div className="font-medium">{current.commune}{current.quartier ? `, ${current.quartier}` : ''}</div>
            </div>

            <div className="border-t border-k2l-gray-100 pt-3 grid grid-cols-2 gap-3">
              <div>
                <div className="text-k2l-gray-400 text-xs">Commercial</div>
                <div className="font-medium">{current.commercial?.fullName || '—'}</div>
                <div className="text-xs text-k2l-gray-400">{current.commercial?.matricule}</div>
              </div>
              <div>
                <div className="text-k2l-gray-400 text-xs">Validé N1 par</div>
                <div className="font-medium">{current.level1Validator?.fullName || '—'}</div>
                <div className="text-xs text-k2l-gray-400">{current.level1Validator?.matricule}</div>
              </div>
            </div>

            {current.level1Comment && (
              <div className="border-t border-k2l-gray-100 pt-3">
                <div className="text-k2l-gray-400 text-xs">Commentaire N1</div>
                <div className="text-sm italic text-k2l-gray-600">"{current.level1Comment}"</div>
              </div>
            )}

            <div className="border-t border-k2l-gray-100 pt-3">
              <div className="text-k2l-gray-400 text-xs flex items-center gap-1"><RiCalendarLine /> Dates</div>
              <div className="text-xs text-k2l-gray-600">
                Soumis: {current.submittedAt ? new Date(current.submittedAt).toLocaleString('fr-FR') : '—'}
              </div>
              <div className="text-xs text-k2l-gray-600">
                Validé N1: {current.level1At ? new Date(current.level1At).toLocaleString('fr-FR') : '—'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex gap-3">
        <button
          onClick={() => setShowRejectModal(true)}
          disabled={processing}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-k2l-red bg-white py-3 font-semibold text-k2l-red hover:bg-k2l-red/5 disabled:opacity-50"
        >
          <RiCloseLine className="text-lg" />
          Rejeter
        </button>
        <button
          onClick={handleValidate}
          disabled={processing}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-k2l-success py-3 font-semibold text-white hover:bg-k2l-success/90 disabled:opacity-50"
        >
          {processing ? (
            <RiLoader4Line className="animate-spin text-lg" />
          ) : (
            <RiCheckboxCircleLine className="text-lg" />
          )}
          Valider (N2)
        </button>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 font-head text-lg font-semibold text-k2l-gray-800">Motif du rejet</h3>
            <textarea
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              placeholder="Expliquez pourquoi cette fiche est rejetée..."
              className="w-full rounded-lg border border-k2l-gray-200 p-3 text-sm outline-none focus:border-k2l-primary resize-none"
              rows={4}
            />
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => { setShowRejectModal(false); setRejectComment(''); }}
                className="flex-1 rounded-lg border border-k2l-gray-200 py-2.5 font-semibold text-k2l-gray-600 hover:bg-k2l-gray-100"
              >
                Annuler
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectComment.trim() || processing}
                className="flex-1 rounded-lg bg-k2l-red py-2.5 font-semibold text-white hover:bg-k2l-red/90 disabled:opacity-50"
              >
                {processing ? 'Rejet...' : 'Confirmer le rejet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
