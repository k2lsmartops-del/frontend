export type Role = 'ADMIN' | 'COORDINATEUR' | 'SUPERVISEUR' | 'COMMERCIAL' | 'CLIENT';
export type AgentStatus = 'ACTIF' | 'SUSPENDU' | 'EN_ATTENTE' | 'DESACTIVE';
export type SubmissionType = 'PROSPECT' | 'MARCHAND';
export type SubmissionStatus = 'DRAFT' | 'SUBMITTED' | 'SUPERVISOR_APPROVED' | 'VALIDATED' | 'REJECTED_L1' | 'REJECTED_L2';
export type AppStatus = 'NOT_INSTALLED' | 'INSTALLED' | 'ACTIVATED';
export type SyncStatus = 'PENDING' | 'SYNCED' | 'FAILED';
export type Gender = 'HOMME' | 'FEMME';

export interface User {
  id: string;
  matricule: string;
  fullName: string;
  email?: string | null;
  phone: string;
  role: Role;
  status: AgentStatus;
  isActive: boolean;
  avatarUrl?: string | null;
  gender?: Gender | null;
  zoneId?: string | null;
  supervisorId?: string | null;
  zone?: { id: string; name: string } | null;
  supervisor?: { id: string; fullName: string; matricule: string } | null;
  createdAt: string;
}

export interface LoginPayload {
  identifiant: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Submission {
  id: string;
  type: SubmissionType;
  status: SubmissionStatus;
  commercialId: string;
  zoneId?: string | null;
  commune: string;
  quartier?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  gpsAccuracy?: number | null;
  gpsCapturedAt?: string | null;
  prospectFullName?: string | null;
  prospectPhone?: string | null;
  prospectGender?: string | null;
  prospectAge?: number | null;
  appStatus?: AppStatus | null;
  phoneType?: string | null;
  bankAccount?: string | null;
  observations?: string | null;
  merchantName?: string | null;
  merchantOwner?: string | null;
  merchantPhone?: string | null;
  merchantActivity?: string | null;
  merchantRccm?: string | null;
  clientUuid: string;
  syncStatus: SyncStatus;
  createdOffline: boolean;
  createdAt: string;
  submittedAt?: string | null;
  commercial?: { id: string; fullName: string; matricule: string };
}

export interface CreateSubmissionPayload {
  type: SubmissionType;
  clientUuid: string;
  commune: string;
  quartier?: string;
  addressNote?: string;
  latitude?: number;
  longitude?: number;
  gpsAccuracy?: number;
  gpsCapturedAt?: string;
  prospectFullName?: string;
  prospectPhone?: string;
  prospectGender?: string;
  prospectAge?: number;
  appStatus?: AppStatus;
  phoneType?: string;
  bankAccount?: string;
  observations?: string;
  merchantName?: string;
  merchantOwner?: string;
  merchantPhone?: string;
  merchantActivity?: string;
  merchantRccm?: string;
  createdOffline?: boolean;
  syncStatus?: SyncStatus;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
