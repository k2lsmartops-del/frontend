import { RiMapPinLine, RiLoader4Line } from '@/common/icons';

interface GpsWidgetProps {
  gps: { latitude: number; longitude: number; accuracy: number } | null;
  loading: boolean;
  onCapture: () => void;
  onReset: () => void;
}

export default function GpsWidget({ gps, loading, onCapture, onReset }: GpsWidgetProps) {
  return (
    <button
      type="button"
      onClick={gps ? onReset : onCapture}
      className="flex w-full items-center gap-2.5 rounded-sm border-[1.5px] border-k2l-primary-mid bg-k2l-primary-light px-3.5 py-3 text-left transition-colors active:bg-k2l-primary-mid/50"
    >
      <RiMapPinLine className="h-5 w-5 shrink-0 text-k2l-primary-dark" />
      <div className="flex-1">
        <div className="text-xs font-medium text-k2l-primary-dark">
          {loading
            ? 'Localisation en cours...'
            : gps
              ? `${gps.latitude.toFixed(4)}, ${gps.longitude.toFixed(4)}`
              : 'Appuyer pour capturer'}
        </div>
        <div className="mt-0.5 text-[11px] text-k2l-gray-600">
          {loading
            ? 'Connexion GPS...'
            : gps
              ? `Position capturee — Precision ±${Math.round(gps.accuracy)}m`
              : 'Position GPS non capturee'}
        </div>
      </div>
      {loading ? (
        <RiLoader4Line className="h-4 w-4 animate-spin text-k2l-primary" />
      ) : gps ? (
        <RiMapPinLine className="h-4 w-4 text-k2l-primary" />
      ) : (
        <RiMapPinLine className="h-4 w-4 text-k2l-gray-400" />
      )}
    </button>
  );
}
