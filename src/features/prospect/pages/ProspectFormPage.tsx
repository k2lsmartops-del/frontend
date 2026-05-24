import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { RiArrowLeftLine, RiCameraLine, RiCloseLine, RiLoader4Line, RiUserLine, RiMapPinLine, RiSmartphoneLine } from '@/common/icons';
import FormCard from '@/common/components/FormCard';
import FormInput from '@/common/components/FormInput';
import FormSelect from '@/common/components/FormSelect';
import GpsWidget from '@/common/components/GpsWidget';
import { useGeolocation } from '@/common/hooks/useGeolocation';
import { useToastStore } from '@/common/stores/toast.store';
import { submissionService } from '@/features/submissions/services/submission.service';

const COMMUNES = ['Marcory', 'Yopougon', 'Adjame', 'Plateau', 'Cocody', 'Abobo', 'Treichville', 'Port-Bouet'];
const GENDERS = [{ value: 'HOMME', label: 'Homme' }, { value: 'FEMME', label: 'Femme' }];
const APP_STATUSES = [
  { value: 'NOT_INSTALLED', label: 'Pas installee' },
  { value: 'INSTALLED', label: 'Installee' },
  { value: 'ACTIVATED', label: 'Activee' },
];

export default function ProspectFormPage() {
  const navigate = useNavigate();
  const showToast = useToastStore((s) => s.show);
  const { gps, loading: gpsLoading, capture: captureGps, reset: resetGps } = useGeolocation();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('HOMME');
  const [age, setAge] = useState('');
  const [commune, setCommune] = useState(COMMUNES[0]);
  const [quartier, setQuartier] = useState('');
  const [phoneType, setPhoneType] = useState('');
  const [appStatus, setAppStatus] = useState('NOT_INSTALLED');
  const [bankAccount, setBankAccount] = useState('');
  const [observations, setObservations] = useState('');
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
    if (!fullName.trim()) { showToast('Nom complet obligatoire', 'error'); return; }
    if (!phone.trim()) { showToast('Telephone obligatoire', 'error'); return; }
    setSubmitting(true);
    try {
      await submissionService.create({
        type: 'PROSPECT',
        clientUuid: uuidv4(),
        commune,
        quartier: quartier || undefined,
        latitude: gps?.latitude,
        longitude: gps?.longitude,
        gpsAccuracy: gps?.accuracy,
        gpsCapturedAt: gps?.capturedAt,
        prospectFullName: fullName,
        prospectPhone: phone,
        prospectGender: gender,
        prospectAge: age ? parseInt(age) : undefined,
        appStatus: appStatus as 'NOT_INSTALLED' | 'INSTALLED' | 'ACTIVATED',
        phoneType: phoneType || undefined,
        bankAccount: bankAccount || undefined,
        observations: observations || undefined,
      });
      showToast('Prospect soumis avec succes !', 'success');
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
        <button onClick={() => showToast('Brouillon sauvegarde', 'success')} className="rounded-sm bg-white/15 px-3 py-1.5 text-xs font-medium text-white">
          Brouillon
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 space-y-3.5 p-4">
        <FormCard title="Identite du prospect" icon={RiUserLine}>
          <FormInput label="Nom complet *" value={fullName} onChange={setFullName} placeholder="Nom et prenoms" />
          <FormInput label="Telephone *" value={phone} onChange={setPhone} placeholder="07 00 00 00" type="tel" />
          <div className="grid grid-cols-2 gap-2.5">
            <FormSelect label="Genre" value={gender} onChange={setGender} options={GENDERS} />
            <FormInput label="Age" value={age} onChange={setAge} placeholder="25" type="number" />
          </div>
        </FormCard>

        <FormCard title="Localisation" icon={RiMapPinLine}>
          <FormSelect label="Commune *" value={commune} onChange={setCommune} options={COMMUNES} />
          <FormInput label="Quartier" value={quartier} onChange={setQuartier} placeholder="Ex: Remblais" />
          <GpsWidget gps={gps} loading={gpsLoading} onCapture={captureGps} onReset={resetGps} />
        </FormCard>

        <FormCard title="Application mobile" icon={RiSmartphoneLine}>
          <FormInput label="Type de telephone" value={phoneType} onChange={setPhoneType} placeholder="Ex: Samsung A15" />
          <FormSelect label="Statut appli" value={appStatus} onChange={setAppStatus} options={APP_STATUSES} />
          <FormInput label="Compte bancaire" value={bankAccount} onChange={setBankAccount} placeholder="Optionnel" />
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

        {/* Photos */}
        <div className="rounded-lg bg-white p-4 shadow-[0_1px_8px_rgba(0,0,0,0.06)]">
          <div className="mb-3.5 flex items-center gap-2 font-head text-[13px] font-semibold text-k2l-navy">
            <RiCameraLine className="text-base" /> Photos
          </div>
          <button onClick={addPhoto}
            className="w-full rounded-md border-2 border-dashed border-k2l-gray-200 p-5 text-center transition-colors hover:border-k2l-primary hover:bg-k2l-primary-light">
            <RiCameraLine className="mx-auto mb-2 text-2xl text-k2l-gray-400" />
            <div className="text-[13px] text-k2l-gray-400">Prendre une photo</div>
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
          {submitting ? <RiLoader4Line className="mx-auto animate-spin text-xl" /> : 'Soumettre le prospect'}
        </button>
        <button onClick={() => navigate('/')} className="mb-5 w-full rounded-md border-[1.5px] border-k2l-gray-200 py-3 text-[15px] font-medium text-k2l-gray-600 transition-colors hover:bg-k2l-gray-100">
          Annuler
        </button>
      </div>
    </div>
  );
}
