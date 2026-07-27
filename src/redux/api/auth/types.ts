import { Role } from '../types';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role?: Exclude<Role, 'ADMIN'>;
}

export interface AuthData extends AuthUser {
  accessToken: string;
  refreshToken: string;
}
