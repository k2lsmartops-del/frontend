import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import type { IconType } from 'react-icons';
import {
  RiArrowLeftLine, RiCameraLine, RiCloseLine, RiLoader4Line,
  RiShoppingCartLine, RiMedicineBottleLine, RiRestaurant2Line, RiBuilding2Line,
  RiStore2Line, RiMapPinLine,
} from '@/common/icons';
import FormCard from '@/common/components/FormCard';
import FormInput from '@/common/components/FormInput';
import FormSelect from '@/common/components/FormSelect';
import GpsWidget from '@/common/components/GpsWidget';
import { useGeolocation } from '@/common/hooks/useGeolocation';
import { useToastStore } from '@/common/stores/toast.store';
import { submissionService } from '@/features/submissions/services/submission.service';

const COMMUNES = ['Marcory', 'Yopougon', 'Adjame', 'Plateau', 'Cocody', 'Abobo', 'Treichville', 'Port-Bouet'];

interface CommerceType { value: string; label: string; icon: IconType }
const TYPES_COMMERCE: CommerceType[] = [
  { value: 'boutique', label: 'Boutique', icon: RiShoppingCartLine },
  { value: 'pharmacie', label: 'Pharmacie', icon: RiMedicineBottleLine },
  { value: 'restaurant', label: 'Restaurant', icon: RiRestaurant2Line },
  { value: 'autre', label: 'Autre', icon: RiBuilding2Line },
];

export default function MarchandFormPage() {
  const navigate = useNavigate();
  const showToast = useToastStore((s) => s.show);
  const { gps, loading: gpsLoading, capture: captureGps, reset: resetGps } = useGeolocation();

  const [typeCommerce, setTypeCommerce] = useState('boutique');
  const [nom, setNom] = useState('');
  const [proprio, setProprio] = useState('');
  const [tel, setTel] = useState('');
  const [rccm, setRccm] = useState('');
  const [commune, setCommune] = useState(COMMUNES[0]);
  const [adresse, setAdresse] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const addPhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => setPhotos((prev) => [...prev, reader.result as string]);
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const removePhoto = (index: number) => setPhotos((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    if (!nom.trim()) { showToast('Nom du commerce obligatoire', 'error'); return; }
    if (!tel.trim()) { showToast('Telephone obligatoire', 'error'); return; }
    setSubmitting(true);
    try {
      await submissionService.create({
        type: 'MARCHAND',
        clientUuid: uuidv4(),
        commune,
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
      });
      showToast('Marchand enrole !', 'success');
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
        <button onClick={() => showToast('Brouillon sauvegarde', 'success')} className="rounded-sm bg-white/15 px-3 py-1.5 text-xs font-medium text-white">
          Brouillon
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 space-y-3.5 p-4">
        {/* Type de commerce */}
        <FormCard title="Type de commerce" icon={RiStore2Line}>
          <div className="grid grid-cols-2 gap-2">
            {TYPES_COMMERCE.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.value}
                  onClick={() => setTypeCommerce(t.value)}
                  className={`flex flex-col items-center rounded-sm border-[1.5px] px-2.5 py-3 transition-all ${
                    typeCommerce === t.value
                      ? 'border-k2l-primary bg-k2l-primary-light'
                      : 'border-k2l-gray-200 bg-white'
                  }`}
                >
                  <Icon className="text-[22px] text-k2l-gray-900" />
                  <span className="mt-1.5 text-xs font-medium text-k2l-gray-900">{t.label}</span>
                </button>
              );
            })}
          </div>
        </FormCard>

        {/* Infos commerce */}
        <FormCard title="Informations du commerce" icon={RiStore2Line}>
          <FormInput label="Nom du commerce *" value={nom} onChange={setNom} placeholder="Ex: Boutique Fatima" />
          <FormInput label="Nom du proprietaire" value={proprio} onChange={setProprio} placeholder="Nom complet" />
          <div className="grid grid-cols-2 gap-2.5">
            <FormInput label="Telephone *" value={tel} onChange={setTel} placeholder="07 00 00 00" type="tel" />
            <FormInput label="NCC / RCCM" value={rccm} onChange={setRccm} placeholder="Optionnel" />
          </div>
        </FormCard>

        {/* Localisation */}
        <FormCard title="Localisation" icon={RiMapPinLine}>
          <FormSelect label="Commune *" value={commune} onChange={setCommune} options={COMMUNES} />
          <FormInput label="Adresse / Description" value={adresse} onChange={setAdresse} placeholder="Ex: Face a la mairie, kiosque N 3..." />
          <GpsWidget gps={gps} loading={gpsLoading} onCapture={captureGps} onReset={resetGps} />
        </FormCard>

        {/* Photos */}
        <div className="rounded-lg bg-white p-4 shadow-[0_1px_8px_rgba(0,0,0,0.06)]">
          <div className="mb-3.5 flex items-center gap-2 font-head text-[13px] font-semibold text-k2l-navy">
            <RiCameraLine className="text-base" /> Photos du commerce
          </div>
          <button onClick={addPhoto}
            className="w-full rounded-md border-2 border-dashed border-k2l-gray-200 p-5 text-center transition-colors hover:border-k2l-primary hover:bg-k2l-primary-light">
            <RiCameraLine className="mx-auto mb-2 text-2xl text-k2l-gray-400" />
            <div className="text-[13px] text-k2l-gray-400">Photographier le commerce</div>
            <div className="mt-1 text-[11px] text-k2l-gray-400">Devanture, enseigne, interieur</div>
          </button>
          {photos.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {photos.map((src, i) => (
                <div key={i} className="relative h-[60px] w-[60px] overflow-hidden rounded-sm border border-k2l-primary-mid bg-k2l-primary-light">
                  <img src={src} className="h-full w-full object-cover" alt="" />
                  <button onClick={() => removePhoto(i)} className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-k2l-red/85 text-white">
                    <RiCloseLine className="text-[10px]" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <button onClick={handleSubmit} disabled={submitting}
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
