import { useState, useCallback } from 'react';

interface GpsData {
  latitude: number;
  longitude: number;
  accuracy: number;
  capturedAt: string;
}

export function useGeolocation() {
  const [gps, setGps] = useState<GpsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const capture = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Géolocalisation non supportée');
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          capturedAt: new Date().toISOString(),
        });
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }, []);

  const reset = useCallback(() => {
    setGps(null);
    setError(null);
  }, []);

  return { gps, loading, error, capture, reset };
}
