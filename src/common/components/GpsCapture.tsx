import { useState, useCallback, useEffect } from 'react';

export interface GpsData {
  latitude: number;
  longitude: number;
  accuracy: number;
  capturedAt: string;
}

interface GpsCaptureProps {
  onCapture: (data: GpsData) => void;
  autoCapture?: boolean;
}

/**
 * Composant de capture GPS avec affichage de la précision.
 * highAccuracy, maximumAge 0, timeout 15s.
 * Avertit si précision > 20m sans bloquer.
 */
export default function GpsCapture({ onCapture, autoCapture = true }: GpsCaptureProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [data, setData] = useState<GpsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const capture = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Géolocalisation non disponible');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const gps: GpsData = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
          capturedAt: new Date().toISOString(),
        };
        setData(gps);
        setStatus('done');
        onCapture(gps);
      },
      (err) => {
        setError(err.message || 'Erreur de géolocalisation');
        setStatus('error');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000,
      },
    );
  }, [onCapture]);

  // Géolocalisation = interaction avec une API externe (légitime dans useEffect)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (autoCapture) capture(); }, []);

  return (
    <div className="rounded-lg border border-k2l-gray-200 bg-white p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-k2l-gray-600">Position GPS</span>
        {status !== 'loading' && (
          <button
            type="button"
            onClick={capture}
            className="text-xs font-medium text-k2l-primary"
          >
            {data ? 'Rafraîchir' : 'Capturer'}
          </button>
        )}
      </div>

      {status === 'loading' && (
        <p className="mt-1.5 text-xs text-k2l-gray-400">Acquisition GPS en cours...</p>
      )}

      {status === 'done' && data && (
        <div className="mt-1.5 space-y-0.5">
          <p className="text-xs text-k2l-gray-600">
            {data.latitude.toFixed(6)}, {data.longitude.toFixed(6)}
          </p>
          <p
            className={`text-xs font-medium ${
              data.accuracy > 20 ? 'text-k2l-amber' : 'text-k2l-success'
            }`}
          >
            Précision : {data.accuracy}m
            {data.accuracy > 20 && ' ⚠️ Précision faible'}
          </p>
        </div>
      )}

      {status === 'error' && error && (
        <p className="mt-1.5 text-xs text-k2l-red">{error}</p>
      )}
    </div>
  );
}
