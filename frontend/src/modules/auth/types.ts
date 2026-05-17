export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthUser {
  id: number;
  username: string;
  fullName: string | null;
  email?: string | null;
  tenantId: string;
  roles: string[];
  isActive?: boolean;
  lastLoginAt?: string | null;
}

export interface LoginResponse {
  data: {
    user: AuthUser;
  };
}
