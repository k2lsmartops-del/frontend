import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  RiArrowLeftLine, RiLoader4Line, RiLockLine,
  RiMapPinLine, RiUserLine, RiStore2Line, RiFileList2Line, RiCameraLine,
} from '@/common/icons';
import { useToastStore } from '@/common/stores/toast.store';
import { useOnlineStatus } from '@/common/hooks/useOnlineStatus';
import api from '@/common/services/api';
import FormCard from '@/common/components/FormCard';
import FormInput from '@/common/components/FormInput';
import FormSelect from '@/common/components/FormSelect';
import PhotoCapture from '@/common/components/PhotoCapture';
import type { PhotoCategory } from '@/lib/offlineDb';

const COMMUNES = ['', 'Marcory', 'Yopougon', 'Adjame', 'Plateau', 'Cocody', 'Abobo', 'Treichville', 'Port-Bouet'];
const PROFESSIONS = ['', 'Commercant', 'Fonctionnaire', 'Etudiant', 'Artisan', 'Agriculteur', 'Autre'];

interface PhotoMeta {
  url: string;
  publicId: string;
  category: PhotoCategory;
  width: number;
  height: number;
  bytes: number;
}

interface ExistingPhoto {
  id: string;
  url: string;
  category: string;
}

interface SubmissionData {
  id: string;
  type: string;
  status: string;
  clientUuid: string;
  commune: string;
  quartier: string;
  addressNote: string;
  prospectFullName?: string;
  prospectPhone?: string;
  prospectProfession?: string;
  prospectGender?: string;
  prospectAge?: string;
  appStatus?: string;
  phoneType?: string;
  bankAccount?: string;
  observations?: string;
  merchantName?: string;
  merchantOwner?: string;
  merchantPhone?: string;
  merchantActivity?: string;
  merchantRccm?: string;
  photos?: ExistingPhoto[];
}

export default function EditSubmissionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const showToast = useToastStore((s) => s.show);
  const isOnline = useOnlineStatus();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editable, setEditable] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [blockedStatus, setBlockedStatus] = useState('');
  const [form, setForm] = useState<SubmissionData | null>(null);
  const [newPhotos, setNewPhotos] = useState<PhotoMeta[]>([]);

  const onPhotoUploaded = (meta: PhotoMeta) => {
    setNewPhotos((prev) => {
      const filtered = prev.filter((p) => p.category !== meta.category);
      return [...filtered, meta];
    });
  };

  const getExistingPhotoUrl = (category: string) => {
    const newP = newPhotos.find((p) => p.category === category);
    if (newP) return newP.url;
    return form?.photos?.find((p) => p.category === category)?.url;
  };

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      // Vérifier d'abord si modifiable
      if (isOnline) {
        const { data: check } = await api.get(`/submissions/${id}/check-editable`);
        if (!check.editable) {
          setBlocked(true);
          setBlockedStatus(check.status);
          setLoading(false);
          return;
        }
      }
      // Charger les données
      const { data } = await api.get(`/submissions/${id}`);
      setForm(data);
      setEditable(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de chargement';
      showToast(msg, 'error');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  }, [id, isOnline, showToast, navigate]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const set = (key: keyof SubmissionData) => (val: string) =>
    setForm((prev) => (prev ? { ...prev, [key]: val } : prev));

  const handleSave = async () => {
    if (!form || !id) return;

    // Re-vérifier le statut distant avant de sauvegarder
    if (isOnline) {
      try {
        const { data: check } = await api.get(`/submissions/${id}/check-editable`);
        if (!check.editable) {
          setBlocked(true);
          setBlockedStatus(check.status);
          showToast(`Modification impossible : statut "${check.status}"`, 'error');
          return;
        }
      } catch {
        showToast('Impossible de vérifier le statut. Réessayez.', 'error');
        return;
      }
    } else {
      showToast('Vous devez être en ligne pour modifier une soumission.', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        commune: form.commune,
        quartier: form.quartier,
        addressNote: form.addressNote,
        observations: form.observations,
      };

      if (form.type === 'PROSPECT') {
        payload.prospectFullName = form.prospectFullName;
        payload.prospectPhone = form.prospectPhone;
        payload.prospectProfession = form.prospectProfession;
        payload.prospectGender = form.prospectGender;
        payload.prospectAge = form.prospectAge;
        payload.appStatus = form.appStatus;
        payload.phoneType = form.phoneType;
        payload.bankAccount = form.bankAccount;
      } else {
        payload.merchantName = form.merchantName;
        payload.merchantOwner = form.merchantOwner;
        payload.merchantPhone = form.merchantPhone;
        payload.merchantActivity = form.merchantActivity;
        payload.merchantRccm = form.merchantRccm;
      }

      // Inclure les nouvelles photos si modifiées
      if (newPhotos.length > 0) {
        payload.photos = newPhotos.map((p) => ({
          cloudinaryPublicId: p.publicId,
          url: p.url,
          category: p.category,
          width: p.width,
          height: p.height,
          bytes: p.bytes,
        }));
      }

      await api.patch(`/submissions/${id}`, payload);
      showToast('Soumission modifiée avec succès', 'success');
      navigate(-1);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Erreur lors de la modification';
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Écran de chargement ──
  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-k2l-gray-100">
        <RiLoader4Line className="animate-spin text-3xl text-k2l-primary" />
      </div>
    );
  }

  // ── Soumission non modifiable ──
  if (blocked) {
    const statusLabels: Record<string, string> = {
      SUPERVISOR_APPROVED: 'Validée niveau 1',
      VALIDATED: 'Validée',
      REJECTED_L1: 'Rejetée niveau 1',
      REJECTED_L2: 'Rejetée niveau 2',
    };
    return (
      <div className="flex min-h-full flex-col items-center justify-center bg-k2l-gray-100 px-6 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-k2l-red-light">
          <RiLockLine className="text-3xl text-k2l-red" />
        </div>
        <h2 className="font-head text-lg font-bold text-k2l-gray-900">Modification impossible</h2>
        <p className="mt-2 text-sm text-k2l-gray-500">
          Cette soumission est au statut <strong>{statusLabels[blockedStatus] ?? blockedStatus}</strong>.
          Elle a déjà été prise en charge par un validateur.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="mt-6 rounded-sm bg-k2l-navy px-6 py-2.5 text-sm font-medium text-white"
        >
          Retour
        </button>
      </div>
    );
  }

  if (!form || !editable) return null;

  // ── Formulaire d'édition ──
  return (
    <div className="min-h-full bg-k2l-gray-100">
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between bg-k2l-navy px-5 py-3.5">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-[13px] text-white/80">
          <RiArrowLeftLine className="text-base" /> Retour
        </button>
        <span className="font-head text-[17px] font-semibold text-white">
          Modifier {form.type === 'PROSPECT' ? 'Prospect' : 'Marchand'}
        </span>
        <div className="w-16" />
      </div>

      <div className="space-y-4 p-4">
        {/* Localisation */}
        <FormCard title="Localisation" icon={RiMapPinLine}>
          <FormSelect label="Commune" value={form.commune || ''} onChange={set('commune')} options={COMMUNES} />
          <FormInput label="Quartier" value={form.quartier || ''} onChange={set('quartier')} />
          <FormInput label="Adresse / repère" value={form.addressNote || ''} onChange={set('addressNote')} />
        </FormCard>

        {/* Champs prospect */}
        {form.type === 'PROSPECT' && (
          <FormCard title="Informations prospect" icon={RiUserLine}>
            <FormInput label="Nom complet" value={form.prospectFullName || ''} onChange={set('prospectFullName')} />
            <FormInput label="Téléphone" value={form.prospectPhone || ''} onChange={set('prospectPhone')} />
            <FormSelect label="Profession" value={form.prospectProfession || ''} onChange={set('prospectProfession')} options={PROFESSIONS} />
            <FormSelect label="Genre" value={form.prospectGender || ''} onChange={set('prospectGender')} options={['', 'HOMME', 'FEMME']} />
            <FormInput label="Âge" value={form.prospectAge || ''} onChange={set('prospectAge')} />
            <FormSelect label="Statut app" value={form.appStatus || ''} onChange={set('appStatus')} options={[{ value: '', label: '— Choisir —' }, { value: 'INSTALLED', label: 'Installée' }, { value: 'INSTALLED_ACTIVATED', label: 'Installée + Activée' }]} />
            <FormInput label="Type téléphone" value={form.phoneType || ''} onChange={set('phoneType')} />
            <FormSelect label="Compte bancaire" value={form.bankAccount || ''} onChange={set('bankAccount')} options={['', 'OUI', 'NON']} />
          </FormCard>
        )}

        {/* Champs marchand */}
        {form.type === 'MARCHAND' && (
          <FormCard title="Informations marchand" icon={RiStore2Line}>
            <FormInput label="Nom commerce" value={form.merchantName || ''} onChange={set('merchantName')} />
            <FormInput label="Propriétaire" value={form.merchantOwner || ''} onChange={set('merchantOwner')} />
            <FormInput label="Téléphone" value={form.merchantPhone || ''} onChange={set('merchantPhone')} />
            <FormInput label="Activité" value={form.merchantActivity || ''} onChange={set('merchantActivity')} />
            <FormInput label="RCCM" value={form.merchantRccm || ''} onChange={set('merchantRccm')} />
          </FormCard>
        )}

        {/* Photos */}
        <FormCard title="Photos" icon={RiCameraLine}>
          {form.type === 'PROSPECT' ? (
            <>
              <PhotoCapture
                category="APP_SCREEN"
                label="Ecran avec l'app installee"
                clientUuid={form.clientUuid}
                onUploaded={onPhotoUploaded}
                existingUrl={getExistingPhotoUrl('APP_SCREEN')}
              />
              <PhotoCapture
                category="ID_DOCUMENT"
                label="CNI du client"
                clientUuid={form.clientUuid}
                onUploaded={onPhotoUploaded}
                existingUrl={getExistingPhotoUrl('ID_DOCUMENT')}
              />
            </>
          ) : (
            <>
              <PhotoCapture
                category="STOREFRONT"
                label="Facade du commerce"
                clientUuid={form.clientUuid}
                onUploaded={onPhotoUploaded}
                existingUrl={getExistingPhotoUrl('STOREFRONT')}
              />
              <PhotoCapture
                category="QR_CODE"
                label="QR Code"
                clientUuid={form.clientUuid}
                onUploaded={onPhotoUploaded}
                existingUrl={getExistingPhotoUrl('QR_CODE')}
              />
              <PhotoCapture
                category="ID_DOCUMENT"
                label="CNI du proprietaire"
                clientUuid={form.clientUuid}
                onUploaded={onPhotoUploaded}
                existingUrl={getExistingPhotoUrl('ID_DOCUMENT')}
              />
            </>
          )}
        </FormCard>

        {/* Observations */}
        <FormCard title="Observations" icon={RiFileList2Line}>
          <FormInput label="Observations" value={form.observations || ''} onChange={set('observations')} />
        </FormCard>

        {/* Bouton sauvegarder */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-sm bg-k2l-primary py-3.5 font-head text-sm font-semibold uppercase tracking-wider text-white transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {saving && <RiLoader4Line className="animate-spin" />}
          {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      </div>
    </div>
  );
}
