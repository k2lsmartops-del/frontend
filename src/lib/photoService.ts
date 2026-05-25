import imageCompression from 'browser-image-compression';
import type { PhotoCategory } from './offlineDb';

/**
 * Options de compression par catégorie de photo.
 * - Pièce justificative (CNI) : haute qualité pour lisibilité + futur OCR
 * - Autres (app screen, façade, QR) : qualité standard
 */
const COMPRESSION_OPTIONS: Record<
  PhotoCategory,
  { maxSizeMB: number; maxWidthOrHeight: number; quality: number }
> = {
  ID_DOCUMENT: { maxSizeMB: 1.2, maxWidthOrHeight: 2000, quality: 0.85 },
  APP_SCREEN: { maxSizeMB: 0.6, maxWidthOrHeight: 1400, quality: 0.75 },
  STOREFRONT: { maxSizeMB: 0.6, maxWidthOrHeight: 1400, quality: 0.75 },
  QR_CODE: { maxSizeMB: 0.6, maxWidthOrHeight: 1400, quality: 0.75 },
};

export interface CompressedPhoto {
  blob: Blob;
  width: number;
  height: number;
  bytes: number;
}

/**
 * Compresse une image selon sa catégorie.
 * Utilise un web worker pour ne pas bloquer le thread principal.
 */
export async function compressPhoto(
  file: File,
  category: PhotoCategory,
  onProgress?: (progress: number) => void,
): Promise<CompressedPhoto> {
  const opts = COMPRESSION_OPTIONS[category];

  const compressed = await imageCompression(file, {
    maxSizeMB: opts.maxSizeMB,
    maxWidthOrHeight: opts.maxWidthOrHeight,
    useWebWorker: true,
    onProgress,
    initialQuality: opts.quality,
  });

  // Récupérer les dimensions de l'image compressée
  const { width, height } = await getImageDimensions(compressed);

  return {
    blob: compressed,
    width,
    height,
    bytes: compressed.size,
  };
}

/**
 * Récupère les dimensions d'une image depuis un Blob.
 */
function getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      reject(new Error('Impossible de lire les dimensions'));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}
