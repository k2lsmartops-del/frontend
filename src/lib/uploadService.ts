import api from '@/common/services/api';

interface CloudinarySignature {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
  publicId?: string;
  uploadUrl: string;
}

interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  bytes: number;
}

/**
 * Demande une signature au backend puis upload le Blob directement vers Cloudinary.
 * L'API ne voit JAMAIS le binaire — uniquement du JSON.
 */
export async function uploadToCloudinary(
  blob: Blob,
  onProgress?: (percent: number) => void,
): Promise<CloudinaryUploadResult> {
  // 1. Demander la signature au backend
  const { data: sig } = await api.post<CloudinarySignature>(
    '/uploads/signature',
  );

  // 2. Construire le FormData pour Cloudinary
  const formData = new FormData();
  formData.append('file', blob);
  formData.append('api_key', sig.apiKey);
  formData.append('timestamp', String(sig.timestamp));
  formData.append('signature', sig.signature);
  formData.append('folder', sig.folder);
  if (sig.publicId) {
    formData.append('public_id', sig.publicId);
  }

  // 3. Upload direct vers Cloudinary (pas via notre API)
  const response = await fetch(sig.uploadUrl, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Cloudinary upload failed: ${response.status}`);
  }

  // Simuler la progression (fetch n'a pas d'événement progress natif)
  onProgress?.(100);

  const result = await response.json();

  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    bytes: result.bytes,
  };
}
