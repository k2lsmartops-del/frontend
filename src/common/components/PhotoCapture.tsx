import { useState, useRef } from 'react';
import type { PhotoCategory } from '@/lib/offlineDb';
import { compressPhoto } from '@/lib/photoService';
import { uploadToCloudinary } from '@/lib/uploadService';
import { db } from '@/lib/offlineDb';

interface PhotoCaptureProps {
  category: PhotoCategory;
  label: string;
  clientUuid: string;
  onUploaded: (data: {
    url: string;
    publicId: string;
    category: PhotoCategory;
    width: number;
    height: number;
    bytes: number;
  }) => void;
  /** URL existante (pour afficher un aperçu si déjà uploadé) */
  existingUrl?: string;
}

type Status = 'idle' | 'compressing' | 'uploading' | 'done' | 'error';

/**
 * Composant réutilisable de capture photo.
 * Flux : capture → compression → stockage Blob local → upload Cloudinary → callback URL.
 */
export default function PhotoCapture({
  category,
  label,
  clientUuid,
  onUploaded,
  existingUrl,
}: PhotoCaptureProps) {
  const [status, setStatus] = useState<Status>(existingUrl ? 'done' : 'idle');
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(existingUrl || null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    try {
      // 1. Compression
      setStatus('compressing');
      setProgress(0);
      const compressed = await compressPhoto(file, category, (p) => setProgress(p));

      // 2. Preview locale
      const url = URL.createObjectURL(compressed.blob);
      setPreview(url);

      // 3. Stockage Blob local (IndexedDB)
      await db.photos.add({
        clientUuid,
        category,
        blob: compressed.blob,
        width: compressed.width,
        height: compressed.height,
        bytes: compressed.bytes,
        uploaded: false,
      });

      // 4. Upload vers Cloudinary
      setStatus('uploading');
      setProgress(50);
      const result = await uploadToCloudinary(compressed.blob, (p) => setProgress(50 + p * 0.5));

      // 5. Mettre à jour le statut local
      await db.photos
        .where('clientUuid')
        .equals(clientUuid)
        .and((p) => p.category === category)
        .modify({
          uploaded: true,
          cloudinaryUrl: result.url,
          cloudinaryPublicId: result.publicId,
        });

      setStatus('done');
      setProgress(100);
      onUploaded({
        url: result.url,
        publicId: result.publicId,
        category,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
      });
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Erreur upload');
    }
  };

  const retry = () => {
    setStatus('idle');
    setPreview(null);
    setError(null);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="rounded-lg border border-k2l-gray-200 bg-white p-3">
      <label className="mb-2 block text-xs font-medium text-k2l-gray-600">
        {label}
      </label>

      {/* Preview */}
      {preview && (
        <div className="relative mb-2 overflow-hidden rounded-md">
          <img src={preview} alt={label} className="h-32 w-full object-cover" />
          {status === 'done' && (
            <span className="absolute right-1 top-1 rounded bg-k2l-success px-1.5 py-0.5 text-[9px] font-medium text-white">
              OK
            </span>
          )}
        </div>
      )}

      {/* Barre de progression */}
      {(status === 'compressing' || status === 'uploading') && (
        <div className="mb-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-k2l-gray-100">
            <div
              className="h-full rounded-full bg-k2l-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1 text-[10px] text-k2l-gray-400">
            {status === 'compressing' ? 'Compression...' : 'Upload...'}
          </p>
        </div>
      )}

      {/* Erreur */}
      {status === 'error' && (
        <div className="mb-2">
          <p className="text-xs text-k2l-red">{error}</p>
          <button
            type="button"
            onClick={retry}
            className="mt-1 text-xs font-medium text-k2l-primary"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Input fichier */}
      {(status === 'idle' || status === 'done') && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-k2l-gray-200 py-2.5 text-xs font-medium text-k2l-gray-400 transition-colors active:bg-k2l-gray-100"
        >
          {status === 'done' ? 'Reprendre la photo' : 'Prendre la photo'}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}
