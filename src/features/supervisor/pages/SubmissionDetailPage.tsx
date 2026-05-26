import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { ReactNode } from 'react';
import {
  RiArrowLeftLine, RiArrowLeftSLine, RiArrowRightSLine,
  RiLoader4Line, RiUserLine, RiStore2Line,
  RiCheckboxCircleLine, RiCheckboxCircleFill, RiCloseLine, RiCloseCircleFill,
  RiMapPinLine, RiPhoneLine, RiTimeLine, RiDraftLine, RiImageLine,
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
  prospectProfession?: string;
  prospectGender?: string;
  appStatus?: string;
  phoneType?: string;
  merchantName?: string;
  merchantOwner?: string;
  merchantPhone?: string;
  merchantActivity?: string;
  commune?: string;
  quartier?: string;
  observations?: string;
  createdAt: string;
  submittedAt?: string;
  level1At?: string;
  level1Comment?: string;
  level2At?: string;
  level2Comment?: string;
  commercial?: { fullName: string; matricule: string };
  level1Validator?: { fullName: string };
  level2Validator?: { fullName: string };
  photos?: { id: string; url: string; category: string }[];
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: ReactNode }> = {
  DRAFT: { label: 'Brouillon', bg: 'bg-k2l-gray-100', text: 'text-k2l-gray-600', icon: <RiDraftLine className="text-xl" /> },
  SUBMITTED: { label: 'En attente de validation', bg: 'bg-k2l-amber-light', text: 'text-[#854F0B]', icon: <RiTimeLine className="text-xl" /> },
  SUPERVISOR_APPROVED: { label: 'Validé par superviseur', bg: 'bg-k2l-success-light', text: 'text-k2l-success', icon: <RiCheckboxCircleFill className="text-xl" /> },
  VALIDATED: { label: 'Validé (final)', bg: 'bg-k2l-success-light', text: 'text-k2l-success', icon: <RiCheckboxCircleFill className="text-xl" /> },
  REJECTED_L1: { label: 'Rejeté par superviseur', bg: 'bg-k2l-red-light', text: 'text-k2l-red', icon: <RiCloseCircleFill className="text-xl" /> },
  REJECTED_L2: { label: 'Rejeté par coordinateur', bg: 'bg-k2l-red-light', text: 'text-k2l-red', icon: <RiCloseCircleFill className="text-xl" /> },
};

export default function SubmissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const showToast = useToastStore((s) => s.show);

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  const loadSubmission = useCallback(async () => {
    if (!id) return;
    try {
      const { data } = await api.get(`/submissions/${id}`);
      setSubmission(data);
    } catch {
      showToast('Erreur de chargement', 'error');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  }, [id, showToast, navigate]);

  useEffect(() => {
    loadSubmission();
  }, [loadSubmission]);

  const handleValidate = async () => {
    if (!submission) return;
    setProcessing(true);
    try {
      await api.patch(`/submissions/${submission.id}/approve-l1`, {});
      showToast('Fiche validée', 'success');
      navigate(-1);
    } catch {
      showToast('Erreur lors de la validation', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!submission) return;
    const comment = prompt('Motif du rejet :');
    if (!comment) return;

    setProcessing(true);
    try {
      await api.patch(`/submissions/${submission.id}/reject-l1`, { comment });
      showToast('Fiche rejetée', 'success');
      navigate(-1);
    } catch {
      showToast('Erreur lors du rejet', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-k2l-gray-100">
        <RiLoader4Line className="animate-spin text-3xl text-k2l-primary" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center bg-k2l-gray-100 px-6">
        <p className="text-k2l-gray-500">Soumission introuvable</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-k2l-primary">Retour</button>
      </div>
    );
  }

  const photos = submission.photos || [];
  const photo = photos[photoIndex]?.url;
  const statusInfo = STATUS_CONFIG[submission.status] || STATUS_CONFIG.DRAFT;
  const canValidate = submission.status === 'SUBMITTED';

  const name = submission.prospectFullName || submission.merchantName || '—';
  const phone = submission.prospectPhone || submission.merchantPhone || '—';
  const location = [submission.commune, submission.quartier].filter(Boolean).join(', ');

  return (
    <div className="flex min-h-full flex-col bg-k2l-gray-100">
      {/* Header */}
      <div className="bg-k2l-navy px-5 py-3.5">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-[13px] text-white/80">
            <RiArrowLeftLine /> Retour
          </button>
          <span className="font-head text-[15px] font-semibold text-white">
            Détail soumission
          </span>
          <div className="w-16" />
        </div>
      </div>

      {/* Photo carousel */}
      <div className="relative flex h-56 items-center justify-center bg-k2l-gray-200">
        {photo ? (
          <img
            src={photo}
            alt={`Photo ${photoIndex + 1}`}
            className="h-full w-full object-contain bg-black/5 cursor-pointer"
            onClick={() => window.open(photo, '_blank')}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-k2l-gray-400">
            <RiImageLine className="text-5xl" />
            <span className="text-xs">Aucune photo</span>
          </div>
        )}
        {photos.length > 1 && (
          <>
            <button
              onClick={() => setPhotoIndex((i) => Math.max(0, i - 1))}
              disabled={photoIndex === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white disabled:opacity-30"
            >
              <RiArrowLeftSLine className="text-lg" />
            </button>
            <button
              onClick={() => setPhotoIndex((i) => Math.min(photos.length - 1, i + 1))}
              disabled={photoIndex === photos.length - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white disabled:opacity-30"
            >
              <RiArrowRightSLine className="text-lg" />
            </button>
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
              {photos.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => setPhotoIndex(i)}
                  className={`h-2.5 w-2.5 rounded-full transition-all ${i === photoIndex ? 'bg-k2l-navy scale-125' : 'bg-white/70'}`}
                />
              ))}
            </div>
            <div className="absolute top-2 right-2 rounded bg-black/50 px-2 py-0.5 text-[10px] text-white">
              {photoIndex + 1} / {photos.length}
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Status badge */}
        <div className={`flex items-center gap-2 rounded-lg p-3 ${statusInfo.bg}`}>
          <span className="text-xl">{statusInfo.icon}</span>
          <span className={`font-head text-sm font-semibold ${statusInfo.text}`}>{statusInfo.label}</span>
        </div>

        {/* Main info */}
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            {submission.type === 'PROSPECT' ? (
              <RiUserLine className="text-lg text-k2l-primary" />
            ) : (
              <RiStore2Line className="text-lg text-k2l-primary" />
            )}
            <span className="font-head text-lg font-semibold text-k2l-gray-900">{name}</span>
          </div>

          <div className="space-y-2 text-[13px] text-k2l-gray-600">
            <div className="flex items-center gap-2">
              <RiPhoneLine className="text-k2l-gray-400" />
              <span>{phone}</span>
            </div>
            {location && (
              <div className="flex items-center gap-2">
                <RiMapPinLine className="text-k2l-gray-400" />
                <span>{location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <h3 className="font-head text-xs font-semibold uppercase tracking-wider text-k2l-gray-400 mb-3">
            Informations
          </h3>
          <div className="grid grid-cols-2 gap-3 text-[13px]">
            {submission.type === 'PROSPECT' && (
              <>
                {submission.prospectAge && (
                  <div>
                    <span className="text-k2l-gray-400">Âge</span>
                    <p className="font-medium text-k2l-gray-900">{submission.prospectAge} ans</p>
                  </div>
                )}
                {submission.prospectGender && (
                  <div>
                    <span className="text-k2l-gray-400">Genre</span>
                    <p className="font-medium text-k2l-gray-900">{submission.prospectGender}</p>
                  </div>
                )}
                {submission.prospectProfession && (
                  <div>
                    <span className="text-k2l-gray-400">Profession</span>
                    <p className="font-medium text-k2l-gray-900">{submission.prospectProfession}</p>
                  </div>
                )}
                {submission.appStatus && (
                  <div>
                    <span className="text-k2l-gray-400">Statut app</span>
                    <p className="font-medium text-k2l-gray-900">
                      {submission.appStatus === 'INSTALLED' ? 'Installée' : 'Installée + Activée'}
                    </p>
                  </div>
                )}
                {submission.phoneType && (
                  <div>
                    <span className="text-k2l-gray-400">Téléphone</span>
                    <p className="font-medium text-k2l-gray-900">{submission.phoneType}</p>
                  </div>
                )}
              </>
            )}
            {submission.type === 'MARCHAND' && (
              <>
                {submission.merchantOwner && (
                  <div>
                    <span className="text-k2l-gray-400">Propriétaire</span>
                    <p className="font-medium text-k2l-gray-900">{submission.merchantOwner}</p>
                  </div>
                )}
                {submission.merchantActivity && (
                  <div>
                    <span className="text-k2l-gray-400">Activité</span>
                    <p className="font-medium text-k2l-gray-900">{submission.merchantActivity}</p>
                  </div>
                )}
              </>
            )}
          </div>
          {submission.observations && (
            <div className="mt-3 pt-3 border-t border-k2l-gray-100">
              <span className="text-[11px] text-k2l-gray-400">Observations</span>
              <p className="text-[13px] text-k2l-gray-700 mt-1">{submission.observations}</p>
            </div>
          )}
        </div>

        {/* Timeline / History */}
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <h3 className="font-head text-xs font-semibold uppercase tracking-wider text-k2l-gray-400 mb-3">
            Historique
          </h3>
          <div className="space-y-3 text-[12px]">
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 mt-1.5 rounded-full bg-k2l-gray-300" />
              <div>
                <p className="text-k2l-gray-600">Soumis par <span className="font-medium">{submission.commercial?.fullName || '—'}</span></p>
                <p className="text-k2l-gray-400">{formatDate(submission.submittedAt || submission.createdAt)}</p>
              </div>
            </div>
            {submission.level1At && (
              <div className="flex items-start gap-3">
                <div className={`h-2 w-2 mt-1.5 rounded-full ${submission.status === 'REJECTED_L1' ? 'bg-k2l-red' : 'bg-k2l-success'}`} />
                <div>
                  <p className="text-k2l-gray-600">
                    {submission.status === 'REJECTED_L1' ? 'Rejeté' : 'Validé'} par{' '}
                    <span className="font-medium">{submission.level1Validator?.fullName || 'Superviseur'}</span>
                  </p>
                  <p className="text-k2l-gray-400">{formatDate(submission.level1At)}</p>
                  {submission.level1Comment && (
                    <p className="mt-1 text-k2l-gray-500 italic">« {submission.level1Comment} »</p>
                  )}
                </div>
              </div>
            )}
            {submission.level2At && (
              <div className="flex items-start gap-3">
                <div className={`h-2 w-2 mt-1.5 rounded-full ${submission.status === 'REJECTED_L2' ? 'bg-k2l-red' : 'bg-k2l-success'}`} />
                <div>
                  <p className="text-k2l-gray-600">
                    {submission.status === 'REJECTED_L2' ? 'Rejeté' : 'Validé'} par{' '}
                    <span className="font-medium">{submission.level2Validator?.fullName || 'Coordinateur'}</span>
                  </p>
                  <p className="text-k2l-gray-400">{formatDate(submission.level2At)}</p>
                  {submission.level2Comment && (
                    <p className="mt-1 text-k2l-gray-500 italic">« {submission.level2Comment} »</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="px-4 pb-6 pt-2">
        {canValidate ? (
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
        ) : (
          <div className={`flex items-center justify-center gap-2 rounded-xl py-4 ${statusInfo.bg}`}>
            <span className="text-xl">{statusInfo.icon}</span>
            <span className={`font-head text-sm font-semibold ${statusInfo.text}`}>{statusInfo.label}</span>
          </div>
        )}
      </div>
    </div>
  );
}
