export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  data: {
    accessToken: string;
    user: {
      id: number;
      username: string;
      fullName: string | null;
      tenantId: string;
      roles: string[];
    };
  };
}

export interface UserProfile {
  sub: string;
  username: string;
  tenantId: string;
  roles: string[];
}
