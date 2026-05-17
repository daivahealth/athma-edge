export interface BcpUserRole {
  id: number;
  roleCode: string;
  roleName: string;
}

export interface BcpUser {
  id: number;
  username: string;
  fullName: string | null;
  email: string | null;
  isActive: boolean;
  roles: BcpUserRole[];
  createdAt: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  fullName?: string;
  email?: string;
}

export interface UpdateUserRequest {
  fullName?: string;
  email?: string;
  isActive?: boolean;
  password?: string;
}

export interface AssignRolesRequest {
  roleCodes: string[];
}

export interface AuditEntry {
  id: number;
  eventType: string;
  username: string | null;
  userRole: string | null;
  ipAddress: string | null;
  mrn: string | null;
  encounterId: string | null;
  eventTimestamp: string;
  additionalData: Record<string, any> | null;
}

export interface AuditQueryParams {
  eventType?: string;
  username?: string;
  mrn?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface AuditResponse {
  data: AuditEntry[];
  meta: { page: number; limit: number; total: number };
}
