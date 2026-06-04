import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { RiArrowLeftLine, RiCameraLine, RiLoader4Line, RiUserLine, RiMapPinLine, RiSmartphoneLine } from '@/common/icons';
import FormCard from '@/common/components/FormCard';
import FormInput from '@/common/components/FormInput';
import FormSelect from '@/common/components/FormSelect';
import GpsCapture, { type GpsData } from '@/common/components/GpsCapture';
import PhotoCapture from '@/common/components/PhotoCapture';
import { useToastStore } from '@/common/stores/toast.store';
import { createSubmission } from '@/lib/submissionService';
import type { PhotoCategory } from '@/lib/offlineDb';
import { useMyZoneCommunes, type Quartier } from '@/common/hooks/useMyZoneCommunes';

const GENDERS = [{ value: 'HOMME', label: 'Homme' }, { value: 'FEMME', label: 'Femme' }];
const APP_STATUSES = [
  { value: 'INSTALLED', label: 'Installée' },
  { value: 'INSTALLED_ACTIVATED', label: 'Installée + Activée' },
];
const PROFESSIONS = [
  'Commercant', 'Fonctionnaire', 'Enseignant', 'Etudiant', 'Agriculteur',
  'Artisan', 'Transporteur', 'Menagere', 'Sans emploi', 'Autre',
];

const OTHER_OPTION = '__OTHER__';

export default function ProspectFormPage() {
  const navigate = useNavigate();
  const showToast = useToastStore((s) => s.show);
  const clientUuid = useMemo(() => uuidv4(), []);

  // Charger les communes/quartiers de la zone
  const { data: zoneData, loading: loadingZone } = useMyZoneCommunes();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [profession, setProfession] = useState('');
  const [gender, setGender] = useState('HOMME');
  const [age, setAge] = useState('');
  
  // Localisation - peut être ID (dropdown) ou texte libre (saisie manuelle)
  const [communeId, setCommuneId] = useState<string>('');
  const [communeManual, setCommuneManual] = useState('');
  const [quartierId, setQuartierId] = useState<string>('');
  const [quartierManual, setQuartierManual] = useState('');
  const [isManualLocation, setIsManualLocation] = useState(false);
  
  const [phoneType, setPhoneType] = useState('');
  const [appStatus, setAppStatus] = useState('INSTALLED');
  const [bankAccount, setBankAccount] = useState('');
  const [observations, setObservations] = useState('');
  const [gps, setGps] = useState<GpsData | null>(null);
  const [captured, setCaptured] = useState<Set<PhotoCategory>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  // Options communes pour le dropdown
  const communeOptions = useMemo(() => {
    const options = (zoneData?.communes || []).map(c => ({ value: c.id, label: c.name }));
    options.push({ value: OTHER_OPTION, label: '📍 Autre (saisie manuelle)' });
    return options;
  }, [zoneData]);

  // Quartiers de la commune sélectionnée
  const availableQuartiers = useMemo<Quartier[]>(() => {
    if (!communeId || communeId === OTHER_OPTION) return [];
    const commune = zoneData?.communes.find(c => c.id === communeId);
    return commune?.quartiers || [];
  }, [communeId, zoneData]);

  // Options quartiers pour le dropdown
  const quartierOptions = useMemo(() => {
    const options = availableQuartiers.map(q => ({ value: q.id, label: q.name }));
    if (options.length > 0) {
      options.push({ value: OTHER_OPTION, label: '📍 Autre quartier' });
    }
    return options;
  }, [availableQuartiers]);

  // Initialiser avec la première commune quand les données arrivent
  useEffect(() => {
    if (zoneData?.communes.length && communeId === '') {
      setCommuneId(zoneData.communes[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoneData]);

  // Gérer le changement de commune
  const handleCommuneChange = (value: string) => {
    setCommuneId(value);
    setQuartierId('');
    setQuartierManual('');
    setIsManualLocation(value === OTHER_OPTION);
  };

  // Gérer le changement de quartier
  const handleQuartierChange = (value: string) => {
    setQuartierId(value);
    if (value === OTHER_OPTION) {
      setQuartierManual('');
    }
  };

  const onGpsCapture = useCallback((data: GpsData) => setGps(data), []);

  const onPhotoCaptured = useCallback((category: PhotoCategory) => {
    setCaptured((prev) => new Set(prev).add(category));
  }, []);

  const hasPhoto = (cat: PhotoCategory) => captured.has(cat);

  const handleSubmit = async (asDraft = false) => {
    if (!asDraft) {
      if (!fullName.trim()) { showToast('Nom complet obligatoire', 'error'); return; }
      if (!phone.trim()) { showToast('Telephone obligatoire', 'error'); return; }
      if (!profession) { showToast('Profession obligatoire', 'error'); return; }
      if (!hasPhoto('APP_SCREEN')) { showToast('Photo ecran app obligatoire', 'error'); return; }
      if (!hasPhoto('ID_DOCUMENT')) { showToast('Photo CNI obligatoire', 'error'); return; }
    }

    // Déterminer les valeurs de commune/quartier à envoyer
    const isManual = communeId === OTHER_OPTION;
    const finalCommuneId = isManual ? undefined : communeId || undefined;
    const finalQuartierId = (isManual || quartierId === OTHER_OPTION) ? undefined : quartierId || undefined;
    const finalCommune = isManual ? communeManual : (zoneData?.communes.find(c => c.id === communeId)?.name || '');
    const finalQuartier = isManual 
      ? quartierManual 
      : (quartierId === OTHER_OPTION 
        ? quartierManual 
        : availableQuartiers.find(q => q.id === quartierId)?.name || quartierManual || undefined);

    setSubmitting(true);
    try {
      await createSubmission('PROSPECT', {
        type: 'PROSPECT',
        clientUuid,
        requestedStatus: asDraft ? 'DRAFT' : 'SUBMITTED',
        communeId: finalCommuneId,
        quartierId: finalQuartierId,
        commune: finalCommune,
        quartier: finalQuartier || undefined,
        latitude: gps?.latitude,
        longitude: gps?.longitude,
        gpsAccuracy: gps?.accuracy,
        gpsCapturedAt: gps?.capturedAt,
        prospectFullName: fullName,
        prospectPhone: phone,
        prospectProfession: profession,
        prospectGender: gender,
        prospectAge: age ? parseInt(age) : undefined,
        appStatus: appStatus as 'INSTALLED' | 'INSTALLED_ACTIVATED',
        phoneType: phoneType || undefined,
        bankAccount: bankAccount || undefined,
        observations: observations || undefined,
        // Les photos sont stockées en Blob local (IndexedDB) et uploadées
        // lors de la synchronisation atomique. On ne passe PAS d'URLs ici.
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
          <FormInput label="Nom complet *" value={fullName} onChange={setFullName} placeholder="Nom et prenoms" />
          <FormInput label="Telephone *" value={phone} onChange={setPhone} placeholder="+225 07 00 00 00 00" type="tel" />
          <FormSelect label="Profession *" value={profession} onChange={setProfession} options={PROFESSIONS} />
          <div className="grid grid-cols-2 gap-2.5">
            <FormSelect label="Genre" value={gender} onChange={setGender} options={GENDERS} />
            <FormInput label="Age" value={age} onChange={setAge} placeholder="25" type="number" />
          </div>
        </FormCard>

        <FormCard title="Localisation" icon={RiMapPinLine}>
          {loadingZone ? (
            <div className="flex items-center justify-center py-4">
              <RiLoader4Line className="animate-spin text-xl text-k2l-primary" />
              <span className="ml-2 text-sm text-k2l-gray-500">Chargement des communes...</span>
            </div>
          ) : (
            <>
              {/* Sélection commune */}
              <FormSelect 
                label="Commune *" 
                value={communeId} 
                onChange={handleCommuneChange} 
                options={communeOptions} 
              />
              
              {/* Saisie manuelle commune si "Autre" */}
              {isManualLocation && (
                <FormInput 
                  label="Nom de la commune *" 
                  value={communeManual} 
                  onChange={setCommuneManual} 
                  placeholder="Entrez le nom de la commune" 
                />
              )}
              
              {/* Sélection quartier (si commune de la zone) */}
              {!isManualLocation && quartierOptions.length > 0 && (
                <FormSelect 
                  label="Quartier" 
                  value={quartierId} 
                  onChange={handleQuartierChange} 
                  options={[{ value: '', label: '-- Sélectionner --' }, ...quartierOptions]} 
                />
              )}
              
              {/* Saisie manuelle quartier */}
              {(isManualLocation || quartierId === OTHER_OPTION || quartierOptions.length === 0) && (
                <FormInput 
                  label={isManualLocation ? "Quartier" : "Nom du quartier"}
                  value={quartierManual} 
                  onChange={setQuartierManual} 
                  placeholder="Ex: Remblais" 
                />
              )}
            </>
          )}
          <GpsCapture onCapture={onGpsCapture} />
        </FormCard>

        <FormCard title="Application mobile" icon={RiSmartphoneLine}>
          <FormInput label="Type de telephone" value={phoneType} onChange={setPhoneType} placeholder="Ex: Samsung A15" />
          <FormSelect label="Statut appli" value={appStatus} onChange={setAppStatus} options={APP_STATUSES} />
          <FormInput label="N° compte" value={bankAccount} onChange={setBankAccount} placeholder="Optionnel" />
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

        {/* Photos obligatoires */}
        <FormCard title="Photos obligatoires" icon={RiCameraLine}>
          <PhotoCapture
            category="APP_SCREEN"
            label="Ecran avec l'app installee *"
            clientUuid={clientUuid}
            onCaptured={onPhotoCaptured}
          />
          <PhotoCapture
            category="ID_DOCUMENT"
            label="CNI du client *"
            clientUuid={clientUuid}
            onCaptured={onPhotoCaptured}
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
