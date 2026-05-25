import Dexie, { type EntityTable } from 'dexie';

// ── Types partagés ──

export type PhotoCategory = 'APP_SCREEN' | 'ID_DOCUMENT' | 'STOREFRONT' | 'QR_CODE';
export type SubmissionType = 'PROSPECT' | 'MARCHAND';
export type OfflineSyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export interface OfflinePhoto {
  id?: number;
  clientUuid: string;       // Lié à la soumission
  category: PhotoCategory;
  blob: Blob;               // Image compressée — jamais de base64
  cloudinaryUrl?: string;   // Rempli après upload réussi
  cloudinaryPublicId?: string;
  width?: number;
  height?: number;
  bytes?: number;
  uploaded: boolean;
}

export interface OfflineSubmission {
  id?: number;
  clientUuid: string;       // Clé d'idempotence
  type: SubmissionType;
  syncStatus: OfflineSyncStatus;
  retryCount: number;
  lastError?: string;
  createdAt: string;        // ISO string

  // Données du formulaire (JSON sérialisable)
  formData: Record<string, unknown>;
}

// ── Base Dexie ──

class AipDatabase extends Dexie {
  submissions!: EntityTable<OfflineSubmission, 'id'>;
  photos!: EntityTable<OfflinePhoto, 'id'>;

  constructor() {
    super('aip-terrain');
    this.version(1).stores({
      submissions: '++id, clientUuid, syncStatus, type, createdAt',
      photos: '++id, clientUuid, category, uploaded',
    });
  }
}

export const db = new AipDatabase();
