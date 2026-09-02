import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { RiArrowLeftLine, RiLoader4Line, RiUserLine, RiMapPinLine, RiSmartphoneLine } from '@/common/icons';
import FormCard from '@/common/components/FormCard';
import FormInput from '@/common/components/FormInput';
import FormSelect from '@/common/components/FormSelect';
import GpsCapture, { type GpsData } from '@/common/components/GpsCapture';
import { useToastStore } from '@/common/stores/toast.store';
import { useAuthStore } from '@/common/stores/auth.store';
import { createSubmission } from '@/lib/submissionService';
import { useMyZoneCommunes } from '@/common/hooks/useMyZoneCommunes';

const GENDERS = [{ value: 'HOMME', label: 'Homme' }, { value: 'FEMME', label: 'Femme' }];
const APP_STATUSES = [
  { value: 'INSTALLED', label: 'Installée' },
  { value: 'INSTALLED_TRANSACTIONS', label: 'Installée + Transactions' },
];

export default function ProspectFormPage() {
  const navigate = useNavigate();
  const showToast = useToastStore((s) => s.show);
  const user = useAuthStore((s) => s.user);
  const clientUuid = useMemo(() => uuidv4(), []);

  // Charger les communes du cluster du commercial
  const { data: zoneData, loading: loadingZone } = useMyZoneCommunes();

  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [gender, setGender] = useState('HOMME');

  // Localisation - commune en dropdown (cluster)
  const [communeId, setCommuneId] = useState<string>('');

  const [appStatus, setAppStatus] = useState('INSTALLED');
  const [sponsorCode, setSponsorCode] = useState(user?.sponsorCode || '');
  const [observations, setObservations] = useState('');
  const [gps, setGps] = useState<GpsData | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onGpsCapture = useCallback((data: GpsData) => setGps(data), []);

  // Options communes pour le dropdown (sans option de saisie manuelle)
  const communeOptions = useMemo(() => {
    return (zoneData?.communes || []).map(c => ({ value: c.id, label: c.name }));
  }, [zoneData]);

  // Initialiser avec la première commune quand les données arrivent
  useEffect(() => {
    if (zoneData?.communes.length && communeId === '') {
      setCommuneId(zoneData.communes[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoneData]);

  // Validation du téléphone (exactement 10 chiffres)
  const validatePhone = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '');
    if (digitsOnly.length !== 10) {
      setPhoneError('Le numéro doit contenir exactement 10 chiffres');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    if (value.trim()) validatePhone(value);
    else setPhoneError('');
  };

  const handleSubmit = async (asDraft = false) => {
    if (!asDraft) {
      if (!phone.trim()) { showToast('Telephone obligatoire', 'error'); return; }
      if (!validatePhone(phone)) { showToast('Numéro de téléphone invalide (10 chiffres requis)', 'error'); return; }
    }

    setSubmitting(true);
    try {
      const selectedCommune = zoneData?.communes.find(c => c.id === communeId);
      await createSubmission('PROSPECT', {
        type: 'PROSPECT',
        clientUuid,
        requestedStatus: asDraft ? 'DRAFT' : 'SUBMITTED',
        communeId: communeId || undefined,
        commune: selectedCommune?.name || undefined,
        latitude: gps?.latitude,
        longitude: gps?.longitude,
        gpsAccuracy: gps?.accuracy,
        gpsCapturedAt: gps?.capturedAt,
        prospectPhone: phone.replace(/\D/g, ''),
        prospectGender: gender,
        appStatus: appStatus as 'INSTALLED' | 'INSTALLED_TRANSACTIONS',
        sponsorCode: sponsorCode || undefined,
        observations: observations || undefined,
      });
      showToast(asDraft ? 'Brouillon sauvegarde' : 'Prospect enregistre !', 'success');
      navigate('/', { replace: true });
    } catch {
      showToast('Erreur lors de la soumission', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col bg-k2l-gray-100">
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between bg-k2l-navy px-5 py-3.5">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-[13px] text-white/80">
          <RiArrowLeftLine className="text-base" /> Retour
        </button>
        <span className="font-head text-[17px] font-semibold text-white">Nouveau Prospect</span>
        <button onClick={() => handleSubmit(true)} disabled={submitting} className="rounded-sm bg-white/15 px-3 py-1.5 text-xs font-medium text-white">
          Brouillon
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 space-y-3.5 p-4">
        <FormCard title="Identite du prospect" icon={RiUserLine}>
          <div>
            <FormInput 
              label="Telephone *" 
              value={phone} 
              onChange={handlePhoneChange} 
              placeholder="0700000000" 
              type="tel" 
            />
            {phoneError && <p className="mt-1 text-xs text-red-500">{phoneError}</p>}
          </div>
          <FormSelect label="Genre" value={gender} onChange={setGender} options={GENDERS} />
        </FormCard>

        <FormCard title="Localisation" icon={RiMapPinLine}>
          {loadingZone ? (
            <div className="flex items-center justify-center py-4">
              <RiLoader4Line className="animate-spin text-xl text-k2l-primary" />
              <span className="ml-2 text-sm text-k2l-gray-500">Chargement des communes...</span>
            </div>
          ) : (
            <FormSelect
              label="Commune *"
              value={communeId}
              onChange={setCommuneId}
              options={communeOptions}
            />
          )}
          <GpsCapture onCapture={onGpsCapture} />
        </FormCard>

        <FormCard title="Application mobile" icon={RiSmartphoneLine}>
          <FormSelect label="Statut appli" value={appStatus} onChange={setAppStatus} options={APP_STATUSES} />
          <FormInput label="Code parrain" value={sponsorCode} onChange={setSponsorCode} placeholder="Code du commercial parrain" />
        </FormCard>

        <FormCard title="Observations" icon={RiUserLine}>
          <textarea
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            placeholder="Notes supplementaires..."
            rows={3}
            className="w-full rounded-sm border-[1.5px] border-k2l-gray-200 bg-white px-3.5 py-3 font-body text-[15px] text-k2l-gray-900 outline-none transition-colors focus:border-k2l-primary"
          />
        </FormCard>

        {/* Submit */}
        <button onClick={() => handleSubmit(false)} disabled={submitting}
          className="w-full rounded-md bg-k2l-primary py-4 font-head text-base font-semibold text-white transition-all active:scale-[0.98] active:bg-k2l-navy disabled:opacity-60">
          {submitting ? <RiLoader4Line className="mx-auto animate-spin text-xl" /> : 'Soumettre le prospect'}
        </button>
        <button onClick={() => navigate('/')} className="mb-5 w-full rounded-md border-[1.5px] border-k2l-gray-200 py-3 text-[15px] font-medium text-k2l-gray-600 transition-colors hover:bg-k2l-gray-100">
          Annuler
        </button>
      </div>
    </div>
  );
}
