import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import {
  RiArrowLeftLine, RiCameraLine, RiLoader4Line,
  RiStore2Line, RiMapPinLine,
} from '@/common/icons';
import FormCard from '@/common/components/FormCard';
import FormInput from '@/common/components/FormInput';
import FormSelect from '@/common/components/FormSelect';
import GpsCapture, { type GpsData } from '@/common/components/GpsCapture';
import PhotoCapture from '@/common/components/PhotoCapture';
import { useToastStore } from '@/common/stores/toast.store';
import { createSubmission } from '@/lib/submissionService';
import type { PhotoCategory } from '@/lib/offlineDb';
import { useMyZoneCommunes, type Quartier } from '@/common/hooks/useMyZoneCommunes';

const OTHER_OPTION = '__OTHER__';

const TYPES_COMMERCE = [
  { value: 'boutique', label: 'Boutique' },
  { value: 'pharmacie', label: 'Pharmacie' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'supermarche', label: 'Supermarché' },
  { value: 'quincaillerie', label: 'Quincaillerie' },
  { value: 'pressing', label: 'Pressing' },
  { value: 'salon_coiffure', label: 'Salon de coiffure' },
  { value: 'autre', label: 'Autre' },
];

export default function MarchandFormPage() {
  const navigate = useNavigate();
  const showToast = useToastStore((s) => s.show);
  const clientUuid = useMemo(() => uuidv4(), []);

  // Charger les communes/quartiers de la zone
  const { data: zoneData, loading: loadingZone } = useMyZoneCommunes();

  const [typeCommerce, setTypeCommerce] = useState('boutique');
  const [nom, setNom] = useState('');
  const [proprio, setProprio] = useState('');
  const [tel, setTel] = useState('');
  const [rccm, setRccm] = useState('');
  
  // Localisation - peut être ID (dropdown) ou texte libre (saisie manuelle)
  const [communeId, setCommuneId] = useState<string>('');
  const [communeManual, setCommuneManual] = useState('');
  const [quartierId, setQuartierId] = useState<string>('');
  const [quartierManual, setQuartierManual] = useState('');
  const [isManualLocation, setIsManualLocation] = useState(false);
  
  const [adresse, setAdresse] = useState('');
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
      if (!nom.trim()) { showToast('Nom du commerce obligatoire', 'error'); return; }
      if (!proprio.trim()) { showToast('Nom proprietaire obligatoire', 'error'); return; }
      if (!tel.trim()) { showToast('Telephone obligatoire', 'error'); return; }
      if (!hasPhoto('STOREFRONT')) { showToast('Photo facade obligatoire', 'error'); return; }
      if (!hasPhoto('QR_CODE')) { showToast('Photo QR code obligatoire', 'error'); return; }
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
      await createSubmission('MARCHAND', {
        type: 'MARCHAND',
        clientUuid,
        requestedStatus: asDraft ? 'DRAFT' : 'SUBMITTED',
        communeId: finalCommuneId,
        quartierId: finalQuartierId,
        commune: finalCommune,
        quartier: finalQuartier || undefined,
        addressNote: adresse || undefined,
        latitude: gps?.latitude,
        longitude: gps?.longitude,
        gpsAccuracy: gps?.accuracy,
        gpsCapturedAt: gps?.capturedAt,
        merchantName: nom,
        merchantOwner: proprio || undefined,
        merchantPhone: tel,
        merchantActivity: typeCommerce,
        merchantRccm: rccm || undefined,
        // Les photos sont stockées en Blob local (IndexedDB) et uploadées
        // lors de la synchronisation atomique. On ne passe PAS d'URLs ici.
      });
      showToast(asDraft ? 'Brouillon sauvegarde' : 'Marchand enregistre !', 'success');
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
        <span className="font-head text-[17px] font-semibold text-white">Enroler Marchand</span>
        <button onClick={() => handleSubmit(true)} disabled={submitting} className="rounded-sm bg-white/15 px-3 py-1.5 text-xs font-medium text-white">
          Brouillon
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 space-y-3.5 p-4">
        {/* Type de commerce */}
        <FormCard title="Type de commerce" icon={RiStore2Line}>
          <FormSelect
            label="Type de commerce *"
            value={typeCommerce}
            onChange={setTypeCommerce}
            options={TYPES_COMMERCE}
          />
        </FormCard>

        {/* Infos commerce */}
        <FormCard title="Informations du commerce" icon={RiStore2Line}>
          <FormInput label="Nom du commerce *" value={nom} onChange={setNom} placeholder="Ex: Boutique Fatima" />
          <FormInput label="Nom du proprietaire *" value={proprio} onChange={setProprio} placeholder="Nom complet" />
          <div className="grid grid-cols-2 gap-2.5">
            <FormInput label="Telephone *" value={tel} onChange={setTel} placeholder="+225 07 00 00 00 00" type="tel" />
            <FormInput label="NCC / RCCM" value={rccm} onChange={setRccm} placeholder="Optionnel" />
          </div>
        </FormCard>

        {/* Localisation */}
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
                  placeholder="Ex: Zone 4" 
                />
              )}
            </>
          )}
          <FormInput label="Adresse / Description" value={adresse} onChange={setAdresse} placeholder="Ex: Face a la mairie, kiosque N 3..." />
          <GpsCapture onCapture={onGpsCapture} />
        </FormCard>

        {/* Photos obligatoires */}
        <FormCard title="Photos obligatoires" icon={RiCameraLine}>
          <PhotoCapture
            category="STOREFRONT"
            label="Facade du commerce *"
            clientUuid={clientUuid}
            onCaptured={onPhotoCaptured}
          />
          <PhotoCapture
            category="QR_CODE"
            label="QR code marchand installe *"
            clientUuid={clientUuid}
            onCaptured={onPhotoCaptured}
          />
          <PhotoCapture
            category="ID_DOCUMENT"
            label="CNI du proprietaire *"
            clientUuid={clientUuid}
            onCaptured={onPhotoCaptured}
          />
        </FormCard>

        {/* Submit */}
        <button onClick={() => handleSubmit(false)} disabled={submitting}
          className="w-full rounded-md bg-k2l-primary py-4 font-head text-base font-semibold text-white transition-all active:scale-[0.98] active:bg-k2l-navy disabled:opacity-60">
          {submitting ? <RiLoader4Line className="mx-auto animate-spin text-xl" /> : 'Enroler le marchand'}
        </button>
        <button onClick={() => navigate('/')} className="mb-5 w-full rounded-md border-[1.5px] border-k2l-gray-200 py-3 text-[15px] font-medium text-k2l-gray-600 transition-colors hover:bg-k2l-gray-100">
          Annuler
        </button>
      </div>
    </div>
  );
}
