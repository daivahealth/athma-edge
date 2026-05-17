export interface JwtPayload {
  sub: number;
  username: string;
  tenantId: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}
