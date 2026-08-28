export enum UserRole {
  CENTRAL_ADMIN = 'CENTRAL_ADMIN',
  STATE_ADMIN = 'STATE_ADMIN',
  DISTRICT_AUTHORITY = 'DISTRICT_AUTHORITY',
  PROJECT_AGENCY = 'PROJECT_AGENCY',
  FIELD_OFFICER = 'FIELD_OFFICER',
  AUDITOR = 'AUDITOR',
  VIEWER = 'VIEWER',
}

export enum ProjectStatus {
  PROPOSED = 'PROPOSED',
  APPROVED = 'APPROVED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
}

export enum ParcelStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export enum StageName {
  NOTIFICATION = 'NOTIFICATION',
  AWARD = 'AWARD',
  COMPENSATION = 'COMPENSATION',
  RNR = 'RNR',
  POSSESSION = 'POSSESSION',
}

export enum StageStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  NOT_APPLICABLE = 'NOT_APPLICABLE',
}

export enum PaymentStatus {
  ASSESSED = 'ASSESSED',
  APPROVED = 'APPROVED',
  DISBURSED = 'DISBURSED',
}

export type GeoJSONGeometry = {
  type: string;
  coordinates: number[][][] | number[][][][];
};

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  agency_id?: string;
  state_scope?: string;
  district_scope?: string;
  is_active: boolean;
  created_at: string;
}

export interface Agency {
  id: string;
  name: string;
  type: string;
  state?: string;
  created_at?: string;
}

export interface Project {
  id: string;
  name: string;
  project_type: string;
  state: string;
  district: string;
  status: ProjectStatus;
  budget?: number;
  geometry?: GeoJSONGeometry;
  requiring_body_id?: string;
  implementing_agency_id?: string;
  created_by?: string;
  created_at: string;
}

export interface Stage {
  id: string;
  parcel_id: string;
  stage_name: StageName;
  status: StageStatus;
  started_at?: string;
  completed_at?: string;
  evidence_document_id?: string;
  recorded_by?: string;
}

export interface Parcel {
  id: string;
  project_id: string;
  ulpin: string;
  area_hectares: number;
  geometry?: GeoJSONGeometry;
  overall_status: ParcelStatus;
  stages?: Stage[];
  created_at: string;
}

export interface Document {
  id: string;
  related_entity_id: string;
  related_entity_type: string;
  doc_type: string;
  file_url: string;
  uploaded_by?: string;
  uploaded_at: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  actor_id?: string;
  timestamp: string;
}

export interface DashboardSummary {
  total_projects: number;
  projects_by_status: Record<string, number>;
  total_parcels: number;
  parcels_by_status: Record<string, number>;
}
